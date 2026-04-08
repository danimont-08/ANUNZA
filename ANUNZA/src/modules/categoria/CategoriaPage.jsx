import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function CategoriaPage() {
  const { nombre } = useParams();
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:3000/api/buscar?trabajo=${nombre}`)
      .then(res => res.json())
      .then(data => setDatos(data));
  }, [nombre]);

  return (
    <div>
      <h2>{nombre}</h2>

      <button>Filtros</button>

      <ul>
        {datos.map(d => (
          <li key={d.id}>
            {d.titulo} - {d.ciudad}
          </li>
        ))}
      </ul>
    </div>
  );
}