import axios from 'axios'
import FormData from 'form-data'
import crypto from 'crypto'

const BASE_URL = 'https://ai-apps.codergautam.dev'
const PROMPT = 'a commercial 1/7 scale figurine of the character in the picture was created, depicting a realistic style and a realistic environment. The figurine is placed on a computer desk with a round transparent acrylic base. There is no text on the base. The computer screen shows the Zbrush modeling process of the figurine. Next to the computer screen is a BANDAI-style toy box with the original painting printed on it.'

function acakName(len = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function autoregist() {
  const uid = crypto.randomBytes(12).toString('hex')
  const email = `gienetic${Date.now()}@nyahoo.com`

  const payload = {
    uid,
    email,
    displayName: acakName(),
    photoURL: 'https://i.pravatar.cc/150',
    appId: 'photogpt'
  }

  const res = await axios.post(`${BASE_URL}/photogpt/create-user`, payload, {
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json',
      'user-agent': 'okhttp/4.9.2'
    }
  })

  if (res.data.success) return uid
  throw new Error('Registro fallido, amigo: ' + JSON.stringify(res.data))
}

async function img2img(imageBuffer, prompt) {
  const uid = await autoregist()

  const form = new FormData()
  form.append('image', imageBuffer, { filename: 'kenny.jpg', contentType: 'image/jpeg' })
  form.append('prompt', prompt)
  form.append('userId', uid)

  const uploadRes = await axios.post(`${BASE_URL}/photogpt/generate-image`, form, {
    headers: {
      ...form.getHeaders(),
      'accept': 'application/json',
      'user-agent': 'okhttp/4.9.2',
      'accept-encoding': 'gzip'
    }
  })

  if (!uploadRes.data.success) throw new Error(JSON.stringify(uploadRes.data))

  const { pollingUrl } = uploadRes.data
  let status = 'pending'
  let resultUrl = null

  while (status !== 'Ready') {
    const pollRes = await axios.get(pollingUrl, {
      headers: { 'accept': 'application/json', 'user-agent': 'okhttp/4.9.2' }
    })
    status = pollRes.data.status
    if (status === 'Ready') {
      resultUrl = pollRes.data.result.url
      break
    }
    await new Promise(r => setTimeout(r, 3000))
  }

  if (!resultUrl) throw new Error('Falló al obtener el resultado de la imagen')

  const resultImg = await axios.get(resultUrl, { responseType: 'arraybuffer' })
  return Buffer.from(resultImg.data)
}

const handler = async (m, { conn, args }) => {
  try {
    const mime = m.quoted?.mimetype || ''
    if (!/image/.test(mime)) {
      return m.reply('❀ Responde a la imagen con el comando: #tofigure')
    }

    m.reply('《✧》 Espera...')

    const imageBuffer = await m.quoted.download()
    if (!imageBuffer) return m.reply('Error al descargar la imagen')

    const hasil = await img2img(imageBuffer, PROMPT)
    await conn.sendFile(m.chat, hasil, 'zen.png', '', m)

  } catch (e) {
    m.reply(`Error: ${e.message}`)
  }
}

handler.help = ['tofigure']
handler.tags = ['ai']
handler.command = ['tofigure']

export default handler
