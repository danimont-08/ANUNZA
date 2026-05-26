import React from 'react';
import { IconStar } from './icons';
import './ServicioCard.css';

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0
});

/**
 * ServicioCard - Tarjeta individual que muestra un servicio con precio y calificación.
 */
const ServicioCard = ({ servicio }) => {
  return (
    <article className="servicio-card">
      <img src={servicio.imagen} alt={servicio.titulo} className="servicio-img" />
      <div className="servicio-body">
        <div className="servicio-header">
          <h3>{servicio.titulo}</h3>
          <span className="servicio-price">{currencyFormatter.format(servicio.precio)}</span>
        </div>
        <p className="servicio-description">{servicio.descripcion}</p>
        <div className="servicio-meta">
          <span>{servicio.categoria}</span>
          <span>{servicio.ciudad}</span>
        </div>
        <div className="servicio-rating">
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              className={index < Math.round(servicio.calificacion) ? 'star filled' : 'star'}
            >
              <IconStar size={14}/>
            </span>
          ))}
          <span className="rating-value">{servicio.calificacion.toFixed(1)}</span>
        </div>
      </div>
    </article>
  );
};

export default ServicioCard;
