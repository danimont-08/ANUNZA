import { useEffect, useState } from "react";
import CategoriaCard from "./CategoriaCard";
import { useNavigate } from "react-router-dom";
import "./Busqueda.css";

export default function Busqueda() {
  const [categorias, setCategorias] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3000/api/categorias")
      .then(res => res.json())
      .then(data => setCategorias(data));
  }, []);

  const seleccionarCategoria = (categoria) => {
    navigate(`/categoria/${categoria.nombre}`);
  };

  return (
    <div className="busqueda-container">
      <h2>¿Qué trabajo buscas?</h2>

      <div className="grid-categorias">
        {categorias.map(cat => (
          <CategoriaCard
            key={cat.id}
            categoria={cat}
            onClick={seleccionarCategoria}
          />
        ))}
      </div>
    </div>
  );
}