/** Small helpers for motion that CSS alone can't trigger.
 *
 *  CSS animations only run when an element appears. Some content changes in
 *  place instead (switching an inspector tab keeps the same panel), so these
 *  helpers replay a short entrance with the Web Animations API. Timings match
 *  the --dur / --ease tokens in src/index.css. */

const ease = "cubic-bezier(0.2, 0, 0, 1)";

/** True when the person asked their system for less motion. */
export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Fade an element up by a few pixels, as if it settled into place.
 *  Used for content that swaps without remounting. */
export function settle(el: Element | null, distance = 4) {
  if (!el || prefersReducedMotion() || !el.animate) return;
  el.animate(
    [
      { opacity: 0, transform: `translateY(${distance}px)` },
      { opacity: 1, transform: "none" },
    ],
    { duration: 180, easing: ease },
  );
}
