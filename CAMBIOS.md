# ANUNZA — Registro de cambios y mejoras

Documento de las funcionalidades y mejoras agregadas a la plataforma, con descripción
de **qué hace** cada una y **cómo se ve** visualmente.

---

## 1. Header / Navbar reorganizado

**Qué se hizo:** Se quitó el botón de perfil (avatar + nombre) de la barra superior, tanto en el dashboard como en el panel de administración.

**Cómo se ve:**
- El logo de ANUNZA queda en la **esquina izquierda**.
- La campana de notificaciones queda en la **esquina derecha**.
- La barra ocupa todo el ancho de la pantalla (ya no centrada con margen).
- El logo sigue funcionando como botón para volver al feed.
- El acceso al perfil ahora está en el footer del menú lateral.

---

## 2. Animaciones de transición

**Qué se hizo:** Transiciones suaves al navegar entre secciones y entre el dashboard y el panel admin.

**Cómo se ve:**
- Al cambiar de sección (Inicio, Mensajes, Historial, Perfil) el contenido entra con un **desvanecido + leve deslizamiento** hacia arriba.
- El ícono del menú lateral activo hace un pequeño **rebote**.
- Al pasar el cursor por los ítems del menú, se desplazan ligeramente.
- Al cambiar entre dashboard y admin hay un **fundido de salida y entrada**, sin cortes bruscos.

---

## 3. Perfil de otros usuarios a pantalla completa

**Qué se hizo:** Al entrar al perfil de una persona (desde una publicación, el chat, etc.) se abre con el mismo estilo del perfil propio.

**Cómo se ve:**
- Pantalla completa con **portada degradada**, avatar circular, nombre, verificación, estadísticas (publicaciones, me gusta recibidos) y descripción.
- Barra superior con botón **"← Volver"**.
- Grilla de publicaciones del usuario. Al **hacer clic en cualquier publicación** te lleva directamente a ella (en el feed, resaltada).
- Animación de entrada deslizando desde abajo.

---

## 4. Mensaje automático de referencia en el chat

**Qué se hizo:** Cuando contactas a alguien desde una publicación, se envía un primer mensaje automático que indica de qué publicación se trata.

**Cómo se ve:**
- Al abrir el chat desde una publicación, aparece un mensaje tipo:
  *"Hola, me interesa tu publicación '[título]'. ¿Podrías darme más información?"*
- Sirve como referencia cuando el vendedor tiene varias publicaciones.
- No se duplica la conversación: siempre usa el mismo chat con esa persona.

---

## 5. Búsqueda y filtros del feed

**Qué se hizo:** Se agregó búsqueda por texto, filtro por tipo, filtros por categoría y carga progresiva.

**Cómo se ve:**
- **Barra de búsqueda** siempre visible arriba del feed (con ícono de lupa y botón "X" para limpiar).
- **Pills de tipo:** botones redondeados "Todos / Ofrezco / Busco" — el activo se pinta de violeta.
- **Pills de categoría:** fila horizontal deslizable de categorías, con un **degradado a la derecha** que indica que hay más para deslizar.
- **Filtros avanzados** (botón "Más filtros" con punto indicador cuando hay filtros activos): panel rediseñado con categoría, subcategoría, ciudad (con ícono de ubicación), rango de precio (Mín/Máx) y calificación mínima por estrellas.
- **Scroll infinito:** las publicaciones se cargan automáticamente al llegar al final (de 20 en 20), mostrando *placeholders* animados mientras carga.

---

## 6. Estados de carga y vacío

**Qué se hizo:** Mejor experiencia mientras carga el feed o cuando no hay resultados.

**Cómo se ve:**
- **Skeleton:** mientras carga aparecen tarjetas grises con efecto **shimmer** (brillo que se desplaza), en lugar de un texto plano.
- **Estado vacío:** cuando no hay resultados se muestra una ilustración con mensaje contextual (cambia si buscaste algo específico o solo aplicaste filtros).

---

## 7. Notificaciones tipo "toast"

**Qué se hizo:** Sistema de avisos breves global para toda la app.

**Cómo se ve:**
- Mensajes flotantes en la parte inferior central de la pantalla.
- Colores según el tipo: **verde** (éxito), **rojo** (error), **violeta** (info).
- Entran con una pequeña animación de rebote y desaparecen solos.
- Ejemplos: "Guardado en tu historial", "Enlace copiado", "Publicación actualizada".

---

## 8. Modo oscuro

**Qué se hizo:** Tema oscuro completo para toda la plataforma.

**Cómo se ve:**
- Botón **luna/sol** en el footer del menú lateral ("Modo oscuro" / "Modo claro").
- Fondos oscuros (morado muy oscuro), texto claro, manteniendo el violeta de ANUNZA como acento.
- Cubre feed, tarjetas, menús, perfil, chat, modales, formularios y panel admin.
- La preferencia **se recuerda** entre sesiones.
- El logo se muestra dentro de una pastilla clara para que no se vea cortado en oscuro.

---

## 9. Botones de las publicaciones reorganizados

**Qué se hizo:** Se ordenó la barra de acciones de cada publicación y se aclaró el botón de chat.

**Cómo se ve (de izquierda a derecha):**
1. ❤️ **Me gusta** (con contador)
2. 💬 **Comentarios** (con contador)
3. ⭐ **Reseñas** (con cantidad entre paréntesis)
4. 🔖 **Guardar** (se pinta de violeta cuando está guardado)
5. **Chat** — separado a la **derecha**, en **fondo violeta** y con la palabra **"Chat"** junto al ícono, para que se entienda que es para contactar.
- En tus propias publicaciones, en lugar de "Chat" aparece el botón **Destacar** a la derecha.

---

## 10. Editar y eliminar publicaciones

**Qué se hizo:** Ahora se pueden editar las publicaciones (antes solo crear/eliminar).

**Cómo se ve:**
- En el **menú de tres puntos** de cada publicación propia aparece **"Editar publicación"**.
- También desde el **perfil propio**, cada publicación tiene un menú (tres puntos) con **Editar / Eliminar**, con íconos y colores de ANUNZA.
- Al editar se abre un **modal** con: tipo (Ofrezco/Busco), título, descripción, categoría, subcategoría y precio.
- Los cambios se reflejan al instante sin recargar.

---

## 11. Editar y eliminar mensajes en el chat

**Qué se hizo:** Control sobre los mensajes propios ya enviados.

**Cómo se ve:**
- En tus mensajes aparece un **botón de tres puntos** (con fondo claro y borde violeta, siempre visible).
- Al pulsarlo se despliega un menú **hacia arriba** con **"Editar mensaje"** y **"Eliminar mensaje"**.
- **Editar:** el texto se vuelve editable en el mismo lugar; al guardar, el mensaje muestra **"(editado)"**.
- **Eliminar:** el mensaje se reemplaza por *"Mensaje eliminado"* en cursiva.
- La persona que recibió el mensaje **también ve** la marca "(editado)" o el aviso de eliminado, en tiempo real.

---

## 12. Verificación de usuarios

**Qué se hizo:** Flujo para que un administrador verifique cuentas.

**Cómo se ve:**
- En el panel de administración, dentro del perfil de un usuario, hay un botón **"✓ Verificar usuario"** / **"✕ Quitar verificación"**.
- Los usuarios verificados muestran una **insignia de escudo** junto a su nombre en el feed y su perfil.
- Si tu cuenta no está verificada, en tu perfil ves un aviso discreto: *"No verificado · Contacta al soporte para verificar tu cuenta"*.

---

## 13. Compresión de imágenes

**Qué se hizo:** Las imágenes se comprimen en el navegador antes de subirse.

**Cómo se ve:**
- Transparente para el usuario: sube igual, pero **más rápido**.
- Una foto de varios MB desde el celular se reduce a kilobytes sin pérdida visible.
- Aplica a foto de perfil, portada y fotos de publicaciones (los videos no se comprimen).

---

## 14. Enlace individual de cada publicación

**Qué se hizo:** Cada publicación tiene su propia dirección web compartible.

**Cómo se ve:**
- El botón **Compartir** (menú de tres puntos) copia un enlace tipo `…/pub/[id]` o abre el menú nativo de compartir del dispositivo.
- Al abrir ese enlace se ve una **página dedicada** de la publicación: imagen grande, tipo, categoría, precio, autor (clic para ver su perfil), descripción, hashtags, estadísticas y botones de **Me gusta / Guardar / Compartir / Contactar**.
- Incluye botón **"Ver en el feed de ANUNZA"**.

---

## 15. Aplicación instalable (PWA)

**Qué se hizo:** ANUNZA se puede instalar como app en el celular.

**Cómo se ve:**
- Desde el navegador (Chrome/Safari) aparece la opción de **"Agregar a pantalla de inicio"**.
- Se instala con ícono y nombre de ANUNZA, color violeta de marca, y se abre como una app independiente.

---

## 16. Quitar foto de perfil

**Qué se hizo:** Antes solo se podía cambiar la foto; ahora también quitarla.

**Cómo se ve:**
- En la edición de perfil, junto al avatar aparece el botón **"Quitar foto"** (solo si tienes una puesta).
- Al quitarla, vuelve al avatar por defecto.

---

## Notas técnicas

- **Tiempo real (chat):** los mensajes instantáneos, "(editado)" y "Mensaje eliminado" se propagan en vivo solo cuando ambas personas están conectadas al **mismo servidor**. En pruebas locales con servidores separados, los cambios se ven al recargar.
- **Base de datos:** se agregó automáticamente la columna `editado` a la tabla de mensajes; no requiere acción manual.
- **Límite de peticiones:** se subió el límite a 800 peticiones cada 15 minutos por IP, y el sondeo de notificaciones ya no consume esa cuota.
