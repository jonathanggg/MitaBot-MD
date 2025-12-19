const fs = require'fs';
const axios = require'axios';
const FormData = require'form-data';

/**
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function uploadCatbox(filePath) {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", fs.createReadStream(filePath));

    const res = await axios.post("https://catbox.moe/user/api.php", form, {
        headers: form.getHeaders(),
    });

    if (!res.data.startsWith("https://"))
        throw new Error("No se pudo subir la imagen a Catbox");

    return res.data;
}

const allEndpoints = {
    '1': {
        url: 'https://api-faa.my.id/faa/tofigura?url=',
        name: 'Figura Style V1',
        description: 'Figura efecto versión 1 - Estilo clásico'
    },
    '2': {
        url: 'https://api-faa.my.id/faa/tofigurav2?url=',
        name: 'Figura Style V2',
        description: 'Efectos de figura versión 2 - Estilo mejorado'
    },
    '3': {
        url: 'https://api-faa.my.id/faa/tofigurav3?url=',
        name: 'Figura Style V3',
        description: 'Figura efecto versión 3 - Estilo Premium'
    }
};

let handler = async (m, { conn, usedPrefix, command, text }) => {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || q.mediaType || '';

    if (!/image\/(jpeg|jpg|png)/i.test(mime)) {
        return m.reply(`Responde una imagen con el comando: *#${usedPrefix + command}*`);
    }

    await m.react('⏳');

    try {
        let version = text?.trim() || '1';
        if (!allEndpoints[version]) version = '1';
        const apiInfo = allEndpoints[version];

        const media = await q.download();
        if (!media) throw new Error('No se pudo descargar la imagen');

        const temp = `./temp_upload.jpg`;
        fs.writeFileSync(temp, media);

        const catboxUrl = await uploadCatbox(temp);

        const apiUrl = `${apiInfo.url}${encodeURIComponent(catboxUrl)}`;

        const result = await axios.get(apiUrl, {
            responseType: "arraybuffer",
        });

        await conn.sendMessage(m.chat, {
            image: result.data,
            mimetype: "image/jpeg",
            caption: `Hasil ${apiInfo.name}`
        }, { quoted: m });

        fs.unlinkSync(temp);
        await m.react('✅');

    } catch (err) {
        console.error(err);
        await m.react('❌');
        m.reply(`Error: ${err.message}`);
    }
};

handler.command = ['tofigure']
handler.help = ['tofigure (reply foto) [1-3]'];
handler.tags = ['ai'];
handler.limit = true;

export default handler;
