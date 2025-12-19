let handler = async (m, { conn, usedPrefix, command }) => {
    try {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || ''
        if (!/audio/.test(mime)) return m.reply(`*Responde a un audio con el comando: #${usedPrefix + command}*`)
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

        let media = await q.download()
        let form = new FormData()
        form.append('file', new Blob([media]), 'audio.mp3')
        form.append('sample_size', '118784')

        let res = await fetch('https://api.doreso.com/humming', {
            method: 'POST',
            headers: {
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
                'accept': 'application/json, text/plain, */*',
                'origin': 'https://www.aha-music.com',
                'referer': 'https://www.aha-music.com/'
            },
            body: form
        })

        let json = await res.json()

        if (!json?.data?.title) {
            return m.reply(`*🍂 No se pudo detectar la música*`)
        }

        let hasil = `
*🎵 WHAT MUSIC DETECTADO*
*🎤 Artista:* ${json.data.artists || 'Tidak Diketahui'}
*🎧 Titulo:* ${json.data.title || 'Tidak Diketahui'}
*🆔 Track ID:* ${json.data.acrid}
`.trim()

        await m.reply(hasil)

    } catch (e) {
        m.reply(`*🍂 Se produjo un error al detectar música*`)
    } finally {
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } })
    }
}

handler.help = ['whatmusic'];
handler.tags = ['tools'];
handler.command = ['whatmusic', 'shazam', 'wmusic']
handler.limit = true;

export default handler
