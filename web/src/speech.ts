import { useCallback, useEffect, useState } from 'react';
import { LANGUAGE_SPEECH, type StyleLanguage } from '../../shared/game';
import type { LogEntry } from './api';

// 朗读（V0.6.0）：用浏览器自带的语音把叙述念出来，不花 AI 额度。语言跟着这一局的主持语言走。
// 「自动朗读」是每个人自己的偏好，记在这个浏览器里（读不到就当没开）。

const AUTO_KEY = 'trpg:auto-read';

const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

function readAuto(): boolean {
  try {
    return window.localStorage.getItem(AUTO_KEY) === '1';
  } catch {
    return false;
  }
}

function writeAuto(on: boolean) {
  try {
    window.localStorage.setItem(AUTO_KEY, on ? '1' : '0');
  } catch {
    // 存不了就只在这一页有效
  }
}

/** 一条记录里要念的文字（叙述、开场、结局、只发给我的叙述）；别的（聊天、提问、系统消息）不念。 */
export function speechTextOf(entry: LogEntry): string | null {
  if (entry.kind !== 'narration') return null;
  const d = entry.data;
  if (d?.type === 'opening') return `${d.background}${d.situation}`;
  if (d?.type === 'ending') return `${d.title}。${d.epilogue}`;
  if (d?.type === 'say' || d?.type === 'give') return null;
  return entry.text || null;
}

export function useSpeech(language: StyleLanguage) {
  const [auto, setAutoState] = useState(() => speechSupported && readAuto());
  const [speaking, setSpeaking] = useState(false);

  /** 念一段。queue：排在正在念的后面（自动朗读用）；不然先停下正在念的。 */
  const speak = useCallback(
    (text: string, queue = false) => {
      if (!speechSupported || !text.trim()) return;
      const synth = window.speechSynthesis;
      if (!queue) synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const lang = LANGUAGE_SPEECH[language];
      u.lang = lang;
      const voice = synth.getVoices().find((v) => v.lang === lang) ?? synth.getVoices().find((v) => v.lang.startsWith(lang.slice(0, 2)));
      if (voice) u.voice = voice;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      synth.speak(u);
    },
    [language],
  );

  const stop = useCallback(() => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const setAuto = useCallback(
    (on: boolean) => {
      setAutoState(on);
      writeAuto(on);
      if (!on) stop();
    },
    [stop],
  );

  // 离开这一局时别接着念
  useEffect(() => () => stop(), [stop]);

  return { supported: speechSupported, speak: speechSupported ? speak : null, stop, speaking, auto, setAuto };
}
