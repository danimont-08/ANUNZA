import { useState, useEffect } from "react";
import { buscarServicios } from "../services/busquedaService";

export function useBusqueda() {
  const [trabajo, setTrabajo] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setCargando(true);

      const data = await buscarServicios(trabajo, ubicacion);
      setResultados(data);

      setCargando(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [trabajo, ubicacion]);

  return {
    trabajo,
    setTrabajo,
    ubicacion,
    setUbicacion,
    resultados,
    cargando
  };
}