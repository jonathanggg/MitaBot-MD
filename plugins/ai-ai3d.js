import axios from "axios";
import { translate } from 'bing-translate-api';

async function Ai3dGenerator(prompt) {
  try {
    let { data } = await axios.get(`https://api.artvy.ai:444/image_search?query=${encodeURIComponent(prompt + " 3D render, ultra-detailed, cinematic lighting")}`, {
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive"
      }
    });
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error("Error fetching data:", error.response ? error.response.data : error.message);
    return null;
  }
}

const handler = async (m, { conn, text }) => {
  const inputText = text.trim();
  if (!inputText) return m.reply("¡Ingrese el mensaje! Ejemplo: .ai3d 2 mujeres miran el amanecer");

  try {
    const translatedText = await translate(inputText, null, 'en');
    const englishPrompt = translatedText.translation;

    const jsonResponse = await Ai3dGenerator(englishPrompt);
    if (!jsonResponse) throw new Error("No se pudo procesar la solicitud");

    const parsedData = JSON.parse(jsonResponse);
    if (!Array.isArray(parsedData)) throw new Error("Respuesta de la API inválida");
    if (parsedData.length === 0) throw new Error("No se encontraron resultados");

    const firstImage = parsedData[0]?.image;
    if (!firstImage) throw new Error("La url de la imagen no se encontró");

    await conn.sendMessage(m.chat, {
      image: { url: firstImage },
      caption: `🎨 3D Render: ${inputText}`
    }, { quoted: m });

  } catch (error) {
    console.error("Error:", error);
    m.reply(`❌ Error: ${error.message}`);
  }
};

handler.help = ['ai3d <teks>'];
handler.command = ['ai3d'];
handler.tags = ['ai'];
handler.limit = true;
handler.register = true 

export default handler;
