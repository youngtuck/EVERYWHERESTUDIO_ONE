import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const DEFAULT_WORDS = [
  'ideas', 'audience', 'voice', 'impact', 'publish',
  'insight', 'clarity', 'strategy', 'story', 'momentum',
  'resonance', 'authority', 'perspective', 'signal', 'craft',
  'compose', 'refine', 'amplify', 'deliver', 'connect',
  'thinking', 'intelligence', 'content', 'channel', 'leadership',
  'framework', 'methodology', 'authentic', 'platform', 'growth',
  'narrative', 'conviction', 'precision', 'presence', 'depth',
  'original', 'publish', 'audience', 'category', 'position',
];

export default function LivingWordCloud() {
  const { user } = useAuth();
  const [words, setWords] = useState<string[]>(DEFAULT_WORDS);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const collected: string[] = [];
      try {
        const { data: resources } = await supabase
          .from('resources').select('title, content')
          .eq('user_id', user.id).eq('is_active', true).limit(5);
        if (resources) {
          for (const r of resources) {
            const text = (r.title + ' ' + (r.content || '')).toLowerCase();
            const meaningful = text.split(/[\s,.\-:;!?()[\]{}'"\/|]+/)
              .filter(w => w.length > 3 && w.length < 13)
              .filter(w => !['about','their','which','would','could','should','there','these','those','other','after','before','between','through','during','without','that','this','with','from','have','been','were','they','what','when','into','more','than','each','also','does','your','will','just','some','very','most','only','every','made','make','using','used'].includes(w));
            collected.push(...meaningful.slice(0, 10));
          }
        }
      } catch (e) {}
      try {
        const { data: outputs } = await supabase
          .from('outputs').select('title')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);
        if (outputs) {
          for (const o of outputs) {
            collected.push(...(o.title || '').split(/\s+/).filter((w: string) => w.length > 3).slice(0, 3));
          }
        }
      } catch (e) {}
      const unique = [...new Set(collected.map(w => w.toLowerCase()))];
      setWords(unique.length >= 12 ? unique.slice(0, 40) : [...unique, ...DEFAULT_WORDS].slice(0, 40));
    })();
  }, [user]);

  const cloudWords = useMemo(() => {
    return words.map((text, i) => {
      const t = i / words.length;
      const angle = i * 2.39996322;
      const r = 3 + t * 28;
      const x = 50 + Math.cos(angle) * r + (Math.random() - 0.5) * 6;
      const y = 42 + Math.sin(angle) * r * 0.5 + (Math.random() - 0.5) * 5;

      let size: number, opacity: number, weight: number;
      if (i < 5) {
        size = 36 + Math.random() * 18;
        opacity = 0.08 + Math.random() * 0.06;
        weight = 600;
      } else if (i < 15) {
        size = 20 + Math.random() * 12;
        opacity = 0.06 + Math.random() * 0.05;
        weight = 400;
      } else {
        size = 13 + Math.random() * 8;
        opacity = 0.04 + Math.random() * 0.04;
        weight = 300;
      }

      return {
        text, size, opacity, weight,
        x: Math.max(3, Math.min(97, x)),
        y: Math.max(8, Math.min(85, y)),
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -25,
        fadeDelay: 5 + Math.random() * 15,
        fadeDuration: 8 + Math.random() * 12,
      };
    });
  }, [words]);

  return (
    <div ref={containerRef} style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 0,
    }}>
      <style>{`
        @keyframes cloudFloat {
          0% { transform: translate(0, 0); }
          25% { transform: translate(6px, -8px); }
          50% { transform: translate(-4px, -3px); }
          75% { transform: translate(5px, 6px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes cloudAppear {
          0% { opacity: 0; filter: blur(8px); }
          20% { opacity: var(--peak); filter: blur(0px); }
          80% { opacity: var(--peak); filter: blur(0px); }
          100% { opacity: 0; filter: blur(8px); }
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
            opacity: 0,
            ['--peak' as any]: w.opacity,
            animation: `cloudFloat ${w.duration}s ease-in-out infinite, cloudAppear ${w.fadeDuration}s ease-in-out infinite`,
            animationDelay: `${w.delay}s, ${w.fadeDelay}s`,
            whiteSpace: 'nowrap',
            userSelect: 'none',
            lineHeight: 1,
            textTransform: 'lowercase',
            letterSpacing: w.size > 30 ? '1px' : '0.3px',
            willChange: 'transform, opacity, filter',
          }}
        >
          {w.text}
        </span>
      ))}
    </div>
  );
}
