// Only the backend's versioned, allowlisted theme schema is accepted here.
// Keeping this mapping explicit also prevents CSS or URL payloads from reaching styles.
const colorMap = {
  primary: '--color-primary', secondary: '--color-secondary', accent: '--color-accent',
  background: '--color-bg', surface: '--color-surface', text: '--color-text',
  mutedText: '--color-text-secondary', border: '--color-border',
};
const rgbMap = {
  primary: '--color-primary-rgb', secondary: '--color-secondary-rgb', accent: '--color-accent-rgb',
  background: '--color-bg-rgb', surface: '--color-surface-rgb', text: '--color-text-rgb',
  border: '--color-border-rgb',
};
const allowedFonts = {
  arabicFont: ['Cairo', 'Tajawal', 'Noto Sans Arabic', 'Almarai', 'Changa', 'IBM Plex Sans Arabic', 'Rubik', 'Aref Ruqaa', 'Aref Ruqaa Ink', 'Noto Kufi Arabic', 'El Messiri'],
  englishFont: ['Inter', 'Arial', 'Roboto', 'Poppins', 'Montserrat', 'Outfit', 'Plus Jakarta Sans'],
};
const ensureFont = (family) => {
  if (!family || family === 'Arial' || !Object.values(allowedFonts).some((fonts) => fonts.includes(family))) return;
  const id = `ad-theme-font-${family.replaceAll(' ', '-').toLowerCase()}`;
  if (document.getElementById(id)) return;
  const weights = ({ Tajawal: '400;500;700;800', Almarai: '400;700;800', 'IBM Plex Sans Arabic': '400;500;600;700', 'Aref Ruqaa': '400;700', 'Aref Ruqaa Ink': '400;700', 'El Messiri': '400..700', 'Noto Sans Arabic': '100..900', 'Noto Kufi Arabic': '100..900' })[family] || '400;500;600;700;800';
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${family.replaceAll(' ', '+')}:wght@${weights}&display=swap`;
  document.head.appendChild(link);
};
const colorPattern = /^#[0-9A-Fa-f]{6}$/;
const toRgb = (hex) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)).join(' ');
const contrastLight = (hex) => {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722 > 0.18;
};

export const getThemeChrome = (configuration, section, mode = 'light') =>
  configuration?.chrome?.modes?.[mode]?.[section] || configuration?.chrome?.[section] || null;

export const platformThemeStyles = (configuration, mode = 'light') => {
  const appearance = configuration?.schemaVersion === 2
    ? configuration.modes?.[mode] : configuration;
  if (!appearance || ![1, 2].includes(configuration?.schemaVersion) || !appearance.colors) return {};
  const styles = {};
  for (const [key, property] of Object.entries(colorMap)) {
    const value = appearance.colors[key];
    if (!colorPattern.test(value || '')) return {};
    styles[property] = value;
    if (rgbMap[key]) styles[rgbMap[key]] = toRgb(value);
  }
  for (const [key, layout] of Object.entries({ header: getThemeChrome(configuration, 'header', mode), 'bottom-nav': getThemeChrome(configuration, 'bottomNav', mode) })) {
    if (!layout || !/^#[0-9A-Fa-f]{6}$/.test(layout.background || '')
      || !/^#[0-9A-Fa-f]{6}$/.test(layout.foreground || '')
      || !/^#[0-9A-Fa-f]{6}$/.test(layout.accent || '')
      || !Number.isInteger(layout.height) || layout.height < 48 || layout.height > 120
      || !Number.isInteger(layout.width) || layout.width < 60 || layout.width > 100) continue;
    const prefix = key === 'bottom-nav' ? '--platform-bottom-nav' : '--platform-header';
    styles[prefix + '-height'] = layout.height + 'px';
    styles[prefix + '-width'] = layout.width + 'vw';
    styles[prefix + '-background'] = layout.background;
    styles[prefix + '-foreground'] = layout.foreground;
    styles[prefix + '-accent'] = layout.accent;
    styles[prefix + '-radius'] = layout.radius + 'px';
  }
  styles['--color-card'] = appearance.colors.surface;
  styles['--color-card-rgb'] = toRgb(appearance.colors.surface);
  styles['--color-muted'] = appearance.colors.mutedText;
  styles['--color-primary-soft'] = appearance.colors.primary;
  styles['--color-primary-hover'] = appearance.colors.primary;
  styles['--color-button-text'] = contrastLight(appearance.colors.primary) ? '#111827' : '#FFFFFF';
  const grid = configuration.layout || {};
  styles['--ad-products-desktop'] = [2,3,4,5,6].includes(grid.productsPerRow) ? grid.productsPerRow : 4;
  styles['--ad-categories-desktop'] = [2,3].includes(grid.categoriesPerRow) ? grid.categoriesPerRow : 3;
  styles['--ad-products-mobile'] = [1,2,3].includes(grid.productsPerRowMobile) ? grid.productsPerRowMobile : 2;
  styles['--ad-categories-mobile'] = [1,2,3].includes(grid.categoriesPerRowMobile) ? grid.categoriesPerRowMobile : 2;
  if (allowedFonts.arabicFont.includes(appearance.typography?.arabicFont)) {
    styles['--platform-font-ar'] = `"${appearance.typography.arabicFont}", sans-serif`;
  }
  if (allowedFonts.englishFont.includes(appearance.typography?.englishFont)) {
    styles['--platform-font-en'] = `"${appearance.typography.englishFont}", sans-serif`;
  }
  if ([14, 16, 18, 20].includes(appearance.typography?.baseSize)) {
    styles['--platform-base-font-size'] = `${appearance.typography.baseSize}px`;
  }
  if ([600, 700, 800, 900].includes(appearance.typography?.headingWeight)) {
    styles['--platform-heading-weight'] = String(appearance.typography.headingWeight);
  }
  if ([0, 4, 8, 12, 24].includes(appearance.buttons?.radius)) {
    styles['--radius-sm'] = `${appearance.buttons.radius}px`;
    styles['--radius-md'] = `${appearance.buttons.radius}px`;
  }
  if ([0, 4, 8, 12, 16, 24].includes(appearance.cards?.radius)) {
    styles['--radius-lg'] = `${appearance.cards.radius}px`;
    styles['--radius-xl'] = `${appearance.cards.radius}px`;
  }
  const neon = appearance.neon || {};
  for (const section of ['purchase', 'hero', 'categories', 'bestSellers', 'sidebar']) {
    const effect = neon[section];
    if (effect?.enabled === true && colorPattern.test(effect.color || '') && [3, 5, 8, 12].includes(effect.speed)) {
      styles[`--platform-neon-${section}-color`] = effect.color;
      styles[`--platform-neon-${section}-speed`] = `${effect.speed}s`;
    }
  }  const shadows = {
    none: 'none',
    subtle: '0 12px 30px -18px rgba(15, 23, 42, 0.28)',
    medium: '0 22px 48px -20px rgba(15, 23, 42, 0.38)',
  };
  if (Object.hasOwn(shadows, appearance.cards?.shadow)) {
    styles['--shadow-subtle'] = shadows[appearance.cards.shadow];
    styles['--shadow-medium'] = shadows[appearance.cards.shadow];
  }
  return styles;
};

let appliedProperties = [];
export const isSafeThemeMediaPath = (value) => typeof value === 'string'
  && /^\/uploads\/themes\/[0-9]+-[0-9a-f]{16}\.(?:jpe?g|png|webp)$/i.test(value);

export const applyPublishedPlatformTheme = (configuration, mode = 'light') => {
  const root = document.documentElement;
  appliedProperties.forEach((property) => root.style.removeProperty(property));
  appliedProperties = [];
  root.classList.remove('platform-theme-active', 'platform-theme-compact', 'platform-theme-outline-button');
  delete root.dataset.platformHeader;
  delete root.dataset.platformBottomNav;
  delete root.dataset.platformSidebar;
  const appearance = configuration?.schemaVersion === 2 ? configuration.modes?.[mode] : configuration;
  const styles = platformThemeStyles(configuration, mode);
  if (!Object.keys(styles).length) return;
  ensureFont(appearance?.typography?.arabicFont);
  ensureFont(appearance?.typography?.englishFont);
  Object.entries(styles).forEach(([property, value]) => root.style.setProperty(property, value));
  appliedProperties = Object.keys(styles);
  root.classList.add('platform-theme-active');
  const header = getThemeChrome(configuration, 'header', mode);
  const bottomNav = getThemeChrome(configuration, 'bottomNav', mode);
  root.dataset.platformHeader = ['bar', 'floating'].includes(header?.template) ? header.template : 'bar';
  root.dataset.platformBottomNav = ['bar', 'floating', 'pill'].includes(bottomNav?.template) ? bottomNav.template : 'bar';
  const sidebar = configuration?.brand?.sidebarTemplate;
  root.dataset.platformSidebar = ['default', 'royal', 'glass', 'aurora', 'square', 'rounded'].includes(sidebar) ? sidebar : 'default';
  const metrics = configuration?.brand?.sidebarMetrics;
  if (Number.isInteger(metrics?.radius) && metrics.radius >= 0 && metrics.radius <= 48) {
    root.style.setProperty('--platform-sidebar-radius', `${metrics.radius}px`);
    appliedProperties.push('--platform-sidebar-radius');
  }
  if (appearance?.navigation?.style === 'compact') root.classList.add('platform-theme-compact');
  if (appearance?.buttons?.style === 'outline') root.classList.add('platform-theme-outline-button');
};
