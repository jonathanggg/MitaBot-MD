import axios from 'axios';
import crypto from 'crypto';

class AuthGenerator {
    static #PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDa2oPxMZe71V4dw2r8rHWt59gH\nW5INRmlhepe6GUanrHykqKdlIB4kcJiu8dHC/FJeppOXVoKz82pvwZCmSUrF/1yr\nrnmUDjqUefDu8myjhcbio6CnG5TtQfwN2pz3g6yHkLgp8cFfyPSWwyOCMMMsTU9s\nsnOjvdDb4wiZI8x3UwIDAQAB\n-----END PUBLIC KEY-----`;
    static #S = 'NHGNy5YFz7HeFb'
    
    constructor(appId) {
        this.appId = appId;
    }
    
    aesEncrypt(data, key, iv) {
        const keyBuffer = Buffer.from(key, 'utf8');
        const ivBuffer = Buffer.from(iv, 'utf8');
        const cipher = crypto.createCipheriv('aes-128-cbc', keyBuffer, ivBuffer);
        
        let encrypted = cipher.update(data, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    }
    
    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const randomBytes = crypto.randomBytes(length);
        for (let i = 0; i < length; i++) {
            result += chars.charAt(randomBytes[i] % chars.length);
        }
        return result;
    }
    
    generate() {
        const t = Math.floor(Date.now() / 1000).toString()
        const nonce = crypto.randomUUID();
        const tempAesKey = this.generateRandomString(16);

        const encryptedData = crypto.publicEncrypt({
            key: AuthGenerator.#PUBLIC_KEY,
            padding: crypto.constants.RSA_PKCS1_PADDING,
        }, Buffer.from(tempAesKey));
        const secret_key = encryptedData.toString('base64');

        const dataToSign = `${this.appId}:${AuthGenerator.#S}:${t}:${nonce}:${secret_key}`;
        const sign = this.aesEncrypt(dataToSign, tempAesKey, tempAesKey);
        
        return {
            app_id: this.appId,
            t: t,
            nonce: nonce,
            sign: sign,
            secret_key: secret_key,
        };
    }
}

async function convertImage(buffer, prompt) {
    try {
        const auth = new AuthGenerator('ai_df');
        const authData = auth.generate();
        const userId = auth.generateRandomString(64).toLowerCase();
        
        const headers = {
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Android 15; Mobile; SM-F958; rv:130.0) Gecko/130.0 Firefox/130.0',
            'Referer': 'https://deepfakemaker.io/nano-banana-ai/'
        };
        
        const instance = axios.create({
            baseURL: 'https://apiv1.deepfakemaker.io/api',
            params: authData,
            headers
        });
        
        const file = await instance.post('/user/v2/upload-sign', {
            'filename': auth.generateRandomString(32) + '_' + Date.now() + '.jpg',
            'hash': crypto.createHash('sha256').update(buffer).digest('hex'),
            'user_id': userId
        }).then(i => i.data);
        
        await axios.put(file.data.url, buffer, {
            headers: {
                'content-type': 'image/jpeg',
                'content-length': buffer.length
            }
        });
        
        const taskData = await instance.post('/replicate/v1/free/nano/banana/task', {
            'prompt': prompt,
            'platform': 'nano_banana',
            'images': [ 'https://cdn.deepfakemaker.io/' + file.data.object_name ],
            'output_format': 'png',
            'user_id': userId
        }).then(i => i.data);
        
        const progress = await new Promise((resolve, reject) => {
            let retries = 20;
            const interval = setInterval(async () => {
                try {
                    const xz = await instance.get('/replicate/v1/free/nano/banana/task', {
                        params: {
                            user_id: userId,
                            ...taskData.data
                        }
                    }).then(i => i.data);
                    
                    if (xz.msg === 'success') {
                        clearInterval(interval);
                        resolve(xz.data.generate_url);
                    }
                    if (--retries <= 0) {
                        clearInterval(interval);
                        reject(new Error('Tiempo de espera agotado. Intenta de nuevo.'));
                    }
                } catch (err) {
                    clearInterval(interval);
                    reject(err);
                }
            }, 2500);
        });
        
        return progress;
    } catch (error) {
        throw new Error(error.message);
    }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        
        if (!mime.startsWith('image/')) {
            return m.reply(`⚠️ Responde a una imagen con el comando *${usedPrefix + command}*`);
        }
        
        if (!text) {
            return m.reply(`⚠️ Por favor proporciona un prompt (texto).\n\nEjemplo: *${usedPrefix + command}* convertir a estilo anime`);
        }
        
        await m.reply(`⏳ Procesando imagen con *${command}* AI...`);
        
        const media = await q.download();
        const result = await convertImage(media, text);
        
        await conn.sendFile(m.chat, result, 'result.png', `✅ Imagen procesada con éxito`, m);
        
    } catch (error) {
        console.error(error);
        m.reply(`❌ Error: ${error.message}`);
    }
};

handler.help = ['nano', 'banana'];
handler.tags = ['ai'];
handler.command = ['nano', 'banana']

export default handler;