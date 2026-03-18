import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const DEFAULT_WORDS = [
  'ideas', 'audience', 'voice', 'impact', 'publish',
  'insight', 'clarity', 'strategy', 'story', 'momentum',
  'resonance', 'authority', 'perspective', 'signal', 'craft',
  'compose', 'refine', 'amplify', 'deliver', 'connect',
  'thinking', 'intelligence', 'content', 'channel', 'leadership',
  'framework', 'methodology', 'authentic', 'platform', 'growth',
];

interface CloudWord {
  text: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  weight: number;
  duration: number;
  delay: number;
}

export default function LivingWordCloud() {
  const { user } = useAuth();
  const [words, setWords] = useState<string[]>(DEFAULT_WORDS);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const collected: string[] = [];
      try {
        const { data: resources } = await supabase
          .from('resources')
          .select('title, content')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(5);
        if (resources) {
          for (const r of resources) {
            const text = (r.title + ' ' + (r.content || '')).toLowerCase();
            const meaningful = text
              .split(/[\s,.\-:;!?()[\]{}'"\/|]+/)
              .filter(w => w.length > 3 && w.length < 13)
              .filter(w => !['about','their','which','would','could','should','there','these','those','other','after','before','between','through','during','without','that','this','with','from','have','been','were','they','what','when','into','more','than','each','also','does','your','will','just','some','very','most','only','every','made','make'].includes(w));
            collected.push(...meaningful.slice(0, 10));
          }
        }
      } catch (e) {}
      try {
        const { data: outputs } = await supabase
          .from('outputs')
          .select('title')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        if (outputs) {
          for (const o of outputs) {
            const tw = (o.title || '').split(/\s+/).filter((w: string) => w.length > 3);
            collected.push(...tw.slice(0, 3));
          }
        }
      } catch (e) {}
      const unique = [...new Set(collected.map(w => w.toLowerCase()))];
      if (unique.length >= 12) {
        setWords(unique.slice(0, 30));
      } else {
        setWords([...unique, ...DEFAULT_WORDS].slice(0, 30));
      }
    })();
  }, [user]);

  const cloudWords = useMemo<CloudWord[]>(() => {
    return words.map((text, i) => {
      const t = i / words.length;
      const angle = (i / words.length) * Math.PI * 2 * 2.39996;
      const r = 4 + t * 22;
      const x = 50 + Math.cos(angle) * r + (Math.random() - 0.5) * 8;
      const y = 45 + Math.sin(angle) * r * 0.55 + (Math.random() - 0.5) * 6;
      const size = 12 + (1 - t) * 20 + Math.random() * 4;
      const opacity = 0.04 + (1 - t) * 0.11 + Math.random() * 0.03;

      return {
        text,
        x: Math.max(15, Math.min(85, x)),
        y: Math.max(15, Math.min(80, y)),
        size,
        opacity,
        weight: Math.random() > 0.5 ? 300 : 400,
        duration: 30 + Math.random() * 40,
        delay: Math.random() * -30,
      };
    });
  }, [words]);

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 0,
    }}>
      <style>{`
        @keyframes gentleDrift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(3px, -4px); }
        }
      `}</style>
      {cloudWords.map((w, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: `${w.x}%`,
            top: `${w.y}%`,
            fontSize: `${w.size}px`,
            fontFamily: "'Afacad Flux', sans-serif",
            fontWeight: w.weight,
            color: '#4A90D9',
            opacity: w.opacity,
            animation: `gentleDrift ${w.duration}s ease-in-out infinite`,
            animationDelay: `${w.delay}s`,
            whiteSpace: 'nowrap',
            userSelect: 'none',
            lineHeight: 1,
            textTransform: 'lowercase',
            letterSpacing: '0.3px',
          }}
        >
          {w.text}
        </span>
      ))}
    </div>
  );
}
