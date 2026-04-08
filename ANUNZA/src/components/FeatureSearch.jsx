import React from 'react';
import './FeatureSearch.css';

/**
 * FeatureSearch - Barra de búsqueda principal que actualiza el filtro de servicios.
 */
const FeatureSearch = ({ value, onSearch }) => {
  const handleChange = (event) => {
    onSearch(event.target.value);
  };

  return (
    <section className="feature-search">
      <div className="feature-search-box">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="Buscar servicios por título, descripción o categoría..."
          aria-label="Buscar servicios"
        />
      </div>
    </section>
  );
};

export default FeatureSearch;
