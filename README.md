# Polat & Elif Düğün Sahnesi

Salon kapasitesi 80 davetlidir: sağda ve solda 10'ar sıra, her sırada toplam 8 sandalye bulunur.

## Kurulum

1. Bu klasörde `npm install` çalıştırın.
2. Test modu için `npm start` çalıştırın.
3. Tarayıcıda `http://localhost:8080` adresini açın.

## TikTok canlı yayın

1. [config.json](./config.json) dosyasını Not Defteri ile açın.
2. `tiktokUsername` karşısına TikTok kullanıcı adınızı `@` işareti olmadan yazın.
3. Gram ve çeyrek değerlerini isterseniz aynı dosyadaki `gramAltinJeton` ve `ceyrekAltinJeton` alanlarından değiştirin.
4. TikTok uygulamasından canlı yayını başlatın. Bağlantı kurulabilmesi için yayın açık olmalıdır.
5. [canli-yayini-baslat.bat](./canli-yayini-baslat.bat) dosyasına çift tıklayın. Açılan pencere yayın boyunca açık kalmalıdır.

Komutla başlatmak isteyenler `node server.js kullanici_adin` komutunu da kullanabilir. Kullanıcı adının başına `@` koymak zorunlu değildir.

OBS Browser Source için adres: `http://localhost:8080#temiz`

Test modunda ekranın altındaki alandan davetli ve hediye eklenebilir.

### Yorum ve hediye kuralları

- Kadın davetli: `Ayşe k` veya `Ayşe kadın`
- Erkek davetli: `Mehmet e` veya `Mehmet erkek`
- Cinsiyet yazılmazsa karakter rastgele oluşturulur.
- Her TikTok hesabı yalnızca bir kez davetli olarak eklenir.
- Hediye gönderen kişi salonda değilse önce otomatik olarak davetli olur.
- 1–9 jeton: tebrik hediyesi ve konfeti.
- 10–49 jeton: gram altın, fotoğraf pozu ve alkış.
- 50–99 jeton: çeyrek altın, fotoğraf pozu ve alkış.
- 100–249 jeton: yarım altın, ışık şovu, büyük konfeti ve fotoğraf.
- 250–499 jeton: tam altın, bütün salonun uzun alkışı, büyük konfeti ve fotoğraf.
- 500 jeton ve üzeri: bilezik, 10 saniyelik özel gelin-damat dansı, büyük konfeti ve fotoğraf.
- Eşiklerin tamamı `config.json` dosyasından değiştirilebilir.
- Takı gönderen davetli koltuğundan kalkar, koridordan gelin veya damadın yanına gider, yaklaşık 4 saniye fotoğraf pozu verir ve ardından kendi koltuğuna dönüp oturur.
- Davetli salona henüz yeni giriyorsa önce koltuğuna ulaşır; takı ve fotoğraf hareketi daha sonra otomatik başlar.

### TikTok LIVE Studio ile görüntü

1. LIVE Studio'da yeni bir sahne oluşturun.
2. Kaynak ekleme bölümünden web sayfası/tarayıcı kaynağı seçeneğini kullanın. Bu seçenek hesabınızda yoksa OBS üzerinden pencere veya tarayıcı kaynağı kullanın.
3. Adres olarak `http://localhost:8080#temiz` yazın.
4. Dikey yayın için tuvali `1080 × 1920` ayarlayın ve kaynağı ekranı kaplayacak şekilde ölçekleyin.
5. Ön izleme doğruysa TikTok'ta canlı yayını başlatın; ardından başlatma dosyasının TikTok'a bağlandığını gösteren mesajı kontrol edin.

OBS kullanılıyorsa aynı adresi `Browser Source` olarak ekleyin. TikTok hesabınızda yayın anahtarı/RTMP erişimi varsa OBS'nin yayın ayarlarına TikTok'un verdiği sunucu ve yayın anahtarını girin.

## Cinsiyet ve müzik ayarları

- İsim alanının yanındaki menüden `Kadın`, `Erkek` veya `Rastgele` seçilebilir.
- `Müzik ayarları` düğmesi sağ altta müzik panelini açar.
- YouTube videosunun bağlantısını paneldeki ilk kutuya yapıştırıp `Uygula` düğmesine basınca video görünmeden arka planda ve döngüde çalar. Bazı videolar sahibi tarafından başka sitelerde oynatmaya kapatılmış olabilir; böyle bir durumda farklı bir video bağlantısı kullanılmalıdır.
- Panelden bilgisayardaki yasal bir ses dosyası seçilebilir veya doğrudan `.mp3` gibi bir ses bağlantısı girilebilir.
- Bağlantı ve ses seviyesi tarayıcıda hatırlanır. Bilgisayardan seçilen dosyanın sayfa yeniden açıldığında tekrar seçilmesi gerekir.
- Tarayıcıların otomatik oynatma kuralı nedeniyle ilk açılışta `Çal` düğmesine bir kez basmak gerekebilir.

## Duvar arka planları

- `Duvarlar` düğmesi, sağ ve sol duvarı ayrı ayrı düzenleme panelini açar.
- Her duvar için renk seçilebilir, bilgisayardan resim yüklenebilir veya doğrudan resim bağlantısı girilebilir.
- Yan duvar görselleri arka sahne bloğunun köşelerine hizalanır ve arka taraftaki duvar alanını tek parça olarak doldurur.
- Aynı paneldeki `Gelin-Damat Arkası` bölümünden kemerin ve çiftin arkasına ayrı bir resim eklenebilir veya kaldırılabilir.
- Renkler ve resim bağlantıları sonraki açılış için hatırlanır. Bilgisayardan seçilen resimler sayfa yeniden açılırsa tekrar seçilmelidir.

