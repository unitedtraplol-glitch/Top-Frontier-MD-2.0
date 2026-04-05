const axios = require('axios');
const yts = require('yt-search');

const AXIOS_DEFAULTS = {
  timeout: 60000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*'
  }
};

async function getMalvinSong2(youtubeUrl, quality = '320k') {
  const apiUrl =
    `https://api.malvin.gleeze.com/download/youtube2` +
    `?url=${encodeURIComponent(youtubeUrl)}&quality=${quality}`;

  const { data } = await axios.get(apiUrl, AXIOS_DEFAULTS);

  if (!data?.status || !data?.download) {
    throw new Error('Malvin youtube2 API failed');
  }

  return data;
}

module.exports = {
  command: 'song2',
  aliases: ['music2', 'audio2'],
  category: 'music',
  description: 'Download song using Malvin YouTube2 engine (High Quality)',
  usage: '.song2 <song name | youtube link> [quality]',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const query = args.join(' ').trim();
    const quality = args[1] || '320k';

    if (!query) {
      return sock.sendMessage(
        chatId,
        {
          text:
            '🎵 *Song Downloader (Alt Engine)*\n\n' +
            '*Usage:*\n.song2 <song name | YouTube link> [quality]\n\n' +
            '*Audio Quality:*\n128k, 320k (default)\n\n' +
            '*Example:*\n.song2 Alan Walker Faded 320k'
        },
        { quoted: message }
      );
    }

    try {
      let video;

      // URL or search
      if (/youtu\.?be/.test(query)) {
        video = { url: query };
      } else {
        const search = await yts(query);
        if (!search?.videos?.length) {
          return sock.sendMessage(
            chatId,
            { text: '❌ No results found.' },
            { quoted: message }
          );
        }
        video = search.videos[0];
      }

      // Thumbnail message
      if (video.thumbnail) {
        await sock.sendMessage(
          chatId,
          {
            image: { url: video.thumbnail },
            caption:
              `🎵 *${video.title}*\n` +
              `⏱ ${video.timestamp || 'Unknown'}\n\n` +
              `⬇️ Downloading (YT2 ${quality})...`
          },
          { quoted: message }
        );
      }

      // 🔥 CALL YOUR YOUTUBE2 API
      const result = await getMalvinSong2(video.url, quality);

      // Send audio
      await sock.sendMessage(
        chatId,
        {
          audio: { url: result.download },
          mimetype: 'audio/mpeg',
          fileName:
            `${(video.title || 'song')
              .replace(/[<>:"/\\|?*]/g, '_')}.mp3`,
          ptt: false,
          caption:
            `🎵 *${video.title}*\n\n` +
            `🎧 Quality: ${quality}\n` +
            `⚡ Engine: YouTube2\n` +
            `👑 API: Malvin King`
        },
        { quoted: message }
      );

    } catch (err) {
      console.error('[SONG2] Error:', err);
      await sock.sendMessage(
        chatId,
        {
          text:
            '❌ Failed to download song.\n\n' +
            (err.message || 'Unknown error')
        },
        { quoted: message }
      );
    }
  }
};