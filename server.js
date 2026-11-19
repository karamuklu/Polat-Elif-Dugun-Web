// Kullanım: node server.js tiktok_kullanici_adin
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { WebcastPushConnection } = require('tiktok-live-connector');

const configPath = path.join(__dirname, 'config.json');
const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
const user = String(process.argv[2] || process.env.TIKTOK_USERNAME || config.tiktokUsername || '').replace(/^@/, '').trim();
const gramCoins = Math.max(1, Number(config.gramAltinJeton) || 10);
const quarterCoins = Math.max(gramCoins, Number(config.ceyrekAltinJeton) || 50);
const halfCoins = Math.max(quarterCoins, Number(config.yarimAltinJeton) || 100);
const fullCoins = Math.max(halfCoins, Number(config.tamAltinJeton) || 250);
const braceletCoins = Math.max(fullCoins, Number(config.bilezikJeton) || 500);
const wreathCoins = Math.max(braceletCoins, Number(config.celenkJeton) || 1000);

const port = Math.max(1, Number(process.env.PORT) || 8080);
const srv = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
});
const wss = new WebSocketServer({ server: srv });
const send = data => wss.clients.forEach(client => client.readyState === 1 && client.send(JSON.stringify(data)));
srv.listen(port, () => {
  console.log(`Sahne: http://localhost:${port}`);
  console.log(`OBS adresi: http://localhost:${port}#temiz`);
  console.log(`Takı tarifesi: Gram ${gramCoins}, Çeyrek ${quarterCoins}, Yarım ${halfCoins}, Tam ${fullCoins}, Bilezik ${braceletCoins}, Çelenk ${wreathCoins} jeton`);
});

const joined = new Map();
function userInfo(data) {
  const info = data.user || {};
  return {
    id: String(info.userId || info.uniqueId || data.userId || data.uniqueId || data.nickname || ''),
    nickname: String(info.nickname || info.uniqueId || data.nickname || 'Davetli')
  };
}

function parseGuest(comment) {
  const text = String(comment || '').trim().replace(/\s+/g, ' ');
  if (!text) return null;
  const match = text.match(/^(.+?)(?:\s+|\s*[,\/-]\s*)(k|kadın|kadin|bayan|e|erkek|bay)$/i);
  const code = match ? match[2].toLocaleLowerCase('tr-TR') : '';
  return {
    name: String(match ? match[1] : text).trim().slice(0, 14),
    gender: /^(k|kadın|kadin|bayan)$/.test(code) ? 'female' : /^(e|erkek|bay)$/.test(code) ? 'male' : 'random'
  };
}

function jewelryForCoins(coins) {
  if (coins >= wreathCoins) return { label: 'İsimli Çelenk', pieces: 1, gold: true, action: 'wreath', photo: true, danceSeconds: 0, burstCount: 4 };
  if (coins >= braceletCoins) return { label: '1 Bilezik', pieces: 1, gold: true, action: 'dance', photo: true, danceSeconds: 10, burstCount: 6 };
  if (coins >= fullCoins) return { label: `${Math.floor(coins / fullCoins)} Tam Altın`, pieces: 4, gold: true, action: 'hall', photo: true, danceSeconds: 0, burstCount: 3 };
  if (coins >= halfCoins) return { label: `${Math.floor(coins / halfCoins)} Yarım Altın`, pieces: 3, gold: true, action: 'lights', photo: true, danceSeconds: 0, burstCount: 2 };
  const quarters = Math.floor(coins / quarterCoins);
  const remainder = coins - quarters * quarterCoins;
  const grams = Math.floor(remainder / gramCoins);
  const parts = [];
  if (quarters) parts.push(`${quarters} Çeyrek Altın`);
  if (grams) parts.push(`${grams} Gram Altın`);
  return {
    label: parts.length ? parts.join(' + ') : 'Tebrik Hediyesi',
    pieces: Math.max(1, Math.min(quarters + grams, 4)),
    gold: parts.length > 0,
    action: parts.length ? 'photo' : 'confetti',
    photo: parts.length > 0,
    danceSeconds: 0,
    burstCount: parts.length ? 1 : 1
  };
}

if (!user) {
  console.log('TikTok kullanıcı adı yok; sadece elle test modu açık. config.json dosyasına kullanıcı adını yazabilirsin.');
} else {
  const live = new WebcastPushConnection(user, { enableExtendedGiftInfo: true });
  live.connect()
    .then(state => console.log(`TikTok yayınına bağlandı: @${user} (oda ${state.roomId || 'hazır'})`))
    .catch(error => console.error('TikTok bağlantısı kurulamadı. Yayının açık ve kullanıcı adının doğru olduğundan emin ol:', error.message));

  live.on('chat', data => {
    const viewer = userInfo(data);
    if (viewer.id && joined.has(viewer.id)) return;
    const guest = parseGuest(data.comment);
    if (!guest || !guest.name) return;
    if (viewer.id) joined.set(viewer.id, guest);
    send({ type: 'name', name: guest.name, gender: guest.gender, userId: viewer.id });
    console.log(`Davetli: ${guest.name} (${guest.gender})`);
  });

  live.on('gift', data => {
    const giftType = data.giftDetails?.giftType ?? data.giftType;
    if (giftType === 1 && !data.repeatEnd) return;

    const viewer = userInfo(data);
    if (viewer.id && !joined.has(viewer.id)) {
      const guest = { name: viewer.nickname.slice(0, 14), gender: 'random' };
      joined.set(viewer.id, guest);
      send({ type: 'name', name: guest.name, gender: guest.gender, userId: viewer.id });
    }

    const unitCoins = Number(data.extendedGiftInfo?.diamond_count ?? data.diamondCount ?? data.giftDetails?.diamondCount ?? 0);
    const repeatCount = Math.max(1, Number(data.repeatCount) || 1);
    const coins = unitCoins * repeatCount;
    const jewelry = jewelryForCoins(coins);
    const giftName = data.giftDetails?.giftName || data.giftName || `Hediye #${data.giftId || '?'}`;
    send({ type: 'gift', from: viewer.nickname, userId: viewer.id, giftName, coins, jewelry: jewelry.label, pieces: jewelry.pieces, gold: jewelry.gold, action: jewelry.action, photo: jewelry.photo, danceSeconds: jewelry.danceSeconds, burstCount: jewelry.burstCount });
    console.log(`Hediye: ${viewer.nickname} - ${giftName} x${repeatCount} = ${coins} jeton -> ${jewelry.label}`);
  });

  live.on('streamEnd', () => console.log('TikTok canlı yayını sona erdi.'));
  live.on('error', error => console.error('TikTok bağlantı hatası:', error.message || error));
}

