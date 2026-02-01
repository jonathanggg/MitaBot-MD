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
  if (!text) return m.reply(`✳️ Ingresa el nombre del audio o video.\nEjemplo: *${usedPrefix + command} Confess your love*`)

  await m.reply('*🔍 Buscando contenido...*')

  try {
    const search = await yts(text)
    if (!search.videos.length) throw new Error('No se encontró el video, intenta con otro título.')

    const video = search.videos[0]
    const videoUrl = video.url

    global.db.data.users[m.sender] = global.db.data.users[m.sender] || {}
    global.db.data.users[m.sender].lastVideo = videoUrl
    global.db.data.users[m.sender].lastVideoTime = Date.now()

    const pp = await prepareWAMessageMedia(
      { image: { url: video.thumbnail } },
      { upload: conn.waUploadToServer }
    )

    const caption = `
*🎵 Título:* ${video.title}
*👤 Canal:* ${video.author.name}
*⏱️ Duración:* ${video.timestamp}
*👁️ Vistas:* ${video.views.toLocaleString()}
*📅 Publicado:* ${video.ago}

👇 *Selecciona una opción abajo:*
    `.trim()

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
  
  const user = global.db.data.users[m.sender]
  if (!user || !user.lastVideo) return
  
  let text = m.text.trim()
  
  // Mapeo de respuestas rápidas a IDs
  if (text === "🎵 Audio MP3") text = '1'
  if (text === "🎬 Video MP4") text = '2'
  if (text === "📄 Audio Doc") text = '3'
  if (text === "📁 Video Doc") text = '4'
  if (text === "🎙️ Nota de Voz") text = '5'
  
  if (!['1', '2', '3', '4', '5'].includes(text)) return
  
  const TIMEOUT = 5 * 60 * 1000
  const elapsedTime = Date.now() - (user.lastVideoTime || 0)
  
  if (elapsedTime > TIMEOUT) {
    delete user.lastVideo
    delete user.lastVideoTime
    return m.reply('⏱️ El tiempo para descargar este video ha expirado. Busca de nuevo.')
  }
  
  const url = user.lastVideo
  delete user.lastVideo
  delete user.lastVideoTime
  
  if (text === '1') {
    await m.reply('*🎧 Descargando audio...*')
    try {
      const dl = await savetube.download(url, 'audio')
      if (!dl.status) throw new Error(dl.error || 'Fallo en la API de descarga.')
      
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
  
  if (text === '2') {
    await m.reply('*🎬 Descargando video...*')
    try {
      const dl = await savetube.download(url, 'video')
      if (!dl.status) throw new Error(dl.error || 'Fallo en la API de descarga.')
      
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
  
  if (text === '3') {
    await m.reply('*📄 Descargando documento de audio...*')
    try {
      const dl = await savetube.download(url, 'audio')
      if (!dl.status) throw new Error(dl.error || 'Fallo en la API de descarga.')
      
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
  
  if (text === '4') {
    await m.reply('*📁 Descargando documento de video...*')
    try {
      const dl = await savetube.download(url, 'video')
      if (!dl.status) throw new Error(dl.error || 'Fallo en la API de descarga.')
      
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
  
  if (text === '5') {
    await m.reply('*🎙️ Procesando nota de voz...*')
    try {
      const dl = await savetube.download(url, 'audio')
      if (!dl.status) throw new Error(dl.error || 'Fallo en la API de descarga.')
      
      // Descargamos y convertimos para asegurar compatibilidad de nota de voz
      const response = await axios.get(dl.result.download, { responseType: 'arraybuffer' })
      const tempDir = path.join(process.cwd(), 'tmp')
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)
      
      const inputFile = path.join(tempDir, `${Date.now()}_in.mp3`)
      const outputFile = path.join(tempDir, `${Date.now()}_out.opus`)
      
      fs.writeFileSync(inputFile, response.data)
      
      try {
        await execPromise(`ffmpeg -i "${inputFile}" -c:a libopus -b:a 128k -vbr on -compression_level 10 "${outputFile}"`)
        
        await conn.sendMessage(m.chat, {
            audio: fs.readFileSync(outputFile),
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true 
          }, { quoted: m })
          
        if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile)
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile)
      } catch (err) {
        // Fallback si falla ffmpeg o no está instalado
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

// NUEVO SCRAPER INTEGRADO PARA USO DEL BOT
const savetube = {
  // Key estática para desencriptar
  key: Buffer.from('C5D58EF67A7584E4A29F6C35BBC4EB12', 'hex'),

  decrypt: (enc) => {
    const b = Buffer.from(enc.replace(/\s/g, ''), 'base64')
    const iv = b.subarray(0, 16)
    const data = b.subarray(16)
    const d = crypto.createDecipheriv('aes-128-cbc', savetube.key, iv)
    return JSON.parse(Buffer.concat([d.update(data), d.final()]).toString())
  },

  download: async (url, type = 'audio') => {
    try {
      // 1. Obtener CDN Random
      const random = await axios.get('https://media.savetube.vip/api/random-cdn', {
        headers: {
          origin: 'https://save-tube.com',
          referer: 'https://save-tube.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
        }
      })
      const cdn = random.data.cdn

      // 2. Obtener Info del video y desencriptar
      const info = await axios.post(`https://${cdn}/v2/info`, { url }, {
        headers: {
          'Content-Type': 'application/json',
          origin: 'https://save-tube.com',
          referer: 'https://save-tube.com/',
          'User-Agent': 'Mozilla/5.0'
        }
      })

      if (!info.data || !info.data.status) return { status: false, error: 'Video no encontrado en API.' }
      const json = savetube.decrypt(info.data.data)

      // 3. Seleccionar la calidad según el tipo solicitado para no descargar todo
      let formatToDownload
      
      if (type === 'audio') {
        // Buscar preferiblemente MP3 128kbps o el mejor disponible
        formatToDownload = json.audio_formats.find(a => a.quality === 128) || json.audio_formats[0]
      } else {
        // Buscar preferiblemente 720p, si no 480p, si no el mejor disponible
        formatToDownload = json.video_formats.find(v => v.quality === 720) || 
                           json.video_formats.find(v => v.quality === 480) || 
                           json.video_formats[0]
      }

      if (!formatToDownload) return { status: false, error: 'Formato no disponible.' }

      // 4. Solicitar el link de descarga específico
      const dlRes = await axios.post(`https://${cdn}/download`, {
          id: json.id,
          key: json.key,
          downloadType: type, // 'audio' o 'video'
          quality: String(formatToDownload.quality)
        }, {
        headers: {
          'Content-Type': 'application/json',
          origin: 'https://save-tube.com',
          referer: 'https://save-tube.com/',
          'User-Agent': 'Mozilla/5.0'
        }
      })

      const downloadUrl = dlRes.data?.data?.downloadUrl

      if (!downloadUrl) return { status: false, error: 'No se pudo generar el enlace.' }

      return {
        status: true,
        result: {
          title: json.title,
          duration: json.duration,
          thumbnail: json.thumbnail,
          download: downloadUrl,
          quality: formatToDownload.label
        }
      }

    } catch (e) {
      return { status: false, error: e.message }
    }
  }
}