"use client";

import {useEffect, useRef, useSyncExternalStore, type CSSProperties, type ReactNode} from 'react';
import {Pause, Sparkles} from 'lucide-react';

type MotionMode = 'on' | 'off' | 'system';
const preference = '(prefers-reduced-motion: reduce)';
function snapshot(): MotionMode {
  if (window.matchMedia(preference).matches) return 'system';
  try { return localStorage.getItem('finn-motion') === 'off' ? 'off' : 'on'; }
  catch { return 'on'; }
}
function subscribe(callback: () => void) {
  const media = window.matchMedia(preference);
  media.addEventListener('change', callback);
  window.addEventListener('storage', callback);
  window.addEventListener('finn-motion-change', callback);
  return () => {
    media.removeEventListener('change', callback);
    window.removeEventListener('storage', callback);
    window.removeEventListener('finn-motion-change', callback);
  };
}
const serverSnapshot = (): MotionMode => 'on';

export function MotionToggle() {
  const mode = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  useEffect(() => { document.documentElement.dataset.finnMotion = mode === 'on' ? 'on' : 'off'; }, [mode]);
  function toggle() {
    try { localStorage.setItem('finn-motion', mode === 'on' ? 'off' : 'on'); } catch { /* Device storage can be unavailable. */ }
    window.dispatchEvent(new Event('finn-motion-change'));
  }
  return <button className="motion-toggle" aria-label={mode === 'system' ? 'System reduced motion is enabled' : `${mode === 'on' ? 'Pause' : 'Enable'} animations`} aria-pressed={mode === 'on'} disabled={mode === 'system'} onClick={toggle} title={mode === 'system' ? 'Respects your system reduced-motion preference' : 'Animation preference'}>
    {mode === 'on' ? <Sparkles size={15} aria-hidden="true"/> : <Pause size={15} aria-hidden="true"/>}
    <span>{mode === 'system' ? 'Reduced motion' : `Motion ${mode}`}</span>
  </button>;
}

export function Reveal({children, className = '', delay = 0}: {children: ReactNode; className?: string; delay?: number}) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = element.current;
    if (!node || !('IntersectionObserver' in window) || snapshot() !== 'on') return;
    node.dataset.revealReady = 'true';
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        node.dataset.visible = 'true';
        observer.disconnect();
      }
    }, {threshold: 0.08});
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={element} className={`editorial-reveal ${className}`} style={{'--reveal-delay': `${delay}ms`} as CSSProperties}>{children}</div>;
}

export function Count({value}: {value: number}) {
  const element = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = element.current;
    if (!node || snapshot() !== 'on') return;
    let frame = 0;
    const start = performance.now();
    function tick(time: number) {
      if (!node) return;
      const progress = Math.min((time - start) / 850, 1);
      node.textContent = String(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span ref={element}>{value}</span>;
}
