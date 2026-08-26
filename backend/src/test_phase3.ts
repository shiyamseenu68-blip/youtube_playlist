import { classifyYouTubeUrl } from './utils/sanitize.js';
import { ytdlpService } from './services/ytdlpService.js';
import { metadataCache } from './services/cacheService.js';

async function runPhase3Tests() {
  console.log('==================================================');
  console.log('          PHASE 3 REAL VERIFICATION SUITE         ');
  console.log('==================================================');

  // Test 1: URL Classification
  console.log('\n[1/6] Testing URL Classification Logic...');

  const singleUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const shortUrl = 'https://youtu.be/dQw4w9WgXcQ';
  const playlistUrl = 'https://www.youtube.com/playlist?list=PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj';
  const mixedUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj';

  const c1 = classifyYouTubeUrl(singleUrl);
  console.log('Single Video Classification:', c1);
  if (c1.type !== 'video' || c1.videoId !== 'dQw4w9WgXcQ') {
    throw new Error('Single video URL classification failed!');
  }

  const c2 = classifyYouTubeUrl(shortUrl);
  console.log('Short URL Classification:', c2);
  if (c2.type !== 'video' || c2.videoId !== 'dQw4w9WgXcQ') {
    throw new Error('youtu.be short URL classification failed!');
  }

  const c3 = classifyYouTubeUrl(playlistUrl);
  console.log('Playlist Classification:', c3);
  if (c3.type !== 'playlist' || !c3.playlistId) {
    throw new Error('Playlist URL classification failed!');
  }

  const c4 = classifyYouTubeUrl(mixedUrl);
  console.log('Mixed URL Classification:', c4);
  if (c4.type !== 'video_playlist' || !c4.videoId || !c4.playlistId) {
    throw new Error('Mixed video+playlist URL classification failed!');
  }

  // Test 2: Invalid / SSRF URL rejection
  console.log('\n[2/6] Testing Security & Invalid URL Rejection...');
  try {
    classifyYouTubeUrl('https://example.com');
    throw new Error('FAILED: non-YouTube URL was not rejected!');
  } catch (err: any) {
    console.log('PASSED: Non-YouTube URL rejected:', err.message);
  }

  try {
    classifyYouTubeUrl('http://127.0.0.1:5000');
    throw new Error('FAILED: SSRF localhost IP was not rejected!');
  } catch (err: any) {
    console.log('PASSED: SSRF IP rejected:', err.message);
  }

  // Test 3: Single Video Metadata Analysis & Format Normalization
  console.log('\n[3/6] Testing Real Single Video Metadata Analysis...');
  const videoMeta = await ytdlpService.getVideoMetadata(singleUrl);
  console.log('Video ID:', videoMeta.id);
  console.log('Title:', videoMeta.title);
  console.log('Uploader:', videoMeta.uploader);
  console.log('Duration:', videoMeta.duration, 'seconds');
  console.log('Qualities Available:', videoMeta.qualities);

  if (!videoMeta.id || !videoMeta.title || !Array.isArray(videoMeta.qualities) || videoMeta.qualities.length === 0) {
    throw new Error('Single video metadata extraction failed or returned empty qualities!');
  }

  // Test 4: Playlist Metadata Analysis
  console.log('\n[4/6] Testing Real Playlist Metadata Analysis...');
  const playlistMeta = await ytdlpService.getPlaylistMetadata(playlistUrl);
  console.log('Playlist Title:', playlistMeta.title);
  console.log('Playlist Uploader:', playlistMeta.uploader);
  console.log('Total Items:', playlistMeta.totalItems);
  console.log('Sample Item 1:', playlistMeta.items[0]);

  if (!playlistMeta.title || playlistMeta.totalItems === 0 || playlistMeta.items.length === 0) {
    throw new Error('Playlist metadata extraction returned zero items!');
  }

  // Test 5: Metadata Cache Verification
  console.log('\n[5/6] Testing Metadata Cache...');
  metadataCache.set('test_key', { foo: 'bar' });
  const cached = metadataCache.get('test_key');
  console.log('Cached entry retrieved:', cached);
  if (!cached || cached.foo !== 'bar') {
    throw new Error('Metadata cache failed to store or retrieve entries!');
  }

  console.log('\n==================================================');
  console.log('     ALL PHASE 3 REAL TESTS PASSED SUCCESSFULLY!  ');
  console.log('==================================================');
}

runPhase3Tests().catch((err) => {
  console.error('\n❌ PHASE 3 VERIFICATION FAILED:', err);
  process.exit(1);
});
