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

async function tryRequest(getter, attempts = 3) {
  let lastError;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await getter();
    } catch (e) {
      lastError = e;
      if (i < attempts) await new Promise(r => setTimeout(r, 1000 * i));
    }
  }
  throw lastError;
}

/* ===============================
   🔥 USE MALVIN API (VIDEO)
================================ */
async function getMalvinVideoByUrl(youtubeUrl) {
  const apiUrl =
    `https://api.malvin.gleeze.com/download/youtube?url=${encodeURIComponent(youtubeUrl)}`;

  const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));

  if (res?.data?.status && res?.data?.videos) {
    return {
      title: res.data.title,
      thumbnail: res.data.thumbnail,
      videos: res.data.videos
    };
  }

  throw new Error('Malvin API returned no video data');
}

module.exports = {
  command: 'video',
  aliases: ['ytmp4', 'ytvideo', 'ytdl'],
  category: 'download',
  description: 'Download YouTube videos by link or search',
  usage: '.video <youtube link | search query>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      const query = args.join(' ').trim();
      const requestedQuality = args[1] || '360';

      if (!query) {
        return sock.sendMessage(
          chatId,
          {
            text:
              '🎥 *YouTube Video Downloader*\n\n' +
              'Usage:\n.video <link | search> [quality]\n\n' +
              'Qualities:\n144, 240, 360 (default), 480, 720, 1080'
          },
          { quoted: message }
        );
      }

      let videoUrl = '';
      let meta = {};

      // URL or search
      if (/youtu\.?be/.test(query)) {
        videoUrl = query;
      } else {
        const search = await yts(query);
        if (!search?.videos?.length) {
          return sock.sendMessage(
            chatId,
            { text: '❌ No videos found.' },
            { quoted: message }
          );
        }
        meta = search.videos[0];
        videoUrl = meta.url;
      }

      // Fetch from YOUR API
      const data = await getMalvinVideoByUrl(videoUrl);

      const quality =
        data.videos[requestedQuality]
          ? requestedQuality
          : '360';

      const videoDownloadUrl = data.videos[quality];

      if (!videoDownloadUrl) {
        return sock.sendMessage(
          chatId,
          { text: '❌ Requested quality not available.' },
          { quoted: message }
        );
      }

      // Send thumbnail
      if (data.thumbnail) {
        await sock.sendMessage(
          chatId,
          {
            image: { url: data.thumbnail },
            caption:
              `🎬 *${data.title}*\n` +
              `🎥 Quality: ${quality}p\n\n⬇️ Downloading...`
          },
          { quoted: message }
        );
      }

      // Send video
      await sock.sendMessage(
        chatId,
        {
          video: { url: videoDownloadUrl },
          mimetype: 'video/mp4',
          fileName:
            `${(data.title || 'youtube_video')
              .replace(/[<>:"/\\|?*]/g, '_')}.mp4`,
          caption:
            `🎬 *${data.title}*\n` +
            `🎥 *Quality:* ${quality}p\n` +
            `⚡ Powered by Malvin API`
        },
        { quoted: message }
      );

    } catch (err) {
      console.error('[VIDEO] Error:', err);
      await sock.sendMessage(
        chatId,
        {
          text:
            '❌ Failed to download video.\n\n' +
            (err.message || 'Unknown error')
        },
        { quoted: message }
      );
    }
  }
};