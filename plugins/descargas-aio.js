import axios from 'axios'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) throw `*⚠️ Ingrese el enlace de YouTube, TikTok, Instagram, Facebook, etc.*\n\n*Ejemplo:*\n${usedPrefix + command} https://www.youtube.com/watch?v=kY3n5O_D4F4`

    try {
        await m.reply('⏳ *Buscando y descargando contenido...*')

        const scraper = new VidsSave()
        const result = await scraper.scrape(text)

        if (!result || !result.status) {
            throw new Error('No se pudo procesar el enlace. Puede que sea privado o no compatible.')
        }

        const { title, thumbnail, duration, medias } = result
        
        if (medias.video.available) {
            await conn.sendMessage(m.chat, { 
                video: { url: medias.video.url }, 
                caption: `🎬 *${title}*\n⏱️ Duración: ${duration}s\n📦 Calidad: ${medias.video.quality}`,
                mimetype: 'video/mp4'
            }, { quoted: m })

        } else if (medias.audio.available) {
            await conn.sendMessage(m.chat, { 
                audio: { url: medias.audio.url }, 
                mimetype: 'audio/mpeg',
                ptt: false,
                contextInfo: {
                    externalAdReply: {
                        title: title,
                        body: 'Universal Downloader',
                        thumbnailUrl: thumbnail,
                        sourceUrl: text,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })

        } else {
            throw new Error('No se encontraron flujos de media (video/audio) en este enlace.')
        }

    } catch (e) {
        console.error(e)
        m.reply(`❌ *Error:* ${e.message}`)
    }
}

handler.help = ['dl <link>']
handler.tags = ['downloader']
handler.command = ['dl', 'aio', 'download']

export default handler


class VidsSave {
  constructor() {
    this.baseUrl = "https://api.vidssave.com";
    this.authToken = "20250901majwlqo";
    this.headers = {
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36",
      "accept": "*/*",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/x-www-form-urlencoded",
      "sec-ch-ua": "\"Chromium\";v=\"133\", \"Not_A Brand\";v=\"24\"",
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": "\"Android\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "Referer": "https://vidssave.com/",
      "Origin": "https://vidssave.com",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    };
  }
  
  getQualityScore(qualityStr) {
    if (!qualityStr) return 0;
    const q = qualityStr.toLowerCase();
    if (q.includes("720")) return 100; 
    if (q.includes("1080")) return 90;
    if (q.includes("480")) return 70;
    if (q.includes("360")) return 60;
    return 10;
  }

  async getResources(url) {
    try {
      const body = `auth=${this.authToken}&domain=api-ak.vidssave.com&origin=source&link=${encodeURIComponent(url)}`;
      const { data } = await axios.post(`${this.baseUrl}/api/contentsite_api/media/parse`, body, {
        headers: this.headers
      });

      if (!data || data.status !== 1) throw new Error("Link no válido o falló el parseo");
      return data.data;
    } catch (error) {
      return null;
    }
  }
  
  async resolveDownloadLink(resourceToken) {
    if (!resourceToken) return null;
    try {
      const taskBody = `auth=${this.authToken}&domain=api-ak.vidssave.com&request=${encodeURIComponent(resourceToken)}&no_encrypt=1`;
      const { data: taskData } = await axios.post(`${this.baseUrl}/api/contentsite_api/media/download`, taskBody, { headers: this.headers });
      
      if (!taskData || taskData.status !== 1) return null;
      
      const queryParams = new URLSearchParams({
        auth: this.authToken,
        domain: "api-ak.vidssave.com",
        task_id: taskData.data.task_id,
        download_domain: "vidssave.com",
        origin: "content_site"
      }).toString();

      let finalUrl = null;
      for (let i = 0; i < 15; i++) {
        const { data: sseString } = await axios.get(`${this.baseUrl}/sse/contentsite_api/media/download_query?${queryParams}`, {
          headers: { ...this.headers, "accept": "text/event-stream" },
          responseType: "text"
        });

        const lines = sseString.split("\n");
        for (const line of lines) {
          if (line.includes("data:")) {
            try {
              const json = JSON.parse(line.replace("data:", "").replace("event: success", "").trim());
              if (json.status === "success" && json.download_link) {
                finalUrl = json.download_link;
                break;
              }
            } catch (e) {}
          }
        }
        if (finalUrl) break;
        await new Promise(r => setTimeout(r, 1000));
      }
      return finalUrl;
    } catch (e) {
      return null;
    }
  }

  async scrape(url) {
    const data = await this.getResources(url);
    if (!data) return { status: false, msg: "Fallo al obtener metadatos" };

    const { title, thumbnail, duration, resources } = data;

    let videoResources = resources.filter(r => r.type === "video");
    videoResources.sort((a, b) => this.getQualityScore(b.quality) - this.getQualityScore(a.quality));
    
    const bestVideo = videoResources[0];
    const audioResource = resources.find(r => r.type === "audio");
    
    const [videoUrl, audioUrl] = await Promise.all([
      bestVideo ? this.resolveDownloadLink(bestVideo.resource_content) : Promise.resolve(null),
      audioResource ? this.resolveDownloadLink(audioResource.resource_content) : Promise.resolve(null)
    ]);

    return {
      status: true,
      title: title,
      thumbnail: thumbnail,
      duration: duration,
      medias: {
        video: {
          available: !!videoUrl,
          quality: bestVideo ? bestVideo.quality : null,
          size: bestVideo ? bestVideo.size : 0,
          extension: bestVideo ? bestVideo.format : "mp4",
          url: videoUrl
        },
        audio: {
          available: !!audioUrl,
          extension: "mp3",
          url: audioUrl
        }
      }
    };
  }
}