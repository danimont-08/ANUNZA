import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import { formatCOP } from '../utils/format';
import { IconStar, IconMapPin, IconX } from './icons';
import './FiltrosServicios.css';

const EMPTY = {
  categoria: '',
  subcategoria: '',
  ciudad: '',
  precioMin: '',
  precioMax: '',
  calificacionMin: '',
};

function countActive(f) {
  return [f.categoria, f.subcategoria, f.ciudad, f.precioMin, f.precioMax, f.calificacionMin]
    .filter(Boolean).length;
}

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

  const active = countActive(local);

  return (
    <section className="filtros">

      {/* Header */}
      <div className="filtros-head">
        <span className="filtros-head-title">
          Filtros
          {active > 0 && <span className="filtros-badge">{active}</span>}
        </span>
        {active > 0 && (
          <button type="button" className="filtros-reset" onClick={handleLimpiar}>
            <IconX size={12} /> Limpiar todo
          </button>
        )}
      </div>

      {/* Grid de filtros */}
      <div className="filtros-grid">

        {/* Categoría */}
        <div className="filtros-field">
          <label className="filtros-label" htmlFor="f-categoria">Categoría</label>
          <div className="filtros-select-wrap">
            <select id="f-categoria" className="filtros-select" value={local.categoria || ''} onChange={handleCategoria}>
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Subcategoría */}
        <div className={`filtros-field${subcategorias.length === 0 ? ' filtros-field--hidden' : ''}`}>
          <label className="filtros-label" htmlFor="f-subcat">Subcategoría</label>
          <div className="filtros-select-wrap">
            <select
              id="f-subcat"
              className="filtros-select"
              value={local.subcategoria || ''}
              onChange={(e) => set({ subcategoria: e.target.value ? Number(e.target.value) : '' })}
            >
              <option value="">Todas</option>
              {subcategorias.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Ciudad */}
        <div className="filtros-field">
          <label className="filtros-label" htmlFor="f-ciudad">Ciudad</label>
          <div className="filtros-input-wrap">
            <IconMapPin size={15} />
            <input
              id="f-ciudad"
              type="text"
              className="filtros-input"
              placeholder="Ej. Cali, Bogotá…"
              value={local.ciudad}
              onChange={(e) => set({ ciudad: e.target.value })}
            />
            {local.ciudad && (
              <button type="button" className="filtros-input-clear" onClick={() => set({ ciudad: '' })}>
                <IconX size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Precio */}
        <div className="filtros-field filtros-field--price">
          <label className="filtros-label">Precio</label>
          <div className="filtros-price-row">
            <div className="filtros-price-box">
              <span className="filtros-price-prefix">Mín</span>
              <input
                type="number"
                min="0"
                className="filtros-price-input"
                placeholder="0"
                value={local.precioMin}
                onChange={(e) => set({ precioMin: e.target.value })}
              />
            </div>
            <span className="filtros-price-sep">–</span>
            <div className="filtros-price-box">
              <span className="filtros-price-prefix">Máx</span>
              <input
                type="number"
                min="0"
                className="filtros-price-input"
                placeholder="∞"
                value={local.precioMax}
                onChange={(e) => set({ precioMax: e.target.value })}
              />
            </div>
          </div>
          {(local.precioMin || local.precioMax) && (
            <p className="filtros-price-preview">
              {local.precioMin ? formatCOP(local.precioMin) : '0'}
              {' → '}
              {local.precioMax ? formatCOP(local.precioMax) : 'sin límite'}
            </p>
          )}
        </div>

        {/* Calificación */}
        <div className="filtros-field filtros-field--full">
          <label className="filtros-label">Calificación mínima</label>
          <div className="filtros-stars">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                className={`filtros-star${v <= local.calificacionMin ? ' is-active' : ''}`}
                onClick={() => set({ calificacionMin: local.calificacionMin === v ? '' : v })}
                aria-label={`${v} estrellas`}
              >
                <IconStar size={16} />
                <span>{v}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Botón aplicar */}
      <button
        type="button"
        className={`filtros-apply${dirty ? ' is-ready' : ''}`}
        onClick={handleAplicar}
        disabled={!dirty}
      >
        {dirty ? 'Aplicar filtros' : 'Sin cambios'}
      </button>

    </section>
  );
};

export default FiltrosServicios;
