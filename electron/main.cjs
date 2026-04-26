const path = require("path");
const { app, BrowserWindow, ipcMain, screen } = require("electron");

let mainWindow = null;
let companionWindow = null;

const isDev = process.env.NODE_ENV !== "production";
const devUrl = "http://localhost:5173";
const indexPath = path.join(__dirname, "..", "dist", "index.html");

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const url = isDev ? devUrl : `file://${indexPath}`;
  mainWindow.loadURL(url);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createCompanionWindow() {
  const primary = screen.getPrimaryDisplay();
  const workArea = primary.workArea;

  companionWindow = new BrowserWindow({
    width: 340,
    height: 460,
    x: Math.max(0, workArea.x + workArea.width - 360),
    y: Math.max(0, workArea.y + workArea.height - 480),
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    backgroundColor: "#00000000",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  companionWindow.setAlwaysOnTop(true, "floating");
  companionWindow.loadURL(isDev ? `${devUrl}/#companion` : `file://${indexPath}#companion`);

  companionWindow.on("closed", () => {
    companionWindow = null;
  });
}

function showCompanion() {
  if (!companionWindow) {
    createCompanionWindow();
  }

  if (companionWindow) {
    companionWindow.show();
    companionWindow.focus();
  }
}

function hideCompanion() {
  if (companionWindow && !companionWindow.isDestroyed()) {
    companionWindow.hide();
  }
}

function focusMainWindow() {
  if (!mainWindow) {
    createMainWindow();
  }

  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  }
}

app.on("ready", () => {
  createMainWindow();
  createCompanionWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
    createCompanionWindow();
  }
});

ipcMain.on("show-companion", () => {
  showCompanion();
});

ipcMain.on("hide-companion", () => {
  hideCompanion();
});

ipcMain.on("open-main", () => {
  focusMainWindow();
});

ipcMain.on("companion-command", (_event, command) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("companion-command", command);
    focusMainWindow();
  }
});
