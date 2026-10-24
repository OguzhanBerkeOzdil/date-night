/** Minimal gold-line SVG icons (24×24) */
const s = (path, extra = "") =>
  `<svg class="icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${extra}${path}</svg>`;

export const icons = {
  play: s('<polygon points="8,5 19,12 8,19" fill="currentColor" stroke="none"/>'),
  lute: s('<path d="M8 21V8l4-4 4 4v13"/><path d="M8 12h8"/>'),
  map: s('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>'),
  horseshoe: s('<path d="M6 14a6 6 0 0112 0v3H6z"/><path d="M9 10V7a3 3 0 016 0v3"/>'),
  carrot: s('<path d="M14 4l-6 14"/><path d="M8 6l2-2 2 2"/><path d="M16 8l2-1 1 2"/>'),
  d20: s('<path d="M12 2l9 6.5v7L12 22 3 15.5v-7z"/>'),
  sword: s('<path d="M4 20l16-16"/><path d="M15 5l4 4"/><path d="M6 18l2 2"/>'),
  shield: s('<path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z"/>'),
  scroll: s('<path d="M6 4h12v16H6z"/><path d="M6 8h12"/><path d="M9 12h6"/>'),
  coin: s('<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9 12h6"/>'),
  cauldron: s('<path d="M4 14h16l-2 6H6z"/><path d="M8 14V9a4 4 0 018 0v5"/>'),
  star: s('<polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="currentColor" stroke="none" opacity=".35"/>'),
  heart: s('<path d="M12 20s-7-4.5-7-10a4 4 0 017-2 4 4 0 017 2c0 5.5-7 10-7 10z" fill="currentColor" stroke="none" opacity=".4"/>'),
};

export function iconFood(type) {
  const paths = {
    pizza: '<path d="M12 2l10 18H2z"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
    sushi: '<ellipse cx="12" cy="14" rx="8" ry="4"/><path d="M4 14c2-4 6-6 8-6s6 2 8 6"/>',
    burger: '<path d="M4 10h16M4 14h16M6 6h12v4H6z"/>',
    pasta: '<path d="M6 18c2-6 4-8 6-8s4 2 6 8"/><path d="M8 8h8"/>',
    taco: '<path d="M5 14c2-6 5-8 7-8s5 2 7 8z"/>',
    brunch: '<path d="M6 16h12M8 8v8M16 8v8"/>',
    street: '<path d="M4 18h16M8 6l4 8 4-8"/>',
    dessert: '<path d="M6 16h12l-2-8H8z"/><path d="M12 8V4"/>',
    surprise: '<rect x="5" y="8" width="14" height="12" rx="2"/><path d="M12 8V5"/>',
  };
  return s(paths[type] || paths.surprise);
}
