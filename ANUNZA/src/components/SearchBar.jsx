import React from 'react';
import './SearchBar.css';

/**
 * SearchBar - Componente independiente para la barra de búsqueda
 * Preparado para integrar la lógica de búsqueda desarrollada por otro miembro del equipo
 */
const SearchBar = ({ placeholder = "Buscar anuncios, productos o servicios...", onSearch }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const query = e.target.search.value;
    if (onSearch) {
      onSearch(query);
    }
    // Aquí se integrará la lógica de búsqueda
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        name="search"
        placeholder={placeholder}
        className="search-input"
      />
      <button type="submit" className="search-button">
        Buscar
      </button>
    </form>
  );
};

export default SearchBar;