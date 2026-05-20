import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import './FiltrosServicios.css';

/**
 * FiltrosServicios - Panel de filtros para la lista de servicios
 * Recibe los valores actuales y una función para actualizar los filtros.
 */
const FiltrosServicios = ({ filtros, onChange }) => {
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);

  useEffect(() => {
    const loadCategorias = async () => {
      try {
        const data = await apiFetch('/feed/categorias');
        setCategorias(data.categorias || []);
      } catch (error) {
        console.error('Error cargando categorías:', error);
      }
    };
    loadCategorias();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onChange({ ...filtros, [name]: value });
  };

  const handleNumberChange = (event) => {
    const { name, value } = event.target;
    onChange({ ...filtros, [name]: value === '' ? '' : Number(value) });
  };

  const handleCategoriaChange = (event) => {
    const { value } = event.target;
    const categoriaId = value ? Number(value) : '';
    
    // OBTENER SUBCATEGORÍAS DE LA CATEGORÍA SELECCIONADA
    const categoria = categorias.find(c => c.id === Number(value));
    const subs = categoria?.subcategorias || [];
    setSubcategorias(subs);
    
    // RESETEAR SUBCATEGORÍA AL CAMBIAR DE CATEGORÍA
    onChange({ ...filtros, categoria: categoriaId, subcategoria: '' });
  };

  const handleSubcategoriaChange = (event) => {
    const { value } = event.target;
    onChange({ ...filtros, subcategoria: value === '' ? '' : Number(value) });
  };

  return (
    <section className="filtros-servicios">
      <h2>Filtrar servicios</h2>

      <div className="filtro-group">
        <label htmlFor="categoria">Categoría</label>
        <select
          id="categoria"
          name="categoria"
          value={filtros.categoria || ''}
          onChange={handleCategoriaChange}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </select>
      </div>

      {subcategorias.length > 0 && (
        <div className="filtro-group">
          <label htmlFor="subcategoria">Subcategoría</label>
          <select
            id="subcategoria"
            name="subcategoria"
            value={filtros.subcategoria || ''}
            onChange={handleSubcategoriaChange}
          >
            <option value="">Todas las subcategorías</option>
            {subcategorias.map((subcategoria) => (
              <option key={subcategoria.id} value={subcategoria.id}>
                {subcategoria.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

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
