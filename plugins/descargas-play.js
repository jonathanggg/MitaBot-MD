import yts from 'yt-search'
import axios from 'axios'
import crypto from 'crypto'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { prepareWAMessageMedia, generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'

const execPromise = promisify(exec)

let handler = async (m, { conn, text, command, usedPrefix }) => {
  if (!text) return m.reply(`✳️ Ingresa el nombre del audio o video.\nEjemplo: *${usedPrefix + command} Bad Bunny*`)

  await m.reply('*🔍 Buscando contenido...*')

  try {
    const search = await yts(text)
    if (!search.videos.length) throw new Error('No se encontró el video, intenta con otro título.')

    const video = search.videos[0]
    const videoUrl = video.url

    // Guardar la URL temporalmente en la base de datos del usuario
    global.db.data.users[m.sender] = global.db.data.users[m.sender] || {}
    global.db.data.users[m.sender].lastVideo = videoUrl
    global.db.data.users[m.sender].lastVideoTime = Date.now()

    // Preparar la imagen para el mensaje interactivo
    const pp = await prepareWAMessageMedia(
      { image: { url: video.thumbnail } },
      { upload: conn.waUploadToServer }
    )

    // Definir el texto del mensaje
    const caption = `
*🎵 Título:* ${video.title}
*👤 Canal:* ${video.author.name}
*⏱️ Duración:* ${video.timestamp}
*👁️ Vistas:* ${video.views.toLocaleString()}
*📅 Publicado:* ${video.ago}

👇 *Selecciona una opción abajo:*
    `.trim()

    // Crear los botones interactivos
    const buttons = [
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "🎵 Audio MP3",
          id: "1"
        })
      },
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "🎬 Video MP4",
          id: "2"
        })
      },
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "📄 Audio Doc",
          id: "3"
        })
      },
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "📁 Video Doc",
          id: "4"
        })
      },
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "🎙️ Nota de Voz",
          id: "5"
        })
      }
    ]

    // Generar el mensaje interactivo
    const msg = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2
          },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({
              text: caption
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({
              text: global?.wm || 'YouTube Downloader'
            }),
            header: proto.Message.InteractiveMessage.Header.create({
              hasMediaAttachment: true,
              ...pp
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons: buttons
            })
          })
        }
      }
    }, { quoted: m })

    // Enviar el mensaje
    await conn.relayMessage(m.chat, msg.message, {})

  } catch (e) {
    console.error('Error en búsqueda:', e)
    await m.reply(`❌ Ocurrió un error.\n*Detalles:* ${e.message}`)
  }
}

handler.help = ['play <título>', 'ytmp3 <título>']
handler.tags = ['downloader']
handler.command = ['play', 'ytmp3']
handler.limit = true
handler.daftar = true

export default handler

handler.before = async function (m, { conn }) {
  if (!m.text) return
  
  // Verificar si el usuario tiene una búsqueda pendiente
  const user = global.db.data.users[m.sender]
  if (!user || !user.lastVideo) return
  
  const text = m.text.trim()
  
  // Validar que la respuesta sea 1, 2, 3, 4 o 5 (o que venga del botón)
  if (!['1', '2', '3', '4', '5'].includes(text)) return
  
  // Verificar tiempo de expiración (5 minutos)
  const TIMEOUT = 5 * 60 * 1000
  const elapsedTime = Date.now() - (user.lastVideoTime || 0)
  
  if (elapsedTime > TIMEOUT) {
    delete user.lastVideo
    delete user.lastVideoTime
    return m.reply('⏱️ El tiempo para descargar este video ha expirado. Busca de nuevo.')
  }
  
  const url = user.lastVideo
  // Importante: Borramos la variable para evitar descargas dobles accidentales
  delete user.lastVideo
  delete user.lastVideoTime
  
  // --- Opción 1: Audio MP3 ---
  if (text === '1') {
    await m.reply('*🎧 Descargando audio...*')
    try {
      const dl = await savetube.download(url, 'audio')
      if (!dl.status) throw new Error('Fallo en la API de descarga.')
      
      await conn.sendMessage(m.chat, {
          audio: { url: dl.result.download },
          mimetype: 'audio/mpeg',
          fileName: `${sanitizeFilename(dl.result.title)}.mp3`,
        }, { quoted: m })
    } catch (e) {
      console.error(e)
      await m.reply(`❌ Error: ${e.message}`)
    }
    return true
  }
  
  // --- Opción 2: Video MP4 ---
  if (text === '2') {
    await m.reply('*🎬 Descargando video...*')
    try {
      const dl = await savetube.download(url, 'video')
      if (!dl.status) throw new Error('Fallo en la API de descarga.')
      
      await conn.sendMessage(m.chat, {
          video: { url: dl.result.download },
          mimetype: 'video/mp4',
          fileName: `${sanitizeFilename(dl.result.title)}.mp4`,
          caption: `🎬 *${dl.result.title}*`
        }, { quoted: m })
    } catch (e) {
      console.error(e)
      await m.reply(`❌ Error: ${e.message}`)
    }
    return true
  }
  
  // --- Opción 3: Audio Documento ---
  if (text === '3') {
    await m.reply('*📄 Descargando documento de audio...*')
    try {
      const dl = await savetube.download(url, 'audio')
      if (!dl.status) throw new Error('Fallo en la API de descarga.')
      
      await conn.sendMessage(m.chat, {
          document: { url: dl.result.download },
          mimetype: 'audio/mpeg',
          fileName: `${sanitizeFilename(dl.result.title)}.mp3`,
          caption: `📄 ${dl.result.title}`
        }, { quoted: m })
    } catch (e) {
      console.error(e)
      await m.reply(`❌ Error: ${e.message}`)
    }
    return true
  }
  
  // --- Opción 4: Video Documento ---
  if (text === '4') {
    await m.reply('*📁 Descargando documento de video...*')
    try {
      const dl = await savetube.download(url, 'video')
      if (!dl.status) throw new Error('Fallo en la API de descarga.')
      
      await conn.sendMessage(m.chat, {
          document: { url: dl.result.download },
          mimetype: 'video/mp4',
          fileName: `${sanitizeFilename(dl.result.title)}.mp4`,
          caption: `📁 ${dl.result.title}`
        }, { quoted: m })
    } catch (e) {
      console.error(e)
      await m.reply(`❌ Error: ${e.message}`)
    }
    return true
  }
  
  // --- Opción 5: Nota de Voz (Con FFmpeg) ---
  if (text === '5') {
    await m.reply('*🎙️ Procesando nota de voz...*')
    try {
      const dl = await savetube.download(url, 'audio')
      if (!dl.status) throw new Error('Fallo en la API de descarga.')
      
      const response = await axios.get(dl.result.download, { responseType: 'arraybuffer' })
      const tempDir = path.join(process.cwd(), 'tmp')
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)
      
      const inputFile = path.join(tempDir, `${Date.now()}_in.mp3`)
      const outputFile = path.join(tempDir, `${Date.now()}_out.opus`)
      
      fs.writeFileSync(inputFile, response.data)
      
      try {
        // Convertir a OPUS para que sea nota de voz real
        await execPromise(`ffmpeg -i "${inputFile}" -c:a libopus -b:a 128k -vbr on -compression_level 10 "${outputFile}"`)
        
        await conn.sendMessage(m.chat, {
            audio: fs.readFileSync(outputFile),
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true 
          }, { quoted: m })
          
        fs.unlinkSync(inputFile)
        fs.unlinkSync(outputFile)
      } catch (err) {
        // Fallback si no hay ffmpeg
        await conn.sendMessage(m.chat, {
            audio: { url: dl.result.download },
            mimetype: 'audio/mp4',
            ptt: true 
          }, { quoted: m })
        if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile)
      }
    } catch (e) {
      console.error(e)
      await m.reply(`❌ Error: ${e.message}`)
    }
    return true
  }
}

function sanitizeFilename(name = 'archivo') {
  return name.replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 100)
}

// ======== API SAVETUBE ========
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
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.90 Safari/537.36",
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
    if (!id) return { status: false, code: 400, error: "No se pudo obtener ID" };
    try {
      const cdnx = await savetube.getCDN();
      if (!cdnx.status) return cdnx;
      const cdn = cdnx.data;
      const videoInfo = await savetube.request(`https://${cdn}${savetube.api.info}`, {
        url: `https://www.youtube.com/watch?v=${id}`,
      });
      if (!videoInfo.status) return videoInfo;
      const decrypted = await savetube.crypto.decrypt(videoInfo.data.data);
      const downloadData = await savetube.request(`https://${cdn}${savetube.api.download}`, {
        id,
        downloadType: type === "audio" ? "audio" : "video",
        quality: type === "audio" ? "128" : "720",
        key: decrypted.key,
      });
      if (!downloadData.data.data?.downloadUrl)
        return { status: false, code: 500, error: "No se encontró enlace de descarga" };
      return {
        status: true,
        code: 200,
        result: {
          title: decrypted.title || "YouTube Media",
          download: downloadData.data.data.downloadUrl,
          duration: decrypted.duration,
        },
      };
    } catch (error) {
      return { status: false, code: 500, error: error.message };
    }
  },
};