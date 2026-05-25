import React, { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { fetchAdminUsers, patchUserEstado } from '../../models/adminModel';
import { UserProfilePanel } from '../../components/admin/UserProfilePanel';

function Badge({ estado }) {
  const cls = `admin-badge admin-badge--${estado || 'activo'}`;
  return <span className={cls}>{estado || 'activo'}</span>;
}

export function AdminUsers() {
  const ctx = useOutletContext();
  const pc = ctx?.panelConfig ?? {};
  const apiFetchUsers   = pc.fetchUsers    ?? fetchAdminUsers;
  const apiSuspender    = pc.suspenderUser ?? ((id) => patchUserEstado(id, 'suspendido'));
  const apiReactivar    = pc.reactivarUser ?? ((id) => patchUserEstado(id, 'activo'));
  const puedeGestionarMods = pc.puedeGestionarMods ?? true;

  const [users, setUsers] = useState([]);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [profileUserId, setProfileUserId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetchUsers({
        estado: estadoFilter || undefined,
        q: search.trim() || undefined,
      });
      setUsers(data.users ?? data.usuarios ?? []);
    } catch (e) {
      setError(e.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [apiFetchUsers, estadoFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleEstado = async (userId, nuevoEstado) => {
    const msg = nuevoEstado === 'suspendido' ? '¿Suspender esta cuenta?' : '¿Reactivar esta cuenta?';
    if (!window.confirm(msg)) return;
    setActionId(userId);
    try {
      if (nuevoEstado === 'suspendido') await apiSuspender(userId);
      else await apiReactivar(userId);
      await load();
    } catch (e) {
      setError(e.message || 'Error al actualizar usuario');
    } finally {
      setActionId(null);
    }
  };

  const canActOn = (u) => {
    if (u.rol === 'admin') return false;
    if (!puedeGestionarMods && u.rol === 'moderador') return false;
    return true;
  };

  return (
    <>
      <h1 className="admin-section-title">Gestión de usuarios</h1>
      {error && <p className="admin-error">{error}</p>}

      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Buscar por nombre o correo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="suspendido">Suspendidos</option>
        </select>
        <button type="button" className="admin-btn admin-btn--primary" onClick={load}>
          Actualizar
        </button>
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <p className="admin-empty">Cargando…</p>
        ) : users.length === 0 ? (
          <p className="admin-empty">No hay usuarios que coincidan.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <button
                      type="button"
                      className="admin-link-btn"
                      onClick={() => setProfileUserId(u.id)}
                      title="Ver perfil"
                    >
                      {u.nombre}
                    </button>
                  </td>
                  <td>{u.correo}</td>
                  <td>{u.rol || 'usuario'}</td>
                  <td><Badge estado={u.estado} /></td>
                  <td>
                    {u.created_at
                      ? new Date(
                          /Z$|[+-]\d{2}:\d{2}$/.test(u.created_at) ? u.created_at : u.created_at + 'Z'
                        ).toLocaleDateString()
                      : '—'}
                  </td>
                  <td>
                    <div className="admin-actions">
                      {canActOn(u) ? (
                        u.estado === 'suspendido' ? (
                          <button
                            type="button"
                            disabled={actionId === u.id}
                            onClick={() => handleEstado(u.id, 'activo')}
                          >
                            Reactivar
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="danger"
                            disabled={actionId === u.id}
                            onClick={() => handleEstado(u.id, 'suspendido')}
                          >
                            Suspender
                          </button>
                        )
                      ) : (
                        <span style={{ color: '#7a6f96', fontSize: '0.8rem' }}>
                          {u.rol === 'admin' ? 'Admin' : 'Moderador'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {profileUserId && (
        <UserProfilePanel
          userId={profileUserId}
          canActOn={true}
          onClose={() => { setProfileUserId(null); load(); }}
        />
      )}
    </>
  );
}
