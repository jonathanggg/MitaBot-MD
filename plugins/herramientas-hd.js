import fetch from 'node-fetch';
import uploadImage from '../lib/uploadImage.js';

async function handler(m, { conn, usedPrefix, command }) {
  try {
    const q = m.quoted ? m.quoted : m;
    const mime = (q.msg || q).mimetype || q.mediaType || '';

    if (/^image/.test(mime) && !/webp/.test(mime)) {
      m.reply('⏳ Procesando imagen, por favor espera...');

      const img = await q.download();
      const out = await uploadImage(img);
      if (!out) throw new Error('¡Error al subir la imagen!');

      let enhancedImageUrl;
      let caption = '';

      try {
        const api = await fetch(`https://api.platform.web.id/remini?imageUrl=${encodeURIComponent(out)}&scale=2&faceEnhance=true`);
        const res = await api.json();

        if (res.status === "success" && res.result) {
          enhancedImageUrl = res.result;
          caption = `✅ Procesado con éxito\n📌 Marca de agua: ${res.wm || 'N/A'}`;
        } else {
          throw new Error('Error en Remini');
        }
      } catch (err) {
        console.log('❌ Remini falló, usando alternativa upscale2:', err.message); // el tamaño es muy grande, fallback si falla el envío🧢🧢

        const apiUrl = `https://api.platform.web.id/upscale2?imageUrl=${encodeURIComponent(out)}&denoice_strength=1&resolution=6`;
        const response = await fetch(apiUrl);
        const json = await response.json();

        if (!json.result) throw new Error('Error en Upscale2');

        enhancedImageUrl = json.result;
        caption = '✅ Mejora de calidad de imagen exitosa';
      }

      const imageResponse = await fetch(enhancedImageUrl);
      const imageBuffer = await imageResponse.buffer();

      await conn.sendMessage(m.chat, {
        image: imageBuffer,
        caption,
        mimetype: 'image/png'
      }, { quoted: m });

    } else {
      m.reply(`${emoji}Envía una imagen con el texto *${usedPrefix + command}* o etiqueta una imagen ya enviada.`);
    }
  } catch (e) {
    console.error(e);
    m.reply(`❌ Error: ${e.message}`);
  }
}

handler.help = ['remini'];
handler.tags = ['ai'];
handler.command = ['upscale', 'hd', 'remini'];
handler.limit = true;

export default handler;
