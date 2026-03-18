import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const DEFAULT_WORDS = [
  'ideas', 'audience', 'voice', 'impact', 'publish',
  'insight', 'clarity', 'strategy', 'story', 'momentum',
  'resonance', 'authority', 'perspective', 'signal', 'craft',
  'compose', 'refine', 'amplify', 'deliver', 'connect',
];

interface FloatingWord {
  text: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  delay: number;
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

    try {
      const { data: resources } = await supabase
        .from('resources')
        .select('title, content, resource_type')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(5);

      if (resources) {
        const stopWords = ['about', 'their', 'which', 'would', 'could', 'should', 'there', 'these', 'those', 'other', 'after', 'before', 'between', 'through', 'during', 'without'];
        for (const r of resources) {
          const text = (r.title + ' ' + (r.content || '')).toLowerCase();
          const meaningful = text
            .split(/[\s,.\-:;!?()[\]{}'"]+/)
            .filter(w => w.length > 4 && w.length < 15)
            .filter(w => !stopWords.includes(w));
          collected.push(...meaningful.slice(0, 8));
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
          const titleWords = (o.title || '').split(/\s+/).filter((w: string) => w.length > 4);
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
    if (unique.length >= 10) {
      setWords(unique.slice(0, 24));
    } else {
      setWords([...unique, ...DEFAULT_WORDS].slice(0, 24));
    }
  }

  const floatingWords = useMemo<FloatingWord[]>(() => {
    return words.map((_text, _i) => ({
      text: _text,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      size: 13 + Math.random() * 14,
      opacity: 0.06 + Math.random() * 0.12,
      speed: 15 + Math.random() * 25,
      delay: Math.random() * -20,
    }));
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
    }}>
      <style>{`
        @keyframes wordFloat {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-12px) translateX(6px); }
          50% { transform: translateY(-6px) translateX(-8px); }
          75% { transform: translateY(-18px) translateX(4px); }
        }
        @keyframes wordFade {
          0%, 100% { opacity: var(--word-opacity); }
          50% { opacity: calc(var(--word-opacity) * 1.6); }
        }
      `}</style>
      {floatingWords.map((w, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: `${w.x}%`,
            top: `${w.y}%`,
            fontSize: `${w.size}px`,
            fontFamily: "'Afacad Flux', sans-serif",
            fontWeight: 300 + Math.floor(Math.random() * 3) * 100,
            color: '#4A90D9',
            opacity: w.opacity,
            ['--word-opacity' as any]: w.opacity,
            animation: `wordFloat ${w.speed}s ease-in-out infinite, wordFade ${w.speed * 1.3}s ease-in-out infinite`,
            animationDelay: `${w.delay}s`,
            whiteSpace: 'nowrap',
            userSelect: 'none',
            letterSpacing: '0.5px',
            textTransform: 'lowercase',
          }}
        >
          {w.text}
        </span>
      ))}
    </div>
  );
}
