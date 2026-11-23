import React, { useState, useEffect, useRef } from 'react';
import { Crown, Sparkles, ShieldCheck } from 'lucide-react';

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
    // Dynamic loading stage text cycling
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
        let targetMax = isLoading ? 88 : 100;
        
        // If still loading, smoothly advance up to 88%
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

        // When loading is finished, check if minDuration is satisfied
        if (elapsed < minDuration) {
          // Progress gently towards 96%
          const pct = Math.min(88 + ((elapsed / minDuration) * 10), 96);
          return pct;
        }

        // Both loading is false AND minDuration elapsed: finish up to 100%
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

  // When progress hits 100%, trigger smooth fade out
  useEffect(() => {
    if (progress >= 100 && !completedRef.current) {
      completedRef.current = true;

      // Soft audio chime if user interaction enabled
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

  // Fallback safety timeout: never keep screen trapped past 6 seconds
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        setIsFadingOut(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 500);
      }
    }, 6000);

    return () => clearTimeout(safetyTimer);
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      // Royal crimson/burgundy velvet backdrop matching the brand photo:
      background: 'radial-gradient(ellipse at 50% 38%, #36060f 0%, #1c0207 55%, #0a0103 100%)',
      color: '#ffffff',
      overflow: 'hidden',
      padding: '24px 16px',
      transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: isFadingOut ? 0 : 1,
      transform: isFadingOut ? 'scale(1.03)' : 'scale(1)',
      pointerEvents: isFadingOut ? 'none' : 'auto'
    }}>
      {/* Ambient background light orbs */}
      <div style={{
        position: 'absolute',
        width: '550px',
        height: '550px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.16) 0%, rgba(185, 28, 28, 0.08) 50%, transparent 75%)',
        filter: 'blur(50px)',
        top: '15%',
        pointerEvents: 'none',
        animation: 'pulseGlow 4s ease-in-out infinite alternate'
      }} />

      {/* Floating Sparkles Particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(14)].map((_, i) => {
          const left = 5 + (i * 7) + ((i % 3) * 2);
          const top = 10 + ((i * 13) % 80);
          const size = 3 + (i % 4) * 2.5;
          const delay = (i * 0.35) % 3;
          const duration = 2.5 + (i % 3);
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
                boxShadow: `0 0 ${size * 3}px rgba(254, 240, 138, 0.9)`,
                opacity: 0.75,
                animation: `floatSparkle ${duration}s ease-in-out ${delay}s infinite alternate`
              }}
            />
          );
        })}
      </div>

      {/* Centerpiece Container with Luxury Photo */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '520px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Top Gold Pill Tag */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(212, 175, 55, 0.15)',
          border: '1px solid rgba(212, 175, 55, 0.45)',
          borderRadius: '20px',
          padding: '4px 14px',
          marginBottom: '16px',
          fontSize: '11px',
          fontWeight: '800',
          letterSpacing: '1.2px',
          color: '#fef08a',
          textTransform: 'uppercase',
          boxShadow: '0 0 15px rgba(212, 175, 55, 0.2)'
        }}>
          <Sparkles size={12} color="#fef08a" />
          <span>Since 1988 • Ashadi Jewellers</span>
          <Sparkles size={12} color="#fef08a" />
        </div>

        {/* The Luxury Brand Opening Photo Card */}
        <div style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 45px rgba(212, 175, 55, 0.25)',
          border: '1.5px solid rgba(212, 175, 55, 0.45)',
          background: '#1a0307',
          maxWidth: '430px',
          width: '92vw'
        }}>
          {/* Subtle Golden Top Accent Line */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2.5px',
            background: 'linear-gradient(90deg, #b8860b, #fef08a, #d4af37, #fef08a, #b8860b)',
            zIndex: 3
          }} />

          {/* Actual Brand Artwork Image */}
          <img 
            src="/ashadi_brand_opening.jpg" 
            alt="Ashadi Jewellers - Most Popular Jewellery Brand of the Year" 
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              objectFit: 'contain'
            }}
          />

          {/* Golden Shimmer Overlay Sweep */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.18) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
            animation: 'shimmerSweep 3.2s infinite ease-in-out',
            pointerEvents: 'none',
            zIndex: 2
          }} />
        </div>

        {/* Subtitle / System Tag */}
        <div style={{
          marginTop: '20px',
          fontSize: '12px',
          color: '#cbd5e1',
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Crown size={14} color="#d4af37" />
          <span>Workshop Production & Labour Costing System</span>
          <Crown size={14} color="#d4af37" />
        </div>

        {/* Sleek Golden Progress Bar */}
        <div style={{
          width: '100%',
          maxWidth: '340px',
          marginTop: '18px',
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
            <span style={{ color: '#fef08a', textShadow: '0 0 8px rgba(254, 240, 138, 0.4)' }}>
              {statusText}
            </span>
            <span style={{ color: '#fbbf24', fontFamily: 'monospace' }}>
              {Math.round(progress)}%
            </span>
          </div>

          {/* Outer Track */}
          <div style={{
            width: '100%',
            height: '6px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.6)'
          }}>
            {/* Filled Progress Bar */}
            <div style={{
              height: '100%',
              width: `${progress}%`,
              borderRadius: '10px',
              background: 'linear-gradient(90deg, #b8860b 0%, #fef08a 60%, #d4af37 100%)',
              boxShadow: '0 0 12px rgba(254, 240, 138, 0.7)',
              transition: 'width 0.12s ease-out'
            }} />
          </div>
        </div>

        {/* Skip button if user is in a hurry */}
        <button
          type="button"
          onClick={() => {
            setIsFadingOut(true);
            setTimeout(() => {
              if (onComplete) onComplete();
            }, 300);
          }}
          style={{
            marginTop: '22px',
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

      {/* Embedded Keyframe Animations */}
      <style>{`
        @keyframes pulseGlow {
          0% { transform: scale(0.9); opacity: 0.6; }
          100% { transform: scale(1.15); opacity: 0.9; }
        }
        @keyframes floatSparkle {
          0% { transform: translateY(0px) scale(0.8); opacity: 0.3; }
          100% { transform: translateY(-22px) scale(1.2); opacity: 1; }
        }
        @keyframes shimmerSweep {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
