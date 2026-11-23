import { resolveUserJid } from '../lib/simple.js'

var handler = async (m, { conn, participants, usedPrefix, command }) => {
    if (!m.mentionedJid[0] && !m.quoted) {
        return conn.reply(m.chat, `${emoji} Debes mencionar a un usuario para poder expulsarlo del grupo.`, m);
    }

    let user = await resolveUserJid(conn, m.chat, m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted?.sender)
    if (!user) return

    const groupInfo = await conn.groupMetadata(m.chat);
    const ownerGroup = groupInfo.owner || m.chat.split`-`[0] + '@s.whatsapp.net';
    const ownerBot = global.owner[0][0] + '@s.whatsapp.net';

    if (user === conn.user.jid) {
        return conn.reply(m.chat, `${emoji2} No puedo eliminar el bot del grupo.`, m);
    }

    if (user === ownerGroup) {
        return conn.reply(m.chat, `${emoji2} No puedo eliminar al propietario del grupo.`, m);
    }

    if (user === ownerBot) {
        return conn.reply(m.chat, `${emoji2} No puedo eliminar al propietario del bot.`, m);
    }

    await conn.groupParticipantsUpdate(m.chat, [user], 'remove');
};

handler.help = ['kick'];
handler.tags = ['grupo'];
handler.command = ['kick','echar','hechar','sacar','ban'];
handler.admin = true;
handler.group = true;
handler.botAdmin = true;

export default handler;
