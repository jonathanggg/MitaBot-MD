
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

let handler = async (m, { conn, usedPrefix, command }) => {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || "";

    if (!/image/.test(mime) && mime !== "image/webp") {
        return m.reply(`Reponde a una imagen von el comando: *#${usedPrefix + command}*`);
    }

    if (mime === "image/webp") {
        if (q.isAnimated) return m.reply("❌ Los stickers GIF no se pueden eliminar del fondo.");
    }

    await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

    let media = await q.download();
    let result = await removeBg(media);

    if (!result?.data?.cutoutUrl) {
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
        return m.reply("No se pudieron recuperar los resultados de la eliminación del fondo!");
    }

    let buffer = await conn.getFile(result.data.cutoutUrl).then(a => a.data);

    await conn.sendMessage(m.chat, { react: { text: "✔️", key: m.key } });

    conn.sendFile(m.chat, buffer, 'removebg.png', '✔️ Fondo removido exitosamente !', m);
};

handler.help = ['removebg', 'rmbg'];
handler.tags = ['tools'];
handler.command = ['removebg', 'rmbg']
handler.limit = true;
export default handler;

async function removeBg(buffer) {
    try {
        const form = new FormData();
        form.append('file', buffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
        });

        const { data } = await axios.post(
            'https://removebg.one/api/predict/v2',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10)',
                    accept: 'application/json, text/plain, */*',
                    'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
                    platform: 'PC',
                    'sec-ch-ua-platform': '"Android"',
                    origin: 'https://removebg.one',
                    referer: 'https://removebg.one/upload'
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            }
        );

        return data;
    } catch {
        return null;
    }
}
