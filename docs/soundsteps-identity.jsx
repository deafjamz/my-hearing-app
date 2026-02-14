import { useState } from "react";

// --- SVG Logomark Components ---

// Concept 1: "Resolving Wave" — waveform that transitions from noisy/jagged to smooth
const LogoResolvingWave = ({ color, size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} fillOpacity="0.12" />
    {/* Noisy/scattered left side */}
    <circle cx="8" cy="20" r="1" fill={color} opacity="0.3" />
    <circle cx="10" cy="28" r="1.2" fill={color} opacity="0.25" />
    <circle cx="12" cy="22" r="0.8" fill={color} opacity="0.35" />
    <circle cx="11" cy="26" r="1" fill={color} opacity="0.2" />
    <circle cx="9" cy="24" r="0.6" fill={color} opacity="0.4" />
    {/* Transition zone */}
    <path
      d="M14 24 Q16 20, 18 24 Q20 28, 22 24 Q24 21, 26 24 Q28 27, 30 24"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.5"
      fill="none"
    />
    {/* Clean, resolved right side */}
    <path
      d="M28 24 Q31 18, 34 24 Q37 30, 40 24"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

// Concept 2: "Concentric Clarity" — rings that go from diffused to sharp
const LogoConcentricClarity = ({ color, size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} fillOpacity="0.12" />
    {/* Outer ring — diffused */}
    <circle cx="24" cy="24" r="16" stroke={color} strokeWidth="1" opacity="0.15" strokeDasharray="2 3" />
    {/* Middle ring — forming */}
    <circle cx="24" cy="24" r="11" stroke={color} strokeWidth="1.5" opacity="0.4" strokeDasharray="4 2" />
    {/* Inner ring — clear */}
    <circle cx="24" cy="24" r="6.5" stroke={color} strokeWidth="2" opacity="0.85" />
    {/* Center dot — the signal */}
    <circle cx="24" cy="24" r="2" fill={color} />
  </svg>
);

// Concept 3: "Stepping Waves" — sound steps literally, waves ascending like stairs
const LogoSteppingWaves = ({ color, size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} fillOpacity="0.12" />
    {/* Three ascending wave bars, each cleaner than the last */}
    <rect x="10" y="30" width="6" height="6" rx="1.5" fill={color} opacity="0.3" />
    <rect x="18" y="24" width="6" height="12" rx="1.5" fill={color} opacity="0.55" />
    <rect x="26" y="18" width="6" height="18" rx="1.5" fill={color} opacity="0.8" />
    <rect x="34" y="12" width="6" height="24" rx="1.5" fill={color} opacity="1" />
  </svg>
);

// Concept 4: "The Aperture" — opening/clearing, like a lens or ear opening to sound
const LogoAperture = ({ color, size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} fillOpacity="0.12" />
    {/* Aperture blades suggesting opening */}
    <path d="M24 8 Q32 16, 40 24" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.9" fill="none" />
    <path d="M24 8 Q16 16, 8 24" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.9" fill="none" />
    <path d="M8 24 Q16 32, 24 40" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" fill="none" />
    <path d="M40 24 Q32 32, 24 40" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" fill="none" />
    {/* Center clarity point */}
    <circle cx="24" cy="24" r="4" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="24" cy="24" r="1.5" fill={color} />
  </svg>
);

// Concept 5: "Ear + Wave" — abstract ear shape with emerging sound wave
const LogoEarWave = ({ color, size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} fillOpacity="0.12" />
    {/* Stylized ear canal / cochlea spiral */}
    <path
      d="M20 12 Q30 12, 32 20 Q34 28, 28 34 Q24 38, 20 34 Q16 30, 18 26 Q20 22, 22 24"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    {/* Sound waves emerging */}
    <path d="M34 20 Q38 24, 34 28" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" fill="none" />
    <path d="M37 17 Q42 24, 37 31" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4" fill="none" />
  </svg>
);

// --- Noise grain texture as inline SVG data URL ---
const grainFilter = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const TEALS = {
  cool: { hex: "#0097A7", name: "Cool Teal", desc: "Tech-forward, precision, clarity" },
  deep: { hex: "#008F86", name: "Deeper Teal", desc: "Serious, premium, medical-grade" },
  warm: { hex: "#00B4A0", name: "Warm Teal", desc: "Approachable, health & wellness" },
};

const BG_DEEP = "#0A0E14";
const BG_SURFACE = "#141A23";
const BG_ELEVATED = "#1E2530";
const AMBER = "#FFB300";
const TEXT_PRIMARY = "#F0F2F5";
const TEXT_SECONDARY = "#9BA3AF";
const TEXT_MUTED = "#6B7380";

// --- Mini app screen mockup ---
const AppScreenMockup = ({ teal, label }) => (
  <div style={{
    width: "100%",
    maxWidth: 280,
    borderRadius: 20,
    overflow: "hidden",
    background: BG_DEEP,
    border: `1px solid ${teal}22`,
    position: "relative",
  }}>
    {/* Grain overlay */}
    <div style={{
      position: "absolute", inset: 0, opacity: 0.03,
      backgroundImage: grainFilter,
      backgroundSize: "128px 128px",
      pointerEvents: "none", zIndex: 1,
    }} />
    
    {/* Status bar */}
    <div style={{
      padding: "8px 16px", fontSize: 11, color: TEXT_MUTED,
      display: "flex", justifyContent: "space-between",
      fontFamily: "'Satoshi', 'General Sans', system-ui, sans-serif",
    }}>
      <span>9:41</span>
      <span>●●●</span>
    </div>

    {/* Header */}
    <div style={{ padding: "12px 20px 8px", position: "relative", zIndex: 2 }}>
      <div style={{
        fontSize: 11, fontWeight: 500, color: teal,
        textTransform: "uppercase", letterSpacing: "0.1em",
        marginBottom: 4,
        fontFamily: "'Satoshi', 'General Sans', system-ui, sans-serif",
      }}>SoundSteps</div>
      <div style={{
        fontSize: 22, fontWeight: 700, color: TEXT_PRIMARY,
        fontFamily: "'Satoshi', 'General Sans', system-ui, sans-serif",
      }}>Your Training</div>
      <div style={{
        fontSize: 13, color: TEXT_SECONDARY, marginTop: 2,
        fontFamily: "'Satoshi', 'General Sans', system-ui, sans-serif",
      }}>3 sessions this week</div>
    </div>

    {/* Aura visualizer area */}
    <div style={{
      margin: "12px 20px", padding: 24,
      borderRadius: 16, background: BG_SURFACE,
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", zIndex: 2,
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: `radial-gradient(circle, ${teal}40 0%, ${teal}10 50%, transparent 70%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 0 40px ${teal}20`,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: `radial-gradient(circle, ${teal}90 0%, ${teal}60 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <polygon points="5,3 19,12 5,21" fill="white" stroke="none" />
          </svg>
        </div>
      </div>
    </div>

    {/* Exercise card */}
    <div style={{
      margin: "0 20px 12px", padding: "14px 16px",
      borderRadius: 14, background: BG_SURFACE,
      position: "relative", zIndex: 2,
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{
            fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY,
            fontFamily: "'Satoshi', 'General Sans', system-ui, sans-serif",
          }}>Word Pairs</div>
          <div style={{
            fontSize: 12, color: TEXT_SECONDARY, marginTop: 2,
            fontFamily: "'Satoshi', 'General Sans', system-ui, sans-serif",
          }}>Discrimination · 10 min</div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: `${teal}20`, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={teal} strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </div>
      </div>
    </div>

    {/* Streak card */}
    <div style={{
      margin: "0 20px 16px", padding: "14px 16px",
      borderRadius: 14, background: BG_SURFACE,
      position: "relative", zIndex: 2,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>🔥</span>
        <div>
          <div style={{
            fontSize: 14, fontWeight: 600, color: AMBER,
            fontFamily: "'Satoshi', 'General Sans', system-ui, sans-serif",
          }}>7-day streak</div>
          <div style={{
            fontSize: 12, color: TEXT_SECONDARY,
            fontFamily: "'Satoshi', 'General Sans', system-ui, sans-serif",
          }}>Keep it going!</div>
        </div>
      </div>
    </div>

    {/* Bottom nav */}
    <div style={{
      display: "flex", justifyContent: "space-around",
      padding: "10px 0 14px",
      borderTop: `1px solid ${TEXT_MUTED}15`,
      position: "relative", zIndex: 2,
    }}>
      {["Home", "Practice", "Progress"].map((item, i) => (
        <div key={item} style={{
          fontSize: 10, color: i === 0 ? teal : TEXT_MUTED,
          textAlign: "center",
          fontFamily: "'Satoshi', 'General Sans', system-ui, sans-serif",
          fontWeight: i === 0 ? 600 : 400,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke={i === 0 ? teal : TEXT_MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            style={{ display: "block", margin: "0 auto 3px" }}>
            {i === 0 && <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></>}
            {i === 1 && <><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16" fill={TEXT_MUTED} stroke="none"/></>}
            {i === 2 && <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>}
          </svg>
          {item}
        </div>
      ))}
    </div>
  </div>
);

// --- Main Component ---
export default function SoundStepsIdentity() {
  const [activeTeal, setActiveTeal] = useState("cool");
  const [activeLogoTab, setActiveLogoTab] = useState(0);
  const teal = TEALS[activeTeal].hex;

  const logos = [
    { name: "Resolving Wave", desc: "Noise → signal transition. Directly encodes the training metaphor.", Comp: LogoResolvingWave },
    { name: "Concentric Clarity", desc: "Rings sharpen inward. Maps to cochlear implant's function.", Comp: LogoConcentricClarity },
    { name: "Stepping Waves", desc: "Ascending bars. 'Steps' in SoundSteps, progression made visible.", Comp: LogoSteppingWaves },
    { name: "The Aperture", desc: "Opening to sound. Suggests both ear and camera lens clearing.", Comp: LogoAperture },
    { name: "Ear + Wave", desc: "Stylized cochlea with emanating sound. Most literal, most recognizable.", Comp: LogoEarWave },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: BG_DEEP,
      color: TEXT_PRIMARY,
      fontFamily: "'Satoshi', 'General Sans', system-ui, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Global grain overlay */}
      <div style={{
        position: "fixed", inset: 0, opacity: 0.025,
        backgroundImage: grainFilter,
        backgroundSize: "128px 128px",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: "32px 20px" }}>
        
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: teal,
            textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8,
          }}>Visual Identity Exploration</div>
          <h1 style={{
            fontSize: 32, fontWeight: 800, lineHeight: 1.15,
            margin: 0,
            background: `linear-gradient(135deg, ${TEXT_PRIMARY}, ${TEXT_SECONDARY})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            SoundSteps — "The Clearing"
          </h1>
          <p style={{ fontSize: 15, color: TEXT_SECONDARY, marginTop: 8, maxWidth: 600, lineHeight: 1.6 }}>
            Sound moving from obscured to clear. Clarity earned through practice. 
            This page renders in Satoshi on the deep blue-black background ({BG_DEEP}) with subtle grain texture.
            You're looking at the new system right now.
          </p>
        </div>

        {/* === SECTION 1: COLOR COMPARISON === */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>1 — Pick Your Teal</h2>
          <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 20 }}>
            Tap each option. The entire page — mockup, logos, accents — updates live.
          </p>

          {/* Teal selector pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            {Object.entries(TEALS).map(([key, { hex, name, desc }]) => (
              <button
                key={key}
                onClick={() => setActiveTeal(key)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: activeTeal === key ? `2px solid ${hex}` : `1px solid ${TEXT_MUTED}30`,
                  background: activeTeal === key ? `${hex}18` : "transparent",
                  color: activeTeal === key ? hex : TEXT_SECONDARY,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  transition: "all 0.2s ease-out",
                }}
              >
                <span style={{
                  display: "inline-block", width: 10, height: 10, borderRadius: "50%",
                  background: hex, marginRight: 8, verticalAlign: "middle",
                }} />
                {name}
              </button>
            ))}
          </div>

          {/* Active color details */}
          <div style={{
            display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap",
          }}>
            {/* Swatches */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 200 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: 12, background: BG_SURFACE,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: teal }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{TEALS[activeTeal].name}</div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED, fontFamily: "monospace" }}>{teal}</div>
                </div>
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: 12, background: BG_SURFACE,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: AMBER }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Amber (kept)</div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED, fontFamily: "monospace" }}>{AMBER}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4, lineHeight: 1.5 }}>
                {TEALS[activeTeal].desc}
              </div>

              {/* Background swatches */}
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Background layers</div>
                {[
                  { label: "Base", hex: BG_DEEP },
                  { label: "Surface", hex: BG_SURFACE },
                  { label: "Elevated", hex: BG_ELEVATED },
                ].map(({ label, hex: bg }) => (
                  <div key={label} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "6px 0",
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6, background: bg,
                      border: `1px solid ${TEXT_MUTED}20`,
                    }} />
                    <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>{label}</span>
                    <span style={{ fontSize: 11, color: TEXT_MUTED, fontFamily: "monospace" }}>{bg}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* App mockup */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <AppScreenMockup teal={teal} label={TEALS[activeTeal].name} />
            </div>
          </div>
        </div>

        {/* === SECTION 2: LOGOMARK CONCEPTS === */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>2 — Logomark Concepts</h2>
          <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 20 }}>
            Five directions for "The Clearing." These are conceptual — the final mark would be refined, 
            but the <em>idea</em> is what matters. Which concept feels like SoundSteps?
          </p>

          {/* Logo selector */}
          <div style={{
            display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20,
          }}>
            {logos.map((logo, i) => (
              <button
                key={i}
                onClick={() => setActiveLogoTab(i)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: activeLogoTab === i ? BG_SURFACE : "transparent",
                  color: activeLogoTab === i ? TEXT_PRIMARY : TEXT_MUTED,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: activeLogoTab === i ? 600 : 400,
                  fontFamily: "inherit",
                  transition: "all 0.15s ease-out",
                }}
              >
                {logo.name}
              </button>
            ))}
          </div>

          {/* Active logo display */}
          <div style={{
            padding: 28, borderRadius: 20, background: BG_SURFACE,
          }}>
            <div style={{
              display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap",
            }}>
              {/* Large logo */}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              }}>
                {(() => {
                  const { Comp } = logos[activeLogoTab];
                  return <Comp color={teal} size={96} />;
                })()}
                <span style={{ fontSize: 11, color: TEXT_MUTED }}>96px</span>
              </div>

              {/* Medium */}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              }}>
                {(() => {
                  const { Comp } = logos[activeLogoTab];
                  return <Comp color={teal} size={48} />;
                })()}
                <span style={{ fontSize: 11, color: TEXT_MUTED }}>48px</span>
              </div>

              {/* Small (favicon/tab) */}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              }}>
                {(() => {
                  const { Comp } = logos[activeLogoTab];
                  return <Comp color={teal} size={32} />;
                })()}
                <span style={{ fontSize: 11, color: TEXT_MUTED }}>32px</span>
              </div>

              {/* Description */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                  {logos[activeLogoTab].name}
                </div>
                <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.6 }}>
                  {logos[activeLogoTab].desc}
                </div>
              </div>
            </div>

            {/* Logo + wordmark lockup */}
            <div style={{
              marginTop: 24, paddingTop: 20,
              borderTop: `1px solid ${TEXT_MUTED}15`,
            }}>
              <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Wordmark lockup
              </div>
              <div style={{
                display: "flex", gap: 24, flexWrap: "wrap",
              }}>
                {/* Horizontal lockup */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 20px", borderRadius: 12, background: BG_DEEP,
                }}>
                  {(() => {
                    const { Comp } = logos[activeLogoTab];
                    return <Comp color={teal} size={32} />;
                  })()}
                  <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>
                    Sound<span style={{ color: teal }}>Steps</span>
                  </span>
                </div>
                {/* Just the mark + minimal text */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "12px 20px", borderRadius: 12, background: BG_DEEP,
                }}>
                  {(() => {
                    const { Comp } = logos[activeLogoTab];
                    return <Comp color={teal} size={28} />;
                  })()}
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: TEXT_SECONDARY,
                    textTransform: "uppercase", letterSpacing: "0.15em",
                  }}>SoundSteps</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === SECTION 3: TYPOGRAPHY === */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>3 — Typography in Context</h2>
          <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 20 }}>
            This entire page uses Satoshi (falling back to General Sans → system-ui). 
            Notice how it feels compared to Inter — slightly warmer geometry, more distinctive.
          </p>

          <div style={{
            padding: 24, borderRadius: 20, background: BG_SURFACE,
          }}>
            {[
              { label: "Display", size: 36, weight: 900, text: "Hear clearly. Live fully." },
              { label: "Heading 1", size: 28, weight: 700, text: "Your Training Dashboard" },
              { label: "Heading 2", size: 22, weight: 600, text: "Word Pair Discrimination" },
              { label: "Heading 3", size: 18, weight: 600, text: "Session Summary" },
              { label: "Body", size: 15, weight: 400, text: "Train your hearing with exercises designed by audiologists. Practice distinguishing speech from noise in real-world scenarios." },
              { label: "Caption", size: 12, weight: 500, text: "LEVEL 3 · DISCRIMINATION · 12 EXERCISES" },
            ].map(({ label, size, weight, text }) => (
              <div key={label} style={{
                display: "flex", alignItems: "baseline", gap: 16,
                padding: "10px 0",
                borderBottom: `1px solid ${TEXT_MUTED}10`,
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, color: TEXT_MUTED,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  minWidth: 70,
                }}>{label}</span>
                <span style={{
                  fontSize: size, fontWeight: weight, color: TEXT_PRIMARY,
                  lineHeight: 1.4,
                  ...(label === "Caption" ? { color: teal, letterSpacing: "0.08em" } : {}),
                }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* === SECTION 4: BUTTON / COMPONENT PREVIEW === */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>4 — Component Feel</h2>
          <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 20 }}>
            Buttons, cards, and feedback states using the selected teal.
          </p>

          <div style={{
            display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20,
          }}>
            {/* Primary button */}
            <button style={{
              padding: "12px 28px", borderRadius: 999,
              background: teal, color: "#fff",
              border: "none", fontSize: 14, fontWeight: 600,
              fontFamily: "inherit", cursor: "pointer",
              boxShadow: `0 0 24px ${teal}30`,
            }}>Start Session</button>

            {/* Secondary button */}
            <button style={{
              padding: "12px 28px", borderRadius: 999,
              background: "transparent", color: teal,
              border: `1.5px solid ${teal}60`, fontSize: 14, fontWeight: 600,
              fontFamily: "inherit", cursor: "pointer",
            }}>View Progress</button>

            {/* Ghost button */}
            <button style={{
              padding: "12px 28px", borderRadius: 999,
              background: "transparent", color: TEXT_SECONDARY,
              border: "none", fontSize: 14, fontWeight: 500,
              fontFamily: "inherit", cursor: "pointer",
            }}>Skip →</button>
          </div>

          {/* Feedback states */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{
              padding: "14px 20px", borderRadius: 14, background: "#4CAF5018",
              border: "1px solid #4CAF5040", display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ color: "#4CAF50", fontSize: 18, fontWeight: 700 }}>✓</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#4CAF50" }}>Correct!</span>
            </div>
            <div style={{
              padding: "14px 20px", borderRadius: 14, background: "#FF453A18",
              border: "1px solid #FF453A40", display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ color: "#FF453A", fontSize: 18, fontWeight: 700 }}>✗</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#FF453A" }}>Not quite — it was "bat"</span>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div style={{
          padding: "20px 0", borderTop: `1px solid ${TEXT_MUTED}15`,
          fontSize: 12, color: TEXT_MUTED, lineHeight: 1.6,
        }}>
          This exploration renders at the actual proposed token values. The background is {BG_DEEP} (deep blue-black, not pure OLED black). 
          The grain texture is live at 2.5% opacity. Toggle the teal options above to see how each shifts the feel of the entire system.
        </div>
      </div>
    </div>
  );
}
