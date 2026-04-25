// Pure text-scramble helpers shared by Hero / GlitchTitle (and any
// future "corrupt the heading" effect). These don't touch GSAP, the
// DOM, or timers — they take a string and return a new string. The
// callers stay responsible for *when* and *how often* to call; this
// module is the deterministic, unit-testable core they all duplicated
// inline before.
//
// `Math.random` is the only nondeterminism inside — stub it in tests
// to assert exact outputs.
//
// Whitespace is always preserved untouched. Every previous call site
// either special-cased `\n` or `" "` or had no whitespace at all, so
// "skip /\s/" is a strict superset that never changes existing
// behavior.

const WHITESPACE = /\s/;

function pickGlitchChar(glitchChars: string): string {
  return glitchChars[Math.floor(Math.random() * glitchChars.length)];
}

/**
 * Probability-based scramble. Each non-whitespace char is independently
 * replaced with a random `glitchChars` member with probability
 * `intensity` (0..1). At `intensity = 0` the input is returned
 * unchanged (cheap path); at `intensity ≥ 1` every non-whitespace
 * char is swapped.
 *
 * Empty `glitchChars` returns the input unchanged — the caller probably
 * misconfigured something, but we don't want to throw inside an
 * animation tick.
 */
export function scrambleText(
  text: string,
  intensity: number,
  glitchChars: string,
): string {
  if (intensity <= 0 || glitchChars.length === 0) return text;
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (WHITESPACE.test(ch) || Math.random() >= intensity) {
      out += ch;
    } else {
      out += pickGlitchChar(glitchChars);
    }
  }
  return out;
}

/**
 * Position-based reveal. Char at index `i` shows its real value once
 * `i / text.length < progress`, otherwise a random glitch char. So:
 *   progress = 0   → fully scrambled (every non-whitespace swapped)
 *   progress = 0.5 → first half real, back half scrambled
 *   progress ≥ 1   → fully revealed (input returned unchanged)
 *
 * Used for left-to-right "decoding" entrance animations. Whitespace
 * is preserved at every position regardless of progress so word
 * boundaries stay legible during the reveal.
 */
export function scrambleReveal(
  text: string,
  progress: number,
  glitchChars: string,
): string {
  if (progress >= 1 || glitchChars.length === 0) return text;
  const len = text.length;
  let out = "";
  for (let i = 0; i < len; i++) {
    const ch = text[i];
    if (WHITESPACE.test(ch) || i / len < progress) {
      out += ch;
    } else {
      out += pickGlitchChar(glitchChars);
    }
  }
  return out;
}
