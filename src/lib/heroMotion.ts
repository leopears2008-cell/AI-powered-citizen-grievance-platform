import { useEffect, useLayoutEffect, type RefObject } from 'react';

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

/**
 * Subtle pointer parallax for the cinematic hero.
 *
 * - Writes two CSS custom properties (--px / --py, range -1..1) on the hero card.
 *   Layers translate themselves from those variables in CSS, so React never
 *   re-renders on mouse movement.
 * - Smooths with a lerp inside requestAnimationFrame; the loop only runs while
 *   the value is still settling.
 * - Mouse + fine pointer + >=1024px only. Touch, small screens and
 *   prefers-reduced-motion get no parallax and no listeners doing work.
 * - Pauses CSS animations (via data-in-view) when the hero is off-screen.
 */
export function useHeroParallax(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined' || !window.matchMedia) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const wide = window.matchMedia('(min-width: 1024px)');
    const canRun = () => !reduced.matches && finePointer.matches && wide.matches;

    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    let raf = 0;

    const write = () => {
      el.style.setProperty('--px', curX.toFixed(4));
      el.style.setProperty('--py', curY.toFixed(4));
    };

    const tick = () => {
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;
      if (Math.abs(targetX - curX) < 0.001 && Math.abs(targetY - curY) < 0.001) {
        curX = targetX;
        curY = targetY;
        write();
        raf = 0;
        return;
      }
      write();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !canRun()) return;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      targetX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1);
      targetY = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1);
      start();
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      start();
    };

    const onEnvironmentChange = () => {
      if (canRun()) return;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      targetX = targetY = curX = curY = 0;
      write();
    };

    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave);
    reduced.addEventListener('change', onEnvironmentChange);
    finePointer.addEventListener('change', onEnvironmentChange);
    wide.addEventListener('change', onEnvironmentChange);

    let observer: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => {
        el.dataset.inView = entry.isIntersecting ? 'true' : 'false';
      });
      observer.observe(el);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      reduced.removeEventListener('change', onEnvironmentChange);
      finePointer.removeEventListener('change', onEnvironmentChange);
      wide.removeEventListener('change', onEnvironmentChange);
      observer?.disconnect();
    };
  }, [ref]);
}

/**
 * Lets the existing header sit transparent/glass over the hero and become
 * slightly translucent + blurred once the page scrolls.
 *
 * It only toggles data attributes / one CSS variable; the visual rules live in
 * index.css and are scoped to html[data-hero-on], so every other page keeps the
 * original header untouched. If something (e.g. an announcement banner) renders
 * above the hero, the overlay mode switches itself off so nothing is covered.
 */
export function useHeroHeaderGlass(ref: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || typeof window === 'undefined') return;

    const doc = document.documentElement;
    const header = document.querySelector<HTMLElement>('.site-header');

    const onScroll = () => doc.toggleAttribute('data-hero-glass', window.scrollY <= 24);
    const measure = () => doc.style.setProperty('--site-header-h', `${header?.offsetHeight ?? 0}px`);
    const apply = () => {
      const eligible = !root.previousElementSibling;
      root.toggleAttribute('data-glass', eligible);
      doc.toggleAttribute('data-hero-on', eligible);
      if (eligible) {
        measure();
        onScroll();
      } else {
        doc.removeAttribute('data-hero-glass');
      }
    };

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });

    let resize: ResizeObserver | undefined;
    if (header && 'ResizeObserver' in window) {
      resize = new ResizeObserver(measure);
      resize.observe(header);
    }

    let mutation: MutationObserver | undefined;
    if (root.parentElement && 'MutationObserver' in window) {
      mutation = new MutationObserver(apply);
      mutation.observe(root.parentElement, { childList: true });
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      resize?.disconnect();
      mutation?.disconnect();
      doc.removeAttribute('data-hero-on');
      doc.removeAttribute('data-hero-glass');
      doc.style.removeProperty('--site-header-h');
      root.removeAttribute('data-glass');
    };
  }, [ref]);
}
