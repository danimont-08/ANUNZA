import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../services/api';
import { supabase } from '../services/supabaseClient';
import './ChatSection.css';

// AVATAR POR DEFECTO
const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23b0aac8'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/%3E%3C/svg%3E";

function formatTime(iso) {
  if (!iso) return '';
  try {
    const str = /Z$|[+-]\d{2}:\d{2}$/.test(String(iso)) ? iso : iso + 'Z';
    return new Date(str).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function ChatSection({
  user,
  bootstrapOtroUsuarioId,
  bootstrapPublicacionId,
  bootstrapConversacionId,
  onBootstrapConsumed,
}) {
  const [conversaciones, setConversaciones] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockMotivo, setBlockMotivo] = useState('');
  const [bloqueados, setBloqueados] = useState([]);
  const listEndRef = useRef(null);

  const motivosBloqueo = [
    'Acoso o intimidación',
    'Spam',
    'Publicidad masiva',
    'Comportamiento sospechoso',
    'Lenguaje ofensivo',
    'Otro'
  ];

  const scrollToBottom = () => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversaciones = useCallback(async () => {
    setError('');
    try {
      const data = await apiFetch('/chat/conversaciones');
      setConversaciones(data.conversaciones || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMensajes = useCallback(async (conversacionId) => {
    if (!conversacionId) return;
    try {
      const data = await apiFetch(`/chat/conversaciones/${conversacionId}/mensajes`);
      setMensajes(data.mensajes || []);
      setTimeout(scrollToBottom, 80);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const loadBloqueados = useCallback(async () => {
    try {
      const data = await apiFetch('/chat/bloqueos/mis-bloqueados');
      setBloqueados(data.bloqueados || []);
    } catch (e) {
      console.error('Error cargando bloqueados:', e);
    }
  }, []);

  useEffect(() => {
    loadConversaciones();
    loadBloqueados();
  }, [loadConversaciones, loadBloqueados]);

  // Abrir conversación directamente por ID (desde notificación de mensaje)
  useEffect(() => {
    if (!bootstrapConversacionId) return;
    setActiveId(bootstrapConversacionId);
    onBootstrapConsumed?.();
  }, [bootstrapConversacionId, onBootstrapConsumed]);

  // Abrir o crear conversación con un usuario específico (desde feed)
  useEffect(() => {
    if (!bootstrapOtroUsuarioId || !user?.id) return;
    if (bootstrapOtroUsuarioId === user.id) {
      onBootstrapConsumed?.();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch('/chat/conversaciones', {
          method: 'POST',
          body: JSON.stringify({ 
            otro_usuario_id: bootstrapOtroUsuarioId,
            publicacion_id: bootstrapPublicacionId || null
          }),
        });
        if (cancelled) return;
        await loadConversaciones();
        setActiveId(data.conversacion_id);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) onBootstrapConsumed?.();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bootstrapOtroUsuarioId, bootstrapPublicacionId, user?.id, loadConversaciones, onBootstrapConsumed]);

  useEffect(() => {
    if (!activeId) return;
    loadMensajes(activeId);
  }, [activeId, loadMensajes]);

  useEffect(() => {
    if (!activeId || !supabase) return;

    const channel = supabase
      .channel(`mensajes:${activeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `conversacion_id=eq.${activeId}`,
        },
        () => {
          loadMensajes(activeId);
        }
      )
      .subscribe();

    const poll = setInterval(() => loadMensajes(activeId), 5000);

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [activeId, loadMensajes]);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !activeId) return;
    setDraft('');
    try {
      const data = await apiFetch(`/chat/conversaciones/${activeId}/mensajes`, {
        method: 'POST',
        body: JSON.stringify({ contenido: text, tipo: 'texto' }),
      });
      setMensajes((m) => [...m, data.mensaje]);
    } catch (e) {
      setError(e.message);
      setDraft(text);
    }
  };

  const handleBloquear = async () => {
    if (!blockMotivo) {
      setError('Selecciona un motivo de bloqueo');
      return;
    }

    const activeConv = conversaciones.find((c) => c.id === activeId);
    if (!activeConv?.peer?.id) return;

    try {
      await apiFetch('/chat/bloqueos', {
        method: 'POST',
        body: JSON.stringify({
          conversacion_id: activeId,
          usuario_a_bloquear_id: activeConv.peer.id,
          motivo: blockMotivo,
        }),
      });
      setBlockOpen(false);
      setBlockMotivo('');
      await loadBloqueados();
      setError('Usuario bloqueado exitosamente');
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDesbloquear = async (usuarioId) => {
    try {
      await apiFetch('/chat/bloqueos/desbloquear', {
        method: 'POST',
        body: JSON.stringify({ usuario_a_desbloquear_id: usuarioId }),
      });
      await loadBloqueados();
      setError('Usuario desbloqueado');
    } catch (e) {
      setError(e.message);
    }
  };

  const activeConv = conversaciones.find((c) => c.id === activeId);
  const peer = activeConv?.peer;
  const estiaBloqueado = bloqueados.some(b => b.usuario_bloqueado === peer?.id);

  return (
    <section className="chat-section">
      <div className="chat-layout">
        <aside className="chat-sidebar">
          <div className="chat-sidebar-head">
            <h2>Mensajes</h2>
            {bloqueados.length > 0 && (
              <button
                type="button"
                className="chat-bloqueados"
                onClick={() => setBlockOpen('ver-bloqueados')}
                title={`${bloqueados.length} usuario(s) bloqueado(s)`}
              >
                🚫 {bloqueados.length}
              </button>
            )}
          </div>
          {loading && <p className="chat-muted">Cargando…</p>}
          {error && <div className="chat-error">{error}</div>}
          <ul className="chat-conv-list">
            {conversaciones.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`chat-conv-item ${c.id === activeId ? 'is-active' : ''}`}
                  onClick={() => setActiveId(c.id)}
                >
                  <img
                    src={c.peer?.foto_perfil || DEFAULT_AVATAR}
                    alt=""
                  />
                  <div className="chat-conv-text">
                    <span className="chat-conv-name">{c.peer?.nombre || 'Chat'}</span>
                    {c.publicacion_titulo && (
                      <span className="chat-conv-pub">📌 {c.publicacion_titulo}</span>
                    )}
                    <span className="chat-conv-preview">{c.ultimo_mensaje || 'Sin mensajes'}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="chat-main">
          {!activeId && (
            <div className="chat-placeholder">
              <p>Selecciona una conversación para comenzar.</p>
              <p className="chat-hint">💡 Inicia chats desde el botón "Chat" en las publicaciones.</p>
            </div>
          )}
          {activeId && (
            <>
              <header className="chat-peer-bar">
                <img
                  src={peer?.foto_perfil || DEFAULT_AVATAR}
                  alt=""
                />
                <div>
                  <strong>{peer?.nombre || 'Usuario'}</strong>
                  <div className="chat-peer-sub">En línea en ANUNZA</div>
                  {activeConv?.publicacion_titulo && (
                    <div className="chat-peer-pub">📌 {activeConv.publicacion_titulo}</div>
                  )}
                </div>
                <button
                  type="button"
                  className="chat-block-btn"
                  onClick={() => setBlockOpen(true)}
                  title="Bloquear usuario"
                >
                  🚫
                </button>
              </header>
              <div className="chat-messages">
                {mensajes.map((m) => {
                  const mine = m.remitente_id === user?.id;
                  return (
                    <div
                      key={m.id}
                      className={`chat-bubble-row ${mine ? 'is-mine' : 'is-theirs'}`}
                    >
                      <div className={`chat-bubble ${mine ? 'mine' : 'theirs'}`}>
                        {!mine && (
                          <span className="chat-bubble-author">{m.remitente_nombre}</span>
                        )}
                        <p>{m.contenido}</p>
                        <time>{formatTime(m.created_at)}</time>
                      </div>
                    </div>
                  );
                })}
                <div ref={listEndRef} />
              </div>
              <footer className="chat-compose">
                <input
                  type="text"
                  placeholder="Escribe un mensaje…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  disabled={estiaBloqueado}
                />
                <button type="button" onClick={send} disabled={estiaBloqueado}>
                  Enviar
                </button>
              </footer>
            </>
          )}
        </div>
      </div>

      {blockOpen && blockOpen === 'ver-bloqueados' && (
        <div className="chat-modal-backdrop" role="presentation" onClick={() => setBlockOpen(false)}>
          <div className="chat-modal" role="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Usuarios Bloqueados</h3>
            <ul className="bloqueados-list">
              {bloqueados.map((b) => (
                <li key={b.usuario_bloqueado} className="bloqueado-item">
                  <div>
                    <strong>{b.nombre}</strong>
                    <p>{b.motivo}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDesbloquear(b.usuario_bloqueado)}
                  >
                    Desbloquear
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="chat-modal-cerrar" onClick={() => setBlockOpen(false)}>Cerrar</button>
          </div>
        </div>
      )}

      {blockOpen && blockOpen !== 'ver-bloqueados' && (
        <div className="chat-modal-backdrop" role="presentation" onClick={() => setBlockOpen(false)}>
          <div className="chat-modal" role="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Bloquear Usuario</h3>
            <p>¿Estás seguro de que deseas bloquear a <strong>{peer?.nombre}</strong>?</p>
            <p className="chat-muted">No podrán contactarte ni verá tu actividad.</p>
            
            <select value={blockMotivo} onChange={(e) => setBlockMotivo(e.target.value)}>
              <option value="">— Selecciona un motivo —</option>
              {motivosBloqueo.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <div className="chat-modal-actions">
              <button type="button" onClick={() => setBlockOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="primary danger"
                onClick={handleBloquear}
                disabled={!blockMotivo}
              >
                Bloquear
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
