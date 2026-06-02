/**
 * Comprime una imagen en el cliente usando Canvas antes de subirla.
 * Devuelve un data URL JPEG comprimido.
 *
 * @param {File} file  Archivo de imagen
 * @param {object} opts
 * @param {number} opts.maxWidth   Ancho máximo en px  (default 1400)
 * @param {number} opts.maxHeight  Alto máximo en px   (default 1400)
 * @param {number} opts.quality    Calidad JPEG 0–1    (default 0.82)
 */
export function compressImage(file, { maxWidth = 1400, maxHeight = 1400, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;

        // Escalar si supera el máximo manteniendo proporción
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width  = Math.round(width  * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
