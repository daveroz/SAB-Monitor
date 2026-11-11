import React, { useEffect, useRef } from 'react';

/**
 * The light show behind the menu on top, as on Deco Launcher's Home: a wall of small square lamps
 * from margin to margin, in the app's amber, like the LED panels on a stage. The lamps stand in
 * strips three wide with a dark column between them, split into an upper and a lower panel, and
 * each panel runs its own pattern for a couple of seconds before switching: filling down or up, a
 * band running down it, a flickering pixel pattern, a flash that fades, all on, or dark.
 *
 * Dark lamps keep a faint ember, so the panels still read. Each lit lamp is sharp, white-hot at
 * full strength, with a soft round glow, and lit panels throw soft beams down into the haze over
 * the map. Purely decorative: it holds one still frame for people who ask for less motion, and it
 * stops while the app is in the background.
 */

const STRIP = 3;
const LAMP = 0.7;
const PITCH = 10; // target distance from one lamp to the next, in CSS pixels
const PATTERN_SECONDS = 2.2;
const SWITCH_SECONDS = 0.12;
const OFF = 0, FILL_DOWN = 1, FILL_UP = 2, CHASE = 3, PIXELS = 4, FLASH = 5, FULL = 6;
const PATTERN_WEIGHTS = [4, 3, 2, 3, 4, 2, 2]; // how often each comes up, out of 20
const SOFT = 1 / 8;
const FRAME_MS = 33;
/** How far below the menu the beams and glows may fall. */
export const LIGHT_SHOW_SPILL = 130;
/** Behind the controls the lamps are a little dimmer, so the menu stays easy to read. */
const STRENGTH = 0.8;

const KEY: [number, number, number] = [235, 148, 56];
const LED: [number, number, number] = [253, 242, 231];

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

/** A fixed pseudo-random number, so the patterns never repeat in step. */
const seed = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Which pattern a panel plays on a given turn: picked by chance, the same every time. */
const pattern = (panel: number, turn: number) => {
  let pick = seed(panel * 131 + turn * 17) * 20;
  for (let i = 0; i < PATTERN_WEIGHTS.length; i++) {
    pick -= PATTERN_WEIGHTS[i];
    if (pick < 0) return i;
  }
  return OFF;
};

/** A soft round glow in the key colour: full in the middle, fading to nothing at the edge. */
const glowSprite = () => {
  const size = 32;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const img = g.createImageData(size, size);
  const r = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - r, y + 0.5 - r) / r;
      const a = d >= 1 ? 0 : (1 - d) * (1 - d);
      const i = (y * size + x) * 4;
      img.data[i] = KEY[0];
      img.data[i + 1] = KEY[1];
      img.data[i + 2] = KEY[2];
      img.data[i + 3] = Math.round(a * 255);
    }
  }
  g.putImageData(img, 0, 0);
  return c;
};

/** A beam's shape: narrow and strong at the top, wider and fading to nothing at the bottom. */
const beamSprite = () => {
  const w = 32, h = 96;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1);
    const half = 0.3 + 0.7 * t;
    for (let x = 0; x < w; x++) {
      const across = Math.abs(((x + 0.5) / w) * 2 - 1) / half;
      const a = across >= 1 ? 0 : Math.pow(1 - t, 1.4) * (1 - across * across);
      const i = (y * w + x) * 4;
      img.data[i] = KEY[0];
      img.data[i + 1] = KEY[1];
      img.data[i + 2] = KEY[2];
      img.data[i + 3] = Math.round(a * 255);
    }
  }
  g.putImageData(img, 0, 0);
  return c;
};

export const LightShow: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const glow = glowSprite();
    const beam = beamSprite();
    const soft = document.createElement('canvas');
    const softCtx = soft.getContext('2d')!;
    const ember = rgba(mix(KEY, [0, 0, 0], 0.35), 0.1);

    let width = 0, wallHeight = 0, rows = 0, panelRows = 0, columns = 0, strips = 0;
    let left = 0, top = 0, pitch = 0, cell = 0, dpr = 1;
    let values = new Float32Array(0);
    let panelLight = new Float32Array(0);
    let time = still ? 3.7 : 0;
    let last = 0;
    let frame = 0;

    const gap = (c: number) => c % (STRIP + 1) === 0;

    const layout = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = host.clientWidth;
      wallHeight = host.clientHeight;
      const height = wallHeight + LIGHT_SHOW_SPILL;
      canvas.style.height = `${height}px`;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      soft.width = Math.max(1, Math.ceil(width * SOFT));
      soft.height = Math.max(1, Math.ceil(height * SOFT));
      // An even number of rows, so the wall splits into an upper and a lower panel.
      const inner = Math.max(0, wallHeight - 6);
      panelRows = Math.max(2, Math.floor(inner / PITCH / 2));
      rows = panelRows * 2;
      pitch = inner / rows;
      cell = pitch * LAMP;
      const margin = width < 640 ? 10 : 16;
      columns = Math.max(0, Math.floor((width - 2 * margin) / pitch));
      strips = columns <= 1 ? 0 : Math.floor((columns - 2) / (STRIP + 1)) + 1;
      left = (width - columns * pitch) / 2;
      top = 3;
      values = new Float32Array(rows * columns);
      panelLight = new Float32Array(strips * 2);
    };

    /** Lit lamps shimmer a little, each in its own time. */
    const flicker = (row: number, column: number, panel: number) => {
      const s = seed(panel * 37 + row * 5 + column);
      return 0.82 + 0.18 * Math.sin(time * (9 + s * 6) + s * 30);
    };

    /** One lamp's strength in a pattern, `local` seconds into it; row and column within the panel. */
    const lamp = (p: number, local: number, row: number, column: number, panel: number, turn: number) => {
      const progress = Math.min(1, local / (PATTERN_SECONDS * 0.6));
      const eased = progress * progress * (3 - 2 * progress);
      switch (p) {
        case FILL_DOWN:
          return row < eased * (panelRows + 0.99) ? flicker(row, column, panel) : 0;
        case FILL_UP:
          return panelRows - 1 - row < eased * (panelRows + 0.99) ? flicker(row, column, panel) : 0;
        case CHASE: {
          const head = ((local * 4) % (panelRows + 2)) - 1;
          const d = Math.abs(row - head);
          return d < 1.5 ? 1 - d / 1.5 : 0;
        }
        case PIXELS: {
          const f = Math.floor(local / 0.18);
          return seed(panel * 59 + turn * 211 + f * 31 + row * 7 + column) > 0.5 ? 0.9 : 0;
        }
        case FLASH:
          return Math.exp(-local * 2.5);
        case FULL:
          return flicker(row, column, panel);
        default:
          return 0;
      }
    };

    /** Works out every lamp's strength for now, panel by panel, easing from one pattern to the next. */
    const light = () => {
      for (let s = 0; s < strips; s++) {
        for (let p = 0; p < 2; p++) {
          const panel = s * 2 + p;
          const clock = time / PATTERN_SECONDS + seed(panel * 7 + 3) * 3;
          const turn = Math.floor(clock);
          const local = (clock - turn) * PATTERN_SECONDS;
          const now = pattern(panel, turn), before = pattern(panel, turn - 1);
          const blend = Math.min(1, local / SWITCH_SECONDS);
          let sum = 0, count = 0;
          for (let r = 0; r < panelRows; r++) {
            for (let k = 0; k < STRIP; k++) {
              const c = s * (STRIP + 1) + 1 + k;
              if (c >= columns) continue;
              let v = lamp(now, local, r, k, panel, turn);
              if (blend < 1) {
                const old = lamp(before, local + PATTERN_SECONDS, r, k, panel, turn - 1);
                v = old + (v - old) * blend;
              }
              v *= STRENGTH;
              values[(p * panelRows + r) * columns + c] = v;
              sum += v;
              count++;
            }
          }
          panelLight[panel] = count ? sum / count : 0;
        }
      }
    };

    const draw = () => {
      light();
      const g = (pitch - cell) / 2;

      // The glows and beams, on a small layer that's stretched over the wall, like light in fog.
      softCtx.setTransform(1, 0, 0, 1, 0, 0);
      softCtx.clearRect(0, 0, soft.width, soft.height);
      softCtx.setTransform(SOFT, 0, 0, SOFT, 0, 0);
      softCtx.globalCompositeOperation = 'lighter';
      for (let s = 0; s < strips; s++) {
        for (let p = 0; p < 2; p++) {
          const b = panelLight[s * 2 + p];
          if (b < 0.15) continue;
          const first = s * (STRIP + 1) + 1;
          const w = Math.min(STRIP, columns - first);
          if (w <= 0) continue;
          const x = left + (first + w / 2) * pitch;
          const y = top + (p + 1) * panelRows * pitch - g;
          const bw = w * pitch * 2.4;
          softCtx.save();
          softCtx.translate(x, y);
          softCtx.rotate((12 * Math.PI) / 180);
          softCtx.globalAlpha = Math.min(1, 0.4 * b);
          softCtx.drawImage(beam, -bw / 2, 0, bw, LIGHT_SHOW_SPILL + 10);
          softCtx.restore();
        }
      }
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
          const v = values[r * columns + c];
          if (v < 0.08) continue;
          const x = left + c * pitch + g, y = top + r * pitch + g;
          softCtx.globalAlpha = v * 0.5;
          softCtx.drawImage(glow, x - 1.6 * cell, y - 1.6 * cell, 4.2 * cell, 4.2 * cell);
        }
      }
      softCtx.globalAlpha = 1;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(soft, 0, 0, canvas.width, canvas.height);

      // The lamps: a faint ember when dark, white-hot at full strength.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
          if (gap(c)) continue; // the dark column between strips
          const v = values[r * columns + c];
          ctx.fillStyle = v < 0.02 ? ember : rgba(mix(KEY, LED, 0.5 * v * v), 0.06 + 0.84 * v);
          const x = left + c * pitch + g, y = top + r * pitch + g;
          ctx.fillRect(x, y, cell, cell);
        }
      }
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - last < FRAME_MS) return;
      const dt = last === 0 ? 0 : Math.min(0.1, (now - last) / 1000);
      last = now;
      time += dt;
      draw();
    };

    layout();
    draw();
    const resize = new ResizeObserver(() => {
      layout();
      draw();
    });
    resize.observe(host);
    if (!still) frame = requestAnimationFrame(tick);
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      last = 0;
      if (!document.hidden && !still) frame = requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="sab-lightshow" aria-hidden="true" />;
};
