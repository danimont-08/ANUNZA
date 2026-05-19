import React, { useCallback, useEffect, useState } from 'react';
import { fetchAdminUsers, patchUserEstado } from '../../models/adminModel';

function Badge({ estado }) {
  const cls = `admin-badge admin-badge--${estado || 'activo'}`;
  return <span className={cls}>{estado || 'activo'}</span>;
}

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminUsers({
        estado: estadoFilter || undefined,
        q: search.trim() || undefined,
      });
      setUsers(data.users || []);
    } catch (e) {
      setError(e.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [estadoFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleEstado = async (userId, nuevoEstado) => {
    const msg =
      nuevoEstado === 'suspendido'
        ? '¿Suspender esta cuenta?'
        : '¿Reactivar esta cuenta?';
    if (!window.confirm(msg)) return;

    setActionId(userId);
    try {
      await patchUserEstado(userId, nuevoEstado);
      await load();
    } catch (e) {
      setError(e.message || 'Error al actualizar usuario');
    } finally {
      setActionId(null);
    }
  };

  return (
    <>
      <h1 className="admin-section-title">Gestión de usuarios</h1>
      {error && <p className="admin-error">{error}</p>}

      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Buscar por nombre, correo o cédula…"
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
                <th>Cédula</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.nombre}</td>
                  <td>{u.correo}</td>
                  <td>{u.cedula}</td>
                  <td>{u.rol || 'usuario'}</td>
                  <td>
                    <Badge estado={u.estado} />
                  </td>
                  <td>
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString('es-CO')
                      : '—'}
                  </td>
                  <td>
                    <div className="admin-actions">
                      {u.rol !== 'admin' &&
                        (u.estado === 'suspendido' ? (
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
                        ))}
                      {u.rol === 'admin' && (
                        <span style={{ color: '#7a6f96', fontSize: '0.8rem' }}>Admin</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
