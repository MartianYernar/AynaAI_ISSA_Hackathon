interface AynaDesktopApi {
  showCompanion: () => void;
  hideCompanion: () => void;
  openMain: () => void;
  sendCompanionCommand: (command: string) => void;
  onCompanionCommand: (callback: (command: string) => void) => () => void;
}

declare global {
  interface Window {
    aynaDesktop?: AynaDesktopApi;
  }
}

export {};
