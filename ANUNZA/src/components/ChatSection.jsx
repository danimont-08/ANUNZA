import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../services/api';
import { supabase } from '../services/supabaseClient';
import './ChatSection.css';

// Avatar por defecto: silueta de persona (sin dependencia externa)
const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23b0aac8'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/%3E%3C/svg%3E";

function formatTime(iso) {
  if (!iso) return '';
  try {
    // Los timestamps de PostgreSQL 'without time zone' llegan sin sufijo Z.
    // Forzamos la interpretación UTC para que toLocaleTimeString use la zona local del navegador.
    const str = /Z$|[+-]\d{2}:\d{2}$/.test(String(iso)) ? iso : iso + 'Z';
    return new Date(str).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
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
      const data = await apiFetch('/chat/usuarios');
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
                    src={c.peer?.foto_perfil || DEFAULT_AVATAR}
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
                  src={peer?.foto_perfil || DEFAULT_AVATAR}
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
    </section>
  );
}
