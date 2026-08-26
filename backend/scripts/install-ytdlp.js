import https from 'https';
import fs from 'fs';
import path from 'path';

function download(url, dest, cb) {
  https.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      return download(res.headers.location, dest, cb);
    }
    if (res.statusCode !== 200) {
      return cb(new Error(`Failed to download yt-dlp binary: HTTP status ${res.statusCode}`));
    }
    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on('finish', () => {
      file.close(() => {
        if (process.platform !== 'win32') {
          try {
            fs.chmodSync(dest, 0o755);
          } catch (e) {
            console.warn('Warning: Could not set executable permissions on yt-dlp binary:', e);
          }
        }
        cb(null);
      });
    });
  }).on('error', (err) => {
    fs.unlink(dest, () => cb(err));
  });
}

const binDir = path.join(process.cwd(), 'bin');
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

const isWin = process.platform === 'win32';
const targetFile = path.join(binDir, isWin ? 'yt-dlp.exe' : 'yt-dlp');

if (fs.existsSync(targetFile)) {
  console.log(`yt-dlp binary already present at ${targetFile}`);
  process.exit(0);
}

const downloadUrl = isWin
  ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
  : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

console.log(`Downloading standalone yt-dlp binary from ${downloadUrl} ...`);
download(downloadUrl, targetFile, (err) => {
  if (err) {
    console.error('Error downloading yt-dlp binary:', err);
    process.exit(1);
  }
  const stats = fs.statSync(targetFile);
  console.log(`yt-dlp binary downloaded successfully to ${targetFile} (${stats.size} bytes).`);
});
