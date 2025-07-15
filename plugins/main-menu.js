//Código creado por JonathanG, dejen creditos hdp >:v

const menuVideos = [
    'https://files.catbox.moe/lux4g2.mp4',
    'https://files.catbox.moe/1upmwh.mp4',
    'https://files.catbox.moe/lux4g2.mp4'
];
const menuImages = [
    'https://files.catbox.moe/s01djf.jpg',
    'https://files.catbox.moe/1tz4tw.jpeg',
    'https://files.catbox.moe/7yjot9.jpg'
];
// --- --- --- --- --- --- --- --- --- --- -

// Función auxiliar para el tiempo de actividad (uptime) - tomada de Menu 2
function clockString(ms) {
    let d = isNaN(ms) ? '--' : Math.floor(ms / 86400000)
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
    // return [d, 'd ', h, 'h ', m, 'm ', s, 's '].map(v => v.toString().padStart(2, 0)).join('') // Formato con días
     return [h, 'h ', m, 'm ', s, 's '].map(v => v.toString().padStart(2, 0)).join(''); // Formato horas, minutos, segundos
}


let handler = async (m, { conn, args }) => {
    let userId = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender;
    let user = global.db.data.users[userId]; // Asume que global.db.data.users existe
    let name = conn.getName(userId);
    let _uptime = process.uptime() * 1000;
    let uptime = clockString(_uptime);
    let totalreg = Object.keys(global.db.data.users).length; // Asume global.db.data.users
    let totalCommands = Object.values(global.plugins).filter((v) => v.help && v.tags).length; // Asume global.plugins
    
    let botSettings = global.db.data.settings[conn.user.jid] || {};
    let bottName = botSettings.botName || botname


    let txt = `
¡Hola ${name}! 👋 Me llamo ${bottName}.

Uptime: ${uptime}
Usuarios Registrados: ${totalreg}
Comandos Totales: ${totalCommands}

Aquí tienes el menú principal:
*(Aquí iría el resto de tu texto del menú)*
`.trim();
let bot = global.db.data.settings[conn.user.jid]
    // --- Lógica para elegir aleatoriamente entre video/gif o imagen ---
    const useVideo = Math.random() < 0.4; // 40% de probabilidad de usar video/gif
    let messageOptions = {};
    let selectedMediaUrl;

    if (useVideo && menuVideos.length > 0) {
        // --- Preparar mensaje con Video/GIF ---
        selectedMediaUrl = menuVideos[Math.floor(Math.random() * menuVideos.length)];
        messageOptions = {
            video: { url: selectedMediaUrl },
            gifPlayback: true, // Permite que los GIF se reproduzcan automáticamente
            caption: txt,
            mentions: [m.sender, userId] // Menciona a los usuarios relevantes
        };
    } else if (menuImages.length > 0) {
        // --- Preparar mensaje con Imagen (usando externalAdReply como en Menu 2) ---
        selectedMediaUrl = menuImages[Math.floor(Math.random() * menuImages.length)];
        messageOptions = {
            text: txt,
            contextInfo: {
                mentionedJid: [m.sender, userId],
                isForwarded: true, 
               forwardedNewsletterMessageInfo: { 
                   newsletterJid: channelRD.id,
                   newsletterName: channelRD.name,
                   serverMessageId: -1, 
                },
                forwardingScore: 999,
                externalAdReply: {
                    title: botname, 
                    body: global.textbot, 
                    thumbnailUrl:  bot.logo.selectedMediaUrl || banner, 
                    sourceUrl: redes,
                    mediaType: 1, 
                    showAdAttribution: false, 
                    renderLargerThumbnail: true 
                }
            }
        };
    } else {
        // --- Fallback: Si no hay videos ni imágenes, enviar solo texto ---
        messageOptions = {
            text: txt,
            mentions: [m.sender, userId]
        };
        console.warn("Advertencia: No se encontraron URLs en menuVideos ni menuImages. Enviando solo texto.");
    }

    // --- Enviar el mensaje ---
    try {
        await conn.sendMessage(m.chat, messageOptions, { quoted: m }); // Envía citando el mensaje original
    } catch (error) {
        console.error("Error al enviar el mensaje del menú:", error);
        // Enviar un mensaje de error simple si falla el envío complejo
        await conn.reply(m.chat, `Error al mostrar el menú. \n\n${txt}`, m);
    }
};


handler.help = ['menu']; 
handler.tags = ['main'];
handler.command =  ['menu', 'menú', 'help']; 


export default handler;
