"use client";
import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { WOW_MEMBERS } from '../../data/members';
// ── CONSTANTS & UTILS ──
const PW = 290, PH = 420;

const getISO3 = (code) => {
  const map = {
    'np': 'NPL',
    'in': 'IND',
    'au': 'AUS',
    'us': 'USA',
    'hk': 'HKG',
    'sg': 'SGP',
    'ir': 'IRN',
    'cn': 'CHN'
  };
  return map[code?.toLowerCase()] || code?.toUpperCase()?.padEnd(3, '<');
};

// ── OFFICIAL WOW LOGO COMPONENT ──
function OfficialWOWLogo({ color = "#C9A052", width = 80, height = 80, style = {} }) {
  const uid = Math.random().toString(36).slice(2,7);
  return (
    <svg viewBox="0 0 440 440" width={width} height={height} xmlns="http://www.w3.org/2000/svg" style={style}>
      <defs>
        <path id={`la${uid}`} d="M 88,220 A 132,132 0 0,1 352,220 A 132,132 0 0,1 88,220" />
        <path id={`lb${uid}`} d="M 88,220 A 132,132 0 0,0 352,220 A 132,132 0 0,0 88,220" />
      </defs>
      <circle cx="220" cy="220" r="160" fill="none" stroke={color} strokeWidth="3" />
      <circle cx="220" cy="220" r="153" fill="none" stroke={color} strokeWidth="0.9" opacity="0.45" />
      <polygon points="220,57 224,64 220,71 216,64" fill={color} opacity="0.9" />
      <polygon points="220,369 224,376 220,383 216,376" fill={color} opacity="0.9" />
      <polygon points="88,213 81,220 88,227 95,220" fill={color} opacity="0.95" />
      <polygon points="352,213 345,220 352,227 359,220" fill={color} opacity="0.95" />
      <text fontFamily="Jost,sans-serif" fontSize="13" fontWeight="500" fill={color} letterSpacing="4.5">
        <textPath href={`#la${uid}`} startOffset="25%" textAnchor="middle">WIDE OPEN WORLD</textPath>
      </text>
      <text fontFamily="Jost,sans-serif" fontSize="11" fontWeight="400" fill={color} letterSpacing="3" dy="17">
        <textPath href={`#lb${uid}`} startOffset="25%" textAnchor="middle">A GLOBAL CULTURE CLUB</textPath>
      </text>
      <circle cx="220" cy="220" r="116" fill="none" stroke={color} strokeWidth="1.4" opacity="0.55" />
      <circle cx="220" cy="220" r="102" fill="none" stroke={color} strokeWidth="2.4" />
      <ellipse cx="220" cy="220" rx="102" ry="26" fill="none" stroke={color} strokeWidth="1.05" opacity="0.76" />
      <ellipse cx="220" cy="220" rx="102" ry="52" fill="none" stroke={color} strokeWidth="0.9" opacity="0.6" />
      <ellipse cx="220" cy="220" rx="102" ry="78" fill="none" stroke={color} strokeWidth="0.75" opacity="0.46" />
      <ellipse cx="220" cy="220" rx="26" ry="102" fill="none" stroke={color} strokeWidth="1.05" opacity="0.76" />
      <ellipse cx="220" cy="220" rx="68" ry="102" fill="none" stroke={color} strokeWidth="0.9" opacity="0.6" />
      <line x1="118" y1="220" x2="322" y2="220" stroke={color} strokeWidth="0.7" opacity="0.46" />
      <line x1="220" y1="118" x2="220" y2="322" stroke={color} strokeWidth="0.7" opacity="0.46" />
      <text x="220" y="225" textAnchor="middle" dominantBaseline="middle" fontFamily="'Playfair Display',Georgia,serif" fontSize="46" fontWeight="700" fill={color} letterSpacing="8">WOW</text>
    </svg>
  );
}

// ── SINGLE PAGE SHELL ──
function Page({ children, isLeft, bg="#F8F2E2" }) {
  return (
    <div style={{
      width: PW, height: PH, flexShrink: 0,
      background: bg,
      backgroundImage: "linear-gradient(30deg,rgba(100,75,25,0.035) 1px,transparent 1px),linear-gradient(-30deg,rgba(100,75,25,0.035) 1px,transparent 1px)",
      backgroundSize: "15px 15px",
      position: "relative", overflow: "hidden",
      boxShadow: isLeft ? "inset -6px 0 18px rgba(0,0,0,0.15)" : "inset 6px 0 18px rgba(0,0,0,0.15)",
      border: "1px solid rgba(0,0,0,0.08)",
      boxSizing: "border-box"
    }}>
      {children}
    </div>
  );
}

// ── SPINE ──
function Spine() {
  return (
    <div style={{
      position: "absolute", left: 290, top: 0, width: 8, height: PH, zIndex: 100,
      background: "linear-gradient(to right, #0a1f13 0%, #153a23 30%, #153a23 70%, #0a1f13 100%)",
      boxShadow: "-2px 0 5px rgba(0,0,0,0.4), 2px 0 5px rgba(0,0,0,0.4)"
    }}/>
  );
}

// ── PASSPORT GENERATOR & LOOKUP ──
function PassportGenerator({ prefilledNumber = '' }) {
  const [numInput, setNumInput] = useState(prefilledNumber);
  const [err, setErr] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [passportData, setPassportData] = useState(null);
  
  // Book navigation: 0 = Cover, 1 = Bio, 2 = Iran Info, 3 = Overview, 4 = Back Cover
  const [spread, setSpread] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const TOTAL_SPREADS = 5;

  const lookupPassport = () => {
    const input = numInput.trim();
    if (!input) { setErr('Please enter a Passport Number.'); return; }
    setIsVerifying(true);
    setErr('');
    setTimeout(() => {
      const data = WOW_MEMBERS.find(m => m.passport_number.toUpperCase() === input.toUpperCase());
      if (data) {
        setPassportData(data);
        setSpread(0); // Reset to front cover when loading new passport
      } else {
        setErr('Passport not found. Please check your number.');
      }
      setIsVerifying(false);
    }, 500);
  };

  useEffect(() => {
    if (prefilledNumber) {
      setNumInput(prefilledNumber);
      setPassportData(null); // Keep passport locked until "Retrieve Documents" is clicked
    }
  }, [prefilledNumber]);

  if (!passportData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '3rem 1rem', width: '100%' }}>
        {/* Section heading */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: 'var(--cream)', marginBottom: '0.5rem' }}>
            WOW Digital Passport
          </h2>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.92rem', color: 'rgba(247,243,235,0.55)', maxWidth: 520 }}>
            Enter your passport number to view your personal cultural bio-data and earned visa stamps.
          </p>
        </div>

        {/* Card */}
        <div style={{
          width: '100%', maxWidth: 490,
          background: '#0d2618',
          border: '1px solid rgba(201,160,82,0.2)',
          borderRadius: 12,
          padding: '2.8rem 2.4rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
          boxShadow: '0 8px 40px rgba(0,0,0,0.45)'
        }}>
          <h3 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '2rem', fontWeight: 600,
            color: '#C9A052',
            marginBottom: '1.8rem',
            textAlign: 'center'
          }}>
            Access Passport
          </h3>

          {err && (
            <div style={{ color: '#e07070', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center', fontFamily: "'Jost', sans-serif" }}>
              {err}
            </div>
          )}

          <input
            type="text"
            value={numInput}
            onChange={e => setNumInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookupPassport()}
            placeholder="Enter Passport No. (e.g. WOW-2026-0001)"
            style={{
              width: '100%', padding: '1rem 1.2rem',
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(201,160,82,0.35)',
              borderRadius: 6,
              color: '#f7f3eb',
              fontFamily: "'Space Mono', 'Courier New', monospace",
              fontSize: '0.88rem',
              textAlign: 'center',
              marginBottom: '1.4rem',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          />

          <button
            onClick={lookupPassport}
            disabled={isVerifying}
            style={{
              width: '100%', padding: '0.95rem 1rem',
              background: isVerifying ? 'rgba(201,160,82,0.5)' : '#C9A052',
              border: 'none', borderRadius: 40,
              color: '#1a1208',
              fontFamily: "'Jost', sans-serif",
              fontSize: '0.82rem', fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              cursor: isVerifying ? 'not-allowed' : 'pointer',
              transition: 'background 0.18s, opacity 0.18s',
            }}
          >
            {isVerifying ? 'Verifying...' : 'Retrieve Documents'}
          </button>
        </div>
      </div>
    );
  }

  // Bind member data
  const memberData = passportData;
  const names = memberData.member_name.trim().split(/\s+/);
  const surname = names.length > 1 ? names[names.length - 1] : "";
  const givenNames = names.length > 1 ? names.slice(0, -1).join(" ") : names[0];
  const initials = memberData.member_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  // MRZ text generation
  const mrzSurname = surname.toUpperCase().replace(/[^A-Z]/g, '');
  const mrzGiven = givenNames.toUpperCase().replace(/\s+/g, '<<').replace(/[^A-Z<]/g, '');
  const mrzLine1 = `WOW<<${mrzSurname}<<${mrzGiven}`.padEnd(44, '<').substring(0, 44);
  const cleanNum = memberData.passport_number.replace(/-/g, '').toUpperCase();
  const iso3 = getISO3(memberData.country_code || 'np');
  const mrzLine2 = `${cleanNum}${iso3}9501015F3112318<<<<<<<<8`.substring(0, 44);

  const getSheetZIndex = (index) => {
    if (spread > index) {
      return index + 1; // Flipped left stack: higher index sits on top
    } else {
      return 10 - index; // Unflipped right stack: lower index sits on top
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/invite?uid=${memberData.passport_number}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCardSVG = () => {
    const svgElement = document.getElementById("share-card-svg");
    if (!svgElement) return;
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `${memberData.member_name.replace(/\s+/g, '_')}_WOW_Passport_Card.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Caveat:wght@400;700&family=Special+Elite&family=Jost:wght@300;400;500;600;700&display=swap');
        
        :root { --book-scale: 0.52; }
        @media (min-width: 360px) { :root { --book-scale: 0.56; } }
        @media (min-width: 400px) { :root { --book-scale: 0.62; } }
        @media (min-width: 480px) { :root { --book-scale: 0.72; } }

        .book-container {
          position: relative;
          width: 588px;
          height: 420px;
          perspective: 1600px;
          margin: 0 auto;
        }

        @media (max-width: 700px) {
          .book-container {
            zoom: var(--book-scale, 0.55);
          }
        }

        .wow-sheet {
          position: absolute;
          top: 0;
          left: 294px;
          width: 290px;
          height: 420px;
          transform-style: preserve-3d;
          transform-origin: left center;
          transition: transform 0.85s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 10;
        }

        .wow-page-front, .wow-page-back {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }

        .wow-page-back {
          transform: rotateY(180deg);
        }

        /* Leather texture styling */
        .leather-cover {
          background-color: #0d2618;
          background-image: 
            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 80%),
            radial-gradient(rgba(0,0,0,0.3) 1.2px, transparent 0),
            radial-gradient(rgba(255,255,255,0.015) 1.2px, transparent 0);
          background-size: 100% 100%, 3px 3px, 3px 3px;
          background-position: 0 0, 0 0, 1.5px 1.5px;
          box-shadow: inset 0 0 35px rgba(0, 0, 0, 0.85);
          border: 1px solid #05130b;
        }

        .gold-border {
          position: absolute;
          inset: 10px;
          border: 1.5px double rgba(201,160,82,0.45);
          pointer-events: none;
        }

        .mrz-container {
          position: absolute;
          bottom: 7px;
          left: 0;
          right: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
          pointer-events: none;
        }

        .mrz-line {
          font-family: 'Special Elite', cursive;
          font-size: 5.5px;
          letter-spacing: 0.05em;
          color: rgba(0,0,0,0.35);
          white-space: nowrap;
        }

        .page-num {
          position: absolute;
          bottom: 8px;
          font-family: "Jost", sans-serif;
          font-size: 8px;
          font-weight: 500;
          color: rgba(0,0,0,0.45);
          letter-spacing: 0.05em;
        }

        /* Navigation buttons & dots */
        .wow-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          padding: 0;
          background: rgba(255,255,255,0.2);
          transition: all 0.28s;
        }
        .wow-dot.on { background: #C9A052; width: 22px; border-radius: 4px; }

        .wow-navbtn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 0.5px solid rgba(255,255,255,0.25);
          background: #1a1712;
          color: #f7f3eb;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.18s;
        }
        .wow-navbtn:hover { background: rgba(255,255,255,0.12); }
        .wow-navbtn:disabled { opacity: 0.25; cursor: not-allowed; }

        .wow-btn {
          font-family: Jost, sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 8px 18px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          border: 0.5px solid rgba(255,255,255,0.2);
          background: #1a1712;
          color: #f7f3eb;
          transition: all 0.14s;
        }
        .wow-btn:hover { background: rgba(255,255,255,0.1); }
        .wow-btn.accent { background: #1B3D2A; color: #C9A052; border-color: #C9A052; }

        .share-platform-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          color: #C9A052;
          transition: background 0.2s;
          border: 0.5px solid rgba(201,160,82,0.3);
        }
        .share-platform-btn:hover {
          background: rgba(201,160,82,0.2);
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "20px 12px", width: '100%' }}>

        {/* ── VIEWER CONTAINER ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, width: "100%", maxWidth: "700px" }}>

          {/* Book Layout */}
          <div className="book-container" style={{ cursor: 'pointer' }}>
            {/* Left half — go back */}
            <div onClick={() => setSpread(s => s > 0 ? s - 1 : 0)} style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', zIndex: 200 }} />
            {/* Right half — go forward */}
            <div onClick={() => setSpread(s => s < TOTAL_SPREADS - 1 ? s + 1 : s)} style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', zIndex: 200 }} />

            {/* SPINE CREASE */}
            <Spine />

            {/* ── SHEET 0: COVER / INSIDE COVER ── */}
            <div className="wow-sheet" style={{
              transform: spread >= 1 ? "rotateY(-180deg)" : "rotateY(0deg)",
              zIndex: getSheetZIndex(0)
            }}>
              {/* FRONT: Cover — Premium Passport matching reference design */}
              <div className="wow-page-front leather-cover" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "16px 14px 14px", boxSizing: "border-box" }}>
                {/* Gold double-line border inset */}
                <div style={{ position: "absolute", inset: 8, border: "1.5px solid rgba(201,160,82,0.55)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", inset: 11, border: "0.5px solid rgba(201,160,82,0.2)", pointerEvents: "none" }} />

                {/* Top text */}
                <div style={{ textAlign: "center", zIndex: 2, paddingTop: 4 }}>
                  <div style={{ fontFamily: "Jost,sans-serif", fontSize: 6.5, fontWeight: 500, letterSpacing: "0.45em", color: "rgba(201,160,82,0.92)", textTransform: "uppercase", marginBottom: 2 }}>WIDE OPEN WORLD</div>
                  <div style={{ fontFamily: "Jost,sans-serif", fontSize: 5.5, fontWeight: 400, letterSpacing: "0.32em", color: "rgba(201,160,82,0.52)", textTransform: "uppercase" }}>GLOBAL CULTURE CLUB</div>
                </div>

                {/* Centre block: large globe emblem + CULTURAL PASSPORT */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 2, flex: 1, justifyContent: "center" }}>
                  <OfficialWOWLogo color="#C9A052" width={128} height={128} />
                  <div style={{ textAlign: "center", marginTop: 2 }}>
                    <div style={{ fontFamily: "Jost,sans-serif", fontSize: 13.5, fontWeight: 600, letterSpacing: "0.42em", color: "#C9A052", textTransform: "uppercase", lineHeight: 1.6 }}>CULTURAL</div>
                    <div style={{ fontFamily: "Jost,sans-serif", fontSize: 13.5, fontWeight: 600, letterSpacing: "0.42em", color: "#C9A052", textTransform: "uppercase", lineHeight: 1.6 }}>PASSPORT</div>
                  </div>
                </div>

                {/* Bottom: flag + italic name + passport number */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, zIndex: 2, paddingBottom: 4 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/w80/${memberData.country_code}.png`}
                    alt={memberData.country}
                    style={{ width: memberData.country_code === 'np' ? 20 : 44, height: 28, objectFit: "contain", border: "1px solid rgba(201,160,82,0.45)", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
                  />
                  <div style={{ fontFamily: "Cormorant Garamond,Georgia,serif", fontStyle: "italic", fontSize: 17, fontWeight: 600, color: "#C9A052", letterSpacing: "0.02em" }}>{memberData.member_name}</div>
                  <div style={{ fontFamily: "'Courier New',monospace", fontSize: 7, color: "rgba(201,160,82,0.5)", letterSpacing: "0.14em" }}>{memberData.passport_number}</div>
                </div>
              </div>


              {/* BACK: Inside Cover */}
              <div className="wow-page-back" style={{ width: PW, height: PH, background: "#0d2618", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "28px 20px", boxShadow: "inset -4px 0 15px rgba(0,0,0,0.35)", border: "1px solid #05130b" }}>
                <div style={{ position: "absolute", inset: 9, border: "1px solid rgba(201,160,82,0.22)", pointerEvents: "none" }} />
                <OfficialWOWLogo color="rgba(201,160,82,0.85)" width={120} height={30} />
                <div style={{ fontFamily: "Jost,sans-serif", fontSize: 8.5, fontWeight: 500, letterSpacing: "0.24em", color: "rgba(201,160,82,0.75)", textAlign: "center", lineHeight: 2, maxWidth: 195, marginTop: 10 }}>
                  THE WORLD IS A BOOK AND THOSE WHO DO NOT EXPLORE IT READ ONLY ONE PAGE.
                </div>
                <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 9.5, color: "rgba(201,160,82,0.5)", textAlign: "center" }}>— Augustine, adapted</div>
                <div style={{ width: 40, height: 1, background: "rgba(201,160,82,0.3)" }} />
                <div style={{ fontFamily: "Jost,sans-serif", fontSize: 7, fontWeight: 500, letterSpacing: "0.18em", color: "rgba(201,160,82,0.55)", textAlign: "center", lineHeight: 2 }}>
                  VALID FOR ALL 195 COUNTRIES<br/>ISSUED BY WIDE OPEN WORLD<br/>GLOBAL CULTURE CLUB
                </div>
              </div>
            </div>

            {/* ── SHEET 1: BIO PAGE / IRAN INFO ── */}
            <div className="wow-sheet" style={{
              transform: spread >= 2 ? "rotateY(-180deg)" : "rotateY(0deg)",
              zIndex: getSheetZIndex(1)
            }}>
              {/* FRONT: Bio Page */}
              <div className="wow-page-front">
                <Page isLeft={false}>
                  <div style={{ position: "absolute", top: "42%", left: "50%", transform: "translate(-50%,-50%)", fontFamily: "Jost,sans-serif", fontSize: 62, fontWeight: 900, color: "rgba(0,0,0,0.025)", letterSpacing: "0.3em", pointerEvents: "none" }}>WOW</div>
                  
                  <div style={{ padding: "18px 18px 0", height: "100%", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid rgba(0,0,0,0.15)", marginBottom: 15 }}>
                      <div style={{ fontFamily: "Jost,sans-serif", fontSize: 7.5, fontWeight: 600, letterSpacing: "0.18em", color: "rgba(0,0,0,0.55)" }}>CULTURAL PASSPORT</div>
                      <div style={{ fontFamily: "Jost,sans-serif", fontSize: 7.5, fontWeight: 600, color: "rgba(0,0,0,0.55)", letterSpacing: "0.12em" }}>TYPE: CP</div>
                    </div>

                    <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
                      <div style={{ width: 72, height: 90, flexShrink: 0, border: "1px solid rgba(0,0,0,0.2)", background: "#e0d5bd", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Jost,sans-serif", fontSize: 20, fontWeight: 700, color: "rgba(0,0,0,0.4)" }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                        <div>
                          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 7, fontWeight: 600, letterSpacing: "0.12em", color: "rgba(0,0,0,0.55)", textTransform: "uppercase", marginBottom: 1 }}>Surname</div>
                          <div style={{ fontFamily: "Special Elite,cursive", fontSize: 13, color: "#111", fontWeight: 700 }}>{surname}</div>
                        </div>
                        <div>
                          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 7, fontWeight: 600, letterSpacing: "0.12em", color: "rgba(0,0,0,0.55)", textTransform: "uppercase", marginBottom: 1 }}>Given Names</div>
                          <div style={{ fontFamily: "Special Elite,cursive", fontSize: 13, color: "#111", fontWeight: 700 }}>{givenNames}</div>
                        </div>
                      </div>
                    </div>

                    {/* Nationality row with Flag */}
                    <div style={{ marginBottom: 15 }}>
                      <div style={{ fontFamily: "Jost,sans-serif", fontSize: 7, fontWeight: 600, letterSpacing: "0.12em", color: "rgba(0,0,0,0.55)", textTransform: "uppercase", marginBottom: 3 }}>Nationality</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://flagcdn.com/w40/${memberData.country_code}.png`}
                          alt={memberData.country}
                          style={{ width: 22, height: 14, objectFit: "cover", border: "0.5px solid rgba(0,0,0,0.2)", borderRadius: 1 }}
                        />
                        <div style={{ fontFamily: "Special Elite,cursive", fontSize: 13, color: "#111", fontWeight: 700 }}>{memberData.country}</div>
                      </div>
                    </div>

                    {/* Date of Issue & Passport Number */}
                    <div style={{ display: "flex", gap: 15, marginBottom: 18 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "Jost,sans-serif", fontSize: 7, fontWeight: 600, letterSpacing: "0.12em", color: "rgba(0,0,0,0.55)", textTransform: "uppercase", marginBottom: 2 }}>Date of Issue</div>
                        <div style={{ fontFamily: "Special Elite,cursive", fontSize: 12, color: "#111", fontWeight: 700 }}>{memberData.issue_date.toUpperCase()}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "Jost,sans-serif", fontSize: 7, fontWeight: 600, letterSpacing: "0.12em", color: "rgba(0,0,0,0.55)", textTransform: "uppercase", marginBottom: 2 }}>Passport No.</div>
                        <div style={{ fontFamily: "Special Elite,cursive", fontSize: 12, color: "#111", fontWeight: 700 }}>{memberData.passport_number}</div>
                      </div>
                    </div>

                    <div style={{ flex: 1 }} />
                    <div style={{ borderBottom: "1px solid rgba(0,0,0,0.2)", paddingBottom: 6, marginBottom: 30 }}>
                      <div style={{ fontFamily: "Caveat,cursive", fontSize: 23, fontWeight: 700, color: "#111" }}>{memberData.member_name}</div>
                      <div style={{ fontFamily: "Jost,sans-serif", fontSize: 7, fontWeight: 600, letterSpacing: "0.12em", color: "rgba(0,0,0,0.45)", textTransform: "uppercase", marginTop: 2 }}>Holder's Signature</div>
                    </div>
                  </div>

                  <div className="mrz-container">
                    <div className="mrz-line">{mrzLine1}</div>
                    <div className="mrz-line">{mrzLine2}</div>
                  </div>
                  <span className="page-num" style={{ right: 12 }}>02</span>
                </Page>
              </div>

              {/* BACK: Iran Expedition Info */}
              <div className="wow-page-back">
                <Page isLeft={true} bg="#fdf9f2">
                  <div style={{ height: 95, background: "#1c3f60", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "10px 14px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontFamily: "Jost,sans-serif", fontSize: 56, fontWeight: 900, color: "rgba(255,255,255,0.06)", letterSpacing: "0.05em", lineHeight: 1 }}>IR</div>
                    <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,0.18)", padding: "2px 8px", fontFamily: "Jost,sans-serif", fontSize: 7, fontWeight: 600, letterSpacing: "0.12em", color: "rgba(255,255,255,0.9)" }}>IN PROGRESS</div>
                    <div style={{ fontFamily: "Playfair Display,serif", fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>Iran</div>
                    <div style={{ fontFamily: "Jost,sans-serif", fontSize: 8, fontWeight: 500, letterSpacing: "0.18em", color: "rgba(255,255,255,0.65)", marginTop: 3 }}>JUL – AUG 2026</div>
                  </div>

                  <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <div style={{ flex: 1, background: "#e6f0fa", borderLeft: "2px solid #2b6cb0", padding: "5px 6px" }}>
                        <div style={{ fontFamily: "Jost,sans-serif", fontSize: 6.5, fontWeight: 600, letterSpacing: "0.12em", color: "#1c3f60", opacity: 0.85, marginBottom: 2 }}>BOOK FOCUS</div>
                        <div style={{ fontFamily: "Playfair Display,serif", fontSize: 9, fontWeight: 700, color: "#1c3f60", lineHeight: 1.25 }}>Touba & Meaning of Night</div>
                        <div style={{ fontFamily: "Jost,sans-serif", fontSize: 7, color: "#1c3f60", opacity: 0.7, marginTop: 2 }}>S. Parsipur</div>
                      </div>
                      <div style={{ flex: 1, background: "#e6f0fa", borderLeft: "2px solid #2b6cb0", padding: "5px 6px" }}>
                        <div style={{ fontFamily: "Jost,sans-serif", fontSize: 6.5, fontWeight: 600, letterSpacing: "0.12em", color: "#1c3f60", opacity: 0.85, marginBottom: 2 }}>FILM FOCUS</div>
                        <div style={{ fontFamily: "Playfair Display,serif", fontSize: 9, fontWeight: 700, color: "#1c3f60", lineHeight: 1.25 }}>A Separation</div>
                        <div style={{ fontFamily: "Jost,sans-serif", fontSize: 7, color: "#1c3f60", opacity: 0.7, marginTop: 2 }}>A. Farhadi</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 9, borderLeft: "2px solid #2b6cb0", padding: "5px 8px" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: "#e6f0fa", border: "1px solid #2b6cb0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Jost,sans-serif", fontSize: 9, fontWeight: 700, color: "#1c3f60" }}>SK</div>
                      <div>
                        <div style={{ fontFamily: "Jost,sans-serif", fontSize: 10, fontWeight: 600, color: "#111" }}>Shafagh Kazemi</div>
                        <div style={{ fontFamily: "Jost,sans-serif", fontSize: 7.5, color: "#555", fontWeight: 500 }}>Iran</div>
                      </div>
                    </div>

                    <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 10.5, lineHeight: 1.6, color: "#222", opacity: 0.85 }}>
                      "These two stories capture the two dimensions of Iran: the deep roots of our past (Touba), and the raw dilemmas of modern urban life."
                    </div>

                    <div style={{ border: "1px dashed rgba(0,0,0,0.18)", padding: "7px 9px", minHeight: 45, background: "rgba(0,0,0,0.015)" }}>
                      <div style={{ fontFamily: "Jost,sans-serif", fontSize: 7, fontWeight: 600, letterSpacing: "0.14em", color: "rgba(0,0,0,0.45)", marginBottom: 3 }}>MY REFLECTION</div>
                      <div style={{ fontFamily: "Jost,sans-serif", fontSize: 8.5, color: "rgba(0,0,0,0.35)", fontStyle: "italic" }}>
                        Reflections will open after Session II...
                      </div>
                    </div>
                  </div>

                  <div className="mrz-container">
                    <div className="mrz-line">{mrzLine1}</div>
                    <div className="mrz-line">{mrzLine2}</div>
                  </div>
                  <span className="page-num" style={{ left: 12 }}>03</span>
                </Page>
              </div>
            </div>

            {/* ── SHEET 2: IRAN STAMP / OVERVIEW ── */}
            <div className="wow-sheet" style={{
              transform: spread >= 3 ? "rotateY(-180deg)" : "rotateY(0deg)",
              zIndex: getSheetZIndex(2)
            }}>
              {/* FRONT: Iran Blank Stamp Page */}
              <div className="wow-page-front">
                <Page isLeft={false}>
                  <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
                    {/* Placeholder Dotted Circle for upcoming stamp */}
                    <div style={{ width: 140, height: 140, borderRadius: "50%", border: "2px dashed rgba(28, 63, 96, 0.35)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(28, 63, 96, 0.025)", position: "relative" }}>
                      <div style={{ fontFamily: "Jost,sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(28, 63, 96, 0.55)" }}>UPCOMING</div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://flagcdn.com/w80/ir.png" alt="Iran" style={{ width: 48, height: 30, objectFit: "cover", borderRadius: 3, border: "1px solid rgba(28,63,96,0.3)", opacity: 0.7 }} />
                      <div style={{ fontFamily: "Jost,sans-serif", fontSize: 7, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(28, 63, 96, 0.55)" }}>EXPEDITION #01 · IRAN</div>
                    </div>

                    <div style={{ marginTop: 24, textAlign: "center", maxWidth: 200 }}>
                      <div style={{ fontFamily: "Jost,sans-serif", fontSize: 8.5, fontWeight: 600, letterSpacing: "0.15em", color: "#1c3f60", textTransform: "uppercase", marginBottom: 4 }}>Visa Office</div>
                      <div style={{ fontFamily: "Georgia,serif", fontSize: 10, fontStyle: "italic", color: "#555", lineHeight: 1.5 }}>
                        Stamp will be unlocked and officially issued upon completion of the Iran expedition sessions.
                      </div>
                    </div>
                  </div>

                  <div className="mrz-container">
                    <div className="mrz-line">{mrzLine1}</div>
                    <div className="mrz-line">{mrzLine2}</div>
                  </div>
                  <span className="page-num" style={{ right: 12 }}>04</span>
                </Page>
              </div>

              {/* BACK: Journey Overview */}
              <div className="wow-page-back">
                <Page isLeft={true}>
                  <div style={{ height: 68, background: "#1B3D2A", display: "flex", flexDirection: "column", justifyContent: "center", padding: "10px 13px" }}>
                    <div style={{ fontFamily: "Playfair Display,serif", fontSize: 15, fontWeight: 700, color: "#C9A052", letterSpacing: "0.05em" }}>Journey Overview</div>
                    <div style={{ fontFamily: "Jost,sans-serif", fontSize: 7.5, fontWeight: 500, color: "rgba(201,160,82,0.65)", marginTop: 3 }}>
                      {memberData.member_name} · {memberData.passport_number}
                    </div>
                  </div>

                  <div style={{ padding: "14px 15px", display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {[{ n: "0", l: "Completed" }, { n: "1", l: "In Progress" }, { n: "0", l: "Sessions" }, { n: "0", l: "Stamps" }].map((s, idx) => (
                        <div key={idx} style={{ textAlign: "center", padding: "10px 4px", background: "rgba(0,0,0,0.035)", borderRadius: 3 }}>
                          <div style={{ fontFamily: "Playfair Display,serif", fontSize: 26, fontWeight: 900, color: "#633806", lineHeight: 1 }}>{s.n}</div>
                          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 7, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(0,0,0,0.45)", textTransform: "uppercase", marginTop: 2 }}>{s.l}</div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div style={{ fontFamily: "Jost,sans-serif", fontSize: 7.5, fontWeight: 600, letterSpacing: "0.15em", color: "rgba(0,0,0,0.5)", textTransform: "uppercase", marginBottom: 8 }}>Countries Explored</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "0.5px solid rgba(0,0,0,0.1)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2b6cb0" }} />
                          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 10, fontWeight: 600, color: "#111" }}>🇮🇷 Iran</div>
                        </div>
                        <div style={{ fontFamily: "Jost,sans-serif", fontSize: 8, fontWeight: 600, color: "#2b6cb0", letterSpacing: "0.04em" }}>
                          ● In Progress
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mrz-container">
                    <div className="mrz-line">{mrzLine1}</div>
                    <div className="mrz-line">{mrzLine2}</div>
                  </div>
                  <span className="page-num" style={{ left: 12 }}>05</span>
                </Page>
              </div>
            </div>

            {/* ── SHEET 3: INSIDE BACK COVER / BACK COVER ── */}
            <div className="wow-sheet" style={{
              transform: spread >= 4 ? "rotateY(-180deg)" : "rotateY(0deg)",
              zIndex: getSheetZIndex(3)
            }}>
              {/* FRONT: Inside Back Cover */}
              <div className="wow-page-front">
                <Page isLeft={false} bg="#F8F2E2">
                  <div style={{ width: PW, height: PH, flexShrink: 0, background: "#0d2618", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "28px 20px", boxShadow: "inset 4px 0 15px rgba(0,0,0,0.35)", border: "1px solid #05130b", boxSizing: "border-box" }}>
                    <div style={{ position: "absolute", inset: 9, border: "1px solid rgba(201,160,82,0.22)", pointerEvents: "none" }} />
                    <OfficialWOWLogo color="rgba(201,160,82,0.85)" width={110} height={28} />
                    <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 12, color: "rgba(201,160,82,0.7)", textAlign: "center", lineHeight: 1.9, maxWidth: 190, marginTop: 10 }}>
                      "More journeys await.<br/>More stories to share.<br/>More worlds to open."
                    </div>
                    <div style={{ width: 40, height: 1, background: "rgba(201,160,82,0.3)" }} />
                    <div style={{ fontFamily: "Jost,sans-serif", fontSize: 7.5, fontWeight: 500, letterSpacing: "0.22em", color: "rgba(201,160,82,0.55)", textAlign: "center", lineHeight: 2 }}>
                      WIDE OPEN WORLD<br/>GLOBAL CULTURE CLUB<br/>wideopen.world
                    </div>
                  </div>
                </Page>
              </div>

              {/* BACK: Back Cover */}
              <div className="wow-page-back leather-cover" style={{ width: PW, height: PH, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 22px" }}>
                <div className="gold-border" />
                <OfficialWOWLogo color="#C9A052" width={140} height={35} />
                <div style={{ marginTop: 24, fontFamily: "Jost,sans-serif", fontSize: 8, fontWeight: 600, letterSpacing: "0.3em", color: "#dfb76c" }}>END OF PASSPORT</div>
              </div>
            </div>

          </div>

          {/* Page dots only - no arrows */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 10 }}>
            {Array.from({ length: TOTAL_SPREADS }).map((_, i) => (
              <button key={i} className={`wow-dot${i === spread ? " on" : ""}`} onClick={() => setSpread(i)} />
            ))}
          </div>

        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button className="wow-btn accent" onClick={() => setShareOpen(o => !o)}>
            {shareOpen ? "Hide Share Card" : "Preview Share Card"}
          </button>

          <button className="wow-btn" onClick={() => { setPassportData(null); setSpread(0); setShareOpen(false); setNumInput(''); }}>
            ← Switch Explorer
          </button>
        </div>

        {/* ── SHARE CARD COMPONENT ── */}
        {shareOpen && (
          <div style={{
            background: "rgba(20,17,14,0.7)", borderRadius: 14,
            border: "0.5px solid rgba(255,255,255,0.12)",
            padding: "24px 20px", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 18, width: "100%", maxWidth: "380px"
          }}>
            <div style={{ fontFamily: "Jost,sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: "#C9A052", textTransform: "uppercase" }}>
              Shareable Card
            </div>

            {/* SVG Rendered Card (for clean vector downloads) */}
            <div style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.5)", borderRadius: 4, overflow: "hidden" }}>
              <svg id="share-card-svg" width="340" height="340" viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg">
                {/* Background */}
                <rect width="340" height="340" fill="#0d2618" />
                {/* Double Gold Line Border */}
                <rect x="10" y="10" width="320" height="320" fill="none" stroke="#C9A052" strokeWidth="1.5" />
                <rect x="13" y="13" width="314" height="314" fill="none" stroke="#C9A052" strokeWidth="0.5" strokeDasharray="3 3" />

                {/* WOW Globe Logo */}
                <g transform="translate(170, 110)">
                  <circle cx="0" cy="0" r="62" fill="none" stroke="#C9A052" strokeWidth="2" />
                  <circle cx="0" cy="0" r="56" fill="none" stroke="#C9A052" strokeWidth="0.8" opacity="0.5" />
                  <circle cx="0" cy="0" r="46" fill="none" stroke="#C9A052" strokeWidth="1.6" />
                  <ellipse cx="0" cy="0" rx="46" ry="12" fill="none" stroke="#C9A052" strokeWidth="0.9" opacity="0.75" />
                  <ellipse cx="0" cy="0" rx="46" ry="24" fill="none" stroke="#C9A052" strokeWidth="0.7" opacity="0.55" />
                  <ellipse cx="0" cy="0" rx="46" ry="36" fill="none" stroke="#C9A052" strokeWidth="0.55" opacity="0.4" />
                  <ellipse cx="0" cy="0" rx="12" ry="46" fill="none" stroke="#C9A052" strokeWidth="0.9" opacity="0.75" />
                  <ellipse cx="0" cy="0" rx="30" ry="46" fill="none" stroke="#C9A052" strokeWidth="0.7" opacity="0.55" />
                  <line x1="-46" y1="0" x2="46" y2="0" stroke="#C9A052" strokeWidth="0.6" opacity="0.55" />
                  <line x1="0" y1="-46" x2="0" y2="46" stroke="#C9A052" strokeWidth="0.6" opacity="0.55" />
                  <text x="0" y="7" textAnchor="middle" dominantBaseline="middle" fontFamily="'Playfair Display', Georgia, serif" fontSize="24" fontWeight="900" fill="#C9A052" letterSpacing="5">WOW</text>
                </g>

                {/* Explorer Info */}
                <text x="170" y="210" textAnchor="middle" fontFamily="'Jost', sans-serif" fontSize="10" fontWeight="600" fill="#C9A052" letterSpacing="4">CULTURAL EXPLORER</text>
                <text x="170" y="240" textAnchor="middle" fontFamily="'Caveat', cursive" fontSize="30" fontWeight="700" fill="#f7f3eb">{memberData.member_name}</text>
                
                {/* Passport Number */}
                <text x="170" y="266" textAnchor="middle" fontFamily="'Special Elite', cursive" fontSize="10" fill="rgba(201,160,82,0.85)" letterSpacing="1">{memberData.passport_number}</text>

                {/* Country Chapter Badges */}
                <g transform="translate(170, 285)">
                  <g transform="translate(-25, 0)">
                    <image href="https://flagcdn.com/w40/ir.png" x="-15" y="-12" width="30" height="20" preserveAspectRatio="xMidYMid meet" />
                    <text x="0" y="14" textAnchor="middle" fontFamily="'Jost', sans-serif" fontSize="7" fontWeight="600" fill="rgba(201,160,82,0.8)">Iran</text>
                  </g>
                  <g transform="translate(25, 0)">
                    <rect x="-15" y="-12" width="30" height="20" fill="none" rx="3" stroke="rgba(201,160,82,0.3)" strokeWidth="1" strokeDasharray="2 2" />
                    <text x="0" y="4" textAnchor="middle" fontFamily="'Jost', sans-serif" fontSize="8" fontWeight="600" fill="rgba(201,160,82,0.3)">--</text>
                  </g>
                </g>
              </svg>
            </div>

            {/* Actions for Share Card */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
              <button className="wow-btn accent" style={{ width: "100%", justifyContent: "center" }} onClick={downloadCardSVG}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Download Card (SVG)
              </button>

              {/* Social sharing row — WhatsApp → Instagram → Facebook → X */}
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 4 }}>
                {/* WhatsApp */}
                <a href={`https://api.whatsapp.com/send?text=Check%20out%20my%20WOW%20Cultural%20Passport!%20${encodeURIComponent(window.location.origin + '/invite?uid=' + memberData.passport_number)}`} target="_blank" rel="noopener noreferrer" className="share-platform-btn" title="Share on WhatsApp">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.517 2.266 2.27 3.51 5.276 3.508 8.48-.005 6.66-5.342 11.997-11.953 11.997-2.005-.001-3.973-.504-5.714-1.464L0 24zm6.066-3.465l.363.216c1.648.978 3.541 1.495 5.48 1.496 5.679 0 10.301-4.622 10.305-10.302.002-2.752-1.07-5.339-3.02-7.29C17.29 2.68 14.71 1.61 11.96 1.61 6.282 1.61 1.66 6.232 1.656 11.912c-.001 2.053.543 4.053 1.577 5.775l.23.386-1.042 3.805 3.902-1.023zM17.15 14.88c-.282-.142-1.67-.824-1.928-.918-.258-.095-.446-.142-.634.142-.188.282-.729.918-.893 1.106-.164.188-.329.212-.612.071-.282-.142-1.192-.44-2.272-1.402-.84-.75-1.408-1.676-1.573-1.958-.164-.282-.018-.435.123-.576.127-.127.282-.329.424-.494.142-.165.188-.282.282-.47.094-.189.047-.353-.024-.495-.071-.141-.634-1.529-.868-2.094-.229-.553-.48-.478-.634-.486-.153-.008-.328-.009-.502-.009-.174 0-.458.065-.698.306-.24.241-.918.894-.918 2.181 0 1.288.937 2.532 1.066 2.708.13.176 1.844 2.816 4.468 3.953.624.271 1.11.433 1.488.553.627.2 1.2.172 1.652.105.504-.075 1.67-.682 1.905-1.341.236-.659.236-1.222.165-1.341-.07-.119-.258-.19-.54-.332z"/></svg>
                </a>
                {/* Instagram */}
                <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="share-platform-btn" title="Share on Instagram">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                {/* Facebook */}
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/invite?uid=' + memberData.passport_number)}`} target="_blank" rel="noopener noreferrer" className="share-platform-btn" title="Share on Facebook">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                {/* X (Twitter) */}
                <a href={`https://twitter.com/intent/tweet?text=Check%20out%20my%20WOW%20Cultural%20Passport!&url=${encodeURIComponent(window.location.origin + '/invite?uid=' + memberData.passport_number)}`} target="_blank" rel="noopener noreferrer" className="share-platform-btn" title="Share on X">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

// ── MAIN MEMBERS PAGE INNER ──
function MembersPageInner() {
  const searchParams = useSearchParams();
  const uidFromUrl = searchParams.get('uid') || '';
  const [selectedPassport, setSelectedPassport] = useState(uidFromUrl);

  const totalMembers = WOW_MEMBERS.length;
  const uniqueCountries = new Set(WOW_MEMBERS.map(m => m.country)).size;

  // Auto-scroll to passport section when loading a UID
  useEffect(() => {
    if (uidFromUrl) {
      setTimeout(() => {
        document.getElementById('passport-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [uidFromUrl]);

  const handleMemberClick = (passportNumber) => {
    // Fill the number input field without automatically retrieving/opening it
    setSelectedPassport(passportNumber);
    setTimeout(() => {
      document.getElementById('passport-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <main>
      {/* PAGE HERO */}
      <div className="section-header page-hero">
        <div className="section-eyebrow">The Crew</div>
        <h1 className="section-title">Explorers</h1>
        <p className="section-desc">Our founding cohort of cultural explorers. Click any member to copy their passport details to the Access tool below.</p>
        
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '14px',
          marginTop: '28px',
          padding: '8px 18px',
          background: 'rgba(201,160,82,0.06)',
          border: '1px solid rgba(201,160,82,0.25)',
          borderRadius: '50px',
          boxShadow: '0 4px 20px rgba(201,160,82,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A052" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', fontWeight: 600, color: '#C9A052', letterSpacing: '0.1em' }}>{totalMembers} MEMBERS</span>
          </div>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(201,160,82,0.4)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A052" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', fontWeight: 600, color: '#C9A052', letterSpacing: '0.1em' }}>{uniqueCountries} COUNTRIES</span>
          </div>
        </div>
      </div>

      {/* MEMBERS GRID */}
      <section className="exp-section">
        <div className="exp-members-grid">
          {WOW_MEMBERS.map((member, i) => (
            <button
              key={member.passport_number}
              className={`exp-member-card ${selectedPassport === member.passport_number ? 'selected' : ''}`}
              onClick={() => handleMemberClick(member.passport_number)}
            >
              <div className="exp-member-num">{String(i + 1).padStart(2, '0')}</div>
              <div className="exp-member-avatar">
                {member.member_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="exp-member-info">
                <div className="exp-member-name">{member.member_name}</div>
                <div className="exp-member-country">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/w40/${member.country_code}.png`}
                    alt={member.country}
                    width={member.country_code === 'np' ? 14 : 20}
                    height={member.country_code === 'np' ? 20 : 14}
                    style={{
                      borderRadius: '2px',
                      objectFit: member.country_code === 'np' ? 'contain' : 'cover',
                      flexShrink: 0,
                    }}
                  />
                  {member.country}
                </div>
              </div>
              <div className="exp-member-passport">
                <div className="exp-passport-label">Passport No.</div>
                <div className="exp-passport-num">{member.passport_number}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* PASSPORT SEC */}
      <section className="exp-section exp-members-section" id="passport-section" style={{ background: 'var(--bg-base)' }}>
        <PassportGenerator key={selectedPassport} prefilledNumber={selectedPassport} />
      </section>
    </main>
  );
}

export default function MembersPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: '100vh' }} />}>
      <MembersPageInner />
    </Suspense>
  );
}
