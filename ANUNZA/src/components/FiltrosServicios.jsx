import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import { formatCOP } from '../utils/format';
import { IconStar } from './icons';
import './FiltrosServicios.css';

const EMPTY = {
  categoria: '',
  subcategoria: '',
  ciudad: '',
  precioMin: '',
  precioMax: '',
  calificacionMin: '',
};

const FiltrosServicios = ({ onChange }) => {
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [local, setLocal] = useState(EMPTY);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    apiFetch('/feed/categorias')
      .then((data) => setCategorias(data.categorias || []))
      .catch(() => {});
  }, []);

  const set = (patch) => {
    setLocal((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const handleCategoria = (e) => {
    const value = e.target.value;
    const cat = categorias.find((c) => c.id === Number(value));
    setSubcategorias(cat?.subcategorias || []);
    set({ categoria: value ? Number(value) : '', subcategoria: '' });
  };

  const handleAplicar = () => {
    setDirty(false);
    onChange({
      ...local,
      precioMin: local.precioMin === '' ? '' : Number(local.precioMin),
      precioMax: local.precioMax === '' ? '' : Number(local.precioMax),
    });
  };

  const handleLimpiar = () => {
    setLocal(EMPTY);
    setSubcategorias([]);
    setDirty(false);
    onChange(EMPTY);
  };

  return (
    <section className="filtros-servicios">
      <h2>Filtrar servicios</h2>

      <div className="filtro-group">
        <label htmlFor="categoria">Categoría</label>
        <select
          id="categoria"
          value={local.categoria || ''}
          onChange={handleCategoria}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {subcategorias.length > 0 && (
        <div className="filtro-group">
          <label htmlFor="subcategoria">Subcategoría</label>
          <select
            id="subcategoria"
            value={local.subcategoria || ''}
            onChange={(e) => set({ subcategoria: e.target.value ? Number(e.target.value) : '' })}
          >
            <option value="">Todas las subcategorías</option>
            {subcategorias.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>
      )}

      <div className="filtro-group">
        <label htmlFor="ciudad">Ciudad</label>
        <input
          id="ciudad"
          type="text"
          placeholder="Ej. Cali, Bogotá, Medellín"
          value={local.ciudad}
          onChange={(e) => set({ ciudad: e.target.value })}
        />
      </div>

      <div className="filtro-group rango-precios">
        <div>
          <label htmlFor="precioMin">Precio mínimo</label>
          <input
            id="precioMin"
            type="number"
            min="0"
            value={local.precioMin}
            onChange={(e) => set({ precioMin: e.target.value })}
            placeholder="Ej. 10000"
          />
          {local.precioMin !== '' && (
            <div className="rango-values">{formatCOP(local.precioMin)}</div>
          )}
        </div>
        <div>
          <label htmlFor="precioMax">Precio máximo</label>
          <input
            id="precioMax"
            type="number"
            min="0"
            value={local.precioMax}
            onChange={(e) => set({ precioMax: e.target.value })}
            placeholder="Sin límite"
          />
          {local.precioMax !== '' && (
            <div className="rango-values">{formatCOP(local.precioMax)}</div>
          )}
        </div>
      </div>

      <div className="filtro-group rating-group">
        <label>Calificación mínima</label>
        <div className="rating-buttons">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              className={v <= local.calificacionMin ? 'active' : ''}
              onClick={() => set({ calificacionMin: local.calificacionMin === v ? '' : v })}
            >
              {v} <IconStar size={12}/>
            </button>
          ))}
        </div>
      </div>

      <div className="filtros-actions">
        <button
          type="button"
          className={`filtros-apply-btn${dirty ? ' has-changes' : ''}`}
          onClick={handleAplicar}
        >
          Aplicar filtros
        </button>
        <button
          type="button"
          className="filtros-clear-btn"
          onClick={handleLimpiar}
        >
          Limpiar
        </button>
      </div>
    </section>
  );
};

export default FiltrosServicios;