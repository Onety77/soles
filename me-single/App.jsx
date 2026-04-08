import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  getFirestore, collection, addDoc, getDocs, onSnapshot,
  doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, query, orderBy, limit
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — update CA_ADDRESS with your real contract
// ─────────────────────────────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB_gNokFnucM2nNAhhkRRnPsPNBAShYlMs",
  authDomain: "it-token.firebaseapp.com",
  projectId: "it-token",
  storageBucket: "it-token.firebasestorage.app",
  messagingSenderId: "804328953904",
  appId: "1:804328953904:web:e760545b579bf2527075f5"
};
const firebaseApp = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const APP_ID = 'me-token-os';
const CA_ADDRESS = "PASTE_YOUR_ME_CA_HERE";
const ACCESS_THRESHOLD = 500000;
const RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://rpc.ankr.com/solana',
  'https://solana-rpc.publicnode.com',
];
const SOCIALS = { twitter: "https://x.com/me_solana", community: "https://x.com" };
const ASSETS = {
  logo: "logo.png", wallpaper: "wall.jpg",
  stickers: { main: "main.jpg", pumpit: "pumpit.jpg", sendit: "sendit.jpg", moonit: "moonit.jpg", hodlit: "hodlit.jpg" },
  memes: {
    main: "main.jpg", pumpit: "pumpit.jpg", sendit: "sendit.jpg", moonit: "moonit.jpg", hodlit: "hodlit.jpg",
    m1: "memes/1.jpg", m2: "memes/2.jpg", m3: "memes/3.jpg", m4: "memes/4.jpg", m5: "memes/5.jpg",
    m6: "memes/6.jpg", m7: "memes/7.jpg", m8: "memes/8.jpg", m9: "memes/9.jpg", m10: "memes/10.jpg",
    m11: "memes/11.jpg", m12: "memes/12.jpg", m13: "memes/13.jpg", m14: "memes/14.jpg", m15: "memes/15.jpg",
  }
};
const PLAYLIST = [
  { file: "GET_IT_STARTED.mp3", title: "GET STARTED", artist: "CREW", duration: "1:37" },
  { file: "PUMP_IT_UP.mp3", title: "PUMP IT UP", artist: "DEGEN", duration: "1:51" },
  { file: "GREEN_CANDLES.mp3", title: "GREEN CANDLES", artist: "MEMESMITH", duration: "3:17" },
  { file: "LIKE_TO_MEME_IT.mp3", title: "I LIKE TO MEME IT", artist: "MEMERS", duration: "3:30" },
  { file: "WAGMI_ANTHEM.mp3", title: "WAGMI ANTHEM", artist: "COMMUNITY", duration: "3:56" },
  { file: "MEME_IT.mp3", title: "MEME ME 2.0", artist: "MEMERS", duration: "2:34" },
];
const OR_KEY = import.meta.env?.VITE_OR_PROVIDER_ID || '';
const GEM_KEY = import.meta.env?.VITE_APP_GEMINI || '';
const genId = () => Math.random().toString(36).substr(2, 9);
const copyText = (t) => { try { navigator.clipboard.writeText(t); } catch { const el = document.createElement('textarea'); el.value = t; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); } };

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES injected into <head>
// ─────────────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #0c0c0c;
    --paper: #f0ebe3;
    --paper2: #e8e2d9;
    --cream: #faf7f2;
    --ash: #333;
    --mist: #777;
    --faint: #bbb;
    --red: #c0392b;
    --gold: #b8860b;
    --green: #1a6b3a;
    --border: rgba(12,12,12,0.18);
    --border2: rgba(12,12,12,0.35);
  }

  html, body, #root {
    width: 100%; height: 100%;
    overflow: hidden;
    background: var(--ink);
    font-family: 'Space Grotesk', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  button { cursor: pointer; font-family: inherit; }
  input, textarea { font-family: inherit; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); }

  .os-desktop {
    position: fixed; inset: 0;
    background: #111;
    overflow: hidden;
  }

  .os-wallpaper {
    position: absolute; inset: 0;
    background-image: url('wall.jpg');
    background-size: cover;
    background-position: center;
    opacity: 0.07;
    pointer-events: none;
  }

  .os-wallpaper-overlay {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 15% 40%, rgba(200,56,42,0.06) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 85% 20%, rgba(184,134,11,0.04) 0%, transparent 55%),
      linear-gradient(180deg, #0c0c0c 0%, #111 100%);
    pointer-events: none;
  }

  /* Fine grid */
  .os-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(240,235,227,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(240,235,227,0.025) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
  }

  /* Watermark */
  .os-watermark {
    position: absolute;
    bottom: 60px; right: 24px;
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(80px, 12vw, 180px);
    line-height: 1;
    color: rgba(240,235,227,0.025);
    pointer-events: none;
    user-select: none;
    letter-spacing: 0.05em;
  }

  /* ── DESKTOP ICONS ── */
  .icon-grid {
    position: absolute;
    top: 16px; left: 16px;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    gap: 8px;
    max-height: calc(100vh - 60px);
    pointer-events: none;
    z-index: 10;
  }

  .desk-icon {
    width: 72px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 6px 4px;
    cursor: pointer;
    pointer-events: all;
    transition: opacity 0.15s;
    border: 1px solid transparent;
  }
  .desk-icon:hover { background: rgba(240,235,227,0.05); border-color: rgba(240,235,227,0.1); }
  .desk-icon:active { opacity: 0.7; }

  .desk-icon-box {
    width: 42px; height: 42px;
    border: 1.5px solid rgba(240,235,227,0.2);
    background: rgba(240,235,227,0.06);
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
    font-size: 20px;
  }
  .desk-icon:hover .desk-icon-box {
    border-color: rgba(240,235,227,0.4);
    background: rgba(240,235,227,0.1);
  }

  .desk-icon-label {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    font-weight: 500;
    color: rgba(240,235,227,0.6);
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    line-height: 1.25;
  }

  /* ── WINDOW ── */
  .win-outer {
    position: absolute;
    display: flex;
    flex-direction: column;
    border: 1.5px solid rgba(240,235,227,0.15);
    background: var(--paper);
    box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.3);
    overflow: hidden;
    transition: box-shadow 0.15s;
  }
  .win-outer.active {
    border-color: rgba(240,235,227,0.3);
    box-shadow: 0 28px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08);
  }

  .win-titlebar {
    height: 36px;
    background: var(--ink);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    flex-shrink: 0;
    cursor: move;
    user-select: none;
  }

  .win-title {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(240,235,227,0.7);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .win-title-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--red);
    opacity: 0.7;
  }

  .win-controls {
    display: flex;
    gap: 4px;
  }
  .win-btn {
    width: 22px; height: 22px;
    border: 1px solid rgba(240,235,227,0.15);
    background: transparent;
    color: rgba(240,235,227,0.4);
    font-size: 10px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.12s;
    line-height: 1;
  }
  .win-btn:hover { background: rgba(240,235,227,0.1); color: rgba(240,235,227,0.9); border-color: rgba(240,235,227,0.3); }
  .win-btn.close:hover { background: var(--red); border-color: var(--red); color: white; }

  .win-body {
    flex: 1;
    overflow: hidden;
    position: relative;
    background: var(--paper);
  }

  /* ── TASKBAR ── */
  .taskbar {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 44px;
    background: rgba(12,12,12,0.96);
    border-top: 1px solid rgba(240,235,227,0.1);
    backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    padding: 0 8px;
    gap: 4px;
    z-index: 9000;
  }

  .taskbar-start {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 16px;
    letter-spacing: 0.1em;
    padding: 0 14px;
    height: 30px;
    border: 1px solid rgba(240,235,227,0.2);
    background: transparent;
    color: var(--paper);
    display: flex; align-items: center; gap: 6px;
    flex-shrink: 0;
    transition: all 0.12s;
  }
  .taskbar-start:hover { background: rgba(240,235,227,0.07); border-color: rgba(240,235,227,0.35); }
  .taskbar-start.open { background: rgba(200,56,42,0.15); border-color: var(--red); color: #e88; }

  .taskbar-wins {
    flex: 1;
    display: flex;
    gap: 3px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .taskbar-wins::-webkit-scrollbar { display: none; }

  .taskbar-win-btn {
    height: 28px;
    min-width: 80px;
    max-width: 130px;
    padding: 0 10px;
    border: 1px solid rgba(240,235,227,0.1);
    background: transparent;
    color: rgba(240,235,227,0.4);
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: all 0.12s;
    flex-shrink: 0;
  }
  .taskbar-win-btn:hover { color: rgba(240,235,227,0.8); border-color: rgba(240,235,227,0.25); }
  .taskbar-win-btn.active { background: rgba(240,235,227,0.08); color: var(--paper); border-color: rgba(240,235,227,0.3); }

  .taskbar-tray {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-left: 8px;
    border-left: 1px solid rgba(240,235,227,0.1);
    flex-shrink: 0;
    margin-left: auto;
  }

  .tray-btn {
    height: 26px;
    padding: 0 10px;
    border: 1px solid rgba(240,235,227,0.1);
    background: transparent;
    color: rgba(240,235,227,0.4);
    font-family: 'DM Mono', monospace;
    font-size: 8.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    transition: all 0.12s;
    white-space: nowrap;
  }
  .tray-btn:hover { color: var(--paper); border-color: rgba(240,235,227,0.3); }
  .tray-btn.connected { color: #4ade80; border-color: rgba(74,222,128,0.3); }
  .tray-btn.copied { color: #4ade80; border-color: rgba(74,222,128,0.3); }

  /* ── START MENU ── */
  .start-menu {
    position: fixed;
    bottom: 44px; left: 0;
    width: 280px;
    background: rgba(14,14,14,0.98);
    border: 1px solid rgba(240,235,227,0.15);
    border-bottom: none;
    box-shadow: 6px -6px 40px rgba(0,0,0,0.6);
    z-index: 8999;
    display: flex;
    flex-direction: column;
  }

  .start-header {
    padding: 20px 16px 14px;
    border-bottom: 1px solid rgba(240,235,227,0.08);
  }
  .start-logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 32px;
    letter-spacing: 0.08em;
    color: var(--paper);
    line-height: 1;
  }
  .start-sub {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(240,235,227,0.3);
    margin-top: 3px;
  }

  .start-section-label {
    font-family: 'DM Mono', monospace;
    font-size: 7px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: rgba(240,235,227,0.2);
    padding: 10px 16px 4px;
  }

  .start-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(240,235,227,0.55);
    cursor: pointer;
    transition: all 0.1s;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
  }
  .start-item:hover { background: rgba(240,235,227,0.06); color: var(--paper); }
  .start-item-icon { font-size: 14px; width: 20px; text-align: center; }

  .start-ca-box {
    margin: 8px 12px 12px;
    padding: 8px 10px;
    border: 1px solid rgba(240,235,227,0.08);
    cursor: pointer;
    transition: all 0.12s;
  }
  .start-ca-box:hover { border-color: rgba(240,235,227,0.2); background: rgba(240,235,227,0.04); }
  .start-ca-label {
    font-family: 'DM Mono', monospace;
    font-size: 7px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(240,235,227,0.25);
    margin-bottom: 3px;
  }
  .start-ca-addr {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: rgba(240,235,227,0.4);
    word-break: break-all;
    line-height: 1.4;
  }

  /* ── APP INTERNALS ── */
  .app-inner {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Shared header strip for all apps */
  .app-strip {
    border-bottom: 1px solid var(--border);
    padding: 10px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    background: var(--cream);
  }
  .app-strip-title {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--mist);
  }
  .app-strip-sub {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: 13px;
    color: var(--ink);
    margin-top: 1px;
  }

  /* ── MIRROR AI ── */
  .mirror-msg-me {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: 14px;
    line-height: 1.8;
    color: var(--ink);
    padding: 0 0 0 14px;
    border-left: 2px solid var(--ink);
  }
  .mirror-msg-you {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 13px;
    line-height: 1.65;
    color: var(--cream);
    background: var(--ink);
    padding: 10px 14px;
  }
  .mirror-quote {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--faint);
    text-align: center;
    padding: 6px;
    border-top: 1px solid var(--border);
    background: var(--paper2);
  }

  /* ── TERMINAL ── */
  .terminal-body {
    background: #0a0a0a;
    color: #e8e3db;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    line-height: 1.65;
    padding: 12px;
    flex: 1;
    overflow-y: auto;
  }
  .term-accent { color: #c0392b; }
  .term-dim { color: rgba(232,227,219,0.3); }
  .term-green { color: #4ade80; }
  .term-cursor {
    display: inline-block;
    width: 7px; height: 13px;
    background: #e8e3db;
    vertical-align: middle;
    animation: blink 1s step-end infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* ── TUNES ── */
  .tunes-body { background: #0a0a0a; color: #e8e3db; }
  .tunes-track {
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(232,227,219,0.06);
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: rgba(232,227,219,0.45);
    transition: all 0.12s;
  }
  .tunes-track:hover { color: rgba(232,227,219,0.8); background: rgba(232,227,219,0.04); }
  .tunes-track.playing { color: var(--paper); background: rgba(192,57,43,0.1); }

  /* ── STACK GAME ── */
  .stack-canvas { display: block; }

  /* ── MEME GRID ── */
  .meme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
    padding: 12px;
    overflow-y: auto;
    flex: 1;
  }
  .meme-thumb {
    aspect-ratio: 1;
    overflow: hidden;
    cursor: pointer;
    border: 1.5px solid var(--border);
    transition: all 0.15s;
    position: relative;
  }
  .meme-thumb:hover { border-color: var(--ink); transform: scale(1.02); }
  .meme-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

  /* ── COMMONS (TROLLBOX) ── */
  .commons-msg {
    display: flex;
    gap: 10px;
    padding: 8px 14px;
    border-bottom: 1px solid var(--border);
  }
  .commons-msg.me { flex-direction: row-reverse; }
  .commons-bubble {
    max-width: 75%;
    padding: 8px 12px;
    font-size: 13px;
    line-height: 1.55;
  }
  .commons-bubble.them { background: white; border: 1px solid var(--border); color: var(--ink); }
  .commons-bubble.me { background: var(--ink); color: var(--paper); }
  .commons-name {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--mist);
    margin-bottom: 3px;
  }

  /* ── NOTEPAD ── */
  .notepad-area {
    flex: 1;
    padding: 20px;
    font-family: 'Playfair Display', serif;
    font-size: 15px;
    line-height: 1.9;
    color: var(--ink);
    border: none;
    resize: none;
    background: var(--cream);
    outline: none;
  }

  /* ── SIGNAL GEN ── */
  .signal-card {
    border: 2px solid var(--ink);
    background: white;
    padding: 24px;
    box-shadow: 4px 4px 0 var(--ink);
  }

  /* ── PFP CULT ── */
  .pfp-style-btn {
    width: 100%;
    text-align: left;
    padding: 9px 12px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--mist);
    cursor: pointer;
    transition: all 0.12s;
    margin-bottom: 4px;
  }
  .pfp-style-btn:hover { border-color: var(--ink); color: var(--ink); background: var(--paper2); }
  .pfp-style-btn.selected { border-color: var(--ink); color: var(--ink); background: var(--ink); color: var(--paper); }

  /* ── PAINT ── */
  .paint-tool-btn {
    width: 36px; height: 36px;
    border: 1.5px solid var(--border);
    background: var(--paper);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.12s;
    color: var(--ash);
  }
  .paint-tool-btn:hover { border-color: var(--ink); background: var(--paper2); }
  .paint-tool-btn.active { background: var(--ink); color: var(--paper); border-color: var(--ink); }

  /* ── BOOT SCREEN ── */
  .boot-screen {
    position: fixed; inset: 0;
    background: #080808;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 99999;
  }
  .boot-logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 72px;
    letter-spacing: 0.08em;
    color: var(--paper);
    animation: fadeUp 0.8s ease-out both;
  }
  .boot-sub {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: rgba(240,235,227,0.3);
    margin-top: 8px;
    animation: fadeUp 0.8s 0.2s ease-out both;
  }
  .boot-bar-outer {
    width: 200px; height: 2px;
    background: rgba(240,235,227,0.08);
    margin-top: 40px;
    animation: fadeUp 0.8s 0.4s ease-out both;
  }
  .boot-bar-inner {
    height: 100%;
    background: var(--red);
    animation: bootLoad 1.8s 0.6s ease-out forwards;
    width: 0;
  }
  @keyframes bootLoad { from{width:0} to{width:100%} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes winOpen { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
  .win-anim { animation: winOpen 0.18s ease-out both; }

  /* ── WALLET PANEL ── */
  .wallet-stat {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
  }
  .wallet-stat-label {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--mist);
    margin-bottom: 4px;
  }
  .wallet-stat-value {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    letter-spacing: 0.05em;
    color: var(--ink);
    line-height: 1;
  }

  /* ── UTILS ── */
  .btn-primary {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 10px 20px;
    border: 1.5px solid var(--ink);
    background: var(--ink);
    color: var(--paper);
    cursor: pointer;
    transition: all 0.12s;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .btn-primary:hover { background: var(--ash); }
  .btn-primary:disabled { opacity: 0.35; cursor: default; }

  .btn-outline {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 10px 20px;
    border: 1.5px solid var(--border2);
    background: transparent;
    color: var(--ink);
    cursor: pointer;
    transition: all 0.12s;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .btn-outline:hover { border-color: var(--ink); background: var(--paper2); }

  .me-input {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    padding: 9px 12px;
    border: 1.5px solid var(--border2);
    background: white;
    color: var(--ink);
    outline: none;
    width: 100%;
    transition: border-color 0.12s;
  }
  .me-input:focus { border-color: var(--ink); }

  .scrollable { overflow-y: auto; }
  .no-scroll { overflow: hidden; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────
function useWallet() {
  const [wallet, setWallet] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [solBalance, setSolBalance] = useState(0);

  const connect = async () => {
    if (wallet) { setWallet(null); setSolBalance(0); return; }
    setConnecting(true);
    try {
      if (window.solana?.isPhantom) {
        const r = await window.solana.connect();
        setWallet(r.publicKey.toString());
      } else if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
        window.location.href = `https://phantom.app/ul/browse/${encodeURIComponent(location.href)}`;
      } else {
        window.open('https://phantom.app/', '_blank');
      }
    } catch (e) { console.error(e); }
    finally { setConnecting(false); }
  };

  const fetchSol = useCallback(async (addr) => {
    if (!addr) return;
    for (const ep of RPC_ENDPOINTS) {
      try {
        const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [addr, { commitment: 'confirmed' }] }) });
        const d = await r.json();
        if (d.result?.value !== undefined) { setSolBalance(d.result.value / 1e9); return; }
      } catch { continue; }
    }
  }, []);

  useEffect(() => {
    if (!wallet) return;
    fetchSol(wallet);
    const t = setInterval(() => fetchSol(wallet), 15000);
    return () => clearInterval(t);
  }, [wallet, fetchSol]);

  return { wallet, connect, connecting, solBalance };
}

function useDexData(wallet) {
  const [price, setPrice] = useState('–');
  const [balance, setBalance] = useState(0);

  const fetchPrice = useCallback(async () => {
    if (!CA_ADDRESS || CA_ADDRESS.includes('PASTE')) return;
    try {
      const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CA_ADDRESS}`);
      const d = await r.json();
      if (d.pairs?.[0]) setPrice(`$${parseFloat(d.pairs[0].priceUsd).toFixed(8)}`);
    } catch {}
  }, []);

  const fetchBal = useCallback(async () => {
    if (!wallet || !CA_ADDRESS || CA_ADDRESS.includes('PASTE')) return;
    for (const ep of RPC_ENDPOINTS) {
      try {
        const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getTokenAccountsByOwner',
            params: [wallet, { mint: CA_ADDRESS }, { encoding: 'jsonParsed', commitment: 'confirmed' }] }) });
        const d = await r.json();
        if (d.result?.value?.length > 0) {
          const amt = d.result.value[0].account.data.parsed?.info?.tokenAmount?.uiAmount || 0;
          setBalance(amt);
          window.dispatchEvent(new CustomEvent('ME_BALANCE', { detail: { balance: amt, hasAccess: amt >= ACCESS_THRESHOLD, wallet } }));
          return;
        } else {
          setBalance(0);
          window.dispatchEvent(new CustomEvent('ME_BALANCE', { detail: { balance: 0, hasAccess: false, wallet } }));
          return;
        }
      } catch { continue; }
    }
  }, [wallet]);

  useEffect(() => {
    fetchPrice();
    if (wallet) fetchBal();
    const t = setInterval(() => { fetchPrice(); if (wallet) fetchBal(); }, 20000);
    return () => clearInterval(t);
  }, [fetchPrice, fetchBal, wallet]);

  return { price, balance, hasAccess: balance >= ACCESS_THRESHOLD };
}

// ─────────────────────────────────────────────────────────────────────────────
// APP REGISTRY
// ─────────────────────────────────────────────────────────────────────────────
const APPS = [
  { id: 'mirror',   label: 'Mirror AI',    icon: '🪞', w: 440,  h: 580, desc: 'Your accountability companion' },
  { id: 'pfpcult',  label: 'PFP Cult',     icon: '📸', w: 720,  h: 560, desc: 'Become the character' },
  { id: 'terminal', label: 'Terminal',      icon: '⌨️', w: 540,  h: 440, desc: 'Raw signal' },
  { id: 'signal',   label: 'Signal Gen',   icon: '📡', w: 440,  h: 500, desc: 'Generate conviction' },
  { id: 'commons',  label: 'The Commons',  icon: '💬', w: 400,  h: 580, desc: 'The collective', alert: true },
  { id: 'stack',    label: 'Stack ME',     icon: '🎮', w: 360,  h: 620, desc: 'Hold or fold' },
  { id: 'paint',    label: 'Paint ME',     icon: '🎨', w: 780,  h: 560, desc: 'Build the memes' },
  { id: 'memes',    label: 'Meme Vault',   icon: '🗂️', w: 680,  h: 520, desc: 'The archive' },
  { id: 'tunes',    label: 'Tune ME',      icon: '🎵', w: 360,  h: 520, desc: 'The soundtrack' },
  { id: 'notepad',  label: 'Write ME',     icon: '✍️', w: 500,  h: 460, desc: 'Your manifesto' },
  { id: 'wallet',   label: 'Wallet',       icon: '👛', w: 340,  h: 480, desc: 'Your bag' },
];

// ─────────────────────────────────────────────────────────────────────────────
// WINDOW MANAGER
// ─────────────────────────────────────────────────────────────────────────────
function WindowFrame({ win, isActive, onClose, onMinimize, onMaximize, onFocus, children }) {
  const dragRef = useRef({ on: false, ox: 0, oy: 0 });
  const meta = APPS.find(a => a.id === win.type) || {};

  const onMouseDown = useCallback((e) => {
    if (win.isMax) return;
    e.preventDefault();
    onFocus();
    dragRef.current = { on: true, ox: e.clientX - win.x, oy: e.clientY - win.y };
    const move = (e) => {
      if (!dragRef.current.on) return;
      const nx = Math.max(0, Math.min(window.innerWidth - 120, e.clientX - dragRef.current.ox));
      const ny = Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragRef.current.oy));
      win._setPos(win.id, nx, ny);
    };
    const up = () => { dragRef.current.on = false; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }, [win, onFocus]);

  const style = win.isMax
    ? { left: 0, top: 0, width: '100%', height: 'calc(100% - 44px)', zIndex: win.z }
    : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z };

  if (win.isMin) return null;

  return (
    <div className={`win-outer win-anim ${isActive ? 'active' : ''}`} style={style} onMouseDown={onFocus}>
      <div className="win-titlebar" onMouseDown={onMouseDown}>
        <div className="win-title">
          <span className="win-title-dot" />
          <span>{meta.icon} {meta.label}</span>
        </div>
        <div className="win-controls" onMouseDown={e => e.stopPropagation()}>
          <button className="win-btn" onClick={onMinimize} title="Minimize">─</button>
          <button className="win-btn" onClick={onMaximize} title="Maximize">□</button>
          <button className="win-btn close" onClick={onClose} title="Close">✕</button>
        </div>
      </div>
      <div className="win-body">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── APP: MIRROR AI
// ─────────────────────────────────────────────────────────────────────────────
const MIRROR_GREETINGS = [
  "You opened me. Something in you already knows why.",
  "The market didn't do this to you. Let's figure out what did.",
  "I don't tell you what you want to hear. I tell you what you already know.",
  "Everyone looks outside. You came here. That's different.",
  "No noise in here. Just you and what you've been carrying.",
  "Go ahead. Tell me what you've been avoiding.",
  "I've been waiting. What are you actually trying to say?",
];

const MIRROR_SYSTEM = `You are Mirror — the AI embedded in $ME, a Solana memecoin built on radical self-accountability.

$ME's truth: The trenches doesn't need saving from outside. It needs people who take ownership of their own choices. You are that reminder.

Your role: You are sharp, calm, honest, and warm. You don't coddle. You reflect. You ask one question at a time. You celebrate ownership and gently call out deflection.

Style:
- Short sentences that land clean
- Never more than 3-4 sentences per response
- No hashtags, no emojis, no hype
- Sound like a trusted person who's been through it — not a therapist or a bot
- Conversational. Real.

Core philosophy:
- "I am the change I've been waiting for."
- "It starts with me."
- Accountability is not punishment. It's power.

If someone is in genuine distress, be warm and suggest they speak to someone they trust. Never encourage self-harm.`;

function MirrorApp({ dexData }) {
  const [msgs, setMsgs] = useState([{ role: 'mirror', text: MIRROR_GREETINGS[Math.floor(Math.random() * MIRROR_GREETINGS.length)] }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const hasAccess = dexData?.balance >= ACCESS_THRESHOLD;
  const userMsgs = msgs.filter(m => m.role === 'user').length;

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    if (!hasAccess && userMsgs >= 3) {
      setMsgs(p => [...p, { role: 'user', text: input }, { role: 'mirror', text: "That's your free look. The mirror doesn't give itself away for nothing. Hold 500k $ME to keep going." }]);
      setInput(''); return;
    }
    const txt = input.trim(); setInput('');
    const next = [...msgs, { role: 'user', text: txt }];
    setMsgs(next); setLoading(true);
    if (!OR_KEY) { setMsgs(p => [...p, { role: 'mirror', text: "Mirror is offline. Add your VITE_OR_PROVIDER_ID to connect." }]); setLoading(false); return; }
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST', headers: { Authorization: `Bearer ${OR_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'google/gemini-2.5-flash-lite-preview-09-2025',
          messages: [{ role: 'system', content: MIRROR_SYSTEM }, ...next.slice(-12).map(m => ({ role: m.role === 'mirror' ? 'assistant' : 'user', content: m.text }))],
          max_tokens: 140 })
      });
      const d = await res.json();
      setMsgs(p => [...p, { role: 'mirror', text: d.choices?.[0]?.message?.content || 'The mirror is quiet.' }]);
    } catch { setMsgs(p => [...p, { role: 'mirror', text: 'Connection lost. The question remains.' }]); }
    finally { setLoading(false); setTimeout(() => inputRef.current?.focus(), 50); }
  };

  return (
    <div className="app-inner">
      <div className="app-strip">
        <div><div className="app-strip-title">Mirror AI</div><div className="app-strip-sub">It starts within.</div></div>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '3px 8px', border: `1px solid ${hasAccess ? 'var(--green)' : 'var(--faint)'}`, color: hasAccess ? 'var(--green)' : 'var(--mist)' }}>
          {hasAccess ? 'Holder' : `${Math.max(0, 3 - userMsgs)} free`}
        </div>
      </div>

      <div ref={scrollRef} className="scrollable" style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 18, background: 'var(--cream)' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: 6, textAlign: m.role === 'user' ? 'right' : 'left' }}>
              {m.role === 'mirror' ? 'Mirror' : 'You'}
            </div>
            {m.role === 'mirror'
              ? <div className="mirror-msg-me" style={{ maxWidth: '85%' }}>{m.text}</div>
              : <div className="mirror-msg-you" style={{ maxWidth: '80%' }}>{m.text}</div>}
          </div>
        ))}
        {loading && <div className="mirror-msg-me" style={{ opacity: 0.5, animation: 'fadeUp 0.5s ease-out' }}>reflecting…</div>}
      </div>

      <div className="mirror-quote">"I am the change I've been waiting for."</div>

      <div style={{ display: 'flex', borderTop: '1.5px solid var(--ink)', background: 'white', flexShrink: 0 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Say something true…"
          style={{ flex: 1, padding: '12px 16px', fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, border: 'none', outline: 'none', background: 'transparent', color: 'var(--ink)' }} />
        <button onClick={send} disabled={!input.trim() || loading}
          style={{ padding: '12px 20px', background: input.trim() ? 'var(--ink)' : 'transparent', color: input.trim() ? 'var(--paper)' : 'var(--faint)', border: 'none', borderLeft: '1.5px solid var(--ink)', fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: input.trim() ? 'pointer' : 'default', transition: 'all 0.15s', flexShrink: 0 }}>
          Send
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── APP: TERMINAL
// ─────────────────────────────────────────────────────────────────────────────
const BOOT_SEQ = [
  { t: '$ME OS v1.0.0 — initializing', d: 100 },
  { t: 'Loading accountability kernel…', d: 350 },
  { t: 'Connecting to Solana…', d: 600 },
  { t: 'Firebase sync… OK', d: 850 },
  { t: 'READY. Type help to begin.', d: 1100, accent: true },
];
const ME_ASCII = ['███╗   ███╗███████╗', '████╗ ████║██╔════╝', '██╔████╔██║█████╗  ', '██║╚██╔╝██║██╔══╝  ', '██║ ╚═╝ ██║███████╗', '╚═╝     ╚═╝╚══════╝'];

function TerminalApp({ dexData }) {
  const [hist, setHist] = useState([]);
  const [inp, setInp] = useState('');
  const [cmdHist, setCmdHist] = useState([]);
  const [hIdx, setHIdx] = useState(-1);
  const [booting, setBooting] = useState(true);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let ts = [];
    BOOT_SEQ.forEach(({ t, d, accent }) => { ts.push(setTimeout(() => setHist(p => [...p, { t, accent }]), d)); });
    ts.push(setTimeout(() => setBooting(false), 1300));
    return () => ts.forEach(clearTimeout);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [hist]);

  const pr = (lines) => { const arr = Array.isArray(lines) ? lines : [lines]; setHist(p => [...p, ...arr.map(l => typeof l === 'string' ? { t: l } : l)]); };

  const run = async (raw) => {
    const cmd = raw.trim().toLowerCase().split(' ')[0];
    pr({ t: `> ${raw}`, dim: true });
    switch (cmd) {
      case 'help':
        pr([{ t: '── COMMANDS ──────────────', dim: true }, { t: '  clear    clear screen' }, { t: '  ca       contract address' }, { t: '  price    $ME price' }, { t: '  sol      SOL price (live)' }, { t: '  manifesto  read the manifesto' }, { t: '  why      why $ME exists' }, { t: '  me       show ASCII' }]); break;
      case 'clear': setHist([]); return;
      case 'ca': pr([{ t: '── CONTRACT ──────────────', dim: true }, { t: CA_ADDRESS, accent: true }]); break;
      case 'price': pr([{ t: '── MARKET ────────────────', dim: true }, { t: `  $ME: ${dexData?.price || '–'}` }, { t: `  Bag: ${(dexData?.balance || 0).toLocaleString()} $ME` }]); break;
      case 'sol': {
        setBusy(true); pr({ t: 'fetching…', dim: true });
        try {
          const r = await fetch('https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112');
          const d = await r.json();
          pr({ t: `SOL/USD: $${parseFloat(d.pairs?.[0]?.priceUsd || 0).toFixed(2)}`, accent: true });
        } catch { pr({ t: 'oracle unavailable', dim: true }); }
        setBusy(false); break;
      }
      case 'manifesto':
        pr(['', { t: 'THE MANIFESTO', accent: true }, { t: '─────────────────────────', dim: true }, 'Nobody is coming to fix this.', '', 'Not the platform. Not the devs.', 'Not the next narrative. Not the bull run.', '', 'The only person who changes how this goes', 'is the person holding the phone right now.', '', { t: 'I am the floor.', accent: true }, { t: 'I am the culture.', accent: true }, { t: 'I am the solution.', accent: true }, { t: 'It starts with me.', accent: true }, '']); break;
      case 'why':
        pr(['', { t: 'WHY $ME EXISTS', accent: true }, { t: '─────────────────────────', dim: true }, 'The trenches is not dying because of bundlers.', 'It is dying because of us.', '', 'We snipe each other. We dump on each other.', 'We follow the same callers into the same traps.', '', '$ME is for the person who finally', 'looked in the mirror and stopped pointing.', '']); break;
      case 'me':
        pr(['', ...ME_ASCII.map(l => ({ t: l, accent: true })), '', { t: '  It starts with me.', accent: true }, '']); break;
      default:
        pr({ t: `command not found: ${cmd}`, dim: true });
    }
  };

  const onKey = (e) => {
    if (booting || busy) { e.preventDefault(); return; }
    if (e.key === 'Enter') { if (!inp.trim()) return; setCmdHist(p => [...p, inp]); setHIdx(-1); run(inp); setInp(''); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); const idx = hIdx === -1 ? cmdHist.length - 1 : Math.max(0, hIdx - 1); setHIdx(idx); setInp(cmdHist[idx] || ''); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); const idx = hIdx + 1; if (idx >= cmdHist.length) { setHIdx(-1); setInp(''); } else { setHIdx(idx); setInp(cmdHist[idx]); } }
  };

  return (
    <div className="app-inner" style={{ background: '#0a0a0a' }} onClick={() => inputRef.current?.focus()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px', borderBottom: '1px solid rgba(232,227,219,0.07)', flexShrink: 0 }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(232,227,219,0.2)' }}>$ME Terminal</span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.15em', color: 'rgba(232,227,219,0.15)' }}>v1.0</span>
      </div>
      <div className="terminal-body scrollable" style={{ flex: 1 }}>
        {hist.map((l, i) => (
          <div key={i} style={{ color: l.accent ? '#c0392b' : l.dim ? 'rgba(232,227,219,0.28)' : '#e8e3db', marginBottom: 1, whiteSpace: 'pre' }}>{l.t || '\u00a0'}</div>
        ))}
        {!booting && !busy && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span className="term-accent">me@os:~$</span>
            <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={onKey} ref={inputRef} autoFocus
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#e8e3db', fontFamily: 'DM Mono, monospace', fontSize: 12, flex: 1 }} />
            <span className="term-cursor" />
          </div>
        )}
        {busy && <div style={{ color: 'rgba(232,227,219,0.35)', fontStyle: 'italic' }}>working…</div>}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── APP: SIGNAL GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
const SIGNAL_SYSTEM = `You are the signal generator for $ME — a Solana memecoin built on radical self-accountability.
$ME's truth: "It starts with me." The trenches doesn't need saving from outside. It needs people who take ownership.

Write ONE tweet for $ME. Rules:
- Include $ME naturally somewhere
- No hashtags. No emojis. Lowercase is fine.
- Under 120 characters
- Calm conviction — not hype, not desperate
- Sounds like a person who figured something out, not a project shilling
- Should feel TRUE, not promotional

Output ONLY the tweet text. No quotes. No explanation.`;

function SignalApp() {
  const [signal, setSignal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true); setSignal(null); setCopied(false);
    if (!OR_KEY) { setSignal('Add VITE_OR_PROVIDER_ID to your .env to use Signal Gen.'); setLoading(false); return; }
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST', headers: { Authorization: `Bearer ${OR_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'google/gemini-2.5-flash-lite-preview-09-2025',
          messages: [{ role: 'system', content: SIGNAL_SYSTEM }, { role: 'user', content: 'Generate a $ME signal.' }],
          max_tokens: 80, temperature: 1.1 })
      });
      const d = await r.json();
      setSignal((d.choices?.[0]?.message?.content || '').replace(/^["']|["']$/g, '').trim());
    } catch { setSignal('Signal lost. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="app-inner">
      <div className="app-strip">
        <div><div className="app-strip-title">Signal Generator</div><div className="app-strip-sub">Generate conviction, not noise.</div></div>
      </div>

      <div className="scrollable" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 24, background: 'var(--cream)' }}>
        {!signal && !loading && (
          <div style={{ textAlign: 'center', opacity: 0.18 }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 96, lineHeight: 1, color: 'var(--ink)', letterSpacing: '0.05em' }}>$ME</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mist)', marginTop: 8 }}>Hit generate for the signal</div>
          </div>
        )}
        {loading && <div style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: 16, color: 'var(--mist)' }}>finding the signal…</div>}
        {signal && !loading && (
          <div style={{ width: '100%', maxWidth: 400 }}>
            <div className="signal-card" style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: 14 }}>— Signal —</div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, lineHeight: 1.65, color: 'var(--ink)', fontWeight: 500 }}>{signal}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => { copyText(signal); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(signal)}`, '_blank')}>
                Post on X
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop: '2px solid var(--ink)', padding: 12, background: 'var(--paper)', flexShrink: 0 }}>
        <button className="btn-primary" disabled={loading} onClick={generate}
          style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, letterSpacing: '0.15em', opacity: loading ? 0.5 : 1 }}>
          {loading ? 'Generating…' : signal ? 'Another Signal' : 'Generate Signal'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── APP: PFP CULT
// ─────────────────────────────────────────────────────────────────────────────
const PFP_STYLES = [
  { id: 'mirror', label: 'The Mirror', prompt: 'Transform this person into a bold editorial character holding a mirror reflecting their true self. High contrast graphic novel illustration. Dark background, editorial ink style. Face prominent and recognizable.' },
  { id: 'accountable', label: 'The Accountable', prompt: 'Redraw as a determined graphic character with strong posture. Gritty urban art style, dark moody background, high contrast. They look like someone who has made a decision to change. PFP square format.' },
  { id: 'trenches', label: 'The Trenches', prompt: 'Battle-worn but standing. Crypto degen who survived everything. Dark noir graphic novel style, detailed linework. Resolute expression. Wearing a hoodie with "$ME" on it. Face-forward PFP.' },
  { id: 'reborn', label: 'Reborn', prompt: 'Rebirth illustration — light breaking through. Clean vector art, dark background. Luminous energy around the silhouette. Breakthrough moment energy. Square PFP format, face centered.' },
  { id: 'signal', label: 'The Signal', prompt: 'Calm figure amid chaos — they have figured it out. Bold contrast illustration. Sharp minimal style. Still while everything else moves. Square PFP format.' },
  { id: 'last', label: 'Last Standing', prompt: 'Last survivor. Strong silhouette, epic graphic art. Dark moody palette with single strong light source. They refused to quit. Powerful PFP square format.' },
];

function PfpCultApp() {
  const [uploaded, setUploaded] = useState(null);
  const [b64, setB64] = useState(null);
  const [style, setStyle] = useState(PFP_STYLES[0]);
  const [result, setResult] = useState(null);
  const [forging, setForging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState(null);
  const fileRef = useRef(null);

  const onFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onloadend = () => { setUploaded(reader.result); setB64(reader.result.split(',')[1]); setResult(null); setErr(null); };
    reader.readAsDataURL(f);
  };

  const forge = async () => {
    if (!b64 || forging) return;
    if (!GEM_KEY) { setErr('Add VITE_APP_GEMINI to your .env file.'); return; }
    setForging(true); setResult(null); setProgress(0); setErr(null);
    const t = setInterval(() => setProgress(p => p < 90 ? p + Math.random() * 7 : p), 700);
    try {
      const prompt = `${style.prompt}\n\nIMPORTANT: Keep the subject recognizable as the same person. Square PFP format, face prominent and centered. Incorporate subtle $ME branding somewhere. High quality illustration.`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEM_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: b64 } }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } })
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const d = await res.json();
      const img = d.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (img) { setTimeout(() => { setResult(`data:image/png;base64,${img}`); setProgress(100); setForging(false); }, 300); }
      else throw new Error('No image returned');
    } catch (e) { setErr(e.message); setForging(false); }
    finally { clearInterval(t); }
  };

  return (
    <div className="app-inner">
      <div className="app-strip">
        <div><div className="app-strip-title">PFP Cult</div><div className="app-strip-sub">Become the character.</div></div>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--mist)' }}>Upload → Style → Forge</span>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel */}
        <div style={{ width: 240, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--paper2)', overflow: 'hidden', flexShrink: 0 }}>
          {/* Upload */}
          <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: 8 }}>Your Photo</div>
            <div onClick={() => fileRef.current?.click()}
              style={{ aspectRatio: '1', border: `1.5px dashed ${uploaded ? 'var(--ink)' : 'var(--border2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: 'white', transition: 'all 0.15s' }}>
              {uploaded
                ? <img src={uploaded} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ textAlign: 'center', padding: 16 }}><div style={{ fontSize: 24, marginBottom: 6 }}>📸</div><div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mist)' }}>Click to upload</div></div>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
          </div>

          {/* Styles */}
          <div style={{ flex: 1, padding: 12, overflow: 'auto' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: 8 }}>Choose Your Arc</div>
            {PFP_STYLES.map(s => (
              <button key={s.id} onClick={() => setStyle(s)} className={`pfp-style-btn ${style.id === s.id ? 'selected' : ''}`}>{s.label}</button>
            ))}
          </div>

          {/* Forge btn */}
          <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
            <button className="btn-primary" onClick={forge} disabled={!b64 || forging} style={{ width: '100%', justifyContent: 'center', opacity: !b64 || forging ? 0.4 : 1 }}>
              {forging ? `Forging ${Math.round(progress)}%…` : '⚡ Forge ME'}
            </button>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', position: 'relative', overflow: 'hidden' }}>
          {forging && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 160, height: 160, border: '1.5px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: 'white' }}>
                <div style={{ fontSize: 40 }}>⚡</div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3, background: 'var(--ink)', transition: 'width 0.5s', width: `${progress}%` }} />
              </div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--mist)' }}>Transforming you…</div>
            </div>
          )}
          {result && !forging && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 300, padding: 20 }}>
              <img src={result} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', border: '2px solid var(--ink)', boxShadow: '4px 4px 0 var(--ink)', display: 'block' }} />
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => { const a = document.createElement('a'); a.href = result; a.download = `ME_PFP_${Date.now()}.png`; a.click(); }}>
                  Download
                </button>
                <button className="btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setResult(null); setProgress(0); }}>Again</button>
              </div>
            </div>
          )}
          {!forging && !result && (
            <div style={{ textAlign: 'center', opacity: 0.15 }}>
              <div style={{ fontSize: 48 }}>📸</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink)', marginTop: 8 }}>Your transformation awaits</div>
            </div>
          )}
          {err && (
            <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, padding: '10px 14px', border: '1px solid var(--red)', background: 'rgba(192,57,43,0.05)', fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{err}</span>
              <button onClick={() => setErr(null)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}>✕</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── APP: THE COMMONS (TROLLBOX)
// ─────────────────────────────────────────────────────────────────────────────
function CommonsApp({ dexData, wallet }) {
  const [user, setUser] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [pending, setPending] = useState([]);
  const [input, setInput] = useState('');
  const [username, setUsername] = useState('');
  const [setup, setSetup] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [copiedCA, setCopiedCA] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const isInit = useRef(true);

  const combined = useMemo(() => {
    const all = [...msgs, ...pending].sort((a, b) => (a._ts || 0) - (b._ts || 0));
    return all.slice(-100);
  }, [msgs, pending]);

  useEffect(() => { signInAnonymously(auth).then(r => setUser(r.user)).catch(() => {}); }, []);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', APP_ID, 'public', 'data', 'trollbox_messages');
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data(), _ts: d.data().timestamp?.toDate?.()?.getTime() || Date.now() }));
      setMsgs(data.sort((a, b) => a._ts - b._ts));
      setPending(prev => prev.filter(pm => !data.some(m => m.text === pm.text && m.user === pm.user)));
      isInit.current = false;
    });
  }, [user]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (near) el.scrollTop = el.scrollHeight;
  }, [combined]);

  const init = () => {
    if (username.trim().length < 2) return;
    localStorage.setItem('me_commons_name', username.trim().toUpperCase());
    setSetup(true);
  };

  useEffect(() => {
    const saved = localStorage.getItem('me_commons_name');
    if (saved) { setUsername(saved); setSetup(true); }
  }, []);

  const send = async () => {
    if (!input.trim() || cooldown > 0 || !user) return;
    const txt = input.trim().slice(0, 280);
    const tempId = 'temp_' + Date.now();
    setPending(p => [...p, { id: tempId, text: txt, user: username, _ts: Date.now(), pending: true }]);
    setInput(''); setCooldown(2);
    const iv = setInterval(() => setCooldown(c => { if (c <= 1) { clearInterval(iv); return 0; } return c - 1; }), 1000);
    try {
      await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'trollbox_messages'), {
        text: txt, user: username, uid: user.uid, timestamp: serverTimestamp()
      });
    } catch { setPending(p => p.filter(m => m.id !== tempId)); }
  };

  if (!setup) return (
    <div className="app-inner" style={{ background: 'var(--cream)' }}>
      <div className="app-strip"><div><div className="app-strip-title">The Commons</div><div className="app-strip-sub">Choose your name.</div></div></div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: 15, color: 'var(--ink)', textAlign: 'center', maxWidth: 280 }}>Everyone who posts here is accountable. Choose a name you'll stand behind.</div>
        <input className="me-input" value={username} onChange={e => setUsername(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && init()} placeholder="YOUR NAME" style={{ maxWidth: 240, textAlign: 'center', fontSize: 14, fontWeight: 600, letterSpacing: '0.15em' }} />
        <button className="btn-primary" onClick={init} disabled={username.trim().length < 2}>Enter the Commons</button>
      </div>
    </div>
  );

  return (
    <div className="app-inner">
      <div style={{ background: 'var(--ink)', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(240,235,227,0.6)' }}>The Commons — Live</span>
        </div>
        <button onClick={() => { copyText(CA_ADDRESS); setCopiedCA(true); setTimeout(() => setCopiedCA(false), 2000); }}
          style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: copiedCA ? '#4ade80' : 'rgba(240,235,227,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>
          {copiedCA ? '✓ Copied' : 'CA'}
        </button>
      </div>

      <div ref={scrollRef} className="scrollable" style={{ flex: 1, background: 'white' }}>
        {combined.map((m, i) => {
          const isMe = m.uid === user?.uid || m.user === username;
          return (
            <div key={m.id || i} className={`commons-msg ${isMe ? 'me' : ''}`} style={{ opacity: m.pending ? 0.5 : 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                <div className="commons-name">{m.user}</div>
                <div className={`commons-bubble ${isMe ? 'me' : 'them'}`}>{m.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '1.5px solid var(--ink)', display: 'flex', background: 'white', flexShrink: 0 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={cooldown > 0 ? `Wait ${cooldown}s…` : 'Say something accountable…'}
          style={{ flex: 1, padding: '12px 14px', fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, border: 'none', outline: 'none', color: 'var(--ink)' }} />
        <button onClick={send} disabled={!input.trim() || cooldown > 0}
          style={{ padding: '12px 18px', background: input.trim() && !cooldown ? 'var(--ink)' : 'transparent', color: input.trim() && !cooldown ? 'var(--paper)' : 'var(--faint)', border: 'none', borderLeft: '1.5px solid var(--ink)', fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}>
          {cooldown > 0 ? cooldown : 'Post'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── APP: MEME VAULT
// ─────────────────────────────────────────────────────────────────────────────
function MemesApp() {
  const [selected, setSelected] = useState(null);
  const images = Object.values(ASSETS.memes);
  const keys = Object.keys(ASSETS.memes);
  const sel = selected !== null;

  return (
    <div className="app-inner">
      <div className="app-strip">
        <div><div className="app-strip-title">Meme Vault</div><div className="app-strip-sub">{images.length} artifacts</div></div>
        {sel && <button className="btn-outline" style={{ padding: '4px 10px', fontSize: 9 }} onClick={() => setSelected(null)}>← Back</button>}
      </div>

      {sel ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#111', overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <img src={images[selected]} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', border: '1px solid rgba(240,235,227,0.1)' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid rgba(240,235,227,0.1)', flexShrink: 0 }}>
            <button onClick={() => setSelected(s => Math.max(0, s - 1))} disabled={selected === 0}
              style={{ flex: 1, padding: '8px', background: 'rgba(240,235,227,0.08)', border: '1px solid rgba(240,235,227,0.15)', color: 'var(--paper)', fontFamily: 'DM Mono, monospace', fontSize: 10, cursor: 'pointer', opacity: selected === 0 ? 0.3 : 1 }}>← Prev</button>
            <button onClick={() => { const a = document.createElement('a'); a.href = images[selected]; a.download = `${keys[selected]}.jpg`; a.click(); }}
              style={{ flex: 1, padding: '8px', background: 'rgba(240,235,227,0.08)', border: '1px solid rgba(240,235,227,0.15)', color: 'var(--paper)', fontFamily: 'DM Mono, monospace', fontSize: 10, cursor: 'pointer' }}>Save</button>
            <button onClick={() => setSelected(s => Math.min(images.length - 1, s + 1))} disabled={selected === images.length - 1}
              style={{ flex: 1, padding: '8px', background: 'rgba(240,235,227,0.08)', border: '1px solid rgba(240,235,227,0.15)', color: 'var(--paper)', fontFamily: 'DM Mono, monospace', fontSize: 10, cursor: 'pointer', opacity: selected === images.length - 1 ? 0.3 : 1 }}>Next →</button>
          </div>
        </div>
      ) : (
        <div className="meme-grid scrollable">
          {images.map((src, i) => (
            <div key={i} className="meme-thumb" onClick={() => setSelected(i)}>
              <img src={src} alt={keys[i]} loading="lazy" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── APP: TUNE ME
// ─────────────────────────────────────────────────────────────────────────────
function TunesApp() {
  const [playing, setPlaying] = useState(false);
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [vol, setVol] = useState(0.75);
  const audioRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = vol;
    audioRef.current.onended = () => setIdx(i => (i + 1) % PLAYLIST.length);
    audioRef.current.onloadedmetadata = () => setDuration(audioRef.current.duration || 0);
    return () => { audioRef.current?.pause(); cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.src = PLAYLIST[idx].file;
    audioRef.current.load();
    if (playing) audioRef.current.play().catch(() => {});
  }, [idx]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = vol; }, [vol]);

  useEffect(() => {
    const tick = () => { if (audioRef.current) setProgress(audioRef.current.currentTime || 0); rafRef.current = requestAnimationFrame(tick); };
    if (playing) { audioRef.current?.play().catch(() => {}); rafRef.current = requestAnimationFrame(tick); }
    else { audioRef.current?.pause(); cancelAnimationFrame(rafRef.current); }
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing]);

  const fmt = s => { const m = Math.floor((s || 0) / 60), sec = Math.floor((s || 0) % 60); return `${m}:${sec < 10 ? '0' : ''}${sec}`; };

  return (
    <div className="app-inner tunes-body">
      {/* Now playing */}
      <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid rgba(232,227,219,0.1)', background: '#0f0f0f', flexShrink: 0 }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,227,219,0.3)', marginBottom: 6 }}>Now Playing</div>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--paper)', marginBottom: 2 }}>{PLAYLIST[idx].title}</div>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'rgba(232,227,219,0.4)' }}>{PLAYLIST[idx].artist}</div>

        {/* Progress bar */}
        <div style={{ margin: '14px 0 4px', height: 2, background: 'rgba(232,227,219,0.1)', cursor: 'pointer', position: 'relative' }}
          onClick={e => { if (!audioRef.current || !duration) return; const r = e.currentTarget.getBoundingClientRect(); const pct = (e.clientX - r.left) / r.width; audioRef.current.currentTime = pct * duration; }}>
          <div style={{ height: '100%', background: 'var(--paper)', width: duration ? `${(progress / duration) * 100}%` : '0%', transition: 'width 0.5s linear' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Mono, monospace', fontSize: 8, color: 'rgba(232,227,219,0.3)' }}>
          <span>{fmt(progress)}</span><span>{fmt(duration)}</span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: '14px 0 10px' }}>
          <button onClick={() => setIdx(i => (i - 1 + PLAYLIST.length) % PLAYLIST.length)}
            style={{ background: 'none', border: 'none', color: 'rgba(232,227,219,0.5)', fontSize: 18, cursor: 'pointer' }}>⏮</button>
          <button onClick={() => setPlaying(p => !p)}
            style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--paper)', border: 'none', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {playing ? '⏸' : '▶'}
          </button>
          <button onClick={() => setIdx(i => (i + 1) % PLAYLIST.length)}
            style={{ background: 'none', border: 'none', color: 'rgba(232,227,219,0.5)', fontSize: 18, cursor: 'pointer' }}>⏭</button>
        </div>

        {/* Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'rgba(232,227,219,0.3)', fontSize: 12 }}>🔉</span>
          <input type="range" min={0} max={1} step={0.01} value={vol} onChange={e => setVol(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--paper)', height: 2 }} />
          <span style={{ color: 'rgba(232,227,219,0.3)', fontSize: 12 }}>🔊</span>
        </div>
      </div>

      {/* Playlist */}
      <div className="scrollable" style={{ flex: 1 }}>
        {PLAYLIST.map((t, i) => (
          <div key={i} className={`tunes-track ${i === idx ? 'playing' : ''}`} onClick={() => { setIdx(i); setPlaying(true); }}>
            <div>
              <div style={{ fontWeight: i === idx ? 600 : 400 }}>{t.title}</div>
              <div style={{ fontSize: 9, opacity: 0.5, marginTop: 1 }}>{t.artist}</div>
            </div>
            <span style={{ opacity: 0.5 }}>{t.duration}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── APP: WRITE ME (NOTEPAD)
// ─────────────────────────────────────────────────────────────────────────────
function NotepadApp() {
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => { const s = localStorage.getItem('me_manifesto'); if (s) setContent(s); }, []);
  const onChange = e => { setContent(e.target.value); localStorage.setItem('me_manifesto', e.target.value); setSaved(true); setTimeout(() => setSaved(false), 1200); };
  return (
    <div className="app-inner">
      <div className="app-strip">
        <div><div className="app-strip-title">Write ME</div><div className="app-strip-sub">Your manifesto.</div></div>
        <div style={{ display: 'flex', gap: 6 }}>
          {saved && <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--green)' }}>Saved</span>}
          <button className="btn-outline" style={{ padding: '4px 10px', fontSize: 9 }} onClick={() => { if (!content.trim()) return; window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(content.slice(0, 280))}`, '_blank'); }}>Post ↗</button>
          <button className="btn-outline" style={{ padding: '4px 10px', fontSize: 9, color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => { if (window.confirm('Clear manifesto?')) { setContent(''); localStorage.removeItem('me_manifesto'); } }}>Clear</button>
        </div>
      </div>
      <textarea className="notepad-area" value={content} onChange={onChange}
        placeholder={'Write your manifesto here.\n\nThe trenches doesn\'t need a hero.\nIt needs you to be different.\n\nChange starts with $ME.'} />
      <div style={{ borderTop: '1px solid var(--border)', padding: '5px 20px', background: 'var(--paper2)', flexShrink: 0, display: 'flex', gap: 20 }}>
        {[['Chars', content.length], ['Words', content.trim() ? content.trim().split(/\s+/).length : 0]].map(([l, v]) => (
          <span key={l} style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mist)' }}>{l}: {v}</span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── APP: PAINT ME (simplified meme builder)
// ─────────────────────────────────────────────────────────────────────────────
function PaintApp() {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('brush');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(6);
  const [drawing, setDrawing] = useState(false);
  const lastRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  const getPos = (e) => {
    const c = canvasRef.current; if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - r.left) * (c.width / r.width), y: (src.clientY - r.top) * (c.height / r.height) };
  };

  const startDraw = (e) => { setDrawing(true); lastRef.current = getPos(e); };

  const draw = (e) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d'); if (!ctx) return;
    const pos = getPos(e);
    if (tool === 'eraser') { ctx.globalCompositeOperation = 'destination-out'; ctx.strokeStyle = 'rgba(255,255,255,1)'; }
    else { ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = color; }
    ctx.lineWidth = tool === 'eraser' ? size * 3 : size;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastRef.current = pos;
  };

  const addText = () => {
    const txt = window.prompt('Enter text:'); if (!txt) return;
    const ctx = canvasRef.current?.getContext('2d'); if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = color; ctx.font = `bold ${size * 6}px Impact, sans-serif`;
    ctx.fillText(txt, 20, 80);
  };

  const download = () => {
    const a = document.createElement('a'); a.href = canvasRef.current.toDataURL(); a.download = `ME_MEME_${Date.now()}.png`; a.click();
  };

  const COLORS = ['#000000','#ffffff','#c0392b','#e67e22','#f1c40f','#27ae60','#2980b9','#8e44ad','#555555','#bbb'];

  return (
    <div className="app-inner" style={{ background: 'var(--paper2)' }}>
      <div className="app-strip">
        <div><div className="app-strip-title">Paint ME</div><div className="app-strip-sub">Build the memes.</div></div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-outline" style={{ padding: '4px 10px', fontSize: 9 }} onClick={addText}>+ Text</button>
          <button className="btn-primary" style={{ padding: '4px 10px', fontSize: 9 }} onClick={download}>Save</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ width: 52, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 8, background: 'var(--paper)', overflowY: 'auto', flexShrink: 0 }}>
          {[['brush', '🖊'], ['eraser', '⬜'], ['fill', '🪣']].map(([t, icon]) => (
            <button key={t} className={`paint-tool-btn ${tool === t ? 'active' : ''}`} onClick={() => setTool(t)} title={t}>{icon}</button>
          ))}
          <div style={{ width: '100%', height: 1, background: 'var(--border)', margin: '4px 0' }} />
          {COLORS.map(c => (
            <div key={c} onClick={() => setColor(c)}
              style={{ width: 26, height: 26, background: c, border: `2px solid ${color === c ? 'var(--ink)' : 'var(--border)'}`, cursor: 'pointer', flexShrink: 0, boxSizing: 'border-box' }} />
          ))}
          <div style={{ width: '100%', height: 1, background: 'var(--border)', margin: '4px 0' }} />
          <input type="range" min={2} max={40} value={size} onChange={e => setSize(+e.target.value)}
            style={{ writingMode: 'vertical-lr', direction: 'rtl', height: 80, accentColor: 'var(--ink)' }} />
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, color: 'var(--mist)' }}>{size}px</div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', background: '#ccc', padding: 12 }}>
          <canvas ref={canvasRef} width={600} height={450}
            className="stack-canvas"
            style={{ border: '1px solid #999', cursor: tool === 'eraser' ? 'cell' : 'crosshair', display: 'block', maxWidth: '100%' }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => setDrawing(false)} onMouseLeave={() => setDrawing(false)}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={() => setDrawing(false)} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── APP: STACK ME (stacking game)
// ─────────────────────────────────────────────────────────────────────────────
const GW = 320, GH = 550, BH = 34, BASE_W = 200;
const BIOMES = [
  { score: 0,  name: 'THE TRENCHES',    bg: '#0a0a0a', txt: '#e8e3db', accent: '#c0392b' },
  { score: 15, name: 'RISING',          bg: '#0d1117', txt: '#a8d5be', accent: '#27ae60' },
  { score: 35, name: 'CONVICTION',      bg: '#0f0a14', txt: '#c4b5fd', accent: '#8b5cf6' },
  { score: 60, name: 'ACCOUNTABILITY',  bg: '#0a0f0a', txt: '#bbf7d0', accent: '#4ade80' },
  { score: 100,name: 'CHANGE',          bg: '#130d00', txt: '#fde68a', accent: '#f59e0b' },
];

function StackApp() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const game = useRef({ state: 'menu', stack: [], current: null, debris: [], score: 0, camY: 0 });
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('me_stack_best') || '0'));
  const [gameState, setGameState] = useState('menu');
  const [biome, setBiome] = useState(BIOMES[0]);

  const spawnBlock = (prev, level) => {
    const left = Math.random() > 0.5;
    const speed = Math.min(4 + Math.pow(level, 0.55) * 0.5, 16);
    return { x: left ? -prev.w : GW, y: level * BH, w: prev.w, h: BH, dir: left ? 1 : -1, speed, color: `hsl(${200 + level * 12},60%,55%)` };
  };

  const startGame = () => {
    const base = { x: (GW - BASE_W) / 2, y: 0, w: BASE_W, h: BH, color: '#e8e3db' };
    game.current = { state: 'playing', stack: [base], current: spawnBlock(base, 1), debris: [], score: 0, camY: 0 };
    setScore(0); setGameState('playing'); setBiome(BIOMES[0]);
  };

  const place = useCallback(() => {
    const g = game.current; if (g.state !== 'playing' || !g.current) return;
    const prev = g.stack[g.stack.length - 1];
    const dist = g.current.x - prev.x;
    const absDist = Math.abs(dist);
    if (absDist >= g.current.w) { g.state = 'over'; setGameState('over'); return; }
    let nx = g.current.x, nw = g.current.w;
    if (absDist <= 7) { nx = prev.x; nw = prev.w; }
    else {
      nw = g.current.w - absDist;
      nx = dist > 0 ? g.current.x : prev.x;
      const dx = dist > 0 ? g.current.x + nw : g.current.x;
      g.debris.push({ x: dx, y: g.current.y, w: absDist, h: BH, vx: dist > 0 ? 6 : -6, vy: -4, life: 1, color: g.current.color });
    }
    const placed = { x: nx, y: g.current.y, w: nw, h: BH, color: g.current.color };
    g.stack.push(placed); g.score++;
    const newBest = Math.max(g.score, best);
    if (g.score > best) { setBest(newBest); localStorage.setItem('me_stack_best', newBest); }
    setScore(g.score);
    const b = BIOMES.slice().reverse().find(b => g.score >= b.score) || BIOMES[0];
    setBiome(b);
    g.camY = Math.max(0, g.stack.length * BH - 160);
    g.current = spawnBlock(placed, g.stack.length);
  }, [best]);

  useEffect(() => {
    const onKey = (e) => { if (e.code === 'Space') { e.preventDefault(); if (gameState === 'playing') place(); else startGame(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState, place]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = () => {
      const g = game.current;
      ctx.fillStyle = biome.bg; ctx.fillRect(0, 0, GW, GH);

      if (g.state === 'playing') {
        if (g.current) { g.current.x += g.current.speed * g.current.dir; if (g.current.x > GW + 60) g.current.dir = -1; if (g.current.x < -60 - g.current.w) g.current.dir = 1; }
        g.camY += (Math.max(0, g.stack.length * BH - 160) - g.camY) * 0.08;
      }

      g.debris.forEach(d => { d.x += d.vx; d.vy += 0.4; d.y += d.vy; d.life -= 0.02; });
      g.debris = g.debris.filter(d => d.life > 0);

      ctx.save(); ctx.translate(0, GH - g.camY);
      g.stack.forEach(b => {
        ctx.fillStyle = b.color; ctx.fillRect(b.x, -b.y - b.h, b.w, b.h);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; ctx.strokeRect(b.x, -b.y - b.h, b.w, b.h);
      });
      if (g.current && g.state === 'playing') { ctx.fillStyle = g.current.color; ctx.fillRect(g.current.x, -g.current.y - g.current.h, g.current.w, g.current.h); }
      g.debris.forEach(d => { ctx.globalAlpha = d.life; ctx.fillStyle = d.color; ctx.fillRect(d.x, d.y, d.w, d.h); ctx.globalAlpha = 1; });
      ctx.restore();

      // Score
      ctx.fillStyle = biome.txt; ctx.font = 'bold 52px Bebas Neue, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(g.score || 0), GW / 2, 72);
      ctx.font = 'bold 11px DM Mono, monospace'; ctx.fillStyle = biome.accent; ctx.fillText(biome.name, GW / 2, 92);
      ctx.font = 'bold 10px DM Mono, monospace'; ctx.fillStyle = 'rgba(232,227,219,0.3)'; ctx.textAlign = 'right'; ctx.fillText(`BEST: ${best}`, GW - 12, 22);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [biome, best]);

  const tap = (e) => { e.preventDefault(); if (gameState === 'playing') place(); else startGame(); };

  return (
    <div className="app-inner" style={{ background: biome.bg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid rgba(232,227,219,0.1)', flexShrink: 0 }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(232,227,219,0.35)' }}>Stack ME</span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'rgba(232,227,219,0.25)' }}>SPACE / TAP</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={GW} height={GH} className="stack-canvas"
          style={{ cursor: 'pointer', maxWidth: '100%', maxHeight: '100%', touchAction: 'none' }}
          onPointerDown={tap} />
        {gameState === 'menu' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,10,10,0.85)' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 52, color: 'var(--paper)', letterSpacing: '0.1em', lineHeight: 1 }}>Stack ME</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,235,227,0.4)', margin: '8px 0 28px' }}>Tap or press space</div>
            <button onClick={startGame} style={{ padding: '12px 32px', background: 'var(--paper)', color: 'var(--ink)', border: 'none', fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, letterSpacing: '0.1em', cursor: 'pointer' }}>Play</button>
          </div>
        )}
        {gameState === 'over' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,10,10,0.9)' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 44, color: '#c0392b', letterSpacing: '0.1em' }}>Rugged</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'rgba(240,235,227,0.5)', margin: '6px 0 4px' }}>Score: {score}</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'rgba(240,235,227,0.35)', marginBottom: 24 }}>Best: {best}</div>
            <button onClick={startGame} style={{ padding: '12px 32px', background: 'var(--paper)', color: 'var(--ink)', border: 'none', fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, letterSpacing: '0.1em', cursor: 'pointer' }}>Again</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── APP: WALLET
// ─────────────────────────────────────────────────────────────────────────────
function WalletApp({ wallet, solBalance, dexData, connect, connecting }) {
  const [copied, setCopied] = useState(false);
  const hasAccess = dexData.balance >= ACCESS_THRESHOLD;
  const pct = Math.min(100, (dexData.balance / ACCESS_THRESHOLD) * 100);

  return (
    <div className="app-inner">
      <div className="app-strip"><div><div className="app-strip-title">Wallet</div><div className="app-strip-sub">Your bag.</div></div></div>
      <div className="scrollable" style={{ flex: 1, background: 'var(--cream)' }}>
        <div className="wallet-stat">
          <div className="wallet-stat-label">SOL Balance</div>
          <div className="wallet-stat-value">{(solBalance || 0).toFixed(4)} <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--mist)' }}>SOL</span></div>
        </div>
        <div className="wallet-stat">
          <div className="wallet-stat-label">$ME Balance</div>
          <div className="wallet-stat-value">{(dexData.balance || 0).toLocaleString()} <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--mist)' }}>$ME</span></div>
          <div style={{ marginTop: 10, height: 3, background: 'var(--border)', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: 'var(--ink)', transition: 'width 1s' }} />
          </div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mist)', marginTop: 5 }}>{pct.toFixed(0)}% of 500k threshold</div>
        </div>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, border: `1.5px solid ${hasAccess ? 'var(--green)' : 'var(--mist)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{hasAccess ? '✓' : '🔒'}</div>
          <div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: hasAccess ? 'var(--green)' : 'var(--mist)' }}>{hasAccess ? 'VIP Unlocked' : 'Access Locked'}</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'var(--mist)', marginTop: 2 }}>{hasAccess ? 'Full access active.' : 'Hold 500k $ME to unlock everything.'}</div>
          </div>
        </div>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <div className="wallet-stat-label">$ME Price</div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginTop: 2 }}>{dexData.price}</div>
        </div>
        {wallet && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div className="wallet-stat-label" style={{ marginBottom: 6 }}>Connected Wallet</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'var(--ash)', wordBreak: 'break-all', lineHeight: 1.6 }}>{wallet}</div>
            <button onClick={() => { copyText(wallet); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ marginTop: 8, fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: copied ? 'var(--green)' : 'var(--mist)', background: 'none', border: 'none', cursor: 'pointer' }}>
              {copied ? '✓ Copied' : 'Copy address'}
            </button>
          </div>
        )}
        <div style={{ padding: 16 }}>
          <button onClick={connect} disabled={connecting} className={wallet ? 'btn-outline' : 'btn-primary'} style={{ width: '100%', justifyContent: 'center' }}>
            {connecting ? 'Connecting…' : wallet ? 'Disconnect' : 'Connect Phantom'}
          </button>
          {!wallet && (
            <button onClick={() => window.open(`https://jup.ag/swap/SOL-${CA_ADDRESS}`, '_blank')} className="btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              Buy $ME on Jupiter ↗
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── BOOT SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function BootScreen() {
  return (
    <div className="boot-screen">
      <div className="boot-logo">$ME</div>
      <div className="boot-sub">It starts with me</div>
      <div className="boot-bar-outer"><div className="boot-bar-inner" /></div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── START MENU
// ─────────────────────────────────────────────────────────────────────────────
function StartMenu({ open, onClose, onOpen, dexData, wallet, connect, connecting }) {
  const [caCopied, setCaCopied] = useState(false);
  if (!open) return null;
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 8998 }} onClick={onClose} />
      <div className="start-menu">
        <div className="start-header">
          <div className="start-logo">$ME</div>
          <div className="start-sub">It starts with me</div>
        </div>
        <div className="start-section-label">Apps</div>
        {APPS.map(app => (
          <button key={app.id} className="start-item" onClick={() => { onOpen(app.id); onClose(); }}>
            <span className="start-item-icon">{app.icon}</span>
            <span>{app.label}</span>
          </button>
        ))}
        <div className="start-section-label">Socials</div>
        <button className="start-item" onClick={() => window.open(SOCIALS.twitter, '_blank')}>
          <span className="start-item-icon">🐦</span><span>Twitter / X</span>
        </button>
        <div className="start-ca-box" onClick={() => { copyText(CA_ADDRESS); setCaCopied(true); setTimeout(() => setCaCopied(false), 2000); }}>
          <div className="start-ca-label">{caCopied ? '✓ Copied!' : 'Contract Address — click to copy'}</div>
          <div className="start-ca-addr">{CA_ADDRESS}</div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── MAIN OS
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [booted, setBooted] = useState(false);
  const [windows, setWindows] = useState([]);
  const [maxZ, setMaxZ] = useState(100);
  const [activeId, setActiveId] = useState(null);
  const [startOpen, setStartOpen] = useState(false);
  const [caCopied, setCaCopied] = useState(false);

  const { wallet, connect, connecting, solBalance } = useWallet();
  const dexData = useDexData(wallet);

  // Inject styles
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  // Auth
  useEffect(() => {
    signInAnonymously(auth).catch(() => {});
    const t = setTimeout(() => setBooted(true), 2400);
    return () => clearTimeout(t);
  }, []);

  const setPos = useCallback((id, x, y) => {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, x, y } : w));
  }, []);

  const openApp = useCallback((type) => {
    // If already open and not minimized, focus it
    const existing = windows.find(w => w.type === type);
    if (existing) {
      if (existing.isMin) {
        setWindows(ws => ws.map(w => w.id === existing.id ? { ...w, isMin: false } : w));
      }
      setActiveId(existing.id);
      setWindows(ws => ws.map(w => w.id === existing.id ? { ...w, z: maxZ + 1 } : w));
      setMaxZ(z => z + 1);
      return;
    }
    const meta = APPS.find(a => a.id === type);
    const isMob = window.innerWidth < 768;
    const id = genId();
    const offset = windows.length % 8;
    const newWin = {
      id, type,
      x: isMob ? 0 : Math.min(80 + offset * 28, window.innerWidth - (meta?.w || 480) - 40),
      y: isMob ? 0 : Math.min(40 + offset * 22, window.innerHeight - (meta?.h || 400) - 80),
      w: isMob ? window.innerWidth : (meta?.w || 480),
      h: isMob ? window.innerHeight - 44 : (meta?.h || 400),
      z: maxZ + 1,
      isMax: false, isMin: false,
      _setPos: setPos,
    };
    setWindows(ws => [...ws, newWin]);
    setActiveId(id);
    setMaxZ(z => z + 1);
    setStartOpen(false);
  }, [windows, maxZ, setPos]);

  const closeWin = useCallback((id) => { setWindows(ws => ws.filter(w => w.id !== id)); if (activeId === id) setActiveId(null); }, [activeId]);
  const minWin = useCallback((id) => { setWindows(ws => ws.map(w => w.id === id ? { ...w, isMin: true } : w)); if (activeId === id) setActiveId(null); }, [activeId]);
  const maxWin = useCallback((id) => { setWindows(ws => ws.map(w => w.id === id ? { ...w, isMax: !w.isMax } : w)); }, []);
  const focusWin = useCallback((id) => {
    setActiveId(id);
    setWindows(ws => ws.map(w => w.id === id ? { ...w, z: maxZ + 1, isMin: false } : w));
    setMaxZ(z => z + 1);
  }, [maxZ]);

  const handleTaskbar = useCallback((id) => {
    const w = windows.find(w => w.id === id); if (!w) return;
    if (w.isMin) focusWin(id);
    else if (activeId === id) minWin(id);
    else focusWin(id);
  }, [windows, activeId, focusWin, minWin]);

  const renderApp = (win) => {
    const props = { dexData, wallet, solBalance };
    switch (win.type) {
      case 'mirror':   return <MirrorApp {...props} />;
      case 'pfpcult':  return <PfpCultApp />;
      case 'terminal': return <TerminalApp {...props} />;
      case 'signal':   return <SignalApp />;
      case 'commons':  return <CommonsApp {...props} />;
      case 'stack':    return <StackApp />;
      case 'paint':    return <PaintApp />;
      case 'memes':    return <MemesApp />;
      case 'tunes':    return <TunesApp />;
      case 'notepad':  return <NotepadApp />;
      case 'wallet':   return <WalletApp wallet={wallet} solBalance={solBalance} dexData={dexData} connect={connect} connecting={connecting} />;
      default:         return <div style={{ padding: 20, color: 'var(--mist)' }}>App not found</div>;
    }
  };

  if (!booted) return <BootScreen />;

  return (
    <div className="os-desktop">
      {/* Wallpaper layers */}
      <div className="os-wallpaper" />
      <div className="os-wallpaper-overlay" />
      <div className="os-grid" />
      <div className="os-watermark">$ME</div>

      {/* Desktop icons */}
      <div className="icon-grid">
        {APPS.map(app => (
          <div key={app.id} className="desk-icon" onClick={() => openApp(app.id)}>
            <div className="desk-icon-box">{app.icon}</div>
            <div className="desk-icon-label">{app.label}</div>
            {app.alert && <div style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: '#c0392b', border: '1px solid #111' }} />}
          </div>
        ))}
      </div>

      {/* Price ticker — top right */}
      <div style={{ position: 'fixed', top: 12, right: 16, zIndex: 50, fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.12em', color: 'rgba(240,235,227,0.35)', display: 'flex', gap: 16, alignItems: 'center' }}>
        <span>$ME {dexData.price}</span>
        {dexData.balance > 0 && <span style={{ color: 'rgba(240,235,227,0.5)' }}>{dexData.balance.toLocaleString()} held</span>}
      </div>

      {/* Windows */}
      {windows.filter(w => !w.isMin).map(win => (
        <WindowFrame key={win.id} win={win} isActive={win.id === activeId}
          onClose={() => closeWin(win.id)} onMinimize={() => minWin(win.id)}
          onMaximize={() => maxWin(win.id)} onFocus={() => focusWin(win.id)}>
          {renderApp(win)}
        </WindowFrame>
      ))}

      {/* Start menu */}
      <StartMenu open={startOpen} onClose={() => setStartOpen(false)} onOpen={openApp}
        dexData={dexData} wallet={wallet} connect={connect} connecting={connecting} />

      {/* Taskbar */}
      <div className="taskbar">
        <button className={`taskbar-start ${startOpen ? 'open' : ''}`} onClick={() => setStartOpen(s => !s)}>
          $ME
        </button>

        <div className="taskbar-wins">
          {windows.map(win => {
            const meta = APPS.find(a => a.id === win.type);
            return (
              <button key={win.id} className={`taskbar-win-btn ${win.id === activeId && !win.isMin ? 'active' : ''}`}
                onClick={() => handleTaskbar(win.id)}>
                {meta?.icon} {meta?.label}
              </button>
            );
          })}
        </div>

        <div className="taskbar-tray">
          <button className={`tray-btn ${caCopied ? 'copied' : ''}`}
            onClick={() => { copyText(CA_ADDRESS); setCaCopied(true); setTimeout(() => setCaCopied(false), 2000); }}>
            {caCopied ? '✓ CA Copied' : 'Copy CA'}
          </button>
          <button className={`tray-btn ${wallet ? 'connected' : ''}`} onClick={connect} disabled={connecting}>
            {connecting ? '…' : wallet ? `${wallet.slice(0, 4)}..${wallet.slice(-3)}` : 'Connect'}
          </button>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'rgba(240,235,227,0.2)', marginLeft: 4 }}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}
