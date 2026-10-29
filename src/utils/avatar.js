import { resolveImageUrl } from './imageUrl';

const AVATAR_PALETTES = [
  ['#087f9b', '#42d7e9', '#b37a18'],
  ['#087f9b', '#312e81', '#b37a18'],
  ['#087f9b', '#087f9b', '#42d7e9'],
  ['#f59e0b', '#ef4444', '#b37a18'],
  ['#22c55e', '#087f9b', '#087f9b'],
  ['#b37a18', '#b37a18', '#42d7e9'],
];

const AVATAR_CACHE_LIMIT = 180;
const avatarUrlCache = new Map();

const getCachedAvatar = (key, factory) => {
  if (avatarUrlCache.has(key)) return avatarUrlCache.get(key);

  const value = factory();
  avatarUrlCache.set(key, value);

  if (avatarUrlCache.size > AVATAR_CACHE_LIMIT) {
    const firstKey = avatarUrlCache.keys().next().value;
    avatarUrlCache.delete(firstKey);
  }

  return value;
};

const isUiAvatarUrl = (value) => /\/\/ui-avatars\.com\//i.test(String(value || ''));
const isLegacyAvatarUrl = (value) => /\/\/i\.pravatar\.cc\//i.test(String(value || ''));

const safeDecodeUri = (value) => {
  try {
    return decodeURIComponent(String(value || ''));
  } catch {
    return String(value || '');
  }
};

const isLegacyGeneratedAvatarUrl = (value) => {
  const text = safeDecodeUri(value);
  return text.includes('data:image/svg+xml')
    && text.includes('<text x="128" y="216"')
    && text.includes('font-size="34"');
};

const isGeneratedSvgAvatarUrl = (value) => {
  const text = safeDecodeUri(value);
  return text.includes('data:image/svg+xml')
    && text.includes('<svg')
    && text.includes('viewBox="0 0 256 256"');
};

const hashString = (value) => {
  const text = String(value || 'Lool Store');
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const getInitials = (value) => {
  const parts = String(value || 'Lool Store User')
    .replace(/[^\p{L}\p{N}\s._-]/gu, ' ')
    .split(/[\s._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return 'OU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};

const getAvatarBackgroundMarkup = (hash, palette, variant = 'anime') => {
  const pattern = hash % 6;
  const accent = palette[2] || '#b37a18';
  const soft = palette[0] || '#087f9b';

  const shared = `
    <rect width="256" height="256" rx="68" fill="url(#bg)"/>
    <rect width="256" height="256" rx="68" fill="url(#shine)"/>
  `;

  const patterns = [
    `${shared}
     <path d="M-18 70c41-34 84-37 130-7s91 26 161-22v76c-54 35-101 38-144 10S47 95-18 143z" fill="#ffffff" opacity="0.13"/>
     <path d="M-20 199c51-30 93-29 127 2s82 36 169-24v91H-20z" fill="${accent}" opacity="0.18"/>`,
    `${shared}
     <path d="M-12 194C43 146 81 136 131 162s82 15 139-42v154H-12z" fill="#ffffff" opacity="0.12"/>
     <path d="M-10 76c55 20 101 17 139-8s79-27 136-3" fill="none" stroke="#ffffff" stroke-width="10" opacity="0.12"/>`,
    `${shared}
     <circle cx="48" cy="54" r="19" fill="#ffffff" opacity="0.14"/>
     <circle cx="202" cy="64" r="9" fill="${accent}" opacity="0.42"/>
     <circle cx="218" cy="204" r="28" fill="#ffffff" opacity="0.1"/>
     <circle cx="38" cy="198" r="8" fill="${accent}" opacity="0.48"/>`,
    `${shared}
     <path d="M31 28h46v46H31zM178 29h49v49h-49zM34 181h51v51H34zM174 176h54v54h-54z" fill="#ffffff" opacity="0.08"/>
     <path d="M53 51h154v154H53z" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.1"/>`,
    `${shared}
     <path d="M23 220L223 20M-3 154L154-3M102 259L259 102" stroke="#ffffff" stroke-width="9" opacity="0.1" stroke-linecap="round"/>
     <path d="M36 206L206 36" stroke="${accent}" stroke-width="4" opacity="0.28" stroke-linecap="round"/>`,
    `${shared}
     <path d="M73 37l7 14 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2 7-14z" fill="#ffffff" opacity="0.25"/>
     <path d="M194 166l6 12 13 2-10 9 3 13-12-6-12 6 3-13-10-9 13-2 6-12z" fill="${accent}" opacity="0.42"/>
     <circle cx="42" cy="213" r="42" fill="${soft}" opacity="0.16"/>`,
  ];

  if (variant === 'gulf-admin') {
    return `${shared}
      <path d="M-15 203c46-42 88-49 125-21s75 19 161-50v139H-15z" fill="#ffffff" opacity="0.11"/>
      <path d="M-18 73c48-26 90-24 126 5s77 31 166-21" fill="none" stroke="#ffffff" stroke-width="8" opacity="0.1" stroke-linecap="round"/>
      <path d="M31 29h194v194H31z" fill="none" stroke="url(#gold)" stroke-width="3.5" opacity="0.26"/>
      <path d="M194 42l6 12 13 2-10 10 2 13-11-6-12 6 3-13-10-10 13-2 6-12z" fill="#ffffff" opacity="0.26"/>`;
  }

  return patterns[pattern];
};

const getGulfAdminAvatarUrl = (identity = 'Platform Admin') => {
  const seed = String(identity || 'Platform Admin').trim() || 'Platform Admin';
  const cacheKey = `gulf-admin:${seed}`;

  return getCachedAvatar(cacheKey, () => {
  const hash = hashString(seed);
  const palette = AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
  const skinPalette = ['#f3c7a4', '#e8b384', '#d99a66', '#c9875f'];
  const skinColor = skinPalette[(hash >> 3) % skinPalette.length];
  const eyeColor = ['#312e81', '#087f9b', '#5b3a1d'][(hash >> 5) % 3];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="Platform Admin">
      <defs>
        <linearGradient id="bg" x1="28" y1="18" x2="224" y2="238" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="${palette[0]}"/>
          <stop offset="0.52" stop-color="${palette[1]}"/>
          <stop offset="1" stop-color="${palette[2]}"/>
        </linearGradient>
        <radialGradient id="shine" cx="35%" cy="20%" r="65%">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.56"/>
          <stop offset="0.34" stop-color="#ffffff" stop-opacity="0.16"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#020617" flood-opacity="0.3"/>
        </filter>
        <linearGradient id="gold" x1="78" y1="41" x2="178" y2="198" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#fff2b8"/>
          <stop offset="0.48" stop-color="#b37a18"/>
          <stop offset="1" stop-color="#8a5b12"/>
        </linearGradient>
      </defs>
      ${getAvatarBackgroundMarkup(hash, palette, 'gulf-admin')}
      <path d="M55 207c13-44 40-68 73-68s60 24 73 68" fill="#111827" opacity="0.32" filter="url(#softShadow)"/>
      <path d="M68 202c11-37 33-58 60-58s49 21 60 58" fill="#f8fbff" opacity="0.96"/>
      <path d="M82 192c9-26 26-39 46-39s37 13 46 39" fill="#312e81" opacity="0.93"/>
      <path d="M71 72c10-29 31-48 57-48s47 19 57 48c-14-8-33-12-57-12s-43 4-57 12z" fill="#ffffff" filter="url(#softShadow)"/>
      <path d="M63 70c-12 30-11 66 2 103 13-22 20-50 21-87z" fill="#f8fafc" filter="url(#softShadow)"/>
      <path d="M193 70c12 30 11 66-2 103-13-22-20-50-21-87z" fill="#f8fafc" filter="url(#softShadow)"/>
      <path d="M75 84c9-34 28-54 53-54s44 20 53 54c-16-9-34-14-53-14s-37 5-53 14z" fill="#ffffff"/>
      <path d="M76 102c0-35 23-59 52-59s52 24 52 59c0 41-22 68-52 68s-52-27-52-68z" fill="${skinColor}" filter="url(#softShadow)"/>
      <path d="M78 77c15-13 32-20 50-20s35 7 50 20c-12-4-28-7-50-7s-38 3-50 7z" fill="#161827" opacity="0.12"/>
      <ellipse cx="128" cy="63" rx="66" ry="17" fill="none" stroke="#111827" stroke-width="9"/>
      <ellipse cx="128" cy="58" rx="62" ry="14" fill="none" stroke="#050816" stroke-width="5" opacity="0.96"/>
      <path d="M66 69c17-8 38-12 62-12s45 4 62 12" fill="none" stroke="url(#gold)" stroke-width="3.5" stroke-linecap="round" opacity="0.7"/>
      <circle cx="104" cy="112" r="12" fill="#ffffff"/>
      <circle cx="154" cy="112" r="12" fill="#ffffff"/>
      <circle cx="105" cy="113" r="6.5" fill="${eyeColor}"/>
      <circle cx="155" cy="113" r="6.5" fill="${eyeColor}"/>
      <circle cx="102" cy="109" r="2.7" fill="#ffffff"/>
      <circle cx="152" cy="109" r="2.7" fill="#ffffff"/>
      <path d="M116 137c8 7 17 7 25 0" fill="none" stroke="#7f3f35" stroke-width="5" stroke-linecap="round"/>
      <path d="M99 132c18 16 40 16 58 0" fill="none" stroke="#5b3328" stroke-width="4" stroke-linecap="round" opacity="0.28"/>
      <ellipse cx="84" cy="130" rx="12" ry="6" fill="#b37a18" opacity="0.16"/>
      <ellipse cx="172" cy="130" rx="12" ry="6" fill="#b37a18" opacity="0.16"/>
      <path d="M190 53l7 14 15 2-11 11 3 15-14-7-14 7 3-15-11-11 15-2 7-14z" fill="#ffffff" opacity="0.36"/>
      <path d="M65 171l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2 5-10z" fill="#ffffff" opacity="0.28"/>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  });
};

const isAdminIdentity = (source, identity = '') => {
  if (source && typeof source === 'object') {
    const role = String(source.role || '').toLowerCase();
    if (role === 'admin' || role === 'super_admin' || role === 'platform_admin') return true;
  }

  const text = String(identity || '').toLowerCase();
  return text.includes('platform admin') || text.includes('مدير المنصة') || text.includes('مدير المنصه');
};

export const getDefaultAvatarUrl = (identity = 'Lool Store User', options = {}) => {
  if (options.variant === 'gulf-admin') {
    return getGulfAdminAvatarUrl(identity);
  }

  const seed = String(identity || 'Lool Store User').trim() || 'Lool Store User';
  const cacheKey = `anime:${seed}`;

  return getCachedAvatar(cacheKey, () => {
  const hash = hashString(seed);
  const palette = AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
  const initials = getInitials(seed);
  const hairPalette = ['#161827', '#20243a', '#32224a', '#172f3a', '#3a2432', '#44301a'];
  const eyePalette = ['#087f9b', '#b37a18', '#13b8d2', '#22c55e', '#42d7e9', '#f59e0b'];
  const skinPalette = ['#ffe1c7', '#f6c9a7', '#eeb993', '#f3d4bd', '#d8a277', '#c9875f'];
  const hairColor = hairPalette[hash % hairPalette.length];
  const eyeColor = eyePalette[(hash >> 2) % eyePalette.length];
  const skinColor = skinPalette[(hash >> 4) % skinPalette.length];
  const blushColor = palette[2];
  const faceShape = hash % 3;
  const hairStyle = (hash >> 3) % 5;
  const mouthStyle = (hash >> 6) % 4;
  const eyeStyle = (hash >> 8) % 3;
  const accessoryStyle = (hash >> 10) % 5;
  const backgroundMarkup = getAvatarBackgroundMarkup(hash, palette, 'anime');
  const hairFlip = hash % 2 === 0 ? '' : 'transform="translate(256 0) scale(-1 1)"';
  const faceMarkup = [
    `<circle cx="128" cy="104" r="58" fill="${skinColor}" filter="url(#softShadow)"/>`,
    `<path d="M75 101c0-34 23-58 53-58s53 24 53 58c0 42-23 70-53 70s-53-28-53-70z" fill="${skinColor}" filter="url(#softShadow)"/>`,
    `<path d="M70 106c0-38 25-64 58-64s58 26 58 64c0 36-27 63-58 63s-58-27-58-63z" fill="${skinColor}" filter="url(#softShadow)"/>`,
  ][faceShape];
  const hairMarkup = [
    `<path ${hairFlip} d="M70 100c3-43 31-70 69-70 39 0 66 26 70 65-18-16-42-24-72-24-26 0-49 9-67 29z" fill="url(#hairShine)"/>
     <path ${hairFlip} d="M62 113c10-44 43-72 82-72 21 0 41 8 55 22-40-2-69 14-88 43-17-3-34 0-49 7z" fill="${hairColor}" opacity="0.96"/>
     <path ${hairFlip} d="M92 59c-16 18-24 37-26 59 18-12 32-27 41-48z" fill="#ffffff" opacity="0.16"/>`,
    `<path ${hairFlip} d="M61 105c8-47 41-75 78-75 30 0 57 18 68 49-25-12-55-10-88 7-17 9-36 14-58 19z" fill="url(#hairShine)"/>
     <path ${hairFlip} d="M85 50c-4 34 3 57 24 78 9-28 23-51 42-70-22-12-44-15-66-8z" fill="${hairColor}" opacity="0.95"/>`,
    `<path d="M61 118c1-50 28-86 67-86s66 36 67 86c-15-23-37-36-67-36s-52 13-67 36z" fill="url(#hairShine)"/>
     <path d="M79 62c8 30 23 48 44 58 0-31 7-55 23-72-22-8-45-5-67 14z" fill="${hairColor}" opacity="0.92"/>
     <path d="M177 68c-11 28-28 46-50 55 4-30 0-55-12-75 23-5 44 2 62 20z" fill="${hairColor}" opacity="0.88"/>`,
    `<path ${hairFlip} d="M62 98c12-44 44-68 82-64 30 3 54 24 62 55-34-3-61 7-81 31-20-18-41-25-63-22z" fill="url(#hairShine)"/>
     <path ${hairFlip} d="M68 82c21 10 39 9 54-4 17-14 38-17 62-8-13-25-38-39-67-36-24 3-41 18-49 48z" fill="${hairColor}" opacity="0.96"/>`,
    `<path d="M58 112c4-45 33-82 70-82s66 37 70 82c-21-10-44-15-70-15s-49 5-70 15z" fill="${hairColor}" opacity="0.98"/>
     <path d="M73 77c18 17 37 26 58 26 22 0 39-9 52-26-14-28-36-43-55-43-22 0-42 15-55 43z" fill="url(#hairShine)"/>`,
  ][hairStyle];
  const eyesMarkup = [
    `<circle cx="103" cy="110" r="13" fill="#ffffff"/>
     <circle cx="153" cy="110" r="13" fill="#ffffff"/>
     <circle cx="104" cy="111" r="7" fill="${eyeColor}"/>
     <circle cx="154" cy="111" r="7" fill="${eyeColor}"/>
     <circle cx="101" cy="107" r="3" fill="#ffffff"/>
     <circle cx="151" cy="107" r="3" fill="#ffffff"/>`,
    `<path d="M90 109c9-12 22-12 31 0" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round"/>
     <path d="M140 109c9-12 22-12 31 0" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round"/>
     <circle cx="106" cy="110" r="6" fill="${eyeColor}"/>
     <circle cx="156" cy="110" r="6" fill="${eyeColor}"/>
     <circle cx="104" cy="107" r="2.5" fill="#ffffff"/>
     <circle cx="154" cy="107" r="2.5" fill="#ffffff"/>`,
    `<ellipse cx="104" cy="111" rx="15" ry="11" fill="#ffffff"/>
     <ellipse cx="154" cy="111" rx="15" ry="11" fill="#ffffff"/>
     <ellipse cx="104" cy="112" rx="6" ry="9" fill="${eyeColor}"/>
     <ellipse cx="154" cy="112" rx="6" ry="9" fill="${eyeColor}"/>
     <circle cx="102" cy="108" r="3" fill="#ffffff"/>
     <circle cx="152" cy="108" r="3" fill="#ffffff"/>`,
  ][eyeStyle];
  const mouthMarkup = [
    '<path d="M115 137c8 8 18 8 26 0" fill="none" stroke="#9a4b45" stroke-width="5" stroke-linecap="round"/>',
    '<path d="M115 139c9 5 18 5 27 0" fill="none" stroke="#9a4b45" stroke-width="4" stroke-linecap="round"/>',
    '<circle cx="128" cy="138" r="5" fill="#9a4b45" opacity="0.78"/>',
    '<path d="M118 136c5 10 15 13 25 4" fill="none" stroke="#9a4b45" stroke-width="5" stroke-linecap="round"/>',
  ][mouthStyle];
  const accessoryMarkup = [
    '',
    `<path d="M79 86h38a9 9 0 0 1 9 9v11a12 12 0 0 1-12 12H83a12 12 0 0 1-12-12V94a8 8 0 0 1 8-8zm60 0h38a8 8 0 0 1 8 8v12a12 12 0 0 1-12 12h-31a12 12 0 0 1-12-12V95a9 9 0 0 1 9-9z" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.72"/>
     <path d="M126 99h4" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.72"/>`,
    `<path d="M83 62c9-18 25-21 38-4-20 3-32 10-38 4z" fill="#ffffff" opacity="0.34"/>
     <path d="M173 62c-9-18-25-21-38-4 20 3 32 10 38 4z" fill="#ffffff" opacity="0.34"/>`,
    `<circle cx="72" cy="120" r="10" fill="${palette[2]}" opacity="0.86"/>
     <circle cx="184" cy="120" r="10" fill="${palette[2]}" opacity="0.86"/>`,
    `<path d="M128 35l9 16 18 3-13 13 3 18-17-8-17 8 3-18-13-13 18-3 9-16z" fill="#ffffff" opacity="0.34"/>`,
  ][accessoryStyle];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="${initials}">
      <defs>
        <linearGradient id="bg" x1="30" y1="18" x2="224" y2="238" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="${palette[0]}"/>
          <stop offset="0.52" stop-color="${palette[1]}"/>
          <stop offset="1" stop-color="${palette[2]}"/>
        </linearGradient>
        <radialGradient id="shine" cx="35%" cy="20%" r="65%">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.62"/>
          <stop offset="0.34" stop-color="#ffffff" stop-opacity="0.18"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#020617" flood-opacity="0.26"/>
        </filter>
        <linearGradient id="hairShine" x1="64" y1="36" x2="180" y2="142" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/>
          <stop offset="0.42" stop-color="${hairColor}" stop-opacity="0.96"/>
          <stop offset="1" stop-color="#050816" stop-opacity="0.92"/>
        </linearGradient>
      </defs>
      ${backgroundMarkup}
      <path d="M58 205c10-42 38-67 70-67s60 25 70 67" fill="#111827" opacity="0.3" filter="url(#softShadow)"/>
      <path d="M72 199c9-35 31-55 56-55s47 20 56 55" fill="#ffffff" opacity="0.88"/>
      ${faceMarkup}
      ${hairMarkup}
      ${accessoryMarkup}
      ${eyesMarkup}
      ${mouthMarkup}
      <ellipse cx="84" cy="129" rx="13" ry="7" fill="${blushColor}" opacity="0.22"/>
      <ellipse cx="172" cy="129" rx="13" ry="7" fill="${blushColor}" opacity="0.22"/>
      <path d="M63 53l7 14 15 2-11 10 3 15-14-7-13 7 3-15-11-10 15-2 6-14z" fill="#ffffff" opacity="0.42"/>
      <path d="M188 171l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2 5-10z" fill="#ffffff" opacity="0.3"/>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  });
};

export const resolveUserAvatar = (source, fallbackIdentity = 'Lool Store User') => {
  const isObject = source && typeof source === 'object';
  const rawAvatar = isObject ? source.avatar : source;
  const identity = String(
    fallbackIdentity
    || (isObject ? (source.name || source.username || source.email) : '')
    || 'Lool Store User'
  ).trim();
  const resolved = resolveImageUrl(rawAvatar);

  if (resolved && !isUiAvatarUrl(resolved) && !isLegacyAvatarUrl(resolved) && !isLegacyGeneratedAvatarUrl(resolved) && !isGeneratedSvgAvatarUrl(resolved)) {
    return resolved;
  }

  return getDefaultAvatarUrl(identity, {
    variant: isAdminIdentity(source, identity) ? 'gulf-admin' : 'anime',
  });
};
