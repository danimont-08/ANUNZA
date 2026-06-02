import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { editarPublicacion, fetchCategorias } from '../../models/publicacionModel';
import { formatCOP } from '../../utils/format';
import { IconX, IconLoader } from '../icons';
import { useToast } from '../../context/ToastContext';
import './EditPublicacionModal.css';

/** Parsea la descripción que puede venir como texto plano o JSON serializado. */
function parseDescripcion(pub) {
  // Si el backend ya entregó texto_plano, usarlo directo
  if (pub.texto_plano != null) {
    return {
      text: pub.texto_plano,
      hashtags: pub.hashtags || [],
      service: pub.service_detalle || null,
    };
  }
  const raw = pub.descripcion;
  if (raw == null) return { text: '', hashtags: [], service: null };
  const s = String(raw).trim();
  if (!s.startsWith('{')) return { text: raw, hashtags: [], service: null };
  try {
    const j = JSON.parse(s);
    return {
      text: j.text != null ? String(j.text) : '',
      hashtags: Array.isArray(j.hashtags) ? j.hashtags : [],
      service: j.service && typeof j.service === 'object' ? j.service : null,
    };
  } catch {
    return { text: raw, hashtags: [], service: null };
  }
}

export function EditPublicacionModal({ pub, onClose, onUpdated }) {
  const showToast = useToast();
  const parsed = parseDescripcion(pub);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titulo:        pub.titulo || '',
    descripcion:   parsed.text,
    tipo:          pub.tipo || 'ofrezco',
    categoria_id:  pub.categoria_id || '',
    subcategoria_id: pub.subcategoria_id || '',
    precio:        pub.precio ?? '',
  });
  // Preservar hashtags y servicio originales al guardar
  const originalHashtags = parsed.hashtags;
  const originalService  = parsed.service;

  useEffect(() => {
    fetchCategorias().then((d) => {
      const cats = d.categorias || [];
      setCategorias(cats);
      const cat = cats.find((c) => c.id === Number(pub.categoria_id));
      setSubcategorias(cat?.subcategorias || []);
    }).catch(() => {});
  }, [pub.categoria_id]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleCategoria = (e) => {
    const id = e.target.value ? Number(e.target.value) : '';
    const cat = categorias.find((c) => c.id === id);
    setSubcategorias(cat?.subcategorias || []);
    set({ categoria_id: id, subcategoria_id: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.descripcion.trim()) return showToast('La descripción es obligatoria', 'error');
    setSaving(true);
    try {
      const tieneServicio = originalService && (
        originalService.materiales || originalService.tiempo_estimado || originalService.detalles
      );
      const data = await editarPublicacion(pub.id, {
        titulo:         form.titulo.trim(),
        descripcion:    form.descripcion.trim(),
        tipo:           form.tipo,
        categoria_id:   form.categoria_id,
        subcategoria_id: form.subcategoria_id || null,
        precio:         form.precio !== '' ? Number(form.precio) : null,
        hashtags:       originalHashtags,
        agregar_servicio: !!tieneServicio,
        service:        originalService || undefined,
      });
      showToast('Publicación actualizada', 'success');
      onUpdated?.(data.publicacion);
      onClose();
    } catch (e) {
      showToast(e.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="epm-backdrop" onClick={onClose}>
      <div className="epm-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="epm-header">
          <h2 className="epm-title">Editar publicación</h2>
          <button type="button" className="epm-close" onClick={onClose} aria-label="Cerrar">
            <IconX size={18} />
          </button>
        </div>

        <form className="epm-form" onSubmit={handleSubmit}>
          {/* Tipo */}
          <div className="epm-tipo-row">
            {['ofrezco', 'busco'].map((t) => (
              <button
                key={t}
                type="button"
                className={`epm-tipo-btn${form.tipo === t ? ' active' : ''}`}
                onClick={() => set({ tipo: t })}
              >
                {t === 'ofrezco' ? 'Ofrezco' : 'Busco'}
              </button>
            ))}
          </div>

          {/* Título */}
          <label className="epm-label">
            Título
            <input
              className="epm-input"
              value={form.titulo}
              onChange={(e) => set({ titulo: e.target.value })}
              placeholder="Título de tu publicación"
              maxLength={120}
            />
          </label>

          {/* Descripción */}
          <label className="epm-label">
            Descripción <span className="epm-required">*</span>
            <textarea
              className="epm-textarea"
              value={form.descripcion}
              onChange={(e) => set({ descripcion: e.target.value })}
              placeholder="Describe tu servicio o lo que buscas…"
              rows={4}
            />
          </label>

          {/* Categoría */}
          <div className="epm-row">
            <label className="epm-label">
              Categoría
              <select className="epm-select" value={form.categoria_id} onChange={handleCategoria}>
                <option value="">Seleccionar…</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </label>
            {subcategorias.length > 0 && (
              <label className="epm-label">
                Subcategoría
                <select className="epm-select" value={form.subcategoria_id} onChange={(e) => set({ subcategoria_id: e.target.value ? Number(e.target.value) : '' })}>
                  <option value="">Todas</option>
                  {subcategorias.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </label>
            )}
          </div>

          {/* Precio */}
          <label className="epm-label">
            Precio (opcional)
            <div className="epm-price-wrap">
              <span className="epm-price-prefix">$</span>
              <input
                type="number"
                min="0"
                className="epm-input epm-price-input"
                value={form.precio}
                onChange={(e) => set({ precio: e.target.value })}
                placeholder="0"
              />
            </div>
            {form.precio !== '' && <p className="epm-price-preview">{formatCOP(form.precio)}</p>}
          </label>

          <div className="epm-actions">
            <button type="button" className="epm-btn-cancel" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="epm-btn-save" disabled={saving}>
              {saving ? <><IconLoader size={15}/> Guardando…</> : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
