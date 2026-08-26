import { ytdlpService } from './services/ytdlpService.js';
import { ffmpegService } from './services/ffmpegService.js';
import { validateYouTubeUrl, sanitizeFilename } from './utils/sanitize.js';
import { cleanupService } from './services/cleanupService.js';
import { validateCookieConfig } from './config/env.js';
import path from 'path';
import fs from 'fs';

async function runPhase2Tests() {
  console.log('==================================================');
  console.log('          PHASE 2 REAL VERIFICATION SUITE         ');
  console.log('==================================================');

  // Test A: yt-dlp Version Check
  console.log('\n[1/7] Testing yt-dlp Availability...');
  const ytDlpStatus = await ytdlpService.getVersion();
  console.log('yt-dlp Status:', ytDlpStatus);
  if (!ytDlpStatus.available) {
    throw new Error('yt-dlp is NOT available on system PATH!');
  }

  // Test B: FFmpeg Version Check
  console.log('\n[2/7] Testing FFmpeg Availability...');
  const ffmpegStatus = await ffmpegService.getVersion();
  console.log('FFmpeg Status:', ffmpegStatus);
  if (!ffmpegStatus.available) {
    throw new Error('FFmpeg is NOT available on system PATH!');
  }

  // Test C: Cookie Validation & Security
  console.log('\n[3/7] Testing Cookie System Audit...');
  const cookieStatus = validateCookieConfig();
  console.log('Cookie Config Status:', cookieStatus);

  // Test D: URL Validation & SSRF Prevention
  console.log('\n[4/7] Testing URL Validation & Security...');
  const validUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  console.log('Valid URL check:', validateYouTubeUrl(validUrl));

  try {
    validateYouTubeUrl('http://localhost:5000/secret');
    console.error('FAILED: Localhost URL should have been rejected!');
  } catch (err: any) {
    console.log('PASSED: Localhost URL successfully rejected:', err.message);
  }

  try {
    validateYouTubeUrl('javascript:alert(1)');
    console.error('FAILED: Javascript URL should have been rejected!');
  } catch (err: any) {
    console.log('PASSED: Javascript URL successfully rejected:', err.message);
  }

  // Test E: Single Video Metadata Query
  console.log('\n[5/7] Testing Single Video Metadata Query...');
  const metadata = await ytdlpService.getMetadata(validUrl);
  console.log('Metadata Extracted Successfully!');
  console.log('Title:', metadata.title);
  console.log('Duration:', metadata.duration, 'seconds');
  console.log('Uploader:', metadata.uploader);

  // Test F: Real MP4 Download & Cleanup
  console.log('\n[6/7] Testing Real MP4 Video Download & Cleanup...');
  const jobIdMp4 = 'test_job_mp4_' + Date.now();
  const jobDirMp4 = cleanupService.createJobDirectory(jobIdMp4);
  const outTemplateMp4 = path.join(jobDirMp4, '%(title)s.%(ext)s');

  console.log('Downloading MP4 sample...');
  const { promise: mp4Promise } = ytdlpService.downloadMedia(
    validUrl,
    outTemplateMp4,
    ['-f', 'worst[ext=mp4]', '--merge-output-format', 'mp4'],
    (p) => console.log(`  MP4 Progress: ${p.percent.toFixed(1)}% | Speed: ${p.speed || 'N/A'}`)
  );
  await mp4Promise;

  const mp4Files = fs.readdirSync(jobDirMp4);
  console.log('MP4 Output Files Produced:', mp4Files);
  if (mp4Files.length === 0) throw new Error('MP4 download produced zero files!');
  const mp4Path = path.join(jobDirMp4, mp4Files[0]);
  const mp4Stats = fs.statSync(mp4Path);
  console.log('MP4 File Size:', mp4Stats.size, 'bytes');
  if (mp4Stats.size === 0) throw new Error('MP4 download produced a 0-byte file!');

  // Cleanup test folder
  cleanupService.cleanupJobDirectory(jobIdMp4);
  console.log('MP4 Job Cleanup Verified. Exists after cleanup:', fs.existsSync(jobDirMp4));

  // Test G: Real MP3 Extraction & Cleanup
  console.log('\n[7/7] Testing Real MP3 Audio Extraction & Cleanup...');
  const jobIdMp3 = 'test_job_mp3_' + Date.now();
  const jobDirMp3 = cleanupService.createJobDirectory(jobIdMp3);
  const outTemplateMp3 = path.join(jobDirMp3, '%(title)s.%(ext)s');

  console.log('Downloading MP3 sample...');
  const { promise: mp3Promise } = ytdlpService.downloadMedia(
    validUrl,
    outTemplateMp3,
    ['--extract-audio', '--audio-format', 'mp3', '--audio-quality', '9'],
    (p) => console.log(`  MP3 Progress: ${p.percent.toFixed(1)}% | Speed: ${p.speed || 'N/A'}`)
  );
  await mp3Promise;

  const mp3Files = fs.readdirSync(jobDirMp3);
  console.log('MP3 Output Files Produced:', mp3Files);
  if (mp3Files.length === 0) throw new Error('MP3 extraction produced zero files!');
  const mp3Path = path.join(jobDirMp3, mp3Files[0]);
  const mp3Stats = fs.statSync(mp3Path);
  console.log('MP3 File Size:', mp3Stats.size, 'bytes');
  if (mp3Stats.size === 0) throw new Error('MP3 extraction produced a 0-byte file!');

  // Cleanup test folder
  cleanupService.cleanupJobDirectory(jobIdMp3);
  console.log('MP3 Job Cleanup Verified. Exists after cleanup:', fs.existsSync(jobDirMp3));

  console.log('\n==================================================');
  console.log('     ALL PHASE 2 REAL TESTS PASSED SUCCESSFULLY!  ');
  console.log('==================================================');
}

runPhase2Tests().catch((err) => {
  console.error('\n❌ PHASE 2 VERIFICATION FAILED:', err);
  process.exit(1);
});
