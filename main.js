const { app, BrowserWindow, webFrameMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');

// ---------- Desempenho (FPS limitado a 90 dentro do inject.js) ----------
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('disable-frame-rate-limit');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

// ---------- Discord Rich Presence (opcional) ----------
// Cole aqui o Application ID do seu app em discord.com/developers
const DISCORD_CLIENT_ID = '';

function startDiscord() {
  if (!DISCORD_CLIENT_ID) return;
  try {
    const RPC = require('discord-rpc');
    const rpc = new RPC.Client({ transport: 'ipc' });
    rpc.on('ready', () => {
      rpc.setActivity({
        details: 'Jogando HaxBall',
        state: 'HaxMantega',
        startTimestamp: new Date(),
        instance: false
      });
    });
    rpc.login({ clientId: DISCORD_CLIENT_ID }).catch(() => {});
  } catch (e) {}
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'HaxMantega',
    backgroundColor: '#1a2125',
    autoHideMenuBar: true,
    webPreferences: {
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const injectCode = fs.readFileSync(path.join(__dirname, 'inject.js'), 'utf8');

  win.webContents.on('did-frame-finish-load', (event, isMainFrame, processId, routingId) => {
    try {
      const frame = webFrameMain.fromId(processId, routingId);
      if (frame) frame.executeJavaScript(injectCode).catch(() => {});
    } catch (e) {}
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.loadURL('https://www.haxball.com/play');
}

app.whenReady().then(() => {
  createWindow();
  startDiscord();
});

app.on('window-all-closed', () => app.quit());