import type { CognitiveDomain, GameDefinition, GameDifficultyProfile, GameRoundResult, JourneyGameSession } from '../types';

export type JourneyGameType = 'majuli_memory' | 'tea_tray_recall' | 'market_list_recall' | 'missing_object' | 'daily_steps' | 'weave_pattern' | 'memory_lane';
export interface LocalizedText { English: string; Hindi: string; Assamese: string }
export interface JourneyItem { id: string; emoji: string; label: LocalizedText }
const L = (English: string, Hindi: string, Assamese: string): LocalizedText => ({ English, Hindi, Assamese });

export const journeyDefinitions: Array<GameDefinition & { id: JourneyGameType; emoji: string; colors: string }> = [
  { id: 'majuli_memory', title: 'Majuli Memory Match', subtitle: 'Flip and match familiar pairs', domain: 'visual-memory', estimatedMinutes: 3, emoji: '🦏', colors: 'from-emerald-500 to-tea-800' },
  { id: 'tea_tray_recall', title: 'Tea Tray Recall', subtitle: 'Remember the serving order', domain: 'working-memory', estimatedMinutes: 3, emoji: '🫖', colors: 'from-amber-500 to-orange-700' },
  { id: 'market_list_recall', title: 'Market List Recall', subtitle: 'Remember everyday shopping items', domain: 'memory', estimatedMinutes: 3, emoji: '🧺', colors: 'from-lime-500 to-emerald-700' },
  { id: 'missing_object', title: 'What Went Missing?', subtitle: 'Notice which object disappeared', domain: 'recognition', estimatedMinutes: 3, emoji: '🔍', colors: 'from-sky-500 to-blue-700' },
  { id: 'daily_steps', title: 'Simple Daily Steps', subtitle: 'Put a familiar routine in order', domain: 'sequencing', estimatedMinutes: 4, emoji: '🌤️', colors: 'from-orange-500 to-rose-700' },
  { id: 'weave_pattern', title: 'Weave the Pattern', subtitle: 'Complete a colourful textile rhythm', domain: 'pattern-recognition', estimatedMinutes: 3, emoji: '🧣', colors: 'from-rose-500 to-purple-700' },
  { id: 'memory_lane', title: 'Memory Lane', subtitle: 'Gentle family and place recall', domain: 'reminiscence', estimatedMinutes: 4, emoji: '📸', colors: 'from-violet-500 to-indigo-700' },
];

export const journeyGameNames: Record<JourneyGameType, { title: LocalizedText; subtitle: LocalizedText }> = {
  majuli_memory: { title: L('Majuli Memory Match', 'माजुली स्मृति मिलान', 'মাজুলী স্মৃতি মিল'), subtitle: L('Flip and match familiar pairs', 'परिचित जोड़े मिलाएँ', 'চিনাকি যোৰা মিলাওক') },
  tea_tray_recall: { title: L('Tea Tray Recall', 'चाय ट्रे स्मरण', 'চাহৰ ট্ৰে স্মৰণ'), subtitle: L('Remember the serving order', 'परोसने का क्रम याद रखें', 'পৰিবেশনৰ ক্ৰম মনত ৰাখক') },
  market_list_recall: { title: L('Market List Recall', 'बाज़ार सूची स्मरण', 'বজাৰৰ তালিকা স্মৰণ'), subtitle: L('Remember everyday shopping items', 'रोज़मर्रा की चीज़ें याद रखें', 'দৈনন্দিন বজাৰৰ বস্তু মনত ৰাখক') },
  missing_object: { title: L('What Went Missing?', 'क्या गायब हुआ?', 'কি নোহোৱা হ’ল?'), subtitle: L('Notice which object disappeared', 'गायब चीज़ पहचानें', 'নোহোৱা বস্তুটো চিনাক্ত কৰক') },
  daily_steps: { title: L('Simple Daily Steps', 'सरल दैनिक चरण', 'সহজ দৈনিক খোজ'), subtitle: L('Put a familiar routine in order', 'परिचित दिनचर्या क्रम में रखें', 'চিনাকি কাম ক্ৰমত সজাওক') },
  weave_pattern: { title: L('Weave the Pattern', 'पैटर्न बुनें', 'নক্সা বোৱক'), subtitle: L('Complete a colourful textile rhythm', 'कपड़े का क्रम पूरा करें', 'ৰঙীন কাপোৰৰ ক্ৰম সম্পূৰ্ণ কৰক') },
  memory_lane: { title: L('Memory Lane', 'स्मृति यात्रा', 'স্মৃতি পথ'), subtitle: L('Gentle family and place recall', 'परिवार और स्थान की यादें', 'পৰিয়াল আৰু ঠাইৰ স্মৃতি') },
};

export const localizedGame = (type: JourneyGameType, language: keyof LocalizedText) => ({
  ...getGameDefinition(type),
  title: journeyGameNames[type].title[language],
  subtitle: journeyGameNames[type].subtitle[language],
});

export const journeyItems: JourneyItem[] = [
  { id: 'rhino', emoji: '🦏', label: L('Rhino', 'गैंडा', 'গঁড়') }, { id: 'dhol', emoji: '🥁', label: L('Bihu drum', 'बिहू ढोल', 'বিহু ঢোল') },
  { id: 'tea', emoji: '🍃', label: L('Tea leaf', 'चाय पत्ती', 'চাহপাত') }, { id: 'gamosa', emoji: '🧣', label: L('Gamosa', 'गमछा', 'গামোচা') },
  { id: 'bamboo', emoji: '🎋', label: L('Bamboo', 'बाँस', 'বাঁহ') }, { id: 'mask', emoji: '🎭', label: L('Majuli mask', 'माजुली मुखौटा', 'মাজুলীৰ মুখা') },
  { id: 'hornbill', emoji: '🦜', label: L('Hornbill', 'हॉर्नबिल', 'ধনেশ') }, { id: 'silk', emoji: '🦋', label: L('Muga silk', 'मूगा रेशम', 'মুগা ৰেচম') },
  { id: 'cup', emoji: '☕', label: L('Tea cup', 'चाय का कप', 'চাহৰ কাপ') }, { id: 'kettle', emoji: '🫖', label: L('Kettle', 'केतली', 'কেটলী') },
  { id: 'biscuit', emoji: '🍪', label: L('Biscuit', 'बिस्कुट', 'বিস্কুট') }, { id: 'flower', emoji: '🌺', label: L('Flower', 'फूल', 'ফুল') },
  { id: 'spoon', emoji: '🥄', label: L('Spoon', 'चम्मच', 'চামুচ') }, { id: 'milk', emoji: '🥛', label: L('Milk', 'दूध', 'গাখীৰ') },
  { id: 'rice', emoji: '🍚', label: L('Rice', 'चावल', 'চাউল') }, { id: 'banana', emoji: '🍌', label: L('Banana', 'केला', 'কল') },
  { id: 'fish', emoji: '🐟', label: L('Fish', 'मछली', 'মাছ') }, { id: 'tomato', emoji: '🍅', label: L('Tomato', 'टमाटर', 'বিলাহী') },
  { id: 'medicine', emoji: '💊', label: L('Medicine', 'दवाई', 'ঔষধ') }, { id: 'umbrella', emoji: '☂️', label: L('Umbrella', 'छाता', 'ছাতি') },
  { id: 'glasses', emoji: '👓', label: L('Glasses', 'चश्मा', 'চশমা') }, { id: 'key', emoji: '🔑', label: L('Key', 'चाबी', 'চাবি') },
  { id: 'radio', emoji: '📻', label: L('Radio', 'रेडियो', 'ৰেডিঅ’') }, { id: 'lamp', emoji: '🪔', label: L('Lamp', 'दीया', 'চাকি') },
  { id: 'book', emoji: '📖', label: L('Book', 'किताब', 'কিতাপ') }, { id: 'phone', emoji: '☎️', label: L('Telephone', 'टेलीफोन', 'টেলিফোন') },
  { id: 'soap', emoji: '🧼', label: L('Soap', 'साबुन', 'চাবোন') }, { id: 'towel', emoji: '🧻', label: L('Towel', 'तौलिया', 'টাৱেল') },
  { id: 'shirt', emoji: '👕', label: L('Shirt', 'कमीज़', 'চোলা') }, { id: 'shoe', emoji: '👟', label: L('Shoes', 'जूते', 'জোতা') },
];

export interface Routine { id: string; title: LocalizedText; steps: JourneyItem[] }
const item = (id: string) => journeyItems.find((entry) => entry.id === id)!;
export const routines: Routine[] = [
  { id: 'tea', title: L('Make morning tea', 'सुबह की चाय बनाएँ', 'ৰাতিপুৱাৰ চাহ বনাওক'), steps: [item('kettle'), item('tea'), item('milk'), item('cup')] },
  { id: 'medicine', title: L('Take medicine safely', 'दवाई सुरक्षित लें', 'সুৰক্ষিতভাৱে ঔষধ লওক'), steps: [item('glasses'), item('medicine'), item('cup')] },
  { id: 'wash', title: L('Wash your hands', 'हाथ धोएँ', 'হাত ধোৱক'), steps: [item('soap'), item('towel')] },
  { id: 'dress', title: L('Get ready to go out', 'बाहर जाने के लिए तैयार हों', 'বাহিৰলৈ যাবলৈ সাজু হওক'), steps: [item('shirt'), item('shoe'), item('key')] },
  { id: 'market', title: L('Prepare for the market', 'बाज़ार की तैयारी', 'বজাৰলৈ সাজু হওক'), steps: [item('glasses'), item('umbrella'), item('key')] },
  { id: 'read', title: L('Settle down to read', 'पढ़ने की तैयारी', 'পঢ়িবলৈ সাজু হওক'), steps: [item('glasses'), item('lamp'), item('book')] },
  { id: 'call', title: L('Call the family', 'परिवार को फ़ोन करें', 'পৰিয়াললৈ ফোন কৰক'), steps: [item('glasses'), item('phone')] },
  { id: 'meal', title: L('Prepare a simple meal', 'सरल भोजन तैयार करें', 'সহজ আহাৰ সাজু কৰক'), steps: [item('rice'), item('fish'), item('tomato')] },
  { id: 'rain', title: L('Prepare for a rainy walk', 'बारिश में टहलने की तैयारी', 'বৰষুণত খোজ কাঢ়িবলৈ সাজু হওক'), steps: [item('shoe'), item('umbrella'), item('key')] },
  { id: 'bed', title: L('Prepare for bedtime', 'सोने की तैयारी', 'শুবলৈ সাজু হওক'), steps: [item('medicine'), item('cup'), item('lamp')] },
];

export const getGameDefinition = (type: JourneyGameType) => journeyDefinitions.find((game) => game.id === type)!;
export const profileForStage = (type: JourneyGameType, stage: number): GameDifficultyProfile => {
  const safeStage = Math.max(1, Math.min(12, stage));
  const roundCount = safeStage >= 9 ? 5 : safeStage >= 5 ? 4 : 3;
  let memoryLoad = Math.min(8, 3 + Math.floor((safeStage - 1) / 2));
  if (type === 'majuli_memory') memoryLoad = safeStage <= 3 ? 3 : safeStage <= 6 ? 4 : safeStage <= 9 ? 6 : 8;
  if (type === 'daily_steps') memoryLoad = Math.min(5, 3 + Math.floor((safeStage - 1) / 4));
  return { stage: safeStage, memoryLoad, previewDurationMs: Math.max(2200, 5200 - safeStage * 220), optionCount: safeStage >= 7 ? 4 : 3, roundCount, allowReplay: safeStage <= 6 };
};

export const nextStage = (type: JourneyGameType, sessions: JourneyGameSession[]) => {
  const recent = sessions.filter((session) => session.gameType === type && session.completionStatus === 'completed').slice(-2);
  if (!recent.length) return 1;
  const previous = recent.at(-1)?.stage || 1;
  const average = recent.reduce((sum, session) => sum + session.accuracy, 0) / recent.length;
  const support = recent.reduce((sum, session) => sum + session.hintsUsed, 0);
  if (recent.length === 2 && average >= 85 && support <= 2) return Math.min(12, previous + 1);
  if (average < 60 || support >= 6) return Math.max(1, previous - 1);
  return previous;
};

export const shuffle = <T,>(values: T[]) => [...values].sort(() => Math.random() - 0.5);
export const chooseFreshItems = (count: number, recentIds: string[] = [], pool = journeyItems) => {
  const individuallyUsed = new Set(recentIds.filter((value) => !value.includes('|')));
  const recentSets = new Set(recentIds.filter((value) => value.includes('|')).map((value) => value.split('|')[1]?.split(',').sort().join(',')).filter(Boolean));
  const fresh = pool.filter((entry) => !individuallyUsed.has(entry.id));
  const source = fresh.length >= count ? fresh : pool;
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const candidate = shuffle(source).slice(0, count);
    const signature = candidate.map((entry) => entry.id).sort().join(',');
    if (!recentSets.has(signature)) return candidate;
  }
  return shuffle(source).slice(0, count);
};

export const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};
export const variability = (values: number[]) => {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length));
};

export const domainForGame = (type: JourneyGameType): CognitiveDomain => getGameDefinition(type).domain;
export const summarizeRounds = (rounds: GameRoundResult[]) => ({
  accuracy: Math.round((rounds.filter((round) => round.correct).length / Math.max(1, rounds.length)) * 100),
  mistakes: rounds.reduce((sum, round) => sum + round.mistakes, 0),
  hintsUsed: rounds.reduce((sum, round) => sum + round.hintsUsed, 0),
  medianResponseMs: median(rounds.map((round) => round.responseMs)),
  responseVariabilityMs: variability(rounds.map((round) => round.responseMs)),
});
