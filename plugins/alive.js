const os = require("os");
const process = require("process");
const settings = require("../settings");
const { fakevCard } = require('../lib/fakevCard');
const { channelInfo } = require('../lib/messageConfig');

module.exports = {
  command: 'alive',
  aliases: ['status', 'bot'],
  category: 'general',
  description: 'Check bot status and system info',
  usage: '.alive',
  isPrefixless: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      let uptime = Math.floor(process.uptime());

      const days = Math.floor(uptime / 86400);
      uptime %= 86400;
      const hours = Math.floor(uptime / 3600);
      uptime %= 3600;
      const minutes = Math.floor(uptime / 60);
      const seconds = uptime % 60;

      const uptimeParts = [];
      if (days) uptimeParts.push(`${days}d`);
      if (hours) uptimeParts.push(`${hours}h`);
      if (minutes) uptimeParts.push(`${minutes}m`);
      if (seconds || uptimeParts.length === 0) uptimeParts.push(`${seconds}s`);

      const uptimeText = uptimeParts.join(' ');
      const totalMem = (os.totalmem() / 1024 / 1024).toFixed(2);
      const freeMem = (os.freemem() / 1024 / 1024).toFixed(2);
      const usedMem = (totalMem - freeMem).toFixed(2);
      const cpuLoad = os.loadavg()[0].toFixed(2);
      const platform = os.platform();
      const arch = os.arch();
      const nodeVersion = process.version;

      const text =
        `🤖 ${settings.botName} ɪs ᴀᴄᴛɪᴠᴇ!\n\n` +
        `🚀 Vᴇʀsɪᴏɴ: ${settings.version}\n` +
        `⏰ ᴜᴘᴛɪᴍᴇ: ${uptimeText}\n` +
        `📟 Rᴀᴍ ᴜsᴀɢᴇ: ${usedMem} MB / ${totalMem} MB\n` +
        `📊 Cᴘᴜ: ${cpuLoad}\n` +
        `📡 Pʟᴀᴛғᴏʀᴍ: ${platform} (${arch})\n` +
        `📉 Nᴏᴅᴇ.js: ${nodeVersion}\n\n`+
        `> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ꧁𝕗𝕽𝕠𝕟𝕥𝕚𝕖𝕣꧂ ᴛᴇᴄʜ`;

      await sock.sendMessage(chatId, {
        text,
        ...channelInfo 
      }, { quoted: fakevCard });

    } catch (error) {
      console.error('Error in alive command:', error);
      await sock.sendMessage(chatId, { text: '✅ Bot is alive and running!' }, { quoted: message });
    }
  }
};
