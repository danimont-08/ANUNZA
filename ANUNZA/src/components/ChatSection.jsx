import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../services/api';
import { supabase } from '../services/supabaseClient';
import './ChatSection.css';

function formatTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function ChatSection({ user, bootstrapOtroUsuarioId, onBootstrapConsumed }) {
  const [conversaciones, setConversaciones] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [pickUser, setPickUser] = useState('');
  const [reportingMensaje, setReportingMensaje] = useState(null);
  const [reportMotivo, setReportMotivo] = useState('Contenido inapropiado');
  const [reportDetalles, setReportDetalles] = useState('');
  const listEndRef = useRef(null);

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

  useEffect(() => {
    loadConversaciones();
  }, [loadConversaciones]);

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
          body: JSON.stringify({ otro_usuario_id: bootstrapOtroUsuarioId }),
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
  }, [bootstrapOtroUsuarioId, user?.id, loadConversaciones, onBootstrapConsumed]);

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

  const loadUsers = async () => {
    try {
      const data = await apiFetch('/users');
      const list = (data.users || []).filter((u) => u.id !== user?.id);
      setUsers(list);
    } catch (e) {
      setError(e.message);
    }
  };

  const startNewChat = async () => {
    if (!pickUser) return;
    try {
      const data = await apiFetch('/chat/conversaciones', {
        method: 'POST',
        body: JSON.stringify({ otro_usuario_id: pickUser }),
      });
      setNewChatOpen(false);
      setPickUser('');
      await loadConversaciones();
      setActiveId(data.conversacion_id);
    } catch (e) {
      setError(e.message);
    }
  };

  const sendReporteMensaje = async () => {
    if (!reportingMensaje || !reportMotivo) return;
    try {
      await apiFetch('/reportes', {
        method: 'POST',
        body: JSON.stringify({ tipo: 'mensaje', objeto_id: reportingMensaje.id, motivo: reportMotivo, detalles: reportDetalles }),
      });
      setReportingMensaje(null);
      setReportDetalles('');
    } catch (e) {
      setError(e.message);
    }
  };

  const activeConv = conversaciones.find((c) => c.id === activeId);
  const peer = activeConv?.peer;

  return (
    <section className="chat-section">
      <div className="chat-layout">
        <aside className="chat-sidebar">
          <div className="chat-sidebar-head">
            <h2>Mensajes</h2>
            <button
              type="button"
              className="chat-new"
              onClick={() => {
                setNewChatOpen(true);
                loadUsers();
              }}
            >
              Nuevo chat
            </button>
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
                    src={
                      c.peer?.foto_perfil ||
                      'https://api.dicebear.com/7.x/avataaars/svg?seed=chat'
                    }
                    alt=""
                  />
                  <div className="chat-conv-text">
                    <span className="chat-conv-name">{c.peer?.nombre || 'Chat'}</span>
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
              <p>Selecciona una conversación o inicia una nueva.</p>
            </div>
          )}
          {activeId && (
            <>
              <header className="chat-peer-bar">
                <img
                  src={
                    peer?.foto_perfil ||
                    'https://api.dicebear.com/7.x/avataaars/svg?seed=peer'
                  }
                  alt=""
                />
                <div>
                  <strong>{peer?.nombre || 'Usuario'}</strong>
                  <div className="chat-peer-sub">En línea en ANUNZA</div>
                </div>
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
                      {!mine && (
                        <button
                          type="button"
                          title="Reportar mensaje"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#aaa', alignSelf: 'center', marginLeft: '4px', padding: '0 4px' }}
                          onClick={() => { setReportingMensaje(m); setReportMotivo('Contenido inapropiado'); setReportDetalles(''); }}
                        >
                          ⚑
                        </button>
                      )}
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
                />
                <button type="button" onClick={send}>
                  Enviar
                </button>
              </footer>
            </>
          )}
        </div>
      </div>

      {newChatOpen && (
        <div className="chat-modal-backdrop" role="presentation" onClick={() => setNewChatOpen(false)}>
          <div className="chat-modal" role="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Nuevo chat</h3>
            <p className="chat-muted">Elige un usuario de la red.</p>
            <select value={pickUser} onChange={(e) => setPickUser(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} ({u.correo})
                </option>
              ))}
            </select>
            <div className="chat-modal-actions">
              <button type="button" onClick={() => setNewChatOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="primary" onClick={startNewChat} disabled={!pickUser}>
                Abrir chat
              </button>
            </div>
          </div>
        </div>
      )}

      {reportingMensaje && (
        <div className="chat-modal-backdrop" role="presentation" onClick={() => setReportingMensaje(null)}>
          <div className="chat-modal" role="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Reportar mensaje</h3>
            <p className="chat-muted">Selecciona el motivo del reporte.</p>
            <select value={reportMotivo} onChange={(e) => setReportMotivo(e.target.value)}>
              <option>Contenido inapropiado</option>
              <option>Spam o publicidad</option>
              <option>Información falsa</option>
              <option>Acoso o amenazas</option>
              <option>Otro</option>
            </select>
            <textarea
              rows={3}
              placeholder="Detalles adicionales (opcional)…"
              value={reportDetalles}
              onChange={(e) => setReportDetalles(e.target.value)}
              style={{ width: '100%', borderRadius: '8px', border: '1px solid #ccc', padding: '0.5rem', marginBottom: '0.5rem', fontFamily: 'inherit', resize: 'vertical' }}
            />
            <div className="chat-modal-actions">
              <button type="button" onClick={() => setReportingMensaje(null)}>
                Cancelar
              </button>
              <button type="button" className="primary" onClick={sendReporteMensaje} disabled={!reportMotivo}>
                Enviar reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
