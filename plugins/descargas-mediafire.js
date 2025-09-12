import axios from 'axios'
import cheerio from 'cheerio'
import { lookup } from 'mime-types'

async function mediafire(url) {
    try {
        if (!url.includes('www.mediafire.com')) throw new Error('Invalid url')
        
        const { data } = await axios.get('https://delirius-apiofc.vercel.app/download/mediafire', {
            params: {
                method: 'GET',
                url,
                accessKey: ''
            }
        })
        
        const $ = cheerio.load(data.result.response)
        const raw = $('div.dl-info')

        const filename = $('.dl-btn-label').attr('title') || raw.find('div.intro div.filename').text().trim() || null
        const ext = filename.split('.').pop() || null
        const mimetype = lookup(ext.toLowerCase()) || null

        const filesize = raw.find('ul.details li:nth-child(1) span').text().trim()
        const uploaded = raw.find('ul.details li:nth-child(2) span').text().trim()
        const dl = $('a#downloadButton').attr('data-scrambled-url')
        if (!dl) throw new Error('File not found')

        return {
            filename,
            filesize,
            mimetype,
            uploaded,
            download_url: atob(dl),
            url
        }
    } catch (error) {
        throw new Error(error.message)
    }
}

const handler = async (m, { text }) => {
    if (!text) return m.reply('Por favor proporciona un link de mediafire.')
    try {
        const res = await mediafire(text)

        const caption = `*Mediafire Downloader*\n*Nombre:* ${res.filename}\n*Type :* ${res.mimetype}\n*Tamaño:* ${res.filesize}\n*Upload :* ${res.uploaded}`

        await conn.sendMessage(m.chat, {
            document: { url: res.download_url },
            fileName: res.filename,
            mimetype: res.mimetype,
            caption,
        }, { quoted: m })

    } catch (e) {
        m.reply(String(e))
    }
}

handler.help = ['mediafire <link>']
handler.tags = ['downloader']
handler.command = ['mediafire', 'mf']

export default handler
