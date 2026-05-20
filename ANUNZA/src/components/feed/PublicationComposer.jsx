import React, { useState, useRef } from 'react';
import './PublicationComposer.css';

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function PublicationComposer({ categorias, onCreated, onError }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [tipo, setTipo] = useState('ofrezco');
  const [agregarServicio, setAgregarServicio] = useState(false);
  const [precio, setPrecio] = useState('');
  const [materiales, setMateriales] = useState('');
  const [tiempoEstimado, setTiempoEstimado] = useState('');
  const [detalles, setDetalles] = useState('');
  const [media, setMedia] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const parseHashtags = (raw) => {
    const parts = raw.split(/[\s,]+/).map((s) => s.replace(/^#/, '').trim()).filter(Boolean);
    return [...new Set(parts)];
  };

  const onPickFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    const next = [...media];
    for (const f of files.slice(0, 12 - next.length)) {
      if (f.size > 18 * 1024 * 1024) {
        onError('Un archivo supera el tamaño máximo (18 MB).');
        continue;
      }
      const isVid = f.type.startsWith('video/');
      const url = await readFileAsDataUrl(f);
      next.push({ url, type: isVid ? 'video' : 'image' });
    }
    setMedia(next);
    e.target.value = '';
  };

  const removeMedia = (i) => {
    setMedia((m) => m.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) {
      onError('Escribe un título para la publicación.');
      return;
    }
    const text = descripcion.trim();
    if (!text) {
      onError('Escribe una descripción del servicio.');
      return;
    }
    if (!categoriaId) {
      onError('Elige una categoría.');
      return;
    }

    const hashtags = parseHashtags(hashtagInput);
    const precioNum =
      agregarServicio && precio !== '' && !Number.isNaN(Number(precio)) ? Number(precio) : null;

    const body = {
      titulo: titulo.trim() || undefined,
      descripcion: text,
      categoria_id: Number(categoriaId),
      tipo,
      agregar_servicio: agregarServicio,
      precio: precioNum,
      service: agregarServicio
        ? { materiales, tiempo_estimado: tiempoEstimado, detalles }
        : null,
      hashtags,
      media,
    };

    setSubmitting(true);
    try {
      await onCreated(body);
      setTitulo('');
      setDescripcion('');
      setHashtagInput('');
      setPrecio('');
      setMateriales('');
      setTiempoEstimado('');
      setDetalles('');
      setMedia([]);
      setAgregarServicio(false);
    } catch (err) {
      onError(err.message || 'No se pudo publicar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="pc-card" onSubmit={handleSubmit}>
      <h2 className="pc-title">Crear publicación</h2>
      <label className="pc-label">
        Título
        <input
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej. Clases de crochet"
        />
      </label>
      <label className="pc-label">
        Descripción del servicio
        <textarea
          required
          rows={4}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Describe tu servicio…"
        />
      </label>
      <label className="pc-label">
        Hashtags
        <input
          value={hashtagInput}
          onChange={(e) => setHashtagInput(e.target.value)}
          placeholder="#Manualidades #Crochet #Lana"
        />
      </label>
      <div className="pc-row">
        <label className="pc-label">
          Categoría
          <select
            required
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
          >
            <option value="">— Seleccionar —</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="pc-label">
          Tipo
          <select
            value={tipo}
            onChange={(e) => {
              const nuevoTipo = e.target.value;
              setTipo(nuevoTipo);
              if (nuevoTipo !== 'ofrezco') setAgregarServicio(false);
            }}
          >
            <option value="ofrezco">Ofrezco</option>
            <option value="busco">Busco</option>
          </select>
        </label>
      </div>

      {tipo === 'ofrezco' && (
        <>
          <label className="pc-switch">
            <input
              type="checkbox"
              checked={agregarServicio}
              onChange={(e) => setAgregarServicio(e.target.checked)}
            />
            <span>Agregar información del servicio</span>
          </label>

          <div className={`pc-extra ${agregarServicio ? 'is-open' : ''}`}>
            <label className="pc-label">
              Precio (opcional)
              <input
                type="number"
                min="0"
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="0"
              />
            </label>
            <label className="pc-label">
              Materiales
              <input value={materiales} onChange={(e) => setMateriales(e.target.value)} />
            </label>
            <label className="pc-label">
              Tiempo estimado
              <input value={tiempoEstimado} onChange={(e) => setTiempoEstimado(e.target.value)} />
            </label>
            <label className="pc-label">
              Detalles adicionales
              <textarea rows={2} value={detalles} onChange={(e) => setDetalles(e.target.value)} />
            </label>
          </div>
        </>
      )}

      <div className="pc-media-block">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="pc-file"
          onChange={onPickFiles}
        />
        <button type="button" className="pc-add-media" onClick={() => fileRef.current?.click()}>
          Añadir fotos o videos
        </button>
        <div className="pc-previews">
          {media.map((m, i) => (
            <div key={i} className="pc-prev">
              {m.type === 'video' ? (
                <video src={m.url} className="pc-thumb" muted playsInline />
              ) : (
                <img src={m.url} alt="" className="pc-thumb" />
              )}
              <button type="button" className="pc-remove" onClick={() => removeMedia(i)}>
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" className="pc-submit" disabled={submitting}>
        {submitting ? 'Publicando…' : 'Publicar'}
      </button>
    </form>
  );
}
