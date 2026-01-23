const NIGERIAN_TRIBES = new Set([
  'yoruba',
  'igbo',
  'hausa',
  'fulani',
  'ijaw',
  'kanuri',
  'ibibio',
  'tiv',
  'edo',
  'nupe',
  'urhobo',
  'igala',
  'idoma',
  'efik',
  'annang',
  'itsekiri',
  'jukun',
  'ebira',
  'gwari',
  'berom',
]);

const GHANAIAN_TRIBES = new Set([
  'akan',
  'ewe',
  'ga',
  'dagomba',
  'fante',
  'ashanti',
]);

const KENYAN_TRIBES = new Set(['kikuyu', 'luhya', 'kalenjin', 'luo', 'kamba', 'kisii', 'meru']);

const SOUTH_AFRICAN_TRIBES = new Set(['zulu', 'xhosa', 'sotho', 'tswana', 'pedi', 'venda', 'tsonga', 'swazi', 'ndebele']);

const normalize = (value?: string | null) => (value || '').trim().toLowerCase();

export const inferOriginFromTribe = (tribe?: string | null) => {
  const normalized = normalize(tribe);
  if (!normalized) return '';
  if (NIGERIAN_TRIBES.has(normalized)) return 'Nigeria';
  if (GHANAIAN_TRIBES.has(normalized)) return 'Ghana';
  if (KENYAN_TRIBES.has(normalized)) return 'Kenya';
  if (SOUTH_AFRICAN_TRIBES.has(normalized)) return 'South Africa';
  return '';
};
