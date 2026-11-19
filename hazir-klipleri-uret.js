const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const { spawn } = require('child_process');
const WebSocket = require('ws');

const root = __dirname;
const outputDir = path.join(root, 'TikTok-Klipleri');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const webPort = 8091;
const debugPort = 9333;
fs.mkdirSync(outputDir, { recursive: true });

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
function requestJson(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}
async function waitForJson(url, attempts = 80) {
  for (let i = 0; i < attempts; i++) {
    try { return await requestJson(url); } catch (_) { await wait(250); }
  }
  throw new Error('Chrome kayıt bağlantısı açılamadı.');
}
async function waitForHttp(url, attempts = 80) {
  for (let i = 0; i < attempts; i++) {
    try {
      await new Promise((resolve, reject) => http.get(url, res => { res.resume(); res.statusCode === 200 ? resolve() : reject(new Error(String(res.statusCode))); }).on('error', reject));
      return;
    } catch (_) { await wait(250); }
  }
  throw new Error('Düğün sahnesi sunucusu açılamadı.');
}
function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  ws.on('message', raw => {
    const message = JSON.parse(raw);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(new Error(message.error.message)) : resolve(message.result);
  });
  return {
    ready: new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); }),
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const messageId = ++id;
        pending.set(messageId, { resolve, reject });
        ws.send(JSON.stringify({ id: messageId, method, params }));
      });
    },
    close: () => ws.close()
  };
}
async function waitForDownload(fileName) {
  const target = path.join(outputDir, fileName);
  for (let i = 0; i < 120; i++) {
    if (fs.existsSync(target) && !fs.existsSync(target + '.crdownload') && fs.statSync(target).size > 100000) return target;
    await wait(500);
  }
  throw new Error(fileName + ' indirilemedi.');
}

(async () => {
  const server = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: String(webPort) }, stdio: ['ignore', 'pipe', 'pipe'] });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'wedding-clip-chrome-'));
  const chrome = spawn(chromePath, [
    '--headless=new', '--no-first-run', '--disable-extensions', '--disable-breakpad', '--disable-crash-reporter', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-webgl', '--enable-unsafe-swiftshader',
    '--autoplay-policy=no-user-gesture-required', `--remote-debugging-port=${debugPort}`,
    '--remote-allow-origins=*', '--window-size=1080,1920', `--user-data-dir=${profile}`, 'about:blank'
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  chrome.stderr.on('data', chunk => { const line=String(chunk); if(/ERROR|DevTools listening/i.test(line))process.stderr.write(line); });
  try {
    await waitForHttp(`http://127.0.0.1:${webPort}`);
    await waitForJson(`http://127.0.0.1:${debugPort}/json/version`);
    const created = await requestJson(`http://127.0.0.1:${debugPort}/json/new?about:blank`, 'PUT');
    const client = cdp(created.webSocketDebuggerUrl);
    await client.ready;
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: outputDir, eventsEnabled: true });
    const clips = [
      { variant: 1, file: '01-kurtlar-vadisi-dugune-geliyor.webm' },
      { variant: 2, file: '02-memati-taki-toreni.webm' },
      { variant: 3, file: '03-gullu-erhan-celenk.webm' }
    ];
    for (const clip of clips) {
      await client.send('Page.navigate', { url: `http://127.0.0.1:${webPort}/?clip=${clip.variant}#temiz` });
      await wait(3500);
      const expression = `(() => {
        const stream = ren.domElement.captureStream(30);
        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
        const chunks = [], recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 7000000 });
        recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
        recorder.onstop = () => { const blob = new Blob(chunks, { type: mime }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = ${JSON.stringify(clip.file)}; a.click(); };
        window.__clipRecorder = recorder; recorder.start(500); startClip(); return { width: ren.domElement.width, height: ren.domElement.height, mime };
      })()`;
      const started = await client.send('Runtime.evaluate', { expression, returnByValue: true });
      const info = started.result.value;
      if (!info || info.width !== 1080 || info.height !== 1920) throw new Error(`Klip ölçüsü hatalı: ${JSON.stringify(info)}`);
      await wait(28000);
      await client.send('Runtime.evaluate', { expression: 'window.__clipRecorder.stop()' });
      const saved = await waitForDownload(clip.file);
      console.log(`Hazır: ${saved}`);
      await wait(1200);
    }
    client.close();
    console.log('Üç TikTok klibi hazırlandı.');
  } finally {
    chrome.kill();
    server.kill();
    fs.rmSync(profile, { recursive: true, force: true });
  }
})().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });

