import pkg from '@whiskeysockets/baileys'
import fs from 'fs'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'
const { generateWAMessageFromContent, prepareWAMessageMedia, proto } = pkg

var handler = m => m
handler.all = async function (m) {

global.getBuffer = async function getBuffer(url, options) {
try {
options ? options : {}
var res = await axios({
method: "get",
url,
headers: {
'DNT': 1,
'User-Agent': 'GoogleBot',
'Upgrade-Insecure-Request': 1
},
...options,
responseType: 'arraybuffer'
})
return res.data
} catch (e) {
console.log(`Error : ${e}`)
}}
  
//creador y otros
global.creador = 'Wa.me/50557333744'
global.ofcbot = `${conn.user.jid.split('@')[0]}`
global.asistencia = 'Wa.me/50584887870'
global.namechannel = ' MitaBot :D '
global.namechannel2 = '☁︎ Novedades sobre Mita 🌷'
global.namegrupo = '😍 MitaBot MD 😍'
global.namecomu = ' 𝙳𝚝𝚘𝚍𝟷𝙿𝚘𝚌𝚘 • ᥴ᥆mᥙᥒі𝗍ᥡ '
global.listo = '*listo 😘*'
global.fotoperfil = await conn.profilePictureUrl(m.sender, 'image').catch(_ => 'https://files.catbox.moe/xr2m6u.jpg')

//Ids channel
global.canalIdM = ["120363417289452573@newsletter", "120363368618055639@newsletter"]
global.canalNombreM = ["MitaBot-MD🙃", " Novedades Sobre Mis Bots🔥"]
global.channelRD = await getRandomChannel()

//fechas
global.d = new Date(new Date + 3600000)
global.locale = 'es'
global.dia = d.toLocaleDateString(locale, {weekday: 'long'})
global.fecha = d.toLocaleDateString('es', {day: 'numeric', month: 'numeric', year: 'numeric'})
global.mes = d.toLocaleDateString('es', {month: 'long'})
global.año = d.toLocaleDateString('es', {year: 'numeric'})
global.tiempo = d.toLocaleString('en-US', {hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true})

//Reacciones De Comandos.!
global.rwait = '🕒'
global.done = '✅'
global.error = '✖️'
global.msm = '⚠︎'

//Emojis determinado de KennyBot
global.emoji = '❀'
global.emoji2 = '✧'
global.emoji3 = '✦'
global.emoji4 = '❍'
global.emoji5 = '✰'
global.emojis = [emoji, emoji2, emoji3, emoji4].getRandom()

//mensaje en espera
global.wait = '❍ Espera un momento.';
global.waitt = '❍ Espera un momento.';
global.waittt = '❍ Espera un momento.';
global.waitttt = '❍ Espera un momento.';

//Enlaces
var canal = 'https://whatsapp.com/channel/0029VbAt0n3It5rv4WOUcH00'  
let canal2 = 'https://whatsapp.com/channel/0029VbAt0n3It5rv4WOUcH00'
var git = 'https://github.com/jonathanggg'
var github = 'https://github.com/jonathanggg/MitaBot-MD' 
let correo = 'jg4824261@gmail.com'

global.redes = [canal, canal2, git, github, correo].getRandom()

//Imagen
let category = "imagen"
const db = './src/database/db.json'
const db_ = JSON.parse(fs.readFileSync(db))
const random = Math.floor(Math.random() * db_.links[category].length)
const randomlink = db_.links[category][random]
const response = await fetch(randomlink)
const rimg = await response.buffer()
global.icons = rimg


//tags
global.nombre = m.pushName || 'Anónimo'
global.taguser = '@' + m.sender.split("@s.whatsapp.net")
var more = String.fromCharCode(8206)
global.readMore = more.repeat(850)

global.packsticker = `┊🐋Kenny🧠Mita\n↳https://mancosyasociados.wuaze.com/\n┊👹Info:\n↳https://mancosyasociados.wuaze.com/grupo \n ✦ Fecha: ${fecha}\nⴵ Hora: ${tiempo}`;
global.packsticker2 = `\n👑Bot: @${botname}\n👑Usuario: @${nombre}\n\n${dev}`

  
//Fakes
global.fkontak = { key: {participant: `0@s.whatsapp.net`, ...(m.chat ? { remoteJid: `6285600793871-1614953337@g.us` } : {}) }, message: { 'contactMessage': { 'displayName': `${nombre}`, 'vcard': `BEGIN:VCARD\nVERSION:3.0\nN:XL;${nombre},;;;\nFN:${nombre},\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`, 'jpegThumbnail': null, thumbnail: null,sendEphemeral: true}}}

global.fake = { contextInfo: { isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: channelRD.id, newsletterName: channelRD.name, serverMessageId: -1 }
}}, { quoted: m }

global.icono = [
'https://tinyurl.com/285a5ejf',
].getRandom()

global.rcanal = { contextInfo: { isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: channelRD.id, serverMessageId: 100, newsletterName: channelRD.name, }, externalAdReply: { showAdAttribution: true, title: packname, body: dev, mediaUrl: null, description: null, previewType: "PHOTO", thumbnailUrl: icono, sourceUrl: redes, mediaType: 1, renderLargerThumbnail: false }, }, }}

export default handler

function pickRandom(list) {
return list[Math.floor(Math.random() * list.length)]
  }

async function getRandomChannel() {
let randomIndex = Math.floor(Math.random() * canalIdM.length)
let id = canalIdM[randomIndex]
let name = canalNombreM[randomIndex]
return { id, name }
  }
