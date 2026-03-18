import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const DEFAULT_WORDS = [
  'ideas', 'audience', 'voice', 'impact', 'publish',
  'insight', 'clarity', 'strategy', 'story', 'momentum',
  'resonance', 'authority', 'perspective', 'signal', 'craft',
  'compose', 'refine', 'amplify', 'deliver', 'connect',
  'thinking', 'intelligence', 'content', 'production', 'channel',
  'coaching', 'leadership', 'framework', 'methodology', 'brand',
  'authentic', 'expertise', 'platform', 'newsletter', 'keynote',
  'podcast', 'essay', 'social', 'audience', 'growth',
];

const BRAND_COLORS = [
  '#4A90D9',
  '#1B263B',
  '#F5C642',
  '#E8B4A0',
  '#64748B',
  '#4A90D9',
  '#0D1B2A',
  '#4A90D9',
];

interface CloudWord {
  text: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
  weight: number;
  rotation: number;
  animDuration: number;
  animDelay: number;
}

export default function LivingWordCloud() {
  const { user } = useAuth();
  const [words, setWords] = useState<string[]>(DEFAULT_WORDS);

  useEffect(() => {
    if (!user) return;
    loadUserWords();
  }, [user]);

  async function loadUserWords() {
    if (!user) return;
    const collected: string[] = [];
    const stopWords = ['about','their','which','would','could','should','there','these','those','other','after','before','between','through','during','without','that','this','with','from','have','been','were','they','what','when','into','more','than','each','also','does','your','will','just','some','very','most'];

    try {
      const { data: resources } = await supabase
        .from('resources')
        .select('title, content, resource_type')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(5);

      if (resources) {
        for (const r of resources) {
          const text = (r.title + ' ' + (r.content || '')).toLowerCase();
          const meaningful = text
            .split(/[\s,.\-:;!?()[\]{}'"\/|]+/)
            .filter(w => w.length > 3 && w.length < 14)
            .filter(w => !stopWords.includes(w));
          collected.push(...meaningful.slice(0, 12));
        }
      }
    } catch (e) { /* silent */ }

    try {
      const { data: outputs } = await supabase
        .from('outputs')
        .select('title')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (outputs) {
        for (const o of outputs) {
          const titleWords = (o.title || '').split(/\s+/).filter((w: string) => w.length > 3);
          collected.push(...titleWords.slice(0, 3));
        }
      }
    } catch (e) { /* silent */ }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('sentinel_topics')
        .eq('id', user.id)
        .single();

      if (profile?.sentinel_topics && Array.isArray(profile.sentinel_topics)) {
        collected.push(...profile.sentinel_topics);
      }
    } catch (e) { /* silent */ }

    const unique = [...new Set(collected.map(w => w.toLowerCase()))];
    if (unique.length >= 15) {
      setWords(unique.slice(0, 40));
    } else {
      setWords([...unique, ...DEFAULT_WORDS].slice(0, 40));
    }
  }

  const cloudWords = useMemo<CloudWord[]>(() => {
    const result: CloudWord[] = [];
    const count = Math.min(words.length, 40);

    for (let i = 0; i < count; i++) {
      const importance = 1 - (i / count);
      const size = importance > 0.85 ? 38 + Math.random() * 16
                 : importance > 0.6  ? 24 + Math.random() * 12
                 : importance > 0.3  ? 16 + Math.random() * 8
                 :                     11 + Math.random() * 6;

      const weight = size > 30 ? 700 : size > 20 ? 600 : 400;
      const opacity = size > 30 ? 0.18 + Math.random() * 0.1
                    : size > 20 ? 0.12 + Math.random() * 0.08
                    :             0.07 + Math.random() * 0.06;

      const angle = (i / count) * Math.PI * 2 * 3.7;
      const radius = 8 + (i / count) * 38;
      const x = 50 + Math.cos(angle) * radius + (Math.random() - 0.5) * 12;
      const y = 50 + Math.sin(angle) * radius * 0.6 + (Math.random() - 0.5) * 10;

      const rotation = Math.random() > 0.8 ? (Math.random() > 0.5 ? 90 : -90) :
                        Math.random() > 0.85 ? Math.round((Math.random() - 0.5) * 20) : 0;

      result.push({
        text: words[i],
        x: Math.max(5, Math.min(95, x)),
        y: Math.max(5, Math.min(95, y)),
        size,
        opacity,
        color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
        weight,
        rotation,
        animDuration: 20 + Math.random() * 30,
        animDelay: Math.random() * -20,
      });
    }
    return result;
  }, [words]);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 0,
      padding: 0,
      margin: 0,
    }}>
      <style>{`
        @keyframes cloudDrift {
          0%, 100% { transform: translate(0, 0) rotate(var(--rot)); }
          33% { transform: translate(4px, -6px) rotate(var(--rot)); }
          66% { transform: translate(-3px, 4px) rotate(var(--rot)); }
        }
        @keyframes cloudPulse {
          0%, 100% { opacity: var(--base-opacity); }
          50% { opacity: calc(var(--base-opacity) * 1.4); }
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
            color: w.color,
            opacity: w.opacity,
            transform: `rotate(${w.rotation}deg)`,
            ['--rot' as any]: `${w.rotation}deg`,
            ['--base-opacity' as any]: w.opacity,
            animation: `cloudDrift ${w.animDuration}s ease-in-out infinite, cloudPulse ${w.animDuration * 1.2}s ease-in-out infinite`,
            animationDelay: `${w.animDelay}s`,
            whiteSpace: 'nowrap',
            userSelect: 'none',
            lineHeight: 1,
            textTransform: w.size > 28 ? 'uppercase' as const : 'lowercase' as const,
            letterSpacing: w.size > 28 ? '1px' : '0.3px',
          }}
        >
          {w.text}
        </span>
      ))}
    </div>
  );
}
