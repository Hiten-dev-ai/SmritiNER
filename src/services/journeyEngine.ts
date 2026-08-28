import type {
  CognitiveDomain,
  DifficultyDecision,
  GameDefinition,
  GameDifficultyProfile,
  GameProgress,
  GameRoundResult,
  JourneyGameSession,
  JourneyGameType,
} from '../types';

export type { JourneyGameType };
export interface LocalizedText { English: string; Hindi: string; Assamese: string }
export interface JourneyItem {
  id: string;
  emoji: string;
  category?: 'nature' | 'tea-culture' | 'daily-objects' | 'clothing' | 'food';
  label: LocalizedText;
  svgIcon?: string;
}

export const L = (English: string, Hindi: string, Assamese: string): LocalizedText => ({ English, Hindi, Assamese });

export const journeyDefinitions: Array<GameDefinition & { id: JourneyGameType; emoji: string; colors: string }> = [
  { id: 'majuli_memory', title: 'Majuli Memory Match', subtitle: 'Flip and match familiar pairs', domain: 'visual-memory', estimatedMinutes: 3, emoji: '🦏', colors: 'from-emerald-500 to-tea-800' },
  { id: 'tea_tray_recall', title: 'Tea Tray Recall', subtitle: 'Remember the serving order', domain: 'working-memory', estimatedMinutes: 3, emoji: '🫖', colors: 'from-amber-500 to-orange-700' },
  { id: 'market_list_recall', title: 'Market List Recall', subtitle: 'Remember everyday shopping items', domain: 'memory', estimatedMinutes: 3, emoji: '🧺', colors: 'from-lime-500 to-emerald-700' },
  { id: 'missing_object', title: 'What Went Missing?', subtitle: 'Notice which object disappeared', domain: 'recognition', estimatedMinutes: 3, emoji: '🔍', colors: 'from-sky-500 to-blue-700' },
  { id: 'daily_steps', title: 'Simple Daily Steps', subtitle: 'Put a familiar routine in order', domain: 'sequencing', estimatedMinutes: 4, emoji: '🌤️', colors: 'from-orange-500 to-rose-700' },
  { id: 'weave_pattern', title: 'Weave the Pattern', subtitle: 'Complete a colourful textile rhythm', domain: 'pattern-recognition', estimatedMinutes: 3, emoji: '🧣', colors: 'from-rose-500 to-purple-700' },
  { id: 'memory_lane', title: 'Memory Lane', subtitle: 'Gentle family and place recall', domain: 'reminiscence', estimatedMinutes: 4, emoji: '📸', colors: 'from-violet-500 to-indigo-700' },
  { id: 'mahjong_memory', title: 'Smriti Mahjong', subtitle: 'Match illustrated regional tiles', domain: 'visual-memory', estimatedMinutes: 4, emoji: '🀄', colors: 'from-teal-600 to-emerald-900' },
];

export const journeyGameNames: Record<JourneyGameType, { title: LocalizedText; subtitle: LocalizedText }> = {
  majuli_memory: { title: L('Majuli Memory Match', 'माजुली स्मृति मिलान', 'মাজুলী স্মৃতি মিল'), subtitle: L('Flip and match familiar pairs', 'परिचित जोड़े मिलाएँ', 'চিনাকি যোৰা মিলাওক') },
  tea_tray_recall: { title: L('Tea Tray Recall', 'चाय ट्रे स्मरण', 'চাহৰ ট্ৰে স্মৰণ'), subtitle: L('Remember the serving order', 'परोसने का क्रम याद रखें', 'পৰিবেশনৰ ক্ৰম মনত ৰাখক') },
  market_list_recall: { title: L('Market List Recall', 'बाज़ार सूची स्मरण', 'বজাৰৰ তালিকা স্মৰণ'), subtitle: L('Remember everyday shopping items', 'रोज़मर्रा की चीज़ें याद रखें', 'দৈনন্দিন বজাৰৰ বস্তু মনত ৰাখক') },
  missing_object: { title: L('What Went Missing?', 'क्या गायब हुआ?', 'কি নোহোৱা হ’ল?'), subtitle: L('Notice which object disappeared', 'गायब चीज़ पहचानें', 'নোহোৱা বস্তুটো চিনাক্ত কৰক') },
  daily_steps: { title: L('Simple Daily Steps', 'सरल दैनिक चरण', 'সহজ দৈনিক খোজ'), subtitle: L('Put a familiar routine in order', 'परिचित दिनचर्या क्रम में रखें', 'চিনাকি কাম ক্ৰমত সজাওক') },
  weave_pattern: { title: L('Weave the Pattern', 'पैटर्न बुनें', 'নক্সা বোৱক'), subtitle: L('Complete a colourful textile rhythm', 'कपड़े का क्रम पूरा करें', 'ৰঙীন কাপোৰৰ ক্ৰম সম্পূৰ্ণ কৰক') },
  memory_lane: { title: L('Memory Lane', 'स्मृति यात्रा', 'স্মৃতি পথ'), subtitle: L('Gentle family and place recall', 'परिवार और स्थान की यादें', 'পৰিয়াল আৰু ঠাইৰ স্মৃতি') },
  mahjong_memory: { title: L('Smriti Mahjong', 'स्मृति माहजोंग', 'স্মৃতি মাহজং'), subtitle: L('Match illustrated regional tiles', 'सचित्र टाइलें मिलाएँ', 'সচিত্ৰ টাইলস মিলাওক') },
};

export const localizedGame = (type: JourneyGameType, language: keyof LocalizedText) => ({
  ...getGameDefinition(type),
  title: journeyGameNames[type]?.title[language] || journeyGameNames[type]?.title.English || type,
  subtitle: journeyGameNames[type]?.subtitle[language] || journeyGameNames[type]?.subtitle.English || '',
});

// At least 32 bundled cultural and daily life illustrations
export const journeyItems: JourneyItem[] = [
  // Cultural / NER Nature
  { id: 'rhino', emoji: '🦏', category: 'nature', label: L('One-horned Rhino', 'एक सींग वाला गैंडा', 'এশিঙীয়া গঁড়') },
  { id: 'dhol', emoji: '🥁', category: 'tea-culture', label: L('Bihu drum', 'बिहू ढोल', 'বিহু ঢোল') },
  { id: 'tea', emoji: '🍃', category: 'tea-culture', label: L('Fresh tea leaf', 'ताज़ी चाय पत्ती', 'কুমলীয়া চাহপাত') },
  { id: 'gamosa', emoji: '🧣', category: 'clothing', label: L('Assamese Gamosa', 'असमिया गमछा', 'অসমীয়া গামোচা') },
  { id: 'japi', emoji: '👒', category: 'tea-culture', label: L('Traditional Japi', 'पारंपरिक जापी', 'ফুলাম জাপি') },
  { id: 'bamboo', emoji: '🎋', category: 'nature', label: L('Green bamboo', 'हरा बाँस', 'সেউজীয়া বাঁহ') },
  { id: 'mask', emoji: '🎭', category: 'tea-culture', label: L('Majuli mask', 'माजुली मुखौटा', 'মাজুলীৰ মুখা') },
  { id: 'hornbill', emoji: '🦜', category: 'nature', label: L('Great Hornbill', 'धनेश पक्षी', 'ধনেশ পক্ষী') },
  { id: 'silk', emoji: '🦋', category: 'clothing', label: L('Golden Muga silk', 'मूगा रेशम', 'সোণালী মুগা ৰেচম') },
  { id: 'orchid', emoji: '🌸', category: 'nature', label: L('Kopou Orchid', 'कोपौ ऑर्किड', 'কপৌ ফুল') },
  { id: 'boat', emoji: '🛶', category: 'nature', label: L('River boat', 'नदी की नाव', 'ব্ৰহ্মপুত্ৰৰ নাও') },
  { id: 'basket', emoji: '🧺', category: 'tea-culture', label: L('Cane basket', 'बाँस की टोकरी', 'বাঁহৰ খৰাহী') },

  // Tea culture & Dining
  { id: 'cup', emoji: '☕', category: 'tea-culture', label: L('Hot tea cup', 'गर्म चाय का कप', 'গৰম চাহৰ কাপ') },
  { id: 'kettle', emoji: '🫖', category: 'tea-culture', label: L('Tea kettle', 'चाय की केतली', 'চাহৰ কেটলী') },
  { id: 'biscuit', emoji: '🍪', category: 'food', label: L('Tea biscuit', 'चाय का बिस्कुट', 'চাহৰ বিস্কুট') },
  { id: 'flower', emoji: '🌺', category: 'nature', label: L('Garden flower', 'बगीचे का फूल', 'বাগানৰ ফুল') },
  { id: 'spoon', emoji: '🥄', category: 'daily-objects', label: L('Steel spoon', 'चम्मच', 'চামুচ') },
  { id: 'milk', emoji: '🥛', category: 'food', label: L('Glass of milk', 'दूध का गिलास', 'গাখীৰৰ গিলাচ') },
  { id: 'rice', emoji: '🍚', category: 'food', label: L('Steamed rice', 'पके चावल', 'ভাত') },
  { id: 'banana', emoji: '🍌', category: 'food', label: L('Fresh banana', 'ताज़ा केला', 'মালভোগ কল') },
  { id: 'fish', emoji: '🐟', category: 'food', label: L('River fish', 'नदी की मछली', 'নৈৰ মাছ') },
  { id: 'tomato', emoji: '🍅', category: 'food', label: L('Red tomato', 'लाल टमाटर', 'ৰঙা বিলাহী') },

  // Daily Healthcare & Household
  { id: 'medicine', emoji: '💊', category: 'daily-objects', label: L('Daily medicine', 'दैनिक दवाई', 'দৈনিক ঔষধ') },
  { id: 'umbrella', emoji: '☂️', category: 'daily-objects', label: L('Rain umbrella', 'बारिश का छाता', 'বৰষুণৰ ছাতি') },
  { id: 'glasses', emoji: '👓', category: 'daily-objects', label: L('Reading glasses', 'पढ़ने का चश्मा', 'পঢ়া চশমা') },
  { id: 'key', emoji: '🔑', category: 'daily-objects', label: L('House key', 'घर की चाबी', 'ঘৰৰ চাবি') },
  { id: 'radio', emoji: '📻', category: 'daily-objects', label: L('Vintage radio', 'पुराना रेडियो', 'পুৰণি ৰেডিঅ’') },
  { id: 'lamp', emoji: '🪔', category: 'daily-objects', label: L('Clay oil lamp', 'मिट्टी का दीया', 'মাটিৰ চাকি') },
  { id: 'book', emoji: '📖', category: 'daily-objects', label: L('Prayer book', 'प्रार्थना पुस्तक', 'নামঘোষা পুথি') },
  { id: 'phone', emoji: '☎️', category: 'daily-objects', label: L('Family telephone', 'टेलीफोन', 'পৰিয়ালৰ টেলিফোন') },
  { id: 'soap', emoji: '🧼', category: 'daily-objects', label: L('Bath soap', 'साबुन', 'গা-ধোৱা চাবোন') },
  { id: 'towel', emoji: '🧻', category: 'daily-objects', label: L('Clean towel', 'साफ तौलिया', 'পৰিষ্কাৰ টাৱেল') },
  { id: 'shirt', emoji: '👕', category: 'clothing', label: L('Cotton kurta', 'सूती कुर्ता', 'কপাহী চোলা') },
  { id: 'shoe', emoji: '👟', category: 'clothing', label: L('Walking shoes', 'टहलने के जूते', 'খোজকঢ়া জোতা') },
];

export interface Routine { id: string; title: LocalizedText; steps: JourneyItem[] }
const item = (id: string) => journeyItems.find((entry) => entry.id === id) || journeyItems[0];

export const routines: Routine[] = [
  { id: 'tea', title: L('Make morning tea', 'सुबह की चाय बनाएँ', 'ৰাতিপুৱাৰ চাহ বনাওক'), steps: [item('kettle'), item('tea'), item('milk'), item('cup')] },
  { id: 'medicine', title: L('Take medicine safely', 'दवाई सुरक्षित लें', 'সুৰক্ষিতভাৱে ঔষধ লওক'), steps: [item('glasses'), item('medicine'), item('cup')] },
  { id: 'wash', title: L('Wash your hands', 'हाथ धोएँ', 'হাত ধোৱক'), steps: [item('soap'), item('towel')] },
  { id: 'dress', title: L('Get ready to go out', 'बाहर जाने के लिए तैयार हों', 'বাহিৰলৈ যাবলৈ সাজু হওক'), steps: [item('shirt'), item('shoe'), item('key')] },
  { id: 'market', title: L('Prepare for the market', 'बाज़ार की तैयारी', 'বজাৰলৈ সাজু হওক'), steps: [item('glasses'), item('umbrella'), item('basket'), item('key')] },
  { id: 'read', title: L('Settle down to read', 'पढ़ने की तैयारी', 'পঢ়িবলৈ সাজু হওক'), steps: [item('glasses'), item('lamp'), item('book')] },
  { id: 'call', title: L('Call the family', 'परिवार को फ़ोन करें', 'পৰিয়াললৈ ফোন কৰক'), steps: [item('glasses'), item('phone')] },
  { id: 'meal', title: L('Prepare a simple meal', 'सरल भोजन तैयार करें', 'সহজ আহাৰ সাজু কৰক'), steps: [item('rice'), item('fish'), item('tomato')] },
  { id: 'rain', title: L('Prepare for a rainy walk', 'बारिश में टहलने की तैयारी', 'বৰষুণত খোজ কাঢ়িবলৈ সাজু হওক'), steps: [item('shoe'), item('umbrella'), item('key')] },
  { id: 'bed', title: L('Prepare for bedtime', 'सोने की तैयारी', 'শুবলৈ সাজু হওক'), steps: [item('medicine'), item('cup'), item('lamp')] },
];

export const getGameDefinition = (type: JourneyGameType): GameDefinition & { emoji: string; colors: string } =>
  journeyDefinitions.find((game) => game.id === type) || journeyDefinitions[0];

export const domainForGame = (type: JourneyGameType): CognitiveDomain => getGameDefinition(type).domain;

/**
 * 12-Stage Difficulty Profiles for all 8 games.
 */
export const profileForStage = (type: JourneyGameType, stage: number): GameDifficultyProfile => {
  const safeStage = Math.max(1, Math.min(12, stage));
  const roundCount = safeStage >= 9 ? 5 : safeStage >= 5 ? 4 : 3;

  if (type === 'mahjong_memory') {
    // 12-stage Mahjong specification
    switch (safeStage) {
      case 1:
        return { stage: 1, tileCount: 6, pairCount: 3, mode: 'visible-match', previewDurationMs: 0, roundCount: 3, memoryLoad: 3, optionCount: 3, allowReplay: true };
      case 2:
        return { stage: 2, tileCount: 8, pairCount: 4, mode: 'visible-match', previewDurationMs: 0, roundCount: 3, memoryLoad: 4, optionCount: 4, allowReplay: true };
      case 3:
        return { stage: 3, tileCount: 10, pairCount: 5, mode: 'visible-match', previewDurationMs: 0, roundCount: 3, memoryLoad: 5, optionCount: 5, allowReplay: true };
      case 4:
        return { stage: 4, tileCount: 12, pairCount: 6, mode: 'visible-match', previewDurationMs: 0, roundCount: 3, memoryLoad: 6, optionCount: 6, allowReplay: true };
      case 5:
        return { stage: 5, tileCount: 8, pairCount: 4, mode: 'hidden-match', previewDurationMs: 6000, roundCount: 4, memoryLoad: 4, optionCount: 4, allowReplay: true };
      case 6:
        return { stage: 6, tileCount: 12, pairCount: 6, mode: 'hidden-match', previewDurationMs: 6000, roundCount: 4, memoryLoad: 6, optionCount: 6, allowReplay: true };
      case 7:
        return { stage: 7, tileCount: 12, pairCount: 6, mode: 'shuffle-memory', previewDurationMs: 5000, shuffleCount: 1, roundCount: 4, memoryLoad: 6, optionCount: 6, allowReplay: true };
      case 8:
        return { stage: 8, tileCount: 16, pairCount: 8, mode: 'shuffle-memory', previewDurationMs: 5000, shuffleCount: 1, roundCount: 4, memoryLoad: 8, optionCount: 8, allowReplay: true };
      case 9:
        return { stage: 9, tileCount: 16, pairCount: 8, mode: 'shuffle-memory', previewDurationMs: 4500, shuffleCount: 0, roundCount: 5, memoryLoad: 8, optionCount: 8, allowReplay: true };
      case 10:
        return { stage: 10, tileCount: 20, pairCount: 10, mode: 'shuffle-memory', previewDurationMs: 4500, shuffleCount: 1, roundCount: 5, memoryLoad: 10, optionCount: 10, allowReplay: true };
      case 11:
        return { stage: 11, tileCount: 20, pairCount: 10, mode: 'shuffle-memory', previewDurationMs: 4000, shuffleCount: 2, roundCount: 5, memoryLoad: 10, optionCount: 10, allowReplay: true };
      case 12:
      default:
        return { stage: 12, tileCount: 20, pairCount: 10, mode: 'shuffle-memory', previewDurationMs: 3500, shuffleCount: 2, roundCount: 5, memoryLoad: 10, optionCount: 10, allowReplay: true };
    }
  }

  let memoryLoad = Math.min(8, 3 + Math.floor((safeStage - 1) / 2));
  if (type === 'majuli_memory') {
    memoryLoad = safeStage <= 3 ? 3 : safeStage <= 6 ? 4 : safeStage <= 9 ? 6 : 8;
  }
  if (type === 'daily_steps') {
    memoryLoad = Math.min(6, 3 + Math.floor((safeStage - 1) / 3));
  }

  return {
    stage: safeStage,
    memoryLoad,
    previewDurationMs: Math.max(2200, 5600 - safeStage * 240),
    optionCount: safeStage >= 7 ? 4 : 3,
    roundCount,
    allowReplay: true,
  };
};

/**
 * Pure Progression Evaluation Logic (Shared between browser client and server)
 */

export interface SessionEvaluation {
  outcome: 'strong' | 'steady' | 'support-needed' | 'ignored';
  isFrontier: boolean;
}

export function evaluateSessionOutcome(
  session: JourneyGameSession | { accuracy: number; hintsUsed: number; mistakes: number; completionStatus: string; roundResults?: GameRoundResult[]; stage: number },
  currentProgress: GameProgress
): SessionEvaluation {
  const totalRounds = session.roundResults?.length || 3;
  const scoredRounds = session.roundResults?.filter((r) => r.responseMs > 0).length || 0;

  // Accidental exit before first scored round is ignored
  if (session.completionStatus === 'abandoned' && scoredRounds === 0) {
    return { outcome: 'ignored', isFrontier: false };
  }

  const isFrontier = session.stage >= currentProgress.unlockedStage || session.stage >= currentProgress.recommendedStage;

  // Support needed condition:
  // - Accuracy < 60% OR
  // - Hints used in at least half of the rounds OR
  // - Mistakes >= roundCount OR
  // - Abandoned after completing at least 1 scored round
  const supportNeeded =
    session.accuracy < 60 ||
    session.hintsUsed >= Math.ceil(totalRounds / 2) ||
    session.mistakes >= totalRounds ||
    (session.completionStatus === 'abandoned' && scoredRounds >= 1);

  if (supportNeeded) {
    return { outcome: 'support-needed', isFrontier };
  }

  // Strong session condition:
  // - Completed session
  // - Accuracy >= 80%
  // - Hints used <= 1
  // - Mistakes <= roundCount / 3
  // - Played at frontier
  const isStrong =
    session.completionStatus === 'completed' &&
    session.accuracy >= 80 &&
    session.hintsUsed <= 1 &&
    session.mistakes <= Math.floor(totalRounds / 3) &&
    isFrontier;

  if (isStrong) {
    return { outcome: 'strong', isFrontier: true };
  }

  return { outcome: 'steady', isFrontier };
}

export function computeNextProgress(
  currentProgress: GameProgress,
  session: JourneyGameSession,
  stageSource: 'recommended' | 'manual' = 'recommended'
): { updatedProgress: GameProgress; decision: DifficultyDecision } {
  const playedStage = session.stage;
  const prevUnlocked = currentProgress.unlockedStage;
  const prevRecommended = currentProgress.recommendedStage;
  const evaluation = evaluateSessionOutcome(session, currentProgress);

  let nextUnlocked = prevUnlocked;
  let nextRecommended = prevRecommended;
  let consecStrong = currentProgress.consecutiveStrong || 0;
  let consecSupport = currentProgress.consecutiveSupport || 0;
  let reasonCode: DifficultyDecision['reasonCode'] = 'remain-steady';
  let reasonText = 'Steady performance recorded. Continuing at the current stage.';
  let lastDecision: GameProgress['lastDecision'] = 'steady';

  if (evaluation.outcome === 'ignored') {
    return {
      updatedProgress: {
        ...currentProgress,
        lastPlayedStage: playedStage,
        lastStageSource: stageSource,
        updatedAt: new Date().toISOString(),
      },
      decision: {
        playedStage,
        previousRecommendedStage: prevRecommended,
        nextRecommendedStage: prevRecommended,
        previousUnlockedStage: prevUnlocked,
        unlockedStage: prevUnlocked,
        outcome: 'ignored',
        reasonCode: 'remain-steady',
      },
    };
  }

  if (stageSource === 'manual' && playedStage < prevUnlocked) {
    // Comfort replay
    if (evaluation.outcome === 'support-needed') {
      consecSupport += 1;
      consecStrong = 0;
      if (consecSupport >= 2) {
        nextRecommended = Math.max(1, prevRecommended - 1);
        consecSupport = 0;
        reasonCode = 'gentler-next-time';
        reasonText = 'Recommending a gentler stage after recent practice sessions.';
        lastDecision = 'gentler';
      } else {
        reasonCode = 'building-evidence';
        reasonText = 'Comfort replay recorded.';
        lastDecision = 'manual-replay';
      }
    } else {
      consecStrong = 0;
      consecSupport = 0;
      reasonCode = 'manual-comfort-replay';
      reasonText = 'Comfort replay completed. All unlocked stages remain available.';
      lastDecision = 'manual-replay';
    }
  } else if (evaluation.outcome === 'strong') {
    consecStrong += 1;
    consecSupport = 0;
    if (consecStrong >= 2) {
      consecStrong = 0;
      if (playedStage === prevUnlocked) {
        if (prevUnlocked >= 12) {
          nextUnlocked = 12;
          nextRecommended = 12;
          reasonCode = 'highest-stage';
          reasonText = 'Outstanding mastery! You are at the highest stage.';
          lastDecision = 'highest-stage';
        } else {
          nextUnlocked = Math.min(12, prevUnlocked + 1);
          nextRecommended = nextUnlocked;
          reasonCode = 'stage-unlocked';
          reasonText = `Wonderful consistency! Stage ${nextUnlocked} is now unlocked and ready.`;
          lastDecision = 'stage-unlocked';
        }
      } else if (playedStage < prevUnlocked) {
        nextRecommended = Math.min(prevUnlocked, prevRecommended + 1);
        reasonCode = 'stage-unlocked';
        reasonText = `Great focus! Recommending Stage ${nextRecommended}.`;
        lastDecision = 'steady';
      }
    } else {
      reasonCode = 'building-evidence';
      reasonText = 'Strong session! One more consistent session at this stage will unlock the next.';
      lastDecision = 'steady';
    }
  } else if (evaluation.outcome === 'support-needed') {
    consecSupport += 1;
    consecStrong = 0;
    if (consecSupport >= 2) {
      consecSupport = 0;
      nextRecommended = Math.max(1, prevRecommended - 1);
      reasonCode = 'gentler-next-time';
      reasonText = 'A gentler stage is recommended next time for your comfort.';
      lastDecision = 'gentler';
    } else {
      reasonCode = 'building-evidence';
      reasonText = 'Support noted. Practice comfortably at your own pace.';
      lastDecision = 'steady';
    }
  } else {
    // Steady session resets consecutive counters
    consecStrong = 0;
    consecSupport = 0;
    reasonCode = 'remain-steady';
    reasonText = 'Steady progress. Continuing at the current stage.';
    lastDecision = 'steady';
  }

  // Clamping
  nextUnlocked = Math.max(1, Math.min(12, nextUnlocked));
  nextRecommended = Math.max(1, Math.min(nextUnlocked, nextRecommended));

  const updatedProgress: GameProgress = {
    patientId: currentProgress.patientId,
    gameType: currentProgress.gameType,
    unlockedStage: nextUnlocked,
    recommendedStage: nextRecommended,
    lastPlayedStage: playedStage,
    lastStageSource: stageSource,
    lastDecision,
    reasonText,
    consecutiveStrong: consecStrong,
    consecutiveSupport: consecSupport,
    updatedAt: new Date().toISOString(),
  };

  const decision: DifficultyDecision = {
    playedStage,
    previousRecommendedStage: prevRecommended,
    nextRecommendedStage: nextRecommended,
    previousUnlockedStage: prevUnlocked,
    unlockedStage: nextUnlocked,
    outcome: evaluation.outcome,
    reasonCode,
  };

  return { updatedProgress, decision };
}

/**
 * Backward compatibility helper for legacy code
 */
export const nextStage = (type: JourneyGameType, sessions: JourneyGameSession[], progressMap?: Record<string, GameProgress>): number => {
  if (progressMap && progressMap[type]) {
    return progressMap[type].recommendedStage || progressMap[type].unlockedStage || 1;
  }
  const matching = sessions.filter((s) => s.gameType === type && s.completionStatus === 'completed');
  if (!matching.length) return 1;
  return matching.at(-1)?.stage || 1;
};

// Utilities
export const shuffle = <T,>(values: T[]): T[] => [...values].sort(() => Math.random() - 0.5);

export const chooseFreshItems = (count: number, recentIds: string[] = [], pool: JourneyItem[] = journeyItems): JourneyItem[] => {
  const individuallyUsed = new Set(recentIds.filter((value) => !value.includes('|')));
  const recentSets = new Set(
    recentIds
      .filter((value) => value.includes('|'))
      .map((value) => value.split('|')[1]?.split(',').sort().join(','))
      .filter(Boolean)
  );
  const fresh = pool.filter((entry) => !individuallyUsed.has(entry.id));
  const source = fresh.length >= count ? fresh : pool;
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const candidate = shuffle(source).slice(0, count);
    const signature = candidate.map((entry) => entry.id).sort().join(',');
    if (!recentSets.has(signature)) return candidate;
  }
  return shuffle(source).slice(0, count);
};

export const median = (values: number[]): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};

export const variability = (values: number[]): number => {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length));
};

export const summarizeRounds = (rounds: GameRoundResult[]) => ({
  accuracy: Math.round((rounds.filter((round) => round.correct).length / Math.max(1, rounds.length)) * 100),
  mistakes: rounds.reduce((sum, round) => sum + round.mistakes, 0),
  hintsUsed: rounds.reduce((sum, round) => sum + round.hintsUsed, 0),
  medianResponseMs: median(rounds.map((round) => round.responseMs)),
  responseVariabilityMs: variability(rounds.map((round) => round.responseMs)),
});
