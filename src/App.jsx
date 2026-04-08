// ============================================================
// SOLES — We just like feet..
// Full-stack React + Firebase single-file app
// ============================================================
// COIN CONTRACT ADDRESS SECTION:
// Search for "CONTRACT_ADDRESS_SECTION" in this file.
// Commented out by default. Uncomment + paste CA when ready.
// CA is auto-copyable on click.
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

// ─── Firebase Init ─────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAdYOWVOY1KSc6Ns1l3CV3sW-Y6kxhJHWg",
  authDomain: "the-contrarian.firebaseapp.com",
  projectId: "the-contrarian",
  storageBucket: "the-contrarian.firebasestorage.app",
  messagingSenderId: "1043559632677",
  appId: "1:1043559632677:web:4a9bd084a7782c3e98d4cc",
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

// ─── Constants ─────────────────────────────────────────────────────────────────
const TELEGRAM_VERIFY_LINK  = "https://t.me/YourBotHandleHere";
const X_PROFILE_LINK        = "https://x.com/SolesBrand";
const X_COMMUNITY_LINK      = "https://x.com/i/communities/YourCommunityID";
const POINTS_TO_DOLLAR      = 100;
const MIN_PAYOUT_DOLLARS    = 10;
const PAYOUT_COOLDOWN_HOURS = 12;

// ─── Merged Firestore Security Rules ──────────────────────────────────────────
// Paste this entire block into Firebase Console → Firestore → Rules
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Existing: River Leaderboard ─────────────────────────────────────────
    match /river_leaderboard/{doc} {
      allow read: if true;
      allow create: if request.resource.data.username is string
        && request.resource.data.username.size() >= 1
        && request.resource.data.username.size() <= 20
        && request.resource.data.score is number
        && request.resource.data.distance is number;
      allow update, delete: if false;
    }

    // ── Existing: Community Posts ────────────────────────────────────────────
    match /community_posts/{doc} {
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.data.thesis is string
        && request.resource.data.thesis.size() >= 20
        && request.resource.data.thesis.size() <= 500;
      allow update: if request.auth != null;
      allow delete: if false;
    }

    // ── Existing: Articles & Tracker (read-only) ─────────────────────────────
    match /articles/{doc}  { allow read: if true; allow write: if false; }
    match /tracker/{doc}   { allow read: if true; allow write: if false; }

    // ── Existing: Backtest Journals ──────────────────────────────────────────
    match /backtest_user77/{doc} { allow read, write, delete: if true; }
    match /backtest_user2/{doc}  { allow read, write, delete: if true; }
    match /backtest_user3/{doc}  { allow read, write, delete: if true; }

    // ── SOLES: Users ─────────────────────────────────────────────────────────
    match /users/{uid} {
      allow read: if true;
      allow create: if (request.auth.uid == uid
          && request.resource.data.username is string
          && request.resource.data.username.size() >= 1
          && request.resource.data.username.size() <= 24)
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow update: if request.auth.uid == uid
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // ── SOLES: Posts ─────────────────────────────────────────────────────────
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['creator','admin'];
      allow update: if request.auth.uid == resource.data.creatorId
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow delete: if request.auth.uid == resource.data.creatorId
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // ── SOLES: Comments (shared collection, merged) ───────────────────────────
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

    // ── SOLES: Daily Soles ────────────────────────────────────────────────────
    match /daily/{docId} {
      allow read: if true;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // ── SOLES: Follows ────────────────────────────────────────────────────────
    match /follows/{followId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // ── SOLES: Payout Requests ────────────────────────────────────────────────
    match /payoutRequests/{reqId} {
      allow create: if request.auth != null;
      allow read, update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // ── Catch-all ─────────────────────────────────────────────────────────────
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
*/

// ─── Social Platforms ──────────────────────────────────────────────────────────
const SOCIAL_PLATFORMS = [
  { id: "x",         label: "X / Twitter", icon: "𝕏",  placeholder: "https://x.com/yourhandle" },
  { id: "instagram", label: "Instagram",   icon: "📸", placeholder: "https://instagram.com/yourhandle" },
  { id: "reddit",    label: "Reddit",      icon: "👾", placeholder: "https://reddit.com/u/yourhandle" },
  { id: "other",     label: "Other",       icon: "🔗", placeholder: "https://..." },
];

// ─── CSS ───────────────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@300;400;500&family=Bebas+Neue&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    :root{
      --sand:#E8C9A0;--sand-light:#F5E6D0;--sand-dark:#C49A6C;
      --soil:#5C3A1E;--soil-light:#8B5E3C;
      --cream:#FAF6F0;--dark:#0E0702;--mid:#3D2510;
      --text:#2C1810;--text-muted:#8B6E5A;
      --accent:#D4845A;--accent-warm:#E8A87C;
      --white:#FFFFFF;--border:rgba(196,154,108,0.22);
      --glass:rgba(250,246,240,0.9);
      --shadow:0 4px 24px rgba(92,58,30,0.11);
      --shadow-lg:0 16px 60px rgba(92,58,30,0.2);
      --r:16px;--r-sm:8px;
      --fd:'Playfair Display',serif;--fb:'Inter',sans-serif;--fi:'Bebas Neue',sans-serif;
    }
    html{scroll-behavior:smooth;}
    body{font-family:var(--fb);background:var(--cream);color:var(--text);min-height:100vh;overflow-x:hidden;}
    ::-webkit-scrollbar{width:4px;}
    ::-webkit-scrollbar-track{background:var(--cream);}
    ::-webkit-scrollbar-thumb{background:var(--sand-dark);border-radius:2px;}
    .app-shell{display:flex;flex-direction:column;min-height:100vh;}

    /* NAV */
    .nav{position:sticky;top:0;z-index:100;background:var(--glass);backdrop-filter:blur(24px);border-bottom:1px solid var(--border);padding:0 24px;height:62px;display:flex;align-items:center;justify-content:space-between;}
    .nav-logo{display:flex;align-items:center;gap:10px;cursor:pointer;}
    .nav-logo-img{height:32px;}
    .nav-logo-text{font-family:var(--fd);font-size:1.3rem;font-weight:700;color:var(--soil);letter-spacing:.04em;}
    .nav-actions{display:flex;align-items:center;gap:8px;}
    .nav-btn{font-family:var(--fb);font-size:.76rem;font-weight:500;padding:8px 18px;border-radius:40px;border:none;cursor:pointer;transition:all .2s;letter-spacing:.02em;}
    .nav-btn-ghost{background:transparent;color:var(--soil);border:1.5px solid var(--border);}
    .nav-btn-ghost:hover{background:var(--sand-light);}
    .nav-btn-fill{background:var(--soil);color:var(--sand-light);}
    .nav-btn-fill:hover{background:var(--mid);}
    .nav-chip{display:flex;align-items:center;gap:7px;padding:5px 14px 5px 5px;border-radius:40px;border:1.5px solid var(--border);cursor:pointer;transition:background .2s;background:transparent;font-family:var(--fb);font-size:.76rem;color:var(--soil);}
    .nav-chip:hover{background:var(--sand-light);}

    /* TABS */
    .tab-bar{display:none;position:fixed;bottom:0;left:0;right:0;z-index:100;background:var(--glass);backdrop-filter:blur(24px);border-top:1px solid var(--border);padding:6px 0 max(8px,env(safe-area-inset-bottom));}
    .tab-inner{display:flex;justify-content:space-around;}
    .tab-item{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 10px;cursor:pointer;font-size:.58rem;font-weight:500;color:var(--text-muted);transition:color .2s;letter-spacing:.04em;text-transform:uppercase;}
    .tab-item.active{color:var(--accent);}
    .tab-icon{font-size:1.2rem;line-height:1;}
    @media(max-width:768px){
      .tab-bar{display:block;}
      .nav-actions{display:none;}
      .main-content{padding-bottom:80px!important;}
    }
    .main-content{flex:1;}

    /* HERO */
    .hero{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;background:var(--dark);}
    .hero-bg{position:absolute;inset:-8%;background:radial-gradient(ellipse 80% 60% at 25% 55%,rgba(212,132,90,.18) 0%,transparent 58%),radial-gradient(ellipse 55% 70% at 78% 25%,rgba(196,154,108,.1) 0%,transparent 55%),radial-gradient(ellipse 45% 45% at 50% 95%,rgba(92,58,30,.45) 0%,transparent 55%),linear-gradient(155deg,#0E0702 0%,#2C1810 45%,#0E0702 100%);transition:transform .1s ease-out;}
    .hero-grain{position:absolute;inset:0;opacity:.035;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:160px;}
    .hero-ring{position:absolute;inset:0;overflow:hidden;pointer-events:none;}
    .hero-ring span{position:absolute;border-radius:50%;border:1px solid rgba(232,201,160,.06);top:50%;left:50%;transform:translate(-50%,-50%);animation:expandR 7s ease-out infinite;}
    .hero-ring span:nth-child(1){width:500px;height:500px;}
    .hero-ring span:nth-child(2){width:750px;height:750px;animation-delay:2.3s;}
    .hero-ring span:nth-child(3){width:1050px;height:1050px;animation-delay:4.6s;}
    @keyframes expandR{0%{opacity:.6;transform:translate(-50%,-50%) scale(.5);}100%{opacity:0;transform:translate(-50%,-50%) scale(1.3);}}
    .hero-content{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;max-width:800px;padding:40px 24px;text-align:center;}
    .hero-overline{font-family:var(--fb);font-size:.66rem;font-weight:500;letter-spacing:.32em;text-transform:uppercase;color:var(--sand-dark);margin-bottom:30px;opacity:.75;animation:fadeUp 1s .1s both;}
    .hero-logo-wrap{margin-bottom:30px;animation:fadeUp 1s .22s both;}
    .hero-logo-img{height:clamp(70px,13vw,120px);filter:drop-shadow(0 0 50px rgba(212,132,90,.38)) drop-shadow(0 0 100px rgba(212,132,90,.14));animation:floatL 5s ease-in-out infinite;}
    @keyframes floatL{0%,100%{transform:translateY(0) rotate(-1deg);}50%{transform:translateY(-9px) rotate(.8deg);}}
    .hero-headline{font-family:var(--fd);font-size:clamp(2.6rem,8.5vw,6rem);font-weight:400;line-height:1.02;color:var(--sand-light);margin-bottom:12px;letter-spacing:-.02em;animation:fadeUp 1s .34s both;}
    .hero-headline em{font-style:italic;color:var(--sand);display:block;}
    .hero-sub{font-family:var(--fd);font-style:italic;font-size:clamp(.95rem,2.8vw,1.4rem);color:var(--sand-dark);opacity:.7;margin-bottom:46px;animation:fadeUp 1s .46s both;}
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

    /* MARQUEE */
    .marquee-wrap{background:var(--soil);overflow:hidden;padding:13px 0;border-top:1px solid rgba(232,201,160,.08);}
    .marquee-track{display:flex;width:max-content;animation:marquee 24s linear infinite;}
    .marquee-track:hover{animation-play-state:paused;}
    @keyframes marquee{from{transform:translateX(0);}to{transform:translateX(-50%);}}
    .mq-item{display:flex;align-items:center;gap:10px;padding:0 28px;white-space:nowrap;font-family:var(--fi);font-size:.82rem;letter-spacing:.14em;color:var(--sand-dark);}
    .mq-dot{width:4px;height:4px;border-radius:50%;background:var(--accent);flex-shrink:0;}

    /* HOW IT WORKS */
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

    /* CREATOR SPOTLIGHT */
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

    /* COMMUNITY */
    .community{padding:80px 24px;background:linear-gradient(135deg,var(--soil) 0%,var(--mid) 100%);text-align:center;position:relative;overflow:hidden;}
    .community::before{content:'';position:absolute;top:-80px;right:-80px;width:340px;height:340px;border-radius:50%;background:rgba(232,201,160,.04);}
    .community::after{content:'';position:absolute;bottom:-100px;left:-60px;width:300px;height:300px;border-radius:50%;background:rgba(212,132,90,.05);}
    .comm-inner{position:relative;z-index:2;}
    .comm-heading{font-family:var(--fd);font-size:clamp(1.5rem,4.5vw,3rem);color:var(--sand-light);font-weight:400;margin-bottom:14px;}
    .comm-sub{font-size:.88rem;color:var(--sand-dark);opacity:.72;max-width:480px;margin:0 auto 32px;line-height:1.65;}
    .comm-btns{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;}
    .comm-btn{display:flex;align-items:center;gap:7px;padding:11px 22px;border-radius:40px;text-decoration:none;font-family:var(--fb);font-size:.8rem;font-weight:500;transition:all .3s cubic-bezier(.34,1.56,.64,1);letter-spacing:.03em;}
    .comm-btn.x{background:rgba(255,255,255,.1);color:var(--sand);border:1.5px solid rgba(232,201,160,.18);}
    .comm-btn.x:hover{background:rgba(255,255,255,.17);transform:translateY(-3px);box-shadow:0 8px 28px rgba(0,0,0,.28);}
    .comm-btn.join{background:var(--sand);color:var(--dark);border:none;}
    .comm-btn.join:hover{background:var(--sand-light);transform:translateY(-3px);box-shadow:0 8px 28px rgba(232,201,160,.28);}
    .comm-btn-btn{border:none;cursor:pointer;}

    /* GALLERY MOSAIC */
    .gallery-section{
      position:relative; overflow:hidden;
      background:var(--dark); padding:72px 0;
    }
    .gallery-section::before{
      content:''; position:absolute; inset:0; z-index:2; pointer-events:none;
      background:
        linear-gradient(to right, var(--dark) 0%, transparent 12%, transparent 88%, var(--dark) 100%),
        linear-gradient(to bottom, var(--dark) 0%, transparent 16%, transparent 84%, var(--dark) 100%);
    }
    .gallery-center-overlay{
      position:absolute; inset:0; z-index:3;
      display:flex; align-items:center; justify-content:center;
      pointer-events:none;
    }
    .gallery-center-text{
      text-align:center; pointer-events:auto;
    }
    .gct-eyebrow{
      font-size:.62rem; letter-spacing:.32em; text-transform:uppercase;
      color:var(--accent); margin-bottom:10px; font-weight:500;
      opacity:.85;
    }
    .gct-headline{
      font-family:var(--fd); font-size:clamp(1.4rem,4vw,2.8rem);
      color:var(--sand-light); font-weight:400; line-height:1.15;
      margin-bottom:6px; text-shadow:0 2px 30px rgba(0,0,0,.7);
    }
    .gct-headline em{ font-style:italic; color:var(--sand); }
    .gct-sub{
      font-size:.8rem; color:var(--sand-dark); opacity:.65;
      letter-spacing:.04em;
    }
    .gallery-rows{ display:flex; flex-direction:column; gap:10px; }
    .gallery-row{
      display:flex; gap:10px; width:max-content;
    }
    .gallery-row.row-fwd{  animation:galleryFwd  var(--dur, 28s) linear infinite; }
    .gallery-row.row-rev{  animation:galleryRev  var(--dur, 32s) linear infinite; }
    @keyframes galleryFwd{ from{transform:translateX(0);} to{transform:translateX(-50%);} }
    @keyframes galleryRev{ from{transform:translateX(-50%);} to{transform:translateX(0);} }
    .gallery-rows:hover .gallery-row{ animation-play-state:paused; }
    .gallery-tile{
      position:relative; flex-shrink:0;
      border-radius:14px; overflow:hidden;
      box-shadow:0 4px 20px rgba(0,0,0,.45);
      transition:transform .4s cubic-bezier(.34,1.56,.64,1), box-shadow .4s;
      cursor:pointer;
    }
    .gallery-tile:hover{
      transform:scale(1.06) translateY(-4px);
      box-shadow:0 12px 40px rgba(212,132,90,.28);
      z-index:5;
    }
    .gallery-tile img{
      width:100%; height:100%; object-fit:cover; display:block;
      transition:transform .5s ease;
    }
    .gallery-tile:hover img{ transform:scale(1.08); }
    .gallery-tile-shine{
      position:absolute; inset:0;
      background:linear-gradient(135deg, rgba(255,255,255,.07) 0%, transparent 50%);
      pointer-events:none;
    }
    .gallery-tile-hover-label{
      position:absolute; inset:0;
      background:linear-gradient(to top, rgba(14,7,2,.75) 0%, transparent 55%);
      display:flex; align-items:flex-end; padding:12px;
      opacity:0; transition:opacity .3s;
    }
    .gallery-tile:hover .gallery-tile-hover-label{ opacity:1; }
    .gthl-inner{
      font-family:var(--fd); font-style:italic;
      font-size:.78rem; color:var(--sand); line-height:1.3;
    }

    /* GENERAL BUTTONS */
    .btn-primary{padding:11px 26px;border-radius:40px;border:none;cursor:pointer;font-family:var(--fb);font-size:.82rem;font-weight:500;background:var(--soil);color:var(--sand-light);transition:all .25s;letter-spacing:.02em;}
    .btn-primary:hover{background:var(--mid);transform:translateY(-2px);box-shadow:var(--shadow);}
    .btn-outline{padding:11px 26px;border-radius:40px;cursor:pointer;font-family:var(--fb);font-size:.82rem;font-weight:500;background:transparent;color:var(--soil);border:1.5px solid var(--border);transition:all .25s;}
    .btn-outline:hover{background:var(--sand-light);}

    /* FEED */
    .feed-header{padding:30px 20px 14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
    .feed-title{font-family:var(--fd);font-size:1.65rem;font-weight:400;color:var(--soil);}
    .feed-title span{font-style:italic;color:var(--accent);}
    .feed-filters{display:flex;gap:7px;flex-wrap:wrap;}
    .fpill{padding:6px 15px;border-radius:40px;border:none;cursor:pointer;font-size:.74rem;font-weight:500;background:var(--sand-light);color:var(--soil);transition:all .2s;}
    .fpill.active{background:var(--soil);color:var(--sand-light);}
    .feed-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:18px;padding:0 20px;}
    @media(max-width:480px){.feed-grid{grid-template-columns:repeat(2,1fr);gap:9px;padding:0 11px;}}

    /* POST CARD */
    .post-card{background:var(--white);border-radius:18px;overflow:hidden;box-shadow:var(--shadow);transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s;cursor:pointer;}
    .post-card:hover{transform:translateY(-6px) scale(1.01);box-shadow:var(--shadow-lg);}
    .pc-img{width:100%;aspect-ratio:4/5;object-fit:cover;background:var(--sand-light);display:block;}
    .pc-body{padding:11px 13px 13px;}
    .pc-header{display:flex;align-items:center;gap:7px;margin-bottom:7px;}
    .pav{width:28px;height:28px;border-radius:50%;background:var(--sand);overflow:hidden;flex-shrink:0;}
    .pav img{width:100%;height:100%;object-fit:cover;}
    .pav-fb{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:600;color:var(--soil);}
    .pc-name{font-size:.78rem;font-weight:500;color:var(--soil);display:flex;align-items:center;gap:3px;}
    .vbadge{color:var(--accent);font-size:.7rem;}
    .pc-caption{font-size:.75rem;color:var(--text-muted);margin-bottom:9px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
    .pc-actions{display:flex;align-items:center;gap:10px;}
    .pac{display:flex;align-items:center;gap:4px;background:none;border:none;cursor:pointer;font-size:.74rem;color:var(--text-muted);font-family:var(--fb);transition:color .2s;padding:0;}
    .pac:hover{color:var(--accent);}
    .pac.liked{color:#E05A5A;}

    /* MODALS */
    .modal-overlay{position:fixed;inset:0;z-index:200;background:rgba(14,7,2,.88);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s;}
    @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
    @keyframes slideUp{from{transform:translateY(28px);opacity:0;}to{transform:translateY(0);opacity:1;}}
    .modal-box{background:var(--cream);border-radius:20px;max-width:880px;width:100%;max-height:90vh;display:flex;overflow:hidden;box-shadow:var(--shadow-lg);animation:slideUp .35s cubic-bezier(.34,1.56,.64,1);}
    @media(max-width:620px){.modal-box{flex-direction:column;max-height:95vh;border-radius:20px 20px 0 0;align-self:flex-end;}}
    .modal-img-side{flex:1;background:var(--dark);min-height:280px;}
    .modal-img-side img{width:100%;height:100%;object-fit:cover;}
    .modal-content-side{width:310px;flex-shrink:0;display:flex;flex-direction:column;overflow:hidden;}
    @media(max-width:620px){.modal-content-side{width:100%;}}
    .modal-header{padding:13px 15px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
    .modal-close{background:none;border:none;cursor:pointer;font-size:1.05rem;color:var(--text-muted);}
    .comments-list{flex:1;overflow-y:auto;padding:13px 15px;display:flex;flex-direction:column;gap:11px;}
    .ci{display:flex;gap:7px;}
    .ca-name{font-size:.75rem;font-weight:500;color:var(--soil);}
    .ca-text{font-size:.77rem;color:var(--text);line-height:1.4;}
    .ca-time{font-size:.66rem;color:var(--text-muted);margin-top:1px;}
    .cir{padding:11px 13px;border-top:1px solid var(--border);display:flex;gap:7px;align-items:center;}
    .cinput{flex:1;padding:8px 12px;border-radius:20px;border:1.5px solid var(--border);background:var(--white);font-family:var(--fb);font-size:.78rem;color:var(--text);outline:none;}
    .cinput:focus{border-color:var(--sand-dark);}
    .csend{background:var(--soil);color:var(--sand-light);border:none;cursor:pointer;border-radius:50%;width:32px;height:32px;font-size:.95rem;display:flex;align-items:center;justify-content:center;transition:background .2s;flex-shrink:0;}
    .csend:hover{background:var(--mid);}

    /* AUTH MODAL */
    .auth-modal{background:var(--cream);border-radius:22px;max-width:450px;width:100%;padding:38px 34px;box-shadow:var(--shadow-lg);animation:slideUp .35s cubic-bezier(.34,1.56,.64,1);max-height:90vh;overflow-y:auto;}
    .auth-logo-img{height:52px;}
    .auth-title{font-family:var(--fd);font-size:1.65rem;font-weight:400;color:var(--soil);text-align:center;margin-bottom:4px;}
    .auth-sub{font-size:.78rem;color:var(--text-muted);text-align:center;margin-bottom:22px;}
    .role-select{display:flex;gap:7px;margin-bottom:16px;}
    .role-btn{flex:1;padding:10px;border-radius:var(--r-sm);border:2px solid var(--border);cursor:pointer;font-family:var(--fb);font-size:.78rem;font-weight:500;background:var(--white);color:var(--text-muted);transition:all .2s;text-align:center;}
    .role-btn.active{border-color:var(--soil);background:var(--soil);color:var(--sand-light);}
    .fg{margin-bottom:12px;}
    .fl{display:block;font-size:.68rem;font-weight:500;color:var(--text-muted);margin-bottom:4px;letter-spacing:.06em;text-transform:uppercase;}
    .fi{width:100%;padding:10px 13px;border-radius:var(--r-sm);border:1.5px solid var(--border);background:var(--white);font-family:var(--fb);font-size:.84rem;color:var(--text);outline:none;transition:border-color .2s;}
    .fi:focus{border-color:var(--sand-dark);}
    .ferr{font-size:.72rem;color:#E05A5A;margin-top:6px;}
    .auth-switch{text-align:center;margin-top:13px;font-size:.78rem;color:var(--text-muted);}
    .auth-switch button{background:none;border:none;cursor:pointer;color:var(--accent);font-weight:500;font-family:var(--fb);}
    .spbtn{display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:30px;cursor:pointer;font-family:var(--fb);font-size:.73rem;font-weight:500;border:1.5px solid var(--border);background:var(--white);color:var(--text-muted);transition:all .2s;white-space:nowrap;}
    .spbtn.active{border-color:var(--soil);background:var(--soil);color:var(--sand-light);}

    /* UPLOAD */
    .upload-zone{border:2px dashed var(--border);border-radius:13px;padding:34px 20px;text-align:center;cursor:pointer;transition:border-color .2s,background .2s;}
    .upload-zone:hover,.upload-zone.drag{border-color:var(--sand-dark);background:var(--sand-light);}
    .upload-preview{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:13px;margin-bottom:13px;}

    /* DASHBOARD */
    .dashboard{max-width:680px;margin:0 auto;padding:26px 18px;}
    .dash-title{font-family:var(--fd);font-size:1.45rem;color:var(--soil);margin-bottom:18px;}
    .earn-card{background:linear-gradient(135deg,var(--soil) 0%,var(--mid) 100%);border-radius:20px;padding:26px;color:var(--sand-light);margin-bottom:16px;position:relative;overflow:hidden;}
    .earn-card::before{content:'';position:absolute;top:-35px;right:-35px;width:140px;height:140px;border-radius:50%;background:rgba(232,201,160,.06);}
    .earn-card::after{content:'';position:absolute;bottom:-50px;left:-25px;width:180px;height:180px;border-radius:50%;background:rgba(212,132,90,.06);}
    .earn-lbl{font-size:.66rem;letter-spacing:.2em;text-transform:uppercase;opacity:.58;margin-bottom:4px;}
    .earn-amt{font-family:var(--fi);font-size:3rem;color:var(--sand);letter-spacing:.04em;position:relative;z-index:1;}
    .earn-pts{font-size:.76rem;opacity:.52;margin-top:3px;}
    .earn-row{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;position:relative;z-index:1;}
    .earn-mini{flex:1;min-width:85px;background:rgba(255,255,255,.07);border-radius:10px;padding:10px 12px;}
    .earn-mini-v{font-family:var(--fi);font-size:1.25rem;color:var(--sand);}
    .earn-mini-l{font-size:.63rem;opacity:.52;margin-top:1px;}
    .verify-banner{background:rgba(212,132,90,.1);border:1.5px solid var(--accent);border-radius:13px;padding:13px 16px;display:flex;align-items:center;gap:11px;margin-bottom:16px;}
    .vcta{padding:7px 15px;border-radius:40px;border:none;cursor:pointer;background:var(--accent);color:var(--white);font-family:var(--fb);font-size:.74rem;font-weight:500;text-decoration:none;display:inline-block;transition:background .2s;white-space:nowrap;}
    .vcta:hover{background:var(--soil);}
    .dash-card{background:var(--white);border-radius:15px;padding:18px;margin-bottom:13px;box-shadow:var(--shadow);}
    .dc-title{font-size:.7rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px;}
    .pout-btn{padding:8px 20px;border-radius:40px;border:none;cursor:pointer;background:var(--soil);color:var(--sand-light);font-family:var(--fb);font-size:.78rem;font-weight:500;transition:all .2s;}
    .pout-btn:disabled{opacity:.4;cursor:not-allowed;}
    .pout-btn:not(:disabled):hover{background:var(--mid);}

    /* ADMIN */
    .admin-panel{max-width:800px;margin:0 auto;padding:26px 18px;}
    .admin-title{font-family:var(--fd);font-size:1.45rem;color:var(--soil);margin-bottom:3px;}
    .admin-sub{font-size:.78rem;color:var(--text-muted);margin-bottom:20px;}
    .admin-table-wrap{overflow-x:auto;}
    .admin-table{width:100%;border-collapse:collapse;font-size:.78rem;}
    .admin-table th{text-align:left;padding:8px 11px;font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);border-bottom:1.5px solid var(--border);}
    .admin-table td{padding:8px 11px;border-bottom:1px solid var(--border);color:var(--text);}
    .admin-table tr:last-child td{border-bottom:none;}
    .tvbtn{padding:4px 11px;border-radius:20px;border:none;cursor:pointer;font-size:.68rem;font-weight:500;font-family:var(--fb);transition:all .2s;}
    .tvbtn.v{background:#D4EDD4;color:#2D7A2D;}
    .tvbtn.u{background:#FDE8D8;color:#C04A1A;}

    /* DAILY */
    .daily-hdr{padding:30px 20px 14px;display:flex;align-items:baseline;gap:11px;}
    .daily-title{font-family:var(--fd);font-size:1.8rem;font-weight:400;color:var(--soil);}
    .daily-date{font-size:.74rem;color:var(--text-muted);}
    .daily-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:13px;padding:0 20px;}
    .daily-wrap{border-radius:15px;overflow:hidden;aspect-ratio:3/4;box-shadow:var(--shadow);cursor:pointer;}
    .daily-wrap img{width:100%;height:100%;object-fit:cover;transition:transform .35s;}
    .daily-wrap:hover img{transform:scale(1.05);}

    /* PROFILE */
    .profile-hdr{background:linear-gradient(135deg,var(--dark),var(--mid));padding:42px 20px 30px;text-align:center;}
    .prof-av-wrap{position:relative;width:88px;height:88px;margin:0 auto 11px;}
    .prof-av{width:88px;height:88px;border-radius:50%;object-fit:cover;border:3px solid var(--sand);}
    .prof-av-fb{width:88px;height:88px;border-radius:50%;background:var(--sand-light);display:flex;align-items:center;justify-content:center;font-size:1.8rem;font-weight:600;color:var(--soil);border:3px solid var(--sand);}
    .prof-name{font-family:var(--fd);font-size:1.35rem;color:var(--sand-light);margin-bottom:2px;}
    .prof-handle{font-size:.76rem;color:var(--sand-dark);}
    .prof-bio{font-size:.8rem;color:var(--sand);opacity:.72;margin-top:7px;max-width:290px;margin-inline:auto;line-height:1.5;}
    .prof-stats{display:flex;justify-content:center;gap:26px;margin-top:16px;}
    .psn{font-family:var(--fi);font-size:1.25rem;color:var(--sand);letter-spacing:.04em;text-align:center;}
    .psl{font-size:.63rem;color:var(--sand-dark);text-transform:uppercase;letter-spacing:.1em;text-align:center;}
    .prof-act{display:flex;justify-content:center;gap:9px;margin-top:12px;}
    .prof-socials{display:flex;justify-content:center;gap:8px;margin-top:10px;flex-wrap:wrap;}
    .psoc{display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;background:rgba(255,255,255,.06);border:1px solid rgba(232,201,160,.13);color:var(--sand-dark);text-decoration:none;font-size:.72rem;transition:all .2s;}
    .psoc:hover{background:rgba(255,255,255,.11);color:var(--sand);}
    .follow-btn{padding:7px 22px;border-radius:40px;cursor:pointer;font-family:var(--fb);font-size:.78rem;font-weight:500;transition:all .2s;}
    .fb-fill{background:var(--sand);color:var(--dark);border:none;}
    .fb-ghost{background:transparent;color:var(--sand);border:1.5px solid rgba(232,201,160,.38);}

    /* TOAST */
    .toast-wrap{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:300;display:flex;flex-direction:column;gap:6px;pointer-events:none;}
    @media(min-width:769px){.toast-wrap{bottom:26px;}}
    .toast{background:var(--dark);color:var(--sand-light);padding:9px 19px;border-radius:40px;font-size:.78rem;white-space:nowrap;box-shadow:var(--shadow-lg);animation:toastIn .3s cubic-bezier(.34,1.56,.64,1);}
    @keyframes toastIn{from{transform:translateY(16px);opacity:0;}to{transform:translateY(0);opacity:1;}}

    /* MISC */
    .spinner{width:32px;height:32px;border-radius:50%;border:3px solid var(--border);border-top-color:var(--sand-dark);animation:spin .8s linear infinite;margin:60px auto;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .empty-state{text-align:center;padding:58px 20px;color:var(--text-muted);}
    .empty-state-icon{font-size:2.6rem;margin-bottom:10px;}
    .empty-state-text{font-size:.84rem;}
    .tag-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;background:var(--sand-light);color:var(--soil);font-size:.68rem;font-weight:500;}
    .tag-badge.creator{background:linear-gradient(90deg,var(--soil),var(--mid));color:var(--sand-light);}
    .page-fade{animation:fadeIn .3s ease;}

    /* FOOTER */
    .footer{background:var(--dark);padding:34px 24px 46px;text-align:center;}
    .footer-logo-img{height:40px;margin-bottom:9px;opacity:.88;}
    .footer-tagline{font-family:var(--fd);font-size:.9rem;font-style:italic;color:var(--sand-dark);margin-bottom:16px;}
    .footer-social{display:flex;justify-content:center;gap:9px;margin-bottom:16px;}
    .soc-btn{width:36px;height:36px;border-radius:50%;border:1.5px solid rgba(232,201,160,.18);display:flex;align-items:center;justify-content:center;color:var(--sand-dark);text-decoration:none;font-size:.95rem;transition:all .2s;}
    .soc-btn:hover{border-color:var(--sand);color:var(--sand);}
    .footer-links{display:flex;justify-content:center;gap:16px;flex-wrap:wrap;margin-bottom:16px;}
    .footer-link{color:var(--sand-dark);text-decoration:none;font-size:.73rem;transition:color .2s;}
    .footer-link:hover{color:var(--sand);}
    .footer-copy{font-size:.66rem;color:var(--text-muted);opacity:.42;}

    /* CA SECTION */
    .ca-section{display:none;background:var(--soil);padding:13px 24px;text-align:center;}
    .ca-label{font-size:.63rem;letter-spacing:.2em;text-transform:uppercase;color:var(--sand-dark);margin-bottom:4px;}
    .ca-addr{font-family:monospace;font-size:.78rem;color:var(--sand);background:rgba(255,255,255,.07);padding:7px 15px;border-radius:8px;cursor:pointer;transition:background .2s;display:inline-block;word-break:break-all;}
    .ca-addr:hover{background:rgba(255,255,255,.13);}
    .ca-hint{font-size:.62rem;color:var(--sand-dark);margin-top:3px;opacity:.6;}
  `}</style>
);

// ─── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
}
const ptsToDollars = pts => (pts / POINTS_TO_DOLLAR).toFixed(2);

// ─── Toast ─────────────────────────────────────────────────────────────────────
const ToastContainer = ({ toasts }) => (
  <div className="toast-wrap">{toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}</div>
);
function useToast() {
  const [toasts, set] = useState([]);
  const show = useCallback((msg, dur = 2800) => {
    const id = Date.now();
    set(p => [...p, { id, msg }]);
    setTimeout(() => set(p => p.filter(t => t.id !== id)), dur);
  }, []);
  return { toasts, show };
}

// ─── 3D Tilt ───────────────────────────────────────────────────────────────────
function useTilt(ref) {
  useEffect(() => {
    const el = ref.current; if (!el) return;
    function move(e) {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  - .5) * 17;
      const y = ((e.clientY - r.top)  / r.height - .5) * 17;
      el.style.transform = `perspective(700px) rotateY(${x}deg) rotateX(${-y}deg) translateZ(5px)`;
      el.style.boxShadow = `${-x*1.4}px ${y*1.4}px 36px rgba(92,58,30,.17)`;
    }
    function leave() { el.style.transform = ""; el.style.boxShadow = ""; }
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => { el.removeEventListener("mousemove", move); el.removeEventListener("mouseleave", leave); };
  }, [ref]);
}

function TiltCard({ icon, title, desc, num }) {
  const r = useRef(); useTilt(r);
  return (
    <div className="tilt-card" ref={r} style={{ transition: "transform .15s ease-out, box-shadow .15s ease-out" }}>
      <div className="tilt-num">{num}</div>
      <span className="tilt-icon">{icon}</span>
      <div className="tilt-title">{title}</div>
      <div className="tilt-desc">{desc}</div>
    </div>
  );
}

// ─── Parallax ──────────────────────────────────────────────────────────────────
function useParallax() {
  const r = useRef();
  useEffect(() => {
    function s() { if (r.current) r.current.style.transform = `translateY(${window.scrollY*.32}px)`; }
    window.addEventListener("scroll", s, { passive: true });
    return () => window.removeEventListener("scroll", s);
  }, []);
  return r;
}

// ─── Scroll Fade-in ────────────────────────────────────────────────────────────
function useFadeIn() {
  const r = useRef();
  useEffect(() => {
    const el = r.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.style.opacity = "1"; el.style.transform = "translateY(0)"; obs.disconnect(); }
    }, { threshold: .1 });
    el.style.opacity = "0"; el.style.transform = "translateY(32px)";
    el.style.transition = "opacity .7s ease, transform .7s cubic-bezier(.34,1.56,.64,1)";
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return r;
}

// ─── Gallery Mosaic ────────────────────────────────────────────────────────────
// Images: ft1.jpg → ft16.jpg in your public folder
// 3 rows, staggered directions & speeds, hover pauses all rows
const GALLERY_IMGS = Array.from({ length: 16 }, (_, i) => `ft${i + 1}.jpg`);

// Row configs: [imageIndices, direction, speed, tile height]
const GALLERY_ROWS_CFG = [
  { imgs: [0,1,2,3,4,5,6,7,0,1,2,3,4,5,6,7], dir:"row-fwd", dur:"34s", h:220 },
  { imgs: [8,9,10,11,12,13,14,15,8,9,10,11,12,13,14,15], dir:"row-rev", dur:"28s", h:260 },
  { imgs: [3,7,11,0,14,5,9,2,3,7,11,0,14,5,9,2], dir:"row-fwd", dur:"38s", h:200 },
];

const TILE_LABELS = [
  "Sole perfection","Sun-kissed","Sandy soles","Arch study",
  "Barefoot bliss","Golden hour","Toe art","Sole focus",
  "Pedicure goals","Soft steps","Free sole","Sole story",
  "Elegant arches","Natural beauty","Sole poetry","Pure grace",
];

// Aspect ratio variety per position (width multiplier relative to height)
const TILE_WIDTHS = [0.75, 0.85, 0.7, 0.8, 0.9, 0.72, 0.82, 0.78];

function GalleryMosaic({ onAuth }) {
  return (
    <div className="gallery-section">
      <div className="gallery-rows">
        {GALLERY_ROWS_CFG.map((row, ri) => (
          <div
            key={ri}
            className={`gallery-row ${row.dir}`}
            style={{ "--dur": row.dur }}
          >
            {row.imgs.map((imgIdx, ti) => {
              const w = row.h * TILE_WIDTHS[ti % TILE_WIDTHS.length];
              return (
                <div
                  key={ti}
                  className="gallery-tile"
                  style={{ width: w, height: row.h }}
                >
                  <img
                    src={GALLERY_IMGS[imgIdx]}
                    alt=""
                    loading="lazy"
                    onError={e => {
                      // fallback gradient if image not yet added
                      e.target.style.display = "none";
                      e.target.parentElement.style.background =
                        `linear-gradient(135deg, hsl(${(imgIdx * 23) % 360},20%,16%), hsl(${(imgIdx * 23 + 40) % 360},25%,22%))`;
                    }}
                  />
                  <div className="gallery-tile-shine" />
                  <div className="gallery-tile-hover-label">
                    <div className="gthl-inner">{TILE_LABELS[(imgIdx + ti) % TILE_LABELS.length]}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Centered overlay text */}
      <div className="gallery-center-overlay">
        <div className="gallery-center-text">
          <div className="gct-eyebrow">Soles Gallery</div>
          <div className="gct-headline">
            Every sole<br /><em>tells a story</em>
          </div>
          <div className="gct-sub">Browse thousands of creators</div>
        </div>
      </div>
    </div>
  );
}

// ─── Landing Page ──────────────────────────────────────────────────────────────
function LandingPage({ onAuth, onNavigate }) {
  const bgRef  = useParallax();
  const hiwRef = useFadeIn();
  const spotRef= useFadeIn();
  const comRef = useFadeIn();

  const mqItems = ["Free for Members","Paid for Creators","Daily Fresh Drops","Verified Creators","Follow Your Favorites","The World's #1 Foot Community","🦶"];
  const mq = [...mqItems, ...mqItems];

  return (
    <div className="page-fade">
      {/* HERO */}
      <div className="hero">
        <div className="hero-bg" ref={bgRef} />
        <div className="hero-grain" />
        <div className="hero-ring"><span/><span/><span/></div>
        <div className="hero-content">
          <div className="hero-overline">The World's #1 Foot Community</div>
          <div className="hero-logo-wrap">
            <img src="logo.png" className="hero-logo-img" alt="SOLES" onError={e => { e.target.style.display="none"; }} />
          </div>
          <h1 className="hero-headline">Where admirers<em>discover soles</em></h1>
          <p className="hero-sub">— and creators get paid for theirs —</p>
          <div className="hero-ctas">
            <button className="btn-hp" onClick={() => onAuth("signup")}>Join the Community</button>
            <button className="btn-hg" onClick={() => onNavigate("explore")}>Browse Soles</button>
          </div>
        </div>
        <div className="hero-scroll">
          <div className="scroll-line" />
          <div className="scroll-txt">Scroll</div>
        </div>
      </div>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {mq.map((t, i) => <div key={i} className="mq-item"><span className="mq-dot"/>{t}</div>)}
        </div>
      </div>

      {/* GALLERY MOSAIC */}
      <GalleryMosaic onAuth={onAuth} />

      {/* HOW IT WORKS */}
      <div className="hiw" ref={hiwRef}>
        <div className="hiw-eyebrow">The Platform</div>
        <div className="hiw-title">Simple. Beautiful. <em>Rewarding.</em></div>
        <div className="hiw-grid">
          <TiltCard num="01" icon="👁️" title="Browse Freely"    desc="Every post on SOLES is free to view. No subscriptions, no paywalls — just an open gallery of the world's most celebrated feet." />
          <TiltCard num="02" icon="❤️" title="Like & Follow"   desc="Follow the Soles Stars you love. Like content, leave comments, build your personal feed around what actually moves you." />
          <TiltCard num="03" icon="✨" title="Become a Creator" desc="Post your content, grow a following, and let your fanbase come to you. SOLES handles discovery — you handle the magic." />
          <TiltCard num="04" icon="💸" title="Earn Real Money"  desc="Verified creators earn on every like, comment, and view. Request a payout every 12 hours. Your passion pays." />
        </div>
      </div>

      {/* CREATOR SPOTLIGHT */}
      <div className="spotlight" ref={spotRef}>
        <div className="spotlight-bg" />
        <div className="spotlight-inner">
          <div className="spotlight-grid">
            <div>
              <div className="spot-eyebrow">For Creators</div>
              <h2 className="spot-heading">Your feet.<br /><em>Your income.</em></h2>
              <p className="spot-body">SOLES was built so creators actually benefit. You post, your audience engages, and the platform pays you directly — no brand deals, no follower minimum to start earning.</p>
              <div className="perks">
                {[
                  ["🪪","One-time verification","Quick Telegram process. Do it once, earn forever."],
                  ["📊","Live earnings dashboard","See your points and balance update in real time."],
                  ["⏱️","Payout every 12 hours","No month-long waits. Your money moves when you do."],
                ].map(([ic, t, s]) => (
                  <div key={t} className="perk">
                    <div className="perk-icon">{ic}</div>
                    <div><strong>{t}</strong><span>{s}</span></div>
                  </div>
                ))}
              </div>
              <button className="btn-hp" style={{ marginTop: 28, padding: "12px 28px", fontSize: ".78rem" }} onClick={() => onAuth("signup")}>Start Earning →</button>
            </div>
            <div className="mock-cards">
              {[["🦶","sole_star_one",2841],["🦶","pedicure_queen",1337]].map(([ic, nm, lk], i) => (
                <div key={i} className="mock-card">
                  <div className="mock-img">{ic}</div>
                  <div className="mock-footer">
                    <div className="mock-name">@{nm}</div>
                    <div className="mock-hearts">❤️ {lk.toLocaleString()}</div>
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
            <button className="comm-btn join comm-btn-btn" onClick={() => onAuth("signup")}>🦶 Join SOLES Free</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ user, size = 28 }) {
  const s = { width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "var(--sand-light)" };
  if (user?.photoURL) return <img src={user.photoURL} alt="" style={{ ...s, objectFit: "cover" }} />;
  return <div style={{ ...s, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size*.38, fontWeight: 600, color: "var(--soil)" }}>{(user?.displayName || user?.username || "?")[0].toUpperCase()}</div>;
}

// ─── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, currentUser, onOpen, onLike }) {
  const liked = currentUser && post.likes?.includes(currentUser.uid);
  return (
    <div className="post-card" onClick={() => onOpen(post)}>
      {post.imageURL ? <img className="pc-img" src={post.imageURL} alt="" loading="lazy" /> : <div className="pc-img" style={{ display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2.4rem" }}>🦶</div>}
      <div className="pc-body">
        <div className="pc-header">
          <div className="pav">{post.creatorPhoto ? <img src={post.creatorPhoto} alt="" /> : <div className="pav-fb">{(post.creatorName||"?")[0]}</div>}</div>
          <span className="pc-name">{post.creatorName||"Soles Star"}{post.creatorVerified&&<span className="vbadge">✓</span>}</span>
        </div>
        {post.caption && <p className="pc-caption">{post.caption}</p>}
        <div className="pc-actions">
          <button className={`pac ${liked?"liked":""}`} onClick={e=>{e.stopPropagation();onLike(post);}}>{liked?"❤️":"🤍"} {post.likesCount||0}</button>
          <button className="pac">💬 {post.commentsCount||0}</button>
          <span style={{marginLeft:"auto",fontSize:".67rem",color:"var(--text-muted)"}}>{timeAgo(post.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Post Modal ────────────────────────────────────────────────────────────────
function PostModal({ post, currentUser, onClose, onLike, showToast }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const liked = currentUser && post.likes?.includes(currentUser.uid);

  useEffect(() => {
    const q = query(collection(db,"comments"), where("postId","==",post.id), orderBy("createdAt","asc"));
    return onSnapshot(q, snap => { setComments(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); });
  }, [post.id]);

  async function submit() {
    if (!text.trim()) return;
    if (!currentUser) { showToast("Sign in to comment"); return; }
    await addDoc(collection(db,"comments"), { postId:post.id, uid:currentUser.uid, name:currentUser.displayName||"Member", text:text.trim(), createdAt:serverTimestamp() });
    await updateDoc(doc(db,"posts",post.id), { commentsCount:increment(1) });
    if (post.creatorId && post.creatorId !== currentUser.uid) await updateDoc(doc(db,"users",post.creatorId), { points:increment(2) });
    setText("");
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div className="modal-img-side">
          {post.imageURL ? <img src={post.imageURL} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"3.5rem"}}>🦶</div>}
        </div>
        <div className="modal-content-side">
          <div className="modal-header">
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <div className="pav" style={{width:26,height:26}}>{post.creatorPhoto?<img src={post.creatorPhoto} alt=""/>:<div className="pav-fb" style={{fontSize:".7rem"}}>{(post.creatorName||"?")[0]}</div>}</div>
              <div>
                <div className="pc-name">{post.creatorName}{post.creatorVerified&&<span className="vbadge">✓</span>}</div>
                <div style={{fontSize:".66rem",color:"var(--text-muted)"}}>{timeAgo(post.createdAt)}</div>
              </div>
            </div>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          {post.caption && <div style={{padding:"9px 13px",fontSize:".78rem",borderBottom:"1px solid var(--border)"}}>{post.caption}</div>}
          <div className="comments-list">
            {loading && <div className="spinner" style={{margin:"18px auto",width:20,height:20,borderWidth:2}}/>}
            {comments.map(c => (
              <div key={c.id} className="ci">
                <div className="pav" style={{width:24,height:24,flexShrink:0}}><div className="pav-fb" style={{fontSize:".68rem"}}>{(c.name||"?")[0]}</div></div>
                <div><span className="ca-name">{c.name} </span><span className="ca-text">{c.text}</span><div className="ca-time">{timeAgo(c.createdAt)}</div></div>
              </div>
            ))}
            {!loading && !comments.length && <div style={{textAlign:"center",color:"var(--text-muted)",fontSize:".76rem",paddingTop:14}}>No comments yet</div>}
          </div>
          <div style={{padding:"7px 13px",borderTop:"1px solid var(--border)"}}>
            <button className={`pac ${liked?"liked":""}`} onClick={()=>onLike(post)} style={{fontSize:".95rem"}}>{liked?"❤️":"🤍"} {post.likesCount||0}</button>
          </div>
          <div className="cir">
            <input className="cinput" placeholder={currentUser?"Add a comment…":"Sign in to comment"} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} disabled={!currentUser} />
            <button className="csend" onClick={submit} disabled={!text.trim()}>↑</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Modal ────────────────────────────────────────────────────────────────
function AuthModal({ onClose, showToast }) {
  const [mode, setMode]     = useState("login");
  const [role, setRole]     = useState("member");
  const [form, setForm]     = useState({ email:"", password:"", username:"", bio:"" });
  const [actSoc, setActSoc] = useState([]);
  const [socLinks, setSocLinks] = useState({});
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleSoc = id => setActSoc(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);

  async function submit() {
    setError(""); setLoading(true);
    try {
      if (mode === "signup") {
        const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(user, { displayName: form.username || form.email.split("@")[0] });
        const socials = {};
        actSoc.forEach(id => { if (socLinks[id]) socials[id] = socLinks[id]; });
        await setDoc(doc(db,"users",user.uid), {
          uid:user.uid, username:form.username||form.email.split("@")[0],
          displayName:form.username||form.email.split("@")[0], email:form.email, role,
          bio:form.bio||"", photoURL:null, verified:false, points:0,
          followersCount:0, followingCount:0, postsCount:0,
          totalEarnings:0, lastPayoutRequest:null, socials, createdAt:serverTimestamp(),
        });
        showToast("Welcome to SOLES 🦶"); onClose();
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        showToast("Welcome back 🦶"); onClose();
      }
    } catch (e) {
      const m = { "auth/email-already-in-use":"Email already in use.","auth/invalid-email":"Invalid email.","auth/weak-password":"Password needs 6+ chars.","auth/user-not-found":"No account found.","auth/wrong-password":"Wrong password.","auth/invalid-credential":"Invalid credentials." };
      setError(m[e.code] || e.message);
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <img src="logo.png" className="auth-logo-img" alt="SOLES" onError={e=>{e.target.style.display="none";}} />
        </div>
        <div className="auth-title">{mode==="login"?"Welcome back":"Join SOLES"}</div>
        <div className="auth-sub">{mode==="login"?"Sign in to your account":"We just like feet.."}</div>

        {mode==="signup" && (
          <div className="role-select">
            <button className={`role-btn ${role==="member"?"active":""}`} onClick={()=>setRole("member")}>👁️ Member</button>
            <button className={`role-btn ${role==="creator"?"active":""}`} onClick={()=>setRole("creator")}>✨ Creator</button>
          </div>
        )}
        {mode==="signup" && <div className="fg"><label className="fl">Username</label><input className="fi" placeholder="soles_star" value={form.username} onChange={e=>sf("username",e.target.value)}/></div>}
        <div className="fg"><label className="fl">Email</label><input className="fi" type="email" placeholder="you@email.com" value={form.email} onChange={e=>sf("email",e.target.value)}/></div>
        <div className="fg"><label className="fl">Password</label><input className="fi" type="password" placeholder="••••••••" value={form.password} onChange={e=>sf("password",e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
        {mode==="signup" && (
          <>
            <div className="fg"><label className="fl">Bio (optional)</label><input className="fi" placeholder="A line about you" value={form.bio} onChange={e=>sf("bio",e.target.value)}/></div>
            {role==="creator" && (
              <div className="fg">
                <label className="fl">Your Socials (optional)</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                  {SOCIAL_PLATFORMS.map(p => <button key={p.id} className={`spbtn ${actSoc.includes(p.id)?"active":""}`} onClick={()=>toggleSoc(p.id)}><span>{p.icon}</span>{p.label}</button>)}
                </div>
                {actSoc.length > 0 && (
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {actSoc.map(id => {
                      const plat = SOCIAL_PLATFORMS.find(p=>p.id===id);
                      return (
                        <div key={id} style={{display:"flex",alignItems:"center",gap:7}}>
                          <span style={{fontSize:"1rem",width:20,textAlign:"center"}}>{plat.icon}</span>
                          <input className="fi" style={{flex:1}} placeholder={plat.placeholder} value={socLinks[id]||""} onChange={e=>setSocLinks(p=>({...p,[id]:e.target.value}))} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {error && <div className="ferr">{error}</div>}
        <button className="btn-primary" style={{width:"100%",marginTop:16}} onClick={submit} disabled={loading}>{loading?"Please wait…":mode==="login"?"Sign In":"Create Account"}</button>
        <div className="auth-switch">
          {mode==="login" ? <>Don't have an account? <button onClick={()=>setMode("signup")}>Sign up</button></> : <>Already have an account? <button onClick={()=>setMode("login")}>Sign in</button></>}
        </div>
      </div>
    </div>
  );
}

// ─── Upload Modal ──────────────────────────────────────────────────────────────
function UploadModal({ currentUser, userData, onClose, showToast }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [drag, setDrag] = useState(false);

  function handleFile(f) {
    if (!f || !f.type.startsWith("image/")) { showToast("Images only!"); return; }
    setFile(f); setPreview(URL.createObjectURL(f));
  }
  async function submit() {
    if (!file) return; setLoading(true);
    try {
      const ir = ref(storage,`posts/${currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(ir, file);
      const imageURL = await getDownloadURL(ir);
      await addDoc(collection(db,"posts"), { creatorId:currentUser.uid, creatorName:userData?.displayName||currentUser.displayName||"Soles Star", creatorPhoto:userData?.photoURL||currentUser.photoURL||null, creatorVerified:userData?.verified||false, imageURL, caption:caption.trim(), likes:[], likesCount:0, commentsCount:0, viewsCount:0, createdAt:serverTimestamp() });
      await updateDoc(doc(db,"users",currentUser.uid), { postsCount:increment(1) });
      showToast("Posted! 🦶"); onClose();
    } catch { showToast("Upload failed, try again."); }
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
          <div className={`upload-zone ${drag?"drag":""}`} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);}} onClick={()=>document.getElementById("fu-input").click()}>
            <div style={{fontSize:"2.2rem",marginBottom:8}}>🦶</div>
            <div style={{fontSize:".84rem",color:"var(--text-muted)"}}>Tap or drop image here</div>
            <input id="fu-input" type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])} />
          </div>
        ) : (
          <>
            <img src={preview} className="upload-preview" alt="" />
            <div className="fg"><label className="fl">Caption</label><textarea className="fi" placeholder="Say something…" value={caption} onChange={e=>setCaption(e.target.value)} rows={3} style={{resize:"vertical"}}/></div>
            {!userData?.verified && <div style={{fontSize:".74rem",color:"var(--accent)",background:"rgba(212,132,90,.1)",padding:"7px 11px",borderRadius:8,marginBottom:11}}>⚠️ Earnings won't count until verified — post freely!</div>}
            <div style={{display:"flex",gap:9}}>
              <button className="btn-outline" style={{flex:1}} onClick={()=>{setFile(null);setPreview(null);}}>Change</button>
              <button className="btn-primary" style={{flex:2}} onClick={submit} disabled={loading}>{loading?"Uploading…":"Post 🦶"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Creator Dashboard ─────────────────────────────────────────────────────────
function CreatorDashboard({ currentUser, userData, showToast }) {
  const [requesting, setRequesting] = useState(false);
  const pts = userData?.points || 0;
  const dollars = parseFloat(ptsToDollars(pts));
  const canPayout = userData?.verified && dollars >= MIN_PAYOUT_DOLLARS;
  const canNow = () => {
    if (!userData?.lastPayoutRequest) return true;
    const last = userData.lastPayoutRequest.toDate ? userData.lastPayoutRequest.toDate() : new Date(userData.lastPayoutRequest);
    return Date.now() - last.getTime() > PAYOUT_COOLDOWN_HOURS * 3600000;
  };
  async function reqPayout() {
    if (!canPayout || !canNow()) return; setRequesting(true);
    await addDoc(collection(db,"payoutRequests"), { uid:currentUser.uid, username:userData.username, email:userData.email, amount:dollars, points:pts, status:"pending", requestedAt:serverTimestamp() });
    await updateDoc(doc(db,"users",currentUser.uid), { lastPayoutRequest:serverTimestamp(), points:0, totalEarnings:increment(dollars) });
    showToast(`Payout of $${dollars} requested! 💸`); setRequesting(false);
  }

  return (
    <div className="dashboard">
      <div className="dash-title">Creator Studio</div>
      {!userData?.verified && (
        <div className="verify-banner">
          <span style={{fontSize:"1.35rem"}}>🪪</span>
          <div style={{flex:1}}><strong style={{fontSize:".83rem",color:"var(--soil)",display:"block"}}>Verify to earn</strong><span style={{fontSize:".74rem",color:"var(--text-muted)"}}>Quick Telegram process — do it once</span></div>
          <a href={TELEGRAM_VERIFY_LINK} target="_blank" rel="noreferrer" className="vcta">Verify →</a>
        </div>
      )}
      <div className="earn-card">
        <div className="earn-lbl">Available Balance</div>
        <div className="earn-amt">${dollars}</div>
        <div className="earn-pts">{pts.toFixed(0)} pts · min ${MIN_PAYOUT_DOLLARS} to cash out</div>
        <div className="earn-row">
          <div className="earn-mini"><div className="earn-mini-v">{userData?.postsCount||0}</div><div className="earn-mini-l">Posts</div></div>
          <div className="earn-mini"><div className="earn-mini-v">{userData?.followersCount||0}</div><div className="earn-mini-l">Followers</div></div>
          <div className="earn-mini"><div className="earn-mini-v">${(userData?.totalEarnings||0).toFixed(2)}</div><div className="earn-mini-l">Total Earned</div></div>
        </div>
      </div>
      <div className="dash-card">
        <div className="dc-title">How you earn</div>
        <div style={{fontSize:".78rem",lineHeight:1.9}}>❤️ Like = <strong>1 pt</strong> · 💬 Comment = <strong>2 pts</strong> · 👁 View = <strong>0.1 pts</strong><br/><span style={{fontSize:".68rem",color:"var(--text-muted)"}}>{POINTS_TO_DOLLAR} pts = $1 · Min ${MIN_PAYOUT_DOLLARS} · Cooldown {PAYOUT_COOLDOWN_HOURS}h</span></div>
      </div>
      <div className="dash-card">
        <div className="dc-title">Payout Request</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:9}}>
          <div style={{fontSize:".81rem"}}>Balance: <strong>${dollars}</strong>{userData?.lastPayoutRequest&&<span style={{display:"block",fontSize:".68rem",color:"var(--text-muted)",marginTop:2}}>Last: {timeAgo(userData.lastPayoutRequest)} ago</span>}</div>
          <button className="pout-btn" disabled={!canPayout||!canNow()||requesting} onClick={reqPayout}>{requesting?"…":"Request Payout"}</button>
        </div>
        {!userData?.verified&&<div style={{fontSize:".7rem",color:"var(--accent)",marginTop:7}}>Verification required</div>}
        {userData?.verified&&!canNow()&&<div style={{fontSize:".7rem",color:"var(--text-muted)",marginTop:7}}>Next available in ~{PAYOUT_COOLDOWN_HOURS}h</div>}
      </div>
      {userData?.socials && Object.keys(userData.socials).length > 0 && (
        <div className="dash-card">
          <div className="dc-title">Your Social Links</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            {SOCIAL_PLATFORMS.filter(p=>userData.socials[p.id]).map(p => (
              <a key={p.id} href={userData.socials[p.id]} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:20,background:"var(--sand-light)",color:"var(--soil)",textDecoration:"none",fontSize:".74rem",fontWeight:500}}>{p.icon} {p.label}</a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin Panel ───────────────────────────────────────────────────────────────
function AdminPanel({ showToast }) {
  const [creators, setCreators] = useState([]);
  const [payouts, setPayouts]   = useState([]);
  const [dailyImg, setDailyImg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState("creators");

  useEffect(() => { return onSnapshot(query(collection(db,"users"),where("role","==","creator")), snap=>setCreators(snap.docs.map(d=>({id:d.id,...d.data()})))); }, []);
  useEffect(() => { return onSnapshot(query(collection(db,"payoutRequests"),orderBy("requestedAt","desc"),limit(30)), snap=>setPayouts(snap.docs.map(d=>({id:d.id,...d.data()})))); }, []);

  async function toggleVerified(u) { await updateDoc(doc(db,"users",u.uid),{verified:!u.verified}); showToast(u.verified?`${u.username} unverified`:`${u.username} verified ✓`); }
  async function updPayout(id, status) { await updateDoc(doc(db,"payoutRequests",id),{status}); showToast(`Payout ${status}`); }
  async function uploadDaily() {
    if (!dailyImg) return; setUploading(true);
    const ir = ref(storage,`daily/${Date.now()}_${dailyImg.name}`);
    await uploadBytes(ir,dailyImg); const url = await getDownloadURL(ir);
    await addDoc(collection(db,"daily"),{imageURL:url,uploadedAt:serverTimestamp()});
    setDailyImg(null); showToast("Uploaded to Daily Soles 🦶"); setUploading(false);
  }

  return (
    <div className="admin-panel">
      <div className="admin-title">Admin Panel</div>
      <div className="admin-sub">Manage creators, payouts, and daily content</div>
      <div style={{display:"flex",gap:7,marginBottom:16,flexWrap:"wrap"}}>
        {["creators","payouts","daily"].map(t=><button key={t} className={`fpill ${tab===t?"active":""}`} onClick={()=>setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>)}
      </div>
      {tab==="creators"&&(
        <div className="dash-card"><div className="dc-title">Creators ({creators.length})</div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Username</th><th>Email</th><th>Points</th><th>Posts</th><th>Status</th></tr></thead><tbody>
          {creators.map(c=><tr key={c.id}><td>@{c.username}</td><td style={{maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.email}</td><td>{(c.points||0).toFixed(0)}</td><td>{c.postsCount||0}</td><td><button className={`tvbtn ${c.verified?"v":"u"}`} onClick={()=>toggleVerified(c)}>{c.verified?"✓ Verified":"Unverified"}</button></td></tr>)}
          {!creators.length&&<tr><td colSpan={5} style={{textAlign:"center",color:"var(--text-muted)",padding:22}}>No creators yet</td></tr>}
        </tbody></table></div></div>
      )}
      {tab==="payouts"&&(
        <div className="dash-card"><div className="dc-title">Payout Requests</div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Username</th><th>Amount</th><th>Date</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {payouts.map(p=><tr key={p.id}><td>@{p.username}</td><td>${p.amount}</td><td>{timeAgo(p.requestedAt)}</td><td><span className={`tag-badge ${p.status==="paid"?"":"creator"}`}>{p.status}</span></td><td>{p.status==="pending"&&<div style={{display:"flex",gap:4}}><button className="tvbtn v" onClick={()=>updPayout(p.id,"paid")}>Pay</button><button className="tvbtn u" onClick={()=>updPayout(p.id,"rejected")}>Reject</button></div>}</td></tr>)}
          {!payouts.length&&<tr><td colSpan={5} style={{textAlign:"center",color:"var(--text-muted)",padding:22}}>No requests</td></tr>}
        </tbody></table></div></div>
      )}
      {tab==="daily"&&(
        <div className="dash-card"><div className="dc-title">Upload Daily Sole</div>
          <div className="upload-zone" style={{marginBottom:12}} onClick={()=>document.getElementById("adm-f").click()}>
            <div style={{fontSize:"2rem",marginBottom:6}}>📸</div>
            <div style={{fontSize:".82rem",color:"var(--text-muted)"}}>{dailyImg?dailyImg.name:"Click to select image"}</div>
            <input id="adm-f" type="file" accept="image/*" style={{display:"none"}} onChange={e=>setDailyImg(e.target.files[0])} />
          </div>
          <button className="btn-primary" style={{width:"100%"}} onClick={uploadDaily} disabled={!dailyImg||uploading}>{uploading?"Uploading…":"Upload to Daily Soles"}</button>
        </div>
      )}
    </div>
  );
}

// ─── Daily Soles ───────────────────────────────────────────────────────────────
function DailySoles() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    return onSnapshot(query(collection(db,"daily"),orderBy("uploadedAt","desc"),limit(20)), snap=>{ setImages(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); });
  }, []);
  const today = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  return (
    <div className="page-fade">
      <div className="daily-hdr"><div className="daily-title">Daily <em style={{fontStyle:"italic",color:"var(--accent)"}}>Soles</em></div><div className="daily-date">{today}</div></div>
      {loading?<div className="spinner"/>:images.length===0
        ?<div className="empty-state"><div className="empty-state-icon">🦶</div><div className="empty-state-text">Check back soon — curated daily drops coming!</div></div>
        :<div className="daily-grid">{images.map(i=><div key={i.id} className="daily-wrap"><img src={i.imageURL} alt="" loading="lazy"/></div>)}</div>}
    </div>
  );
}

// ─── Profile Page ──────────────────────────────────────────────────────────────
function ProfilePage({ targetUid, currentUser, userData: cud, showToast, onNavigate }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts]     = useState([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openPost, setOpenPost] = useState(null);
  const isOwn = currentUser?.uid === targetUid;

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db,"users",targetUid));
      if (snap.exists()) setProfile({id:snap.id,...snap.data()});
      const ps = await getDocs(query(collection(db,"posts"),where("creatorId","==",targetUid),orderBy("createdAt","desc")));
      setPosts(ps.docs.map(d=>({id:d.id,...d.data()})));
      if (currentUser) { const fs = await getDoc(doc(db,"follows",`${currentUser.uid}_${targetUid}`)); setFollowing(fs.exists()); }
      setLoading(false);
    }
    load();
  }, [targetUid, currentUser]);

  async function toggleFollow() {
    if (!currentUser) { showToast("Sign in to follow"); return; }
    const key = `${currentUser.uid}_${targetUid}`;
    if (following) {
      await deleteDoc(doc(db,"follows",key));
      await updateDoc(doc(db,"users",targetUid),{followersCount:increment(-1)});
      await updateDoc(doc(db,"users",currentUser.uid),{followingCount:increment(-1)});
      setFollowing(false); setProfile(p=>({...p,followersCount:Math.max(0,(p.followersCount||1)-1)}));
    } else {
      await setDoc(doc(db,"follows",key),{followerId:currentUser.uid,followingId:targetUid,createdAt:serverTimestamp()});
      await updateDoc(doc(db,"users",targetUid),{followersCount:increment(1)});
      await updateDoc(doc(db,"users",currentUser.uid),{followingCount:increment(1)});
      setFollowing(true); setProfile(p=>({...p,followersCount:(p.followersCount||0)+1}));
    }
  }

  async function handleLike(post) {
    if (!currentUser) { showToast("Sign in to like"); return; }
    const liked = post.likes?.includes(currentUser.uid);
    await updateDoc(doc(db,"posts",post.id),{likes:liked?arrayRemove(currentUser.uid):arrayUnion(currentUser.uid),likesCount:increment(liked?-1:1)});
    if (!liked && post.creatorId !== currentUser.uid) await updateDoc(doc(db,"users",post.creatorId),{points:increment(1)});
    const up = p => p.id===post.id?{...p,likes:liked?p.likes.filter(x=>x!==currentUser.uid):[...(p.likes||[]),currentUser.uid],likesCount:(p.likesCount||0)+(liked?-1:1)}:p;
    setPosts(prev=>prev.map(up)); if (openPost?.id===post.id) setOpenPost(up);
  }

  if (loading) return <div className="spinner"/>;
  if (!profile) return <div className="empty-state"><div className="empty-state-icon">🫙</div><div className="empty-state-text">User not found</div></div>;
  const socials = profile.socials || {};

  return (
    <div className="page-fade">
      <div className="profile-hdr">
        <div className="prof-av-wrap">{profile.photoURL?<img src={profile.photoURL} className="prof-av" alt=""/>:<div className="prof-av-fb">{(profile.displayName||"?")[0]}</div>}</div>
        <div className="prof-name">{profile.displayName}{profile.verified&&<span style={{fontSize:".9rem",marginLeft:5,color:"var(--sand)"}}>✓</span>}</div>
        <div className="prof-handle">@{profile.username}</div>
        {profile.bio&&<div className="prof-bio">{profile.bio}</div>}
        <div className="prof-stats">
          <div><div className="psn">{profile.postsCount||0}</div><div className="psl">Posts</div></div>
          <div><div className="psn">{profile.followersCount||0}</div><div className="psl">Followers</div></div>
          <div><div className="psn">{profile.followingCount||0}</div><div className="psl">Following</div></div>
        </div>
        {Object.keys(socials).length>0&&(
          <div className="prof-socials">
            {SOCIAL_PLATFORMS.filter(p=>socials[p.id]).map(p=><a key={p.id} href={socials[p.id]} target="_blank" rel="noreferrer" className="psoc">{p.icon} {p.label}</a>)}
          </div>
        )}
        <div className="prof-act">
          {!isOwn&&<button className={`follow-btn ${following?"fb-ghost":"fb-fill"}`} onClick={toggleFollow}>{following?"Following":"Follow"}</button>}
          {isOwn&&profile.role==="creator"&&<button className="follow-btn fb-fill" onClick={()=>onNavigate("dashboard")}>Creator Studio</button>}
        </div>
      </div>
      {posts.length===0
        ?<div className="empty-state"><div className="empty-state-icon">📷</div><div className="empty-state-text">No posts yet</div></div>
        :<div className="feed-grid" style={{padding:"14px 18px"}}>{posts.map(p=><PostCard key={p.id} post={p} currentUser={currentUser} onOpen={setOpenPost} onLike={handleLike}/>)}</div>}
      {openPost&&<PostModal post={openPost} currentUser={currentUser} onClose={()=>setOpenPost(null)} onLike={handleLike} showToast={showToast}/>}
    </div>
  );
}

// ─── Main Feed ─────────────────────────────────────────────────────────────────
function MainFeed({ currentUser, userData, showToast }) {
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("latest");
  const [openPost, setOpenPost] = useState(null);

  useEffect(() => {
    const q = filter==="popular" ? query(collection(db,"posts"),orderBy("likesCount","desc"),limit(40)) : query(collection(db,"posts"),orderBy("createdAt","desc"),limit(40));
    return onSnapshot(q, snap=>{ setPosts(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); });
  }, [filter]);

  async function handleLike(post) {
    if (!currentUser) { showToast("Sign in to like 🦶"); return; }
    const liked = post.likes?.includes(currentUser.uid);
    await updateDoc(doc(db,"posts",post.id),{likes:liked?arrayRemove(currentUser.uid):arrayUnion(currentUser.uid),likesCount:increment(liked?-1:1)});
    if (!liked && post.creatorId !== currentUser.uid) await updateDoc(doc(db,"users",post.creatorId),{points:increment(1)});
    const up = p => p.id===post.id?{...p,likes:liked?p.likes.filter(x=>x!==currentUser.uid):[...(p.likes||[]),currentUser.uid],likesCount:(p.likesCount||0)+(liked?-1:1)}:p;
    setPosts(prev=>prev.map(up)); if (openPost?.id===post.id) setOpenPost(up);
  }

  return (
    <div className="page-fade">
      <div className="feed-header">
        <div className="feed-title">Explore <span>Soles</span></div>
        <div className="feed-filters">
          <button className={`fpill ${filter==="latest"?"active":""}`} onClick={()=>setFilter("latest")}>Latest</button>
          <button className={`fpill ${filter==="popular"?"active":""}`} onClick={()=>setFilter("popular")}>Popular</button>
        </div>
      </div>
      {loading?<div className="spinner"/>:posts.length===0
        ?<div className="empty-state"><div className="empty-state-icon">🦶</div><div className="empty-state-text">No posts yet — be first!</div></div>
        :<div className="feed-grid">{posts.map(p=><PostCard key={p.id} post={p} currentUser={currentUser} onOpen={setOpenPost} onLike={handleLike}/>)}</div>}
      {openPost&&<PostModal post={openPost} currentUser={currentUser} onClose={()=>setOpenPost(null)} onLike={handleLike} showToast={showToast}/>}
    </div>
  );
}

// ─── Nav ───────────────────────────────────────────────────────────────────────
function NavBar({ currentUser, userData, onNavigate, onAuth, onSignOut, onUpload }) {
  return (
    <nav className="nav">
      <div className="nav-logo" onClick={()=>onNavigate("home")}>
        <img src="logo.png" className="nav-logo-img" alt="SOLES" onError={e=>{e.target.style.display="none";}}/>
        <span className="nav-logo-text">SOLES</span>
      </div>
      <div className="nav-actions">
        {currentUser ? (
          <>
            {userData?.role==="creator"&&<button className="nav-btn nav-btn-ghost" onClick={onUpload}>+ Post</button>}
            {userData?.role==="admin"&&<button className="nav-btn nav-btn-ghost" onClick={()=>onNavigate("admin")}>⚙ Admin</button>}
            <button className="nav-chip" onClick={()=>onNavigate("profile",currentUser.uid)}>
              <Avatar user={{...currentUser,photoURL:userData?.photoURL}} size={22}/>
              {userData?.username||currentUser.displayName}
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

// ─── Tab Bar ───────────────────────────────────────────────────────────────────
function TabBar({ page, currentUser, userData, onNavigate, onAuth, onUpload }) {
  const tabs = [
    {id:"home",icon:"🏠",label:"Home"},
    {id:"explore",icon:"🔍",label:"Explore"},
    {id:"daily",icon:"📅",label:"Daily"},
    ...(currentUser
      ? [{id:"post",icon:"➕",label:"Post",action:true},{id:"profile",icon:"👤",label:"Profile"}]
      : [{id:"auth",icon:"🦶",label:"Join"}]),
  ];
  function go(t) {
    if (t.action) { userData?.role==="creator"?onUpload():onAuth("signup"); }
    else if (t.id==="profile"&&currentUser) onNavigate("profile",currentUser.uid);
    else if (t.id==="auth") onAuth("signup");
    else onNavigate(t.id);
  }
  return (
    <div className="tab-bar">
      <div className="tab-inner">
        {tabs.map(t=><div key={t.id} className={`tab-item ${page===t.id?"active":""}`} onClick={()=>go(t)}><span className="tab-icon">{t.icon}</span><span>{t.label}</span></div>)}
      </div>
    </div>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────────
function Footer({ onCopyCa }) {
  return (
    <footer className="footer">
      <img src="logo.png" className="footer-logo-img" alt="SOLES" onError={e=>{e.target.style.display="none";}}/>
      <div className="footer-tagline">We just like feet..</div>

      {/* ════════════════════════════════════════════════════════
          CONTRACT_ADDRESS_SECTION
          To activate:
          1. Remove `display:none` from `.ca-section` in CSS
          2. Uncomment the JSX block below
          3. Paste your contract address
          ════════════════════════════════════════════════════════ */}
      {/*
      <div className="ca-section" style={{display:"block"}}>
        <div className="ca-label">$SOLES Contract Address</div>
        <div className="ca-addr" onClick={onCopyCa} title="Click to copy">PASTE_YOUR_CONTRACT_ADDRESS_HERE</div>
        <div className="ca-hint">Click to copy</div>
      </div>
      */}

      <div className="footer-social">
        <a href={X_PROFILE_LINK}       target="_blank" rel="noreferrer" className="soc-btn" title="X Profile">𝕏</a>
        <a href={X_COMMUNITY_LINK}     target="_blank" rel="noreferrer" className="soc-btn" title="X Community">🫂</a>
        <a href={TELEGRAM_VERIFY_LINK} target="_blank" rel="noreferrer" className="soc-btn" title="Telegram">✈️</a>
      </div>
      <div className="footer-links">
        <a href={X_PROFILE_LINK}       target="_blank" rel="noreferrer" className="footer-link">X Profile</a>
        <a href={X_COMMUNITY_LINK}     target="_blank" rel="noreferrer" className="footer-link">X Community</a>
        <a href={TELEGRAM_VERIFY_LINK} target="_blank" rel="noreferrer" className="footer-link">Telegram</a>
      </div>
      <div className="footer-copy">© {new Date().getFullYear()} SOLES · We just like feet..</div>
    </footer>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData,    setUserData]    = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page,      setPage]      = useState("home");
  const [pageExtra, setPageExtra] = useState(null);
  const [showAuth,   setShowAuth]   = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const { toasts, show: showToast } = useToast();

  useEffect(() => {
    return onAuthStateChanged(auth, async user => {
      setCurrentUser(user);
      if (user) { const s = await getDoc(doc(db,"users",user.uid)); setUserData(s.exists()?s.data():null); }
      else setUserData(null);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    return onSnapshot(doc(db,"users",currentUser.uid), s=>{ if (s.exists()) setUserData(s.data()); });
  }, [currentUser]);

  function navigate(p, extra=null) { setPage(p); setPageExtra(extra); window.scrollTo({top:0,behavior:"smooth"}); }
  async function doSignOut() { await signOut(auth); setPage("home"); showToast("Signed out 👋"); }
  function copyCa() { navigator.clipboard.writeText("PASTE_YOUR_CONTRACT_ADDRESS_HERE").then(()=>showToast("CA copied! 📋")); }

  if (authLoading) return (
    <><GlobalStyles/><div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--cream)"}}><div className="spinner"/></div></>
  );

  function renderPage() {
    switch (page) {
      case "home":      return currentUser ? <MainFeed currentUser={currentUser} userData={userData} showToast={showToast}/> : <LandingPage onAuth={m=>setShowAuth(m)} onNavigate={navigate}/>;
      case "explore":   return <MainFeed currentUser={currentUser} userData={userData} showToast={showToast}/>;
      case "daily":     return <DailySoles/>;
      case "profile":   return pageExtra ? <ProfilePage targetUid={pageExtra} currentUser={currentUser} userData={userData} showToast={showToast} onNavigate={navigate}/> : <MainFeed currentUser={currentUser} userData={userData} showToast={showToast}/>;
      case "dashboard": return (currentUser&&userData?.role==="creator") ? <CreatorDashboard currentUser={currentUser} userData={userData} showToast={showToast}/> : <LandingPage onAuth={m=>setShowAuth(m)} onNavigate={navigate}/>;
      case "admin":     return userData?.role==="admin" ? <AdminPanel showToast={showToast}/> : <MainFeed currentUser={currentUser} userData={userData} showToast={showToast}/>;
      default:          return <MainFeed currentUser={currentUser} userData={userData} showToast={showToast}/>;
    }
  }

  return (
    <><GlobalStyles/>
      <div className="app-shell">
        <NavBar currentUser={currentUser} userData={userData} onNavigate={navigate} onAuth={m=>setShowAuth(m)} onSignOut={doSignOut} onUpload={()=>setShowUpload(true)}/>
        <main className="main-content">{renderPage()}</main>
        <Footer onCopyCa={copyCa}/>
        <TabBar page={page} currentUser={currentUser} userData={userData} onNavigate={navigate} onAuth={m=>setShowAuth(m)} onUpload={()=>setShowUpload(true)}/>
      </div>
      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} showToast={showToast}/>}
      {showUpload&&currentUser&&<UploadModal currentUser={currentUser} userData={userData} onClose={()=>setShowUpload(false)} showToast={showToast}/>}
      <ToastContainer toasts={toasts}/>
    </>
  );
}