

import fetch from 'node-fetch';

let handler = async (m, { conn, args }) => {
    try {
        if (!args[0]) return m.reply("Ingresa el nombre de la canción que deseas descargar.");

        await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

        const query = args.join(" ");
        const url = `https://api.deline.web.id/downloader/spotifyplay?q=${encodeURIComponent(query)}`;
        const r = await fetch(url);
        const json = await r.json();

        if (!json.status) {
            await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
            return m.reply("No se encontró la canción.");
        }

        const meta = json.result.metadata;
        const audioUrl = json.result.dlink;

        let caption = `「✦」Descargando: *${meta.title}*\n\n` +
        `> ✦ Artista: *${meta.artist}*\n` +
        `> ⴵ Duración: *${meta.duration}*\n` +
        `> 🜸 Link: *${meta.url}*`;

        await conn.sendMessage(m.chat, {
            image: { url: meta.cover },
            caption
        }, { quoted: m });

        await conn.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg"
        }, { quoted: m });

        await conn.sendMessage(m.chat, { react: { text: "✔️", key: m.key } });

    } catch (e) {
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
        m.reply(String(e));
    }
};

handler.help = ['plays'];
handler.command = ['plays', 'playspotify', 'splay'];
handler.tags = ['downloader'];

export default handler;