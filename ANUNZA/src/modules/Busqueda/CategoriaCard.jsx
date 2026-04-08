export default function CategoriaCard({ categoria, onClick }) {
  return (
    <div className="categoria-card" onClick={() => onClick(categoria)}>
      <img src={`/imagenes/${categoria.imagen}`} alt={categoria.nombre} />
      <p>{categoria.nombre}</p>
    </div>
  );
}