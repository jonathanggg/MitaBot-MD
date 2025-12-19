import sharp from 'sharp';

let searchCache = new Map();
let usedStickerIndex = new Map();

let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        if (!text) {
            return m.reply(`*Ejemplo de uso:* ${usedPrefix + command} anime`);
        }

        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

        const timestamp = Date.now();
        const response = await fetch('https://api.sticker.ly/v4/stickerPack/smartSearch', {
            method: 'POST',
            headers: {
                'User-Agent': 'androidapp.stickerly/3.25.2 (220333QAG; U; Android 30; ms-MY; id;)',
                'Content-Type': 'application/json',
                'Accept-Encoding': 'gzip',
                'x-duid': Buffer.from(timestamp.toString()).toString('base64')
            },
            body: JSON.stringify({
                keyword: text,
                enabledKeywordSearch: true,
                filter: {
                    extendSearchResult: true,
                    sortBy: 'RECOMMENDED',
                    languages: ['ALL'],
                    minStickerCount: 10,
                    searchBy: 'ALL',
                    stickerType: 'ALL'
                }
            })
        });

        if (!response.ok) {
            return m.reply('🍂 *No se pudieron recuperar los datos de Sticker.ly*');
        }

        const json = await response.json();
        
        if (!json?.result?.stickerPacks || json.result.stickerPacks.length === 0) {
            return m.reply('🍂 *Sticker no encontrada*');
        }

        const allPacks = json.result.stickerPacks;
        const availablePacks = allPacks.filter(pack => 
            pack?.resourceFiles && 
            Array.isArray(pack.resourceFiles) && 
            pack.resourceFiles.length >= 5
        );

        if (availablePacks.length === 0) {
            return m.reply('🍂 *No hay paquete con suficientes sticker*');
        }

        const cacheKey = `${text}-${m.sender}`;
        let startPackIndex = searchCache.get(cacheKey) || 0;
        
        const selectedPack = availablePacks[startPackIndex % availablePacks.length];
        
        const allStickers = selectedPack.resourceFiles || [];
        const usedKey = `${text}-${selectedPack.packId}`;
        let usedIndices = usedStickerIndex.get(usedKey) || new Set();
        
        const availableStickers = allStickers
            .map((sticker, index) => ({ sticker, index }))
            .filter(item => !usedIndices.has(item.index));
        
        let stickersToSend = [];
        
        if (availableStickers.length >= 5) {
            const shuffled = [...availableStickers].sort(() => Math.random() - 0.5);
            stickersToSend = shuffled.slice(0, 5).map(item => {
                usedIndices.add(item.index);
                return item.sticker;
            });
        } else {
            usedIndices.clear();
            const randomIndices = new Set();
            while (randomIndices.size < 5 && randomIndices.size < allStickers.length) {
                randomIndices.add(Math.floor(Math.random() * allStickers.length));
            }
            stickersToSend = Array.from(randomIndices).map(idx => {
                usedIndices.add(idx);
                return allStickers[idx];
            });
        }
        
        usedStickerIndex.set(usedKey, usedIndices);
        searchCache.set(cacheKey, startPackIndex + 1);
        
        const prefix = selectedPack.resourceUrlPrefix || '';
        let successCount = 0;

        for (let i = 0; i < stickersToSend.length; i++) {
            try {
                const file = stickersToSend[i];
                const url = file.startsWith('http') ? file : prefix + file;
                
                const imageResponse = await fetch(url, { timeout: 10000 });
                if (!imageResponse.ok) continue;
                
                const arrayBuffer = await imageResponse.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                
                let stickerBuffer;
                try {
                    const sharpInstance = sharp(buffer);
                    const metadata = await sharpInstance.metadata().catch(() => ({}));
                    
                    if (metadata.width && metadata.height) {
                        stickerBuffer = await sharpInstance
                            .resize(512, 512, {
                                fit: 'contain',
                                background: { r: 0, g: 0, b: 0, alpha: 0 }
                            })
                            .webp({ 
                                quality: 90, 
                                effort: 6,
                                nearLossless: true
                            })
                            .toBuffer();
                    } else {
                        stickerBuffer = buffer;
                    }
                } catch {
                    stickerBuffer = buffer;
                }
                
                await conn.sendMessage(
                    m.chat,
                    { sticker: stickerBuffer },
                    { quoted: m }
                );
                
                successCount++;
                
                if (i < stickersToSend.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 700));
                }
                
            } catch {
                console.log(`Sticker ${i + 1} gagal`);
            }
        }
        
        if (successCount === 0) {
            await m.reply('🍂 *No se pudieron enviar todos los stickers*');
        } else if (successCount < stickersToSend.length) {
            await m.reply(`*✅ ${successCount} sticker enviado con éxito*`);
        }
        
    } catch (error) {
        console.error('Error:', error);
        await m.reply('🍂 *Se produjo un error al procesar el sticker.*');
    } finally {
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } });
    }
};

handler.help = ['stickerly'];
handler.tags = ['tools'];
handler.command = ['stickerly', 'stickersearch']
handler.limit = true;

export default handler;
