
import ws from 'ws';

// (Opcional, si usas traducción, si no, puedes quitar la línea de abajo y los 'await tr(...)')
import { tr } from '../lib/_checkLang.js';

let handler = async (m, { conn, usedPrefix, args }) => {
    const input = args[0]?.trim();
    if (!input) {
        return m.reply(await tr(`Debes etiquetar o escribir el número de un BOT conectado para establecerlo como primario.\nEjemplo: ${usedPrefix}setprimary @521...`));
    }
    const activeBots = [global.conn, ...(global.conns || [])]
        .filter(c => c.user && c.ws?.socket?.readyState === ws.OPEN);
    
    if (activeBots.length <= 1 && global.conn.user.jid === activeBots[0]?.user.jid) {
         return m.reply(await tr('No hay otros bots esclavos conectados para establecer como primario.'));
    }

    const activeBotJids = activeBots.map(c => c.user.jid);

    const targetNumber = input.replace(/[^0-9]/g, '');
    let targetJid = null;

    if (!targetNumber) {
        return m.reply(await tr('El número/mención proporcionado no es válido. Asegúrate de etiquetar a un bot conectado.'));
    }

    targetJid = activeBotJids.find(jid => jid.startsWith(targetNumber + '@'));

    if (!targetJid) {
        let mentionedUser = `@${targetNumber}`;
        let msg = await tr(`El usuario ${mentionedUser} no es un bot activo o no se encuentra en la lista de bots conectados.`);
        msg += `\n\n${await tr('Bots disponibles:')}\n${activeBotJids.map(jid => `> @${jid.split('@')[0]}`).join('\n')}`;
        
        return conn.sendMessage(m.chat, { text: msg, mentions: activeBotJids }, { quoted: m });
    }

    let chat = global.db.data.chats[m.chat];
    if (!chat) {
        global.db.data.chats[m.chat] = {};
    }
    global.db.data.chats[m.chat].primaryBot = targetJid;

    return conn.sendMessage(m.chat, {
        text: ` ${await tr(✐"Listo")}\n\nEl bot @${targetJid.split('@')[0]} ${await tr("ha sido establecido como primario en este grupo. Los demás bots no responderán aquí.")}`,
        mentions: [targetJid]
    }, { quoted: m });
};

handler.help = ['setprimary <@tag|número_de_bot>'];
handler.tags = ['jadibot'];
handler.command = ['setprimary', 'botprimario'];
handler.group = true;
handler.admin = true;

export default handler;