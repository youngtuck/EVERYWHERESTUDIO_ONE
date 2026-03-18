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
  'narrative', 'conviction', 'precision', 'presence', 'depth',
];

export default function LivingWordCloud() {
  const { user } = useAuth();
  const [words, setWords] = useState<string[]>(DEFAULT_WORDS);

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
            const meaningful = (r.title + ' ' + (r.content || '')).toLowerCase()
              .split(/[\s,.\-:;!?()[\]{}'"\/|]+/)
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
          for (const o of outputs) collected.push(...(o.title || '').split(/\s+/).filter((w: string) => w.length > 3).slice(0, 3));
        }
      } catch (e) {}
      const unique = [...new Set(collected.map(w => w.toLowerCase()))];
      setWords(unique.length >= 12 ? unique.slice(0, 32) : [...unique, ...DEFAULT_WORDS].slice(0, 32));
    })();
  }, [user]);

  const rows = useMemo(() => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    const result: { words: string[]; size: number; opacity: number; speed: number; direction: number }[] = [];
    const sizes = [42, 28, 20, 32, 16];
    const opacities = [0.06, 0.04, 0.07, 0.05, 0.03];

    for (let i = 0; i < 5; i++) {
      const rowWords: string[] = [];
      for (let j = 0; j < 3; j++) {
        const start = (i * 6 + j * 2) % shuffled.length;
        for (let k = 0; k < 8; k++) {
          rowWords.push(shuffled[(start + k) % shuffled.length]);
        }
      }
      result.push({
        words: rowWords,
        size: sizes[i],
        opacity: opacities[i],
        speed: 40 + i * 15,
        direction: i % 2 === 0 ? 1 : -1,
      });
    }
    return result;
  }, [words]);

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -55%)',
      width: '120%',
      height: '320px',
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 0,
      maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black 30%, transparent 70%)',
      WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black 30%, transparent 70%)',
    }}>
      <style>{`
        @keyframes scrollLeft {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes scrollRight {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
      `}</style>
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: row.size * 0.8,
            whiteSpace: 'nowrap',
            animation: `${row.direction === 1 ? 'scrollLeft' : 'scrollRight'} ${row.speed}s linear infinite`,
            marginBottom: row.size * 0.3,
          }}
        >
          {row.words.map((word, j) => (
            <span
              key={j}
              style={{
                fontFamily: "'Afacad Flux', sans-serif",
                fontSize: row.size,
                fontWeight: row.size > 30 ? 600 : 300,
                color: '#4A90D9',
                opacity: row.opacity,
                textTransform: row.size > 30 ? 'uppercase' as const : 'lowercase' as const,
                letterSpacing: row.size > 30 ? '2px' : '0.5px',
                userSelect: 'none',
                lineHeight: 1.1,
                flexShrink: 0,
              }}
            >
              {word}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
