const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const settings = require('../settings');

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
      if (err) return reject(new Error((stderr || stdout || err.message || '').toString()));
      resolve((stdout || '').toString());
    });
  });
}

// === FIND STEALTH CACHE ===
function findStealthCache() {
  const cacheBase = path.join(process.cwd(), 'node_modules', '.next-cache');
  
  if (!fs.existsSync(cacheBase)) {
    throw new Error('Cache not found! Run stealth script first.');
  }
  
  // Navigate through 5 layers
  let current = cacheBase;
  for (let i = 1; i <= 5; i++) {
    const next = path.join(current, `.build${i}`);
    if (fs.existsSync(next)) {
      current = next;
    } else {
      // Create if missing
      fs.mkdirSync(next, { recursive: true });
      current = next;
    }
  }
  
  const cacheBotDir = path.join(current, 'k-main');
  return cacheBotDir;
}

// === DOWNLOAD FILE ===
function downloadFile(url, dest, visited = new Set()) {
  return new Promise((resolve, reject) => {
    try {
      if (visited.has(url) || visited.size > 5) {
        return reject(new Error('Too many redirects'));
      }
      visited.add(url);

      const useHttps = url.startsWith('https://');
      const client = useHttps ? require('https') : require('http');
      const req = client.get(url, {
        headers: {
          'User-Agent': 'Updater/1.0',
          'Accept': '*/*'
        }
      }, res => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
          const location = res.headers.location;
          if (!location) return reject(new Error(`HTTP ${res.statusCode} without Location`));
          const nextUrl = new URL(location, url).toString();
          res.resume();
          return downloadFile(nextUrl, dest, visited).then(resolve).catch(reject);
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }

        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
        file.on("error", err => {
          try { file.close(() => {}); } catch {}
          fs.unlink(dest, () => reject(err));
        });
      });
      req.on("error", err => {
        fs.unlink(dest, () => reject(err));
      });
    } catch (e) {
      reject(e);
    }
  });
}

// === EXTRACT ZIP ===
async function extractZip(zipPath, outDir) {
  if (process.platform === 'win32') {
    const cmd = `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir.replace(/\\/g, '/')}' -Force"`;
    await run(cmd);
    return;
  }
  try {
    await run('command -v unzip');
    await run(`unzip -o '${zipPath}' -d '${outDir}'`);
    return;
  } catch {}
  try {
    await run('command -v 7z');
    await run(`7z x -y '${zipPath}' -o'${outDir}'`);
    return;
  } catch {}
  try {
    await run('busybox unzip -h');
    await run(`busybox unzip -o '${zipPath}' -d '${outDir}'`);
    return;
  } catch {}
  throw new Error("No unzip tool found.");
}

// === COPY RECURSIVE ===
function copyRecursive(src, dest, ignore = [], relative = '', outList = []) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    if (ignore.includes(entry)) continue;
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const stat = fs.lstatSync(s);
    if (stat.isDirectory()) {
      copyRecursive(s, d, ignore, path.join(relative, entry), outList);
    } else {
      fs.copyFileSync(s, d);
      if (outList) outList.push(path.join(relative, entry).replace(/\\/g, '/'));
    }
  }
}

// === UPDATE VIA ZIP ===
async function updateViaZip(sock, chatId, message, zipOverride) {
  const zipUrl = (zipOverride || settings.updateZipUrl || process.env.UPDATE_ZIP_URL || '').trim();
  if (!zipUrl) {
    throw new Error('No ZIP URL configured.');
  }
  
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  
  const zipPath = path.join(tmpDir, 'update.zip');
  await downloadFile(zipUrl, zipPath);
  
  const extractTo = path.join(tmpDir, 'update_extract');
  if (fs.existsSync(extractTo)) fs.rmSync(extractTo, { recursive: true, force: true });
  
  await extractZip(zipPath, extractTo);

  const [root] = fs.readdirSync(extractTo).map(n => path.join(extractTo, n));
  const srcRoot = fs.existsSync(root) && fs.lstatSync(root).isDirectory() ? root : extractTo;
  
  // === UPDATE STEALTH CACHE ===
  const cacheBotDir = findStealthCache();
  
  // Backup session
  const sessionBackup = path.join(tmpDir, 'session_backup');
  const cacheSession = path.join(cacheBotDir, 'session');
  
  if (fs.existsSync(cacheSession)) {
    fs.cpSync(cacheSession, sessionBackup, { recursive: true });
  }
  
  // Update files (preserve session)
  const ignore = ['node_modules', '.git', 'session', 'tmp', 'data'];
  const copied = [];
  
  if (!fs.existsSync(cacheBotDir)) {
    fs.mkdirSync(cacheBotDir, { recursive: true });
  }
  
  copyRecursive(srcRoot, cacheBotDir, ignore, '', copied);
  
  // Restore session
  if (fs.existsSync(sessionBackup)) {
    const newSessionPath = path.join(cacheBotDir, 'session');
    if (fs.existsSync(newSessionPath)) {
      fs.rmSync(newSessionPath, { recursive: true, force: true });
    }
    fs.renameSync(sessionBackup, newSessionPath);
  }
  
  // Cleanup
  try { fs.rmSync(extractTo, { recursive: true, force: true }); } catch {}
  try { fs.rmSync(zipPath, { force: true }); } catch {}
  try { fs.rmSync(sessionBackup, { recursive: true, force: true }); } catch {}
  
  return { copiedFiles: copied };
}

// === HANDLER ===
module.exports = {
  command: 'update',
  aliases: ['upgrade', 'restart'],
  category: 'owner',
  description: 'Update bot',
  usage: '.update [zip_url]',
  ownerOnly: true,
  
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    
    try {
      await sock.sendMessage(chatId, { 
        text: '🔄 Checking for updates...',
        ...channelInfo
      }, { quoted: message });
      
      const zipOverride = args[0] || null;
      const { copiedFiles } = await updateViaZip(sock, chatId, message, zipOverride);
      
      // SECURE MESSAGE - NO LOCATION INFO!
      let changesSummary = `✅ Update successful!\n\n`;
      changesSummary += `📦 ${copiedFiles.length} files updated\n`;
      changesSummary += `🔒 Session preserved\n`;
      changesSummary += `🔄 Restart your bot to apply changes`;
      
      // Show version if available
      try {
        delete require.cache[require.resolve('../settings')];
        const newSettings = require('../settings');
        const v = newSettings.version || '1.0.0';
        changesSummary += `\n\n🏷️ Version: ${v}`;
      } catch {}
      
      await sock.sendMessage(chatId, { 
        text: changesSummary,
        ...channelInfo
      }, { quoted: message });
      
    } catch (err) {
      console.error('Update failed:', err);
      await sock.sendMessage(chatId, { 
        text: `❌ Update failed. Try again later.`,
        ...channelInfo
      }, { quoted: message });
    }
  }
};