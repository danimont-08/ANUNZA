import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, getStoredToken } from '../services/api';
import { UserPublicProfileModal } from './UserPublicProfileModal';
import { connectSocket, getSocket, disconnectSocket } from '../services/socket';
import { ReportModal } from './feed/ReportModal';
import { IconFlag, IconUserX, IconPin, IconInfo, IconTrash, IconDots } from './icons';
import { DEFAULT_AVATAR } from '../utils/constants';
import { formatTime } from '../utils/format';
import './ChatSection.css';

const isKeyboardOpen = () => document.body.classList.contains('keyboard-open');

export function ChatSection({
  user,
  bootstrapOtroUsuarioId,
  bootstrapPublicacionId,
  bootstrapPublicacionTitulo,
  bootstrapConversacionId,
  onBootstrapConsumed,
}) {
  const navigate = useNavigate();
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingText, setEditingText]   = useState('');
  const [msgMenuId, setMsgMenuId]       = useState(null);
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
  const [reportMsg, setReportMsg] = useState(null);
  const [reportUser, setReportUser] = useState(false);
  const [profileUserId, setProfileUserId] = useState(null);

  const motivosBloqueo = [
    'Acoso o intimidación',
    'Spam',
    'Publicidad masiva',
    'Comportamiento sospechoso',
    'Lenguaje ofensivo',
    'Otro'
  ];

  // Scroll al final solo si el teclado NO está abierto (evita window scroll en Android)
  const scrollToBottom = () => {
    if (isKeyboardOpen()) return;
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const cleanupKeyboard = useCallback(() => {
    document.body.classList.remove('keyboard-open');
  }, []);

  // Limpiar si el usuario vuelve atrás sin cerrar el teclado
  useEffect(() => {
    if (!activeId) cleanupKeyboard();
  }, [activeId, cleanupKeyboard]);

  // Limpiar al desmontar el componente
  useEffect(() => () => cleanupKeyboard(), [cleanupKeyboard]);

  const handleComposeFocus = () => {
    document.body.classList.add('keyboard-open');
  };

  const handleComposeBlur = () => {
    document.body.classList.remove('keyboard-open');
  };

  const loadConversaciones = useCallback(async () => {
    setError('');
    try {
      const data = await apiFetch('/chat/conversaciones');
      // Dedup por peer: si hay dos conversaciones con el mismo usuario, queda la más reciente
      const seen = new Set();
      const unique = (data.conversaciones || []).filter((c) => {
        const key = c.peer?.id;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setConversaciones(unique);
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
      // Solo hacer scroll automático si el teclado NO está activo
      // (si está activo, scrollIntoView mueve el window en Android)
      if (!isKeyboardOpen()) setTimeout(scrollToBottom, 80);
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

        // Enviar mensaje de referencia cuando se llega desde una publicación
        if (bootstrapPublicacionTitulo) {
          const autoMsg = `Hola, me interesa tu publicación "${bootstrapPublicacionTitulo}". ¿Podrías darme más información?`;
          try {
            await apiFetch(`/chat/conversaciones/${data.conversacion_id}/mensajes`, {
              method: 'POST',
              body: JSON.stringify({ contenido: autoMsg, tipo: 'texto' }),
            });
          } catch { /* silencioso si falla */ }
        }

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
  }, [bootstrapOtroUsuarioId, bootstrapPublicacionId, bootstrapPublicacionTitulo, user?.id, loadConversaciones, onBootstrapConsumed]);

  useEffect(() => {
    if (!activeId) return;
    loadMensajes(activeId);
  }, [activeId, loadMensajes]);

  // Conectar socket al montar, desconectar al desmontar
  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    connectSocket(token);
    return () => disconnectSocket();
  }, []);

  // Unirse al room de la conversación activa y escuchar mensajes nuevos
  useEffect(() => {
    if (!activeId) return;
    const socket = getSocket();
    if (!socket) return;

    const joinRoom = () => socket.emit('join_conversation', activeId);
    if (socket.connected) joinRoom();
    socket.off('connect', joinRoom);
    socket.on('connect', joinRoom);

    const onNewMessage = ({ mensaje }) => {
      setConversaciones((prev) =>
        prev.map((c) =>
          String(c.id) === String(mensaje.conversacion_id)
            ? { ...c, ultimo_mensaje: mensaje.contenido }
            : c
        )
      );
      if (String(mensaje.conversacion_id) === String(activeId)) {
        setMensajes((prev) =>
          prev.some((m) => String(m.id) === String(mensaje.id)) ? prev : [...prev, mensaje]
        );
      }
    };

    socket.off('new_message');
    socket.on('new_message', onNewMessage);

    const onMsgEdited = ({ mensajeId, contenido }) => {
      setMensajes((prev) => prev.map((m) =>
        String(m.id) === String(mensajeId) ? { ...m, contenido, editado: true } : m
      ));
    };
    const onMsgDeleted = ({ mensajeId }) => {
      setMensajes((prev) => prev.map((m) =>
        String(m.id) === String(mensajeId) ? { ...m, tipo: 'eliminado', contenido: null } : m
      ));
    };
    socket.off('message_edited'); socket.on('message_edited', onMsgEdited);
    socket.off('message_deleted'); socket.on('message_deleted', onMsgDeleted);

    return () => {
      socket.emit('leave_conversation', activeId);
      socket.off('connect', joinRoom);
      socket.off('new_message', onNewMessage);
      socket.off('message_edited', onMsgEdited);
      socket.off('message_deleted', onMsgDeleted);
    };
  }, [activeId]);

  // Polling de respaldo: refresca mensajes cada 8s mientras se ve una conversación
  useEffect(() => {
    if (!activeId) return;
    const id = setInterval(() => loadMensajes(activeId), 8_000);
    return () => clearInterval(id);
  }, [activeId, loadMensajes]);

  useEffect(() => {
    // scrollToBottom ya verifica internamente si el teclado está abierto
    scrollToBottom();
  }, [mensajes]);

  // Cerrar menú de mensaje al click fuera (ignora clicks dentro del propio menú)
  useEffect(() => {
    if (!msgMenuId) return;
    const handler = (e) => {
      if (e.target.closest('.chat-msg-menu-wrap')) return;
      setMsgMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [msgMenuId]);

  const startEdit = (msg) => {
    setEditingMsgId(msg.id);
    setEditingText(msg.contenido || '');
  };
  const cancelEdit = () => { setEditingMsgId(null); setEditingText(''); };

  const confirmEdit = async (msgId) => {
    if (!editingText.trim()) return;
    try {
      await apiFetch(`/chat/mensajes/${msgId}`, {
        method: 'PATCH',
        body: JSON.stringify({ contenido: editingText.trim() }),
      });
      setMensajes((prev) => prev.map((m) =>
        m.id === msgId ? { ...m, contenido: editingText.trim(), editado: true } : m
      ));
    } catch { /* silencioso */ }
    cancelEdit();
  };

  const confirmDelete = async (msgId) => {
    try {
      await apiFetch(`/chat/mensajes/${msgId}`, { method: 'DELETE' });
      setMensajes((prev) => prev.map((m) =>
        m.id === msgId ? { ...m, tipo: 'eliminado', contenido: null } : m
      ));
    } catch { /* silencioso */ }
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || !activeId) return;
    setDraft('');
    try {
      const data = await apiFetch(`/chat/conversaciones/${activeId}/mensajes`, {
        method: 'POST',
        body: JSON.stringify({ contenido: text, tipo: 'texto' }),
      });
      // Agregar el mensaje inmediatamente desde la respuesta HTTP
      // El socket lo recibirán los demás participantes; el dedup evita duplicados
      if (data.mensaje) {
        setMensajes((prev) =>
          prev.some((m) => m.id === data.mensaje.id) ? prev : [...prev, data.mensaje]
        );
        setConversaciones((prev) =>
          prev.map((c) =>
            c.id === activeId ? { ...c, ultimo_mensaje: data.mensaje.contenido } : c
          )
        );
      }
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
    <section className={`chat-section${activeId ? ' chat-has-active' : ''}`}>
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
                <IconUserX /> {bloqueados.length}
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
                    loading="lazy"
                  />
                  <div className="chat-conv-text">
                    <span className="chat-conv-name">{c.peer?.nombre || 'Chat'}</span>
                    {c.publicacion_titulo && (
                      <span className="chat-conv-pub"><><IconPin size={12}/> {c.publicacion_titulo}</></span>
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
              <p className="chat-hint"><><IconInfo size={14}/> Inicia chats desde el botón "Chat" en las publicaciones.</></p>
            </div>
          )}
          {activeId && (
            <>
              <header className="chat-peer-bar">
                <button
                  type="button"
                  className="chat-back-btn"
                  onClick={() => { cleanupKeyboard(); setActiveId(null); }}
                  aria-label="Volver a conversaciones"
                >
                  ←
                </button>
                <img
                  src={peer?.foto_perfil || DEFAULT_AVATAR}
                  alt=""
                  loading="lazy"
                  style={{ cursor: 'pointer' }}
                  onClick={() => peer?.id && setProfileUserId(peer.id)}
                />
                <div className="chat-peer-info">
                  <strong
                    style={{ cursor: 'pointer' }}
                    onClick={() => peer?.id && setProfileUserId(peer.id)}
                  >
                    {peer?.nombre || 'Usuario'}
                  </strong>
                  <div className="chat-peer-sub">En línea en ANUNZA</div>
                  {activeConv?.publicacion_titulo && (
                    <div className="chat-peer-pub"><><IconPin size={12}/> {activeConv.publicacion_titulo}</></div>
                  )}
                </div>
                <div className="chat-peer-actions">
                  <button
                    type="button"
                    className="chat-action-btn"
                    onClick={() => setReportUser(true)}
                    title="Reportar usuario"
                  >
                    <IconFlag />
                  </button>
                  <button
                    type="button"
                    className="chat-action-btn chat-block-btn"
                    onClick={() => setBlockOpen(true)}
                    title="Bloquear usuario"
                  >
                    <IconUserX />
                  </button>
                </div>
              </header>
              <div className="chat-messages">
                <div className="chat-messages-spacer" />
                {mensajes.map((m) => {
                  const mine = m.remitente_id === user?.id;
                  const eliminado = m.tipo === 'eliminado';
                  const isEditing = editingMsgId === m.id;
                  return (
                    <div
                      key={m.id}
                      className={`chat-bubble-row ${mine ? 'is-mine' : 'is-theirs'}`}
                    >
                      <div className={`chat-bubble ${mine ? 'mine' : 'theirs'}${eliminado ? ' eliminated' : ''}`}>
                        {!mine && !eliminado && (
                          <span className="chat-bubble-author">{m.remitente_nombre}</span>
                        )}
                        {eliminado ? (
                          <p className="chat-bubble-eliminated">Mensaje eliminado</p>
                        ) : isEditing ? (
                          <div className="chat-edit-wrap">
                            <input
                              className="chat-edit-input"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') confirmEdit(m.id);
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              autoFocus
                            />
                            <div className="chat-edit-actions">
                              <button type="button" onClick={() => confirmEdit(m.id)}>Guardar</button>
                              <button type="button" onClick={cancelEdit}>Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p>{m.contenido}</p>
                            {m.editado && <span className="chat-edited-tag">(editado)</span>}
                          </>
                        )}
                        {!isEditing && !eliminado && <time>{formatTime(m.created_at)}</time>}
                      </div>
                      {mine && !eliminado && !isEditing && (
                        <div className="chat-msg-menu-wrap">
                          <button
                            type="button"
                            className="chat-msg-dots"
                            onClick={() => setMsgMenuId(msgMenuId === m.id ? null : m.id)}
                            aria-label="Opciones"
                            aria-expanded={msgMenuId === m.id}
                          >
                            <IconDots size={14}/>
                          </button>
                          {msgMenuId === m.id && (
                            <div className="chat-msg-dropdown">
                              <button type="button" onClick={() => { startEdit(m); setMsgMenuId(null); }}>
                                Editar mensaje
                              </button>
                              <button type="button" className="danger" onClick={() => { confirmDelete(m.id); setMsgMenuId(null); }}>
                                Eliminar mensaje
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {!mine && !eliminado && (
                        <button
                          type="button"
                          className="chat-report-msg-btn"
                          title="Reportar mensaje"
                          onClick={() => setReportMsg(m)}
                        >
                          <IconFlag />
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
                  onFocus={handleComposeFocus}
                  onBlur={handleComposeBlur}
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

      {reportMsg && (
        <ReportModal
          tipo="mensaje"
          targetId={reportMsg.id}
          targetLabel={
            reportMsg.contenido.length > 60
              ? reportMsg.contenido.slice(0, 60) + '…'
              : reportMsg.contenido
          }
          onClose={() => setReportMsg(null)}
        />
      )}

      {reportUser && peer && (
        <ReportModal
          tipo="usuario"
          targetId={peer.id}
          targetLabel={peer.nombre}
          onClose={() => setReportUser(false)}
        />
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
      {profileUserId && (
        <UserPublicProfileModal
          userId={profileUserId}
          onClose={() => setProfileUserId(null)}
          onNavigateToPost={(pubId) => {
            setProfileUserId(null);
            navigate('/dashboard', { state: { openSection: 'inicio', highlightId: pubId } });
          }}
        />
      )}
    </section>
  );
}
