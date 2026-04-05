const axios = require('axios');
const { fakevCard } = require('../lib/fakevCard');

function isValidYouTubeUrl(url) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url);
}

module.exports = {
  command: 'ytvid',
  aliases: ['ytvideo', 'ytdl'],
  category: 'download',
  description: 'Download YouTube videos',
  usage: '.ytvid <youtube url> [quality]',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      if (!args[0]) {
        return sock.sendMessage(
          chatId,
          {
            text:
              "*YouTube Video Downloader*\n\n" +
              "*Usage:*\n`.ytvid <url> [quality]`\n\n" +
              "*Quality Options:*\n144, 240, 360 (default), 480, 720, 1080"
          },
          { quoted: message }
        );
      }

      const url = args[0];
      const quality = args[1] || '360';

      const validQualities = ['144', '240', '360', '480', '720', '1080'];
      if (!validQualities.includes(quality)) {
        return sock.sendMessage(
          chatId,
          { text: `❌ Invalid quality!\n\nAvailable: ${validQualities.join(', ')}` },
          { quoted: message }
        );
      }

      if (!isValidYouTubeUrl(url)) {
        return sock.sendMessage(
          chatId,
          { text: "❌ Invalid YouTube URL!" },
          { quoted: message }
        );
      }

      // 🔥 MALVIN API
      const apiUrl =
        `https://api.malvin.gleeze.com/download/youtube?url=${encodeURIComponent(url)}`;

      const { data } = await axios.get(apiUrl, { timeout: 60000 });

      if (!data?.status || !data?.videos) {
        return sock.sendMessage(
          chatId,
          { text: "❌ API failed to fetch video." },
          { quoted: message }
        );
      }

      // pick requested quality or fallback
      const videoUrl =
        data.videos[quality] || data.videos['360'];

      if (!videoUrl) {
        return sock.sendMessage(
          chatId,
          { text: "❌ Requested quality not available." },
          { quoted: message }
        );
      }

      const title = data.title || 'YouTube Video';

      await sock.sendMessage(
        chatId,
        {
          text:
            `📥 *Downloading...*\n\n` +
            `🎬 *${title}*\n` +
            `🎥 Quality: ${quality}p`
        },
        { quoted: fakevCard }
      );

      await sock.sendMessage(
        chatId,
        {
          video: { url: videoUrl },
          mimetype: 'video/mp4',
          fileName: `${title}.mp4`,
          caption:
            `🎬 *${title}*\n\n` +
            `🎥 *Quality:* ${quality}p\n` +
            `⚡ Powered by Malvin API`
        },
        { quoted: fakevCard }
      );

    } catch (err) {
      console.error('YTVID Error:', err);
      await sock.sendMessage(
        chatId,
        {
          text: `❌ *Download failed!*\n\n${err.message || 'Unknown error'}`
        },
        { quoted: message }
      );
    }
  }
};