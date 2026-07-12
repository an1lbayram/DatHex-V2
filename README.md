<div align="center">
  <h1>DatHex V2 🚀</h1>
  <p><em>English | <a href="#türkçe">Türkçe</a></em></p>
</div>

DatHex V2 is a modern, premium web-based graphical user interface (GUI) and background service wrapper for the **Windows Package Manager (Winget)**. Built to make app management effortless and visually stunning, DatHex eliminates the need for manual terminal commands by providing a sleek, glassmorphic UI to scan, manage, and upgrade your installed applications with a single click.

<p align="center">
  <b>Created by <a href="https://an1lbayram.github.io/">an1lbayram</a></b>
</p>

## ✨ Key Features

- **One-Click Upgrades:** Scan your system for outdated applications and upgrade them selectively or all at once.
- **Real-Time Terminal:** A built-in, animated web terminal powered by Socket.IO that streams live `winget` execution logs directly to the UI.
- **Premium Glassmorphism Design:** A modern, state-of-the-art interface featuring smooth micro-animations, glowing gradients, and polished typography.
- **Dark/Light Mode Support:** Seamlessly toggle between dark and light themes with fluid CSS transitions. Your preference is automatically saved.
- **Language Support (TR/EN):** Built-in i18n support allowing users to switch between Turkish and English instantly.
- **PWA Ready:** Install DatHex as a Progressive Web App (PWA) for a native desktop-like experience.
- **Custom DOS-Compatible Launcher:** A specially encoded `DatHex.bat` file ensures perfect Turkish character rendering in the Windows command prompt, starting both the server and client effortlessly.

## 🛠️ Technology Stack

- **Frontend:** React, Vite, Vanilla CSS (Custom Design System), Lucide-React
- **Backend:** Node.js, Express 5.0, Socket.IO
- **System Integration:** Windows Package Manager (`winget`), `child_process`

## 🚀 Installation & Usage

### Prerequisites
- **Windows 10/11** with [Winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/) installed.
- **Node.js** (v18 or higher recommended).

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/an1lbayram/DatHex-V2.git
   ```
2. Install server dependencies:
   ```bash
   cd server
   npm install
   ```
3. Install client dependencies and build the frontend:
   ```bash
   cd ../client
   npm install
   npm run build
   ```

### Running DatHex
Simply double-click the **`DatHex.bat`** file located in the root directory. 

The batch file will automatically:
1. Boot up the Node.js backend server in the background.
2. Launch your default web browser to `http://localhost:3001`.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome.

## 📝 License
This project is licensed under the [MIT License](LICENSE).

---

<br>

<div align="center" id="türkçe">
  <h1>DatHex V2 🚀</h1>
  <p><em><a href="#">English</a> | Türkçe</em></p>
</div>

DatHex V2, **Windows Paket Yöneticisi (Winget)** için geliştirilmiş modern, premium bir web arayüzü (GUI) ve arka plan servisidir. Uygulama yönetimini zahmetsiz ve görsel olarak kusursuz hale getirmek için tasarlanan DatHex, manuel terminal komutlarına olan ihtiyacı ortadan kaldırır. Sahip olduğu şık glassmorphism tasarımı ile sisteminizdeki uygulamaları tarayabilir, yönetebilir ve tek tıkla güncelleyebilirsiniz.

<p align="center">
  <b><a href="https://an1lbayram.github.io/">an1lbayram</a> tarafından geliştirilmiştir</b>
</p>

## ✨ Öne Çıkan Özellikler

- **Tek Tıkla Güncelleme:** Sisteminizdeki eski uygulamaları tarayın ve ister tek tek isterseniz de tümünü aynı anda güncelleyin.
- **Gerçek Zamanlı Terminal:** Socket.IO altyapısıyla çalışan, `winget` loglarını anlık olarak arayüze aktaran yerleşik, animasyonlu bir web terminali.
- **Premium Glassmorphism Tasarımı:** Mikro animasyonlar, parlak geçişler ve özel tipografi ile donatılmış modern bir arayüz.
- **Karanlık/Aydınlık Mod (Dark/Light):** Akıcı geçişlerle (transitions) çalışan tema desteği. Tercihiniz tarayıcınıza kaydedilir.
- **Çift Dil Desteği (TR/EN):** Uygulama içi anlık olarak Türkçe ve İngilizce dilleri arasında geçiş yapabilme imkanı.
- **PWA Desteği:** DatHex'i masaüstü uygulaması gibi kullanmak üzere (PWA) doğrudan bilgisayarınıza yükleyebilirsiniz.
- **Özel DOS Başlatıcı:** Türkçe karakterleri komut satırında sorunsuz gösteren ve hem sunucuyu hem de arayüzü tek tıkla başlatan özel kodlanmış `DatHex.bat` dosyası.

## 🛠️ Kullanılan Teknolojiler

- **Frontend:** React, Vite, Vanilla CSS, Lucide-React
- **Backend:** Node.js, Express 5.0, Socket.IO
- **Sistem Entegrasyonu:** Windows Package Manager (`winget`), `child_process`

## 🚀 Kurulum ve Kullanım

### Gereksinimler
- **Windows 10/11** ([Winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/) yüklü olmalıdır).
- **Node.js** (v18 veya üzeri önerilir).

### Kurulum
1. Repoyu klonlayın:
   ```bash
   git clone https://github.com/an1lbayram/DatHex-V2.git
   ```
2. Sunucu bağımlılıklarını yükleyin:
   ```bash
   cd server
   npm install
   ```
3. İstemci (Frontend) bağımlılıklarını yükleyip derleyin:
   ```bash
   cd ../client
   npm install
   npm run build
   ```

### DatHex'i Çalıştırma
Proje ana dizinindeki **`DatHex.bat`** dosyasına çift tıklamanız yeterlidir.

Batch dosyası arka planda otomatik olarak:
1. Node.js sunucusunu başlatır.
2. Sizi doğrudan `http://localhost:3001` adresine, varsayılan tarayıcınıza yönlendirir.

## 🤝 Katkıda Bulunma
Projeye katkı sağlamak, hata bildirmek veya yeni özellik önermek isterseniz GitHub üzerinden Pull Request veya Issue açabilirsiniz.

## 📝 Lisans
Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

---
