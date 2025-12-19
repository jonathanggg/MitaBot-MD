import { fileTypeFromBuffer } from "file-type"

let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        if (!text) return m.reply(`*Ejemplo de uso: ${usedPrefix + command} https://vm.tiktok.com/ZMDLY298d/*`)
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

        let res = await fetch('https://auto-download-all-in-one.p.rapidapi.com/v1/social/autolink', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json; charset=utf-8',
                'user-agent': 'Mozilla/5.0',
                'x-rapidapi-host': 'auto-download-all-in-one.p.rapidapi.com',
                'x-rapidapi-key': '1dda0d29d3mshc5f2aacec619c44p16f219jsn99a62a516f98'
            },
            body: JSON.stringify({ url: text })
        })

        let json = await res.json()

        let medias =
            json?.medias ||
            json?.data?.medias ||
            json?.result?.links ||
            []

        if (!Array.isArray(medias) || medias.length === 0) {
            throw 'Medio no encontrado o enlace no compatible'
        }

        let source = json.source || json.platform || '-'
        let title = json.title || '-'

        let video = medias.filter(v => (v.type || v.mime || '').toLowerCase().includes('video'))
        let audio = medias.filter(v => (v.type || v.mime || '').toLowerCase().includes('audio'))
        let image = medias.filter(v => (v.type || v.mime || '').toLowerCase().includes('image'))

        if (video.length > 0) {
            let bestVideo = video.sort((a, b) =>
                (b.resolution || '').localeCompare(a.resolution || '')
            )[0]

            let videoRes = await fetch(bestVideo.url || bestVideo.link)
            let buffer = Buffer.from(await videoRes.arrayBuffer())
            let fileType = await fileTypeFromBuffer(buffer)

            let caption =
                `*🎯 ALL IN ONE DOWNLOADER*\n\n` +
                `*🔗 Fuente:* ${source}\n` +
                `*📛 Titulo:* ${title}\n` +
                `*🎥 Tipo:* video\n` +
                `*📐 Calidad:* ${bestVideo.quality || bestVideo.resolution || '-'}`

            await conn.sendMessage(m.chat, {
                video: buffer,
                mimetype: fileType?.mime || 'video/mp4',
                caption
            }, { quoted: m })

            return
        }

        if (audio.length > 0) {
            let bestAudio = audio[0]

            let audioRes = await fetch(bestAudio.url || bestAudio.link)
            let buffer = Buffer.from(await audioRes.arrayBuffer())
            let fileType = await fileTypeFromBuffer(buffer)

            await conn.sendMessage(m.chat, {
                audio: buffer,
                mimetype: fileType?.mime || 'audio/mpeg'
            }, { quoted: m })

            return
        }

        if (image.length > 0) {
            let bestImage = image[0]

            let caption =
                `*🎯 ALL IN ONE DOWNLOADER*\n\n` +
                `*🔗 Fuente:* ${source}\n` +
                `*📛 Titulo:* ${title}\n` +
                `*🖼️ Tipo:* image`

            await conn.sendMessage(m.chat, {
                image: { url: bestImage.url || bestImage.link },
                caption
            }, { quoted: m })
        }
    } catch (e) {
        await m.reply(`*🍂 No se pudo procesar el descargador*\n\n*Razon:* ${e}`)
    } finally {
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } })
    }
}

handler.help = ['aio'];
handler.tags = ['downloader'];
handler.command = ['aio', 'allinone', 'dl']
handler.limit = true;

export default handler;
