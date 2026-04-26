/**
 * Browser speech: STT + TTS. Voice picks best match per output language, with env overrides.
 */

import {
  getOutputLanguage,
  type OutputLanguage,
} from "../../i18n/outputLanguage";

type SpeechRecognitionCtor = new () => SpeechRecognition;

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

export function utteranceLangForOutput(lang: OutputLanguage): string {
  if (lang === "ru") {
    return "ru-RU";
  }
  if (lang === "kk") {
    return "kk-KZ";
  }
  return "en-US";
}

/** BCP-47 tag for Web Speech API recognition. */
export function speechRecognitionLangForOutput(lang: OutputLanguage): string {
  return utteranceLangForOutput(lang);
}

export function isSpeechRecognitionSupported(): boolean {
  return Boolean(
    typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition),
  );
}

export function createSpeechRecognition(): SpeechRecognition | null {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) {
    return null;
  }
  const r = new Ctor();
  r.continuous = false;
  r.interimResults = false;
  r.lang = speechRecognitionLangForOutput(getOutputLanguage());
  return r;
}

function localeMatchesOutput(v: SpeechSynthesisVoice, lang: OutputLanguage): boolean {
  const loc = v.lang.toLowerCase();
  if (lang === "en") {
    return loc.startsWith("en");
  }
  if (lang === "ru") {
    return loc.startsWith("ru");
  }
  if (lang === "kk") {
    return loc.startsWith("kk") || loc.startsWith("kz");
  }
  return true;
}

function scoreVoice(v: SpeechSynthesisVoice, lang: OutputLanguage): number {
  if (!localeMatchesOutput(v, lang)) {
    return -1000;
  }
  let score = 0;
  const blob = `${v.name} ${v.voiceURI}`.toLowerCase();

  if (
    /female|woman|zira|samantha|aria|jenny|sonia|michelle|emma|victoria|karen|fiona|olivia|susan|natasha|milena|katya|irina|google uk english female|yelena|oksana/i.test(
      blob,
    )
  ) {
    score += 28;
  }
  if (/neural|premium|natural|online|enhanced/i.test(blob)) {
    score += 14;
  }
  if (/google|microsoft/i.test(blob)) {
    score += 6;
  }
  if (/male|^david |^daniel |^mark |^james |^fred /i.test(blob)) {
    score -= 45;
  }
  if (v.default) {
    score += 4;
  }
  if (v.localService) {
    score += 2;
  }
  return score;
}

function pickVoice(lang: OutputLanguage): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    return null;
  }

  const overrideUri = import.meta.env.VITE_TTS_VOICE_URI?.trim();
  const overrideName = import.meta.env.VITE_TTS_VOICE_NAME?.trim();
  if (overrideUri) {
    const byUri = voices.find(
      (voice) => voice.voiceURI === overrideUri || voice.name === overrideUri,
    );
    if (byUri) {
      return byUri;
    }
  }
  if (overrideName) {
    const low = overrideName.toLowerCase();
    const byName = voices.find((voice) => voice.name.toLowerCase().includes(low));
    if (byName) {
      return byName;
    }
  }

  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -9999;
  for (const voice of voices) {
    const s = scoreVoice(voice, lang);
    if (s > bestScore) {
      bestScore = s;
      best = voice;
    }
  }
  if (best && bestScore > -500) {
    return best;
  }

  const fallback = voices.find((v) => localeMatchesOutput(v, lang));
  return fallback ?? voices[0] ?? null;
}

let voicesWarmed = false;

function ensureVoicesLoaded(): void {
  if (voicesWarmed || typeof window === "undefined") {
    return;
  }
  const synth = window.speechSynthesis;
  if (!synth) {
    return;
  }
  if (synth.getVoices().length > 0) {
    voicesWarmed = true;
    return;
  }
  synth.addEventListener(
    "voiceschanged",
    () => {
      voicesWarmed = true;
    },
    { once: true },
  );
}

const MAX_TTS_CHARS = 9_000;

export function speakAyana(text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }
  ensureVoicesLoaded();
  const lang = getOutputLanguage();
  const trimmed = text.replace(/\s+/g, " ").trim().slice(0, MAX_TTS_CHARS);
  if (!trimmed) {
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(trimmed);
  u.lang = utteranceLangForOutput(lang);
  u.rate = lang === "en" ? 0.93 : 0.96;
  u.pitch = lang === "en" ? 1.05 : 1.02;
  const voice = pickVoice(lang);
  if (voice) {
    u.voice = voice;
  }
  window.speechSynthesis.speak(u);
}

export function stopAyanaSpeech(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
