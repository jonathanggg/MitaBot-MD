// plugins/wuaze.js

import axios from "axios";
import FormData from "form-data";
import fs from "fs";

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!m.quoted || !m.quoted.mimetype) {
    return m.reply(`📂 Responde a un archivo (imagen, documento, audio) con el comando:\n\n${usedPrefix + command}`);
  }

  try {
    let mime = m.quoted.mimetype;
    let media = await m.quoted.download();
    let filename = `temp.${mime.split("/")[1]}`;
    fs.writeFileSync(filename, media);

    let form = new FormData();
    form.append("file", fs.createReadStream(filename));
    form.append("apikey", "sk_SHVqoHaQ1tMXiptaZ6H1P8mcQ6KzxcLn");

    let res = await axios.post("https://spacny.wuaze.com//api_upload.php", form, {
      headers: form.getHeaders(),
    });

    fs.unlinkSync(filename); // borrar temporal

    let result = res.data;

    if (result && result.url) {
      await conn.reply(m.chat, `✅ Archivo subido con éxito:\n${result.url}`, m);
    } else {
      await conn.reply(m.chat, `⚠️ Error al subir archivo.\n\nRespuesta:\n${JSON.stringify(result, null, 2)}`, m);
    }

  } catch (e) {
    console.error(e);
    m.reply("❌ Hubo un error al subir el archivo.");
  }
};

handler.help = ["wuaze"].map(v => v + " <responder a archivo>");
handler.tags = ["uploader"];
handler.command = /^wuaze$/i;

export default handler;
