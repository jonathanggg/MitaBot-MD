import fs from "fs"
import path from "path"
import axios from "axios"
import fetch from "node-fetch"
import FormData from "form-data"

let handler = async (m, { conn, usedPrefix, command }) => {
  const q = m.quoted ? m.quoted : m
  const mime = (q.msg || q).mimetype || ""

  if (!/image\//i.test(mime)) {
    return conn.sendMessage(
      m.chat,
     // { text: `Responde a una imagen con el comando *${usedPrefix + command}*` },
      { quoted: m }
    )
  }

  const reactStart = { react: { text: "⏳", key: m.key } }
  const reactDone  = { react: { text: "✅", key: m.key } }

  let tmpPath
  try {
    await conn.sendMessage(m.chat, reactStart)

    if (!fs.existsSync("./tmp")) fs.mkdirSync("./tmp", { recursive: true })

    const media = await q.download()
    if (!media || media.length === 0) throw new Error("Downloaded media kosong")

    const rawExt = (mime.split("/")[1] || "png").toLowerCase()
    const ext = rawExt === "jpeg" ? "jpg" : rawExt
    tmpPath = path.join("./tmp", `tofigure_${m.sender}.${ext}`)
    fs.writeFileSync(tmpPath, media)

    const imageUrl = await uploadToUguu(tmpPath)
    if (!imageUrl) throw new Error("Gagal upload gambar")

    const { data } = await axios.get(
      `https://api.deline.my.id/ai/figurine?url=${encodeURIComponent(imageUrl)}`,
      { timeout: 180000 }
    )
    if (!data?.status) throw new Error(data?.error || "Gagal memproses figurine")

    const outUrl = data?.result?.url
    if (!outUrl) throw new Error("URL hasil tidak ditemukan")

    const outImg = await axios.get(outUrl, { responseType: "arraybuffer", timeout: 120000 })
    const buffer = Buffer.from(outImg.data)

    await conn.sendMessage(
      m.chat,
      {
        image: buffer,
        caption: `*Aquí tienes*`,
        mentions: [m.sender],
      },
      { quoted: m }
    )

  } catch (e) {
    const reason = e?.response?.data || e?.message || String(e)
    await conn.sendMessage(m.chat, { text: `❌ Error:\n\n${reason}` }, { quoted: m })
  } finally {
    if (tmpPath && fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath) } catch {}
    }
    await conn.sendMessage(m.chat, reactDone)
  }
}

handler.help = ["tofigure"]
handler.tags = ["ai"]
handler.command = /^(tofigure)$/i

export default handler

async function uploadToUguu(filePath) {
  const form = new FormData()
  form.append('files[]', fs.createReadStream(filePath))
  const res = await fetch('https://uguu.se/upload.php', { method: 'POST', body: form })
  if (!res.ok) throw new Error(`Uguu upload failed: ${res.status}`)
  const json = await res.json()
  if (!json.files || !json.files[0] || !json.files[0].url) throw new Error('Respuesta invalida')
  return json.files[0].url
}