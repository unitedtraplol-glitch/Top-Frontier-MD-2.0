const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { toAudio } = require('../lib/converter');

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
   🔥 USE MALVIN API (AUDIO)
================================ */
async function getMalvinAudioByUrl(youtubeUrl) {
  const apiUrl =
    `https://api.malvin.gleeze.com/download/youtube?url=${encodeURIComponent(youtubeUrl)}`;

  const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));

  if (res?.data?.status && res?.data?.audio) {
    return {
      download: res.data.audio,
      title: res.data.title,
      thumbnail: res.data.thumbnail
    };
  }

  throw new Error('Malvin API returned no audio');
}

module.exports = {
  command: 'song',
  aliases: ['music', 'audio', 'mp3'],
  category: 'music',
  description: 'Download song from YouTube (MP3)',
  usage: '.song <song name | youtube link>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const query = args.join(' ').trim();

    if (!query) {
      return sock.sendMessage(
        chatId,
        { text: '🎵 *Song Downloader*\n\nUsage:\n.song <song name | YouTube link>' },
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

      if (video.thumbnail) {
        await sock.sendMessage(
          chatId,
          {
            image: { url: video.thumbnail },
            caption:
              `🎵 *${video.title}*\n` +
              `⏱ Duration: ${video.timestamp || 'Unknown'}\n\n` +
              `📥 Downloading...`
          },
          { quoted: message }
        );
      }

      // 🔥 GET AUDIO FROM MALVIN API
      const audioData = await getMalvinAudioByUrl(video.url);
      const audioUrl = audioData.download;

      // Download audio (arraybuffer → stream fallback)
      let audioBuffer;
      try {
        const r = await axios.get(audioUrl, {
          responseType: 'arraybuffer',
          timeout: 90000,
          headers: {
            'User-Agent': AXIOS_DEFAULTS.headers['User-Agent'],
            'Accept': '*/*',
            'Accept-Encoding': 'identity'
          }
        });
        audioBuffer = Buffer.from(r.data);
      } catch {
        const r = await axios.get(audioUrl, {
          responseType: 'stream',
          timeout: 90000,
          headers: {
            'User-Agent': AXIOS_DEFAULTS.headers['User-Agent'],
            'Accept': '*/*'
          }
        });

        const chunks = [];
        await new Promise((res, rej) => {
          r.data.on('data', c => chunks.push(c));
          r.data.on('end', res);
          r.data.on('error', rej);
        });
        audioBuffer = Buffer.concat(chunks);
      }

      if (!audioBuffer || !audioBuffer.length) {
        throw new Error('Empty audio buffer');
      }

      // Detect format
      let ext = 'mp3';
      let mime = 'audio/mpeg';

      if (audioBuffer.slice(4, 8).toString('ascii') === 'ftyp') {
        ext = 'm4a';
        mime = 'audio/mp4';
      } else if (audioBuffer.toString('ascii', 0, 4) === 'OggS') {
        ext = 'ogg';
        mime = 'audio/ogg; codecs=opus';
      }

      // Convert if not mp3
      let finalBuffer = audioBuffer;
      if (ext !== 'mp3') {
        try {
          finalBuffer = await toAudio(audioBuffer, ext);
          ext = 'mp3';
          mime = 'audio/mpeg';
        } catch {
          // fallback: send original
        }
      }

      await sock.sendMessage(
        chatId,
        {
          audio: finalBuffer,
          mimetype: mime,
          fileName:
            `${(audioData.title || video.title || 'song')
              .replace(/[<>:"/\\|?*]/g, '_')}.${ext}`,
          ptt: false
        },
        { quoted: message }
      );

    } catch (err) {
      console.error('Song plugin error:', err);
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