//Código creado por Emma (Violet's Version)

// Fix a los bugs de la terminal ----------------------------------------

// Te odio awesome-phonenumber por ocasionarme tantos problemas 

import { WAMessageStubType } from '@whiskeysockets/baileys'
import chalk from 'chalk'
import { watchFile } from 'fs'

// Si se activa la opción 'img', se carga la librería para mostrar imágenes en terminal
const terminalImage = global.opts['img'] ? require('terminal-image') : ''

// Importa una expresión regular segura para detectar URLs
const urlRegex = (await import('url-regex-safe')).default({ strict: false })

// Función principal exportada para imprimir información del mensaje en consola
export default async function (m, conn = { user: {} }) {
  // Obtiene el nombre del remitente y lo formatea
  let _name = await conn.getName(m.sender)
  let sender = '+' + m.sender.replace('@s.whatsapp.net', '') + (_name ? ' ~' + _name : '')

  // Obtiene el nombre del chat (puede ser grupo o privado)
  let chat = await conn.getName(m.chat)

  let img
  try {
    // Si la opción 'img' está activada y el mensaje contiene una imagen o sticker, la descarga y convierte en imagen de terminal
    if (global.opts['img'])
      img = /sticker|image/gi.test(m.mtype) ? await terminalImage.buffer(await m.download()) : false
  } catch (e) {
    console.error(e) // Muestra errores si falló la descarga
  }

  // Calcula el tamaño del contenido del mensaje (texto, archivo, etc.)
  let filesize = (m.msg ?
    m.msg.vcard ?
      m.msg.vcard.length :
      m.msg.fileLength ?
        m.msg.fileLength.low || m.msg.fileLength :
        m.msg.axolotlSenderKeyDistributionMessage ?
          m.msg.axolotlSenderKeyDistributionMessage.length :
          m.text ?
            m.text.length :
            0
    : m.text ? m.text.length : 0) || 0

  // Obtiene los datos del usuario desde la base de datos global
  let user = global.db.data.users[m.sender]

  // Formatea el número del bot
  let me = '+' + (conn.user?.jid || '').replace('@s.whatsapp.net', '')

  // Muestra en consola un resumen del mensaje con colores
/*
console.log(chalk.cyanBright('┍━━━━ ⋆⋅☆⋅⋆ ━━━━┑'))
console.log(`${chalk.cyanBright('┃')} 🔧 ${chalk.redBright('Bot:')} ${chalk.greenBright(me)} ~${chalk.magentaBright(conn.user.name)}${conn.user.jid == global.conn.user.jid ? '' : chalk.redBright(' (𝗦𝗨𝗕 𝗕𝗢𝗧)')}
${chalk.cyanBright('┃')}
${chalk.cyanBright('┃')} 🕒 ${chalk.yellowBright('Fecha:')} ${chalk.blueBright((m.messageTimestamp ? new Date(1000 * (m.messageTimestamp.low || m.messageTimestamp)) : new Date).toTimeString())}
${chalk.cyanBright('┃')}
${chalk.cyanBright('┃')} 📌 ${chalk.greenBright('Tipo de evento:')} ${chalk.redBright(m.messageStubType ? WAMessageStubType[m.messageStubType] : 'Ninguno')}
${chalk.cyanBright('┃')}
${chalk.cyanBright('┃')} 🧱 ${chalk.magentaBright('Peso del mensaje:')} ${chalk.yellowBright(filesize + ' B')} [${chalk.cyanBright(filesize === 0 ? 0 : (filesize / 1000 ** Math.floor(Math.log(filesize) / Math.log(1000))).toFixed(1))} ${chalk.greenBright(['B', 'KB', 'MB', 'GB', 'TB'][Math.floor(Math.log(filesize) / Math.log(1000))] || '')}]
${chalk.cyanBright('┃')}
${chalk.cyanBright('┃')} 📤 ${chalk.blueBright('Remitente:')} ${chalk.redBright(sender)}
${chalk.cyanBright('┃')}
${chalk.cyanBright('┃')} 👤 ${chalk.yellowBright('Usuario:')} ${chalk.greenBright(user ? '|' + user.exp + '|' + user.money : '' + ('|' + user.level + user.limit))}
${chalk.cyanBright('┃')}
${chalk.cyanBright('┃')} 💬 ${chalk.cyanBright('Chat:')} ${chalk.redBright(m.chat)}${chat ? chalk.greenBright(' ~' + chat) : ''}
${chalk.cyanBright('┃')}
${chalk.cyanBright('┃')} 📨 ${chalk.magentaBright('Tipo de mensaje:')} ${chalk.yellowBright(m.mtype ? m.mtype.replace(/message$/i, '').replace('audio', m.msg?.ptt ? 'PTT' : 'audio').replace(/^./, v => v.toUpperCase()) : 'Desconocido')}
${chalk.cyanBright('┃')}
`)
console.log(chalk.cyanBright('┕━━━━ ⋆⋅☆⋅⋆ ━━━━┙'))*/

//-------------- 

console.log(chalk.redBright('┍━━━━━━━━ ⋆⋅★彡[Mita-Bot彡★⋅⋆ ━━━━━━━━━┑'))
console.log(`${chalk.yellowBright('┃')} 🔧 ${chalk.redBright('Bot:')} ${chalk.greenBright(me)} ~${chalk.magentaBright(conn.user.name)}${conn.user.jid == global.conn.user.jid ? '' : chalk.redBright(' (𝗦𝗨𝗕 𝗕𝗢𝗧)')}
${chalk.greenBright('┃')}
${chalk.cyanBright('┃')} 🕒 ${chalk.yellowBright('Fecha:')} ${chalk.blueBright((m.messageTimestamp ? new Date(1000 * (m.messageTimestamp.low || m.messageTimestamp)) : new Date).toTimeString())}
${chalk.blueBright('┃')}
${chalk.magentaBright('┃')} 📌 ${chalk.greenBright('Tipo de evento:')} ${chalk.redBright(m.messageStubType ? WAMessageStubType[m.messageStubType] : 'Ninguno')}
${chalk.redBright('┃')}
${chalk.yellowBright('┃')} 🧱 ${chalk.magentaBright('Peso del mensaje:')} ${chalk.yellowBright(filesize + ' B')} [${chalk.cyanBright(filesize === 0 ? 0 : (filesize / 1000 ** Math.floor(Math.log(filesize) / Math.log(1000))).toFixed(1))} ${chalk.greenBright(['B', 'KB', 'MB', 'GB', 'TB'][Math.floor(Math.log(filesize) / Math.log(1000))] || '')}]
${chalk.greenBright('┃')}
${chalk.cyanBright('┃')} 📤 ${chalk.blueBright('Remitente:')} ${chalk.redBright(sender)}
${chalk.blueBright('┃')}
${chalk.magentaBright('┃')} 👤 ${chalk.yellowBright('Usuario:')} ${chalk.greenBright(user ? '|' + user.exp + '|' + user.money : '' + ('|' + user.level + user.limit))}
${chalk.redBright('┃')}
${chalk.yellowBright('┃')} 💬 ${chalk.cyanBright('Chat:')} ${chalk.redBright(m.chat)}${chat ? chalk.greenBright(' ~' + chat) : ''}
${chalk.greenBright('┃')}
${chalk.cyanBright('┃')} 📨 ${chalk.magentaBright('Tipo de mensaje:')} ${chalk.yellowBright(m.mtype ? m.mtype.replace(/message$/i, '').replace('audio', m.msg?.ptt ? 'PTT' : 'audio').replace(/^./, v => v.toUpperCase()) : 'Desconocido')}
${chalk.blueBright('┃')}
`)
console.log(chalk.magentaBright('┕━━━━ ⋆⋅·͙⁺˚*•̩̩͙✩•̩̩͙*˚⁺‧͙⁺˚*•̩̩͙ ᴄᴏɴꜱᴏʟᴇ •̩̩͙*˚⁺‧͙⁺˚*•̩̩͙✩•̩̩͙*˚⁺‧͙⋅⋆ ━━━━┙'))



  /*console.log(`┍━━━━ ⋆⋅☆⋅⋆ ━━━━┑`)

  console.log(`${chalk.redBright('%s')} ${chalk.black(chalk.bgYellow('%s'))} ${chalk.black(chalk.bgGreen('%s'))} ${chalk.magenta('%s [%s %sB]')}
 ${chalk.green('%s')} ${chalk.yellow('%s%s')} ${chalk.blueBright('-')} ${chalk.green('%s')} ${chalk.cyanBright(chalk.blueBright('%s'))}`.trim(),
    me + ' ~' + conn.user.name + `${conn.user.jid == global.conn.user.jid ? '' : ' (𝗦𝗨𝗕 𝗕𝗢𝗧)'}`,
    (m.messageTimestamp ? new Date(1000 * (m.messageTimestamp.low || m.messageTimestamp)) : new Date).toTimeString(),
    m.messageStubType ? WAMessageStubType[m.messageStubType] : '',
    filesize,
    filesize === 0 ? 0 : (filesize / 1000 ** Math.floor(Math.log(filesize) / Math.log(1000))).toFixed(1),
    ['B', 'KB', 'MB', 'GB', 'TB'][Math.floor(Math.log(filesize) / Math.log(1000))] || '',
    sender,
    m?.exp ?? '?',
    user ? '|' + user.exp + '|' + user.money : '' + ('|' + user.level + user.limit),
    m.chat + (chat ? ' ~' + chat : ''), 
    m.mtype ? m.mtype.replace(/message$/i, '').replace('audio', m.msg.ptt ? 'PTT' : 'audio').replace(/^./, v => v.toUpperCase()) : '' 
  )

console.log(`┕━━━━ ⋆⋅☆⋅⋆ ━━━━┙`)
*/

  // Muestra la imagen (si se descargó) en consola
  if (img) console.log(img.trimEnd())

  // Si el mensaje contiene texto, se procesa para resaltado y formato
  if (typeof m.text === 'string' && m.text) {
    let log = m.text.replace(/\u200e+/g, '') // Elimina caracteres invisibles

    // RegEx para detectar formatos tipo Markdown (negrita, cursiva, etc.)
    let mdRegex = /(?<=(?:^|[\s\n])\S?)(?:([*_~`])(?!`)(.+?)\1|```((?:.|[\n\r])+?)```|`([^`]+?)`)(?=\S?(?:[\s\n]|$))/g

    // Aplica formato de Markdown usando chalk
    let mdFormat = (depth = 4) => (_, type, text, monospace) => {
      let types = {
        '_': 'italic',
        '*': 'bold',
        '~': 'strikethrough',
        '`': 'bgGray'
      }
      text = text || monospace
      let formatted = !types[type] || depth < 1 ? text : chalk[types[type]](text.replace(/`/g, '').replace(mdRegex, mdFormat(depth - 1)))
      return formatted
    }

    log = log.replace(mdRegex, mdFormat(4))

    // Aplica formato a listas, citas y viñetas
    log = log.split('\n').map(line => {
      if (line.trim().startsWith('>')) {
        return chalk.bgGray.dim(line.replace(/^>/, '┃'))
      } else if (/^([1-9]|[1-9][0-9])\./.test(line.trim())) {
        return line.replace(/^(\d+)\./, (match, number) => {
          const padding = number.length === 1 ? '  ' : ' '
          return padding + number + '.'
        })
      } else if (/^[-*]\s/.test(line.trim())) {
        return line.replace(/^[*-]/, '  •')
      }
      return line
    }).join('\n')

    // Resalta URLs con azul si son enlaces válidos y cortos
    if (log.length < 1024)
      log = log.replace(urlRegex, (url, i, text) => {
        let end = url.length + i
        return i === 0 || end === text.length || (/^\s$/.test(text[end]) && /^\s$/.test(text[i - 1])) ? chalk.blueBright(url) : url
      })

    log = log.replace(mdRegex, mdFormat(4))

    // Si hay menciones, las resalta con nombre
    if (m.mentionedJid) {
      for (let user of m.mentionedJid)
        log = log.replace('@' + user.split`@`[0], chalk.blueBright('@' + await conn.getName(user)))
    }

    // Imprime el texto según si es comando o error
    console.log(m.error != null ? chalk.red(log) : m.isCommand ? chalk.yellow(log) : log)
  }

  // Muestra información adicional si hay parámetros tipo stub (por ejemplo, entradas o salidas del grupo)
  if (m.messageStubParameters) {
    console.log(m.messageStubParameters.map(jid => {
      jid = conn.decodeJid(jid)
      let name = conn.getName(jid)
      return chalk.gray('+' + jid.replace('@s.whatsapp.net', '') + (name ? ' ~' + name : ''))
    }).join(', '))
  }

  // Iconos para tipos específicos de mensajes multimedia
  if (/document/i.test(m.mtype)) console.log(`🗂️ ${m.msg.fileName || m.msg.displayName || 'Document'}`)
  else if (/ContactsArray/i.test(m.mtype)) console.log(`👨‍👩‍👧‍👦 ${' ' || ''}`)
  else if (/contact/i.test(m.mtype)) console.log(`👨 ${m.msg.displayName || ''}`)
  else if (/audio/i.test(m.mtype)) {
    const duration = m.msg.seconds
    console.log(`${m.msg.ptt ? '🎤ㅤ(PTT ' : '🎵ㅤ('}AUDIO) ${Math.floor(duration / 60).toString().padStart(2, 0)}:${(duration % 60).toString().padStart(2, 0)}`)
  }

  // Espacio final
  console.log()
}

// Observa el archivo actual y reinicia si se actualiza
let file = global.__filename(import.meta.url)
watchFile(file, () => {
  console.log(chalk.redBright("Update 'lib/print.js'"))
})



// Fix a los bugs de la terminal ----------------------------------------

/*

import {WAMessageStubType} from '@whiskeysockets/baileys';
import PhoneNumber from 'awesome-phonenumber'
import chalk from 'chalk'
import { watchFile } from 'fs'

const terminalImage = global.opts['img'] ? require('terminal-image') : ''
const urlRegex = (await import('url-regex-safe')).default({ strict: false })

export default async function (m, conn = { user: {} }) {
let _name = await conn.getName(m.sender)
let sender = PhoneNumber('+' + m.sender.replace('@s.whatsapp.net', '')).getNumber('international') + (_name ? ' ~' + _name : '')
let chat = await conn.getName(m.chat)
let img
try {
if (global.opts['img'])
img = /sticker|image/gi.test(m.mtype) ? await terminalImage.buffer(await m.download()) : false
} catch (e) {
console.error(e)
}
let filesize = (m.msg ?
m.msg.vcard ?
m.msg.vcard.length :
m.msg.fileLength ?
m.msg.fileLength.low || m.msg.fileLength :
m.msg.axolotlSenderKeyDistributionMessage ?
m.msg.axolotlSenderKeyDistributionMessage.length :
m.text ?
m.text.length :
0
: m.text ? m.text.length : 0) || 0
let user = global.db.data.users[m.sender]
let me = PhoneNumber('+' + (conn.user?.jid).replace('@s.whatsapp.net', '')).getNumber('international')

console.log(`${chalk.redBright('%s')} ${chalk.black(chalk.bgYellow('%s'))} ${chalk.black(chalk.bgGreen('%s'))} ${chalk.magenta('%s [%s %sB]')}
 ${chalk.green('%s')} ${chalk.yellow('%s%s')} ${chalk.blueBright('-')} ${chalk.green('%s')} ${chalk.cyanBright(chalk.blueBright('%s'))}`.trim(),
            
me + ' ~' + conn.user.name + `${conn.user.jid == global.conn.user.jid ? '' : ' (𝗦𝗨𝗕 𝗕𝗢𝗧)'}`,
(m.messageTimestamp ? new Date(1000 * (m.messageTimestamp.low || m.messageTimestamp)) : new Date).toTimeString(),
m.messageStubType ? WAMessageStubType[m.messageStubType] : '',
filesize,
filesize === 0 ? 0 : (filesize / 1009 ** Math.floor(Math.log(filesize) / Math.log(1000))).toFixed(1),
['', ...'KMGTP'][Math.floor(Math.log(filesize) / Math.log(1000))] || '',
sender,
m ? m.exp : '?',
user ? '|' + user.exp + '|' + user.money : '' + ('|' + user.level + user.limit ),
//user ? '|' + user.exp + '|' + user.money + '|' + user.limit : '' + ('|' + user.level),
m.chat + (chat ? ' ~' + chat : ''),
m.mtype ? m.mtype.replace(/message$/i, '').replace('audio', m.msg.ptt ? 'PTT' : 'audio').replace(/^./, v => v.toUpperCase()) : ''
)
if (img) console.log(img.trimEnd())
if (typeof m.text === 'string' && m.text) {
let log = m.text.replace(/\u200e+/g, '')

// Nuevos formatos/estilos para el texto en consola
// Créditos para: https://github.com/GataNina-Li
let mdRegex = /(?<=(?:^|[\s\n])\S?)(?:([*_~`])(?!`)(.+?)\1|```((?:.|[\n\r])+?)```|`([^`]+?)`)(?=\S?(?:[\s\n]|$))/g
let mdFormat = (depth = 4) => (_, type, text, monospace) => {
let types = {
'_': 'italic',
'*': 'bold',
'~': 'strikethrough',
'`': 'bgGray'
}
text = text || monospace
let formatted = !types[type] || depth < 1 ? text : chalk[types[type]](text.replace(/`/g, '').replace(mdRegex, mdFormat(depth - 1)))
return formatted
}               
log = log.replace(mdRegex, mdFormat(4))
log = log.split('\n').map(line => {
if (line.trim().startsWith('>')) {
return chalk.bgGray.dim(line.replace(/^>/, '┃'))
} else if (/^([1-9]|[1-9][0-9])\./.test(line.trim())) {
return line.replace(/^(\d+)\./, (match, number) => {
const padding = number.length === 1 ? '  ' : ' '
return padding + number + '.'
})
} else if (/^[-*]\s/.test(line.trim())) {
return line.replace(/^[*-]/, '  •')
}
return line
}).join('\n')
if (log.length < 1024)
log = log.replace(urlRegex, (url, i, text) => {
let end = url.length + i
return i === 0 || end === text.length || (/^\s$/.test(text[end]) && /^\s$/.test(text[i - 1])) ? chalk.blueBright(url) : url
})
log = log.replace(mdRegex, mdFormat(4))
if (m.mentionedJid) for (let user of m.mentionedJid) log = log.replace('@' + user.split`@`[0], chalk.blueBright('@' +await conn.getName(user)))
console.log(m.error != null ? chalk.red(log) : m.isCommand ? chalk.yellow(log) : log)
}
if (m.messageStubParameters) console.log(m.messageStubParameters.map(jid => {
jid = conn.decodeJid(jid)
let name = conn.getName(jid)
return chalk.gray(PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international') + (name ? ' ~' + name : ''))
}).join(', '))
if (/document/i.test(m.mtype)) console.log(`🗂️ ${m.msg.fileName || m.msg.displayName || 'Document'}`)
else if (/ContactsArray/i.test(m.mtype)) console.log(`👨‍👩‍👧‍👦 ${' ' || ''}`)
else if (/contact/i.test(m.mtype)) console.log(`👨 ${m.msg.displayName || ''}`)
else if (/audio/i.test(m.mtype)) {
const duration = m.msg.seconds
console.log(`${m.msg.ptt ? '🎤ㅤ(PTT ' : '🎵ㅤ('}AUDIO) ${Math.floor(duration / 60).toString().padStart(2, 0)}:${(duration % 60).toString().padStart(2, 0)}`)
}
console.log()
}
let file = global.__filename(import.meta.url)
watchFile(file, () => {
console.log(chalk.redBright("Update 'lib/print.js'"))}) 

*/
