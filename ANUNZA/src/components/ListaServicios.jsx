import React from 'react';
import ServicioCard from './ServicioCard';
import './ListaServicios.css';

/**
 * ListaServicios
 */
const ListaServicios = ({ servicios }) => {
  if (servicios.length === 0) {
    return <p className="no-results">No hay servicios que coincidan con los filtros.</p>;
  }

  return (
    <div className="lista-servicios">
      {servicios.map((servicio) => (
        <ServicioCard key={servicio.id} servicio={servicio} />
      ))}
    </div>
  );
};

export default ListaServicios;
