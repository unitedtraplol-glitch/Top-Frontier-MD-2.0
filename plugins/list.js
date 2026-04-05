const { fakevCard } = require('../lib/fakevCard');
const settings = require('../settings');
const commandHandler = require('../lib/commandHandler');
const path = require('path');
const fs = require('fs');
const moment = require('moment-timezone');
const axios = require('axios');

// Function to convert text to tiny caps
const toTinyCaps = (text) => {
    const tinyCapsMap = {
        a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
        j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ',
        s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
    };
    return text.toLowerCase().split('').map(c => tinyCapsMap[c] || c).join('');
};

// Function to fetch GitHub repository forks
const fetchGitHubForks = async () => {
    try {
        const repo = 'XdKing2/star-xd';
        const response = await axios.get(`https://api.github.com/repos/${repo}`);
        return response.data.forks_count || 'ɴ/ᴀ';
    } catch (e) {
        console.error('ᴇʀʀᴏʀ ғᴇᴛᴄʜɪɴɢ ɢɪᴛʜᴜʙ ғᴏʀᴋs:', e);
        return 'ɴ/ᴀ';
    }
};

function formatTime() {
    const timezone = settings.timezone || 'Africa/Harare';
    return moment().tz(timezone).format('HH:mm:ss');
}

function formatDate() {
    const timezone = settings.timezone || 'Africa/Harare';
    return moment().tz(timezone).format('DD/MM/YYYY');
}

// Helper function to get owner name
const getOwnerName = () => {
    try {
        const botOwner = require('../settings');
        return botOwner.getOwnerName ? botOwner.getOwnerName() : settings.botOwner || 'ᴏᴡɴᴇʀ';
    } catch (e) {
        return settings.ownerName || 'ᴍʀ xᴅ';
    }
};

// Only the organized styles
const menuStyles = [
    {
        render({ title, info, categories, prefix }) {
            const ownerName = getOwnerName();
            const forks = info.forks || 'ɴ/ᴀ';
            
            let t = `\`🌸⃟﹟﹟﹟﹟﹟﹟﹟﹟﹟﹟⃟🌸\`\n\n`;
            t += ` ╭─ ♡ ⋅ 🎀 ${toTinyCaps(info.bot)} 🎀 ⋅ ♡ ─\n`;
            t += `│ 👤 ᴏᴡɴᴇʀ   : ${toTinyCaps(ownerName)}\n`;
            t += `│ ⏰ ᴛɪᴍᴇ: ${info.time}\n`;
            t += `│ 📅 ᴅᴀᴛᴇ: ${info.date}\n`;
            t += `│ 🌍 ᴍᴏᴅᴇ: ${toTinyCaps(info.mode)}\n`;
            t += `│ ⌨️ ᴘʀᴇғɪx: [ ${info.prefix} ]\n`;
            t += `│ 🧩 ᴄᴏᴍᴍᴀɴᴅs: ${info.total}\n`;
            t += `│ 🚀 ᴠᴇʀsɪᴏɴ: ${info.version}\n`;
            t += `│ 👥 ᴛᴏᴛᴀʟ ᴜsᴇʀs : ${forks}\n`;
            t += `╰────────────\n\n`;
            t += `🌸⃟﹟﹟﹟﹟﹟﹟﹟﹟﹟﹟⃟🌸\n\n`;

            for (const [cat, cmds] of categories) {
                t += `\`${cat.toUpperCase()}\`\n`;
                t += `┌─・❥\n`;
                for (const c of cmds)
                    t += `│ • ${prefix}${c}\n`;
                t += `└─・❥\n\n`;
            }
            
            t += `> ᴊᴏɪɴ ᴏᴜʀ ᴄʜᴀɴɴᴇʟ!:`;
            
            return t;
        }
    },

    {
        render({ title, info, categories, prefix }) {
            const ownerName = getOwnerName();
            const forks = info.forks || 'ɴ/ᴀ';
            
            let t = `◈━═◈「 ${toTinyCaps(info.bot)} 」◈━═◈\n\n`;
            t += `╔═══ • ═══╗\n`;
            t += `║  OWNER: ${toTinyCaps(ownerName)}\n`;
            t += `║  TIME: ${info.time} | ${info.date}\n`;
            t += `║  MODE: ${toTinyCaps(info.mode)}\n`;
            t += `║  PREFIX: [ ${info.prefix} ]\n`;
            t += `║  CMDS: ${info.total}\n`;
            t += `║  VERSION: ${info.version}\n`;
            t += `║  USERS: ${forks}\n`;
            t += `╚═══ • ═══╝\n\n`;

            for (const [cat, cmds] of categories) {
                t += `━━━━ *${cat.toUpperCase()}* ━━━━\n`;
                t += `│\n`;
                for (let i = 0; i < cmds.length; i += 3) {
                    const row = cmds.slice(i, i + 1);
                    t += `│  ${row.map(c => `• ${prefix}${c}`).join('   ')}\n`;
                }
                t += `│\n`;
            }
            
            t += `━━━━━━━━━━━━━\n`;
            t += `> ᴊᴏɪɴ ᴏᴜʀ ᴄʜᴀɴɴᴇʟ `;
            
            return t;
        }
    },

  {
    render({ title, info, categories, prefix }) {
        const ownerName = getOwnerName();
        const forks = info.forks || 'ɴ/ᴀ';
        
        let t = `✧･ﾟ: *✧･ﾟ:* ${toTinyCaps(info.bot)} *:･ﾟ✧*:･ﾟ✧\n\n`;
        t += `╭────⊰ ɪɴғᴏ ⊱──╮\n`;
        t += `│ • ᴏᴡɴᴇʀ : ${toTinyCaps(ownerName)}\n`;
        t += `│ • ᴛɪᴍᴇ : ${info.time}\n`;
        t += `│ • ᴅᴀᴛᴇ : ${info.date}\n`;
        t += `│ • ᴍᴏᴅᴇ : ${toTinyCaps(info.mode)}\n`;
        t += `│ • ᴘʀᴇғɪx: ${info.prefix}\n`;
        t += `│ • ᴄᴍᴅs : ${info.total}\n`;
        t += `│ • ᴠᴇʀsɪᴏɴ : ${info.version}\n`;
        t += `│ • ᴜsᴇʀs : ${forks}\n`;
        t += `╰───────────╯\n\n`;

        for (const [cat, cmds] of categories) {
            t += `╭──⊱ ${cat.toUpperCase()} ⊰───╮\n`;
            for (const c of cmds) {
                t += `│ • ${prefix}${c}\n`;
            }
            t += `╰───────────╯\n\n`;
        }
        
        return t;
    }
},
    {
        render({ title, info, categories, prefix }) {
            const ownerName = getOwnerName();
            const forks = info.forks || 'ɴ/ᴀ';
            
            let t = `🌸 *${toTinyCaps(info.bot)}* 🌸\n\n`;
            t += `┌─[ ɪɴғᴏʀᴍᴀᴛɪᴏɴ ]─┐\n`;
            t += `│ ᴏᴡɴᴇʀ : ${toTinyCaps(ownerName)}\n`;
            t += `│ ᴛɪᴍᴇ : ${info.time}\n`;
            t += `│ ᴅᴀᴛᴇ : ${info.date}\n`;
            t += `│ ᴍᴏᴅᴇ : ${toTinyCaps(info.mode)}\n`;
            t += `│ ᴘʀᴇғɪx: [ ${info.prefix} ]\n`;
            t += `│ ᴄᴍᴅs : ${info.total}\n`;
            t += `│ ᴠᴇʀ : ${info.version}\n`;
            t += `│ ᴜsᴇʀs: ${forks}\n`;
            t += `└──────────┘\n\n`;

            for (const [cat, cmds] of categories) {
                t += `┌─[ ${cat.toUpperCase()} ]─┐\n`;
                for (const c of cmds) {
                    t += `│ • ${prefix}${c}\n`;
                }
                t += 
                `└──────────┘\n\n`;
            }
            
            t += `Join our channel!`;
            
            return t;
        }
    }
];

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

module.exports = {
    command: 'menu',
    aliases: ['help', 'commands', 'h', 'list'],
    category: 'general',
    description: 'Show all commands',
    usage: '.menu [command]',

    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        const prefix = settings.prefixes[0];
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');

        if (args.length) {
            const searchTerm = args[0].toLowerCase();
            
            let cmd = commandHandler.commands.get(searchTerm);
            
            if (!cmd && commandHandler.aliases.has(searchTerm)) {
                const mainCommand = commandHandler.aliases.get(searchTerm);
                cmd = commandHandler.commands.get(mainCommand);
            }
            
            if (!cmd) {
                return sock.sendMessage(chatId, { 
                    text: `❌ ᴄᴏᴍᴍᴀɴᴅ "${args[0]}" ɴᴏᴛ ғᴏᴜɴᴅ.\n\nᴜsᴇ ${prefix}menu ᴛᴏ sᴇᴇ ᴀʟʟ ᴄᴏᴍᴍᴀɴᴅs.`,
                    ...channelInfo
                }, { quoted: message });
            }

            const text = 
`╭━━━━━━━━━━━━━━⬣
┃ 📌 *ᴄᴏᴍᴍᴀɴᴅ ɪɴғᴏ*
┃
┃ ⚡ *ᴄᴏᴍᴍᴀɴᴅ:* ${prefix}${cmd.command}
┃ 📝 *ᴅᴇsᴄ:* ${cmd.description || 'ɴᴏ ᴅᴇsᴄʀɪᴘᴛɪᴏɴ'}
┃ 📖 *ᴜsᴀɢᴇ:* ${cmd.usage || `${prefix}${cmd.command}`}
┃ 🏷️ *ᴄᴀᴛᴇɢᴏʀʏ:* ${cmd.category || 'ᴍɪsᴄ'}
┃ 🔖 *ᴀʟɪᴀsᴇs:* ${cmd.aliases?.length ? cmd.aliases.map(a => prefix + a).join(', ') : 'ɴᴏɴᴇ'}
┃
╰━━━━━━━━━━━━━━⬣`;

            if (fs.existsSync(imagePath)) {
                return sock.sendMessage(chatId, {
                    image: { url: imagePath },
                    caption: text,
                    ...channelInfo
                }, { quoted: fakevCard });
            }

            return sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: message });
        }

        const forks = await fetchGitHubForks();
        const style = pick(menuStyles);

        const text = style.render({
            title: settings.botName,
            prefix,
            info: {
                bot: settings.botName,
                prefix: settings.prefixes.join(', '),
                total: commandHandler.commands.size,
                version: settings.version || "5.0.0",
                time: formatTime(),
                date: formatDate(),
                mode: settings.commandMode || 'ᴘᴜʙʟɪᴄ',
                forks: forks
            },
            categories: commandHandler.categories
        });

        // Try external image first
        const imageUrl = settings.imageUrl || settings.MENU_IMAGE_URL;
        if (imageUrl) {
            try {
                const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                if (response.status === 200) {
                    const imageBuffer = Buffer.from(response.data, 'binary');
                    
                    await sock.sendMessage(chatId, {
                        image: imageBuffer,
                        caption: text,
                        ...channelInfo
                    }, { quoted: fakevCard });
                    return;
                }
            } catch (imageError) {
                console.error('ᴇʀʀᴏʀ ʟᴏᴀᴅɪɴɢ ɪᴍᴀɢᴇ:', imageError);
            }
        }

        // Fallback to local image or text only
        if (fs.existsSync(imagePath)) {
            await sock.sendMessage(chatId, {
                image: { url: imagePath },
                caption: text,
                ...channelInfo
            }, { quoted: fakevCard });
        } else {
            await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: message });
        }
    }
};