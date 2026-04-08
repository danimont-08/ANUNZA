import React from 'react';
import './FiltrosServicios.css';

/**
 * FiltrosServicios - Panel de filtros para la lista de servicios
 * Recibe los valores actuales y una función para actualizar los filtros.
 */
const FiltrosServicios = ({ filtros, onChange }) => {
  const categorias = ['Mascotas', 'Hogar', 'Tecnología', 'Educación', 'Transporte', 'Otros'];

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onChange({ ...filtros, [name]: value });
  };

  const handleNumberChange = (event) => {
    const { name, value } = event.target;
    onChange({ ...filtros, [name]: value === '' ? '' : Number(value) });
  };

  return (
    <section className="filtros-servicios">
      <h2>Filtrar servicios</h2>

      <div className="filtro-group">
        <label htmlFor="categoria">Categoría</label>
        <select
          id="categoria"
          name="categoria"
          value={filtros.categoria}
          onChange={handleInputChange}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((categoria) => (
            <option key={categoria} value={categoria}>
              {categoria}
            </option>
          ))}
        </select>
      </div>

      <div className="filtro-group">
        <label htmlFor="ciudad">Ciudad</label>
        <input
          id="ciudad"
          name="ciudad"
          type="text"
          placeholder="Ej. Cali, Bogotá, Medellín"
          value={filtros.ciudad}
          onChange={handleInputChange}
        />
      </div>

      <div className="filtro-group rango-precios">
        <div>
          <label htmlFor="precioMin">Precio mínimo</label>
          <input
            id="precioMin"
            name="precioMin"
            type="number"
            min="0"
            value={filtros.precioMin}
            onChange={handleNumberChange}
            placeholder="Ej. 10000"
          />
          <div className="rango-values">${filtros.precioMin || 0}</div>
        </div>

        <div>
          <label htmlFor="precioMax">Precio máximo</label>
          <input
            id="precioMax"
            name="precioMax"
            type="number"
            min="0"
            value={filtros.precioMax}
            onChange={handleNumberChange}
            placeholder="Sin límite"
          />
          <div className="rango-values">{filtros.precioMax ? `$${filtros.precioMax}` : 'Sin límite'}</div>
        </div>
      </div>

      <div className="filtro-group rating-group">
        <label>Calificación mínima</label>
        <div className="rating-buttons">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className={value <= filtros.calificacionMin ? 'active' : ''}
              onClick={() => onChange({ ...filtros, calificacionMin: value })}
            >
              {value} ★
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FiltrosServicios;
