import fetch from 'node-fetch'
import FormData from 'form-data'

const WUAZE_API_KEY = 'sk_Z49RUHfNJxSS0KqBo4y6xobpyyugDtfEndpoint'
const WUAZE_ENDPOINT = 'https://spacny.wuaze.com/api_upload.php'

let handler = async (m) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''
  if (!mime) return conn.reply(m.chat, '💥 Responde a una *Imagen* o *Vídeo.*', m, rcanal)
  await m.react(rwait)
  
  try {
    conn.reply(m.chat, global.wait, m, {
      contextInfo: { 
        externalAdReply: {
          mediaUrl: null, 
          mediaType: 1, 
          showAdAttribution: true,
          title: packname,
          body: wm,
          previewType: 0, 
          thumbnail: icons,
          sourceUrl: channel 
        }
      }
    })

    let media = await q.download()
    
    // Subir archivo usando Wuaze API
    let link = await uploadToWuaze(media, mime)
    
    let img = await (await fetch(`${link}`)).buffer()
    let txt = `乂  *W U A Z E - U P L O A D*  乂\n\n`
        txt += `*» Enlace* : ${link}\n`
        txt += `*» Acortado* : ${await shortUrl(link)}\n`
        txt += `*» Tamaño* : ${formatBytes(media.length)}\n`
        txt += `*» Servicio* : Wuaze\n`
        txt += `*» Tipo* : ${mime}\n\n`
        txt += `> *${dev}*`

    await conn.sendFile(m.chat, img, 'thumbnail.jpg', txt, m, fkontak, rcanal)
    await m.react(done)
    
  } catch (error) {
    console.error('Error uploading to Wuaze:', error)
    await conn.reply(m.chat, `❌ Error al subir archivo: ${error.message}`, m, rcanal)
    await m.react(error)
  }
}

// Función para subir archivos a Wuaze
async function uploadToWuaze(buffer, mimetype) {
  try {
    const formData = new FormData()
    
    // Determinar extensión del archivo
    let extension = 'bin'
    if (mimetype.includes('image/jpeg')) extension = 'jpg'
    else if (mimetype.includes('image/png')) extension = 'png'
    else if (mimetype.includes('image/gif')) extension = 'gif'
    else if (mimetype.includes('video/mp4')) extension = 'mp4'
    else if (mimetype.includes('audio/mpeg')) extension = 'mp3'
    else if (mimetype.includes('application/pdf')) extension = 'pdf'
    
    const filename = `upload_${Date.now()}.${extension}`
    
    // Agregar archivo y API key al form
    formData.append('file', buffer, {
      filename: filename,
      contentType: mimetype
    })
    formData.append('api_key', WUAZE_API_KEY)
    
    const response = await fetch(WUAZE_ENDPOINT, {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders()
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    // Verificar si la respuesta contiene el enlace
    if (result.success && result.url) {
      return result.url
    } else if (result.file_url) {
      return result.file_url
    } else if (result.link) {
      return result.link
    } else {
      throw new Error(result.message || 'Error desconocido en la respuesta del servidor')
    }
    
  } catch (error) {
    throw new Error(`Error uploading to Wuaze: ${error.message}`)
  }
}

handler.help = ['wuaze']
handler.tags = ['transformador']
handler.register = true
handler.command = ['wuaze', 'wuazeup']

export default handler

function formatBytes(bytes) {
  if (bytes === 0) {
    return '0 B';
  }
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
}

async function shortUrl(url) {
  try {
    let res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`)
    return await res.text()
  } catch {
    return url // Si falla el acortador, devolver URL original
  }
}
