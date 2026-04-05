const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const axios = require('axios');
const zlib = require('zlib'); // ✅ ADDED FOR KING SESSION

/**
 * Enhanced MEGA + Base64 session system
 * Supports:
 * 1. KING MongoDB session: "king~SHORT_ID"
 * 2. Base64 session: "starcore~BASE64_DATA"
 * 3. MEGA.nz session: "malvin~MEGA_FILE_ID"
 * 4. Direct MEGA URL: "https://mega.nz/file/..."
 */

async function SaveCreds(txt) {
    try {
        const __dirname = path.dirname(__filename);
        const sessionDir = path.join(__dirname, '..', 'session');
        
        // Ensure session directory exists
        if (!fsSync.existsSync(sessionDir)) {
            await fs.mkdir(sessionDir, { recursive: true });
        }
        
        const credsPath = path.join(sessionDir, 'creds.json');
        
        if (!txt) {
            console.log('⚠️ No session ID provided, skipping session download');
            return false;
        }
        
        console.log(`🔍 Processing session ID: ${txt.substring(0, 30)}...`);
        
        // Check session type
        if (txt.startsWith("king~")) {
            await handleKingSession(txt, credsPath);
            
        } else if (txt.startsWith("starcore~")) {
            // Handle Base64 session
            await handleBase64Session(txt, credsPath);
            
        } else if (txt.startsWith("malvin~")) {
            // Handle MEGA.nz session
            await handleMegaSession(txt, credsPath);
            
        } else if (txt.includes('mega.nz') || txt.includes('/file/')) {
            // Handle direct MEGA URL
            await handleMegaUrl(txt, credsPath);
            
        } else if (/^[A-Za-z0-9+/=]+$/.test(txt) && txt.length > 100) {
            // Direct Base64 without prefix
            await handleDirectBase64(txt, credsPath);
            
        } else {
            console.log('⚠️ Unknown session format, trying as direct Base64');
            try {
                await handleDirectBase64(txt, credsPath);
            } catch (error) {
                console.error('❌ Invalid session format. Use:');
                console.error('   - king~SHORT_ID');
                console.error('   - Base64: starcore~BASE64_DATA');
                console.error('   - MEGA.nz: malvin~MEGA_FILE_ID');
                console.error('   - Direct MEGA URL: https://mega.nz/file/...');
                throw error;
            }
        }
        
        // Verify the session was saved
        if (fsSync.existsSync(credsPath)) {
            const stats = fsSync.statSync(credsPath);
            if (stats.size > 100) {
                console.log('✅ Session saved successfully!');
                return true;
            }
        }
        
        throw new Error('Session file not created or too small');
        
    } catch (error) {
        console.error('❌ Error saving credentials:', error.message);
        throw error;
    }
}

/**
 * Handle KING MongoDB session (king~ prefix)
 */
async function handleKingSession(sessionId, outputPath) {
    console.log('🌐 Fetching king-session from API...');

    const sessionSite = process.env.SESSION_SITE || global.SESSION_SITE;

    if (!sessionSite) {
        throw new Error("SESSION_SITE not defined in environment");
    }

    const shortId = sessionId.replace("king~", "");

    const response = await axios.get(`${sessionSite}/session/${shortId}`, {
        timeout: 20000
    });

    if (!response.data || response.data.success !== true) {
        throw new Error("Invalid API response or session not found");
    }

    const sessionObject = response.data.session;

    if (!sessionObject || typeof sessionObject !== "object") {
        throw new Error("Session object missing from API response");
    }

    // Save directly as JSON
    await fs.writeFile(outputPath, JSON.stringify(sessionObject, null, 2));

    console.log('✅ KING session downloaded and saved');
}

/**
 * Handle Base64 session (starcore~ prefix)
 */
async function handleBase64Session(sessionId, outputPath) {
    console.log('🔓 Decoding Base64 session...');
    
    const base64Data = sessionId.replace("starcore~", "");
    
    if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
        throw new Error("Invalid base64 format");
    }
    
    const decodedData = Buffer.from(base64Data, "base64");
    
    try {
        JSON.parse(decodedData.toString("utf-8"));
    } catch (parseError) {
        throw new Error("Invalid JSON in session data: " + parseError.message);
    }
    
    await fs.writeFile(outputPath, decodedData);
    console.log('✅ Base64 session decoded and saved');
}

/**
 * Handle MEGA.nz session (malvin~ prefix)
 */
async function handleMegaSession(sessionId, outputPath) {
    console.log('📥 Downloading MEGA.nz session...');
    
    const megaFileId = sessionId.replace("malvin~", "");
    
    try {
        const { File } = require('megajs');
        const file = File.fromURL(`https://mega.nz/file/${megaFileId}`);
        
        return new Promise((resolve, reject) => {
            file.loadAttributes((err, attributes) => {
                if (err) {
                    reject(new Error(`Failed to load file attributes: ${err.message}`));
                    return;
                }
                
                console.log(`📦 Downloading file: ${attributes.name} (${formatBytes(attributes.size)})`);
                
                file.download((err, data) => {
                    if (err) {
                        reject(new Error(`Download failed: ${err.message}`));
                        return;
                    }
                    
                    fs.writeFile(outputPath, data)
                        .then(() => {
                            console.log('✅ MEGA session downloaded successfully');
                            resolve(true);
                        })
                        .catch(writeError => {
                            reject(new Error(`Failed to save file: ${writeError.message}`));
                        });
                });
            });
        });
        
    } catch (error) {
        console.log('⚠️ megajs failed, trying direct download...');
        await handleDirectMegaDownload(megaFileId, outputPath);
    }
}

/**
 * Handle direct MEGA URL
 */
async function handleMegaUrl(url, outputPath) {
    console.log(`🌐 Downloading from MEGA URL: ${url}`);
    
    let fileId;
    if (url.includes('/file/')) {
        fileId = url.split('/file/')[1]?.split('#')[0];
    } else if (url.includes('/#!')) {
        fileId = url.split('/#!')[1]?.split('!')[1];
    }
    
    if (!fileId) {
        throw new Error('Could not extract file ID from MEGA URL');
    }
    
    await handleMegaSession(`malvin~${fileId}`, outputPath);
}

/**
 * Handle direct Base64 without prefix
 */
async function handleDirectBase64(base64String, outputPath) {
    console.log('🔓 Decoding direct Base64...');
    
    let cleanBase64 = base64String;
    if (base64String.includes('base64,')) {
        cleanBase64 = base64String.split('base64,')[1];
    }
    
    if (!/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
        throw new Error("Invalid base64 format");
    }
    
    const decodedData = Buffer.from(cleanBase64, "base64");
    
    try {
        JSON.parse(decodedData.toString("utf-8"));
    } catch (error) {
        throw new Error("Invalid JSON in base64 data");
    }
    
    await fs.writeFile(outputPath, decodedData);
    console.log('✅ Direct Base64 session saved');
}

/**
 * Direct MEGA download fallback
 */
async function handleDirectMegaDownload(fileId, outputPath) {
    try {
        const response = await axios.get(`https://mega.nz/file/${fileId}`, {
            responseType: 'arraybuffer',
            timeout: 30000
        });
        
        await fs.writeFile(outputPath, response.data);
        console.log('✅ Direct download completed');
    } catch (error) {
        throw new Error(`Direct download failed: ${error.message}`);
    }
}

/**
 * Utility function to format bytes
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = SaveCreds;


