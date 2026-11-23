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

  // Authentic Brand Letter Assets with Individual Falling Animations
  const letters = [
    { key: 'A1', src: '/ashadi_letter_A1.png', alt: 'A', delay: 0.12 },
    { key: 'S',  src: '/ashadi_letter_S.png',  alt: 'S', delay: 0.22 },
    { key: 'H',  src: '/ashadi_letter_H.png',  alt: 'H', delay: 0.32 },
    { key: 'A2', src: '/ashadi_letter_A2.png', alt: 'A', delay: 0.42 },
    { key: 'D',  src: '/ashadi_letter_D.png',  alt: 'D', delay: 0.52 },
    { key: 'I',  src: '/ashadi_letter_I.png',  alt: 'I', delay: 0.62 }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      // Deep royal crimson/burgundy velvet background:
      background: 'radial-gradient(ellipse at 50% 36%, #380712 0%, #1a0207 55%, #080103 100%)',
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
        maxWidth: '560px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* 1. Authentic Baroque Gold Filigree Crown Crest with Solitaire Cut Diamond */}
        <div style={{
          marginBottom: '6px',
          animation: 'crestReveal 0.95s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          filter: 'drop-shadow(0 0 24px rgba(212, 175, 55, 0.65)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.8))'
        }}>
          <img 
            src="/ashadi_exact_crest.png" 
            alt="Ashadi Jewellers Official Crown Crest" 
            style={{
              width: 'clamp(240px, 60vw, 380px)',
              height: 'auto',
              display: 'block'
            }}
          />
        </div>

        {/* 2. "ASHADI" — Letter-by-Letter Falling Kinetic Motion (Authentic Signature Typeface) */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'clamp(1px, 0.4vw, 4px)',
          margin: '2px 0 6px 0',
          userSelect: 'none'
        }}>
          {letters.map((item) => (
            <div
              key={item.key}
              style={{
                display: 'inline-block',
                animation: `letterFall 0.9s cubic-bezier(0.18, 1, 0.32, 1.25) ${item.delay}s both`,
                filter: 'drop-shadow(0 4px 14px rgba(255, 255, 255, 0.3)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.9))'
              }}
            >
              <img 
                src={item.src} 
                alt={item.alt} 
                style={{
                  height: 'clamp(46px, 11vw, 82px)',
                  width: 'auto',
                  display: 'block'
                }}
              />
            </div>
          ))}
        </div>

        {/* 3. Authentic "JEWELLERS" between Gold Lines & "Since 1988" */}
        <div style={{
          marginTop: '2px',
          marginBottom: '16px',
          animation: 'jewellersReveal 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.75s both',
          filter: 'drop-shadow(0 0 16px rgba(212, 175, 55, 0.45))'
        }}>
          <img 
            src="/ashadi_exact_jewellers.png" 
            alt="Ashadi Jewellers Since 1988" 
            style={{
              width: 'clamp(260px, 62vw, 410px)',
              height: 'auto',
              display: 'block'
            }}
          />
        </div>

        {/* 4. Award Accolade Ribbon ("MOST POPULAR JEWELLERY BRAND OF THE YEAR") */}
        <div style={{
          position: 'relative',
          padding: '10px 24px',
          borderRadius: '12px',
          background: 'radial-gradient(ellipse at center, rgba(212, 175, 55, 0.16) 0%, rgba(120, 10, 25, 0.25) 70%, transparent 100%)',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7), inset 0 0 20px rgba(212, 175, 55, 0.1)',
          animation: 'fadeRise 0.9s cubic-bezier(0.16, 1, 0.3, 1) 1.05s both',
          marginBottom: '20px'
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
            fontSize: 'clamp(10px, 2.3vw, 13px)',
            fontWeight: '700',
            letterSpacing: '0.28em',
            color: '#fef08a',
            textTransform: 'uppercase',
            marginBottom: '3px',
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
            fontSize: 'clamp(18px, 4.4vw, 28px)',
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
            fontSize: 'clamp(12px, 2.6vw, 17px)',
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

        {/* 5. Sleek Golden Progress Bar & Real-time Live Status */}
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
            marginTop: '16px',
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
        @keyframes crestReveal {
          0% {
            opacity: 0;
            transform: translateY(-24px) scale(0.85);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes letterFall {
          0% {
            opacity: 0;
            transform: translateY(-42px) scale(1.25);
            filter: blur(6px);
          }
          70% {
            opacity: 1;
            transform: translateY(3px) scale(0.97);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes jewellersReveal {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.92);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
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
