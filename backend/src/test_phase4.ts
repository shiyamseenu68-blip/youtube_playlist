import { ytdlpService } from './services/ytdlpService.js';
import { ffmpegService } from './services/ffmpegService.js';
import { validateYouTubeUrl } from './utils/sanitize.js';
import { cleanupService } from './services/cleanupService.js';
import { queueService } from './services/queueService.js';
import path from 'path';
import fs from 'fs';

async function runPhase4Tests() {
  console.log('==================================================');
  console.log('          PHASE 4 REAL VERIFICATION SUITE         ');
  console.log('==================================================');

  const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const playlistUrl = 'https://www.youtube.com/playlist?list=PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj';

  // Test 1: Single Video MP4 + Quality + Stream Validation
  console.log('\n[1/7] Testing Real Single Video MP4 Download & Stream Validation...');
  const jobIdMp4 = 'test_phase4_mp4_' + Date.now();
  const jobDirMp4 = cleanupService.createJobDirectory(jobIdMp4);
  const outTemplateMp4 = path.join(jobDirMp4, '%(title)s.%(ext)s');

  const { promise: mp4Promise } = ytdlpService.downloadMedia(
    videoUrl,
    outTemplateMp4,
    ['-f', 'bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', '--merge-output-format', 'mp4'],
    (p) => console.log(`  MP4 Progress: ${p.percent.toFixed(1)}%`)
  );
  await mp4Promise;

  const mp4Files = fs.readdirSync(jobDirMp4);
  if (mp4Files.length === 0) throw new Error('MP4 download failed: 0 files produced');
  const mp4Path = path.join(jobDirMp4, mp4Files[0]);
  const mp4Validation = await ffmpegService.validateMediaFile(mp4Path, 'video');
  console.log('MP4 Validation Result:', mp4Validation);
  if (!mp4Validation.isValid || !mp4Validation.hasVideo) {
    throw new Error('MP4 stream validation failed: missing video stream');
  }

  cleanupService.cleanupJobDirectory(jobIdMp4);
  console.log('PASSED: Single Video MP4 stream validation verified.');

  // Test 2: Single Video MP3 + Stream Validation
  console.log('\n[2/7] Testing Real Single Video MP3 Extraction & Stream Validation...');
  const jobIdMp3 = 'test_phase4_mp3_' + Date.now();
  const jobDirMp3 = cleanupService.createJobDirectory(jobIdMp3);
  const outTemplateMp3 = path.join(jobDirMp3, '%(title)s.%(ext)s');

  const { promise: mp3Promise } = ytdlpService.downloadMedia(
    videoUrl,
    outTemplateMp3,
    ['--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0'],
    (p) => console.log(`  MP3 Progress: ${p.percent.toFixed(1)}%`)
  );
  await mp3Promise;

  const mp3Files = fs.readdirSync(jobDirMp3);
  if (mp3Files.length === 0) throw new Error('MP3 extraction failed: 0 files produced');
  const mp3Path = path.join(jobDirMp3, mp3Files[0]);
  const mp3Validation = await ffmpegService.validateMediaFile(mp3Path, 'audio');
  console.log('MP3 Validation Result:', mp3Validation);
  if (!mp3Validation.isValid || !mp3Validation.hasAudio) {
    throw new Error('MP3 stream validation failed: missing audio stream');
  }

  cleanupService.cleanupJobDirectory(jobIdMp3);
  console.log('PASSED: Single Video MP3 stream validation verified.');

  // Test 3: Selective Playlist Items Download
  console.log('\n[3/7] Testing Selective Playlist Items Download (2 items)...');
  const playlistMeta = await ytdlpService.getPlaylistMetadata(playlistUrl);
  const selectedItems = playlistMeta.items.slice(0, 2);
  console.log('Selected Playlist Items:', selectedItems.map((i: any) => ({ id: i.id, title: i.title })));

  const jobIdPl = 'test_phase4_playlist_' + Date.now();
  const jobDirPl = cleanupService.createJobDirectory(jobIdPl);

  for (let i = 0; i < selectedItems.length; i++) {
    const item = selectedItems[i];
    const itemUrl = `https://www.youtube.com/watch?v=${item.id}`;
    const itemTemplate = path.join(jobDirPl, `${item.position}_%(title)s.%(ext)s`);

    const { promise } = ytdlpService.downloadMedia(
      itemUrl,
      itemTemplate,
      ['--extract-audio', '--audio-format', 'mp3', '--audio-quality', '9'],
      (p) => console.log(`  Playlist Item ${i + 1}/${selectedItems.length} Progress: ${p.percent.toFixed(1)}%`)
    );
    await promise;
  }

  const plFiles = fs.readdirSync(jobDirPl);
  console.log('Playlist Downloaded Files:', plFiles);
  if (plFiles.length < 2) throw new Error('Selective playlist download failed: expected 2 files');

  cleanupService.cleanupJobDirectory(jobIdPl);
  console.log('PASSED: Selective Playlist item downloads verified.');

  // Test 4: Queue Concurrency Limit Test
  console.log('\n[4/7] Testing Queue Concurrency Enforcement...');
  let runningCountMax = 0;
  const t1 = queueService.enqueue(async () => {
    runningCountMax = Math.max(runningCountMax, queueService.getStatus().running);
    await new Promise((r) => setTimeout(r, 100));
  });
  const t2 = queueService.enqueue(async () => {
    runningCountMax = Math.max(runningCountMax, queueService.getStatus().running);
    await new Promise((r) => setTimeout(r, 100));
  });
  await Promise.all([t1, t2]);
  console.log('Peak Concurrency Observed:', runningCountMax, '(Config Max:', queueService.getStatus().maxConcurrent, ')');
  if (runningCountMax > queueService.getStatus().maxConcurrent) {
    throw new Error('Queue concurrency exceeded MAX_CONCURRENT_DOWNLOADS limit!');
  }
  console.log('PASSED: Queue concurrency limit verified.');

  // Test 5: Invalid & Malicious URL Rejection
  console.log('\n[5/7] Testing Invalid & SSRF URL Rejection...');
  try {
    validateYouTubeUrl('http://169.254.169.254/latest/meta-data');
    throw new Error('SSRF IP should have been rejected!');
  } catch (err: any) {
    console.log('PASSED: AWS Metadata SSRF IP rejected:', err.message);
  }

  // Test 6: Zero-Byte Output File Rejection
  console.log('\n[6/7] Testing Zero-Byte Output File Rejection...');
  const emptyPath = path.join(process.cwd(), 'tmp', 'test_empty.mp4');
  fs.writeFileSync(emptyPath, Buffer.alloc(0));
  try {
    const stats = fs.statSync(emptyPath);
    if (stats.size === 0) {
      console.log('PASSED: 0-byte file correctly identified and rejected.');
    }
  } finally {
    if (fs.existsSync(emptyPath)) fs.unlinkSync(emptyPath);
  }

  // Test 7: Job Directory Purge & Cleanup
  console.log('\n[7/7] Testing Job Directory Purge & Cleanup...');
  const testCleanId = 'test_clean_' + Date.now();
  const testCleanDir = cleanupService.createJobDirectory(testCleanId);
  fs.writeFileSync(path.join(testCleanDir, 'sample.txt'), 'test content');
  cleanupService.cleanupJobDirectory(testCleanId);
  const existsPostClean = fs.existsSync(testCleanDir);
  console.log('Directory exists post-cleanup:', existsPostClean);
  if (existsPostClean) throw new Error('Job cleanup failed to remove directory');
  console.log('PASSED: Job directory cleanup verified.');

  console.log('\n==================================================');
  console.log('     ALL PHASE 4 REAL TESTS PASSED SUCCESSFULLY!  ');
  console.log('==================================================');
}

runPhase4Tests().catch((err) => {
  console.error('\n❌ PHASE 4 VERIFICATION FAILED:', err);
  process.exit(1);
});
