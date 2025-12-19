import axios from 'axios';
import cheerio from 'cheerio';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`⚠️ *Ingresa el nombre del fondo de pantalla que buscas.*\n\nEjemplo:\n${usedPrefix + command} Naruto`);

    await m.react('🔍');

    try {
        let wallpapers = await WallpaperFlare(text);

        if (!wallpapers || wallpapers.length === 0) {
            return m.reply("❌ *No se encontraron resultados para tu búsqueda.*");
        }

        let result = wallpapers[Math.floor(Math.random() * wallpapers.length)];

        let txt = `🎨 *Wallpaper Search* 🎨\n\n` +
                  `📌 *Título:* ${result.caption}\n` +
                  `📐 *Resolución:* ${result.resolution}\n` +
                  `📁 *Tamaño:* ${result.fileSize || 'Desconocido'}\n` +
                  `🎞 *Formato:* ${result.format}`;

        await conn.sendMessage(m.chat, { 
            image: { url: result.imageUrl }, 
            caption: txt 
        }, { quoted: m });

        await m.react('✅');

    } catch (e) {
        console.error(e);
        await m.react('❌');
        m.reply("Ocurrió un error al buscar el fondo de pantalla.");
    }
}

handler.help = ['wallpaper <texto>'];
handler.tags = ['search', 'img'];
handler.command = ['wallpaper', 'wp', 'fondo']

export default handler;


async function WallpaperFlare(query) {
    try {
        const response = await axios.get(`https://www.wallpaperflare.com/search?wallpaper=${encodeURIComponent(query)}`, {
            headers: {
            
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });
        const html = response.data;
        
        const $ = cheerio.load(html);
        
        const wallpapers = [];
        
        $('li[itemprop="associatedMedia"]').each((index, element) => {
            const $element = $(element);
            
            const resolution = $element.find('.res').text().trim();
            const fileSize = $element.find('meta[itemprop="contentSize"]').attr('content');
            const format = $element.find('meta[itemprop="fileFormat"]').attr('content');
            const caption = $element.find('figcaption').text().trim();
            // WallpaperFlare usa lazy load, la imagen real suele estar en data-src
            const imageUrl = $element.find('img.lazy').attr('data-src') || $element.find('img').attr('src');
            
            if (imageUrl) {
                wallpapers.push({
                    resolution,
                    fileSize,
                    format,
                    caption,
                    imageUrl
                });
            }
        });
        
        return wallpapers;
        
    } catch (error) {
        console.error('Error fetching data:', error.message);
        return [];
    }
                }
