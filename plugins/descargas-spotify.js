import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {
if (!text) throw m.reply(`${emoji} Por favor, ingresa el nombre de una canción de Spotify.`);

let ouh = await fetch(`https://api.nekorinn.my.id/downloader/spotifyplay?q=${text}`)
let gyh = await ouh.json()

await conn.sendMessage(m.chat, { audio: { url: gyh.result.downloadUrl }, mimetype: 'audio/mpeg' }, { quoted: m });

}
handler.help = ['spotify *<texto>*']
handler.tags = ['descargas']
handler.command = ['spotify']

export default handler
