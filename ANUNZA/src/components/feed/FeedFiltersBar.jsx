import React from 'react';
import './FeedFiltersBar.css';

export function FeedFiltersBar({ categorias, categoriaId, ciudad, onChange, onClear }) {
  return (
    <div className="ffb-bar">
      <div className="ffb-field">
        <label htmlFor="ffb-cat">Categoría</label>
        <select
          id="ffb-cat"
          value={categoriaId}
          onChange={(e) => onChange({ categoria_id: e.target.value })}
        >
          <option value="">Todas</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="ffb-field">
        <label htmlFor="ffb-city">Ubicación (ciudad)</label>
        <input
          id="ffb-city"
          type="text"
          placeholder="Ej. Bogotá"
          value={ciudad}
          onChange={(e) => onChange({ ciudad: e.target.value })}
        />
      </div>
      <button type="button" className="ffb-clear" onClick={onClear}>
        Limpiar filtros
      </button>
    </div>
  );
}
