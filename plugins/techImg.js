const axios = require('axios');
const { fakevCard } = require('../lib/fakevCard');

module.exports = {
  command: 'tech',
  aliases: ['technology', 'techimg'],
  category: 'images',
  description: 'Get a random tech image',
  usage: '.tech',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      const res = await axios.get('https://discardapi.dpdns.org/api/img/tech?apikey=guru');

      if (!res.data || res.data.status !== true || !res.data.result) {
        return await sock.sendMessage(chatId, { text: '❌ Failed to fetch image.' }, { quoted: message });
      }

      const imageUrl = res.data.result;

      await sock.sendMessage(chatId, { image: { url: imageUrl }, caption: '💻 Tech Image' }, { quoted: fakevCard });

    } catch (err) {
      console.error('Tech image plugin error:', err);
      await sock.sendMessage(chatId, { text: '❌ Error while fetching image.' }, { quoted: message });
    }
  }
};
