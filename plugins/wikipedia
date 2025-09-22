import axios from "axios"

let handler = async (m, { text, usedPrefix, command }) => {
    if (!text) throw `⚠️ Ejemplo de uso:\n${usedPrefix + command} Colombia`

    try {
        let url = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(text)}`
        let res = await axios.get(url)

        if (res.data.extract) {
            let titulo = `📖 Wikipedia: ${res.data.title}`
            let descripcion = `${res.data.extract}\n\n🌐 ${res.data.content_urls.desktop.page}`

            // Mensaje con encabezado tipo "sobre"
            await conn.sendMessage(m.chat, {
                text: descripcion,
                contextInfo: {
                    externalAdReply: {
                        title: titulo,
                        body: "Resultados desde Wikipedia 📚",
                        thumbnailUrl: res.data.thumbnail?.source || "https://upload.wikimedia.org/wikipedia/commons/6/63/Wikipedia-logo.png",
                        sourceUrl: res.data.content_urls.desktop.page,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })
        } else {
            m.reply("❌ No encontré resultados en Wikipedia.")
        }
    } catch (e) {
        console.error(e)
        m.reply("⚠️ Error al consultar Wikipedia.")
    }
}

handler.help = ["wikipedia <búsqueda>"]
handler.tags = ["buscador"]
handler.command = /^wikipedia$/i

export default handler
