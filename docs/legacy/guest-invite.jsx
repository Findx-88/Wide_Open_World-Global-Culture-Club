import Link from 'next/link';
import { WOW_GUESTS } from '../../data/guests';

export const metadata = {
  title: 'Guest Invitation | WOW Expeditions',
  description: 'A formal invitation to join WOW Expeditions as our cultural guide.',
};

// WOW circular logo SVG
function WOWLogo({ size = 80, color = '#00000030' }) {
  const a = 'gi-arc-top', b = 'gi-arc-bot';
  return (
    <svg width={size} height={size} viewBox="0 0 440 440" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <path id={a} d="M 88,220 A 132,132 0 0,1 352,220 A 132,132 0 0,1 88,220" />
        <path id={b} d="M 88,220 A 132,132 0 0,0 352,220 A 132,132 0 0,0 88,220" />
      </defs>
      <circle cx="220" cy="220" r="160" fill="none" stroke={color} strokeWidth="3" />
      <circle cx="220" cy="220" r="153" fill="none" stroke={color} strokeWidth="0.9" opacity="0.45" />
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

// WOW Seal Stamp SVG
function WOWSealStamp({ size = 80, color = '#1B3D2A' }) {
  const pathId = 'gi-seal-path';
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: 'rotate(-8deg)', display: 'block' }} aria-hidden="true">
      <defs>
        <path id={pathId} d="M 60,60 m -44,0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0" />
      </defs>
      <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="10 2 24 2 15 1" opacity="0.85" />
      <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="0.8" opacity="0.75" />
      <circle cx="60" cy="60" r="38" fill="none" stroke={color} strokeWidth="0.8" strokeDasharray="2 2" opacity="0.65" />
      <text fill={color} fontSize="5.5" fontFamily="'Jost', sans-serif" fontWeight="600" letterSpacing="2.8" opacity="0.85">
        <textPath href={`#${pathId}`} startOffset="0%">• WIDE OPEN WORLD • OFFICIAL SEAL</textPath>
      </text>
      <text x="60" y="56" textAnchor="middle" fill={color} fontSize="14" fontFamily="'Playfair Display', Georgia, serif" fontWeight="700" letterSpacing="1.2">WOW</text>
      <text x="60" y="68" textAnchor="middle" fill={color} fontSize="5.5" fontFamily="'Jost', sans-serif" fontWeight="600" letterSpacing="1.5">CLUB</text>
      <text x="60" y="76" textAnchor="middle" fill={color} fontSize="4.5" fontFamily="'Jost', sans-serif" fontWeight="400" opacity="0.7">EST. 2026</text>
      <circle cx="42" cy="60" r="1.5" fill={color} opacity="0.8" />
      <circle cx="78" cy="60" r="1.5" fill={color} opacity="0.8" />
    </svg>
  );
}

function Divider() {
  const w = 300, m = 150;
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

export default function GuestInvitePage({ searchParams }) {
  const targetId = searchParams?.id || 'WOW-GUEST-0001';
  
  // Find guest by ID or slug, default to first guest if not found
  const guest = WOW_GUESTS.find(g => g.guest_id === targetId || g.slug === targetId) || WOW_GUESTS[0];

  const INK = '#1B3D2A';
  const GOLD = '#C9A052';
  const BG = '#F5EFE0';

  const details = [
    { label: 'Event', value: guest.event_name },
    { label: 'Date', value: guest.date },
    { label: 'Time', value: guest.time },
    { label: 'Format', value: guest.format },
    { label: 'Book', value: guest.book },
    { label: 'Film', value: guest.film },
  ];

  // Helper to get first name
  const firstName = guest.name.split(' ')[0];

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg-base, #0a0e0b)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '6rem 1.5rem 4rem',
      fontFamily: "'Jost', sans-serif",
    }}>

      {/* Top ambient label */}
      <div style={{
        fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase',
        color: GOLD, opacity: 0.5, marginBottom: '1.5rem', textAlign: 'center',
      }}>
        WOW Expeditions · Formal Guest Invitation
      </div>

      {/* ── PARCHMENT CARD ── */}
      <div style={{
        width: '100%', maxWidth: '580px',
        background: BG,
        border: '1px solid rgba(201,160,82,0.4)',
        outline: '4px solid rgba(201,160,82,0.1)',
        outlineOffset: '6px',
        borderRadius: '2px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        color: INK,
      }}>

        {/* Gold top bar */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #c9a052, #e8c87a, #c9a052, transparent)' }} />

        {/* Country flag banner */}
        <div style={{
          padding: '1.6rem 2.5rem 1.2rem',
          borderBottom: '1px solid rgba(201,160,82,0.15)',
          display: 'flex', alignItems: 'center', gap: '1rem',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={`https://flagcdn.com/w80/${guest.country_code.toLowerCase()}.png`} 
            alt={guest.country} 
            style={{ width: '46px', height: '30px', objectFit: 'cover', borderRadius: '2px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', border: '1px solid rgba(201,160,82,0.2)' }} 
          />
          <div>
            <div style={{ fontSize: '0.55rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: GOLD, opacity: 0.7, marginBottom: '0.15rem' }}>Guest Card</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', color: INK, fontWeight: 600 }}>{guest.country}</div>
          </div>
          {/* WOW logo floated right */}
          <div style={{ marginLeft: 'auto' }}>
            <WOWLogo size={54} color={GOLD} />
          </div>
        </div>

        {/* Main body */}
        <div style={{ padding: '2.2rem 2.5rem 2.5rem' }}>

          {/* Opening line */}
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: INK, opacity: 0.6, marginBottom: '1rem' }}>
            It is our honour to formally invite
          </p>

          {/* Guest name */}
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '3rem', fontWeight: 700,
            color: INK, letterSpacing: '0.02em', lineHeight: 1.1,
            margin: '0 0 0.3rem',
          }}>{guest.name}</h1>

          <div style={{ fontSize: '0.72rem', color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '1.8rem', opacity: 0.85 }}>
            {guest.role}
          </div>

          {/* Ornament divider */}
          <div style={{ marginBottom: '1.8rem' }}>
            <Divider />
          </div>

          {/* Body text */}
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.05rem', lineHeight: 1.85, color: INK, opacity: 0.85, marginBottom: '1rem' }}>
            The Wide Open World Expeditions — a global book and film club that reads one culture at a time — cordially invites you to join us as our cultural guide for <strong>Expedition: {guest.country}.</strong>
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.05rem', lineHeight: 1.85, color: INK, opacity: 0.85, marginBottom: '1.8rem' }}>
            We are reading <em>{guest.book.split(' — ')[0]}</em> and watching <em>{guest.film.split(' — ')[0]}.</em> Your presence, perspective, and stories will bring our members closer to the soul of {guest.country} than any page or screen ever could.
          </p>

          {/* Event details block */}
          <div style={{
            background: 'rgba(201,160,82,0.07)',
            border: '1px solid rgba(201,160,82,0.2)',
            borderRadius: '2px', padding: '1.3rem 1.5rem',
            marginBottom: '1.8rem',
            display: 'flex', flexDirection: 'column', gap: '0.8rem',
          }}>
            {details.map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', gap: '1.2rem', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, opacity: 0.75, minWidth: '52px', paddingTop: '2px', flexShrink: 0 }}>{label}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '0.95rem', color: INK, lineHeight: 1.4 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Closing paragraph */}
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', lineHeight: 1.8, color: INK, opacity: 0.75, marginBottom: '1.8rem' }}>
            Your role as our <em>{guest.role}</em> makes you an essential bridge between our global community and the living culture of your homeland. We would be deeply honoured by your participation.
          </p>

          {/* Signature row */}
          <div style={{ borderTop: '1px solid rgba(201,160,82,0.2)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', color: INK, fontStyle: 'italic', marginBottom: '0.2rem' }}>Wide Open World</div>
              <div style={{ fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: INK, opacity: 0.45 }}>Global Expeditions · Cultural Club</div>
            </div>
            <WOWSealStamp size={68} color={INK} />
          </div>

          {/* View expedition CTA */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes cta-pulse {
                0% { box-shadow: 0 0 0 0 rgba(201, 160, 82, 0.5); }
                70% { box-shadow: 0 0 0 10px rgba(201, 160, 82, 0); }
                100% { box-shadow: 0 0 0 0 rgba(201, 160, 82, 0); }
              }
              .animated-invite-btn {
                display: inline-block;
                padding: 0.65rem 1.8rem;
                background: transparent;
                border: 1px solid #C9A052;
                color: #1B3D2A;
                font-size: 0.62rem;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                text-decoration: none;
                border-radius: 20px;
                font-family: 'Jost', sans-serif;
                font-weight: 600;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                animation: cta-pulse 2s infinite;
              }
              .animated-invite-btn:hover {
                background: #1B3D2A !important;
                color: #F5EFE0 !important;
                border-color: #1B3D2A !important;
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(27, 61, 42, 0.15) !important;
              }
              .animated-invite-btn span {
                display: inline-block;
                transition: transform 0.2s ease;
              }
              .animated-invite-btn:hover span {
                transform: translateX(4px);
              }
              .animated-invite-btn:active {
                transform: translateY(0);
              }
            `}} />
            <Link href={guest.expedition_link} className="animated-invite-btn">
              View {guest.country} Expedition <span>→</span>
            </Link>
          </div>
        </div>

        {/* Gold bottom bar */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #c9a052, #e8c87a, #c9a052, transparent)', opacity: 0.6 }} />
      </div>

      {/* Bottom note */}
      <div style={{ marginTop: '2rem', textAlign: 'center', opacity: 0.35 }}>
        <div style={{ fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD }}>
          Wide Open World Expeditions · Formal Guest Invitation
        </div>
      </div>
    </main>
  );
}
