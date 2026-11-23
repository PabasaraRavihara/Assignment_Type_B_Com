import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Crown } from 'lucide-react';

export default function OpeningSplashScreen({ 
  isLoading = true, 
  onComplete, 
  user = null,
  minDuration = 2200 
}) {
  const [progress, setProgress] = useState(12);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [statusText, setStatusText] = useState('Initializing Ashadi Executive Session...');
  const startTimeRef = useRef(Date.now());
  const completedRef = useRef(false);

  useEffect(() => {
    const textStages = [
      { at: 15, text: 'Initializing Ashadi Executive Session...' },
      { at: 35, text: 'Connecting Ashadi Workshop Cloud (MongoDB)...' },
      { at: 60, text: 'Loading 63 Benches & Real-time Allocations...' },
      { at: 82, text: 'Syncing Jewellery SMT Standards & Gold Ceilings...' },
      { at: 96, text: user ? `Welcome, ${user.name || 'Executive Admin'} • Opening Floor...` : 'Ashadi Jewellers Workshop Ready • Opening...' }
    ];

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;

      setProgress(prev => {
        if (isLoading) {
          if (prev < 88) {
            const next = prev + Math.random() * 4 + 1.5;
            const clamped = Math.min(next, 88);
            const stage = textStages.slice().reverse().find(s => clamped >= s.at);
            if (stage) setStatusText(stage.text);
            return clamped;
          }
          return 88;
        }

        if (elapsed < minDuration) {
          const pct = Math.min(88 + ((elapsed / minDuration) * 10), 96);
          return pct;
        }

        if (prev < 100) {
          const next = prev + 8;
          if (next >= 100) {
            setStatusText(user ? `Welcome, ${user.name || 'Executive'} • Floor Ready!` : 'Welcome to Ashadi Jewellers!');
            return 100;
          }
          return next;
        }

        return 100;
      });
    }, 60);

    return () => clearInterval(progressInterval);
  }, [isLoading, minDuration, user]);

  useEffect(() => {
    if (progress >= 100 && !completedRef.current) {
      completedRef.current = true;

      try {
        const audio = new Audio('/sounds/chime.wav');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {}

      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 350);

      const finishTimer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 850);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(finishTimer);
      };
    }
  }, [progress, onComplete]);

  // Fallback safety timeout
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        setIsFadingOut(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 500);
      }
    }, 6500);

    return () => clearTimeout(safetyTimer);
  }, [onComplete]);

  const ashadiLetters = ['A', 'S', 'H', 'A', 'D', 'I'];
  const jewellersLetters = ['J', 'E', 'W', 'E', 'L', 'L', 'E', 'R', 'S'];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      // Royal crimson/burgundy velvet backdrop matching high-end jewellery showroom:
      background: 'radial-gradient(ellipse at 50% 36%, #3a0812 0%, #1c0308 55%, #080103 100%)',
      color: '#ffffff',
      overflow: 'hidden',
      padding: '24px 16px',
      transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: isFadingOut ? 0 : 1,
      transform: isFadingOut ? 'scale(1.03)' : 'scale(1)',
      pointerEvents: isFadingOut ? 'none' : 'auto'
    }}>
      {/* Ambient background gold glow spotlight */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.18) 0%, rgba(185, 28, 28, 0.08) 50%, transparent 75%)',
        filter: 'blur(55px)',
        top: '12%',
        pointerEvents: 'none',
        animation: 'pulseGlow 4s ease-in-out infinite alternate'
      }} />

      {/* Floating Sparkles & Gold Dust Particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(18)].map((_, i) => {
          const left = 4 + (i * 5.4) + ((i % 4) * 2);
          const top = 8 + ((i * 17) % 82);
          const size = 3 + (i % 4) * 2.2;
          const delay = (i * 0.28) % 3.2;
          const duration = 2.4 + (i % 3);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${left}%`,
                top: `${top}%`,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: i % 2 === 0 ? '#fef08a' : '#d4af37',
                boxShadow: `0 0 ${size * 3}px rgba(254, 240, 138, 0.95)`,
                opacity: 0.8,
                animation: `floatSparkle ${duration}s ease-in-out ${delay}s infinite alternate`
              }}
            />
          );
        })}
      </div>

      {/* Master Animated Brand Typography Container */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '680px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* 1. Grand Royal Filigree Crown Crest (SVG Vector) */}
        <div style={{
          marginBottom: '10px',
          animation: 'crownReveal 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          filter: 'drop-shadow(0 0 25px rgba(212, 175, 55, 0.6))'
        }}>
          <svg width="86" height="58" viewBox="0 0 100 68" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="crestGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff9d2" />
                <stop offset="25%" stopColor="#fef08a" />
                <stop offset="60%" stopColor="#d4af37" />
                <stop offset="100%" stopColor="#b38728" />
              </linearGradient>
              <filter id="diamondGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
              </filter>
            </defs>

            {/* Apex Solitaire Diamond */}
            <polygon points="50,2 57,12 50,22 43,12" fill="url(#crestGold)" />
            <polygon points="50,6 54,12 50,18 46,12" fill="#ffffff" opacity="0.9" />

            {/* Ornate Royal Crown Filigree Arches */}
            <path 
              d="M 50,22 C 38,24 28,15 22,26 C 26,30 32,32 38,30 C 44,28 47,34 50,38 C 53,34 56,28 62,30 C 68,32 74,30 78,26 C 72,15 62,24 50,22 Z" 
              fill="url(#crestGold)" 
            />
            
            {/* Elegant Side Filigree Scrolls */}
            <path 
              d="M 22,26 C 14,20 6,28 10,36 C 14,44 26,40 32,44 C 24,46 16,50 20,56 C 24,62 36,54 44,48 C 36,50 30,58 36,62 C 42,66 48,56 50,52 C 52,56 58,66 64,62 C 70,58 64,50 56,48 C 64,54 76,62 80,56 C 84,50 76,46 68,44 C 74,40 86,44 90,36 C 94,28 86,20 78,26 Z" 
              fill="url(#crestGold)"
              opacity="0.92"
            />

            {/* Symmetrical Delicate Accents */}
            <circle cx="16" cy="30" r="2" fill="#fef08a" />
            <circle cx="84" cy="30" r="2" fill="#fef08a" />
            <circle cx="28" cy="40" r="1.8" fill="#fef08a" />
            <circle cx="72" cy="40" r="1.8" fill="#fef08a" />
            <circle cx="50" cy="44" r="2.5" fill="#ffffff" />
          </svg>
        </div>

        {/* 2. "A S H A D I" — Letter-by-Letter Falling Kinetic Motion */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'clamp(4px, 1.6vw, 14px)',
          margin: '4px 0 8px 0',
          userSelect: 'none'
        }}>
          {ashadiLetters.map((letter, idx) => {
            const delay = 0.12 + (idx * 0.11);
            return (
              <span
                key={idx}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
                  fontSize: 'clamp(40px, 8.5vw, 68px)',
                  fontWeight: '800',
                  lineHeight: 1.05,
                  letterSpacing: '0.04em',
                  background: 'linear-gradient(180deg, #ffffff 0%, #fff9d2 20%, #fef08a 45%, #d4af37 75%, #aa771c 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 4px 20px rgba(212, 175, 55, 0.55)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.9))',
                  animation: `ashadiLetterFall 0.95s cubic-bezier(0.18, 1, 0.32, 1.25) ${delay}s both`
                }}
              >
                {letter}
              </span>
            );
          })}
        </div>

        {/* 3. Golden Divider Line with Centre Diamond */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 'min(380px, 86vw)',
          margin: '2px 0 10px 0',
          animation: 'lineExpand 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.65s both'
        }}>
          <div style={{
            flex: 1,
            height: '1.5px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(212, 175, 55, 0.8) 50%, #fef08a 100%)'
          }} />
          <div style={{
            margin: '0 8px',
            transform: 'rotate(45deg)',
            width: '6px',
            height: '6px',
            background: '#fef08a',
            boxShadow: '0 0 10px #fef08a'
          }} />
          <div style={{
            flex: 1,
            height: '1.5px',
            background: 'linear-gradient(90deg, #fef08a 0%, rgba(212, 175, 55, 0.8) 50%, transparent 100%)'
          }} />
        </div>

        {/* 4. "J E W E L L E R S" — Expanding Staggered Reveal */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'clamp(5px, 1.4vw, 12px)',
          marginBottom: '10px',
          userSelect: 'none'
        }}>
          {jewellersLetters.map((letter, idx) => {
            const delay = 0.72 + (idx * 0.055);
            return (
              <span
                key={idx}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Cinzel', serif",
                  fontSize: 'clamp(14px, 3.4vw, 22px)',
                  fontWeight: '700',
                  letterSpacing: '0.18em',
                  color: '#f8fafc',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.8), 0 0 12px rgba(254, 240, 138, 0.4)',
                  animation: `jewellerLetterRise 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both`
                }}
              >
                {letter}
              </span>
            );
          })}
        </div>

        {/* 5. "Since 1988" Tagline */}
        <div style={{
          fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
          fontStyle: 'italic',
          fontSize: 'clamp(14px, 2.8vw, 18px)',
          fontWeight: '600',
          color: '#fef08a',
          letterSpacing: '1.5px',
          marginBottom: '18px',
          textShadow: '0 0 12px rgba(254, 240, 138, 0.4)',
          animation: 'fadeRise 0.8s ease 1.1s both'
        }}>
          — Since 1988 —
        </div>

        {/* 6. Award Accolade Laurel Badge */}
        <div style={{
          position: 'relative',
          padding: '12px 28px',
          borderRadius: '12px',
          background: 'radial-gradient(ellipse at center, rgba(212, 175, 55, 0.16) 0%, rgba(120, 10, 25, 0.25) 70%, transparent 100%)',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7), inset 0 0 20px rgba(212, 175, 55, 0.1)',
          animation: 'fadeRise 0.9s cubic-bezier(0.16, 1, 0.3, 1) 1.25s both',
          marginBottom: '22px'
        }}>
          {/* Shimmer Light Reflection Sweep */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '12px',
            background: 'linear-gradient(105deg, transparent 35%, rgba(255, 255, 255, 0.22) 50%, transparent 65%)',
            backgroundSize: '200% 100%',
            animation: 'awardShimmer 3.2s infinite ease-in-out',
            pointerEvents: 'none'
          }} />

          {/* MOST POPULAR */}
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(11px, 2.4vw, 14px)',
            fontWeight: '700',
            letterSpacing: '0.28em',
            color: '#fef08a',
            textTransform: 'uppercase',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <span style={{ color: '#d4af37', fontSize: '10px' }}>★</span>
            <span>MOST POPULAR</span>
            <span style={{ color: '#d4af37', fontSize: '10px' }}>★</span>
          </div>

          {/* JEWELLERY */}
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(20px, 4.8vw, 32px)',
            fontWeight: '900',
            letterSpacing: '0.12em',
            color: '#ffffff',
            textTransform: 'uppercase',
            lineHeight: 1.15,
            textShadow: '0 2px 14px rgba(0, 0, 0, 0.9)'
          }}>
            JEWELLERY
          </div>

          {/* BRAND OF THE YEAR */}
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(13px, 2.8vw, 19px)',
            fontWeight: '800',
            letterSpacing: '0.24em',
            color: '#fbbf24',
            textTransform: 'uppercase',
            marginTop: '2px',
            textShadow: '0 0 15px rgba(251, 191, 36, 0.6)'
          }}>
            BRAND OF THE YEAR
          </div>
        </div>

        {/* 7. Sleek Golden Progress Bar & Real-time Live Status */}
        <div style={{
          width: '100%',
          maxWidth: '360px',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
            fontSize: '11px',
            fontWeight: '700'
          }}>
            <span style={{ 
              color: '#fef08a', 
              textShadow: '0 0 8px rgba(254, 240, 138, 0.5)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '85%'
            }}>
              {statusText}
            </span>
            <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: 'bold' }}>
              {Math.round(progress)}%
            </span>
          </div>

          {/* Progress Track */}
          <div style={{
            width: '100%',
            height: '6px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              borderRadius: '10px',
              background: 'linear-gradient(90deg, #b8860b 0%, #fef08a 60%, #d4af37 100%)',
              boxShadow: '0 0 14px rgba(254, 240, 138, 0.8)',
              transition: 'width 0.12s ease-out'
            }} />
          </div>
        </div>

        {/* Skip button for instant entry */}
        <button
          type="button"
          onClick={() => {
            setIsFadingOut(true);
            setTimeout(() => {
              if (onComplete) onComplete();
            }, 300);
          }}
          style={{
            marginTop: '18px',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: '11px',
            cursor: 'pointer',
            padding: '4px 10px',
            borderRadius: '4px',
            transition: 'color 0.2s',
            opacity: 0.75,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fef08a'; e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.opacity = '0.75'; }}
        >
          <span>Skip to Workshop Floor →</span>
        </button>
      </div>

      {/* Embedded High-Performance Keyframe Animations */}
      <style>{`
        @keyframes crownReveal {
          0% {
            opacity: 0;
            transform: translateY(-22px) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes ashadiLetterFall {
          0% {
            opacity: 0;
            transform: translateY(-45px) scale(1.22);
            filter: blur(8px);
          }
          70% {
            opacity: 1;
            transform: translateY(4px) scale(0.97);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes lineExpand {
          0% {
            transform: scaleX(0);
            opacity: 0;
          }
          100% {
            transform: scaleX(1);
            opacity: 1;
          }
        }

        @keyframes jewellerLetterRise {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.9);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes fadeRise {
          0% {
            opacity: 0;
            transform: translateY(14px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes awardShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes pulseGlow {
          0% { transform: scale(0.92); opacity: 0.6; }
          100% { transform: scale(1.12); opacity: 0.95; }
        }

        @keyframes floatSparkle {
          0% { transform: translateY(0px) scale(0.8); opacity: 0.35; }
          100% { transform: translateY(-26px) scale(1.25); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
