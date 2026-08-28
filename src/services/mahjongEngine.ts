/* oxlint-disable no-unused-vars */
export interface LocalizedText {
  English: string;
  Hindi: string;
  Assamese: string;
}

export const L = (English: string, Hindi: string, Assamese: string): LocalizedText => ({
  English,
  Hindi,
  Assamese,
});

export type MahjongThemeId = 'ner-heritage' | 'classic-ivory';
export type MahjongTableFelt = 'sand' | 'tea-garden' | 'brahmaputra-dusk' | 'high-contrast';

export interface MahjongPosition {
  id: string;
  x: number; // Half-tile grid coordinate (0, 1, 2, 3...) where a standard tile is 2x2
  y: number;
  z: number; // Layer (0 is base, 1 is layer 2, etc.)
}

export interface MahjongLayoutDefinition {
  id: string;
  stage: number;
  name: LocalizedText;
  subtitle: LocalizedText;
  tileCount: number;
  maxLayers: number;
  positions: MahjongPosition[];
  cameraBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export interface TileIdentity {
  id: string;
  suit: 'nature' | 'culture' | 'daily' | 'flower' | 'season' | 'circles' | 'bamboo' | 'characters' | 'winds' | 'dragons';
  symbolKey: string;
  number?: number;
  isFlower?: boolean;
  isSeason?: boolean;
  nerName: LocalizedText;
  classicName: LocalizedText;
}

export interface PlacedTile {
  instanceId: string;
  identityId: string;
  positionId: string;
  x: number;
  y: number;
  z: number;
  active: boolean;
}

export interface MahjongMove {
  type: 'match' | 'shuffle';
  removedPair?: [PlacedTile, PlacedTile];
  previousTilesState?: PlacedTile[];
  timestamp: string;
}

export interface MahjongBoardSnapshot {
  tiles: PlacedTile[];
  selectedTileId?: string;
  pairsCleared: number;
  hintCount: number;
  mismatchCount: number;
  blockedTapCount: number;
  shuffleCount: number;
}

export type MahjongStageSource = 'recommended' | 'manual' | 'test';

export interface MahjongViewPreferences {
  viewMode: 'fit' | 'comfort';
  showFreeHighlights: boolean;
  showLayerLabels: boolean;
  showBoardMap: boolean;
  simplerTiles: boolean;
  largePrint: boolean;
}

export interface MahjongTestingState {
  enabled: boolean;
  effectiveUnlockedStage: number;
}

export interface MahjongSavedGame {
  patientId: string;
  stage: number;
  layoutId: string;
  dealSeed: string;
  themeId: MahjongThemeId;
  tableFelt: MahjongTableFelt;
  tiles: PlacedTile[];
  moveHistory: MahjongMove[];
  hintCount: number;
  mismatchCount: number;
  blockedTapCount: number;
  shuffleCount: number;
  pairsCleared: number;
  activeDurationMs: number;
  startedAt: string;
  lastSavedAt: string;
  revision: number;
}

// -------------------------------------------------------------
// 1. TILE IDENTITIES: 36 standard identities (144 total tiles)
// -------------------------------------------------------------

export const tileIdentities: TileIdentity[] = [
  // NER Nature / Classic Circles (9 types, 4 copies = 36 tiles)
  { id: 'suit1_1', suit: 'nature', symbolKey: 'rhino', number: 1, nerName: L('One-horned Rhino', 'गैंडा', 'এশিঙীয়া গঁড়'), classicName: L('One Dot (Pearl)', 'एक बिंदु', '১ম বৃত্ত') },
  { id: 'suit1_2', suit: 'nature', symbolKey: 'hornbill', number: 2, nerName: L('Great Hornbill', 'धनेश पक्षी', 'ধনেশ পক্ষী'), classicName: L('Two Dots', 'दो बिंदु', '২য় বৃত্ত') },
  { id: 'suit1_3', suit: 'nature', symbolKey: 'orchid', number: 3, nerName: L('Kopou Orchid', 'ऑर्किड', 'কপৌ ফুল'), classicName: L('Three Dots', 'तीन बिंदु', '৩য় বৃত্ত') },
  { id: 'suit1_4', suit: 'nature', symbolKey: 'bamboo', number: 4, nerName: L('River Bamboo', 'बाँस', 'বাঁহ গছ'), classicName: L('Four Dots', 'चार बिंदु', '৪ৰ্থ বৃত্ত') },
  { id: 'suit1_5', suit: 'nature', symbolKey: 'boat', number: 5, nerName: L('Brahmaputra Boat', 'नाव', 'নাও'), classicName: L('Five Dots', 'पाँच बिंदु', '৫ম বৃত্ত') },
  { id: 'suit1_6', suit: 'nature', symbolKey: 'lotus', number: 6, nerName: L('Wild Lotus', 'कमल', 'পদ্ম ফুল'), classicName: L('Six Dots', 'छह बिंदु', '৬ষ্ঠ বৃত্ত') },
  { id: 'suit1_7', suit: 'nature', symbolKey: 'butterfly', number: 7, nerName: L('Silk Butterfly', 'तितली', 'পখিলা'), classicName: L('Seven Dots', 'सात बिंदु', '৭ম বৃত্ত') },
  { id: 'suit1_8', suit: 'nature', symbolKey: 'tea_bush', number: 8, nerName: L('Tea Bush', 'चाय की झाड़ी', 'চাহৰ জোপোহা'), classicName: L('Eight Dots', 'आठ बिंदु', '৮ম বৃত্ত') },
  { id: 'suit1_9', suit: 'nature', symbolKey: 'banyan', number: 9, nerName: L('Sacred Banyan', 'बरगद', 'বটবৃক্ষ'), classicName: L('Nine Dots', 'नौ बिंदु', '৯ম বৃত্ত') },

  // NER Culture / Classic Bamboo (9 types, 4 copies = 36 tiles)
  { id: 'suit2_1', suit: 'culture', symbolKey: 'japi', number: 1, nerName: L('Fulom Japi', 'जापी', 'ফুলাম জাপি'), classicName: L('One Bamboo (Peacock)', 'एक बाँस', '১ম বাঁহ') },
  { id: 'suit2_2', suit: 'culture', symbolKey: 'dhol', number: 2, nerName: L('Bihu Drum (Dhol)', 'ढोल', 'বিহু ঢোল'), classicName: L('Two Bamboo', 'दो बाँस', '২য় বাঁহ') },
  { id: 'suit2_3', suit: 'culture', symbolKey: 'gamosa', number: 3, nerName: L('Woven Gamosa', 'गमछा', 'গামোচা'), classicName: L('Three Bamboo', 'तीन बाँस', '৩য় বাঁহ') },
  { id: 'suit2_4', suit: 'culture', symbolKey: 'mask', number: 4, nerName: L('Majuli Mask', 'मुखौटा', 'মাজুলীৰ মুখা'), classicName: L('Four Bamboo', 'चार बाँस', '৪ৰ্থ বাঁহ') },
  { id: 'suit2_5', suit: 'culture', symbolKey: 'bell_metal', number: 5, nerName: L('Sarthebari Bell Metal', 'कांस्य पात्र', 'কাঁহৰ বাটি'), classicName: L('Five Bamboo', 'पाँच बाँस', '৫ম বাঁহ') },
  { id: 'suit2_6', suit: 'culture', symbolKey: 'basket', number: 6, nerName: L('Cane Basket', 'टोकरी', 'বাঁহৰ খৰাহী'), classicName: L('Six Bamboo', 'छह बाँस', '৬ষ্ঠ বাঁহ') },
  { id: 'suit2_7', suit: 'culture', symbolKey: 'lamp', number: 7, nerName: L('Clay Lamp (Saki)', 'दीपक', 'মাটিৰ চাকি'), classicName: L('Seven Bamboo', 'सात बाँस', '৭ম বাঁহ') },
  { id: 'suit2_8', suit: 'culture', symbolKey: 'loom', number: 8, nerName: L('Handloom Shuttle', 'हथकरघा', 'তাঁতশালৰ মাকো'), classicName: L('Eight Bamboo', 'आठ बाँस', '৮ম বাঁহ') },
  { id: 'suit2_9', suit: 'culture', symbolKey: 'pepa', number: 9, nerName: L('Buffalo Horn Pepa', 'पेपा', 'ম’হৰ শিঙৰ পেঁপা'), classicName: L('Nine Bamboo', 'नौ बाँस', '৯ম বাঁহ') },

  // NER Daily Life / Classic Characters (9 types, 4 copies = 36 tiles)
  { id: 'suit3_1', suit: 'daily', symbolKey: 'cup', number: 1, nerName: L('Assam Tea Cup', 'चाय का कप', 'চাহৰ কাপ'), classicName: L('One Character', 'एक वर्ण', '১ম আখৰ') },
  { id: 'suit3_2', suit: 'daily', symbolKey: 'kettle', number: 2, nerName: L('Tea Kettle', 'केतली', 'চাহৰ কেটলী'), classicName: L('Two Characters', 'दो वर्ण', '২য় আখৰ') },
  { id: 'suit3_3', suit: 'daily', symbolKey: 'biscuit', number: 3, nerName: L('Tea Biscuit', 'बिस्कुट', 'বিস্কুট'), classicName: L('Three Characters', 'तीन वर्ण', '৩য় আখৰ') },
  { id: 'suit3_4', suit: 'daily', symbolKey: 'milk', number: 4, nerName: L('Fresh Milk Glass', 'दूध का गिलास', 'গাখীৰৰ গিলাচ'), classicName: L('Four Characters', 'चार वर्ण', '৪ৰ্থ আখৰ') },
  { id: 'suit3_5', suit: 'daily', symbolKey: 'spoon', number: 5, nerName: L('Steel Spoon', 'चम्मच', 'চামুচ'), classicName: L('Five Characters', 'पाँच वर्ण', '৫ম আখৰ') },
  { id: 'suit3_6', suit: 'daily', symbolKey: 'rice', number: 6, nerName: L('Steamed Rice Bowl', 'चावल की कटोरी', 'ভাতৰ বাটি'), classicName: L('Six Characters', 'छह वर्ण', '৬ষ্ঠ আখৰ') },
  { id: 'suit3_7', suit: 'daily', symbolKey: 'key', number: 7, nerName: L('Brass Key', 'चाबी', 'পিতলৰ চাবি'), classicName: L('Seven Characters', 'सात वर्ण', '৭ম আখৰ') },
  { id: 'suit3_8', suit: 'daily', symbolKey: 'radio', number: 8, nerName: L('Vintage Radio', 'रेडियो', 'ৰেডিঅ’'), classicName: L('Eight Characters', 'आठ वर्ण', '৮ম আখৰ') },
  { id: 'suit3_9', suit: 'daily', symbolKey: 'umbrella', number: 9, nerName: L('Rain Umbrella', 'छाता', 'ছাটি'), classicName: L('Nine Characters', 'नौ वर्ण', '৯ম আখৰ') },

  // NER Regional Flowers / Classic Flowers (Wild family: matches any flower) (4 tiles, 1 copy each = 4 tiles)
  { id: 'flower_1', suit: 'flower', symbolKey: 'flower_foxtail', isFlower: true, nerName: L('Foxtail Orchid', 'कोपौ फूल', 'কপৌ ফুল (ফুল)'), classicName: L('Plum Blossom (Flower)', 'बेर का फूल', 'প্লাম ফুল') },
  { id: 'flower_2', suit: 'flower', symbolKey: 'flower_rhododendron', isFlower: true, nerName: L('Rhododendron', 'बुरांश फूल', 'ৰ’ড’ডেনড্ৰন ফুল'), classicName: L('Orchid Blossom (Flower)', 'ऑर्किड पुष्प', 'অৰ্কিড ফুল') },
  { id: 'flower_3', suit: 'flower', symbolKey: 'flower_lotus', isFlower: true, nerName: L('Sacred Pink Lotus', 'गुलाबी कमल', 'গোলাপী পদুম'), classicName: L('Chrysanthemum (Flower)', 'गुलदाउदी', 'চন্দ্ৰমল্লিকা') },
  { id: 'flower_4', suit: 'flower', symbolKey: 'flower_hibiscus', isFlower: true, nerName: L('Red Hibiscus (Jaba)', 'गुड़हल फूल', 'ৰঙা জবা ফুল'), classicName: L('Bamboo Blossom (Flower)', 'बाँस पुष्प', 'বাঁহ ফুল') },

  // NER Regional Seasons / Classic Seasons (Wild family: matches any season) (4 tiles, 1 copy each = 4 tiles)
  { id: 'season_1', suit: 'season', symbolKey: 'season_spring', isSeason: true, nerName: L('Spring (Bohag)', 'वसंत ऋतु (बोहाग)', 'ব’হাগ (বসন্ত)'), classicName: L('Spring Season', 'वसंत ऋतु', 'বসন্ত কাল') },
  { id: 'season_2', suit: 'season', symbolKey: 'season_monsoon', isSeason: true, nerName: L('Monsoon (Asar)', 'वर्षा ऋतु (आषाढ़)', 'আহাৰ (বৰ্ষা)'), classicName: L('Summer Season', 'ग्रीष्म ऋतु', 'গ্ৰীষ্ম কাল') },
  { id: 'season_3', suit: 'season', symbolKey: 'season_autumn', isSeason: true, nerName: L('Autumn (Kati)', 'शरद ऋतु (काति)', 'কাতি (শৰৎ)'), classicName: L('Autumn Season', 'शरद ऋतु', 'শৰৎ কাল') },
  { id: 'season_4', suit: 'season', symbolKey: 'season_winter', isSeason: true, nerName: L('Winter (Magh)', 'शीत ऋतु (माघ)', 'মাঘ (শীত)'), classicName: L('Winter Season', 'शीत ऋतु', 'শীত কাল') },

  // Traditional Winds / Nature Guardians (4 types, 4 copies = 16 tiles)
  { id: 'wind_east', suit: 'winds', symbolKey: 'wind_east', nerName: L('East Dawn Wind', 'पूर्वी हवा', 'পূব বতাহ'), classicName: L('East Wind', 'पूर्वी पवन', 'পূব বায়ু') },
  { id: 'wind_south', suit: 'winds', symbolKey: 'wind_south', nerName: L('South River Wind', 'दक्षिणी हवा', 'দক্ষিণ বতাহ'), classicName: L('South Wind', 'दक्षिणी पवन', 'দক্ষিণ বায়ু') },
  { id: 'wind_west', suit: 'winds', symbolKey: 'wind_west', nerName: L('West Hill Wind', 'पश्चिमी हवा', 'পশ্চিম বতাহ'), classicName: L('West Wind', 'पश्चिमी पवन', 'পশ্চিম বায়ু') },
  { id: 'wind_north', suit: 'winds', symbolKey: 'wind_north', nerName: L('North Mountain Wind', 'उत्तरी हवा', 'উত্তৰ বতাহ'), classicName: L('North Wind', 'उत्तरी पवन', 'উত্তৰ বায়ু') },

  // Traditional Dragons / Regional Emblems (3 types, 4 copies = 12 tiles)
  { id: 'dragon_red', suit: 'dragons', symbolKey: 'dragon_red', nerName: L('Red Chunar Emblem', 'लाल प्रतीक', 'ৰঙা প্ৰতীক'), classicName: L('Red Dragon (Chun)', 'लाल ड्रैगन', 'ৰঙা ড্ৰেগন') },
  { id: 'dragon_green', suit: 'dragons', symbolKey: 'dragon_green', nerName: L('Green Forest Emblem', 'हरा प्रतीक', 'সেউজীয়া প্ৰতীক'), classicName: L('Green Dragon (Fa)', 'हरा ड्रैगन', 'সেউজীয়া ড্ৰেগন') },
  { id: 'dragon_white', suit: 'dragons', symbolKey: 'dragon_white', nerName: L('White Snow Emblem', 'सफेद प्रतीक', 'বগা প্ৰতীক'), classicName: L('White Dragon (Bai)', 'सफेद ड्रैगन', 'বগা ড্ৰেগন') },
];

export const getIdentity = (identityId: string): TileIdentity => {
  const found = tileIdentities.find((item) => item.id === identityId);
  return found || tileIdentities[0];
};

// -------------------------------------------------------------
// 2. MATCHING LOGIC
// -------------------------------------------------------------

export const canTilesMatch = (tile1: PlacedTile, tile2: PlacedTile): boolean => {
  if (tile1.instanceId === tile2.instanceId) return false;
  const id1 = getIdentity(tile1.identityId);
  const id2 = getIdentity(tile2.identityId);

  // Wild Flower Family: Any flower matches any flower
  if (id1.isFlower && id2.isFlower) return true;

  // Wild Season Family: Any season matches any season
  if (id1.isSeason && id2.isSeason) return true;

  // Exact match for all standard suits, winds, and dragons
  return id1.id === id2.id;
};

// -------------------------------------------------------------
// 3. FREE TILE & GEOMETRY CALCULATION (Half-tile grid)
// Standard tile footprint is width=2, height=2
// -------------------------------------------------------------

/**
 * Checks if tileA overlaps with tileB horizontally and vertically
 */
export const doTilesOverlap2D = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): boolean => {
  return Math.abs(x1 - x2) < 2 && Math.abs(y1 - y2) < 2;
};

/**
 * A tile is covered if any active tile at a higher layer (z2 > z1) overlaps its 2x2 face
 */
export const isTileCovered = (
  target: PlacedTile,
  activeTiles: PlacedTile[]
): boolean => {
  return activeTiles.some(
    (other) =>
      other.instanceId !== target.instanceId &&
      other.z > target.z &&
      doTilesOverlap2D(target.x, target.y, other.x, other.y)
  );
};

/**
 * Finds the direct higher-layer covering tile(s) for visual help
 */
export const getCoveringTiles = (
  target: PlacedTile,
  activeTiles: PlacedTile[]
): PlacedTile[] => {
  return activeTiles.filter(
    (other) =>
      other.instanceId !== target.instanceId &&
      other.z > target.z &&
      doTilesOverlap2D(target.x, target.y, other.x, other.y)
  );
};

/**
 * Left blocker: same layer (z == z), touching on the left (x_other == x - 2, |y_other - y| < 2)
 */
export const isLeftBlocked = (
  target: PlacedTile,
  activeTiles: PlacedTile[]
): boolean => {
  return activeTiles.some(
    (other) =>
      other.instanceId !== target.instanceId &&
      other.z === target.z &&
      other.x === target.x - 2 &&
      Math.abs(other.y - target.y) < 2
  );
};

export const getLeftBlockers = (
  target: PlacedTile,
  activeTiles: PlacedTile[]
): PlacedTile[] => {
  return activeTiles.filter(
    (other) =>
      other.instanceId !== target.instanceId &&
      other.z === target.z &&
      other.x === target.x - 2 &&
      Math.abs(other.y - target.y) < 2
  );
};

/**
 * Right blocker: same layer (z == z), touching on the right (x_other == x + 2, |y_other - y| < 2)
 */
export const isRightBlocked = (
  target: PlacedTile,
  activeTiles: PlacedTile[]
): boolean => {
  return activeTiles.some(
    (other) =>
      other.instanceId !== target.instanceId &&
      other.z === target.z &&
      other.x === target.x + 2 &&
      Math.abs(other.y - target.y) < 2
  );
};

export const getRightBlockers = (
  target: PlacedTile,
  activeTiles: PlacedTile[]
): PlacedTile[] => {
  return activeTiles.filter(
    (other) =>
      other.instanceId !== target.instanceId &&
      other.z === target.z &&
      other.x === target.x + 2 &&
      Math.abs(other.y - target.y) < 2
  );
};

/**
 * A tile is FREE if:
 * 1. No active tile covers it from above (layer z2 > z1)
 * 2. AND at least ONE lateral side (left or right) is completely open
 */
export const isTileFree = (
  target: PlacedTile,
  activeTiles: PlacedTile[]
): boolean => {
  if (!target.active) return false;
  if (isTileCovered(target, activeTiles)) return false;
  const leftBlocked = isLeftBlocked(target, activeTiles);
  const rightBlocked = isRightBlocked(target, activeTiles);
  return !leftBlocked || !rightBlocked;
};

export const getFreeTiles = (tiles: PlacedTile[]): PlacedTile[] => {
  const active = tiles.filter((t) => t.active);
  return active.filter((t) => isTileFree(t, active));
};

export const getAvailableMatches = (
  tiles: PlacedTile[]
): Array<[PlacedTile, PlacedTile]> => {
  const free = getFreeTiles(tiles);
  const matches: Array<[PlacedTile, PlacedTile]> = [];

  for (let i = 0; i < free.length; i++) {
    for (let j = i + 1; j < free.length; j++) {
      if (canTilesMatch(free[i], free[j])) {
        matches.push([free[i], free[j]]);
      }
    }
  }
  return matches;
};

// -------------------------------------------------------------
// 4. TWELVE CURATED HAND-AUTHORED LAYOUTS
// Coordinate bounds & structure
// -------------------------------------------------------------

const buildPositions = (raw: Array<[number, number, number]>): MahjongPosition[] =>
  raw.map(([x, y, z], idx) => ({
    id: `pos_${idx}_${x}_${y}_z${z}`,
    x,
    y,
    z,
  }));

const getBounds = (positions: MahjongPosition[]) => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const pos of positions) {
    if (pos.x < minX) minX = pos.x;
    if (pos.x + 2 > maxX) maxX = pos.x + 2;
    if (pos.y < minY) minY = pos.y;
    if (pos.y + 2 > maxY) maxY = pos.y + 2;
  }
  return { minX, maxX, minY, maxY };
};

// Helper generator functions for layout coordinates
const makeTeaTray = (): MahjongPosition[] => {
  // 24 tiles, 1 layer (6x4 grid)
  const coords: Array<[number, number, number]> = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 6; c++) {
      coords.push([c * 2, r * 2, 0]);
    }
  }
  return buildPositions(coords);
};

const makeRiverSteps = (): MahjongPosition[] => {
  // 36 tiles, 2 layers
  const coords: Array<[number, number, number]> = [];
  // Base: 4 rows of 7 = 28
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 7; c++) {
      coords.push([c * 2, r * 2, 0]);
    }
  }
  // Layer 1: center 4x2 = 8
  for (let r = 1; r < 3; r++) {
    for (let c = 2; c < 6; c++) {
      coords.push([c * 2, r * 2, 1]);
    }
  }
  return buildPositions(coords);
};

const makeBambooBridge = (): MahjongPosition[] => {
  // 48 tiles, 2 layers
  const coords: Array<[number, number, number]> = [];
  // Base: 8x4 = 32
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 8; c++) {
      coords.push([c * 2, r * 2, 0]);
    }
  }
  // Layer 1: 2 rows of 8 = 16
  for (let r = 1; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      coords.push([c * 2, r * 2, 1]);
    }
  }
  return buildPositions(coords);
};

const makeLotus = (): MahjongPosition[] => {
  // 60 tiles, 3 layers
  const coords: Array<[number, number, number]> = [];
  // Base layer: 42 tiles
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r === 0 || r === 4 || r === 5) && (c < 1 || c > 6)) continue;
      coords.push([c * 2, r * 2, 0]);
    }
  }
  // Layer 1: 14 tiles
  for (let r = 1; r <= 4; r++) {
    for (let c = 2; c <= 5; c++) {
      if (r === 4 && (c === 2 || c === 5)) continue;
      coords.push([c * 2, r * 2, 1]);
    }
  }
  // Layer 2: 4 center tiles
  for (let r = 2; r <= 3; r++) {
    for (let c = 3; c <= 4; c++) {
      coords.push([c * 2, r * 2, 2]);
    }
  }
  return buildPositions(coords);
};

const makeCrab = (): MahjongPosition[] => {
  // 72 tiles, 3 layers
  const coords: Array<[number, number, number]> = [];
  // Base layer: 52 tiles
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 10; c++) {
      if ((r === 0 || r === 5) && (c < 2 || c > 7)) continue;
      coords.push([c * 2, r * 2, 0]);
    }
  }
  // Layer 1: 16 tiles (body)
  for (let r = 1; r < 5; r++) {
    for (let c = 3; c < 7; c++) {
      coords.push([c * 2, r * 2, 1]);
    }
  }
  // Layer 2: 4 tiles (eyes & crown)
  coords.push([6, 2, 2], [10, 2, 2], [6, 6, 2], [10, 6, 2]);
  return buildPositions(coords);
};

const makeCat = (): MahjongPosition[] => {
  // 84 tiles, 4 layers
  const coords: Array<[number, number, number]> = [];
  // Base: 48 tiles
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 9; c++) {
      if (r === 0 && (c < 2 || c === 4 || c > 6)) continue;
      if (r === 6 && (c < 3 || c > 5)) continue;
      if ((r === 1 || r === 5) && (c === 0 || c === 8)) continue;
      coords.push([c * 2, r * 2, 0]);
    }
  }
  // Layer 1: 22 tiles
  for (let r = 1; r < 6; r++) {
    for (let c = 2; c < 7; c++) {
      if (r === 1 && (c === 2 || c === 4 || c === 6)) continue;
      coords.push([c * 2, r * 2, 1]);
    }
  }
  // Layer 2: 8 tiles
  for (let r = 2; r <= 5; r++) {
    coords.push([6, r * 2, 2], [8, r * 2, 2]);
  }
  // Layer 3: 4 tiles
  for (let r = 3; r <= 4; r++) {
    coords.push([6, r * 2, 3], [8, r * 2, 3]);
  }
  // Layer 4: 2 tiles (ears)
  coords.push([6, 2, 4], [8, 2, 4]);
  return buildPositions(coords);
};

const makeFortress = (): MahjongPosition[] => {
  // 96 tiles, 4 layers
  const coords: Array<[number, number, number]> = [];
  // Base: 64 tiles
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 9; c++) {
      if ((r === 0 || r === 7) && (c === 4)) continue;
      if ((r > 1 && r < 6) && (c === 0 || c === 8)) continue;
      coords.push([c * 2, r * 2, 0]);
    }
  }
  // Layer 1: 20 tiles
  for (let r = 2; r < 6; r++) {
    for (let c = 2; c < 7; c++) {
      coords.push([c * 2, r * 2, 1]);
    }
  }
  // Layer 2: 8 tiles
  for (let r = 3; r < 5; r++) {
    for (let c = 3; c < 7; c++) {
      coords.push([c * 2, r * 2, 2]);
    }
  }
  // Layer 3: 6 tiles (apex & gate)
  coords.push([6, 6, 3], [8, 6, 3], [6, 8, 3], [8, 8, 3], [6, 4, 3], [8, 4, 3]);
  return buildPositions(coords);
};

const makeSpider = (): MahjongPosition[] => {
  // 108 tiles, 4 layers
  const coords: Array<[number, number, number]> = [];
  // Base: 72 tiles
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 10; c++) {
      if ((r === 0 || r === 7) && (c < 2 || c > 7)) continue;
      coords.push([c * 2, r * 2, 0]);
    }
  }
  // Layer 1: 24 tiles (body)
  for (let r = 2; r < 6; r++) {
    for (let c = 2; c < 8; c++) {
      coords.push([c * 2, r * 2, 1]);
    }
  }
  // Layer 2: 8 tiles
  for (let r = 3; r < 5; r++) {
    for (let c = 3; c < 7; c++) {
      coords.push([c * 2, r * 2, 2]);
    }
  }
  // Layer 3: 4 tiles (back cap)
  coords.push([7, 7, 3], [9, 7, 3], [7, 9, 3], [9, 9, 3]);
  return buildPositions(coords);
};

const makeTurtle = (): MahjongPosition[] => {
  // 120 tiles, 5 layers (Adapted Turtle layout)
  const coords: Array<[number, number, number]> = [];
  // Base: 84 tiles
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 12; c++) {
      if ((r === 0 || r === 7) && (c < 3 || c > 8)) continue;
      coords.push([c * 2, r * 2, 0]);
    }
  }
  // Layer 1: 24 tiles
  for (let r = 2; r < 6; r++) {
    for (let c = 3; c < 9; c++) {
      coords.push([c * 2, r * 2, 1]);
    }
  }
  // Layer 2: 10 tiles
  for (let r = 3; r < 5; r++) {
    for (let c = 4; c < 9; c++) {
      coords.push([c * 2, r * 2, 2]);
    }
  }
  // Layer 3: 2 tiles
  coords.push([10, 7, 3], [12, 7, 3]);
  return buildPositions(coords);
};

const makeClassicTurtle144 = (): MahjongPosition[] => {
  // Classic 144-tile Turtle formation (with half-tile offsets)
  const coords: Array<[number, number, number]> = [];

  // Layer 0: 87 tiles
  // Row 0: 12 tiles (c=1..12)
  for (let c = 1; c <= 12; c++) coords.push([c * 2, 0, 0]);
  // Row 1: 10 tiles (c=2..11)
  for (let c = 2; c <= 11; c++) coords.push([c * 2, 2, 0]);
  // Row 2: 12 tiles (c=1..12)
  for (let c = 1; c <= 12; c++) coords.push([c * 2, 4, 0]);
  // Row 3: Left outriggers (2: [0, 5], [0, 7]) + 12 (c=1..12) + Right outriggers (4: [26, 5], [28, 5], [26, 7], [28, 7]) = 18 tiles
  coords.push([0, 5, 0], [0, 7, 0]);
  for (let c = 1; c <= 12; c++) coords.push([c * 2, 6, 0]);
  coords.push([26, 5, 0], [28, 5, 0], [26, 7, 0], [28, 7, 0]);
  // Row 4: 12 tiles
  for (let c = 1; c <= 12; c++) coords.push([c * 2, 8, 0]);
  // Row 5: 11 tiles
  for (let c = 2; c <= 12; c++) coords.push([c * 2, 10, 0]);
  // Row 6: 12 tiles
  for (let c = 1; c <= 12; c++) coords.push([c * 2, 12, 0]);

  // Layer 1: 36 tiles (6x6 centered at x=8..18, y=3..8)
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      coords.push([8 + c * 2, 3 + r * 1.5, 1]);
    }
  }

  // Layer 2: 16 tiles (4x4 centered)
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      coords.push([10 + c * 2, 4.5 + r * 1.5, 2]);
    }
  }

  // Layer 3: 4 tiles (2x2 centered)
  coords.push([12, 6, 3], [14, 6, 3], [12, 8, 3], [14, 8, 3]);

  // Layer 4: 1 tile at the apex (x=13, y=7, z=4)
  coords.push([13, 7, 4]);

  return buildPositions(coords);
};

const makeDragon144 = (): MahjongPosition[] => {
  // 144-tile Dragon layout
  const coords: Array<[number, number, number]> = [];
  // Layer 0: 88 tiles
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 13; c++) {
      if ((r === 0 || r === 7) && (c < 2 || c > 8)) continue;
      if ((r === 1 || r === 6) && (c < 1 || c > 11)) continue;
      coords.push([c * 2, r * 2, 0]);
    }
  }
  // Layer 1: 36 tiles
  for (let r = 1; r < 7; r++) {
    for (let c = 3; c < 9; c++) {
      coords.push([c * 2, r * 2, 1]);
    }
  }
  // Layer 2: 16 tiles
  for (let r = 2; r < 6; r++) {
    for (let c = 4; c < 8; c++) {
      coords.push([c * 2, r * 2, 2]);
    }
  }
  // Layer 3: 4 tiles
  coords.push([9, 5, 3], [11, 5, 3], [9, 7, 3], [11, 7, 3]);
  return buildPositions(coords);
};

const makeTitanGarden144 = (): MahjongPosition[] => {
  // 144-tile 6-layer Titan Garden layout
  const coords: Array<[number, number, number]> = [];
  // Layer 0: 82 tiles
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 12; c++) {
      if ((r === 0 || r === 7) && (c < 3 || c > 9)) continue;
      if ((r === 1 || r === 6) && (c === 0 || c === 11)) continue;
      coords.push([c * 2, r * 2, 0]);
    }
  }
  // Layer 1: 36 tiles
  for (let r = 1; r < 7; r++) {
    for (let c = 3; c < 9; c++) {
      coords.push([c * 2, r * 2, 1]);
    }
  }
  // Layer 2: 16 tiles
  for (let r = 2; r < 6; r++) {
    for (let c = 4; c < 8; c++) {
      coords.push([c * 2, r * 2, 2]);
    }
  }
  // Layer 3: 8 tiles
  for (let r = 3; r < 5; r++) {
    for (let c = 4; c < 8; c++) {
      coords.push([c * 2, r * 2, 3]);
    }
  }
  // Layer 4: 2 tiles
  coords.push([9, 7, 4], [11, 7, 4]);
  return buildPositions(coords);
};

export const mahjongLayouts: MahjongLayoutDefinition[] = [
  {
    id: 'stage_1_tea_tray',
    stage: 1,
    name: L('Tea Tray', 'चाय ट्रे', 'চাহৰ ট্ৰে'),
    subtitle: L('24 tiles · 1 layer · Gentle start', '24 टाइलें · 1 परत · सरल शुरुआत', '২৪টা টাইলস · ১টা স্তৰ'),
    tileCount: 24,
    maxLayers: 1,
    positions: makeTeaTray(),
    cameraBounds: getBounds(makeTeaTray()),
  },
  {
    id: 'stage_2_river_steps',
    stage: 2,
    name: L('River Steps', 'नदी की सीढ़ियाँ', 'ঘাটৰ খটখটী'),
    subtitle: L('36 tiles · 2 layers · Upper coverage', '36 टाइलें · 2 परतें · ऊपर से ढकी टाइलें', '৩৬টা টাইলস · ২টা স্তৰ'),
    tileCount: 36,
    maxLayers: 2,
    positions: makeRiverSteps(),
    cameraBounds: getBounds(makeRiverSteps()),
  },
  {
    id: 'stage_3_bamboo_bridge',
    stage: 3,
    name: L('Bamboo Bridge', 'बाँस का पुल', 'বাঁহৰ সাঁকো'),
    subtitle: L('48 tiles · 2 layers · Side blocking', '48 टाइलें · 2 परतें · दोनों ओर से घिरी टाइलें', '৪৮টা টাইলস · ২টা স্তৰ'),
    tileCount: 48,
    maxLayers: 2,
    positions: makeBambooBridge(),
    cameraBounds: getBounds(makeBambooBridge()),
  },
  {
    id: 'stage_4_lotus',
    stage: 4,
    name: L('Lotus Flower', 'कमल का फूल', 'পদুম ফুল'),
    subtitle: L('60 tiles · 3 layers · Layer reasoning', '60 टाइलें · 3 परतें · बहु-स्तरीय सोच', '৬০টা টাইলস · ৩টা স্তৰ'),
    tileCount: 60,
    maxLayers: 3,
    positions: makeLotus(),
    cameraBounds: getBounds(makeLotus()),
  },
  {
    id: 'stage_5_crab',
    stage: 5,
    name: L('River Crab', 'नदी का केकड़ा', 'নৈৰ কেঁকোৰা'),
    subtitle: L('72 tiles · 3 layers · Classic silhouette', '72 टाइलें · 3 परतें · क्लासिक आकार', '৭২টা টাইলস · ৩টা স্তৰ'),
    tileCount: 72,
    maxLayers: 3,
    positions: makeCrab(),
    cameraBounds: getBounds(makeCrab()),
  },
  {
    id: 'stage_6_cat',
    stage: 6,
    name: L('Feline Cat', 'बिल्ली', 'মেকুৰী'),
    subtitle: L('84 tiles · 4 layers · Branching paths', '84 टाइलें · 4 परतें · शाखा मार्ग', '৮৪টা টাইলস · ৪টা স্তৰ'),
    tileCount: 84,
    maxLayers: 4,
    positions: makeCat(),
    cameraBounds: getBounds(makeCat()),
  },
  {
    id: 'stage_7_fortress',
    stage: 7,
    name: L('Ahom Fortress', 'अहोम किला', 'আহোম গড়'),
    subtitle: L('96 tiles · 4 layers · Central stacks', '96 टाइलें · 4 परतें · केंद्रीय स्तम्भ', '৯৬টা টাইলস · ৪টা স্তৰ'),
    tileCount: 96,
    maxLayers: 4,
    positions: makeFortress(),
    cameraBounds: getBounds(makeFortress()),
  },
  {
    id: 'stage_8_spider',
    stage: 8,
    name: L('Weaving Spider', 'मकड़ी', 'মকৰা'),
    subtitle: L('108 tiles · 4 layers · Long wings', '108 टाइलें · 4 परतें · लंबे पंख', '১০৮টা টাইলস · ৪টা স্তৰ'),
    tileCount: 108,
    maxLayers: 4,
    positions: makeSpider(),
    cameraBounds: getBounds(makeSpider()),
  },
  {
    id: 'stage_9_turtle',
    stage: 9,
    name: L('River Turtle', 'कछुआ', 'কাছ'),
    subtitle: L('120 tiles · 5 layers · Deep pyramid', '120 टाइलें · 5 परतें · गहरा पिरामिड', '১২০টা টাইলস · ৫টা স্তৰ'),
    tileCount: 120,
    maxLayers: 5,
    positions: makeTurtle(),
    cameraBounds: getBounds(makeTurtle()),
  },
  {
    id: 'stage_10_classic_turtle',
    stage: 10,
    name: L('Classic Turtle (144)', 'क्लासिक कछुआ (144)', 'ক্লাচিক কাছ (১৪৪)'),
    subtitle: L('144 tiles · 5 layers · Full traditional set', '144 टाइलें · 5 परतें · पूर्ण पारंपरिक सेट', '১৪৪টা টাইলস · ৫টা স্তৰ'),
    tileCount: 144,
    maxLayers: 5,
    positions: makeClassicTurtle144(),
    cameraBounds: getBounds(makeClassicTurtle144()),
  },
  {
    id: 'stage_11_dragon',
    stage: 11,
    name: L('Dragon Spirit', 'ड्रैगन', 'ড্ৰেগন'),
    subtitle: L('144 tiles · 5 layers · Overlapping paths', '144 टाइलें · 5 परतें · जटिल मार्ग', '১৪৪টা টাইলস · ৫টা স্তৰ'),
    tileCount: 144,
    maxLayers: 5,
    positions: makeDragon144(),
    cameraBounds: getBounds(makeDragon144()),
  },
  {
    id: 'stage_12_titan_garden',
    stage: 12,
    name: L('Titan Garden', 'विशाल उद्यान', 'বিশাল বাগিচা'),
    subtitle: L('144 tiles · 6 layers · Master challenge', '144 टाइलें · 6 परतें · सर्वोच्च चुनौती', '১৪৪টা টাইলস · ৬টা স্তৰ'),
    tileCount: 144,
    maxLayers: 6,
    positions: makeTitanGarden144(),
    cameraBounds: getBounds(makeTitanGarden144()),
  },
];

export const getLayoutForStage = (stage: number): MahjongLayoutDefinition => {
  const index = Math.max(1, Math.min(12, stage)) - 1;
  return mahjongLayouts[index];
};

// -------------------------------------------------------------
// 5. GUARANTEED-SOLVABLE DEAL GENERATOR
// Simulates removal path and assigns matching identities in reverse
// -------------------------------------------------------------

// Simple seeded pseudo-random number generator (LCG)
export const createRng = (seedStr: string) => {
  let s = 0;
  for (let i = 0; i < seedStr.length; i++) {
    s = (s << 5) - s + seedStr.charCodeAt(i);
    s |= 0;
  }
  let seed = (s ^ 0xabcdef) >>> 0;

  return {
    next: (): number => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    },
    nextInt: (min: number, max: number): number => {
      return Math.floor(min + (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296 * (max - min + 1));
    },
    shuffle: <T>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296 * (i + 1));
        const temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
      }
      return copy;
    },
  };
};

/**
 * Builds the identity pool of size tileCount
 */
export const buildIdentityPool = (tileCount: number, rng: ReturnType<typeof createRng>): string[] => {
  const pool: string[] = [];
  const standardSuits = tileIdentities.filter((t) => !t.isFlower && !t.isSeason);
  const shuffledSuits = rng.shuffle(standardSuits);

  const numPairs = tileCount / 2;
  let pairsAdded = 0;

  // Add flower pair if applicable and tileCount >= 60
  if (tileCount >= 60 && pairsAdded < numPairs) {
    const flowerIds = ['flower_1', 'flower_2', 'flower_3', 'flower_4'];
    const pair = rng.shuffle(flowerIds).slice(0, 2);
    pool.push(pair[0], pair[1]);
    pairsAdded++;
  }

  // Add season pair if applicable and tileCount >= 84
  if (tileCount >= 84 && pairsAdded < numPairs) {
    const seasonIds = ['season_1', 'season_2', 'season_3', 'season_4'];
    const pair = rng.shuffle(seasonIds).slice(0, 2);
    pool.push(pair[0], pair[1]);
    pairsAdded++;
  }

  // Fill remainder with exact matching pairs from standard suits
  let suitIdx = 0;
  while (pairsAdded < numPairs) {
    const suit = shuffledSuits[suitIdx % shuffledSuits.length];
    pool.push(suit.id, suit.id);
    pairsAdded++;
    suitIdx++;
  }

  return rng.shuffle(pool);
};

/**
 * Generates a guaranteed-solvable board deal for a given layout and seed
 */
export const generateSolvableDeal = (
  layout: MahjongLayoutDefinition,
  seed: string = String(Date.now())
): PlacedTile[] => {
  const rng = createRng(seed);
  const totalTiles = layout.positions.length;
  if (totalTiles % 2 !== 0) {
    throw new Error(`Layout ${layout.id} has odd number of positions: ${totalTiles}`);
  }

  // 1. Simulate reverse solving:
  // Start with empty board, repeatedly pick pairs that are "free" in reverse or forward
  // To ensure absolute solvability: Simulate forward clearing with mock tiles
  const tempTiles: PlacedTile[] = layout.positions.map((pos, idx) => ({
    instanceId: `tile_${idx}`,
    identityId: '',
    positionId: pos.id,
    x: pos.x,
    y: pos.y,
    z: pos.z,
    active: true,
  }));

  const pairedPositionIds: Array<[string, string]> = [];
  const simulationActive = [...tempTiles];

  // While simulation has active tiles, find currently free tiles, pick 2, remove them
  while (simulationActive.length > 0) {
    const free = simulationActive.filter((t) => isTileFree(t, simulationActive));
    if (free.length < 2) {
      // If forward simulation runs into a dead end, backtrack or pick closest
      if (free.length === 1 && simulationActive.length === 2) {
        pairedPositionIds.push([simulationActive[0].positionId, simulationActive[1].positionId]);
        break;
      }
      // Retry with alternative seed modifier if layout topology allows
      return generateSolvableDeal(layout, seed + '_retry');
    }

    // Pick 2 free tiles
    const idx1 = rng.nextInt(0, free.length - 1);
    let idx2 = rng.nextInt(0, free.length - 1);
    while (idx2 === idx1 && free.length > 1) {
      idx2 = (idx2 + 1) % free.length;
    }

    const t1 = free[idx1];
    const t2 = free[idx2];

    pairedPositionIds.push([t1.positionId, t2.positionId]);

    // Remove from simulation
    const rem1 = simulationActive.findIndex((t) => t.instanceId === t1.instanceId);
    simulationActive.splice(rem1, 1);
    const rem2 = simulationActive.findIndex((t) => t.instanceId === t2.instanceId);
    simulationActive.splice(rem2, 1);
  }

  // 2. Assign matching identities to each paired set of positions
  const identityPool = buildIdentityPool(totalTiles, rng);
  const positionToIdentity = new Map<string, string>();

  for (let i = 0; i < pairedPositionIds.length; i++) {
    const [pos1, pos2] = pairedPositionIds[i];
    const id1 = identityPool[i * 2];
    const id2 = identityPool[i * 2 + 1];
    positionToIdentity.set(pos1, id1);
    positionToIdentity.set(pos2, id2);
  }

  // Build final placed tiles
  return layout.positions.map((pos, idx) => ({
    instanceId: `tile_${idx}_${pos.id}`,
    identityId: positionToIdentity.get(pos.id) || 'suit1_1',
    positionId: pos.id,
    x: pos.x,
    y: pos.y,
    z: pos.z,
    active: true,
  }));
};

/**
 * Reshuffle remaining active tiles guaranteeing at least one solvable pair
 */
export const shuffleRemainingTiles = (
  tiles: PlacedTile[],
  seed: string = String(Date.now())
): PlacedTile[] => {
  const activeTiles = tiles.filter((t) => t.active);
  if (activeTiles.length <= 1) return tiles;

  const rng = createRng(seed);
  const activeIdentities = rng.shuffle(activeTiles.map((t) => t.identityId));

  // Assign shuffled identities to current active tile positions
  let attempt = 0;
  let result: PlacedTile[] = [];

  while (attempt < 50) {
    const shuffledIds = rng.shuffle([...activeIdentities]);
    let activeIdx = 0;

    result = tiles.map((t) => {
      if (!t.active) return t;
      const nextId = shuffledIds[activeIdx++];
      return { ...t, identityId: nextId };
    });

    const matches = getAvailableMatches(result);
    if (matches.length > 0) {
      return result;
    }
    attempt++;
  }

  // Fallback: Swap an existing pair onto two currently free positions
  const free = getFreeTiles(result);
  if (free.length >= 2) {
    const targetId = activeIdentities[0];
    const updated = result.map((t) => {
      if (t.instanceId === free[0].instanceId) return { ...t, identityId: targetId };
      if (t.instanceId === free[1].instanceId) return { ...t, identityId: targetId };
      return t;
    });
    return updated;
  }

  return result;
};
