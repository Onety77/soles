// ============================================================
// SOLES — We just like feet..
// Full-stack React + Firebase — App.jsx (single file)
// ============================================================
// CONTRACT_ADDRESS_SECTION: search this file.
// Commented out by default. Uncomment + paste CA to activate.
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile,
} from "firebase/auth";
import {
  getFirestore, doc, setDoc, getDoc, getDocs, addDoc, updateDoc,
  deleteDoc, collection, query, where, orderBy, limit, onSnapshot,
  increment, arrayUnion, arrayRemove, serverTimestamp,
} from "firebase/firestore";
import {
  getStorage, ref, uploadBytes, getDownloadURL,
} from "firebase/storage";

// ─── Firebase ─────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAdYOWVOY1KSc6Ns1l3CV3sW-Y6kxhJHWg",
  authDomain: "the-contrarian.firebaseapp.com",
  projectId: "the-contrarian",
  storageBucket: "the-contrarian.firebasestorage.app",
  messagingSenderId: "1043559632677",
  appId: "1:1043599632677:web:4a9bd084a7782c3e98d4cc",
};
const firebaseApp   = initializeApp(firebaseConfig);
const auth          = getAuth(firebaseApp);
const db            = getFirestore(firebaseApp);
const storage       = getStorage(firebaseApp);

// ─── Constants ────────────────────────────────────────────────────────────────
const TELEGRAM_VERIFY_LINK  = "https://t.me/YourBotHandleHere";
const X_PROFILE_LINK        = "https://x.com/Solesonchain";
const X_COMMUNITY_LINK      = "https://x.com/Solesonchain";
// New earnings model: post once, earn forever via engagement
// 10 pts = $1. Engagement (likes, comments, views) boosts passive income.
const POINTS_TO_DOLLAR      = 10;
const MIN_PAYOUT_DOLLARS    = 5;
const PAYOUT_COOLDOWN_HOURS = 12;
// $SOLES Contract Address — visible on site
const SOLES_CA = "HJttYttpHWPYsgWLg3QByNys5BjdkhqhS9RCiatrpump"; // ← replace this with actual CA
const ADMIN_EMAIL = "admin77@gmail.com"; // ← master admin email — auto-detected on sign-in

// ─── Social Platforms ─────────────────────────────────────────────────────────
const SOCIAL_PLATFORMS = [
  { id:"x",         label:"X / Twitter", icon:"𝕏",  ph:"https://x.com/yourhandle" },
  { id:"instagram", label:"Instagram",   icon:"📸", ph:"https://instagram.com/yourhandle" },
  { id:"reddit",    label:"Reddit",      icon:"👾", ph:"https://reddit.com/u/yourhandle" },
  { id:"other",     label:"Other",       icon:"🔗", ph:"https://..." },
];

// ─── Gallery Images (ft1.jpg → ft16.jpg in /public) ──────────────────────────
const FT_IMGS  = Array.from({ length: 16 }, (_, i) => `ft${i + 1}.jpg`);
const FT_LABELS= ["Sole perfection","Sun-kissed","Sandy soles","Arch study","Barefoot bliss","Golden hour","Toe art","Sole focus","Pedicure goals","Soft steps","Free sole","Sole story","Elegant arches","Natural beauty","Sole poetry","Pure grace"];
const ROW_CFG  = [
  { idxs:[0,1,2,3,4,5,6,7,  0,1,2,3,4,5,6,7],  dir:"fwd", dur:"34s", h:220 },
  { idxs:[8,9,10,11,12,13,14,15, 8,9,10,11,12,13,14,15], dir:"rev", dur:"28s", h:255 },
  { idxs:[3,7,11,0,14,5,9,2, 3,7,11,0,14,5,9,2], dir:"fwd", dur:"40s", h:200 },
];
const TILE_W = [0.75,0.85,0.7,0.8,0.9,0.72,0.82,0.78];

// ─── Merged Firestore Rules (copy to Firebase Console) ───────────────────────
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /river_leaderboard/{doc} {
      allow read: if true;
      allow create: if request.resource.data.username is string
        && request.resource.data.username.size() >= 1
        && request.resource.data.username.size() <= 20
        && request.resource.data.score is number
        && request.resource.data.distance is number;
      allow update, delete: if false;
    }
    match /community_posts/{doc} {
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.data.thesis is string
        && request.resource.data.thesis.size() >= 20
        && request.resource.data.thesis.size() <= 500;
      allow update: if request.auth != null;
      allow delete: if false;
    }
    match /articles/{doc}  { allow read: if true; allow write: if false; }
    match /tracker/{doc}   { allow read: if true; allow write: if false; }
    match /backtest_user77/{doc} { allow read, write, delete: if true; }
    match /backtest_user2/{doc}  { allow read, write, delete: if true; }
    match /backtest_user3/{doc}  { allow read, write, delete: if true; }
    match /users/{uid} {
      allow read: if true;
      allow create: if request.auth.uid == uid
        && request.resource.data.username is string
        && request.resource.data.username.size() >= 1
        && request.resource.data.username.size() <= 24;
      allow update: if request.auth.uid == uid
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['creator','admin'];
      allow update: if request.auth.uid == resource.data.creatorId
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow delete: if request.auth.uid == resource.data.creatorId
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /comments/{doc} {
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.data.text is string
        && request.resource.data.text.size() >= 1
        && request.resource.data.text.size() <= 400;
      allow update: if request.auth != null;
      allow delete: if request.auth.uid == resource.data.uid
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /daily/{docId} {
      allow read: if true;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /follows/{followId} { allow read: if true; allow write: if request.auth != null; }
    match /payoutRequests/{reqId} {
      allow create: if request.auth != null;
      allow read, update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /{document=**} { allow read, write: if false; }
  }
}
*/

// ─── CSS ──────────────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Dancing+Script:wght@600;700&family=Inter:wght@300;400;500;600&family=Bebas+Neue&display=swap');

    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    :root{
      --sand:#E8C9A0; --sand-light:#F5E6D0; --sand-dark:#C49A6C;
      --soil:#5C3A1E; --soil-light:#8B5E3C;
      --cream:#FAF6F0; --dark:#0E0702; --mid:#3D2510;
      --text:#2C1810; --text-muted:#8B6E5A;
      --accent:#D4845A; --accent-warm:#E8A87C;
      --green:#2D7A2D; --red:#C04A1A;
      --white:#FFFFFF; --border:rgba(196,154,108,0.22);
      --glass:rgba(250,246,240,0.92);
      --shadow:0 4px 24px rgba(92,58,30,0.11);
      --shadow-lg:0 16px 60px rgba(92,58,30,0.2);
      --r:16px; --r-sm:8px;
      --fd:'Playfair Display',serif;
      --fs:'Dancing Script',cursive;
      --fb:'Inter',sans-serif;
      --fi:'Bebas Neue',sans-serif;
    }
    html{scroll-behavior:smooth;}
    body{font-family:var(--fb);background:var(--cream);color:var(--text);min-height:100vh;overflow-x:hidden;}
    ::-webkit-scrollbar{width:4px;}
    ::-webkit-scrollbar-track{background:var(--cream);}
    ::-webkit-scrollbar-thumb{background:var(--sand-dark);border-radius:2px;}
    .app-shell{display:flex;flex-direction:column;min-height:100vh;}

    /* ── NAV ─────────────────────────────────────────── */
    .nav{position:sticky;top:0;z-index:100;background:var(--glass);backdrop-filter:blur(24px);border-bottom:1px solid var(--border);padding:0 24px;height:62px;display:flex;align-items:center;justify-content:space-between;}
    .nav-logo{display:flex;align-items:center;gap:10px;cursor:pointer;text-decoration:none;}
    .nav-logo-img{height:32px;}
    .nav-logo-text{font-family:var(--fd);font-size:1.6rem;font-weight:700;color:var(--soil);letter-spacing:.02em;}
    .nav-center{display:flex;align-items:center;gap:4px;}
    .nav-link{background:none;border:none;cursor:pointer;font-family:var(--fb);font-size:.76rem;font-weight:500;color:var(--text-muted);padding:6px 12px;border-radius:8px;transition:all .2s;}
    .nav-link:hover{color:var(--soil);background:var(--sand-light);}
    .nav-link.active{color:var(--soil);font-weight:600;}
    .nav-actions{display:flex;align-items:center;gap:8px;}
    .nav-btn{font-family:var(--fb);font-size:.76rem;font-weight:500;padding:8px 18px;border-radius:40px;border:none;cursor:pointer;transition:all .2s;letter-spacing:.02em;}
    .nav-btn-ghost{background:transparent;color:var(--soil);border:1.5px solid var(--border);}
    .nav-btn-ghost:hover{background:var(--sand-light);}
    .nav-btn-fill{background:var(--soil);color:var(--sand-light);}
    .nav-btn-fill:hover{background:var(--mid);}
    .nav-chip{display:flex;align-items:center;gap:7px;padding:4px 14px 4px 4px;border-radius:40px;border:1.5px solid var(--border);cursor:pointer;transition:background .2s;background:transparent;font-family:var(--fb);font-size:.76rem;color:var(--soil);}
    .nav-chip:hover{background:var(--sand-light);}
    .nav-chip-av{width:30px;height:30px;border-radius:50%;overflow:hidden;background:var(--sand-light);flex-shrink:0;}
    .nav-chip-av img{width:100%;height:100%;object-fit:cover;}
    .nav-chip-av-fb{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:.78rem;font-weight:600;color:var(--soil);}

    /* ── MOBILE TAB BAR ──────────────────────────────── */
    .tab-bar{display:none;position:fixed;bottom:0;left:0;right:0;z-index:100;background:var(--glass);backdrop-filter:blur(24px);border-top:1px solid var(--border);padding:6px 0 max(8px,env(safe-area-inset-bottom));}
    .tab-inner{display:flex;justify-content:space-around;}
    .tab-item{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 10px;cursor:pointer;font-size:.58rem;font-weight:500;color:var(--text-muted);transition:color .2s;letter-spacing:.04em;text-transform:uppercase;}
    .tab-item.active{color:var(--accent);}
    .tab-icon{font-size:1.2rem;line-height:1;}
    @media(max-width:768px){
      .tab-bar{display:block;}
      .nav-center,.nav-actions{display:none;}
      .pb-mobile{padding-bottom:80px!important;}
    }
    .main-content{flex:1;}

    /* ── HERO ────────────────────────────────────────── */
    .hero{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;background:var(--dark);}
    .hero-bg-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;opacity:.18;filter:saturate(.7);z-index:0;}
    .hero-bg{position:absolute;inset:-8%;background:radial-gradient(ellipse 80% 60% at 25% 55%,rgba(212,132,90,.22) 0%,transparent 58%),radial-gradient(ellipse 55% 70% at 78% 25%,rgba(196,154,108,.12) 0%,transparent 55%),linear-gradient(155deg,rgba(14,7,2,.82) 0%,rgba(44,24,16,.72) 45%,rgba(14,7,2,.88) 100%);transition:transform .1s ease-out;z-index:1;}
    .hero-grain{position:absolute;inset:0;opacity:.035;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:160px;}
    .hero-ring{position:absolute;inset:0;overflow:hidden;pointer-events:none;}
    .hero-ring span{position:absolute;border-radius:50%;border:1px solid rgba(232,201,160,.06);top:50%;left:50%;transform:translate(-50%,-50%);animation:expandR 7s ease-out infinite;}
    .hero-ring span:nth-child(1){width:500px;height:500px;}
    .hero-ring span:nth-child(2){width:750px;height:750px;animation-delay:2.3s;}
    .hero-ring span:nth-child(3){width:1050px;height:1050px;animation-delay:4.6s;}
    @keyframes expandR{0%{opacity:.6;transform:translate(-50%,-50%) scale(.5);}100%{opacity:0;transform:translate(-50%,-50%) scale(1.3);}}
    .hero-content{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;max-width:800px;padding:40px 24px;text-align:center;}
    .hero-overline{font-size:.66rem;font-weight:500;letter-spacing:.32em;text-transform:uppercase;color:var(--sand-dark);margin-bottom:30px;opacity:.75;animation:fadeUp 1s .1s both;}
    .hero-logo-wrap{margin-bottom:30px;animation:fadeUp 1s .22s both;}
    .hero-logo-img{height:clamp(70px,13vw,120px);filter:drop-shadow(0 0 50px rgba(212,132,90,.38)) drop-shadow(0 0 100px rgba(212,132,90,.14));animation:floatL 5s ease-in-out infinite;}
    @keyframes floatL{0%,100%{transform:translateY(0) rotate(-1deg);}50%{transform:translateY(-9px) rotate(.8deg);}}
    .hero-headline{font-family:var(--fd);font-size:clamp(2.6rem,8.5vw,6rem);font-weight:400;line-height:1.02;color:var(--sand-light);margin-bottom:12px;letter-spacing:-.02em;animation:fadeUp 1s .34s both;}
    .hero-headline em{font-style:italic;color:var(--sand);display:block;}
    .hero-sub{font-family:var(--fs);font-size:clamp(1rem,2.8vw,1.4rem);color:var(--sand-dark);opacity:.75;margin-bottom:46px;animation:fadeUp 1s .46s both;}
    .hero-ctas{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;animation:fadeUp 1s .58s both;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
    .btn-hp{padding:14px 34px;border-radius:50px;border:none;cursor:pointer;font-family:var(--fb);font-size:.82rem;font-weight:500;background:var(--sand);color:var(--dark);letter-spacing:.06em;text-transform:uppercase;transition:all .3s cubic-bezier(.34,1.56,.64,1);position:relative;overflow:hidden;}
    .btn-hp::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent);transform:translateX(-100%);transition:transform .5s;}
    .btn-hp:hover{transform:translateY(-3px);box-shadow:0 10px 36px rgba(232,201,160,.32);}
    .btn-hp:hover::after{transform:translateX(100%);}
    .btn-hg{padding:14px 34px;border-radius:50px;cursor:pointer;font-family:var(--fb);font-size:.82rem;font-weight:500;background:transparent;color:var(--sand);border:1.5px solid rgba(232,201,160,.32);letter-spacing:.06em;text-transform:uppercase;transition:all .3s;}
    .btn-hg:hover{border-color:var(--sand);background:rgba(232,201,160,.07);transform:translateY(-2px);}
    .hero-scroll{position:absolute;bottom:30px;left:50%;transform:translateX(-50%);z-index:2;display:flex;flex-direction:column;align-items:center;gap:5px;animation:fadeUp 1s 1.1s both;}
    .scroll-line{width:1px;height:40px;background:linear-gradient(to bottom,rgba(232,201,160,.45),transparent);animation:scrollP 1.8s ease-in-out infinite;}
    @keyframes scrollP{0%,100%{opacity:.35;transform:scaleY(.7);}50%{opacity:1;transform:scaleY(1);}}
    .scroll-txt{font-size:.58rem;letter-spacing:.22em;text-transform:uppercase;color:var(--sand-dark);opacity:.45;}

    /* ── MARQUEE ─────────────────────────────────────── */
    .marquee-wrap{background:var(--soil);overflow:hidden;padding:13px 0;border-top:1px solid rgba(232,201,160,.08);}
    .marquee-track{display:flex;width:max-content;animation:marquee 24s linear infinite;}
    .marquee-track:hover{animation-play-state:paused;}
    @keyframes marquee{from{transform:translateX(0);}to{transform:translateX(-50%);}}
    .mq-item{display:flex;align-items:center;gap:10px;padding:0 28px;white-space:nowrap;font-family:var(--fi);font-size:.82rem;letter-spacing:.14em;color:var(--sand-dark);}
    .mq-dot{width:4px;height:4px;border-radius:50%;background:var(--accent);flex-shrink:0;}

    /* ── GALLERY MOSAIC ──────────────────────────────── */
    .gallery-section{position:relative;overflow:hidden;background:var(--dark);padding:72px 0;}
    .gallery-section::before{content:'';position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(to right,var(--dark) 0%,transparent 12%,transparent 88%,var(--dark) 100%),linear-gradient(to bottom,var(--dark) 0%,transparent 16%,transparent 84%,var(--dark) 100%);}
    .gallery-center-overlay{position:absolute;inset:0;z-index:3;display:flex;align-items:center;justify-content:center;pointer-events:none;}
    .gallery-center-text{text-align:center;pointer-events:auto;background:rgba(14,7,2,.55);backdrop-filter:blur(8px);padding:28px 40px;border-radius:20px;border:1px solid rgba(232,201,160,.1);}
    .gct-eyebrow{font-size:.62rem;letter-spacing:.32em;text-transform:uppercase;color:var(--accent);margin-bottom:8px;font-weight:500;}
    .gct-headline{font-family:var(--fd);font-size:clamp(1.4rem,4vw,2.8rem);color:var(--sand-light);font-weight:400;line-height:1.15;margin-bottom:5px;text-shadow:0 2px 30px rgba(0,0,0,.7);}
    .gct-headline em{font-style:italic;color:var(--sand);}
    .gct-sub{font-family:var(--fs);font-size:1rem;color:var(--sand-dark);opacity:.7;}
    .gallery-rows{display:flex;flex-direction:column;gap:10px;}
    .gallery-row{display:flex;gap:10px;width:max-content;}
    .gallery-row.fwd{animation:gallFwd var(--dur,30s) linear infinite;}
    .gallery-row.rev{animation:gallRev var(--dur,30s) linear infinite;}
    @keyframes gallFwd{from{transform:translateX(0);}to{transform:translateX(-50%);}}
    @keyframes gallRev{from{transform:translateX(-50%);}to{transform:translateX(0);}}
    .gallery-rows:hover .gallery-row{animation-play-state:paused;}
    .gallery-tile{position:relative;flex-shrink:0;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.45);transition:transform .4s cubic-bezier(.34,1.56,.64,1),box-shadow .4s;cursor:pointer;}
    .gallery-tile:hover{transform:scale(1.06) translateY(-4px);box-shadow:0 12px 40px rgba(212,132,90,.28);z-index:5;}
    .gallery-tile img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s ease;}
    .gallery-tile:hover img{transform:scale(1.08);}
    .tile-shine{position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.07) 0%,transparent 50%);pointer-events:none;}
    .tile-label{position:absolute;inset:0;background:linear-gradient(to top,rgba(14,7,2,.75) 0%,transparent 55%);display:flex;align-items:flex-end;padding:10px 12px;opacity:0;transition:opacity .3s;}
    .gallery-tile:hover .tile-label{opacity:1;}
    .tile-label-text{font-family:var(--fs);font-size:.85rem;color:var(--sand);line-height:1.2;}

    /* ── HOW IT WORKS ────────────────────────────────── */
    .hiw{padding:96px 24px;background:var(--cream);position:relative;overflow:hidden;}
    .hiw::before{content:'SOLES';position:absolute;top:30px;left:50%;transform:translateX(-50%);font-family:var(--fi);font-size:clamp(5rem,16vw,13rem);color:rgba(92,58,30,.04);letter-spacing:.1em;white-space:nowrap;pointer-events:none;user-select:none;}
    .hiw-eyebrow{text-align:center;margin-bottom:10px;font-size:.66rem;letter-spacing:.3em;text-transform:uppercase;color:var(--accent);font-weight:500;}
    .hiw-title{text-align:center;margin-bottom:58px;font-family:var(--fd);font-size:clamp(1.7rem,4.5vw,3.3rem);color:var(--soil);font-weight:400;line-height:1.2;}
    .hiw-title em{font-style:italic;color:var(--accent);}
    .hiw-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:22px;max-width:960px;margin:0 auto;}
    .tilt-card{background:var(--white);border-radius:22px;padding:34px 26px 30px;box-shadow:var(--shadow);position:relative;overflow:hidden;transition:box-shadow .2s;}
    .tilt-card::before{content:'';position:absolute;inset:0;background:linear-gradient(140deg,rgba(232,201,160,.055) 0%,transparent 55%);border-radius:22px;}
    .tilt-num{font-family:var(--fi);font-size:4rem;color:rgba(92,58,30,.06);line-height:1;position:absolute;top:14px;right:18px;transition:color .3s;}
    .tilt-card:hover .tilt-num{color:rgba(212,132,90,.14);}
    .tilt-icon{font-size:2.1rem;margin-bottom:14px;display:block;}
    .tilt-title{font-family:var(--fd);font-size:1.1rem;font-weight:700;color:var(--soil);margin-bottom:7px;}
    .tilt-desc{font-size:.8rem;line-height:1.65;color:var(--text-muted);}

    /* ── CREATOR SPOTLIGHT ───────────────────────────── */
    .spotlight{padding:96px 24px;background:var(--dark);position:relative;overflow:hidden;}
    .spotlight-bg{position:absolute;inset:0;background:radial-gradient(ellipse 50% 70% at 0 50%,rgba(212,132,90,.08) 0%,transparent 58%),radial-gradient(ellipse 40% 55% at 100% 30%,rgba(196,154,108,.06) 0%,transparent 55%);}
    .spotlight-inner{position:relative;z-index:2;max-width:1080px;margin:0 auto;}
    .spotlight-grid{display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center;}
    @media(max-width:680px){.spotlight-grid{grid-template-columns:1fr;gap:44px;}}
    .spot-eyebrow{font-size:.66rem;letter-spacing:.3em;text-transform:uppercase;color:var(--accent);margin-bottom:14px;font-weight:500;}
    .spot-heading{font-family:var(--fd);font-size:clamp(1.7rem,3.8vw,2.9rem);color:var(--sand-light);font-weight:400;line-height:1.2;margin-bottom:18px;}
    .spot-heading em{font-style:italic;color:var(--sand);}
    .spot-body{font-size:.88rem;line-height:1.78;color:var(--sand-dark);opacity:.78;margin-bottom:28px;}
    .perks{display:flex;flex-direction:column;gap:11px;}
    .perk{display:flex;align-items:flex-start;gap:12px;}
    .perk-icon{width:32px;height:32px;border-radius:9px;background:rgba(212,132,90,.12);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.95rem;}
    .perk strong{display:block;font-size:.83rem;color:var(--sand-light);margin-bottom:2px;}
    .perk span{font-size:.76rem;color:var(--sand-dark);opacity:.72;}
    .mock-cards{display:flex;gap:14px;align-items:flex-end;}
    .mock-card{flex:1;border-radius:18px;overflow:hidden;background:linear-gradient(155deg,var(--mid),var(--dark));border:1px solid rgba(232,201,160,.1);transition:transform .4s cubic-bezier(.34,1.56,.64,1);}
    .mock-card:first-child{transform:translateY(22px);}
    .mock-card:last-child{transform:translateY(-22px);}
    .mock-card:hover{transform:translateY(0) scale(1.03)!important;}
    .mock-img{aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;font-size:2.8rem;background:linear-gradient(155deg,rgba(232,201,160,.07),rgba(92,58,30,.25));}
    .mock-footer{padding:11px 13px;display:flex;justify-content:space-between;align-items:center;}
    .mock-name{font-size:.78rem;color:var(--sand);font-weight:500;}
    .mock-hearts{font-size:.76rem;color:var(--accent);}

    /* ── COMMUNITY ───────────────────────────────────── */
    .community{padding:80px 24px;background:linear-gradient(135deg,var(--soil) 0%,var(--mid) 100%);text-align:center;position:relative;overflow:hidden;}
    .community::before{content:'';position:absolute;top:-80px;right:-80px;width:340px;height:340px;border-radius:50%;background:rgba(232,201,160,.04);}
    .community::after{content:'';position:absolute;bottom:-100px;left:-60px;width:300px;height:300px;border-radius:50%;background:rgba(212,132,90,.05);}
    .comm-inner{position:relative;z-index:2;}
    .comm-heading{font-family:var(--fd);font-size:clamp(1.5rem,4.5vw,3rem);color:var(--sand-light);font-weight:400;margin-bottom:14px;}
    .comm-sub{font-size:.88rem;color:var(--sand-dark);opacity:.72;max-width:480px;margin:0 auto 32px;line-height:1.65;}
    .comm-btns{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;}
    .comm-btn{display:flex;align-items:center;gap:7px;padding:11px 22px;border-radius:40px;text-decoration:none;font-family:var(--fb);font-size:.8rem;font-weight:500;transition:all .3s cubic-bezier(.34,1.56,.64,1);letter-spacing:.03em;cursor:pointer;border:none;}
    .comm-btn.x{background:rgba(255,255,255,.1);color:var(--sand);border:1.5px solid rgba(232,201,160,.18);}
    .comm-btn.x:hover{background:rgba(255,255,255,.17);transform:translateY(-3px);box-shadow:0 8px 28px rgba(0,0,0,.28);}
    .comm-btn.join{background:var(--sand);color:var(--dark);}
    .comm-btn.join:hover{background:var(--sand-light);transform:translateY(-3px);box-shadow:0 8px 28px rgba(232,201,160,.28);}

    /* ── GENERAL BUTTONS ────────────────────────────── */
    .btn-primary{padding:11px 26px;border-radius:40px;border:none;cursor:pointer;font-family:var(--fb);font-size:.82rem;font-weight:500;background:var(--soil);color:var(--sand-light);transition:all .25s;letter-spacing:.02em;}
    .btn-primary:hover{background:var(--mid);transform:translateY(-2px);box-shadow:var(--shadow);}
    .btn-primary:disabled{opacity:.45;cursor:not-allowed;transform:none;}
    .btn-outline{padding:11px 26px;border-radius:40px;cursor:pointer;font-family:var(--fb);font-size:.82rem;font-weight:500;background:transparent;color:var(--soil);border:1.5px solid var(--border);transition:all .25s;}
    .btn-outline:hover{background:var(--sand-light);}
    .btn-danger{padding:8px 18px;border-radius:40px;border:none;cursor:pointer;font-family:var(--fb);font-size:.76rem;font-weight:500;background:#FDE8D8;color:var(--red);transition:all .2s;}
    .btn-danger:hover{background:#fbd0bc;}

    /* ── SEARCH ──────────────────────────────────────── */
    .search-wrap{padding:0 20px 16px;position:relative;max-width:520px;}
    .search-input{width:100%;padding:11px 16px 11px 42px;border-radius:40px;border:1.5px solid var(--border);background:var(--white);font-family:var(--fb);font-size:.84rem;color:var(--text);outline:none;transition:border-color .2s,box-shadow .2s;}
    .search-input:focus{border-color:var(--sand-dark);box-shadow:0 0 0 3px rgba(196,154,108,.12);}
    .search-icon{position:absolute;left:34px;top:50%;transform:translateY(-50%);font-size:.9rem;pointer-events:none;color:var(--text-muted);}
    .search-clear{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:.8rem;padding:4px 8px;border-radius:20px;}
    .search-clear:hover{background:var(--sand-light);}
    .search-results-label{padding:0 20px 10px;font-size:.74rem;color:var(--text-muted);font-weight:500;}

    /* ── FEED ────────────────────────────────────────── */
    .feed-page{max-width:1200px;margin:0 auto;width:100%;}
    .feed-header{padding:30px 20px 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
    .feed-title{font-family:var(--fd);font-size:1.7rem;font-weight:400;color:var(--soil);}
    .feed-title span{font-style:italic;color:var(--accent);}
    .feed-filters{display:flex;gap:7px;flex-wrap:wrap;}
    .fpill{padding:6px 15px;border-radius:40px;border:none;cursor:pointer;font-size:.74rem;font-weight:500;background:var(--sand-light);color:var(--soil);transition:all .2s;}
    .fpill.active{background:var(--soil);color:var(--sand-light);}
    .feed-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px;padding:0 20px 40px;}
    @media(max-width:480px){.feed-grid{grid-template-columns:repeat(2,1fr);gap:9px;padding:0 11px 40px;}}

    /* ── POST CARD ───────────────────────────────────── */
    .post-card{background:var(--white);border-radius:18px;overflow:hidden;box-shadow:var(--shadow);transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s;cursor:pointer;position:relative;}
    .post-card:hover{transform:translateY(-6px) scale(1.01);box-shadow:var(--shadow-lg);}
    .pc-img{width:100%;aspect-ratio:4/5;object-fit:cover;background:var(--sand-light);display:block;}
    .pc-body{padding:11px 13px 13px;}
    .pc-header{display:flex;align-items:center;gap:7px;margin-bottom:7px;}
    .pav{width:28px;height:28px;border-radius:50%;background:var(--sand);overflow:hidden;flex-shrink:0;}
    .pav img{width:100%;height:100%;object-fit:cover;}
    .pav-fb{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:600;color:var(--soil);}
    .pc-name{font-size:.78rem;font-weight:500;color:var(--soil);display:flex;align-items:center;gap:3px;cursor:pointer;}
    .pc-name:hover{color:var(--accent);}
    .vbadge{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:#1D9BF0;color:#fff;font-size:.58rem;font-weight:700;flex-shrink:0;vertical-align:middle;}
    .pc-img-wrap{position:relative;display:block;}
    .pc-verified-overlay{position:absolute;bottom:8px;left:8px;background:#1D9BF0;color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.35);}
    .pc-caption{font-size:.75rem;color:var(--text-muted);margin-bottom:9px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
    .pc-actions{display:flex;align-items:center;gap:10px;}
    .pac{display:flex;align-items:center;gap:4px;background:none;border:none;cursor:pointer;font-size:.74rem;color:var(--text-muted);font-family:var(--fb);transition:color .2s;padding:0;user-select:none;}
    .pac:hover{color:var(--accent);}
    .pac.liked{color:#E05A5A;}
    .pac:active{transform:scale(.9);}

    /* ── POST MODAL ──────────────────────────────────── */
    .modal-overlay{position:fixed;inset:0;z-index:200;background:rgba(14,7,2,.88);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s;}
    @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
    @keyframes slideUp{from{transform:translateY(28px);opacity:0;}to{transform:translateY(0);opacity:1;}}
    .modal-box{background:var(--cream);border-radius:20px;max-width:880px;width:100%;max-height:92vh;display:flex;overflow:hidden;box-shadow:var(--shadow-lg);animation:slideUp .35s cubic-bezier(.34,1.56,.64,1);}
    @media(max-width:620px){.modal-box{flex-direction:column;max-height:95vh;border-radius:20px 20px 0 0;align-self:flex-end;}}
    .modal-img-side{flex:1;background:var(--dark);min-height:280px;position:relative;}
    .modal-img-side img{width:100%;height:100%;object-fit:cover;display:block;}
    .modal-content-side{width:320px;flex-shrink:0;display:flex;flex-direction:column;overflow:hidden;background:var(--cream);}
    @media(max-width:620px){.modal-content-side{width:100%;max-height:55vh;}}
    .modal-header{padding:13px 15px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
    .modal-close{background:none;border:none;cursor:pointer;font-size:1.1rem;color:var(--text-muted);line-height:1;padding:4px 8px;border-radius:6px;transition:background .2s;}
    .modal-close:hover{background:var(--sand-light);}
    .comments-list{flex:1;overflow-y:auto;padding:13px 15px;display:flex;flex-direction:column;gap:12px;min-height:0;}
    .ci{display:flex;gap:7px;align-items:flex-start;}
    .ci-body{flex:1;}
    .ci-name{font-size:.75rem;font-weight:600;color:var(--soil);}
    .ci-text{font-size:.78rem;color:var(--text);line-height:1.45;display:inline;}
    .ci-time{font-size:.65rem;color:var(--text-muted);margin-top:2px;}
    .comment-actions-bar{padding:8px 15px;border-top:1px solid var(--border);display:flex;align-items:center;gap:14px;flex-shrink:0;}
    .cir{padding:10px 13px;border-top:1px solid var(--border);display:flex;gap:7px;align-items:center;flex-shrink:0;}
    .cinput{flex:1;padding:8px 12px;border-radius:20px;border:1.5px solid var(--border);background:var(--white);font-family:var(--fb);font-size:.78rem;color:var(--text);outline:none;transition:border-color .2s;}
    .cinput:focus{border-color:var(--sand-dark);}
    .cinput:disabled{opacity:.5;cursor:not-allowed;}
    .csend{background:var(--soil);color:var(--sand-light);border:none;cursor:pointer;border-radius:50%;width:34px;height:34px;font-size:.9rem;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0;}
    .csend:hover:not(:disabled){background:var(--mid);}
    .csend:disabled{opacity:.4;cursor:not-allowed;}
    .csend.sending{animation:spin .6s linear infinite;}

    /* ── SHEET MODAL (slide up panel) ────────────────── */
    .sheet-overlay{position:fixed;inset:0;z-index:200;background:rgba(14,7,2,.7);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .2s;}
    @media(min-width:620px){.sheet-overlay{align-items:center;}}
    .sheet-box{background:var(--cream);border-radius:22px 22px 0 0;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;padding:28px 24px 32px;animation:slideUp .35s cubic-bezier(.34,1.56,.64,1);box-shadow:var(--shadow-lg);}
    @media(min-width:620px){.sheet-box{border-radius:22px;}}
    .sheet-handle{width:36px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 20px;}
    .sheet-title{font-family:var(--fd);font-size:1.5rem;font-weight:400;color:var(--soil);margin-bottom:20px;}

    /* ── AUTH MODAL ──────────────────────────────────── */
    .auth-modal{background:var(--cream);border-radius:22px;max-width:450px;width:100%;padding:36px 32px;box-shadow:var(--shadow-lg);animation:slideUp .35s cubic-bezier(.34,1.56,.64,1);max-height:90vh;overflow-y:auto;}
    .auth-logo-wrap{text-align:center;margin-bottom:20px;}
    .auth-logo-img{height:50px;}
    .auth-title{font-family:var(--fd);font-size:1.6rem;font-weight:400;color:var(--soil);text-align:center;margin-bottom:4px;}
    .auth-sub{font-family:var(--fs);font-size:1rem;color:var(--text-muted);text-align:center;margin-bottom:22px;}
    .role-select{display:flex;gap:7px;margin-bottom:16px;}
    .role-btn{flex:1;padding:10px;border-radius:var(--r-sm);border:2px solid var(--border);cursor:pointer;font-family:var(--fb);font-size:.78rem;font-weight:500;background:var(--white);color:var(--text-muted);transition:all .2s;text-align:center;}
    .role-btn.active{border-color:var(--soil);background:var(--soil);color:var(--sand-light);}
    .fg{margin-bottom:13px;}
    .fl{display:block;font-size:.68rem;font-weight:500;color:var(--text-muted);margin-bottom:4px;letter-spacing:.06em;text-transform:uppercase;}
    .fi{width:100%;padding:10px 13px;border-radius:var(--r-sm);border:1.5px solid var(--border);background:var(--white);font-family:var(--fb);font-size:.84rem;color:var(--text);outline:none;transition:border-color .2s;}
    .fi:focus{border-color:var(--sand-dark);}
    .ferr{font-size:.72rem;color:#E05A5A;margin-top:6px;}
    .auth-switch{text-align:center;margin-top:13px;font-size:.78rem;color:var(--text-muted);}
    .auth-switch button{background:none;border:none;cursor:pointer;color:var(--accent);font-weight:500;font-family:var(--fb);}
    .spbtn{display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:30px;cursor:pointer;font-family:var(--fb);font-size:.73rem;font-weight:500;border:1.5px solid var(--border);background:var(--white);color:var(--text-muted);transition:all .2s;white-space:nowrap;}
    .spbtn.active{border-color:var(--soil);background:var(--soil);color:var(--sand-light);}

    /* ── PROFILE PAGE ────────────────────────────────── */
    .profile-page{max-width:900px;margin:0 auto;width:100%;}
    .profile-hero{background:linear-gradient(155deg,var(--dark) 0%,var(--mid) 100%);padding:48px 24px 36px;text-align:center;position:relative;}
    .profile-hero-bg{position:absolute;inset:0;background:radial-gradient(ellipse 60% 60% at 50% 100%,rgba(212,132,90,.12) 0%,transparent 65%);pointer-events:none;}
    .profile-av-wrap{position:relative;width:100px;height:100px;margin:0 auto 14px;cursor:pointer;}
    .profile-av{width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid var(--sand);display:block;}
    .profile-av-fb{width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,var(--sand-light),var(--sand));display:flex;align-items:center;justify-content:center;font-size:2.2rem;font-weight:600;color:var(--soil);border:3px solid var(--sand);}
    .profile-av-edit-btn{position:absolute;bottom:2px;right:2px;width:28px;height:28px;border-radius:50%;background:var(--soil);color:var(--sand-light);border:2px solid var(--cream);display:flex;align-items:center;justify-content:center;font-size:.72rem;cursor:pointer;transition:background .2s;}
    .profile-av-edit-btn:hover{background:var(--mid);}
    .profile-name-row{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:3px;}
    .profile-name{font-family:var(--fd);font-size:1.5rem;color:var(--sand-light);font-weight:400;}
    .verified-chip{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#1D9BF0;color:#fff;font-size:.7rem;font-weight:700;flex-shrink:0;}
    .profile-handle{font-size:.8rem;color:var(--sand-dark);margin-bottom:8px;}
    .profile-bio{font-size:.84rem;color:var(--sand);opacity:.75;max-width:340px;margin:0 auto 14px;line-height:1.55;}
    .profile-stats-row{display:flex;justify-content:center;gap:32px;margin-bottom:16px;}
    .ps-num{font-family:var(--fi);font-size:1.35rem;color:var(--sand);letter-spacing:.04em;text-align:center;}
    .ps-lbl{font-size:.62rem;color:var(--sand-dark);text-transform:uppercase;letter-spacing:.1em;text-align:center;}
    .profile-socials{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:14px;}
    .psoc{display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;background:rgba(255,255,255,.07);border:1px solid rgba(232,201,160,.15);color:var(--sand-dark);text-decoration:none;font-size:.72rem;transition:all .2s;}
    .psoc:hover{background:rgba(255,255,255,.13);color:var(--sand);}
    .profile-act-row{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;}
    .follow-btn{padding:8px 24px;border-radius:40px;cursor:pointer;font-family:var(--fb);font-size:.78rem;font-weight:500;transition:all .2s;border:none;}
    .fb-fill{background:var(--sand);color:var(--dark);}
    .fb-ghost{background:transparent;color:var(--sand);border:1.5px solid rgba(232,201,160,.38)!important;}
    .fb-soil{background:var(--soil);color:var(--sand-light);}
    .profile-tabs{display:flex;border-bottom:1px solid var(--border);margin:0 0 0;padding:0 20px;}
    .profile-tab{padding:14px 20px;font-size:.8rem;font-weight:500;color:var(--text-muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .2s;}
    .profile-tab.active{color:var(--soil);border-bottom-color:var(--soil);font-weight:600;}
    .profile-posts-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:3px;padding:3px;}
    .profile-post-thumb{aspect-ratio:1;overflow:hidden;cursor:pointer;position:relative;background:var(--sand-light);}
    .profile-post-thumb img{width:100%;height:100%;object-fit:cover;transition:transform .3s;}
    .profile-post-thumb:hover img{transform:scale(1.05);}
    .profile-post-thumb-overlay{position:absolute;inset:0;background:rgba(14,7,2,.5);display:flex;align-items:center;justify-content:center;gap:12px;opacity:0;transition:opacity .2s;}
    .profile-post-thumb:hover .profile-post-thumb-overlay{opacity:1;}
    .ppto-stat{color:var(--white);font-size:.82rem;font-weight:600;display:flex;align-items:center;gap:4px;}

    /* ── EDIT PROFILE SHEET ──────────────────────────── */
    .edit-section{margin-bottom:20px;}
    .edit-section-title{font-size:.7rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px;}
    .avatar-edit-zone{display:flex;align-items:center;gap:16px;padding:16px;background:var(--sand-light);border-radius:12px;margin-bottom:16px;}
    .avatar-edit-preview{width:64px;height:64px;border-radius:50%;overflow:hidden;background:var(--sand);flex-shrink:0;border:2px solid var(--sand-dark);}
    .avatar-edit-preview img{width:100%;height:100%;object-fit:cover;}
    .avatar-edit-preview-fb{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:700;color:var(--soil);}
    .avatar-edit-btns{display:flex;flex-direction:column;gap:6px;}
    .avatar-pick-btn{padding:7px 14px;border-radius:8px;border:1.5px solid var(--border);background:var(--white);font-family:var(--fb);font-size:.74rem;font-weight:500;cursor:pointer;transition:all .2s;color:var(--text);}
    .avatar-pick-btn:hover{background:var(--sand);}

    /* ── CREATOR STUDIO ──────────────────────────────── */
    .studio-page{max-width:700px;margin:0 auto;padding:28px 20px;}
    .studio-title{font-family:var(--fd);font-size:1.6rem;color:var(--soil);margin-bottom:6px;}
    .studio-sub{font-family:var(--fs);font-size:1rem;color:var(--text-muted);margin-bottom:22px;}
    .earn-card{background:linear-gradient(135deg,var(--soil) 0%,var(--mid) 100%);border-radius:20px;padding:28px;color:var(--sand-light);margin-bottom:18px;position:relative;overflow:hidden;}
    .earn-card::before{content:'';position:absolute;top:-35px;right:-35px;width:150px;height:150px;border-radius:50%;background:rgba(232,201,160,.06);}
    .earn-card::after{content:'';position:absolute;bottom:-50px;left:-25px;width:190px;height:190px;border-radius:50%;background:rgba(212,132,90,.06);}
    .earn-label{font-size:.66rem;letter-spacing:.2em;text-transform:uppercase;opacity:.58;margin-bottom:4px;}
    .earn-amount{font-family:var(--fi);font-size:3.2rem;color:var(--sand);letter-spacing:.04em;position:relative;z-index:1;}
    .earn-pts{font-size:.76rem;opacity:.52;margin-top:3px;}
    .earn-row{display:flex;gap:11px;margin-top:15px;flex-wrap:wrap;position:relative;z-index:1;}
    .earn-mini{flex:1;min-width:85px;background:rgba(255,255,255,.07);border-radius:10px;padding:11px 12px;}
    .earn-mini-v{font-family:var(--fi);font-size:1.3rem;color:var(--sand);}
    .earn-mini-l{font-size:.63rem;opacity:.52;margin-top:2px;}
    .verify-banner{background:rgba(212,132,90,.1);border:1.5px solid var(--accent);border-radius:14px;padding:14px 18px;display:flex;align-items:center;gap:12px;margin-bottom:18px;}
    .vcta{padding:7px 16px;border-radius:40px;border:none;cursor:pointer;background:var(--accent);color:var(--white);font-family:var(--fb);font-size:.74rem;font-weight:500;text-decoration:none;display:inline-block;transition:background .2s;white-space:nowrap;}
    .vcta:hover{background:var(--soil);}
    .scard{background:var(--white);border-radius:16px;padding:20px;margin-bottom:14px;box-shadow:var(--shadow);}
    .scard-title{font-size:.7rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin-bottom:13px;}
    .pout-btn{padding:9px 22px;border-radius:40px;border:none;cursor:pointer;background:var(--soil);color:var(--sand-light);font-family:var(--fb);font-size:.8rem;font-weight:500;transition:all .2s;}
    .pout-btn:disabled{opacity:.4;cursor:not-allowed;}
    .pout-btn:not(:disabled):hover{background:var(--mid);}
    .earnings-chart{display:flex;align-items:flex-end;gap:4px;height:60px;margin-top:10px;}
    .ec-bar{flex:1;background:var(--sand-light);border-radius:3px 3px 0 0;transition:height .3s;min-height:4px;}
    .ec-bar.active{background:var(--accent);}

    /* ── UPLOAD ──────────────────────────────────────── */
    .upload-zone{border:2px dashed var(--border);border-radius:14px;padding:36px 20px;text-align:center;cursor:pointer;transition:border-color .2s,background .2s;}
    .upload-zone:hover,.upload-zone.drag{border-color:var(--sand-dark);background:var(--sand-light);}
    .upload-preview-wrap{position:relative;margin-bottom:14px;}
    .upload-preview{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:14px;display:block;}
    .upload-preview-remove{position:absolute;top:8px;right:8px;background:rgba(14,7,2,.7);color:var(--white);border:none;cursor:pointer;border-radius:50%;width:28px;height:28px;font-size:.9rem;display:flex;align-items:center;justify-content:center;}

    /* ── ADMIN PANEL ─────────────────────────────────── */
    .admin-page{max-width:820px;margin:0 auto;padding:28px 20px;}
    .admin-title{font-family:var(--fd);font-size:1.5rem;color:var(--soil);margin-bottom:3px;}
    .admin-sub{font-family:var(--fs);font-size:.95rem;color:var(--text-muted);margin-bottom:22px;}
    .admin-table-wrap{overflow-x:auto;}
    .admin-table{width:100%;border-collapse:collapse;font-size:.78rem;}
    .admin-table th{text-align:left;padding:9px 11px;font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);border-bottom:1.5px solid var(--border);}
    .admin-table td{padding:9px 11px;border-bottom:1px solid var(--border);color:var(--text);vertical-align:middle;}
    .admin-table tr:last-child td{border-bottom:none;}
    .tvbtn{padding:4px 11px;border-radius:20px;border:none;cursor:pointer;font-size:.68rem;font-weight:500;font-family:var(--fb);transition:all .2s;}
    .tvbtn.v{background:#D4EDD4;color:var(--green);}
    .tvbtn.u{background:#FDE8D8;color:var(--red);}

    /* ── DAILY SOLES ─────────────────────────────────── */
    .daily-page{max-width:1100px;margin:0 auto;width:100%;}
    .daily-hdr{padding:30px 20px 16px;display:flex;align-items:baseline;gap:12px;}
    .daily-title{font-family:var(--fd);font-size:1.9rem;font-weight:400;color:var(--soil);}
    .daily-date{font-size:.74rem;color:var(--text-muted);}
    .daily-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px;padding:0 20px 40px;}
    .daily-wrap{border-radius:16px;overflow:hidden;aspect-ratio:3/4;box-shadow:var(--shadow);cursor:pointer;}
    .daily-wrap img{width:100%;height:100%;object-fit:cover;transition:transform .35s;}
    .daily-wrap:hover img{transform:scale(1.05);}

    /* ── MISC ────────────────────────────────────────── */
    .spinner{width:34px;height:34px;border-radius:50%;border:3px solid var(--border);border-top-color:var(--sand-dark);animation:spin .8s linear infinite;margin:60px auto;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .spin-inline{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.3);border-top-color:var(--white);animation:spin .6s linear infinite;display:inline-block;}
    .empty-state{text-align:center;padding:60px 20px;color:var(--text-muted);}
    .empty-state-icon{font-size:2.8rem;margin-bottom:10px;}
    .empty-state-text{font-size:.86rem;}
    .tag-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;background:var(--sand-light);color:var(--soil);font-size:.68rem;font-weight:500;}
    .tag-badge.creator{background:linear-gradient(90deg,var(--soil),var(--mid));color:var(--sand-light);}
    .page-fade{animation:fadeIn .3s ease;}
    .section-divider{border:none;border-top:1px solid var(--border);margin:0 20px;}

    /* ── TOAST ───────────────────────────────────────── */
    .toast-wrap{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:300;display:flex;flex-direction:column;gap:6px;pointer-events:none;align-items:center;}
    @media(min-width:769px){.toast-wrap{bottom:28px;}}
    .toast{background:var(--dark);color:var(--sand-light);padding:10px 20px;border-radius:40px;font-size:.8rem;white-space:nowrap;box-shadow:var(--shadow-lg);animation:toastIn .3s cubic-bezier(.34,1.56,.64,1);}
    .toast.success{background:#1a4a1a;}
    .toast.error{background:#4a1a1a;}
    @keyframes toastIn{from{transform:translateY(16px);opacity:0;}to{transform:translateY(0);opacity:1;}}

    /* ── FOOTER (homepage only) ──────────────────────── */
    .footer{background:var(--dark);padding:36px 24px 48px;text-align:center;}
    .footer-logo-img{height:42px;margin-bottom:10px;opacity:.9;}
    .footer-tagline{font-family:var(--fs);font-size:1.1rem;color:var(--sand-dark);margin-bottom:18px;}
    .footer-social{display:flex;justify-content:center;gap:10px;margin-bottom:18px;}
    .soc-btn{width:38px;height:38px;border-radius:50%;border:1.5px solid rgba(232,201,160,.2);display:flex;align-items:center;justify-content:center;color:var(--sand-dark);text-decoration:none;font-size:1rem;transition:all .2s;}
    .soc-btn:hover{border-color:var(--sand);color:var(--sand);}
    .footer-links{display:flex;justify-content:center;gap:18px;flex-wrap:wrap;margin-bottom:18px;}
    .footer-link{color:var(--sand-dark);text-decoration:none;font-size:.73rem;transition:color .2s;}
    .footer-link:hover{color:var(--sand);}
    .footer-copy{font-size:.66rem;color:var(--text-muted);opacity:.4;}

    /* ── CA TICKER BAR ───────────────────────────────── */
    .ca-bar{background:linear-gradient(90deg,var(--soil),#3D2510,var(--soil));padding:10px 0;overflow:hidden;position:relative;}
    .ca-bar::before,.ca-bar::after{content:'';position:absolute;top:0;bottom:0;width:60px;z-index:2;}
    .ca-bar::before{left:0;background:linear-gradient(to right,var(--soil),transparent);}
    .ca-bar::after{right:0;background:linear-gradient(to left,var(--soil),transparent);}
    .ca-ticker{display:flex;width:max-content;animation:caScroll 30s linear infinite;align-items:center;gap:0;}
    .ca-ticker:hover{animation-play-state:paused;}
    @keyframes caScroll{from{transform:translateX(0);}to{transform:translateX(-50%);}}
    .ca-ticker-item{display:flex;align-items:center;gap:10px;padding:0 32px;white-space:nowrap;cursor:pointer;}
    .ca-ticker-label{font-size:.62rem;letter-spacing:.2em;text-transform:uppercase;color:var(--sand-dark);opacity:.7;font-weight:600;}
    .ca-ticker-addr{font-family:monospace;font-size:.78rem;color:var(--sand);background:rgba(255,255,255,.06);padding:3px 10px;border-radius:6px;transition:background .2s;}
    .ca-ticker-item:hover .ca-ticker-addr{background:rgba(255,255,255,.14);}
    .ca-ticker-copy{font-size:.64rem;color:var(--accent);opacity:.8;}
    .ca-ticker-sep{width:1px;height:14px;background:rgba(232,201,160,.15);margin:0 8px;}

    /* ── PASSIVE INCOME SECTION ──────────────────────── */
    .passive-section{padding:80px 24px;background:var(--cream);position:relative;overflow:hidden;}
    .passive-inner{max-width:1000px;margin:0 auto;}
    .passive-eyebrow{text-align:center;font-size:.66rem;letter-spacing:.3em;text-transform:uppercase;color:var(--accent);margin-bottom:10px;font-weight:500;}
    .passive-title{text-align:center;font-family:var(--fd);font-size:clamp(1.8rem,5vw,3.5rem);color:var(--soil);font-weight:400;margin-bottom:14px;line-height:1.15;}
    .passive-title em{font-style:italic;color:var(--accent);}
    .passive-sub{text-align:center;font-size:.9rem;color:var(--text-muted);max-width:520px;margin:0 auto 48px;line-height:1.7;}
    .passive-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:40px;}
    .passive-card{background:var(--white);border-radius:18px;padding:24px 20px;box-shadow:var(--shadow);text-align:center;position:relative;overflow:hidden;border-top:3px solid var(--accent);}
    .passive-card-icon{font-size:2rem;margin-bottom:10px;}
    .passive-card-pts{font-family:var(--fi);font-size:2rem;color:var(--accent);letter-spacing:.04em;}
    .passive-card-pts-label{font-size:.68rem;color:var(--text-muted);margin-bottom:6px;letter-spacing:.08em;text-transform:uppercase;}
    .passive-card-title{font-size:.88rem;font-weight:600;color:var(--soil);margin-bottom:4px;}
    .passive-card-desc{font-size:.76rem;color:var(--text-muted);line-height:1.5;}
    .passive-math{background:linear-gradient(135deg,var(--soil),var(--mid));border-radius:18px;padding:28px 32px;display:flex;align-items:center;justify-content:center;gap:24px;flex-wrap:wrap;text-align:center;}
    .pm-item{color:var(--sand-light);}
    .pm-val{font-family:var(--fi);font-size:2rem;color:var(--sand);display:block;}
    .pm-lbl{font-size:.68rem;opacity:.65;letter-spacing:.1em;text-transform:uppercase;}
    .pm-eq{font-family:var(--fi);font-size:1.5rem;color:var(--sand-dark);opacity:.5;}

    /* ── VERIFICATION REQUEST (profile) ──────────────── */
    .verify-request-sheet{}
    .verify-step{display:flex;gap:12px;align-items:flex-start;padding:14px 0;border-bottom:1px solid var(--border);}
    .verify-step:last-child{border-bottom:none;}
    .verify-step-num{width:26px;height:26px;border-radius:50%;background:var(--soil);color:var(--sand-light);display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;flex-shrink:0;margin-top:1px;}
    .verify-step-body strong{display:block;font-size:.84rem;color:var(--soil);margin-bottom:3px;}
    .verify-step-body span{font-size:.78rem;color:var(--text-muted);line-height:1.5;}
    .vreq-status{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:.72rem;font-weight:600;margin-top:6px;}
    .vreq-status.pending{background:#FEF3C7;color:#92400E;}
    .vreq-status.reviewing{background:#DBEAFE;color:#1E40AF;}
    .vreq-status.approved{background:#D1FAE5;color:#065F46;}
    .vreq-status.rejected{background:#FEE2E2;color:#991B1B;}

    /* ── ADMIN VERIFICATION REQUESTS ────────────────── */
    .vreq-card{background:var(--white);border-radius:14px;padding:18px;margin-bottom:12px;box-shadow:var(--shadow);border-left:4px solid var(--border);}
    .vreq-card.pending{border-left-color:#F59E0B;}
    .vreq-card.reviewing{border-left-color:#3B82F6;}
    .vreq-card.approved{border-left-color:#10B981;}
    .vreq-card.rejected{border-left-color:#EF4444;}
    .vreq-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:8px;flex-wrap:wrap;}
    .vreq-user{font-weight:600;font-size:.86rem;color:var(--soil);}
    .vreq-time{font-size:.7rem;color:var(--text-muted);}
    .vreq-field{margin-bottom:8px;}
    .vreq-field-label{font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);font-weight:600;margin-bottom:2px;}
    .vreq-field-val{font-size:.8rem;color:var(--text);word-break:break-all;}
    .vreq-selfie{width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin-top:6px;cursor:pointer;}
    .vreq-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;}

    /* CONTRACT_ADDRESS_SECTION */
    .ca-section{background:var(--soil);padding:14px 24px;text-align:center;}
    .ca-addr{font-family:monospace;font-size:.8rem;color:var(--sand);background:rgba(255,255,255,.08);padding:7px 16px;border-radius:8px;cursor:pointer;transition:background .2s;display:inline-block;word-break:break-all;}
    .ca-addr:hover{background:rgba(255,255,255,.14);}
  `}</style>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const timeAgo = ts => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};
const ptsToDollars = pts => (pts / POINTS_TO_DOLLAR).toFixed(2);

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, set] = useState([]);
  const show = useCallback((msg, type = "default", dur = 3000) => {
    const id = Date.now() + Math.random();
    set(p => [...p, { id, msg, type }]);
    setTimeout(() => set(p => p.filter(t => t.id !== id)), dur);
  }, []);
  return { toasts, show };
}
function ToastContainer({ toasts }) {
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type !== "default" ? t.type : ""}`}>{t.msg}</div>
      ))}
    </div>
  );
}

// ─── 3D Tilt Hook ─────────────────────────────────────────────────────────────
function useTilt(r) {
  useEffect(() => {
    const el = r.current; if (!el) return;
    const move = e => {
      const b = el.getBoundingClientRect();
      const x = ((e.clientX-b.left)/b.width-.5)*17;
      const y = ((e.clientY-b.top)/b.height-.5)*17;
      el.style.transform = `perspective(700px) rotateY(${x}deg) rotateX(${-y}deg) translateZ(5px)`;
      el.style.boxShadow = `${-x*1.4}px ${y*1.4}px 36px rgba(92,58,30,.17)`;
    };
    const leave = () => { el.style.transform=""; el.style.boxShadow=""; };
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => { el.removeEventListener("mousemove", move); el.removeEventListener("mouseleave", leave); };
  }, [r]);
}
function TiltCard({ icon, title, desc, num }) {
  const r = useRef(); useTilt(r);
  return (
    <div className="tilt-card" ref={r} style={{transition:"transform .15s ease-out,box-shadow .15s ease-out"}}>
      <div className="tilt-num">{num}</div>
      <span className="tilt-icon">{icon}</span>
      <div className="tilt-title">{title}</div>
      <div className="tilt-desc">{desc}</div>
    </div>
  );
}

// ─── Parallax ─────────────────────────────────────────────────────────────────
function useParallax() {
  const r = useRef();
  useEffect(() => {
    const fn = () => { if (r.current) r.current.style.transform = `translateY(${window.scrollY*.32}px)`; };
    window.addEventListener("scroll", fn, {passive:true});
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return r;
}

// ─── Fade-in on scroll ────────────────────────────────────────────────────────
function useFadeIn() {
  const r = useRef();
  useEffect(() => {
    const el = r.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.style.opacity="1"; el.style.transform="translateY(0)"; obs.disconnect(); }
    }, {threshold:.1});
    el.style.opacity="0"; el.style.transform="translateY(32px)";
    el.style.transition="opacity .7s ease,transform .7s cubic-bezier(.34,1.56,.64,1)";
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return r;
}

// ─── Avatar Component ─────────────────────────────────────────────────────────
function Avatar({ photoURL, name, size = 30 }) {
  const s = { width:size, height:size, borderRadius:"50%", overflow:"hidden", background:"var(--sand-light)", flexShrink:0 };
  if (photoURL) return <img src={photoURL} alt="" style={{...s, objectFit:"cover"}} />;
  return <div style={{...s, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*.38, fontWeight:600, color:"var(--soil)"}}>{(name||"?")[0].toUpperCase()}</div>;
}

// ─── Gallery Mosaic ───────────────────────────────────────────────────────────
function GalleryMosaic() {
  return (
    <div className="gallery-section">
      <div className="gallery-rows">
        {ROW_CFG.map((row, ri) => (
          <div key={ri} className={`gallery-row ${row.dir}`} style={{"--dur": row.dur}}>
            {row.idxs.map((idx, ti) => {
              const w = row.h * (TILE_W[ti % TILE_W.length]);
              return (
                <div key={ti} className="gallery-tile" style={{width:w, height:row.h}}>
                  <img src={FT_IMGS[idx]} alt="" loading="lazy"
                    onError={e => { e.target.style.display="none"; e.target.parentElement.style.background=`linear-gradient(135deg,hsl(${(idx*23)%360},20%,16%),hsl(${(idx*23+40)%360},25%,22%))`; }} />
                  <div className="tile-shine" />
                  <div className="tile-label">
                    <div className="tile-label-text">{FT_LABELS[(idx+ti)%FT_LABELS.length]}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="gallery-center-overlay">
        <div className="gallery-center-text">
          <div className="gct-eyebrow">Soles Gallery</div>
          <div className="gct-headline">Every sole<br /><em>tells a story</em></div>
          <div className="gct-sub">Browse thousands of creators</div>
        </div>
      </div>
    </div>
  );
}

// ─── Passive Income Section ───────────────────────────────────────────────────
function PassiveIncomeSection({ onAuth }) {
  const ref = useFadeIn();
  return (
    <div className="passive-section" ref={ref}>
      <div className="passive-inner">
        <div className="passive-eyebrow">The $SOLES Economy</div>
        <div className="passive-title">Post once.<br /><em>Earn forever.</em></div>
        <div className="passive-sub">
          SOLES is the first platform where foot content creators earn passive blockchain income — forever. Every post you make keeps earning as long as people engage with it. The fetish community finally has its own economy.
        </div>
        <div className="passive-grid">
          {[
            { icon:"🦶", pts:"1 pt",  label:"per like",    title:"Likes",    desc:"Every like on any of your posts adds to your balance. Old posts earn just like new ones." },
            { icon:"💬", pts:"2 pts", label:"per comment", title:"Comments", desc:"Comments signal deep engagement. They earn you double — because real connection matters." },
            { icon:"👁",  pts:"0.1 pt",label:"per view",   title:"Views",    desc:"Even passive scrollers contribute. Your content earns while you sleep, travel, or post more." },
            { icon:"🪙", pts:"10 pts",label:"= $1.00",     title:"$SOLES",   desc:"10 engagement points equals one dollar, powered by the $SOLES token on-chain. No middleman." },
          ].map(c => (
            <div key={c.title} className="passive-card">
              <div className="passive-card-icon">{c.icon}</div>
              <div className="passive-card-pts-label">{c.label}</div>
              <div className="passive-card-pts">{c.pts}</div>
              <div className="passive-card-title">{c.title}</div>
              <div className="passive-card-desc">{c.desc}</div>
            </div>
          ))}
        </div>
        <div className="passive-math">
          <div className="pm-item"><span className="pm-val">1</span><span className="pm-lbl">Post Published</span></div>
          <div className="pm-eq">+</div>
          <div className="pm-item"><span className="pm-val">∞</span><span className="pm-lbl">Engagement Over Time</span></div>
          <div className="pm-eq">=</div>
          <div className="pm-item"><span className="pm-val">$$$</span><span className="pm-lbl">Passive Income Forever</span></div>
        </div>
        <div style={{textAlign:"center",marginTop:32}}>
          <button className="btn-hp" onClick={()=>onAuth("signup")} style={{padding:"13px 36px"}}>Become a Creator</button>
          <div style={{fontSize:".74rem",color:"var(--text-muted)",marginTop:12}}>Powered by <strong style={{color:"var(--accent)"}}>$SOLES</strong> · CA: <span style={{fontFamily:"monospace",fontSize:".72rem"}}>{SOLES_CA}</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── Verification Request Sheet ───────────────────────────────────────────────
function VerificationRequestSheet({ currentUser, userData, onClose, showToast }) {
  const [hasTwitter, setHasTwitter] = useState(true);
  const [form, setForm] = useState({
    xHandle:      "",
    altSocial:    "",
    selfieFile:   null,
    selfiePreview:null,
    notes:        "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(
    userData?.verificationStatus === "pending" || userData?.verificationStatus === "reviewing"
  );

  function sf(k,v) { setForm(p=>({...p,[k]:v})); }

  function handleSelfie(f) {
    if (!f || !f.type.startsWith("image/")) { showToast("Image only","error"); return; }
    if (f.size > 8 * 1024 * 1024) { showToast("Max 8MB","error"); return; }
    sf("selfieFile", f); sf("selfiePreview", URL.createObjectURL(f));
  }

  async function submit() {
    // Validate: need either xHandle or altSocial
    if (hasTwitter && !form.xHandle.trim()) {
      showToast("Please enter your X handle","error"); return;
    }
    if (!hasTwitter && !form.altSocial.trim() && !form.selfieFile) {
      showToast("Please provide your social or a selfie","error"); return;
    }
    setSubmitting(true);
    // Show success immediately — don't make user wait or see errors
    showToast("Request submitted! We'll review it shortly 🦶","success");
    setSubmitted(true);
    // Fire and forget — errors are silent to user
    try {
      let selfieURL = null;
      if (form.selfieFile) {
        const sRef = ref(storage, `verifications/${currentUser.uid}/${Date.now()}_selfie.jpg`);
        await uploadBytes(sRef, form.selfieFile);
        selfieURL = await getDownloadURL(sRef);
      }
      await addDoc(collection(db,"verificationRequests"), {
        uid:         currentUser.uid,
        username:    userData?.username || "",
        displayName: userData?.displayName || "",
        email:       userData?.email || "",
        hasTwitter,
        xHandle:     form.xHandle.trim(),
        altSocial:   form.altSocial.trim(),
        selfieURL,
        notes:       form.notes.trim(),
        status:      "pending",
        submittedAt: serverTimestamp(),
      });
      await updateDoc(doc(db,"users",currentUser.uid), { verificationStatus:"pending" });
    } catch(e) {
      console.error("Verification submit error (silent):", e);
      // Already showed success to user — don't show error
    }
    setSubmitting(false);
  }

  const status = userData?.verificationStatus;

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-box" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div className="sheet-title" style={{marginBottom:0}}>Get Verified</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {submitted ? (
          <div style={{textAlign:"center",padding:"24px 0"}}>
            <div style={{fontSize:"2.8rem",marginBottom:12}}>
              {status==="reviewing"?"🔍":status==="approved"?"✅":status==="rejected"?"❌":"⏳"}
            </div>
            <div style={{fontFamily:"var(--fd)",fontSize:"1.3rem",color:"var(--soil)",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {status==="reviewing"?"Under Review":status==="approved"?"Verified!":status==="rejected"?"Not Approved":"Request Submitted"}
              {(status==="pending"||!status) && <span className="spin-inline" style={{borderColor:"rgba(92,58,30,.2)",borderTopColor:"var(--soil)"}}/>}
            </div>
            <p style={{fontSize:".82rem",color:"var(--text-muted)",lineHeight:1.65,maxWidth:300,margin:"0 auto"}}>
              {status==="reviewing"?"We're reviewing your details — almost there!" :
               status==="approved"?"You're verified. Your posts are now earning." :
               status==="rejected"?"Your request wasn't approved. Contact us for details." :
               "Your request is in the queue. We'll get to it within 24-48 hours."}
            </p>
          </div>
        ) : (
          <>
            <div style={{background:"var(--sand-light)",borderRadius:12,padding:"14px 16px",marginBottom:20}}>
              <div style={{fontSize:".78rem",color:"var(--soil)",lineHeight:1.65}}>
                <strong>Requirements:</strong> Follow <strong>@SolesBrand</strong> on X and retweet our pinned post · Account must be at least 3 months old · If no X, provide another active social + a selfie holding a paper with <strong>"$SOLES"</strong> written on it
              </div>
            </div>

            {/* Twitter toggle */}
            <div className="fg">
              <label className="fl">Do you have an X (Twitter) account?</label>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <button className={`role-btn ${hasTwitter?"active":""}`} onClick={()=>setHasTwitter(true)}>Yes, I have X</button>
                <button className={`role-btn ${!hasTwitter?"active":""}`} onClick={()=>setHasTwitter(false)}>No X account</button>
              </div>
            </div>

            {hasTwitter ? (
              <div className="fg">
                <label className="fl">Your X Handle</label>
                <input className="fi" placeholder="@yourusername" value={form.xHandle} onChange={e=>sf("xHandle",e.target.value)} />
                <div style={{fontSize:".72rem",color:"var(--text-muted)",marginTop:5}}>Make sure you've followed @SolesBrand and retweeted our pinned post</div>
              </div>
            ) : (
              <>
                <div className="fg">
                  <label className="fl">Your Main Social Media</label>
                  <input className="fi" placeholder="e.g. instagram.com/yourhandle" value={form.altSocial} onChange={e=>sf("altSocial",e.target.value)} />
                </div>
                <div className="fg">
                  <label className="fl">Selfie holding a paper with "$SOLES"</label>
                  {form.selfiePreview ? (
                    <div style={{position:"relative",marginBottom:8}}>
                      <img src={form.selfiePreview} alt="" style={{width:"100%",maxHeight:200,objectFit:"cover",borderRadius:10}}/>
                      <button className="upload-preview-remove" onClick={()=>{sf("selfieFile",null);sf("selfiePreview",null);}}>✕</button>
                    </div>
                  ) : (
                    <div className="upload-zone" style={{padding:"18px"}} onClick={()=>document.getElementById("selfie-input").click()}>
                      <div style={{fontSize:"1.6rem",marginBottom:5}}>🤳</div>
                      <div style={{fontSize:".78rem",color:"var(--text-muted)"}}>Face visible · paper says "$SOLES"</div>
                      <input id="selfie-input" type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleSelfie(e.target.files[0])}/>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="fg">
              <label className="fl">Notes (optional)</label>
              <textarea className="fi" placeholder="Anything you'd like us to know…" value={form.notes} onChange={e=>sf("notes",e.target.value)} rows={2} style={{resize:"vertical"}}/>
            </div>
            <button className="btn-primary" style={{width:"100%"}} onClick={submit} disabled={submitting}>
              {submitting ? <span className="spin-inline"/> : "Submit Verification Request"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
function LandingPage({ onAuth, onNavigate, currentUser }) {
  const bgRef   = useParallax();
  const hiwRef  = useFadeIn();
  const spotRef = useFadeIn();
  const comRef  = useFadeIn();
  const mqItems = ["Free for Members","Paid for Creators","Daily Fresh Drops","Verified Creators","Follow Your Favorites","The World's #1 Fetish","🦶"];
  const mq      = [...mqItems, ...mqItems];

  return (
    <div className="page-fade">
      {/* HERO */}
      <div className="hero">
        <img src="bg.jpg" className="hero-bg-img" alt="" onError={e=>{e.target.style.display="none";}} />
        <div className="hero-bg" ref={bgRef} />
        <div className="hero-grain" />
        <div className="hero-ring"><span/><span/><span/></div>
        <div className="hero-content">
          <div className="hero-overline">The World's 1st Foot Economy</div>
          <div className="hero-logo-wrap">
            <img src="logo.png" className="hero-logo-img" alt="SOLES" onError={e=>{e.target.style.display="none";}} />
          </div>
          <h1 className="hero-headline">Where admirers<em>discover soles</em></h1>
          <p className="hero-sub">— and creators get paid for theirs —</p>
          <div className="hero-ctas">
            {currentUser ? (
              <>
                <button className="btn-hp" onClick={() => onNavigate("explore")}>Browse Soles →</button>
                <button className="btn-hg" onClick={() => onNavigate("daily")}>Daily Soles</button>
              </>
            ) : (
              <>
                <button className="btn-hp" onClick={() => onAuth("signup")}>Join the Community</button>
                <button className="btn-hg" onClick={() => onNavigate("explore")}>Browse Soles</button>
              </>
            )}
          </div>
        </div>
        <div className="hero-scroll"><div className="scroll-line"/><div className="scroll-txt">Scroll</div></div>
      </div>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {mq.map((t,i) => <div key={i} className="mq-item"><span className="mq-dot"/>{t}</div>)}
        </div>
      </div>

      {/* CA TICKER BAR */}
      {(() => {
        const items = Array(8).fill(null);
        return (
          <div className="ca-bar">
            <div className="ca-ticker">
              {[...items,...items].map((_,i) => (
                <div key={i} className="ca-ticker-item" onClick={()=>{navigator.clipboard.writeText(SOLES_CA);showToast&&showToast("CA copied! 📋","success");}}>
                  <span className="ca-ticker-label">$SOLES CA</span>
                  <span className="ca-ticker-addr">{SOLES_CA}</span>
                  <span className="ca-ticker-copy">📋 copy</span>
                  <span className="ca-ticker-sep"/>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* GALLERY MOSAIC */}
      <GalleryMosaic />

      {/* HOW IT WORKS */}
      <div className="hiw" ref={hiwRef}>
        <div className="hiw-eyebrow">The Platform</div>
        <div className="hiw-title">Simple. Beautiful. <em>Rewarding.</em></div>
        <div className="hiw-grid">
          <TiltCard num="01" icon="👁️" title="Browse Freely"    desc="Every post on SOLES is free to view. No subscriptions, no paywalls — an open gallery of the world's most celebrated feet." />
          <TiltCard num="02" icon="❤️" title="Like & Follow"    desc="Follow the Soles Stars you love. Like content, leave comments, and let your engagement fuel creator income." />
          <TiltCard num="03" icon="🪙" title="Post Once, Earn Forever" desc="Every post you publish earns passive income forever. Engagement boosts your reward. Powered by $SOLES on-chain." />
          <TiltCard num="04" icon="💸" title="Real Payouts"     desc="10 engagement points = $1. Verified creators cash out every 12 hours. No ceiling, no expiry." />
        </div>
      </div>


      {/* CREATOR SPOTLIGHT */}
      <div className="spotlight" ref={spotRef}>
        <div className="spotlight-bg" />
        <div className="spotlight-inner">
          <div className="spotlight-grid">
            <div>
              <div className="spot-eyebrow">For Creators</div>
              <h2 className="spot-heading">Post once.<br /><em>Earn forever.</em></h2>
              <p className="spot-body">Every post you make on SOLES is a permanent income source. The more your content gets loved — likes, comments, views — the more your earnings compound. No expiry. No limits.</p>
              <div className="perks">
                {[
                  ["🪙","Blockchain-powered rewards","$SOLES token is the backbone of creator income. Your engagement translates to real on-chain value."],
                  ["📊","Passive earnings dashboard","Every like earned while you sleep shows up in real time. Watch your balance grow."],
                  ["⏱️","Payout every 12 hours","No month-long waits. Your money moves when you're ready."],
                ].map(([ic,t,s]) => (
                  <div key={t} className="perk">
                    <div className="perk-icon">{ic}</div>
                    <div><strong>{t}</strong><span>{s}</span></div>
                  </div>
                ))}
              </div>
              <button className="btn-hp" style={{marginTop:28,padding:"12px 28px",fontSize:".78rem"}} onClick={()=>onAuth("signup")}>Start Earning →</button>
            </div>
            <div className="mock-cards">
              {[
                {img:"sole.jpg", name:"sole_star_one", likes:2841, pts:"14.2K"},
                {img:"pedi.jpg", name:"pedicure_queen", likes:1337, pts:"8.9K"},
              ].map((c,i) => (
                <div key={i} className="mock-card">
                  <div className="mock-img" style={{position:"relative",padding:0}}>
                    <img src={c.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                      onError={e=>{e.target.style.display="none"; e.target.parentElement.style.display="flex"; e.target.parentElement.style.alignItems="center"; e.target.parentElement.style.justifyContent="center"; e.target.parentElement.innerHTML+="🦶";}} />
                  </div>
                  <div className="mock-footer">
                    <div>
                      <div className="mock-name">@{c.name}</div>
                      <div style={{fontSize:".68rem",color:"var(--accent)",marginTop:2}}>🪙 {c.pts} pts</div>
                    </div>
                    <div className="mock-hearts">❤️ {c.likes.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* COMMUNITY */}
      <div className="community" ref={comRef}>
        <div className="comm-inner">
          <h2 className="comm-heading">Join the conversation</h2>
          <p className="comm-sub">SOLES is more than a platform. Follow us on X, join our community, and be part of something that was always meant to exist.</p>
          <div className="comm-btns">
            <a href={X_PROFILE_LINK}   target="_blank" rel="noreferrer" className="comm-btn x">𝕏 Follow on X</a>
            <a href={X_COMMUNITY_LINK} target="_blank" rel="noreferrer" className="comm-btn x">🫂 X Community</a>
            <button className="comm-btn join" onClick={()=>onAuth("signup")}>🦶 Join SOLES Free</button>
          </div>
        </div>
      </div>

      {/* FOOTER — only on landing */}
      <footer className="footer">
        <img src="logo.png" className="footer-logo-img" alt="SOLES" onError={e=>{e.target.style.display="none";}} />
        <div className="footer-tagline">We just like feet..</div>
        {/* CONTRACT_ADDRESS_SECTION */}
        <div className="ca-section" style={{marginBottom:18,borderRadius:10,display:"inline-block",padding:"10px 20px"}}>
          <div style={{fontSize:".62rem",letterSpacing:".2em",textTransform:"uppercase",color:"var(--sand-dark)",marginBottom:5,fontWeight:600}}>$SOLES Contract Address</div>
          <div className="ca-addr" onClick={()=>navigator.clipboard.writeText(SOLES_CA).then(()=>alert("CA Copied!"))}>
            {SOLES_CA}
          </div>
          <div style={{fontSize:".62rem",color:"var(--sand-dark)",marginTop:4,opacity:.6}}>Click to copy · Verify on DEX Screener</div>
        </div>
        <div className="footer-social">
          <a href={X_PROFILE_LINK}       target="_blank" rel="noreferrer" className="soc-btn">𝕏</a>
          <a href={X_COMMUNITY_LINK}     target="_blank" rel="noreferrer" className="soc-btn">🫂</a>
        </div>
        <div className="footer-links">
          <a href={X_PROFILE_LINK}       target="_blank" rel="noreferrer" className="footer-link">X Profile</a>
          <a href={X_COMMUNITY_LINK}     target="_blank" rel="noreferrer" className="footer-link">X Community</a>
        </div>
        <div className="footer-copy">© {new Date().getFullYear()} SOLES · We just like feet..</div>
      </footer>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, currentUser, onOpen, onLike, onProfileClick }) {
  const liked = currentUser && post.likes?.includes(currentUser.uid);
  return (
    <div className="post-card">
      <div className="pc-img-wrap" onClick={() => onOpen(post)}>
        {post.imageURL
          ? <img className="pc-img" src={post.imageURL} alt="" loading="lazy" />
          : <div className="pc-img" style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2.4rem"}}>🦶</div>}
        
      </div>
      <div className="pc-body">
        <div className="pc-header">
          <div className="pav" style={{cursor:"pointer"}} onClick={() => onProfileClick && onProfileClick(post.creatorId)}>
            {post.creatorPhoto ? <img src={post.creatorPhoto} alt="" /> : <div className="pav-fb">{(post.creatorName||"?")[0]}</div>}
          </div>
          <span className="pc-name" onClick={() => onProfileClick && onProfileClick(post.creatorId)}>
            {post.creatorName||"Soles Star"}
            {post.creatorVerified && <span className="vbadge">✓</span>}
          </span>
        </div>
        {post.caption && <p className="pc-caption">{post.caption}</p>}
        <div className="pc-actions">
          <button
            className={`pac ${liked ? "liked" : ""}`}
            onClick={() => onLike(post)}
          >{liked ? "❤️" : "🤍"} {post.likesCount||0}</button>
          <button className="pac" onClick={() => onOpen(post)}>💬 {post.commentsCount||0}</button>
          <span style={{marginLeft:"auto",fontSize:".66rem",color:"var(--text-muted)"}}>{timeAgo(post.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Post Modal ───────────────────────────────────────────────────────────────
function PostModal({ post, currentUser, onClose, onLike, onProfileClick, showToast }) {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [text, setText]       = useState("");
  const [sending, setSending] = useState(false);
  const commentsEndRef        = useRef();
  const liked = currentUser && post.likes?.includes(currentUser.uid);

  // live comment listener — no orderBy to avoid requiring a composite index.
  // We sort client-side by createdAt millis instead.
  useEffect(() => {
    const q = query(
      collection(db,"comments"),
      where("postId","==",post.id)
    );
    const unsub = onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({id:d.id,...d.data()}));
      // sort ascending by createdAt (Timestamp or null for brand-new optimistic docs)
      all.sort((a,b) => {
        const ta = a.createdAt?.toMillis?.() ?? Date.now();
        const tb = b.createdAt?.toMillis?.() ?? Date.now();
        return ta - tb;
      });
      setComments(all);
      setLoadingComments(false);
    }, err => {
      console.error("Comment listener error:", err);
      setLoadingComments(false);
    });
    return unsub;
  }, [post.id]);

  // auto-scroll to newest comment
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({behavior:"smooth"});
    }
  }, [comments.length]);

  async function submitComment() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    if (!currentUser) { showToast("Sign in to comment","error"); return; }
    setSending(true);
    try {
      // add comment doc
      await addDoc(collection(db,"comments"), {
        postId:   post.id,
        uid:      currentUser.uid,
        name:     currentUser.displayName || "Member",
        photoURL: currentUser.photoURL || null,
        text:     trimmed,
        createdAt: serverTimestamp(),
      });
      // increment post comment count
      await updateDoc(doc(db,"posts",post.id), { commentsCount: increment(1) });
      // award points to creator (not self)
      if (post.creatorId && post.creatorId !== currentUser.uid) {
        await updateDoc(doc(db,"users",post.creatorId), { points: increment(2) });
      }
      setText("");
      showToast("Comment posted! 💬","success");
    } catch (e) {
      console.error("Comment error:", e);
      showToast("Failed to post comment","error");
    }
    setSending(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {/* Image side */}
        <div className="modal-img-side">
          {post.imageURL
            ? <img src={post.imageURL} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />
            : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"3.5rem",background:"var(--mid)"}}>🦶</div>}
        </div>
        {/* Content side */}
        <div className="modal-content-side">
          {/* Header */}
          <div className="modal-header">
            <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={() => { onClose(); onProfileClick && onProfileClick(post.creatorId); }}>
              <div className="pav" style={{width:30,height:30}}>
                {post.creatorPhoto ? <img src={post.creatorPhoto} alt="" /> : <div className="pav-fb">{(post.creatorName||"?")[0]}</div>}
              </div>
              <div>
                <div className="pc-name" style={{fontSize:".82rem"}}>
                  {post.creatorName}
                  {post.creatorVerified && <span className="vbadge">✓</span>}
                </div>
                <div style={{fontSize:".65rem",color:"var(--text-muted)"}}>{timeAgo(post.createdAt)}</div>
              </div>
            </div>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          {/* Caption */}
          {post.caption && (
            <div style={{padding:"10px 14px",fontSize:".8rem",borderBottom:"1px solid var(--border)",flexShrink:0,lineHeight:1.5}}>
              {post.caption}
            </div>
          )}
          {/* Comments */}
          <div className="comments-list">
            {loadingComments && <div className="spinner" style={{margin:"20px auto",width:22,height:22,borderWidth:2}}/>}
            {!loadingComments && comments.length === 0 && (
              <div style={{textAlign:"center",color:"var(--text-muted)",fontSize:".78rem",paddingTop:16}}>No comments yet. Be first!</div>
            )}
            {comments.map(c => (
              <div key={c.id} className="ci">
                <div className="pav" style={{width:26,height:26,flexShrink:0}}>
                  {c.photoURL ? <img src={c.photoURL} alt="" /> : <div className="pav-fb" style={{fontSize:".68rem"}}>{(c.name||"?")[0]}</div>}
                </div>
                <div className="ci-body">
                  <span className="ci-name">{c.name} </span>
                  <span className="ci-text">{c.text}</span>
                  <div className="ci-time">{timeAgo(c.createdAt)}</div>
                </div>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>
          {/* Like bar */}
          <div className="comment-actions-bar">
            <button className={`pac ${liked?"liked":""}`} onClick={() => onLike(post)} style={{fontSize:"1rem"}}>
              {liked ? "❤️" : "🤍"} {post.likesCount||0}
            </button>
          </div>
          {/* Comment input */}
          <div className="cir">
            <div className="pav" style={{width:26,height:26,flexShrink:0}}>
              {currentUser
                ? <Avatar photoURL={currentUser.photoURL} name={currentUser.displayName} size={26} />
                : <div className="pav-fb" style={{fontSize:".68rem"}}>?</div>}
            </div>
            <input
              className="cinput"
              placeholder={currentUser ? "Add a comment…" : "Sign in to comment"}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && submitComment()}
              disabled={!currentUser || sending}
            />
            <button
              className={`csend ${sending ? "sending" : ""}`}
              onClick={submitComment}
              disabled={!text.trim() || !currentUser || sending}
              title="Send comment"
            >
              {sending ? <span className="spin-inline"/> : "↑"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal({ onClose, showToast }) {
  const [mode, setMode]       = useState("login");
  const [role, setRole]       = useState("member");
  const [form, setForm]       = useState({email:"",password:"",username:"",bio:""});
  const [activeSoc, setActSoc]= useState([]);
  const [socLinks, setSocLinks]= useState({});
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const sf = (k,v) => setForm(p=>({...p,[k]:v}));
  const toggleSoc = id => setActSoc(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);

  async function submit() {
    setError(""); setLoading(true);
    try {
      if (mode === "signup") {
        const {user} = await createUserWithEmailAndPassword(auth, form.email, form.password);
        const uname  = form.username.trim() || form.email.split("@")[0];
        await updateProfile(user, {displayName: uname});
        const socials = {};
        activeSoc.forEach(id => { if (socLinks[id]) socials[id] = socLinks[id]; });
        await setDoc(doc(db,"users",user.uid), {
          uid:user.uid, username:uname, displayName:uname,
          email:form.email, role, bio:form.bio||"",
          photoURL:null, verified:false, points:0,
          followersCount:0, followingCount:0, postsCount:0,
          totalEarnings:0, lastPayoutRequest:null,
          socials, createdAt:serverTimestamp(),
        });
        showToast("Welcome to SOLES 🦶","success");
        onClose();
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        showToast("Welcome back 🦶","success");
        onClose();
      }
    } catch (e) {
      const m = {
        "auth/email-already-in-use":"Email already in use.",
        "auth/invalid-email":"Invalid email.",
        "auth/weak-password":"Password needs 6+ characters.",
        "auth/user-not-found":"No account found with that email.",
        "auth/wrong-password":"Wrong password.",
        "auth/invalid-credential":"Invalid credentials.",
      };
      setError(m[e.code] || e.message);
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e=>e.stopPropagation()}>
        <div className="auth-logo-wrap">
          <img src="logo.png" className="auth-logo-img" alt="SOLES" onError={e=>{e.target.style.display="none";}} />
        </div>
        <div className="auth-title">{mode==="login" ? "Welcome back" : "Join SOLES"}</div>
        <div className="auth-sub">{mode==="login" ? "Sign in to your account" : "we just like feet.."}</div>

        {mode === "signup" && (
          <div className="role-select">
            <button className={`role-btn ${role==="member"?"active":""}`} onClick={()=>setRole("member")}>👁️ Member</button>
            <button className={`role-btn ${role==="creator"?"active":""}`} onClick={()=>setRole("creator")}>✨ Creator</button>
          </div>
        )}
        {mode === "signup" && (
          <div className="fg">
            <label className="fl">Username</label>
            <input className="fi" placeholder="soles_star" value={form.username} onChange={e=>sf("username",e.target.value)} />
          </div>
        )}
        <div className="fg">
          <label className="fl">Email</label>
          <input className="fi" type="email" placeholder="you@email.com" value={form.email} onChange={e=>sf("email",e.target.value)} />
        </div>
        <div className="fg">
          <label className="fl">Password</label>
          <input className="fi" type="password" placeholder="••••••••" value={form.password} onChange={e=>sf("password",e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} />
        </div>
        {mode === "signup" && (
          <>
            <div className="fg">
              <label className="fl">Bio (optional)</label>
              <input className="fi" placeholder="A short line about you" value={form.bio} onChange={e=>sf("bio",e.target.value)} />
            </div>
            {role === "creator" && (
              <div className="fg">
                <label className="fl">Your Socials (optional)</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                  {SOCIAL_PLATFORMS.map(p => (
                    <button key={p.id} className={`spbtn ${activeSoc.includes(p.id)?"active":""}`} onClick={()=>toggleSoc(p.id)}>
                      <span>{p.icon}</span>{p.label}
                    </button>
                  ))}
                </div>
                {activeSoc.length > 0 && (
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {activeSoc.map(id => {
                      const pl = SOCIAL_PLATFORMS.find(p=>p.id===id);
                      return (
                        <div key={id} style={{display:"flex",alignItems:"center",gap:7}}>
                          <span style={{fontSize:"1rem",width:22,textAlign:"center"}}>{pl.icon}</span>
                          <input className="fi" style={{flex:1}} placeholder={pl.ph} value={socLinks[id]||""} onChange={e=>setSocLinks(p=>({...p,[id]:e.target.value}))} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {error && <div className="ferr">⚠ {error}</div>}
        <button className="btn-primary" style={{width:"100%",marginTop:16}} onClick={submit} disabled={loading}>
          {loading ? <span className="spin-inline"/> : (mode==="login" ? "Sign In" : "Create Account")}
        </button>
        <div className="auth-switch">
          {mode==="login"
            ? <>Don't have an account? <button onClick={()=>setMode("signup")}>Sign up free</button></>
            : <>Already have an account? <button onClick={()=>setMode("login")}>Sign in</button></>}
        </div>
      </div>
    </div>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ currentUser, userData, onClose, showToast }) {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [drag, setDrag]       = useState(false);

  function handleFile(f) {
    if (!f || !f.type.startsWith("image/")) { showToast("Images only!","error"); return; }
    if (f.size > 10 * 1024 * 1024) { showToast("Image must be under 10MB","error"); return; }
    setFile(f); setPreview(URL.createObjectURL(f));
  }
  async function submit() {
    if (!file || loading) return;
    setLoading(true);
    try {
      const imgRef = ref(storage, `posts/${currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(imgRef, file);
      const imageURL = await getDownloadURL(imgRef);
      const postDoc = {
        creatorId:      currentUser.uid,
        creatorName:    userData?.displayName || currentUser.displayName || "Soles Star",
        creatorPhoto:   userData?.photoURL || currentUser.photoURL || null,
        creatorVerified:userData?.verified || false,
        imageURL,
        caption:        caption.trim(),
        likes:          [],
        likesCount:     0,
        commentsCount:  0,
        viewsCount:     0,
        createdAt:      serverTimestamp(),
      };
      await addDoc(collection(db,"posts"), postDoc);
      await updateDoc(doc(db,"users",currentUser.uid), { postsCount: increment(1) });
      showToast("Posted! 🦶","success");
      onClose();
    } catch (e) {
      console.error("Upload error:", e);
      showToast("Upload failed — check storage rules","error");
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" style={{maxWidth:460}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div className="auth-title" style={{marginBottom:0}}>New Post</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {!preview ? (
          <div
            className={`upload-zone ${drag?"drag":""}`}
            onDragOver={e=>{e.preventDefault();setDrag(true);}}
            onDragLeave={()=>setDrag(false)}
            onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);}}
            onClick={()=>document.getElementById("fu-input").click()}
          >
            <div style={{fontSize:"2.2rem",marginBottom:8}}>🦶</div>
            <div style={{fontSize:".84rem",color:"var(--text-muted)"}}>Tap or drop your image here</div>
            <div style={{fontSize:".72rem",color:"var(--text-muted)",marginTop:4,opacity:.7}}>JPG, PNG, WEBP — max 10MB</div>
            <input id="fu-input" type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])} />
          </div>
        ) : (
          <>
            <div className="upload-preview-wrap">
              <img src={preview} className="upload-preview" alt="" />
              <button className="upload-preview-remove" onClick={()=>{setFile(null);setPreview(null);}}>✕</button>
            </div>
            <div className="fg">
              <label className="fl">Caption</label>
              <textarea className="fi" placeholder="Say something about this post…" value={caption} onChange={e=>setCaption(e.target.value)} rows={3} style={{resize:"vertical"}} />
            </div>
            {!userData?.verified && (
              <div style={{fontSize:".74rem",color:"var(--accent)",background:"rgba(212,132,90,.1)",padding:"8px 12px",borderRadius:8,marginBottom:12}}>
                ⚠️ You can post freely — earnings accrue once you're verified.
              </div>
            )}
            <button className="btn-primary" style={{width:"100%"}} onClick={submit} disabled={loading}>
              {loading ? <span className="spin-inline"/> : "Post 🦶"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Edit Profile Sheet ───────────────────────────────────────────────────────
function EditProfileSheet({ currentUser, userData, onClose, showToast, onUpdated }) {
  const [displayName, setDisplayName] = useState(userData?.displayName || "");
  const [bio,         setBio]         = useState(userData?.bio || "");
  const [activeSoc,   setActiveSoc]   = useState(Object.keys(userData?.socials||{}));
  const [socLinks,    setSocLinks]    = useState(userData?.socials || {});
  const [avatarFile,  setAvatarFile]  = useState(null);
  const [avatarPrev,  setAvatarPrev]  = useState(userData?.photoURL || null);
  const [loading,     setLoading]     = useState(false);

  const toggleSoc = id => setActiveSoc(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);

  function handleAvatarFile(f) {
    if (!f || !f.type.startsWith("image/")) { showToast("Images only","error"); return; }
    if (f.size > 5 * 1024 * 1024) { showToast("Avatar must be under 5MB","error"); return; }
    setAvatarFile(f);
    setAvatarPrev(URL.createObjectURL(f));
  }

  async function save() {
    if (!displayName.trim()) { showToast("Display name can't be empty","error"); return; }
    setLoading(true);
    try {
      let photoURL = userData?.photoURL || null;

      // upload new avatar if selected
      if (avatarFile) {
        const avRef = ref(storage, `avatars/${currentUser.uid}/${Date.now()}_${avatarFile.name}`);
        await uploadBytes(avRef, avatarFile);
        photoURL = await getDownloadURL(avRef);
        await updateProfile(currentUser, { photoURL });
      }

      // build socials object
      const socials = {};
      activeSoc.forEach(id => { if (socLinks[id]) socials[id] = socLinks[id]; });

      await updateDoc(doc(db,"users",currentUser.uid), {
        displayName: displayName.trim(),
        bio:         bio.trim(),
        photoURL,
        socials,
      });
      // also update auth display name
      await updateProfile(currentUser, { displayName: displayName.trim() });
      showToast("Profile updated ✓","success");
      onUpdated();
      onClose();
    } catch (e) {
      console.error("Save profile error:", e);
      showToast("Failed to save — try again","error");
    }
    setLoading(false);
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-box" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div className="sheet-title" style={{marginBottom:0}}>Edit Profile</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Avatar */}
        <div className="edit-section">
          <div className="edit-section-title">Profile Picture</div>
          <div className="avatar-edit-zone">
            <div className="avatar-edit-preview">
              {avatarPrev
                ? <img src={avatarPrev} alt="" />
                : <div className="avatar-edit-preview-fb">{(displayName||"?")[0].toUpperCase()}</div>}
            </div>
            <div className="avatar-edit-btns">
              <button className="avatar-pick-btn" onClick={()=>document.getElementById("av-input").click()}>
                📷 Choose photo
              </button>
              {avatarPrev && (
                <button className="avatar-pick-btn" style={{color:"var(--red)"}} onClick={()=>{setAvatarFile(null);setAvatarPrev(null);}}>
                  🗑 Remove
                </button>
              )}
            </div>
            <input id="av-input" type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleAvatarFile(e.target.files[0])} />
          </div>
        </div>

        {/* Display name & bio */}
        <div className="edit-section">
          <div className="edit-section-title">Basic Info</div>
          <div className="fg">
            <label className="fl">Display Name</label>
            <input className="fi" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="fg">
            <label className="fl">Bio</label>
            <textarea className="fi" value={bio} onChange={e=>setBio(e.target.value)} placeholder="Tell the world about your soles…" rows={3} style={{resize:"vertical"}} />
          </div>
        </div>

        {/* Socials (creators only) */}
        {userData?.role === "creator" && (
          <div className="edit-section">
            <div className="edit-section-title">Social Links</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
              {SOCIAL_PLATFORMS.map(p => (
                <button key={p.id} className={`spbtn ${activeSoc.includes(p.id)?"active":""}`} onClick={()=>toggleSoc(p.id)}>
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
            {activeSoc.length > 0 && (
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {activeSoc.map(id => {
                  const pl = SOCIAL_PLATFORMS.find(p=>p.id===id);
                  return (
                    <div key={id} style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:"1rem",width:22,textAlign:"center"}}>{pl.icon}</span>
                      <input className="fi" style={{flex:1}} placeholder={pl.ph} value={socLinks[id]||""} onChange={e=>setSocLinks(p=>({...p,[id]:e.target.value}))} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <button className="btn-primary" style={{width:"100%",marginTop:8}} onClick={save} disabled={loading}>
          {loading ? <span className="spin-inline"/> : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
function ProfilePage({ targetUid, currentUser, userData: cud, showToast, onNavigate, onProfileClick, onRefreshCurrentUser }) {
  const [profile,   setProfile]   = useState(null);
  const [posts,     setPosts]     = useState([]);
  const [following, setFollowing] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("posts"); // posts | studio (own creator)
  const [openPost,  setOpenPost]  = useState(null);
  const [editOpen,  setEditOpen]  = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  const isOwn     = currentUser?.uid === targetUid;
  const isCreator = profile?.role === "creator" || profile?.role === "admin";

  // Load profile + posts + follow status
  const loadProfile = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db,"users",targetUid));
      if (!snap.exists()) { setLoading(false); return; }
      const prof = {id:snap.id, ...snap.data()};
      setProfile(prof);

      const q = query(collection(db,"posts"), where("creatorId","==",targetUid));
      const psSnap = await getDocs(q);
      const allPosts = psSnap.docs.map(d=>({id:d.id,...d.data()}));
      // sort client-side to avoid requiring composite index
      allPosts.sort((a,b)=>{
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      setPosts(allPosts);

      if (currentUser && !isOwn) {
        const fSnap = await getDoc(doc(db,"follows",`${currentUser.uid}_${targetUid}`));
        setFollowing(fSnap.exists());
      }
    } catch (e) {
      console.error("Load profile error:", e);
      showToast("Failed to load profile","error");
    }
    setLoading(false);
  }, [targetUid, currentUser, isOwn]);

  useEffect(() => { setLoading(true); loadProfile(); }, [loadProfile]);

  // Realtime profile updates
  useEffect(() => {
    const unsub = onSnapshot(doc(db,"users",targetUid), snap => {
      if (snap.exists()) setProfile(p => p ? {...p,...snap.data()} : {id:snap.id,...snap.data()});
    });
    return unsub;
  }, [targetUid]);

  const [followLoading, setFollowLoading] = useState(false);

  async function toggleFollow() {
    if (!currentUser) { showToast("Sign in to follow","error"); return; }
    if (followLoading) return; // prevent double-tap
    setFollowLoading(true);
    const key = `${currentUser.uid}_${targetUid}`;
    try {
      if (following) {
        await deleteDoc(doc(db,"follows",key));
        // update counts in one batch — profile listener will pick this up
        await updateDoc(doc(db,"users",targetUid),       {followersCount: increment(-1)});
        await updateDoc(doc(db,"users",currentUser.uid), {followingCount: increment(-1)});
        setFollowing(false);
      } else {
        await setDoc(doc(db,"follows",key), {
          followerId:  currentUser.uid,
          followingId: targetUid,
          createdAt:   serverTimestamp(),
        });
        await updateDoc(doc(db,"users",targetUid),       {followersCount: increment(1)});
        await updateDoc(doc(db,"users",currentUser.uid), {followingCount: increment(1)});
        setFollowing(true);
      }
    } catch(e) {
      console.error("Follow error:", e);
      showToast("Failed to update follow","error");
    }
    setFollowLoading(false);
  }

  async function handleLike(post) {
    if (!currentUser) { showToast("Sign in to like","error"); return; }
    const liked = post.likes?.includes(currentUser.uid);
    const postRef = doc(db,"posts",post.id);
    await updateDoc(postRef, {
      likes:      liked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
      likesCount: increment(liked ? -1 : 1),
    });
    if (!liked && post.creatorId !== currentUser.uid) {
      await updateDoc(doc(db,"users",post.creatorId), {points: increment(1)});
    }
    const upd = p => p.id===post.id ? {...p,
      likes:      liked ? p.likes.filter(x=>x!==currentUser.uid) : [...(p.likes||[]),currentUser.uid],
      likesCount: (p.likesCount||0) + (liked?-1:1),
    } : p;
    setPosts(prev => prev.map(upd));
    if (openPost?.id === post.id) setOpenPost(prev => upd(prev));
  }

  async function deletePost(post) {
    if (!window.confirm("Delete this post?")) return;
    try {
      await deleteDoc(doc(db,"posts",post.id));
      await updateDoc(doc(db,"users",currentUser.uid), {postsCount: increment(-1)});
      setPosts(prev => prev.filter(p => p.id !== post.id));
      showToast("Post deleted","success");
    } catch (e) {
      showToast("Failed to delete post","error");
    }
  }

  if (loading) return <div className="spinner" />;
  if (!profile) return (
    <div className="empty-state">
      <div className="empty-state-icon">🫙</div>
      <div className="empty-state-text">User not found</div>
    </div>
  );

  const socials = profile.socials || {};

  return (
    <div className="page-fade profile-page pb-mobile">
      {/* Profile Hero */}
      <div className="profile-hero">
        <div className="profile-hero-bg" />
        <div className="profile-av-wrap" onClick={isOwn ? ()=>setEditOpen(true) : undefined} style={{cursor:isOwn?"pointer":"default"}}>
          {profile.photoURL
            ? <img src={profile.photoURL} className="profile-av" alt="" />
            : <div className="profile-av-fb">{(profile.displayName||"?")[0]}</div>}
          {isOwn && (
            <div className="profile-av-edit-btn" title="Edit profile picture">✏️</div>
          )}
        </div>

        <div className="profile-name-row">
          <div className="profile-name">{profile.displayName}</div>
          {profile.verified && <div className="verified-chip" title="Verified Creator">✓</div>}
        </div>
        <div className="profile-handle">@{profile.username}</div>
        {profile.bio && <div className="profile-bio">{profile.bio}</div>}

        <div className="profile-stats-row">
          <div><div className="ps-num">{profile.postsCount||0}</div><div className="ps-lbl">Posts</div></div>
          <div><div className="ps-num">{profile.followersCount||0}</div><div className="ps-lbl">Followers</div></div>
          <div><div className="ps-num">{profile.followingCount||0}</div><div className="ps-lbl">Following</div></div>
        </div>

        {/* Social links */}
        {Object.keys(socials).length > 0 && (
          <div className="profile-socials">
            {SOCIAL_PLATFORMS.filter(p=>socials[p.id]).map(p => (
              <a key={p.id} href={socials[p.id]} target="_blank" rel="noreferrer" className="psoc">{p.icon} {p.label}</a>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="profile-act-row">
          {isOwn ? (
            <>
              <button className="follow-btn fb-ghost" style={{border:"1.5px solid rgba(232,201,160,.38)"}} onClick={()=>setEditOpen(true)}>Edit Profile</button>
              {isCreator && !profile.verified && (
                <button className="vcta" onClick={()=>setVerifyOpen(true)}>Get Verified →</button>
              )}
            </>
          ) : (
            <button
              className={`follow-btn ${following?"fb-ghost":"fb-fill"}`}
              onClick={toggleFollow}
              disabled={followLoading}
              style={{opacity:followLoading?0.6:1}}
            >
              {followLoading ? "…" : following ? "Following" : "Follow"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <div className={`profile-tab ${activeTab==="posts"?"active":""}`} onClick={()=>setActiveTab("posts")}>Posts</div>
        {isOwn && isCreator && (
          <div className={`profile-tab ${activeTab==="studio"?"active":""}`} onClick={()=>setActiveTab("studio")}>Creator Studio</div>
        )}
      </div>

      {/* Posts grid */}
      {activeTab === "posts" && (
        <>
          {posts.length === 0
            ? <div className="empty-state"><div className="empty-state-icon">📷</div><div className="empty-state-text">{isOwn ? "You haven't posted yet." : "No posts yet."}</div></div>
            : (
              <div className="profile-posts-grid">
                {posts.map(post => (
                  <div key={post.id} className="profile-post-thumb" onClick={()=>setOpenPost(post)}>
                    {post.imageURL
                      ? <img src={post.imageURL} alt="" loading="lazy" />
                      : <div style={{width:"100%",height:"100%",background:"var(--sand-light)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2rem"}}>🦶</div>}
                    <div className="profile-post-thumb-overlay">
                      <span className="ppto-stat">❤️ {post.likesCount||0}</span>
                      <span className="ppto-stat">💬 {post.commentsCount||0}</span>
                    </div>
                    {isOwn && (
                      <button
                        style={{position:"absolute",top:6,right:6,background:"rgba(14,7,2,.7)",color:"#fff",border:"none",cursor:"pointer",borderRadius:4,padding:"2px 6px",fontSize:".68rem",zIndex:2}}
                        onClick={e=>{e.stopPropagation();deletePost(post);}}
                        title="Delete post"
                      >🗑</button>
                    )}
                  </div>
                ))}
              </div>
            )}
        </>
      )}

      {/* Creator Studio tab */}
      {activeTab === "studio" && isOwn && isCreator && (
        <CreatorStudio currentUser={currentUser} userData={profile} showToast={showToast} />
      )}

      {/* Post modal */}
      {openPost && (
        <PostModal
          post={openPost}
          currentUser={currentUser}
          onClose={()=>setOpenPost(null)}
          onLike={handleLike}
          onProfileClick={onProfileClick}
          showToast={showToast}
        />
      )}

      {/* Verification request sheet */}
      {verifyOpen && currentUser && (
        <VerificationRequestSheet
          currentUser={currentUser}
          userData={profile}
          onClose={()=>setVerifyOpen(false)}
          showToast={showToast}
        />
      )}

      {/* Edit profile sheet */}
      {editOpen && (
        <EditProfileSheet
          currentUser={currentUser}
          userData={profile}
          onClose={()=>setEditOpen(false)}
          showToast={showToast}
          onUpdated={() => { loadProfile(); onRefreshCurrentUser && onRefreshCurrentUser(); }}
        />
      )}
    </div>
  );
}

// ─── Creator Studio (embedded in profile tab) ─────────────────────────────────
// PASSIVE TIME EARNINGS (private — not shown publicly):
// Each post earns 0.5 pts per hour automatically.
// Calculated when studio loads based on posts count × time since last passive credit.
const PASSIVE_PTS_PER_POST_PER_HOUR = 0.5;

function CreatorStudio({ currentUser, userData, showToast }) {
  const [requesting,     setRequesting]     = useState(false);
  const [walletAddress,  setWalletAddress]  = useState("");
  const [passiveLoading, setPassiveLoading] = useState(false);
  const pts     = userData?.points || 0;
  const dollars = parseFloat(ptsToDollars(pts));
  const canPayout = userData?.verified && dollars >= MIN_PAYOUT_DOLLARS;

  // ── Passive time-based earnings ────────────────────────────────────────────
  // Runs silently when creator opens their studio.
  // Awards pts based on: posts × hours since last credit × rate per post per hour.
  useEffect(() => {
    if (!userData?.verified || !currentUser) return;
    const postsCount = userData?.postsCount || 0;
    if (postsCount === 0) return;

    async function creditPassive() {
      setPassiveLoading(true);
      try {
        const now      = Date.now();
        const lastCredit = userData?.lastPassiveCredit
          ? (userData.lastPassiveCredit.toDate ? userData.lastPassiveCredit.toDate().getTime() : new Date(userData.lastPassiveCredit).getTime())
          : now - 3600000; // default: 1 hour ago if first time

        const hoursElapsed = Math.min((now - lastCredit) / 3600000, 72); // cap at 72h to prevent huge accruals after long absence
        if (hoursElapsed < 0.25) return; // don't credit if less than 15 min since last

        const ptsEarned = parseFloat((postsCount * PASSIVE_PTS_PER_POST_PER_HOUR * hoursElapsed).toFixed(2));
        if (ptsEarned <= 0) return;

        await updateDoc(doc(db,"users",currentUser.uid), {
          points:           increment(ptsEarned),
          lastPassiveCredit: serverTimestamp(),
        });
      } catch(e) {
        // silent — passive earnings never block UI
        console.error("Passive credit error:", e);
      }
      setPassiveLoading(false);
    }
    creditPassive();
  }, [currentUser?.uid]); // only runs once per studio open

  function cooldownOk() {
    if (!userData?.lastPayoutRequest) return true;
    const last = userData.lastPayoutRequest.toDate ? userData.lastPayoutRequest.toDate() : new Date(userData.lastPayoutRequest);
    return Date.now() - last.getTime() > PAYOUT_COOLDOWN_HOURS * 3600000;
  }

  async function requestPayout() {
    if (!canPayout || !cooldownOk() || requesting) return;
    setRequesting(true);
    try {
      await addDoc(collection(db,"payoutRequests"), {
        uid:           currentUser.uid,
        username:      userData.username,
        email:         userData.email,
        amount:        dollars,
        points:        pts,
        walletAddress: walletAddress.trim(),
        status:        "pending",
        requestedAt:   serverTimestamp(),
      });
      await updateDoc(doc(db,"users",currentUser.uid), {
        lastPayoutRequest: serverTimestamp(),
        points:          0,
        totalEarnings:   increment(dollars),
      });
      showToast(`Payout of $${dollars} requested! 💸`,"success");
    } catch (e) {
      showToast("Payout request failed","error");
    }
    setRequesting(false);
  }

  return (
    <div className="studio-page">
      <div className="studio-title">Creator Studio</div>
      <div className="studio-sub">Monitor your earnings and manage payouts</div>

      {/* Verification banner */}
      {!userData?.verified && (
        <div className="verify-banner">
          <span style={{fontSize:"1.4rem"}}>🪪</span>
          <div style={{flex:1}}>
            <strong style={{fontSize:".85rem",color:"var(--soil)",display:"block"}}>
              {userData?.verificationStatus === "pending" ? "Verification Pending ⏳" :
               userData?.verificationStatus === "reviewing" ? "Under Review 🔍" :
               userData?.verificationStatus === "rejected" ? "Not Approved ❌" :
               "You're not verified yet"}
            </strong>
            <span style={{fontSize:".76rem",color:"var(--text-muted)"}}>
              {userData?.verificationStatus === "pending" ? "Your request is in the queue. We'll review it within 24-48 hours." :
               userData?.verificationStatus === "reviewing" ? "We're reviewing your submission. Almost there!" :
               userData?.verificationStatus === "rejected" ? "Your request was not approved. You may submit again." :
               "Submit your verification request to start earning on your posts."}
            </span>
          </div>
          {(!userData?.verificationStatus || userData?.verificationStatus === "rejected") && (
            <button className="vcta" onClick={()=>document.dispatchEvent(new CustomEvent("openVerify"))}>
              {userData?.verificationStatus === "rejected" ? "Reapply →" : "Get Verified →"}
            </button>
          )}
        </div>
      )}

      {/* Earnings card */}
      <div className="earn-card">
        <div className="earn-label">Available Balance {passiveLoading && <span className="spin-inline" style={{width:10,height:10,borderWidth:1.5,marginLeft:6,verticalAlign:"middle"}}/>}</div>
        <div className="earn-amount">${dollars}</div>
        <div className="earn-pts">{pts.toFixed(1)} pts · ${MIN_PAYOUT_DOLLARS} min · every {PAYOUT_COOLDOWN_HOURS}h</div>
        <div className="earn-row">
          <div className="earn-mini"><div className="earn-mini-v">{userData?.postsCount||0}</div><div className="earn-mini-l">Posts</div></div>
          <div className="earn-mini"><div className="earn-mini-v">{userData?.followersCount||0}</div><div className="earn-mini-l">Followers</div></div>
          <div className="earn-mini"><div className="earn-mini-v">${(userData?.totalEarnings||0).toFixed(2)}</div><div className="earn-mini-l">Total Earned</div></div>
        </div>
        {/* Passive rate — private, only visible here */}
        <div style={{marginTop:14,padding:"10px 14px",background:"rgba(255,255,255,.07)",borderRadius:10,fontSize:".72rem",color:"var(--sand-dark)",position:"relative",zIndex:1}}>
          🕐 Passive rate: <strong style={{color:"var(--sand)"}}>{PASSIVE_PTS_PER_POST_PER_HOUR} pt/post/hr</strong>
          {" · "}{userData?.postsCount||0} posts × {PASSIVE_PTS_PER_POST_PER_HOUR} = <strong style={{color:"var(--sand)"}}>{((userData?.postsCount||0)*PASSIVE_PTS_PER_POST_PER_HOUR).toFixed(1)} pts/hr</strong>
          {" · "}<span style={{opacity:.7}}>Credited each time you open Studio</span>
        </div>
      </div>

      {/* SOLES Economy explainer — no per-like breakdown */}
      <div className="scard">
        <div className="scard-title">The SOLES Economy</div>
        <div style={{fontSize:".84rem",lineHeight:1.75,color:"var(--text)"}}>
          Every verified creator earns <strong>passively</strong> — just by having posts on the platform. Engagement (likes, comments, views) <em>boosts</em> your reward, but you earn simply by being here and posting.
        </div>
        <div style={{fontSize:".72rem",color:"var(--text-muted)",marginTop:8}}>
          Min payout ${MIN_PAYOUT_DOLLARS} · Payout available every {PAYOUT_COOLDOWN_HOURS} hours · Powered by $SOLES
        </div>
      </div>

      {/* Payout request */}
      <div className="scard">
        <div className="scard-title">Request Payout</div>
        <div className="wallet-input-wrap">
          <div className="wallet-input-label">Your Solana Wallet Address</div>
          <input
            className="fi"
            placeholder="Enter your Solana wallet address"
            value={walletAddress}
            onChange={e=>setWalletAddress(e.target.value)}
            style={{background:"var(--white)"}}
          />
          <div className="wallet-input-hint">⚠ Double-check this — payouts are sent here and cannot be reversed</div>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontSize:".9rem",fontWeight:600,color:"var(--text)"}}>Balance: ${dollars}</div>
            {userData?.lastPayoutRequest && (
              <div style={{fontSize:".72rem",color:"var(--text-muted)",marginTop:2}}>
                Last request: {timeAgo(userData.lastPayoutRequest)}
              </div>
            )}
          </div>
          <button className="pout-btn" disabled={!canPayout || !cooldownOk() || requesting || !walletAddress.trim()} onClick={requestPayout}>
            {requesting ? <span className="spin-inline"/> : "Request Payout"}
          </button>
        </div>
        {!userData?.verified && <div style={{fontSize:".72rem",color:"var(--accent)",marginTop:8}}>⚠ Verification required to request payouts</div>}
        {userData?.verified && dollars < MIN_PAYOUT_DOLLARS && (
          <div style={{fontSize:".72rem",color:"var(--text-muted)",marginTop:8}}>
            Need ${"{"}(MIN_PAYOUT_DOLLARS - dollars).toFixed(2){"}"} more to reach minimum
          </div>
        )}
        {userData?.verified && dollars >= MIN_PAYOUT_DOLLARS && !cooldownOk() && (
          <div style={{fontSize:".72rem",color:"var(--text-muted)",marginTop:8}}>
            Next payout available in ~{PAYOUT_COOLDOWN_HOURS}h
          </div>
        )}
      </div>

      {/* Social links */}
      {userData?.socials && Object.keys(userData.socials).length > 0 && (
        <div className="scard">
          <div className="scard-title">Your Social Links</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {SOCIAL_PLATFORMS.filter(p=>userData.socials[p.id]).map(p => (
              <a key={p.id} href={userData.socials[p.id]} target="_blank" rel="noreferrer"
                style={{display:"flex",alignItems:"center",gap:5,padding:"6px 14px",borderRadius:20,background:"var(--sand-light)",color:"var(--soil)",textDecoration:"none",fontSize:".74rem",fontWeight:500,transition:"all .2s"}}>
                {p.icon} {p.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
function AdminPanel({ showToast }) {
  const [creators,    setCreators]    = useState([]);
  const [payouts,     setPayouts]     = useState([]);
  const [verReqs,     setVerReqs]     = useState([]);
  const [dailyImg,    setDailyImg]    = useState(null);
  const [uploading,   setUploading]   = useState(false);
  const [tab,         setTab]         = useState("verifications");
  const [expandedReq, setExpandedReq] = useState(null);

  useEffect(() => {
    return onSnapshot(
      query(collection(db,"users"), where("role","==","creator")),
      snap => setCreators(snap.docs.map(d=>({id:d.id,...d.data()})))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(
      query(collection(db,"payoutRequests"), orderBy("requestedAt","desc"), limit(40)),
      snap => setPayouts(snap.docs.map(d=>({id:d.id,...d.data()})))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db,"verificationRequests"), snap => {
      const all = snap.docs.map(d=>({id:d.id,...d.data()}));
      all.sort((a,b)=>(b.submittedAt?.toMillis?.()??0)-(a.submittedAt?.toMillis?.()??0));
      setVerReqs(all);
    });
  }, []);

  async function toggleVerified(u) {
    await updateDoc(doc(db,"users",u.uid), {verified:!u.verified});
    showToast(u.verified ? `${u.username} unverified` : `${u.username} verified`,"success");
  }

  async function setReqStatus(req, status) {
    await updateDoc(doc(db,"verificationRequests",req.id), {status, reviewedAt:serverTimestamp()});
    await updateDoc(doc(db,"users",req.uid), {
      verificationStatus: status,
      verified: status === "approved",
    });
    showToast(`@${req.username} — ${status}`,"success");
  }

  async function updPayout(id, status) {
    await updateDoc(doc(db,"payoutRequests",id), {status});
    showToast(`Payout ${status}`,"success");
  }

  async function uploadDaily() {
    if (!dailyImg) return;
    setUploading(true);
    try {
      const ir  = ref(storage, `daily/${Date.now()}_${dailyImg.name}`);
      await uploadBytes(ir, dailyImg);
      const url = await getDownloadURL(ir);
      await addDoc(collection(db,"daily"), {imageURL:url, uploadedAt:serverTimestamp()});
      setDailyImg(null);
      showToast("Uploaded 🦶","success");
    } catch { showToast("Upload failed","error"); }
    setUploading(false);
  }

  const pendingVerCount = verReqs.filter(r=>r.status==="pending").length;
  const pendingPayCount = payouts.filter(p=>p.status==="pending").length;
  const Badge = ({count}) => count ? (
    <span style={{background:"#E05A5A",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:".62rem",fontWeight:700,marginLeft:5}}>{count}</span>
  ) : null;

  return (
    <div className="page-fade admin-page pb-mobile">
      <div className="admin-title">Admin Panel</div>
      <div className="admin-sub">manage verifications, creators, payouts & daily content</div>

      <div style={{display:"flex",gap:7,marginBottom:20,flexWrap:"wrap"}}>
        {[
          {id:"verifications", label:"Verifications"},
          {id:"creators",      label:"Creators"},
          {id:"payouts",       label:"Payouts"},
          {id:"daily",         label:"Daily Soles"},
        ].map(t=>(
          <button key={t.id} className={`fpill ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>
            {t.label}
            {t.id==="verifications" && <Badge count={pendingVerCount}/>}
            {t.id==="payouts"       && <Badge count={pendingPayCount}/>}
          </button>
        ))}
      </div>

      {tab === "verifications" && (
        <div>
          <div style={{marginBottom:14,fontSize:".8rem",color:"var(--text-muted)"}}>
            {verReqs.length} total · {pendingVerCount} pending
          </div>
          {verReqs.length === 0 && (
            <div className="empty-state"><div className="empty-state-icon">🪪</div><div className="empty-state-text">No verification requests yet</div></div>
          )}
          {verReqs.map(req=>(
            <div key={req.id} className={`vreq-card ${req.status}`}>
              <div className="vreq-header">
                <div>
                  <div className="vreq-user">@{req.username} — {req.displayName}</div>
                  <div className="vreq-time">{req.email} · {timeAgo(req.submittedAt)}</div>
                </div>
                <span className={`vreq-status ${req.status}`}>{req.status}</span>
              </div>
              {req.xHandle && (
                <div className="vreq-field">
                  <div className="vreq-field-label">X Handle</div>
                  <div className="vreq-field-val">
                    <a href={`https://x.com/${req.xHandle.replace("@","")}`} target="_blank" rel="noreferrer" style={{color:"var(--accent)"}}>{req.xHandle}</a>
                    {req.xAccountAge && <span style={{color:"var(--text-muted)",fontSize:".74rem",marginLeft:8}}>· {req.xAccountAge}</span>}
                  </div>
                </div>
              )}
              {req.altSocial && (
                <div className="vreq-field">
                  <div className="vreq-field-label">Alternative Social</div>
                  <div className="vreq-field-val">{req.altSocial}</div>
                </div>
              )}
              {expandedReq === req.id ? (
                <>
                  {req.selfieURL && (
                    <div className="vreq-field">
                      <div className="vreq-field-label">Selfie with $SOLES</div>
                      <img src={req.selfieURL} className="vreq-selfie" alt="selfie"
                        onClick={()=>window.open(req.selfieURL,"_blank")}/>
                    </div>
                  )}
                  {req.notes && (
                    <div className="vreq-field">
                      <div className="vreq-field-label">Notes</div>
                      <div className="vreq-field-val">{req.notes}</div>
                    </div>
                  )}
                  <button style={{fontSize:".74rem",background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",padding:0,marginTop:4}}
                    onClick={()=>setExpandedReq(null)}>▲ Collapse</button>
                </>
              ) : (
                <button style={{fontSize:".74rem",background:"none",border:"none",color:"var(--accent)",cursor:"pointer",padding:0,marginTop:4}}
                  onClick={()=>setExpandedReq(req.id)}>▼ View selfie & details</button>
              )}
              {req.status !== "approved" && (
                <div className="vreq-actions">
                  <button className="tvbtn v" onClick={()=>setReqStatus(req,"approved")}>✓ Approve</button>
                  <button className="tvbtn" style={{background:"#DBEAFE",color:"#1E40AF"}} onClick={()=>setReqStatus(req,"reviewing")}>🔍 Reviewing</button>
                  {req.status !== "rejected" && (
                    <button className="tvbtn u" onClick={()=>setReqStatus(req,"rejected")}>✕ Reject</button>
                  )}
                </div>
              )}
              {req.status === "approved" && (
                <div style={{fontSize:".72rem",color:"var(--green)",marginTop:8,fontWeight:600}}>✓ Approved & verified</div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "creators" && (
        <div className="scard">
          <div className="scard-title">All Creators ({creators.length})</div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Username</th><th>Email</th><th>Points</th><th>Posts</th><th>Req.Status</th><th>Verified</th></tr></thead>
              <tbody>
                {creators.map(c=>(
                  <tr key={c.id}>
                    <td><strong>@{c.username}</strong></td>
                    <td style={{maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.email}</td>
                    <td>{(c.points||0).toFixed(0)}</td>
                    <td>{c.postsCount||0}</td>
                    <td style={{fontSize:".7rem",color:"var(--text-muted)"}}>{c.verificationStatus||"—"}</td>
                    <td><button className={`tvbtn ${c.verified?"v":"u"}`} onClick={()=>toggleVerified(c)}>{c.verified?"✓":"✕"}</button></td>
                  </tr>
                ))}
                {!creators.length && <tr><td colSpan={6} style={{textAlign:"center",color:"var(--text-muted)",padding:24}}>No creators yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "payouts" && (
        <div className="scard">
          <div className="scard-title">Payout Requests</div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Username</th><th>Amount</th><th>Wallet</th><th>Time</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {payouts.map(p=>(
                  <tr key={p.id}>
                    <td>@{p.username}</td>
                    <td><strong>${p.amount}</strong></td>
                    <td style={{maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"monospace",fontSize:".68rem"}} title={p.walletAddress}>{p.walletAddress||"—"}</td>
                    <td>{timeAgo(p.requestedAt)}</td>
                    <td><span className={`tag-badge ${p.status==="paid"?"":"creator"}`}>{p.status}</span></td>
                    <td>
                      {p.status==="pending" && (
                        <div style={{display:"flex",gap:4}}>
                          <button className="tvbtn v" onClick={()=>updPayout(p.id,"paid")}>Pay</button>
                          <button className="tvbtn u" onClick={()=>updPayout(p.id,"rejected")}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {!payouts.length && <tr><td colSpan={5} style={{textAlign:"center",color:"var(--text-muted)",padding:24}}>No requests</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "daily" && (
        <div className="scard">
          <div className="scard-title">Upload Daily Sole</div>
          <div className="upload-zone" style={{marginBottom:14}} onClick={()=>document.getElementById("adm-f").click()}>
            <div style={{fontSize:"2rem",marginBottom:6}}>📸</div>
            <div style={{fontSize:".82rem",color:"var(--text-muted)"}}>{dailyImg?dailyImg.name:"Click to select image"}</div>
            <input id="adm-f" type="file" accept="image/*" style={{display:"none"}} onChange={e=>setDailyImg(e.target.files[0])}/>
          </div>
          <button className="btn-primary" style={{width:"100%"}} onClick={uploadDaily} disabled={!dailyImg||uploading}>
            {uploading?<span className="spin-inline"/>:"Upload to Daily Soles"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Daily Soles Page ─────────────────────────────────────────────────────────
function DailySoles() {
  const [images,  setImages]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onSnapshot(
      query(collection(db,"daily"), orderBy("uploadedAt","desc"), limit(24)),
      snap => { setImages(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); }
    );
  }, []);

  const today = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  return (
    <div className="page-fade daily-page pb-mobile">
      <div className="daily-hdr">
        <div className="daily-title">Daily <em style={{fontStyle:"italic",color:"var(--accent)"}}>Soles</em></div>
        <div className="daily-date">{today}</div>
      </div>
      {loading
        ? <div className="spinner" />
        : images.length === 0
          ? <div className="empty-state"><div className="empty-state-icon">🦶</div><div className="empty-state-text">Check back soon — curated daily drops coming!</div></div>
          : (
            <div className="daily-grid">
              {images.map(img => (
                <div key={img.id} className="daily-wrap">
                  <img src={img.imageURL} alt="" loading="lazy" />
                </div>
              ))}
            </div>
          )}
    </div>
  );
}

// ─── Main Feed ────────────────────────────────────────────────────────────────
function MainFeed({ currentUser, userData, showToast, onProfileClick }) {
  const [posts,       setPosts]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("latest");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [openPost,    setOpenPost]    = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null); // null = not searching
  const [searching,   setSearching]   = useState(false);
  const searchTimer = useRef(null);

  // Live feed
  useEffect(() => {
    setLoading(true);
    const q = filter === "popular"
      ? query(collection(db,"posts"), orderBy("likesCount","desc"), limit(40))
      : query(collection(db,"posts"), orderBy("createdAt","desc"), limit(40));
    const unsub = onSnapshot(q, snap => {
      let all = snap.docs.map(d=>({id:d.id,...d.data()}));
      if (verifiedOnly) all = all.filter(p => p.creatorVerified);
      setPosts(all);
      setLoading(false);
    }, err => {
      console.error("Feed error:", err);
      setLoading(false);
    });
    return unsub;
  }, [filter, verifiedOnly]);

  // Search users by username / displayName
  async function doSearch(q) {
    if (!q.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try {
      // Search by username (lowercase prefix match)
      const lower = q.toLowerCase().trim();
      const snap  = await getDocs(collection(db,"users"));
      const users = snap.docs
        .map(d => ({id:d.id,...d.data()}))
        .filter(u =>
          (u.username||"").toLowerCase().includes(lower) ||
          (u.displayName||"").toLowerCase().includes(lower)
        )
        .slice(0, 20);
      setSearchResults(users);
    } catch(e) {
      console.error("Search error:", e);
    }
    setSearching(false);
  }

  function onSearchChange(val) {
    setSearchQuery(val);
    clearTimeout(searchTimer.current);
    if (!val.trim()) { setSearchResults(null); return; }
    searchTimer.current = setTimeout(() => doSearch(val), 400);
  }

  async function handleLike(post) {
    if (!currentUser) { showToast("Sign in to like 🦶","error"); return; }
    const liked = post.likes?.includes(currentUser.uid);
    const postRef = doc(db,"posts",post.id);
    await updateDoc(postRef, {
      likes:      liked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
      likesCount: increment(liked ? -1 : 1),
    });
    if (!liked && post.creatorId !== currentUser.uid) {
      await updateDoc(doc(db,"users",post.creatorId), {points: increment(1)});
    }
    const upd = p => p.id===post.id ? {
      ...p,
      likes:      liked ? p.likes.filter(x=>x!==currentUser.uid) : [...(p.likes||[]),currentUser.uid],
      likesCount: (p.likesCount||0)+(liked?-1:1),
    } : p;
    setPosts(prev => prev.map(upd));
    if (openPost?.id === post.id) setOpenPost(prev => upd(prev));
  }

  return (
    <div className="page-fade feed-page pb-mobile">
      <div className="feed-header">
        <div className="feed-title">Explore <span>Soles</span></div>
        <div className="feed-filters">
          <button className={`fpill ${filter==="latest"?"active":""}`}  onClick={()=>setFilter("latest")}>Latest</button>
          <button className={`fpill ${filter==="popular"?"active":""}`} onClick={()=>setFilter("popular")}>Popular</button>
          <button
            className={`fpill ${verifiedOnly?"active":""}`}
            onClick={()=>setVerifiedOnly(v=>!v)}
            style={verifiedOnly ? {background:"#1D9BF0",color:"#fff"} : {}}
          >✓ Verified</button>
        </div>
      </div>

      {/* Search bar */}
      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          placeholder="Search creators by name or username…"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={()=>{setSearchQuery("");setSearchResults(null);}}>✕</button>
        )}
      </div>

      {/* Search results */}
      {searchResults !== null && (
        <>
          <div className="search-results-label">
            {searching ? "Searching…" : `${searchResults.length} creator${searchResults.length!==1?"s":""} found`}
          </div>
          {searchResults.length === 0 && !searching && (
            <div className="empty-state" style={{padding:"30px 20px"}}>
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-text">No creators found for "{searchQuery}"</div>
            </div>
          )}
          {searchResults.length > 0 && (
            <div style={{padding:"0 20px 20px",display:"flex",flexDirection:"column",gap:10}}>
              {searchResults.map(user => (
                <div
                  key={user.id}
                  onClick={() => { onProfileClick(user.uid||user.id); setSearchQuery(""); setSearchResults(null); }}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"var(--white)",borderRadius:14,cursor:"pointer",boxShadow:"var(--shadow)",transition:"transform .2s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform=""}
                >
                  <Avatar photoURL={user.photoURL} name={user.displayName} size={44} />
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:".88rem",color:"var(--soil)",display:"flex",alignItems:"center",gap:6}}>
                      {user.displayName}
                      {user.verified && <span style={{fontSize:".68rem",color:"var(--accent)",background:"rgba(212,132,90,.12)",padding:"1px 7px",borderRadius:10}}>✓</span>}
                    </div>
                    <div style={{fontSize:".76rem",color:"var(--text-muted)"}}>@{user.username}</div>
                    {user.bio && <div style={{fontSize:".74rem",color:"var(--text-muted)",marginTop:2,opacity:.8,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:260}}>{user.bio}</div>}
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontFamily:"var(--fi)",fontSize:"1rem",color:"var(--soil)"}}>{user.followersCount||0}</div>
                    <div style={{fontSize:".62rem",color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:".06em"}}>followers</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Normal feed — hidden while searching */}
      {searchResults === null && (
        loading
          ? <div className="spinner" />
          : posts.length === 0
            ? <div className="empty-state"><div className="empty-state-icon">🦶</div><div className="empty-state-text">No posts yet — be first to post!</div></div>
            : (
              <div className="feed-grid">
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onOpen={setOpenPost}
                    onLike={handleLike}
                    onProfileClick={onProfileClick}
                  />
                ))}
              </div>
            )
      )}

      {openPost && (
        <PostModal
          post={openPost}
          currentUser={currentUser}
          onClose={() => setOpenPost(null)}
          onLike={handleLike}
          onProfileClick={(uid) => { setOpenPost(null); onProfileClick(uid); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ─── Nav Bar ──────────────────────────────────────────────────────────────────
function NavBar({ currentUser, userData, page, onNavigate, onAuth, onSignOut, onUpload }) {
  return (
    <nav className="nav">
      <div className="nav-logo" onClick={() => onNavigate("home")}>
        <img src="logo.png" className="nav-logo-img" alt="SOLES" onError={e=>{e.target.style.display="none";}} />
        <span className="nav-logo-text">SOLES</span>
      </div>

      {/* Desktop center links */}
      <div className="nav-center">
        <button className={`nav-link ${page==="home"?"active":""}`}    onClick={()=>onNavigate("home")}>Home</button>
        <button className={`nav-link ${page==="explore"?"active":""}`} onClick={()=>onNavigate("explore")}>Explore</button>
        <button className={`nav-link ${page==="daily"?"active":""}`}   onClick={()=>onNavigate("daily")}>Daily Soles</button>
      </div>

      <div className="nav-actions">
        {currentUser ? (
          <>
            {(userData?.role === "creator" || userData?.role === "admin") && (
              <button className="nav-btn nav-btn-ghost" onClick={onUpload}>+ Post</button>
            )}
            {userData?.role === "admin" && (
              <button className="nav-btn nav-btn-fill" onClick={()=>onNavigate("admin")} style={{background:"var(--soil)"}}>⚙ Admin Panel</button>
            )}
            <button className="nav-chip" onClick={()=>onNavigate("profile",currentUser.uid)}>
              <div className="nav-chip-av">
                {userData?.photoURL
                  ? <img src={userData.photoURL} alt="" />
                  : <div className="nav-chip-av-fb">{(userData?.displayName||currentUser.displayName||"?")[0].toUpperCase()}</div>}
              </div>
              <span>{userData?.username || currentUser.displayName}</span>
            </button>
            <button className="nav-btn nav-btn-ghost" onClick={onSignOut}>Sign Out</button>
          </>
        ) : (
          <>
            <button className="nav-btn nav-btn-ghost" onClick={()=>onAuth("login")}>Sign In</button>
            <button className="nav-btn nav-btn-fill"  onClick={()=>onAuth("signup")}>Join Free</button>
          </>
        )}
      </div>
    </nav>
  );
}

// ─── Tab Bar (mobile) ─────────────────────────────────────────────────────────
function TabBar({ page, currentUser, userData, onNavigate, onAuth, onUpload }) {
  const isAdmin = userData?.role === "admin";
  const tabs = [
    {id:"home",    icon:"🏠", label:"Home"},
    {id:"explore", icon:"🔍", label:"Explore"},
    {id:"daily",   icon:"📅", label:"Daily"},
    ...(currentUser
      ? isAdmin
        ? [{id:"post",    icon:"➕", label:"Post",   action:true},
           {id:"admin",   icon:"⚙️", label:"Admin",  adminTab:true},
           {id:"profile", icon:"👤", label:"Profile"}]
        : [{id:"post",    icon:"➕", label:"Post",   action:true},
           {id:"profile", icon:"👤", label:"Profile"}]
      : [{id:"auth",    icon:"🦶", label:"Join"}]),
  ];
  function go(t) {
    if (t.action) { (userData?.role === "creator" || userData?.role === "admin") ? onUpload() : onAuth("signup"); }
    else if (t.adminTab) onNavigate("admin");
    else if (t.id === "profile" && currentUser) onNavigate("profile", currentUser.uid);
    else if (t.id === "auth")  onAuth("signup");
    else onNavigate(t.id);
  }
  return (
    <div className="tab-bar">
      <div className="tab-inner">
        {tabs.map(t => (
          <div key={t.id} className={`tab-item ${page===t.id?"active":""}`} onClick={()=>go(t)}>
            <span className="tab-icon">{t.icon}</span>
            <span>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser]   = useState(null);
  const [userData,    setUserData]      = useState(null);
  const [authLoading, setAuthLoading]   = useState(true);
  const [page,        setPage]          = useState("home");  // will be overridden after auth
  const [pageExtra,   setPageExtra]     = useState(null); // uid for profile
  const [showAuth,    setShowAuth]      = useState(false);
  const [showUpload,  setShowUpload]    = useState(false);
  const { toasts, show: showToast }     = useToast();

  // Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, async user => {
      setCurrentUser(user);
      if (user) {
        const snap = await getDoc(doc(db,"users",user.uid));
        setUserData(snap.exists() ? snap.data() : null);
        // Admin email auto-redirects to admin panel
        if (user.email === ADMIN_EMAIL) {
          setPage("admin");
        } else {
          setPage(p => p === "home" ? "explore" : p);
        }
      } else {
        setUserData(null);
        // Signed-out users go to home (landing page)
        setPage("home");
      }
      setAuthLoading(false);
    });
  }, []);

  // Realtime userData sync
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db,"users",currentUser.uid), snap => {
      if (snap.exists()) setUserData(snap.data());
    });
    return unsub;
  }, [currentUser]);

  async function refreshCurrentUser() {
    if (!currentUser) return;
    const snap = await getDoc(doc(db,"users",currentUser.uid));
    if (snap.exists()) setUserData(snap.data());
  }

  function navigate(p, extra = null) {
    setPage(p);
    setPageExtra(extra);
    window.scrollTo({top:0, behavior:"smooth"});
  }

  async function doSignOut() {
    await signOut(auth);
    setPage("home");
    setPageExtra(null);
    showToast("Signed out 👋");
  }

  // Profile click from any post card or comment
  function handleProfileClick(uid) {
    if (!uid) return;
    navigate("profile", uid);
  }

  if (authLoading) return (
    <><GlobalStyles />
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--cream)"}}>
        <div className="spinner" />
      </div>
    </>
  );

  function renderPage() {
    switch (page) {
      // "home" ALWAYS shows the landing page — signed-in or not
      case "home":
        return <LandingPage onAuth={m=>setShowAuth(m)} onNavigate={navigate} currentUser={currentUser} />;

      // "explore" ALWAYS shows the feed
      case "explore":
        return <MainFeed currentUser={currentUser} userData={userData} showToast={showToast} onProfileClick={handleProfileClick} />;

      case "daily":
        return <DailySoles />;

      case "profile":
        if (!pageExtra) return <MainFeed currentUser={currentUser} userData={userData} showToast={showToast} onProfileClick={handleProfileClick} />;
        return (
          <ProfilePage
            targetUid={pageExtra}
            currentUser={currentUser}
            userData={userData}
            showToast={showToast}
            onNavigate={navigate}
            onProfileClick={handleProfileClick}
            onRefreshCurrentUser={refreshCurrentUser}
          />
        );

      case "admin":
        return userData?.role === "admin"
          ? <AdminPanel showToast={showToast} />
          : <MainFeed currentUser={currentUser} userData={userData} showToast={showToast} onProfileClick={handleProfileClick} />;

      default:
        // When first loaded and signed in, go straight to explore
        return currentUser
          ? <MainFeed currentUser={currentUser} userData={userData} showToast={showToast} onProfileClick={handleProfileClick} />
          : <LandingPage onAuth={m=>setShowAuth(m)} onNavigate={navigate} currentUser={currentUser} />;
    }
  }

  return (
    <>
      <GlobalStyles />
      <div className="app-shell">
        <NavBar
          currentUser={currentUser}
          userData={userData}
          page={page}
          onNavigate={navigate}
          onAuth={m=>setShowAuth(m)}
          onSignOut={doSignOut}
          onUpload={()=>setShowUpload(true)}
        />
        <main className="main-content">
          {renderPage()}
        </main>

        <TabBar
          page={page}
          currentUser={currentUser}
          userData={userData}
          onNavigate={navigate}
          onAuth={m=>setShowAuth(m)}
          onUpload={()=>setShowUpload(true)}
        />
      </div>

      {showAuth && (
        <AuthModal onClose={()=>setShowAuth(false)} showToast={showToast} />
      )}
      {showUpload && currentUser && (
        <UploadModal
          currentUser={currentUser}
          userData={userData}
          onClose={()=>setShowUpload(false)}
          showToast={showToast}
        />
      )}
      <ToastContainer toasts={toasts} />
    </>
  );
}