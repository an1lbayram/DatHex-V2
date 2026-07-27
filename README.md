# 🌐 DatHex V2 - Web Based Windows Application & System Manager

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express)
![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socketdotio)
![License](https://img.shields.io/badge/License-MIT-green)

**DatHex V2**, Windows sisteminizde kurulu olan yazılımları web tabanlı modern bir arayüzden yönetmenizi sağlayan yeni nesil bir sistem yönetim paneli ve uygulama mağazasıdır. **React 19**, **Vite**, **Express** ve **Socket.io** altyapısıyla canlı terminal çıktısı, anlık güncelleme takibi ve sistem yedekleme özellikleri sunar.

---

## ✨ Özellikler

- 🖥️ **Web Tabanlı Kontrol Paneli:** Sistem yönetimi için şık, hızlı ve responsive arayüz (Framer Motion animasyonları ile).
- 🔄 **Canlı Terminal & Log Takibi:** Socket.io entegrasyonu ile `winget` işlemlerini anlık olarak web ekranında izleme.
- 📦 **Uygulama Mağazası (Store Tab):** Yeni uygulamaları keşfetme ve tek tıkla kurma.
- 📋 **Yüklü Yazılımlar (Installed Tab):** Sisteminizdeki tüm programları listeleme ve kaldırma.
- 🚀 **Güncellemeler (Upgrades Tab):** Güncellenebilir uygulamaları tespit edip tek tıkla yenileme.
- 💾 **Sistem Yedekleme (Backup Tab):** Yapılandırmaları ve yedekleri yönetme.
- 🔔 **Masaüstü Bildirimleri:** `node-notifier` ile işlemler tamamlandığında Windows bildirimi alma.

---

## 💻 Sistem Gereksinimleri

1. **Windows 10 veya Windows 11**
2. **Node.js** (v18.0.0 veya üzeri): [Node.js İndir](https://nodejs.org/)
3. **Git**: [Git İndir](https://git-scm.com/)
4. **Winget:** (Windows Paket Yöneticisi)

---

## 🚀 Kurulum ve Çalıştırma

### ⚡ Tek Satırda Kurulum ve Çalıştırma (Hızlı Başlangıç)

Terminalinizde aşağıdaki komutu yapıştırarak sunucu ve istemci paketlerini yükleyip uygulamayı başlatabilirsiniz:

```bash
git clone https://github.com/an1lbayram/DatHex-V2.git && cd DatHex-V2 && cd server && npm install && cd ../client && npm install && cd .. && node server/index.js
```

*(Windows CMD kullanıyorsanız, `DatHex.bat` dosyasına çift tıklayarak da başlatabilirsiniz).*

---

### 📋 Adım Adım Kurulum (Hiç Bilmeyenler İçin)

#### 1️⃣ Terminal / Komut Satırını Açın
Windows Başlat menüsünden `PowerShell` veya `CMD` uygulamasını açın.

#### 2️⃣ Depoyu Klonlayın
Projeyi bilgisayarınıza indirmek için şu komutu çalıştırın:
```bash
git clone https://github.com/an1lbayram/DatHex-V2.git
```

#### 3️⃣ Proje Dizini İçine Geçin
```bash
cd DatHex-V2
```

#### 4️⃣ Sunucu (Server) Bağımlılıklarını Yükleyin
```bash
cd server
npm install
cd ..
```

#### 5️⃣ İstemci (Client) Bağımlılıklarını Yükleyin
```bash
cd client
npm install
cd ..
```

#### 6️⃣ Uygulamayı Başlatın
Sunucuyu çalıştırmak için:
```bash
node server/index.js
```
*(Alternatif olarak proje ana dizinindeki `DatHex.bat` dosyasına tıklayabilirsiniz).*

#### 7️⃣ Tarayıcıda Açın
Tarayıcınızı açıp `http://localhost:3001` adresine gidin. DatHex V2 yönetim paneli karşınızda!

---

## 📂 Proje Yapısı

```text
DatHex-V2/
├── DatHex.bat                # Windows başlatma scripti
├── server/                   # Express + Socket.io backend (Winget entegrasyonu)
│   ├── index.js              # Ana sunucu dosyası
│   └── package.json          # Sunucu bağımlılıkları
└── client/                   # React 19 + Vite frontend
    ├── src/                  # React bileşenleri (Store, Upgrades, Backup, Terminal)
    ├── vite.config.js        # Vite konfigürasyonu
    └── package.json          # İstemci bağımlılıkları
```

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.

**Geliştirici:** [Anıl Bayram](https://github.com/an1lbayram)
