import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import FeatureSearch from '../components/FeatureSearch';
import FiltrosServicios from '../components/FiltrosServicios';
import ServiciosLista from '../components/ServiciosLista';
import './Dashboard.css';

const serviciosMock = [
  {
    id: 1,
    titulo: 'Cuidado de mascotas en casa',
    descripcion: 'Paseo, alimentación y compañía para perros y gatos.',
    categoria: 'Mascotas',
    ciudad: 'Cali',
    precio: 45000,
    calificacion: 4.7,
    imagen: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 2,
    titulo: 'Clases de programación',
    descripcion: 'Tutorías de JavaScript, React y Node.js para todos los niveles.',
    categoria: 'Educación',
    ciudad: 'Bogotá',
    precio: 120000,
    calificacion: 4.9,
    imagen: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 3,
    titulo: 'Reparación de laptops',
    descripcion: 'Soporte técnico y reparación de equipos portátiles a domicilio.',
    categoria: 'Tecnología',
    ciudad: 'Medellín',
    precio: 80000,
    calificacion: 4.3,
    imagen: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 4,
    titulo: 'Limpieza profunda de viviendas',
    descripcion: 'Servicio completo de limpieza para apartamentos y casas.',
    categoria: 'Hogar',
    ciudad: 'Cali',
    precio: 65000,
    calificacion: 4.1,
    imagen: 'https://images.unsplash.com/photo-1581579189804-25fd9a2caead?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 5,
    titulo: 'Transporte ejecutivo',
    descripcion: 'Viajes seguros en vehículo privado con conductor profesional.',
    categoria: 'Transporte',
    ciudad: 'Bogotá',
    precio: 150000,
    calificacion: 4.8,
    imagen: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 6,
    titulo: 'Diseño gráfico para redes',
    descripcion: 'Creación de piezas visuales y branding digital.',
    categoria: 'Otros',
    ciudad: 'Medellín',
    precio: 90000,
    calificacion: 4.2,
    imagen: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80'
  }
];

const normalizarTexto = (texto) =>
  (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const sinonimosBusqueda = {
  limpieza: ['aseo', 'limpiar', 'higiene'],
  aseo: ['limpieza', 'limpiar', 'higiene'],
  hogar: ['casa', 'domicilio', 'vivienda'],
  casa: ['hogar', 'vivienda', 'domicilio'],
  mascotas: ['animales', 'perros', 'gatos'],
  tecnologia: ['tecnologia', 'informatica', 'computacion', 'soporte'],
  programacion: ['codigo', 'desarrollo', 'software'],
  transporte: ['movilidad', 'traslado', 'viaje']
};

/**
 * Dashboard - Página principal del usuario en ANUNZA
 */
export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [filtros, setFiltros] = useState({
    categoria: '',
    ciudad: '',
    precioMin: 0,
    precioMax: '',
    calificacionMin: 1
  });
  const [serviciosFiltrados, setServiciosFiltrados] = useState(serviciosMock);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');
  const [profileData, setProfileData] = useState({
    nombre: user?.nombre || 'Usuario',
    foto: 'https://via.placeholder.com/120'
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (searchText) => {
    setQuery(searchText);
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = (event) => {
    event.preventDefault();
    setIsEditingProfile(false);
  };

  useEffect(() => {
    if (user?.nombre) {
      setProfileData((prev) => ({ ...prev, nombre: user.nombre }));
    }
  }, [user]);

  useEffect(() => {
    const textoBusqueda = normalizarTexto(query);
    const terminosConsulta = textoBusqueda
      ? [textoBusqueda, ...(sinonimosBusqueda[textoBusqueda] || [])]
      : [];

    const resultados = serviciosMock.filter((servicio) => {
      const textoCompleto = `${servicio.titulo} ${servicio.descripcion} ${servicio.categoria}`
        .toLowerCase();
      const textoCompletoNormalizado = normalizarTexto(textoCompleto);
      const cumpleBusqueda = terminosConsulta.length > 0
        ? terminosConsulta.some((termino) => textoCompletoNormalizado.includes(termino))
        : true;

      const cumpleCategoria = filtros.categoria
        ? servicio.categoria === filtros.categoria
        : true;

      const cumpleCiudad = filtros.ciudad.trim()
        ? servicio.ciudad.toLowerCase().includes(filtros.ciudad.trim().toLowerCase())
        : true;

      const sinTopeMaximo = filtros.precioMax === '';
      const cumplePrecioMin = servicio.precio >= filtros.precioMin;
      const cumplePrecioMax = sinTopeMaximo ? true : servicio.precio <= filtros.precioMax;
      const cumplePrecio = cumplePrecioMin && cumplePrecioMax;
      const cumpleCalificacion = servicio.calificacion >= filtros.calificacionMin;

      return cumpleBusqueda && cumpleCategoria && cumpleCiudad && cumplePrecio && cumpleCalificacion;
    });

    setServiciosFiltrados(resultados);
  }, [query, filtros]);

  const actividadReciente = [
    'Publicaste un anuncio: "Clases de guitarra"',
    'Recibiste un mensaje sobre tu anuncio de "Reparación de PC"',
    'Agregaste a favoritos: "Coche usado Toyota"'
  ];

  return (
    <div className="dashboard">
      {/* Barra superior */}
      <header className="navbar">
        <div className="navbar-content">
          <div className="logo">
            <h2>ANUNZA</h2>
          </div>
          <div className="navbar-actions">
            <button
              className="profile-menu"
              onClick={() => setActiveSection('perfil')}
              type="button"
            >
              <img src={profileData.foto} alt="Perfil" className="profile-img" />
              <span>{profileData.nombre}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <ul>
              <li
                className={activeSection === 'inicio' ? 'active' : ''}
                onClick={() => setActiveSection('inicio')}
              >
                Inicio
              </li>
              <li>Mis anuncios</li>
              <li>Crear anuncio</li>
              <li>Favoritos</li>
              <li>Mensajes</li>
              <li>Configuración</li>
            </ul>
          </nav>
        </aside>

        {/* Contenido principal */}
        <main className="main-content">
          {activeSection === 'perfil' ? (
            <section className="profile-section">
              <h2>Mi perfil</h2>
              {!isEditingProfile ? (
                <div className="profile-card">
                  <div className="profile-info">
                    <img src={profileData.foto} alt="Foto de perfil" className="profile-preview" />
                    <p><strong>Nombre:</strong> {profileData.nombre}</p>
                  </div>
                  <div className="profile-actions">
                    <button className="edit-button" onClick={() => setIsEditingProfile(true)}>
                      Editar perfil
                    </button>
                    <button className="logout-button" onClick={handleLogout}>
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              ) : (
                <form className="edit-form" onSubmit={handleSaveProfile}>
                  <div className="form-group">
                    <label htmlFor="nombre">Nombre</label>
                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      value={profileData.nombre}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="foto">Foto (URL)</label>
                    <input
                      id="foto"
                      name="foto"
                      type="url"
                      value={profileData.foto}
                      onChange={handleProfileChange}
                      placeholder="https://..."
                      required
                    />
                  </div>
                  <div className="form-buttons">
                    <button type="submit" className="save-button">Guardar</button>
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => setIsEditingProfile(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </section>
          ) : (
            <>
              {/* Sección de bienvenida */}
              <section className="welcome-section">
                <h1>Bienvenido a ANUNZA</h1>
                <p>Tu plataforma para publicar y encontrar anuncios de productos y servicios. Gestiona tus anuncios, conecta con compradores y vendedores.</p>
              </section>

              {/* Barra de búsqueda destacada */}
              <section className="featured-search">
                <FeatureSearch value={query} onSearch={handleSearch} />
              </section>

              {/* Panel de filtros de servicios */}
              <section className="services-section">
                <div className="services-heading">
                  <h2>Explora servicios publicados</h2>
                  <p>Combina categoría, ciudad, rango de precio y calificación para filtrar resultados en tiempo real.</p>
                </div>
                <div className="services-layout">
                  <FiltrosServicios filtros={filtros} onChange={setFiltros} />
                  <div className="services-results">
                    <ServiciosLista servicios={serviciosFiltrados} />
                  </div>
                </div>
              </section>

              {/* Actividad reciente */}
              <section className="recent-activity">
                <h2>Actividad reciente</h2>
                <ul className="activity-list">
                  {actividadReciente.map((activity, index) => (
                    <li key={index}>{activity}</li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};