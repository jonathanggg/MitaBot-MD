import yts from 'yt-search';
import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';      
import path from 'path';  

const ALLOWED_REPO = 'https://github.com/jonathanggg/MitaBot-MD.git';

let handler = async (m, { conn, text, command }) => {

  try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(pkgPath)) {
      console.log('Verificación fallida: No se encontró package.json.');
      return; 
    }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.repository?.url !== ALLOWED_REPO) {
      console.log('Comando no disponible por el momento.');
      return;
    }
  } catch (e) {
    console.error('Error en la verificación de repositorio:', e);
    return;
  }

  if (!text) throw `Ingresa el nombre del vídeo a descargar `;

  m.reply('*⏳ Buscando y procesando el video...*');

  try {
    const search = await yts(text);
    if (!search.videos.length) throw 'Video no encontrado, ¡intenta con otro título!';

    const video = search.videos[0];
    const videoUrl = video.url;

    const dl = await savetube.download(videoUrl, "video");
    if (!dl.status) {
        console.error("Error de Savetube:", dl);
        throw new Error(dl.error || 'No se pudo obtener el enlace de descarga.');
    }

    const { title, duration } = dl.result;
    const fileName = `${sanitizeFilename(title)}.mp4`;

    const caption = `
乂  *Y T - V I D E O*

   ⭔  *Título* : ${title}
   ⭔  *Canal* : ${video.author.name}
   ⭔  *Duración* : ${duration || video.timestamp}
   ⭔  *Vistas* : ${video.views.toLocaleString()}
   ⭔  *Publicado* : ${video.ago}

${global.wm}
    `.trim();

    if (command === 'videodoc' || command === 'ytmp4') {
        await conn.sendMessage(m.chat, {
            document: { url: dl.result.download },
            mimetype: 'video/mp4',
            fileName: fileName,
            caption: caption
        }, { quoted: m });
    } else { 
        await conn.sendMessage(m.chat, {
            video: { url: dl.result.download },
            mimetype: 'video/mp4',
            fileName: fileName,
            caption: caption
        }, { quoted: m });
    }

  } catch (e) {
    console.error(e);
    m.reply(`❌ Ocurrió un error. Por favor, inténtalo de nuevo.\n*Error:* ${e.message}`);
  }
};

handler.help = ['video <título>', 'mp4 <título>', 'videodoc <título>', 'ytmp4 <título>'];
handler.tags = ['downloader'];
handler.command = ['video', 'videodoc', 'mp4', 'ytmp4'];
handler.limit = true;
handler.daftar = true;

export default handler;

function sanitizeFilename(name = 'video') {
  return name.replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 150);
}

// ===== CÓDIGO SAVETUBE =====
const savetube = {
  api: {
    base: "https://media.savetube.me/api",
    info: "/v2/info",
    download: "/download",
    cdn: "/random-cdn",
  },
  headers: {
    accept: "*/*",
    "content-type": "application/json",
    origin: "https://yt.savetube.me",
    referer: "https://yt.savetube.me/",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " + "(KHTML, like Gecko) Chrome/118.0.5993.90 Safari/537.36",
  },
  crypto: {
    hexToBuffer: (hexString) => Buffer.from(hexString.match(/.{1,2}/g).join(""), "hex"),
    decrypt: async (enc) => {
      const secretKey = "C5D58EF67A7584E4A29F6C35BBC4EB12";
      const data = Buffer.from(enc, "base64");
      const iv = data.slice(0, 16);
      const content = data.slice(16);
      const key = savetube.crypto.hexToBuffer(secretKey);
      const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
      const decrypted = Buffer.concat([decipher.update(content), decipher.final()]);
      return JSON.parse(decrypted.toString());
    },
  },
  isUrl: (str) => {
    try {
      new URL(str);
      return /youtube.com|youtu.be/.test(str);
    } catch (_) {
      return false;
    }
  },
  youtube: (url) => {
    const patterns = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    ];
    for (let pattern of patterns) if (pattern.test(url)) return url.match(pattern)[1];
    return null;
  },
  request: async (endpoint, data = {}, method = "post") => {
    try {
      const { data: response } = await axios({
        method,
        url: `${endpoint.startsWith("http") ? "" : savetube.api.base}${endpoint}`,
        data: method === "post" ? data : undefined,
        params: method === "get" ? data : undefined,
        headers: savetube.headers,
      });
      return { status: true, code: 200, data: response };
    } catch (error) {
      return { status: false, code: error.response?.status || 500, error: error.message };
    }
  },
  getCDN: async () => {
    const response = await savetube.request(savetube.api.cdn, {}, "get");
    if (!response.status) return response;
    return { status: true, code: 200, data: response.data.cdn };
  },
  download: async (link, type = "audio") => {
    if (!savetube.isUrl(link)) return { status: false, code: 400, error: "URL inválida" };
    const id = savetube.youtube(link);
    if (!id) return { status: false, code: 400, error: "No se pudo obtener ID del video" };
    try {
      const cdnx = await savetube.getCDN();
      if (!cdnx.status) return cdnx;
      const cdn = cdnx.data;
      const videoInfo = await savetube.request(`https://${cdn}${savetube.api.info}`, {
        url: `https://www.youtube.com/watch?v=${id}`,
      });
      if (!videoInfo.status) return videoInfo;
      const decrypted = await savetube.crypto.decrypt(videoInfo.data.data);
      const downloadData = await savetube.request(`https://` + cdn + savetube.api.download, {
        id,
        downloadType: type === "audio" ? "audio" : "video",
        quality: type === "audio" ? "128" : "720", // Calidad de video a 720
        key: decrypted.key,
      });
      if (!downloadData.data.data?.downloadUrl)
        return { status: false, code: 500, error: "No se pudo obtener link de descarga" };
      return {
        status: true,
        code: 200,
        result: {
          title: decrypted.title || "Desconocido",
          format: type === "audio" ? "mp3" : "mp4",
          download: downloadData.data.data.downloadUrl,
          thumbnail: decrypted.thumbnail || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
          duration: decrypted.duration,
        },
      };
    } catch (error) {
      return { status: false, code: 500, error: error.message };
    }
  },
};