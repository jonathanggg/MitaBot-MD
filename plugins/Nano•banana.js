import axios from 'axios';
import crypto from 'crypto';


const delay = ms => new Promise(r => setTimeout(r, ms));

// Función para generar UUID compatible sin dependencias externas
const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

class SupaworkAI {
    constructor() {
        this.email = null;
        this.password = null;
        this.token = null;
        this.identity = uuidv4();
    }

    async createAccount() {
        const rand = Math.random().toString(36).substring(2, 10);
        const name = `User_${rand}`;
       
        const { data: temp } = await axios.post(
            "https://api.internal.temp-mail.io/api/v3/email/new",
            { name, domain: "ozsaip.com" },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Application-Name": "web",
                    "Application-Version": "4.0.0",
                    "X-CORS-Header": "iaWg3pchvFx48fY"
                }
            }
        );

        this.email = temp.email;
        this.password = `Pass_${crypto.randomBytes(5).toString("hex")}A1!`;

        const { data: bypass } = await axios.post(
            "https://api.nekolabs.web.id/tools/bypass/cf-turnstile",
            { url: "https://supawork.ai/app", siteKey: "0x4AAAAAACBjrLhJyEE6mq1c" }
        );

        if (!bypass?.result) throw new Error("Fallo al saltar Cloudflare (Registro)");
        const cfToken = bypass.result;

        const instHead = axios.create({
            baseURL: "https://supawork.ai/supawork/headshot/api",
            headers: {
                authorization: "null",
                origin: "https://supawork.ai/",
                referer: "https://supawork.ai/app",
                "user-agent": "Mozilla/5.0",
                "x-identity-id": this.identity
            }
        });

        const { data: chall } = await instHead.get("/sys/challenge/token", {
            headers: { "x-auth-challenge": cfToken }
        });

        const challengeToken = chall?.data?.challenge_token;
        if (!challengeToken) throw new Error("Fallo obteniendo Challenge Token");

        const instReg = axios.create({
            baseURL: "https://supawork.ai/supawork/api",
            headers: {
                origin: "https://supawork.ai/",
                referer: "https://supawork.ai/app",
                "user-agent": "Mozilla/5.0",
                "x-identity-id": this.identity,
                "x-auth-challenge": challengeToken
            }
        });

        const reg = await instReg.post("/user/register", {
            email: this.email,
            password: this.password,
            register_code: "",
            credential: null,
            route_path: "/app",
            user_type: 1
        });

        const credential = reg?.data?.data?.credential;
        if (!credential) throw new Error("No se obtuvo credencial de registro");

        let otp = null;
        for (let i = 0; i < 40; i++) {
            const { data: mails } = await axios.get(
                `https://api.internal.temp-mail.io/api/v3/email/${this.email}/messages`,
                {
                    headers: {
                        "Application-Name": "web",
                        "Application-Version": "4.0.0",
                        "X-CORS-Header": "iaWg3pchvFx48fY"
                    }
                }
            );

            if (Array.isArray(mails) && mails.length) {
                const body = mails[0].body_text;
                const match = body.match(/\b\d{4,6}\b/);
                if (match) {
                    otp = match[0];
                    break;
                }
            }
            await delay(2000);
        }

        if (!otp) throw new Error("Tiempo de espera del código OTP agotado");

        await instReg.post("/user/register/code/verify", {
            email: this.email,
            password: this.password,
            register_code: otp,
            credential,
            route_path: "/app"
        });

        const login = await instReg.post("/user/login/password", { email: this.email, password: this.password });
        this.token = login?.data?.data?.token;
        if (!this.token) throw new Error("Login fallido, no hay token");
        
        return this.token;
    }

    async generateImage(buffer, prompt) {
        if (!this.token) await this.createAccount();

        const identity2 = uuidv4();
        const inst = axios.create({
            baseURL: "https://supawork.ai/supawork/headshot/api",
            headers: {
                authorization: this.token,
                origin: "https://supawork.ai/",
                referer: "https://supawork.ai/nano-banana",
                "user-agent": "Mozilla/5.0",
                "x-identity-id": identity2
            }
        });

        const { data: up } = await inst.get("/sys/oss/token", { params: { f_suffix: "png", get_num: 1, unsafe: 1 } });
        const img = up?.data?.[0];
        if (!img) throw new Error("Fallo al obtener URL de subida");

        await axios.put(img.put, buffer);

        const { data: cf2 } = await axios.post(
            "https://api.nekolabs.web.id/tools/bypass/cf-turnstile",
            { url: "https://supawork.ai/nano-banana", siteKey: "0x4AAAAAACBjrLhJyEE6mq1c" }
        );
        if (!cf2.result) throw new Error("Fallo al saltar Cloudflare (Generación)");

        const { data: t } = await inst.get("/sys/challenge/token", { headers: { "x-auth-challenge": cf2.result } });
        const ct = t?.data?.challenge_token;
        if (!ct) throw new Error("Fallo Challenge Token de Generación");

        const { data: task } = await inst.post(
            "/media/image/generator",
            {
                identity_id: identity2,
                aigc_app_code: "image_to_image_generator",
                model_code: "google_nano_banana",
                custom_prompt: prompt,
                aspect_ratio: "match_input_image",
                currency_type: "gold",
                image_urls: [img.get]
            },
            { headers: { "x-auth-challenge": ct } }
        );
        const cid = task?.data?.creation_id;
        if (!cid) throw new Error("No se pudo crear la tarea de imagen");

        let attempts = 0;
        while (attempts < 60) {
            const { data } = await inst.get("/media/aigc/result/list/v1", { params: { page_no: 1, page_size: 10, identity_id: identity2 } });
            const list = data?.data?.list?.[0]?.list?.[0];
            if (list?.status === 1) return list.url;
            if (list?.status === 2) throw new Error("La generación de imagen falló en el servidor");
            await delay(1000);
            attempts++;
        }
        throw new Error("Tiempo de espera de generación agotado");
    }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        
        if (!mime.startsWith('image/')) {
            return m.reply(`⚠️ *Responde a una imagen con el comando ${usedPrefix + command}*`);
        }
        
        if (!text) {
            return m.reply(`⚠️ *Escribe un prompt.*\nEjemplo: ${usedPrefix + command} convertir a estilo anime`);
        }
        
        await m.reply(`⏳ *Creando cuenta temporal y procesando...* (Esto puede tardar unos 30-60 segundos)`);
        await m.react('🧬');
        
        const media = await q.download();
        
        const supawork = new SupaworkAI();
        const resultUrl = await supawork.generateImage(media, text);
        
        await m.react('✅');
        await conn.sendFile(m.chat, resultUrl, 'result.png', `✨ *Resultado Supawork AI*\n📝 *Prompt:* ${text}`, m);
        
    } catch (error) {
        console.error(error);
        await m.react('❌');
        m.reply(`❌ *Error:* ${error.message || 'Ocurrió un error inesperado'}`);
    }
};

handler.help = ['nano', 'banana'];
handler.tags = ['ai'];
handler.command = ['nano', 'banana']

export default handler;