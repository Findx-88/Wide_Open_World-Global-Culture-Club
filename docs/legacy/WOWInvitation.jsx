"use client";
import { useState, useEffect, useId } from "react";

function WOWLogo({ size = 80, color = "#C9A052" }) {
  const base = useId().replace(/:/g, "x");
  const a = `wa${base}`, b = `wb${base}`;
  return (
    <svg width={size} height={size} viewBox="0 0 440 440" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <path id={a} d="M 88,220 A 132,132 0 0,1 352,220 A 132,132 0 0,1 88,220" />
        <path id={b} d="M 88,220 A 132,132 0 0,0 352,220 A 132,132 0 0,0 88,220" />
      </defs>
      <circle cx="220" cy="220" r="160" fill="none" stroke={color} strokeWidth="3" />
      <circle cx="220" cy="220" r="153" fill="none" stroke={color} strokeWidth="0.9" opacity="0.45" />
      <circle cx="220" cy="220" r="147" fill="none" stroke={color} strokeWidth="0.5" opacity="0.22" />
      <polygon points="220,57 224,64 220,71 216,64" fill={color} opacity="0.9" />
      <polygon points="220,369 224,376 220,383 216,376" fill={color} opacity="0.9" />
      <polygon points="88,213 81,220 88,227 95,220" fill={color} opacity="0.95" />
      <polygon points="352,213 345,220 352,227 359,220" fill={color} opacity="0.95" />
      <text fontFamily="'Jost',sans-serif" fontSize="13" fontWeight="500" fill={color} letterSpacing="4.5">
        <textPath href={`#${a}`} startOffset="25%" textAnchor="middle">WIDE OPEN WORLD</textPath>
      </text>
      <text fontFamily="'Jost',sans-serif" fontSize="11" fontWeight="400" fill={color} letterSpacing="3" dy="17">
        <textPath href={`#${b}`} startOffset="25%" textAnchor="middle">A GLOBAL CULTURE CLUB</textPath>
      </text>
      <circle cx="220" cy="220" r="116" fill="none" stroke={color} strokeWidth="1.4" opacity="0.55" />
      <circle cx="220" cy="220" r="102" fill="none" stroke={color} strokeWidth="2.4" />
      <ellipse cx="220" cy="220" rx="102" ry="26" fill="none" stroke={color} strokeWidth="1.05" opacity="0.76" />
      <ellipse cx="220" cy="220" rx="102" ry="52" fill="none" stroke={color} strokeWidth="0.9" opacity="0.60" />
      <ellipse cx="220" cy="220" rx="102" ry="78" fill="none" stroke={color} strokeWidth="0.75" opacity="0.46" />
      <ellipse cx="220" cy="220" rx="26" ry="102" fill="none" stroke={color} strokeWidth="1.05" opacity="0.76" />
      <ellipse cx="220" cy="220" rx="68" ry="102" fill="none" stroke={color} strokeWidth="0.9" opacity="0.60" />
      <line x1="118" y1="220" x2="322" y2="220" stroke={color} strokeWidth="0.7" opacity="0.46" />
      <line x1="220" y1="118" x2="220" y2="322" stroke={color} strokeWidth="0.7" opacity="0.46" />
      <text x="220" y="225" textAnchor="middle" dominantBaseline="middle" fontFamily="'Playfair Display','Georgia',serif" fontSize="46" fontWeight="700" fill={color} letterSpacing="8">WOW</text>
    </svg>
  );
}

function WOWSealStamp({ size = 80, color = "#1B3D2A" }) {
  const base = useId().replace(/:/g, "x");
  const pathId = `sealpath${base}`;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: 'rotate(-8deg)', display: 'block' }} aria-hidden="true">
      <defs>
        <path id={pathId} d="M 60,60 m -44,0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0" />
      </defs>
      {/* Outer distressed/dashed rings */}
      <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="10 2 24 2 15 1" opacity="0.85" />
      <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="0.8" opacity="0.75" />
      <circle cx="60" cy="60" r="38" fill="none" stroke={color} strokeWidth="0.8" strokeDasharray="2 2" opacity="0.65" />
      
      {/* Circular text */}
      <text fill={color} fontSize="5.5" fontFamily="'Jost', sans-serif" fontWeight="600" letterSpacing="2.8" opacity="0.85">
        <textPath href={`#${pathId}`} startOffset="0%">• WIDE OPEN WORLD • OFFICIAL SEAL</textPath>
      </text>
      
      {/* Central typography */}
      <text x="60" y="56" textAnchor="middle" fill={color} fontSize="14" fontFamily="'Playfair Display', Georgia, serif" fontWeight="700" letterSpacing="1.2">WOW</text>
      <text x="60" y="68" textAnchor="middle" fill={color} fontSize="5.5" fontFamily="'Jost', sans-serif" fontWeight="600" letterSpacing="1.5">CLUB</text>
      <text x="60" y="76" textAnchor="middle" fill={color} fontSize="4.5" fontFamily="'Jost', sans-serif" fontWeight="400" opacity="0.7">EST. 2026</text>
      
      {/* Side stars */}
      <circle cx="42" cy="60" r="1.5" fill={color} opacity="0.8" />
      <circle cx="78" cy="60" r="1.5" fill={color} opacity="0.8" />
    </svg>
  );
}

function Divider({ w = 300 }) {
  const m = w / 2;
  return (
    <svg width={w} height="22" viewBox={`0 0 ${w} 22`} aria-hidden="true">
      <line x1="0" y1="11" x2={m - 32} y2="11" stroke="#C9A052" strokeWidth="0.8" opacity="0.55" />
      <polygon points={`${m - 22},11 ${m - 14},6 ${m - 6},11 ${m - 14},16`} fill="none" stroke="#C9A052" strokeWidth="1" opacity="0.7" />
      <circle cx={m} cy="11" r="3.5" fill="#C9A052" opacity="0.85" />
      <polygon points={`${m + 6},11 ${m + 14},6 ${m + 22},11 ${m + 14},16`} fill="none" stroke="#C9A052" strokeWidth="1" opacity="0.7" />
      <line x1={m + 32} y1="11" x2={w} y2="11" stroke="#C9A052" strokeWidth="0.8" opacity="0.55" />
    </svg>
  );
}

export default function WOWInvitation({ 
  name = "Priya Sharma", 
  countryCode = "IN", 
  countryName = "India", 
  countryFlag = "🇮🇳", 
  passportNumber = "WOW-2026-0000" 
}) {
  const [phase, setPhase] = useState("envelope");
  const [cracking, setCracking] = useState(false);
  const [cardOut, setCardOut] = useState(false);

  const firstName = name.split(" ")[0];

  // Force dark mode and hide global nav/footer on invite page
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const nav = document.querySelector('nav, header');
    const footer = document.querySelector('footer');
    if (nav) nav.style.display = 'none';
    if (footer) footer.style.display = 'none';
    return () => {
      if (nav) nav.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, []);

  const openCard = () => {
    if (cracking || phase !== "envelope") return;
    setCracking(true);
    setTimeout(() => setPhase("card"), 900);
    setTimeout(() => setCracking(false), 950);
  };

  const closeCard = () => {
    setCardOut(true);
    setTimeout(() => { setPhase("envelope"); setCardOut(false); }, 420);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Caveat:wght@400;700&family=Jost:wght@300;400;500;600&display=swap');

        @keyframes wowFloat {
          0%,100% { transform: rotate(-1.5deg) translateY(0); }
          50%      { transform: rotate(-1.5deg) translateY(-10px); }
        }
        @keyframes wowFadeScale {
          from { opacity:1; transform:rotate(-1.5deg) scale(1) translateY(0); }
          to   { opacity:0; transform:rotate(-1.5deg) scale(0.91) translateY(-16px); }
        }
        @keyframes wowSealCrack {
          0%   { transform:scale(1) rotate(0deg); opacity:1; }
          35%  { transform:scale(1.22) rotate(-4deg); opacity:0.9; }
          100% { transform:scale(0.2) rotate(30deg); opacity:0; filter:blur(3px); }
        }
        @keyframes wowCardIn {
          from { opacity:0; transform:translateY(28px) scale(0.96); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes wowCardOut {
          from { opacity:1; transform:scale(1); }
          to   { opacity:0; transform:scale(0.96) translateY(14px); }
        }
        @keyframes shimmerGold {
          0%   { background-position: -300% center; }
          100% { background-position: 300% center; }
        }
        @keyframes wowParticle {
          0%,100% { transform:translateY(0) translateX(0); opacity:0.22; }
          40%      { transform:translateY(-22px) translateX(8px); opacity:0.55; }
          70%      { transform:translateY(-12px) translateX(-6px); opacity:0.3; }
        }
        @keyframes wowPulse {
          0%,100% { box-shadow:0 0 0 0 rgba(201,160,82,0.4); }
          50%      { box-shadow:0 0 0 10px rgba(201,160,82,0); }
        }

        .wow-envelope-wrap {
          animation: wowFloat 4.5s ease-in-out infinite;
        }
        .wow-envelope-wrap.cracking {
          animation: wowFadeScale 0.85s cubic-bezier(0.4,0,1,1) forwards;
        }
        .wow-seal {
          transition: transform 0.25s;
          animation: wowPulse 2.8s ease-in-out infinite;
        }
        .wow-seal:hover { transform: scale(1.07); cursor: pointer; }
        .wow-seal.cracking {
          animation: wowSealCrack 0.75s cubic-bezier(0.4,0,0.8,1) forwards !important;
        }
        .wow-card-in  { animation: wowCardIn  0.72s cubic-bezier(0.34,1.38,0.64,1) forwards; }
        .wow-card-out { animation: wowCardOut 0.38s ease forwards; }

        .wow-gold-shimmer {
          background: linear-gradient(90deg,#8a5e10 0%,#C9A052 22%,#f5d87a 40%,#ffe9a0 50%,#f5d87a 60%,#C9A052 78%,#8a5e10 100%);
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerGold 3.6s linear infinite;
        }

        .wow-open-btn {
          margin-top: 18px;
          padding: 9px 26px;
          background: transparent;
          border: 1px solid rgba(201,160,82,0.45);
          color: rgba(201,160,82,0.75);
          font-family: 'Jost', sans-serif;
          font-size: 9.5px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.22s;
          border-radius: 20px;
        }
        .wow-open-btn:hover {
          background: rgba(201,160,82,0.08);
          border-color: rgba(201,160,82,0.9);
          color: #C9A052;
          letter-spacing: 0.38em;
        }
        .wow-close-btn {
          margin-top: 10px;
          padding: 7px 20px;
          background: transparent;
          border: 0.5px solid rgba(27,61,42,0.25);
          color: rgba(27,61,42,0.45);
          font-family: 'Jost', sans-serif;
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 20px;
        }
        .wow-close-btn:hover {
          border-color: rgba(27,61,42,0.55);
          color: rgba(27,61,42,0.75);
        }

        /* Cohesive action buttons styles with animations */
        .wow-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 40px;
          min-width: 175px;
          padding: 0 24px;
          box-sizing: border-box;
          font-family: 'Jost', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          text-decoration: none;
        }
        .wow-btn-reseal {
          background: rgba(201, 160, 82, 0.08);
          border: 1px solid rgba(201, 160, 82, 0.45);
          color: rgba(201, 160, 82, 0.85);
        }
        .wow-btn-reseal:hover {
          background: rgba(201, 160, 82, 0.18);
          border-color: rgba(201, 160, 82, 0.9);
          color: #C9A052;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(201, 160, 82, 0.15);
        }
        .wow-btn-passport {
          background: rgba(27, 61, 42, 0.9);
          border: 1px solid rgba(201, 160, 82, 0.45);
          color: #C9A052;
        }
        .wow-btn-passport:hover {
          background: rgba(27, 61, 42, 1);
          border-color: rgba(201, 160, 82, 0.9);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(201, 160, 82, 0.25);
        }
        .wow-btn-whatsapp {
          background: rgba(37, 211, 102, 0.12);
          border: 1px solid rgba(37, 211, 102, 0.45);
          color: #25D366;
        }
        .wow-btn-whatsapp:hover {
          background: rgba(37, 211, 102, 0.22);
          border-color: rgba(37, 211, 102, 0.9);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.2);
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 35% 45%, #1a3828 0%, #0c1e12 55%, #060e09 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "28px 16px 44px", position: "relative", overflow: "hidden",
        fontFamily: "'Jost', sans-serif",
      }}>

        {/* Atmospheric gold dust particles */}
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} aria-hidden="true" style={{
            position: "absolute",
            width: i % 4 === 0 ? 3 : 2, height: i % 4 === 0 ? 3 : 2,
            borderRadius: "50%", background: "#C9A052",
            left: `${4 + i * 5.2}%`, top: `${8 + (i * 17) % 84}%`,
            animation: `wowParticle ${3.2 + i * 0.35}s ease-in-out infinite`,
            animationDelay: `${i * 0.28}s`,
          }} />
        ))}

        {/* Subtle radial vignette lines */}
        <svg aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04, pointerEvents: "none" }}>
          <defs>
            <pattern id="gridpat" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#C9A052" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridpat)" />
        </svg>

        {/* Top label */}
        <div style={{
          fontFamily: "'Jost', sans-serif", fontSize: 8.5, letterSpacing: "0.4em",
          textTransform: "uppercase", color: "rgba(201,160,82,0.3)",
          marginBottom: 28, zIndex: 2, position: "relative",
        }}>Wide Open World · Membership Invitation</div>

        {/* ─── ENVELOPE ─── */}
        {phase === "envelope" && (
          <div className={`wow-envelope-wrap${cracking ? " cracking" : ""}`}
            style={{ zIndex: 2, position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>

            {/* Envelope card */}
            <div
              onClick={openCard}
              style={{
                width: "min(490px, 94vw)",
                height: "360px",
                borderRadius: "8px",
                position: "relative",
                cursor: "pointer",
                boxShadow: "0 30px 90px rgba(0,0,0,0.7), 0 8px 28px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,160,82,0.08)",
                overflow: "hidden",
                background: "linear-gradient(148deg, #1f4530 0%, #152e1e 45%, #0d2016 100%)",
              }}>

              {/* Outer decorative border */}
              <div aria-hidden="true" style={{ position: "absolute", inset: 10, border: "0.5px solid rgba(201,160,82,0.14)", pointerEvents: "none", zIndex: 1 }} />

              {/* Corner ornaments */}
              {[
                { top: 7, left: 7 },
                { top: 7, right: 7, flipH: true },
                { bottom: 7, left: 7, flipV: true },
                { bottom: 7, right: 7, flipH: true, flipV: true },
              ].map(({ flipH, flipV, ...pos }, i) => (
                <div key={i} aria-hidden="true" style={{ position: "absolute", ...pos, zIndex: 2 }}>
                  <svg width="26" height="26" viewBox="0 0 38 38"
                    style={{ display: "block", transform: `scale(${flipH ? -1 : 1},${flipV ? -1 : 1})` }}>
                    <path d="M1 37 L1 6 Q1 1 6 1 L37 1" fill="none" stroke="rgba(201,160,82,0.5)" strokeWidth="1.5" />
                    <circle cx="1" cy="19" r="1.6" fill="rgba(201,160,82,0.38)" />
                    <circle cx="19" cy="1" r="1.6" fill="rgba(201,160,82,0.38)" />
                  </svg>
                </div>
              ))}

              {/* Postage stamp (top right) */}
              <div aria-hidden="true" style={{
                position: "absolute", top: 18, right: 18,
                width: 38, height: 48,
                border: "1px solid rgba(201,160,82,0.3)",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 2,
                background: "rgba(201,160,82,0.04)",
                boxShadow: "inset 0 0 0 3px rgba(0,0,0,0.3)",
                zIndex: 3,
              }}>
                <WOWLogo size={22} color="rgba(201,160,82,0.45)" />
                <div style={{ fontFamily: "'Jost',sans-serif", fontSize: 5, letterSpacing: "0.12em", color: "rgba(201,160,82,0.35)" }}>WOW</div>
              </div>

              {/* Envelope fold lines (diagonal meeting at seal) */}
              <svg aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }}>
                <line x1="2%" y1="3%" x2="50%" y2="160" stroke="rgba(201,160,82,0.12)" strokeWidth="0.8" strokeDasharray="3 3" />
                <line x1="98%" y1="3%" x2="50%" y2="160" stroke="rgba(201,160,82,0.12)" strokeWidth="0.8" strokeDasharray="3 3" />
              </svg>

              {/* WOW Logo at center top */}
              <div style={{
                position: 'absolute',
                top: '22px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 3,
                pointerEvents: 'none'
              }}>
                <WOWLogo size={46} color="rgba(201,160,82,0.72)" />
              </div>

              {/* Branding Foil (Gold Print on envelope) */}
              <div style={{
                position: 'absolute',
                top: '72px', left: 0, right: 0,
                textAlign: 'center',
                zIndex: 3,
                pointerEvents: 'none'
              }}>
                <div style={{
                  fontFamily: "'Jost', sans-serif", fontSize: '8.5px', letterSpacing: "0.44em",
                  textTransform: "uppercase", color: "rgba(201,160,82,0.7)", marginBottom: 4,
                }}>WIDE OPEN WORLD</div>
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
                  fontSize: '13px', color: "#C9A052", opacity: 0.85, letterSpacing: '0.05em'
                }}>An Official Invitation</div>
              </div>

              {/* Wax seal wrapper to separate positioning from scaling transform (fixes shifting bug) */}
              <div style={{
                position: 'absolute',
                top: '160px',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 3,
              }}>
                {/* Wax seal */}
                <div className={`wow-seal${cracking ? " cracking" : ""}`}
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: "50%",
                    background: "radial-gradient(circle at 35% 35%, #e06838 0%, #b84018 60%, #802008 100%)",
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", gap: 2,
                    border: "1.5px solid rgba(140,40,10,0.85)",
                    boxShadow: "0 6px 22px rgba(0,0,0,0.65), inset 0 2px 4px rgba(255,255,255,0.22)",
                    transition: 'all 0.25s ease',
                  }}>
                  <WOWLogo size={36} color="rgba(230,185,110,0.9)" />
                  <div style={{
                    fontFamily: "'Jost',sans-serif", fontSize: 5.5, letterSpacing: "0.2em",
                    textTransform: "uppercase", color: "rgba(230,185,110,0.65)",
                  }}>SEALED</div>
                </div>
              </div>

              {/* Recipient Block (Centered on envelope, spaced to avoid overlap with seal) */}
              <div style={{
                position: 'absolute',
                top: '218px', left: 0, right: 0,
                textAlign: 'center',
                zIndex: 3,
                pointerEvents: 'none'
              }}>
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
                  fontSize: 12, color: "rgba(201,160,82,0.6)", marginBottom: 1,
                }}>Sealed for</div>
                
                <div style={{
                  fontFamily: "'Caveat', cursive", fontSize: 32, fontWeight: 700,
                  color: "#C9A052", letterSpacing: "0.01em", lineHeight: 1.1,
                }}>{name}</div>
                
                <div style={{
                  fontFamily: "'Jost', sans-serif", fontSize: 8.5, letterSpacing: "0.18em",
                  color: "rgba(201,160,82,0.65)", marginTop: 6, display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center'
                }}>
                  <img src={`https://flagcdn.com/${countryCode.toLowerCase()}.svg`} alt={countryName} style={{ height: '9.5px', width: 'auto', display: 'inline-block' }} />
                  <span>{countryName.toUpperCase()}</span>
                </div>
              </div>

              {/* Unseal Button at the Bottom */}
              <button className="wow-open-btn" style={{
                position: 'absolute',
                bottom: '22px', left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 3,
                margin: 0,
                padding: '8px 22px',
                fontSize: '8.5px',
                letterSpacing: '0.22em',
                borderRadius: '16px',
                background: 'rgba(201,160,82,0.08)',
                border: '1px solid rgba(201,160,82,0.5)',
                color: 'rgba(201,160,82,0.9)',
                transition: 'all 0.2s ease',
              }}>
                Click to Unseal ✦
              </button>
            </div>
          </div>
        )}

        {/* ─── INVITATION CARD ─── */}
        {phase === "card" && (
          <div
            className={cardOut ? "wow-card-out" : "wow-card-in"}
            style={{ zIndex: 2, position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>

            <div style={{
              width: "min(450px, 94vw)",
              background: "linear-gradient(168deg, #fdf8ec 0%, #f8f1d8 55%, #f2e8c8 100%)",
              border: "0.5px solid rgba(201,160,82,0.35)",
              padding: "38px 34px 34px",
              position: "relative",
              boxShadow: "0 28px 90px rgba(0,0,0,0.6), 0 8px 30px rgba(0,0,0,0.4)",
            }}>

              {/* Paper texture */}
              <div aria-hidden="true" style={{
                position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "inherit",
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
              }} />

              {/* Ornamental borders */}
              <div aria-hidden="true" style={{ position: "absolute", inset: 8, border: "1px solid rgba(201,160,82,0.55)", pointerEvents: "none" }} />
              <div aria-hidden="true" style={{ position: "absolute", inset: 12, border: "0.5px solid rgba(201,160,82,0.22)", pointerEvents: "none" }} />

              {/* Corner ornaments on card */}
              {[
                { top: 5, left: 5 },
                { top: 5, right: 5, flipH: true },
                { bottom: 5, left: 5, flipV: true },
                { bottom: 5, right: 5, flipH: true, flipV: true },
              ].map(({ flipH, flipV, ...pos }, i) => (
                <div key={i} aria-hidden="true" style={{ position: "absolute", ...pos }}>
                  <svg width="32" height="32" viewBox="0 0 44 44"
                    style={{ display: "block", transform: `scale(${flipH ? -1 : 1},${flipV ? -1 : 1})` }}>
                    <path d="M1 43 L1 7 Q1 1 7 1 L43 1" fill="none" stroke="rgba(201,160,82,0.75)" strokeWidth="1.5" />
                    <path d="M8 36 L8 12 Q8 8 12 8 L36 8" fill="none" stroke="rgba(201,160,82,0.28)" strokeWidth="0.8" />
                    <circle cx="1" cy="22" r="1.8" fill="rgba(201,160,82,0.55)" />
                    <circle cx="22" cy="1" r="1.8" fill="rgba(201,160,82,0.55)" />
                  </svg>
                </div>
              ))}

              {/* Card body */}
              <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>

                <div style={{
                  fontFamily: "'Jost',sans-serif", fontSize: 7.5, letterSpacing: "0.36em",
                  textTransform: "uppercase", color: "rgba(27,61,42,0.6)", marginBottom: 14,
                }}>Wide Open World · Cultural Membership</div>

                <WOWLogo size={72} color="#1B3D2A" />

                <div style={{
                  fontFamily: "'Jost',sans-serif", fontSize: 8, letterSpacing: "0.32em",
                  textTransform: "uppercase", color: "rgba(27,61,42,0.55)", marginTop: 9,
                }}>Membership Invitation</div>

                <div style={{ width: 140, height: 0.5, background: "rgba(201,160,82,0.45)", margin: "13px 0" }} />

                {/* "You are invited" */}
                <div style={{
                  fontFamily: "'Playfair Display',serif", fontStyle: "italic",
                  fontSize: 30, fontWeight: 400, color: "#1B3D2A",
                  lineHeight: 1.1, marginBottom: 14, textAlign: "center",
                }}>
                  You are{" "}
                  <span className="wow-gold-shimmer"
                    style={{ fontStyle: "normal", fontWeight: 700, fontSize: 32 }}>
                    invited
                  </span>
                </div>

                <Divider w={310} />

                {/* Letter body */}
                <div style={{ width: "100%", marginTop: 16 }}>

                  <div style={{
                    fontFamily: "'Caveat',cursive", fontSize: 23, fontWeight: 700,
                    color: "#1B3D2A", marginBottom: 12, letterSpacing: "0.01em",
                  }}>Dear {firstName},</div>

                  <div style={{
                    fontFamily: "'Cormorant Garamond',serif", fontSize: 15,
                    lineHeight: 1.82, color: "rgba(13,31,21,0.82)", marginBottom: 12,
                  }}>
                    We're building something we believe in. A place where curious people gather
                    to understand the world through the eyes of someone{" "}
                    <em style={{ color: "rgba(13,31,21,0.95)", fontStyle: "italic" }}>living in it.</em>
                  </div>

                  <div style={{
                    fontFamily: "'Cormorant Garamond',serif", fontSize: 15,
                    lineHeight: 1.82, color: "rgba(13,31,21,0.75)", marginBottom: 12,
                  }}>
                    Every two months, we pick a country. We read a book from there, watch a film,
                    and have a real conversation with someone who calls it home.
                  </div>

                  <div style={{
                    fontFamily: "'Cormorant Garamond',serif", fontSize: 15,
                    lineHeight: 1.82, color: "rgba(13,31,21,0.72)",
                  }}>
                    We'd love for you to join us in this expedition.
                  </div>
                </div>

                {/* Country block */}
                <div style={{
                  width: "100%", margin: "20px 0 4px",
                  background: "rgba(27,61,42,0.07)",
                  borderLeft: "2.5px solid rgba(201,160,82,0.75)",
                  padding: "12px 16px",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <img src={`https://flagcdn.com/${countryCode.toLowerCase()}.svg`} alt={countryName} style={{ height: '28px', width: 'auto', borderRadius: '1.5px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))' }} />
                  <div>
                    <div style={{
                      fontFamily: "'Jost',sans-serif", fontSize: 7.5, letterSpacing: "0.2em",
                      textTransform: "uppercase", color: "rgba(27,61,42,0.6)", marginBottom: 3,
                    }}>Joining from</div>
                    <div style={{
                      fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700,
                      color: "#1B3D2A",
                    }}>{countryName}</div>
                  </div>
                </div>

                <div style={{ margin: "18px 0 4px" }}><Divider w={310} /></div>

                {/* Journey begins */}
                <div style={{ textAlign: "center", margin: "12px 0 18px" }}>
                  <div style={{
                    fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic",
                    fontSize: 15.5, color: "rgba(27,61,42,0.72)", lineHeight: 1.78,
                  }}>
                    Your passport number is <span style={{ fontWeight: 600, color: "#1B3D2A" }}>{passportNumber}</span><br />
                    Your visas will arrive as you explore.<br />
                    Grab a cup of tea. Let's begin.
                  </div>
                </div>

                {/* Signature */}
                <div style={{
                  width: "100%",
                  borderTop: "0.5px solid rgba(201,160,82,0.38)",
                  paddingTop: 16,
                }}>
                  <div style={{
                    fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic",
                    fontSize: 12.5, color: "rgba(27,61,42,0.6)", marginBottom: 5,
                  }}>With warmth and wonder,</div>

                  <div style={{
                    fontFamily: "'Caveat',cursive", fontSize: 26, fontWeight: 700,
                    color: "#1B3D2A", letterSpacing: "0.01em", marginBottom: 3,
                  }}>The WOW Club</div>

                  <div style={{
                    fontFamily: "'Jost',sans-serif", fontSize: 8, letterSpacing: "0.18em",
                    textTransform: "uppercase", color: "rgba(27,61,42,0.55)",
                  }}>Wide Open World · #WOW · wideopen.world</div>
                </div>

                {/* Bottom logo seal */}
                <div style={{ marginTop: 20, opacity: 0.9 }}>
                  <WOWSealStamp size={90} color="#1B3D2A" />
                </div>

              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginTop: 14 }}>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button className="wow-action-btn wow-btn-reseal" onClick={closeCard}>
                  ← Reseal Envelope
                </button>
                <a href={`/members?uid=${passportNumber}`} className="wow-action-btn wow-btn-passport">
                  View Passport →
                </a>
              </div>
              <a href="https://chat.whatsapp.com/JYHDYANTQTG9UH71kIvLbe" target="_blank" rel="noreferrer" className="wow-action-btn wow-btn-whatsapp" style={{ minWidth: '220px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Join Whatsapp Group
              </a>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
