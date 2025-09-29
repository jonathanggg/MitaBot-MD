import fetch from 'node-fetch'
import FormData from 'form-data'

const FIXED_PROMPT = `Create a 1/7 scale commercialized figurine of the characters in the picture, in a realistic style, in a real environment. The figurine is placed on a computer desk. The figurine has a round transparent acrylic base, with no text on the base. The content on the computer screen is the Zbrush modeling process of this figurine. Next to the computer screen is a BANDAI-style toy packaging box printed with the original artwork. The packaging features two-dimensional flat illustrations`

async function uploadImageToCatbox(buffer) {
  const form = new FormData()
  form.append('reqtype', 'fileupload')
  form.append('fileToUpload', buffer, 'file.jpg')

  const res = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: form
  })

  const url = await res.text()
  if (!url.startsWith('http')) throw new Error('❌ error Al subir a catbox')
  return url.trim()
}

let handler = async (m, { conn, usedPrefix, command, text }) => {
  try {
    let url
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''

    if (/^https?:\/\//i.test(text)) {
      url = text
    } else if (mime && mime.startsWith('image/')) {
      m.reply('Espera...')
      let img = await q.download?.()
      if (!img) throw '❌ Error al descargar la imagen.'
      url = await uploadImageToCatbox(img)
    } else {
      return m.reply(`Responde una imagen con el comando *${usedPrefix + command}*`)
    }

    const apiUrl = `https://api.nekolabs.my.id/ai/gemini/nano-banana?prompt=${encodeURIComponent(FIXED_PROMPT)}&imageUrl=${encodeURIComponent(url)}`

    const resApi = await fetch(apiUrl)
    if (!resApi.ok) throw '❌ Error al conectar con el servidor.'
    const json = await resApi.json()
    if (!json.status) throw '❌ Error al procesar imagen.'

    const hasil = json.result
    await conn.sendFile(m.chat, hasil, 'tofigure.jpg', m)
  } catch (e) {
    console.error(e)
    m.reply('❌ Error.')
  }
}

handler.help = ['tofigure']
handler.tags = ['ai']
handler.command = /^tofigure$/i
handler.limit = true

export default handler
