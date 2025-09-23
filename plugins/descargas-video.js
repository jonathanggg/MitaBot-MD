import axios from 'axios';
import ytSearch from 'yt-search';

// -- Funciones auxiliares (sin cambios) --
const getContextInfo = (title = '', userJid = '', thumbnailUrl = '') => ({
  mentionedJid: [userJid],
  externalAdReply: {
    showAdAttribution: false,
    title: global.botname || 'YouTube Downloader',
    body: title || "Media Downloader",
    thumbnailUrl: thumbnailUrl || '',
    sourceUrl: global.linkgc || '',
    mediaType: 1,
    renderLargerThumbnail: true
  }
});

// **[FUNCIÓN MEJORADA]**
async function getVideoInfo(query) {
  const isUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(query);
  if (isUrl) {
    // Si es una URL, yt-search puede extraer la información directamente
    const searchResults = await ytSearch({ videoId: query.split('v=')[1]?.split('&')[0] || query.split('/').pop() });
    if (!searchResults) throw new Error('🚫 No se pudo obtener información del enlace de YouTube.');
    return searchResults;
  } else {
    // Si es texto, busca el video
    const searchResults = await ytSearch(query);
    if (!searchResults?.videos?.length) {
      throw new Error('🚫 No se encontró ningún video para esa búsqueda.');
    }
    return searchResults.videos[0];
  }
}

async function downloadFromApis(apis) {
  for (const api of apis) {
    try {
      const { data } = await axios.get(api, { timeout: 45000 });
      const result = data.result || data.data || data;
      if (!result) continue;
      let downloadUrl;
      const potentialUrl = result.url || result.link || result.download;
      if (typeof potentialUrl === 'string') {
        downloadUrl = potentialUrl;
      } else if (typeof potentialUrl === 'object' && potentialUrl !== null) {
        downloadUrl = potentialUrl.url || potentialUrl.link || potentialUrl.mp4 || potentialUrl.hd || potentialUrl.sd;
      }
      if (!downloadUrl) {
          downloadUrl = result.dlink || result.url_video;
      }
      if (typeof downloadUrl === 'string') {
        return { title: result.title, download_url: downloadUrl };
      }
    } catch (error) {
      const hostname = new URL(api).hostname;
      console.warn(`⚠️ API falló: ${hostname}`);
      continue;
    }
  }
  throw new Error('❌ Las APIs principales no respondieron.');
}

// -- Handler Principal --
let handler = async (m, { conn, text, command }) => {
  if (!text) throw `Por favor, proporciona el nombre o enlace de un video. \n\n*Ejemplo:*\n*.${command} spiderman no way home trailer*`;

  try {
    await m.reply(`🎥 Buscando información para: *${text}*`);

    const videoInfo = await getVideoInfo(text);
    const videoUrl = videoInfo.url;
    const title = videoInfo.title;
    const thumbnail = videoInfo.thumbnail;
    
    const apis = [
        `http://salya.alyabot.xyz:3108/download_videoV2?url=${encodeURIComponent(videoUrl)}`,
        `https://api.diioffc.web.id/api/download/ytmp4?url=${encodeURIComponent(videoUrl)}`,
        `https://api.vreden.my.id/api/ytmp4?url=${encodeURIComponent(videoUrl)}`,
        `https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(videoUrl)}`,
        `https://api.bk9.dev/download/youtube?url=${encodeURIComponent(videoUrl)}`
    ];
    
    let downloadData;
    try {
        downloadData = await downloadFromApis(apis);
    } catch (e) {
        console.warn(e.message);
        m.reply('🔹 Las APIs principales fallaron. Intentando con el servicio de respaldo (Cobalt)...');
        try {
            const postResponse = await axios.post('https://api.cobalt.tools/api/json', { url: videoUrl }, { timeout: 60000 });
            if (postResponse.data.status === 'success') {
                downloadData = { download_url: postResponse.data.url };
            } else {
                throw new Error('El servicio de respaldo Cobalt también falló.');
            }
        } catch (postError) {
           throw new Error('❌ Todas las fuentes de descarga fallaron. Por favor, inténtalo de nuevo más tarde.');
        }
    }

    if (!downloadData?.download_url) {
        throw new Error('No se pudo extraer un enlace de descarga válido.');
    }

    const { download_url } = downloadData;
    const finalTitle = downloadData.title || title;

    // **[LÓGICA AÑADIDA]** Enviar como video o como documento según el comando
    if (command === 'videodoc') {
      await conn.reply(m.chat, `📄 Enviando video como documento... (esto puede tardar un momento)`, m);
      await conn.sendMessage(m.chat, {
        document: { url: download_url },
        mimetype: 'video/mp4',
        fileName: `${finalTitle}.mp4`.replace(/[^\w\s.-]/gi, ''),
        caption: `📁 Video Documento: *${finalTitle}*`,
        contextInfo: getContextInfo(finalTitle, m.sender, thumbnail)
      }, { quoted: m });
    } else {
      await conn.reply(m.chat, `🎬 Enviando video... (esto puede tardar un momento)`, m);
      await conn.sendMessage(m.chat, {
        video: { url: download_url },
        mimetype: 'video/mp4',
        caption: `🎥 *${finalTitle}*`,
        contextInfo: getContextInfo(finalTitle, m.sender, thumbnail)
      }, { quoted: m });
    }

  } catch (error) {
    console.error('Error en el comando video:', error);
    m.reply(`😕 Ocurrió un error: ${error.message}`);
  }
};

handler.help = ['video', 'ytmp4', 'videodoc'];
handler.tags = ['downloader'];
handler.command = ['video', 'ytmp4', 'film', 'videodoc'];
handler.limit = true;

export default handler;
