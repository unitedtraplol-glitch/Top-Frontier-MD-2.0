require('dotenv').config();
const setting = require('./setting');


const settings = {

  botName: setting.BOT_NAME,
  botOwner: setting.OWNER_NAME,
  ownerNumber: setting.OWNER_NUMBER,
  timeZone: setting.TIMEZONE || 'Africa/Harare',
  prefixes: setting.PREFIXES || ['.', '!', '#'], // Multiple prefix support you can add one or more
  packname: '𝕗𝕣𝕠𝕟𝕥𝕚𝕖𝕣 xᴅ',
  author: 'ᴍʀ 𝕗𝕣𝕠𝕟𝕥𝕚𝕖𝕣',
  giphyApiKey: 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  commandMode: "public",
  maxStoreMessages: 20,
  tempCleanupInterval: 1 * 60 * 60 * 1000, // 1 hours
  storeWriteInterval: 10000,
  description: "This is a bot for managing group commands and automating tasks.",
  version: "3.0.0",
  updateZipUrl: "https://github.com/XdKing2/star-xd/archive/refs/heads/main.zip",
  channelLink: "https://whatsapp.com/channel/0029VbCOmtyBVJkvW1Qn7d38",
  ytch: "frontiertrch"
};

module.exports = settings;

