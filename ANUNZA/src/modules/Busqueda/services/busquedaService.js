export async function buscarServicios(trabajo, ubicacion) {
  const res = await fetch(
    `http://localhost:3000/api/buscar?trabajo=${trabajo}&ubicacion=${ubicacion}`
  );

  return res.json();
}