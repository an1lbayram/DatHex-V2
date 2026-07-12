# DatHex 2.0 🚀

DatHex 2.0 is a modern, premium web-based graphical user interface (GUI) and background service wrapper for the **Windows Package Manager (Winget)**. Built to make app management effortless and visually stunning, DatHex eliminates the need for manual terminal commands by providing a sleek, glassmorphic UI to scan, manage, and upgrade your installed applications with a single click.

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

- **Frontend:** React, Vite, Vanilla CSS (Custom Design System), Lucide-React (Icons)
- **Backend:** Node.js, Express 5.0, Socket.IO
- **System Integration:** Windows Package Manager (`winget`), `child_process`

## 🚀 Installation & Usage

### Prerequisites
- **Windows 10/11** with [Winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/) installed.
- **Node.js** (v18 or higher recommended).

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/an1lbayram/dathex.git
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
1. Display a beautifully formatted terminal header.
2. Boot up the Node.js backend server.
3. Automatically launch your default web browser to `http://localhost:3001` where the DatHex UI awaits.

## 📸 Screenshots
*(Feel free to add your own screenshots here!)*

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is licensed under the [MIT License](LICENSE).

---
</> Created with ❤️ by an1lbayram
