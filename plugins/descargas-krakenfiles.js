import axios from 'axios'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0])
        throw `Ejemplo de uso ${usedPrefix}${command} https://krakenfiles.com/view/abYn6V0okV/file.html`;

    let kf = `https://api.ryzumi.vip/api/downloader/kfiles?url=${encodeURIComponent(args[0])}`;

    m.reply(wait);

    try {
        let res = await axios.get(kf);
        let data = res.data;

        if (!data || !data.metadata || !data.metadata.download) {
            throw 'Intenta mas tarde.';
        }

        let { filename, file_size, type, upload_date, last_download_date, download } = data.metadata;
        let apiHeaders = data.headers;

        let caption = `
*💌 Nombre:* ${filename}
*📊 Tamaño:* ${file_size}
*🗂️ Extension:* ${type}
*📨 Subido:* ${upload_date}
*⌛ Ultima descarga:* ${last_download_date}
    `.trim();

        let fileRes = await axios.get(download, {
            headers: apiHeaders,
            responseType: 'arraybuffer'
        });

        m.reply(caption);
        await conn.sendFile(m.chat, Buffer.from(fileRes.data), filename, '', m, null, { mimetype: type, asDocument: true });
    } catch (e) {
        throw 'Error: ' + e;
    }
};

handler.help = ['krakenfiles'].map(v => v + ' <url>');
handler.tags = ['downloader'];
handler.command = ['kfiles', 'kf', 'krakenfiles']
handler.limit = true

export default handler
