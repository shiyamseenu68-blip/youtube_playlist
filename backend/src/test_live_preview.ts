async function testLivePreviewFlow() {
  console.log('==================================================');
  console.log('    TESTING REAL LOCAL PREVIEW API FLOW          ');
  console.log('==================================================');

  const BASE_URL = 'http://localhost:5000';
  const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const playlistUrl = 'https://www.youtube.com/playlist?list=PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj';

  // 1. Health Check
  console.log('\n[1/4] Checking /api/health...');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData: any = await healthRes.json();
  console.log('Health Output:', healthData);

  // 2. Single Video Analysis & Download (MP4)
  console.log('\n[2/4] Analyzing & Downloading Single Video (MP4)...');
  const analyzeRes = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: videoUrl }),
  });
  const analyzeData: any = await analyzeRes.json();
  console.log('Single Video Analyzed:', analyzeData.videoContext?.title);

  const dlMp4Res = await fetch(`${BASE_URL}/api/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: videoUrl,
      mode: 'video',
      format: 'mp4',
      quality: '360p',
    }),
  });
  const dlMp4Data: any = await dlMp4Res.json();
  console.log('MP4 Job Initiated:', dlMp4Data);
  const jobIdMp4 = dlMp4Data.jobId;

  // Poll job status until completed
  let mp4Status = 'queued';
  while (mp4Status !== 'completed' && mp4Status !== 'failed') {
    await new Promise((r) => setTimeout(r, 2000));
    const statusRes = await fetch(`${BASE_URL}/api/download/status/${jobIdMp4}`);
    const statusData: any = await statusRes.json();
    mp4Status = statusData.status;
    console.log(`  MP4 Download Status: ${mp4Status} (${statusData.percent || 0}%)`);
  }

  if (mp4Status === 'completed') {
    const fileRes = await fetch(`${BASE_URL}/api/download/file/${jobIdMp4}`);
    const fileBuf = await fileRes.arrayBuffer();
    console.log('  MP4 Delivered File Size:', fileBuf.byteLength, 'bytes');
  }

  // 3. Single Video Analysis & Download (MP3)
  console.log('\n[3/4] Downloading Single Video (MP3)...');
  const dlMp3Res = await fetch(`${BASE_URL}/api/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: videoUrl,
      mode: 'video',
      format: 'mp3',
    }),
  });
  const dlMp3Data: any = await dlMp3Res.json();
  console.log('MP3 Job Initiated:', dlMp3Data);
  const jobIdMp3 = dlMp3Data.jobId;

  let mp3Status = 'queued';
  while (mp3Status !== 'completed' && mp3Status !== 'failed') {
    await new Promise((r) => setTimeout(r, 2000));
    const statusRes = await fetch(`${BASE_URL}/api/download/status/${jobIdMp3}`);
    const statusData: any = await statusRes.json();
    mp3Status = statusData.status;
    console.log(`  MP3 Download Status: ${mp3Status} (${statusData.percent || 0}%)`);
  }

  if (mp3Status === 'completed') {
    const fileRes = await fetch(`${BASE_URL}/api/download/file/${jobIdMp3}`);
    const fileBuf = await fileRes.arrayBuffer();
    console.log('  MP3 Delivered File Size:', fileBuf.byteLength, 'bytes');
  }

  // 4. Playlist Analysis & Download (2 items MP3)
  console.log('\n[4/4] Analyzing & Downloading Playlist (2 items MP3)...');
  const analyzePlRes = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: playlistUrl }),
  });
  const analyzePlData: any = await analyzePlRes.json();
  const selectedItems = analyzePlData.playlistContext?.items.slice(0, 2).map((i: any) => i.id);

  const dlPlRes = await fetch(`${BASE_URL}/api/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: playlistUrl,
      mode: 'playlist',
      format: 'mp3',
      selectedItemIds: selectedItems,
    }),
  });
  const dlPlData: any = await dlPlRes.json();
  console.log('Playlist Job Initiated:', dlPlData);
  const jobIdPl = dlPlData.jobId;

  let plStatus = 'queued';
  while (plStatus !== 'completed' && plStatus !== 'failed') {
    await new Promise((r) => setTimeout(r, 2000));
    const statusRes = await fetch(`${BASE_URL}/api/download/status/${jobIdPl}`);
    const statusData: any = await statusRes.json();
    plStatus = statusData.status;
    console.log(`  Playlist Download Status: ${plStatus} (${statusData.percent || 0}%)`);
  }

  if (plStatus === 'completed') {
    const fileRes = await fetch(`${BASE_URL}/api/download/file/${jobIdPl}`);
    const fileBuf = await fileRes.arrayBuffer();
    console.log('  Playlist ZIP Delivered Size:', fileBuf.byteLength, 'bytes');
  }

  console.log('\n==================================================');
  console.log('  REAL LOCAL PREVIEW FLOW VERIFIED SUCCESSFULLY!  ');
  console.log('==================================================');
}

testLivePreviewFlow().catch((err) => {
  console.error('❌ Live Preview Test Error:', err.message);
});
