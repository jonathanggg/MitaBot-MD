/**
 * 🧠 Plugin: DeepFakeMaker AI Image
 * 🌐 API: https://deepfakemaker.io/
 * 🧩 Función: Convierte una imagen con IA según un prompt personalizado.
 * ⚠️ Nota: jangan hapus wm bangss 😎
 */

import axios from "axios";
import crypto from "crypto";
import fs from "fs";

class AuthGenerator {
  static #PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDa2oPxMZe71V4dw2r8rHWt59gH\nW5INRmlhepe6GUanrHykqKdlIB4kcJiu8dHC/FJeppOXVoKz82pvwZCmSUrF/1yr\nrnmUDjqUefDu8myjhcbio6CnG5TtQfwN2pz3g6yHkLgp8cFfyPSWwyOCMMMsTU9s\nsnOjvdDb4wiZI8x3UwIDAQAB\n-----END PUBLIC KEY-----`;
  static #S = "NHGNy5YFz7HeFb";

  constructor(appId) {
    this.appId = appId;
  }

  aesEncrypt(data, key, iv) {
    const cipher = crypto.createCipheriv(
      "aes-128-cbc",
      Buffer.from(key, "utf8"),
      Buffer.from(iv, "utf8")
    );
    let encrypted = cipher.update(data, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
  }

  generateRandomString(length) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const randomBytes = crypto.randomBytes(length);
    return Array.from(randomBytes)
      .map((b) => chars[b % chars.length])
      .join("");
  }

  generate() {
    const t = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomUUID();
    const tempAesKey = this.generateRandomString(16);

    const encryptedData = crypto.publicEncrypt(
      {
        key: AuthGenerator.#PUBLIC_KEY,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(tempAesKey)
    );
    const secret_key = encryptedData.toString("base64");

    const dataToSign = `${this.appId}:${AuthGenerator.#S}:${t}:${nonce}:${secret_key}`;
    const sign = this.aesEncrypt(dataToSign, tempAesKey, tempAesKey);

    return { app_id: this.appId, t, nonce, sign, secret_key };
  }
}

async function convert(buffer, prompt) {
  const auth = new AuthGenerator("ai_df");
  const authData = auth.generate();
  const userId = auth.generateRandomString(64).toLowerCase();

  const headers = {
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Android 15; Mobile; SM-F958; rv:130.0) Gecko/130.0 Firefox/130.0",
    Referer: "https://deepfakemaker.io/nano-banana-ai/",
  };

  const instance = axios.create({
    baseURL: "https://apiv1.deepfakemaker.io/api",
    params: authData,
    headers,
  });

  // 1️⃣ Obtener URL de subida
  const file = await instance
    .post("/user/v2/upload-sign", {
      filename: auth.generateRandomString(32) + "_" + Date.now() + ".jpg",
      hash: crypto.createHash("sha256").update(buffer).digest("hex"),
      user_id: userId,
    })
    .then((r) => r.data);

  // 2️⃣ Subir imagen
  await axios.put(file.data.url, buffer, {
    headers: {
      "content-type": "image/jpeg",
      "content-length": buffer.length,
    },
  });

  // 3️⃣ Crear tarea IA
  const task = await instance
    .post("/replicate/v1/free/nano/banana/task", {
      prompt,
      platform: "nano_banana",
      images: ["https://cdn.deepfakemaker.io/" + file.data.object_name],
      output_format: "png",
      user_id: userId,
    })
    .then((r) => r.data);

  // 4️⃣ Esperar resultado
  const result = await new Promise((resolve, reject) => {
    let retries = 25;
    const timer = setInterval(async () => {
      try {
        const progress = await instance
          .get("/replicate/v1/free/nano/banana/task", {
            params: { user_id: userId, ...task.data },
          })
          .then((r) => r.data);

        if (progress.msg === "success") {
          clearInterval(timer);
          resolve(progress.data.generate_url);
        }

        if (--retries <= 0) {
          clearInterval(timer);
          reject(new Error("⏰ Tiempo de espera agotado."));
        }
      } catch (e) {
        clearInterval(timer);
        reject(e);
      }
    }, 2500);
  });

  return result;
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text && !m.quoted)
    throw `📸 Envía una imagen o responde a una con un prompt.\n\nEjemplo:\n${usedPrefix + command} estilo anime de figura 3D`;

  const q = m.quoted ? m.quoted : m;
  const mime = (q.msg || q).mimetype || "";
  if (!/image\/(jpe?g|png)/.test(mime))
    throw "⚠️ Solo se admiten imágenes JPG o PNG.";

  const buffer = await q.download();
  const prompt = text || "Stylize this image as an anime figure.";

  await m.react("🧠");

  try {
    const resultUrl = await convert(buffer, prompt);
    await conn.sendFile(m.chat, resultUrl, "deepfake.png", `✨ *Resultado IA:* ${prompt}`, m);
    await m.react("✅");
  } catch (err) {
    console.error(err);
    await m.react("❌");
    throw `Error: ${err.message}`;
  }
};

handler.help = ["deepfake <prompt>", "aiimage <prompt>", "nano <prompt>", "nabana <prompt>"];
handler.tags = ["ai", "image"];
handler.command = /^(deepfake|aiimage|nano|nabana|banana|nanobanana)$/i;

export default handler;
