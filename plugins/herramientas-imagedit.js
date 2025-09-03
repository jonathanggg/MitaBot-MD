import axios from 'axios'
import FormData from 'form-data'

async function scrapeApiKey() {
  const targetUrl = 'https://overchat.ai/image/ghibli'
  const { data: htmlContent } = await axios.get(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36'
    }
  })
  const apiKeyRegex = /const apiKey = '([^']+)'/
  const match = htmlContent.match(apiKeyRegex)
  if (!match) throw new Error('ApiKey tidak ditemukan')
  return match[1]
}

async function editImage(buffer, prompt, apiKey) {
  const apiUrl = 'https://api.openai.com/v1/images/edits'
  const form = new FormData()
  form.append('image', buffer, { filename: 'image.png' })
  form.append('prompt', prompt)
  form.append('model', 'gpt-image-1')
  form.append('n', 1)
  form.append('size', '1024x1024')
  form.append('quality', 'medium')

  const response = await axios.post(apiUrl, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${apiKey}`
    }
  })

  const result = response.data
  if (!result?.data?.[0]?.b64_json) throw new Error('Gagal mendapatkan gambar')
  return Buffer.from(result.data[0].b64_json, 'base64')
}

let handler = async (m, { conn, command, text, usedPrefix }) => {
  if (!m.quoted || !/image/.test(m.quoted.mimetype)) {
    if (command === 'imagedit') return m.reply(`Responde a la imagen con el comando.imagedit <promt>`)
    if (command === 'toghibli') return m.reply(`Responde a la imagen con el comando.toghibli`)
  }

  try {
    m.reply('wett')
    const buffer = await m.quoted.download()
    let prompt

    if (command === 'toghibli') {
      prompt = 'Please convert this image into Studio Ghibli art style'
    } else if (command === 'imagedit') {
      if (!text) return m.reply(`Ejemplo: .imagedit Cambiar en una divertida caricatura`)
      prompt = text
    }

    const apiKey = await scrapeApiKey()
    const result = await editImage(buffer, prompt, apiKey)
    await conn.sendFile(m.chat, result, '_zenn?.png', 'done', m, false, { mimetype: 'image/png' })
  } catch (err) {
    m.reply(`Error: ${err.message}`)
  }
}

handler.help = ['imagedit <prompt>', 'toghibli']
handler.tags = ['ai']
handler.command = ['imagedit', 'toghibli']

export default handler
