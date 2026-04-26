const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("aynaDesktop", {
  showCompanion: () => ipcRenderer.send("show-companion"),
  hideCompanion: () => ipcRenderer.send("hide-companion"),
  openMain: () => ipcRenderer.send("open-main"),
  sendCompanionCommand: (command) => ipcRenderer.send("companion-command", command),
  onCompanionCommand: (callback) => {
    const listener = (_event, command) => {
      callback(command);
    };

    ipcRenderer.on("companion-command", listener);

    return () => {
      ipcRenderer.removeListener("companion-command", listener);
    };
  },
});
