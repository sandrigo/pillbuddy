import { useEffect, useState } from 'react';

interface Pill {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  emoji: string;
  rotation: number;
  rotationSpeed: number;
}

interface FloatingText {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
}

export const PillsEasterEgg = ({ active, onComplete }: { active: boolean; onComplete: () => void }) => {
  const [pills, setPills] = useState<Pill[]>([]);
  const [floatingText, setFloatingText] = useState<FloatingText | null>(null);

  useEffect(() => {
    if (!active) {
      setPills([]);
      return;
    }

    // Pill emojis
    const pillEmojis = ['💊', '💉', '🩹', '🧬', '⚕️'];
    
    // Create 20 random pills
    const newPills: Pill[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 8, // Random horizontal velocity
      vy: (Math.random() - 0.5) * 8, // Random vertical velocity
      emoji: pillEmojis[Math.floor(Math.random() * pillEmojis.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    }));

    setPills(newPills);

    // Create floating PILLBUDDY text
    const textWidth = window.innerWidth * 0.6; // 60% of screen width
    const textHeight = 150; // Approximate height
    setFloatingText({
      x: window.innerWidth / 2 - textWidth / 2,
      y: window.innerHeight / 2 - textHeight / 2,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 2,
    });

    // Animation loop
    const animate = () => {
      // Animate text
      setFloatingText((prevText) => {
        if (!prevText) return null;
        
        let { x, y, vx, vy, rotation, rotationSpeed } = prevText;
        const textWidth = window.innerWidth * 0.6;
        const textHeight = 150;

        // Update position
        x += vx;
        y += vy;

        // Bounce off walls
        if (x <= 0 || x >= window.innerWidth - textWidth) {
          vx = -vx;
          x = Math.max(0, Math.min(window.innerWidth - textWidth, x));
        }
        if (y <= 0 || y >= window.innerHeight - textHeight) {
          vy = -vy;
          y = Math.max(0, Math.min(window.innerHeight - textHeight, y));
        }

        // Update rotation
        rotation += rotationSpeed;

        return { ...prevText, x, y, vx, vy, rotation };
      });

      // Animate pills
      setPills((prevPills) =>
        prevPills.map((pill) => {
          let { x, y, vx, vy, rotation, rotationSpeed } = pill;

          // Update position
          x += vx;
          y += vy;

          // Bounce off walls
          if (x <= 0 || x >= window.innerWidth - 40) {
            vx = -vx;
            x = Math.max(0, Math.min(window.innerWidth - 40, x));
          }
          if (y <= 0 || y >= window.innerHeight - 40) {
            vy = -vy;
            y = Math.max(0, Math.min(window.innerHeight - 40, y));
          }

          // Update rotation
          rotation += rotationSpeed;

          return { ...pill, x, y, vx, vy, rotation };
        })
      );
    };

    const interval = setInterval(animate, 16); // ~60fps

    // Auto-complete after 5 seconds
    const timeout = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [active, onComplete]);

  if (!active || pills.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Floating Pills */}
      {pills.map((pill) => (
        <div
          key={pill.id}
          className="absolute text-4xl transition-transform"
          style={{
            left: `${pill.x}px`,
            top: `${pill.y}px`,
            transform: `rotate(${pill.rotation}deg)`,
          }}
        >
          {pill.emoji}
        </div>
      ))}

      {/* Floating 3D Neon PillBuddy Text */}
      {floatingText && (
        <div
          className="absolute"
          style={{
            left: `${floatingText.x}px`,
            top: `${floatingText.y}px`,
            transform: `rotate(${floatingText.rotation}deg)`,
            width: '60vw',
          }}
        >
          <div
            className="font-black text-center select-none flex flex-col leading-none"
            style={{
              fontSize: 'clamp(3rem, 12vw, 10rem)',
            }}
          >
            {/* PILL in Neon Blue */}
            <span
              style={{
                color: '#00E5FF',
                textShadow: `
                  0 0 10px rgba(0, 229, 255, 0.8),
                  0 0 20px rgba(0, 229, 255, 0.6),
                  0 0 30px rgba(0, 229, 255, 0.5),
                  0 0 40px rgba(0, 229, 255, 0.4),
                  0 0 70px rgba(0, 229, 255, 0.3),
                  3px 3px 8px rgba(0, 0, 0, 0.4)
                `,
                filter: 'drop-shadow(0 0 20px rgba(0, 229, 255, 0.6))',
                letterSpacing: '0.1em',
              }}
            >
              PILL
            </span>
            {/* BUDDY in Neon Pink */}
            <span
              style={{
                color: '#FF1493',
                textShadow: `
                  0 0 10px rgba(255, 20, 147, 0.8),
                  0 0 20px rgba(255, 20, 147, 0.6),
                  0 0 30px rgba(255, 20, 147, 0.5),
                  0 0 40px rgba(255, 20, 147, 0.4),
                  0 0 70px rgba(255, 20, 147, 0.3),
                  3px 3px 8px rgba(0, 0, 0, 0.4)
                `,
                filter: 'drop-shadow(0 0 20px rgba(255, 20, 147, 0.6))',
                letterSpacing: '0.1em',
              }}
            >
              BUDDY
            </span>
          </div>
        </div>
      )}

      {/* CSS Animation for gradient shift */}
      <style>{`
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </div>
  );
};
