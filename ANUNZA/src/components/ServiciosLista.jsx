import React from 'react';
import './ServiciosLista.css';

/**
 * ServiciosLista - Renderiza las tarjetas de servicios filtrados
 */
const ServiciosLista = ({ servicios }) => {
  const renderStars = (rating) => {
    const filledStars = Math.round(rating);
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index} className={index < filledStars ? 'star filled' : 'star'}>
        ★
      </span>
    ));
  };

  if (servicios.length === 0) {
    return <p className="no-results">No hay servicios que coincidan con los filtros.</p>;
  }

  return (
    <div className="servicios-lista">
      {servicios.map((servicio) => (
        <article key={servicio.id} className="servicio-card">
          <img src={servicio.imagen} alt={servicio.titulo} className="servicio-img" />
          <div className="servicio-body">
            <div className="servicio-header">
              <h3>{servicio.titulo}</h3>
              <span className="servicio-price">${servicio.precio}</span>
            </div>
            <p className="servicio-description">{servicio.descripcion}</p>
            <div className="servicio-meta">
              <span>{servicio.categoria}</span>
              <span>{servicio.ciudad}</span>
            </div>
            <div className="servicio-rating">
              {renderStars(servicio.calificacion)}
              <span>{servicio.calificacion.toFixed(1)}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default ServiciosLista;
