import React from 'react';
import { IconX } from './icons';
import './PoliticaDatosModal.css';

export function PoliticaDatosModal({ onClose }) {
  return (
    <div className="pdm-backdrop" onClick={onClose}>
      <div className="pdm-box" onClick={(e) => e.stopPropagation()}>
        <div className="pdm-header">
          <h2>Política de Tratamiento de Datos Personales</h2>
          <button type="button" className="pdm-close" onClick={onClose} aria-label="Cerrar"><IconX size={16}/></button>
        </div>

        <div className="pdm-body">

          <section>
            <h3>1. Generalidades</h3>
            <p>La presente Política de Tratamiento de Datos Personales se desarrolla en cumplimiento de la Ley Estatutaria 1581 de 2012, el Decreto 1074 de 2015 y demás normas concordantes sobre protección de datos personales en Colombia.</p>
            <p>ANUNZA es una plataforma digital desarrollada por el equipo universitario DALATEC, orientada a conectar personas que buscan servicios con usuarios que los ofrecen dentro de comunidades locales, principalmente en Santander de Quilichao y sus alrededores.</p>
            <p>El tratamiento de datos personales realizado por ANUNZA tiene como finalidad garantizar el correcto funcionamiento de la plataforma, mejorar la experiencia de usuario, fortalecer la seguridad y permitir la interacción entre usuarios dentro del entorno digital.</p>
          </section>

          <section>
            <h3>2. Información General</h3>
            <ul>
              <li><strong>Nombre del proyecto:</strong> ANUNZA</li>
              <li><strong>Equipo desarrollador:</strong> DALATEC</li>
              <li><strong>Tipo de entidad:</strong> Proyecto universitario</li>
              <li><strong>Ciudad:</strong> Santander de Quilichao, Cauca – Colombia</li>
              <li><strong>Correo electrónico:</strong> privacidad.anunza@gmail.com</li>
              <li><strong>Teléfono:</strong> 3005287705</li>
            </ul>
          </section>

          <section>
            <h3>3. Objetivo de la Política</h3>
            <ul>
              <li>Garantizar la protección de los datos personales de los usuarios.</li>
              <li>Informar las finalidades del tratamiento de la información.</li>
              <li>Establecer los derechos de los titulares de los datos.</li>
              <li>Definir los mecanismos para consultas, reclamos, actualización y eliminación de información.</li>
              <li>Garantizar transparencia y seguridad en el uso de la plataforma ANUNZA.</li>
            </ul>
          </section>

          <section>
            <h3>4. Ámbito de Aplicación</h3>
            <p>La presente política aplica a toda la información personal registrada en: sitio web de ANUNZA, aplicación móvil ANUNZA, formularios digitales, chats internos, sistemas de calificación y reputación, publicaciones realizadas dentro de la plataforma, y sistemas de reporte, moderación y verificación de identidad.</p>
            <p>Esta política aplica a todos los usuarios registrados, administradores y moderadores de la plataforma.</p>
          </section>

          <section>
            <h3>5. Definiciones</h3>
            <ul>
              <li><strong>Dato personal:</strong> Información que permite identificar o hacer identificable a una persona natural.</li>
              <li><strong>Dato sensible:</strong> Información que puede afectar la intimidad del titular, como datos de ubicación geográfica en tiempo real.</li>
              <li><strong>Tratamiento:</strong> Cualquier operación realizada sobre datos personales como recolección, almacenamiento, uso, circulación, actualización o eliminación.</li>
              <li><strong>Titular:</strong> Persona natural cuyos datos personales son tratados por ANUNZA.</li>
              <li><strong>Responsable del tratamiento:</strong> ANUNZA, como plataforma administrada por DALATEC.</li>
              <li><strong>Moderador:</strong> Usuario autorizado para supervisar contenido, publicaciones y reportes dentro de la plataforma.</li>
            </ul>
          </section>

          <section>
            <h3>6. Principios del Tratamiento de Datos</h3>
            <p>ANUNZA aplicará los principios de: legalidad, finalidad, libertad, transparencia, seguridad, confidencialidad, acceso restringido y veracidad de la información.</p>
          </section>

          <section>
            <h3>7. Datos Personales Recolectados</h3>
            <ul>
              <li>Nombre completo</li>
              <li>Correo electrónico</li>
              <li>Número celular</li>
              <li>Número de cédula</li>
              <li>Ubicación</li>
              <li>Fotografía de perfil (opcional)</li>
              <li>Fotografías y videos publicados por los usuarios</li>
              <li>Información relacionada con publicaciones y servicios ofrecidos</li>
              <li>Mensajes enviados mediante el chat interno</li>
              <li>Calificaciones, comentarios y reseñas</li>
              <li>Reportes y bloqueos realizados dentro de la plataforma</li>
            </ul>
          </section>

          <section>
            <h3>8. Datos Sensibles</h3>
            <p>ANUNZA podrá tratar datos relacionados con la ubicación geográfica del usuario cuando este registre o actualice su ubicación dentro de la plataforma. Estos datos serán utilizados únicamente para mostrar servicios cercanos, facilitar búsquedas por ubicación, mejorar la experiencia de usuario y optimizar recomendaciones locales. El usuario podrá modificar o actualizar su ubicación en cualquier momento.</p>
          </section>

          <section>
            <h3>9. Finalidades del Tratamiento</h3>
            <p>Los datos personales serán utilizados para: registro y autenticación, funcionamiento general de la plataforma, comunicación interna mediante chat privado, sistema de reputación y calificaciones, seguridad y moderación, envío de notificaciones, verificación de identidad y mejoramiento continuo de la plataforma.</p>
            <p>Los usuarios normales tendrán un límite de hasta tres (3) publicaciones diarias. Los usuarios premium acceden a mayor cantidad de publicaciones diarias, insignia destacada en el perfil y mayor visibilidad de publicaciones.</p>
          </section>

          <section>
            <h3>10. Derechos de los Titulares</h3>
            <ul>
              <li>Conocer sus datos personales almacenados.</li>
              <li>Actualizar su información.</li>
              <li>Rectificar datos incorrectos.</li>
              <li>Solicitar eliminación de datos.</li>
              <li>Revocar la autorización del tratamiento.</li>
              <li>Presentar consultas o reclamos.</li>
              <li>Solicitar prueba de la autorización otorgada.</li>
            </ul>
          </section>

          <section>
            <h3>11. Autorización del Titular</h3>
            <p>Al registrarse en ANUNZA, el usuario autoriza de manera previa, expresa e informada el tratamiento de sus datos personales conforme a esta política. La autorización podrá obtenerse mediante formularios digitales, casillas de aceptación y registro en la aplicación o sitio web.</p>
          </section>

          <section>
            <h3>12. Tratamiento de Fotografías y Videos</h3>
            <p>Los usuarios podrán subir fotografías y videos relacionados con servicios ofrecidos, publicaciones y perfil de usuario. El usuario garantiza que posee autorización sobre el contenido publicado. ANUNZA podrá eliminar contenido ofensivo, que vulnere derechos, contenga violencia, discriminación, acoso o material fraudulento.</p>
          </section>

          <section>
            <h3>13. Política de Contenido y Comportamiento</h3>
            <p>Está prohibido: publicar información falsa, suplantar identidad, realizar actividades ilegales, publicar contenido ofensivo o discriminatorio y utilizar ANUNZA para fraudes o estafas. ANUNZA podrá suspender cuentas, eliminar publicaciones, bloquear usuarios y restringir funcionalidades.</p>
          </section>

          <section>
            <h3>14. Menores de Edad</h3>
            <p>ANUNZA no está dirigida a menores de edad. El registro y uso de la plataforma está permitido únicamente para personas mayores de 18 años. Si ANUNZA detecta información de menores de edad, podrá eliminar la cuenta y la información asociada.</p>
          </section>

          <section>
            <h3>15. Seguridad de la Información</h3>
            <p>ANUNZA implementará medidas técnicas y administrativas razonables para proteger la información contra acceso no autorizado, pérdida de datos, alteración de información, uso fraudulento y suplantación.</p>
          </section>

          <section>
            <h3>16. Transferencia y Transmisión de Datos</h3>
            <p>ANUNZA podrá compartir información únicamente cuando sea requerido por autoridades competentes, exista obligación legal o sea necesario para el funcionamiento técnico de la plataforma. En ningún caso se venderán datos personales a terceros.</p>
          </section>

          <section>
            <h3>17. Consultas y Reclamos</h3>
            <ul>
              <li><strong>Correo electrónico:</strong> privacidad.anunza@gmail.com</li>
              <li><strong>Teléfono:</strong> 3005287704</li>
            </ul>
            <p>ANUNZA responderá dentro de los términos establecidos por la legislación colombiana.</p>
          </section>

          <section>
            <h3>18. Vigencia de la Política</h3>
            <p>La presente política entra en vigencia desde su publicación y podrá ser modificada o actualizada por ANUNZA cuando sea necesario. Las modificaciones serán informadas a los usuarios mediante la plataforma o canales oficiales.</p>
          </section>

          <section>
            <h3>19. Aceptación de la Política</h3>
            <p>El uso de ANUNZA implica la aceptación de esta Política de Tratamiento de Datos Personales y de los Términos y Condiciones de la plataforma.</p>
          </section>

        </div>

        <div className="pdm-footer">
          <button type="button" className="pdm-accept-btn" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
