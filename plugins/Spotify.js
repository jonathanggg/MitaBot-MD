/**
 * 📀 Plugin: Spotify Search (spotdown.org)
 * 📌 Base: https://spotdown.org
 * 💬 Nota: Jangan hapus wm bangss 😎
 */

import axios from 'axios';

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `🧩 Ejemplo:\n${usedPrefix + command} Let down`;

  try {
    const res = await axios.get('https://spotdown.org/api/song-details', {
      params: { url: text },
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://spotdown.org/search',
      }
    });

    const song = res.data;
    if (!song || !song.title) throw 'No se encontraron resultados 😿';

    let info = `
🎶 *${song.title}*
👤 *Artista:* ${song.artist || 'Desconocido'}
💽 *Álbum:* ${song.album || 'No disponible'}
🕐 *Duración:* ${song.duration || 'N/A'}
🔗 *Enlace:* ${song.url || text}
`.trim();

    await conn.reply(m.chat, info, m);

    // Si tiene portada, la envía
    if (song.cover) {
      await conn.sendFile(m.chat, song.cover, 'cover.jpg', song.title, m);
    }

  } catch (error) {
    console.error(error);
    throw `❌ Error al obtener detalles de la canción.\n${error.message}`;
  }
};

handler.help = ['spotify <texto>'];
handler.tags = ['tools', 'music'];
handler.command = /^(spotify|spotifys|spotidown|song)$/i;

export default handler;
