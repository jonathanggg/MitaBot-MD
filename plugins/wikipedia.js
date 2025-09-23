// plugins/wikipedia.js
import fetch from "node-fetch";

let handler = async (m, { text, usedPrefix, command }) => {
  if (!text) {
    return m.reply(`📚 *Uso correcto:*\n${usedPrefix + command} <tema>\n\n*Ejemplo:*\n${usedPrefix + command} Colombia`);
  }

  // Mensaje de búsqueda
  await m.reply(`🔍 Buscando en Wikipedia: *"${text}"*...`);

  try {
    // Consultar API de Wikipedia
    let res = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(text)}`, {
      headers: {
        'User-Agent': 'WhatsAppBot/2.0 (https://github.com/)'
      }
    });

    if (!res.ok) {
      if (res.status === 404) {
        return m.reply(`❌ *No encontrado*\n\nNo hay información sobre *"${text}"* en Wikipedia.\n\n💡 *Sugerencias:*\n• Revisa la ortografía\n• Usa términos más específicos\n• Intenta con sinónimos`);
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    let json = await res.json();

    // Verificar si es página de desambiguación
    if (json.type === 'disambiguation') {
      return m.reply(`📋 *Desambiguación*\n\nEl término *"${text}"* tiene múltiples significados. Por favor, sé más específico en tu búsqueda.`);
    }

    if (!json.extract) {
      return m.reply(`❌ *Sin contenido*\n\nNo se encontró información suficiente sobre *"${text}"* en Wikipedia.`);
    }

    // Preparar el extracto (limitar caracteres para WhatsApp)
    let extract = json.extract;
    if (extract.length > 800) {
      extract = extract.substring(0, 797) + '...';
    }

    // Preparar el mensaje de respuesta
    let responseMsg = `📖 *Wikipedia*\n\n`;
    responseMsg += `*📝 ${json.title}*\n\n`;
    responseMsg += `${extract}\n\n`;
    
    // Agregar información adicional si existe
    if (json.coordinates) {
      responseMsg += `📍 *Coordenadas:* ${json.coordinates.lat}°, ${json.coordinates.lon}°\n`;
    }
    
    // Enlace a la página completa
    responseMsg += `🔗 *Leer completo:* ${json.content_urls?.desktop?.page || "Enlace no disponible"}`;

    // Enviar imagen si está disponible
    if (json.thumbnail && json.thumbnail.source) {
      try {
        // Crear encabezado con imagen
        const headerImg = "https://spacny.wuaze.com//uploads/1001713781.jpg";
        
        // Enviar imagen del encabezado
        await m.reply({
          image: { url: headerImg },
          caption: `📖 *Resultado de Wikipedia*`
        });
        
        // Enviar imagen del artículo con el contenido
        await m.reply({
          image: { url: json.thumbnail.source },
          caption: responseMsg
        });
        
      } catch (imgError) {
        console.error('Error enviando imagen:', imgError);
        // Si falla la imagen, enviar solo texto
        await m.reply(responseMsg);
      }
    } else {
      // Sin imagen, solo texto con encabezado
      try {
        const headerImg = "https://spacny.wuaze.com//uploads/1001713781.jpg";
        await m.reply({
          image: { url: headerImg },
          caption: responseMsg
        });
      } catch (headerError) {
        // Si falla el encabezado, enviar solo texto
        await m.reply(responseMsg);
      }
    }

  } catch (error) {
    console.error('Error en plugin Wikipedia:', error);
    
    // Manejo específico de errores
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      await m.reply('🌐 *Error de conexión*\n\nNo se pudo conectar con Wikipedia. Verifica tu conexión e inténtalo más tarde.');
    } else if (error.message.includes('fetch')) {
      await m.reply('📡 *Error de red*\n\nProblema al consultar Wikipedia. Inténtalo en unos momentos.');
    } else {
      await m.reply('⚠️ *Error del servicio*\n\nOcurrió un error inesperado al buscar en Wikipedia. Inténtalo más tarde.');
    }
  }
};

// Configuración del handler
handler.help = ["wikipedia <búsqueda>", "wiki <búsqueda>"];
handler.tags = ["buscador", "consultas"];
handler.command = /^(wikipedia|wiki)$/i;

export default handler;
