import axios from 'axios';
import ytSearch from 'yt-search';

const getContextInfo = (title = '', userJid = '', thumbnailUrl = '') => ({
  mentionedJid: [userJid],
  externalAdReply: {
    showAdAttribution: false,
    title: global.botname,
    body: title,
    thumbnailUrl: thumbnailUrl || '',
    sourceUrl: global.linkgc || '',
    mediaType: 1,
    renderLargerThumbnail: true
  }
});

async function getVideoInfo(query) {
  const isUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(query);
  if (isUrl) {
    
    const searchResults = await ytSearch({ videoId: query.split('v=')[1]?.split('&')[0] || query.split('/').pop() });
    if (!searchResults) throw new Error('🚫 No se pudo obtener información del enlace de YouTube.');
    return searchResults;
  } else {

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
      const { data } = await axios.get(api, { timeout: 30000 });
      const result = data.result || data.data || data;
      if (!result) continue;
      let downloadUrl;
      const potentialUrl = result.url || result.link || result.download;
      if (typeof potentialUrl === 'string') {
        downloadUrl = potentialUrl;
      } else if (typeof potentialUrl === 'object' && potentialUrl !== null) {
        downloadUrl = potentialUrl.url || potentialUrl.link || potentialUrl.mp3 || potentialUrl.audio;
      }
      if (!downloadUrl) {
          downloadUrl = result.dlink || result.url_audio;
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

let handler = async (m, { conn, text, command }) => {
  if (!text) throw `Por favor, proporciona el nombre o enlace de una canción. \n\n*Ejemplo:*\n*.${command} believer*`;

  try {
    await m.reply(`🎵 Buscando información para: *${text}*`);
    
    const videoInfo = await getVideoInfo(text);
    const videoUrl = videoInfo.url;
    const title = videoInfo.title;
    const thumbnail = videoInfo.thumbnail;

    const apis = [
      `https://api.diioffc.web.id/api/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
      `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(videoUrl)}`,
      `https://api.bk9.dev/download/ytmp3?url=${encodeURIComponent(videoUrl)}&type=mp3`,
      `https://apis.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(videoUrl)`,
      `http://salya.alyabot.xyz:3108/download_audioV2?url=${encodeURIComponent(videoUrl)`,
      `http://salya.alyabot.xyz:3108/download_audio?url=${encodeURIComponent(videoUrl)`
    ];

    let downloadData;
    try {
        downloadData = await downloadFromApis(apis);
    } catch (e) {
        console.warn(e.message);
        m.reply('🔹 Las APIs principales fallaron. Intentando con el servicio de respaldo.');
        try {
            const postResponse = await axios.post('https://api.cobalt.tools/api/json', { url: videoUrl, isAudioOnly: true }, { timeout: 40000 });
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

    if (command === 'playdoc') {
      await conn.reply(m.chat, `📄 Enviando audio como documento...`, m);
      await conn.sendMessage(m.chat, {
        document: { url: download_url },
        mimetype: 'audio/mpeg',
        fileName: `${finalTitle}.mp3`.replace(/[^\w\s.-]/gi, ''),
        caption: `📁 Documento de audio: *${finalTitle}*`,
        contextInfo: getContextInfo(finalTitle, m.sender, thumbnail)
      }, { quoted: m });
    } else {
      await conn.reply(m.chat, `🎧 Enviando audio...`, m);
      await conn.sendMessage(m.chat, {
        audio: { url: download_url },
        mimetype: 'audio/mp4',
        fileName: `${finalTitle}.mp3`,
        contextInfo: getContextInfo(finalTitle, m.sender, thumbnail)
      }, { quoted: m });
    }

  } catch (error) {
    console.error('Error en el comando play:', error);
    m.reply(`😕 Ocurrió un error: ${error.message}`);
  }
};

handler.help = ['play', 'playdoc'];
handler.tags = ['downloader'];
handler.command = ['play', 'song', 'audio', 'mp3', 'playdoc'];
handler.limit = true;

export default handler;
