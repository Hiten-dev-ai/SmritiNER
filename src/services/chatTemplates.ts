// Curated Multilingual Greeting Prompts and Safe Reactions Allowlist (Catalog Version 1)
// Non-negotiable safety: Patients cannot write arbitrary free-form text or record raw voice notes.

import type { LanguageCode } from '../types';

export const CHAT_CATALOG_VERSION = 1;

export type ChatTemplateCategory =
  | 'greetings'
  | 'wellbeing'
  | 'daily_life'
  | 'activities'
  | 'encouragement_rest';

export interface ChatTemplateDefinition {
  key: string;
  category: ChatTemplateCategory;
  categoryTitle: Record<LanguageCode, string>;
  text: Record<LanguageCode, string>;
  shortLabel: Record<LanguageCode, string>;
}

export interface ChatReactionDefinition {
  code: 'wave' | 'smile' | 'heart' | 'flower' | 'tea';
  emoji: string;
  label: Record<LanguageCode, string>;
}

export const CHAT_TEMPLATES: ChatTemplateDefinition[] = [
  // 1. Greetings
  {
    key: 'hello',
    category: 'greetings',
    categoryTitle: {
      English: 'Greetings',
      Hindi: 'अभिवादन',
      Assamese: 'সম্ভাষণ',
    },
    shortLabel: {
      English: 'Hello',
      Hindi: 'नमस्ते',
      Assamese: 'নমস্কাৰ',
    },
    text: {
      English: 'Hello! Wishing you a peaceful and cheerful day.',
      Hindi: 'नमस्ते! आपका दिन शुभ, शांत और सुखद हो।',
      Assamese: 'নমস্কাৰ! আপোনাৰ দিনটো শান্তিময় আৰু আনন্দদায়ক হওক।',
    },
  },
  {
    key: 'good_morning',
    category: 'greetings',
    categoryTitle: {
      English: 'Greetings',
      Hindi: 'अभिवादन',
      Assamese: 'সম্ভাষণ',
    },
    shortLabel: {
      English: 'Good morning',
      Hindi: 'शुभ प्रभात',
      Assamese: 'শুভ ৰাতিপুৱা',
    },
    text: {
      English: 'Good morning! I hope you rested well last night.',
      Hindi: 'शुभ प्रभात! आशा है आपकी रात अच्छी और सुकून भरी बीती।',
      Assamese: 'শুভ ৰাতিপুৱা! আশা কৰোঁ আপুনি ৰাতি ভালদৰে জিৰণি ল’লে।',
    },
  },
  {
    key: 'good_afternoon',
    category: 'greetings',
    categoryTitle: {
      English: 'Greetings',
      Hindi: 'अभिवादन',
      Assamese: 'সম্ভাষণ',
    },
    shortLabel: {
      English: 'Good afternoon',
      Hindi: 'शुभ दोपहर',
      Assamese: 'শুভ আবেলি',
    },
    text: {
      English: 'Good afternoon! Wishing you comfort and good spirits.',
      Hindi: 'शुभ दोपहर! आप स्वस्थ और सहज महसूस करें।',
      Assamese: 'শুভ আবেলি! আপোনাৰ মনটো আনন্দ আৰু আৰামত থাকক।',
    },
  },
  {
    key: 'good_evening',
    category: 'greetings',
    categoryTitle: {
      English: 'Greetings',
      Hindi: 'अभिवादन',
      Assamese: 'সম্ভাষণ',
    },
    shortLabel: {
      English: 'Good evening',
      Hindi: 'शुभ संध्या',
      Assamese: 'শুভ গধূলি',
    },
    text: {
      English: 'Good evening! I hope you had a pleasant day.',
      Hindi: 'शुभ संध्या! आशा है आपका दिन सुखमय बीता।',
      Assamese: 'শুভ গধূলি! আশা কৰোঁ দিনটো ভালদৰে পাৰ হ’ল।',
    },
  },

  // 2. Wellbeing
  {
    key: 'how_are_you',
    category: 'wellbeing',
    categoryTitle: {
      English: 'How are you?',
      Hindi: 'हालचाल',
      Assamese: 'কুশল বাৰ্তা',
    },
    shortLabel: {
      English: 'How are you?',
      Hindi: 'आप कैसे हैं?',
      Assamese: 'আপোনাৰ কেনে লাগিছে?',
    },
    text: {
      English: 'How are you feeling today? Sending you warm regards.',
      Hindi: 'आज आप कैसा महसूस कर रहे हैं? सप्रेम शुभकामनाएँ।',
      Assamese: 'আজি আপোনাৰ গা কেমন লাগিছে? আন্তৰিক শুভেচ্ছা জনালোঁ।',
    },
  },
  {
    key: 'thinking_of_you',
    category: 'wellbeing',
    categoryTitle: {
      English: 'How are you?',
      Hindi: 'हालचाल',
      Assamese: 'কুশল বাৰ্তা',
    },
    shortLabel: {
      English: 'Thinking of you',
      Hindi: 'आपकी याद आई',
      Assamese: 'আপোনাৰ কথা মনত পৰিছে',
    },
    text: {
      English: 'Thinking of you today and wishing you peace.',
      Hindi: 'आज आपकी याद आ रही थी, स्नेह और शुभकामनाएँ भेज रहा हूँ।',
      Assamese: 'আজি আপোনাৰ কথা মনত পৰিছে আৰু মৰম জনাইছোঁ।',
    },
  },
  {
    key: 'hope_comfortable',
    category: 'wellbeing',
    categoryTitle: {
      English: 'How are you?',
      Hindi: 'हालचाल',
      Assamese: 'কুশল বাৰ্তা',
    },
    shortLabel: {
      English: 'Stay comfortable',
      Hindi: 'आराम से रहें',
      Assamese: 'আৰামত থাকক',
    },
    text: {
      English: 'I hope you are feeling comfortable and in good health.',
      Hindi: 'आशा है आप बिल्कुल सहज, शांत और स्वस्थ महसूस कर रहे हैं।',
      Assamese: 'আশা কৰোঁ আপুনি সম্পূৰ্ণ সুস্থ আৰু আৰামত আছে।',
    },
  },

  // 3. Daily Life
  {
    key: 'had_tea',
    category: 'daily_life',
    categoryTitle: {
      English: 'Tea & Daily Life',
      Hindi: 'चाय और दिनचर्या',
      Assamese: 'চাহ আৰু নিয়ম',
    },
    shortLabel: {
      English: 'Have you had tea?',
      Hindi: 'चाय पी ली?',
      Assamese: 'চাহ খালে নে?',
    },
    text: {
      English: 'Have you had your warm cup of tea today?',
      Hindi: 'क्या आज आपने अपनी गरमा-गरम चाय पी ली?',
      Assamese: 'আজি আপুনি গৰম একাঁহী চাহ খালে নে?',
    },
  },
  {
    key: 'enjoying_the_day',
    category: 'daily_life',
    categoryTitle: {
      English: 'Tea & Daily Life',
      Hindi: 'चाय और दिनचर्या',
      Assamese: 'চাহ আৰু নিয়ম',
    },
    shortLabel: {
      English: 'Enjoying the day',
      Hindi: 'दिन का आनंद',
      Assamese: 'দিনটো উপভোগ',
    },
    text: {
      English: 'Enjoying the gentle breeze and calm surroundings today.',
      Hindi: 'ताज़ा हवा और शांत वातावरण का आनंद ले रहे हैं।',
      Assamese: 'মৃদু বতাহ আৰু শান্ত পৰিৱেশটো উপভোগ কৰিছোঁ।',
    },
  },

  // 4. Activities & Games
  {
    key: 'play_memory_game',
    category: 'activities',
    categoryTitle: {
      English: 'Games & Activities',
      Hindi: 'खेल और यादें',
      Assamese: 'খেল আৰু স্মৃতি',
    },
    shortLabel: {
      English: 'Play a memory game?',
      Hindi: 'दिमागी खेल खेलें?',
      Assamese: 'স্মৃতি খেল খেলিব নে?',
    },
    text: {
      English: 'Would you like to play a calm memory game today?',
      Hindi: 'क्या आप आज कोई शांत दिमागी खेल खेलना चाहेंगे?',
      Assamese: 'আপুনি আজি এটা শান্ত স্মৃতি খেল খেলিব নেকি?',
    },
  },
  {
    key: 'listening_to_music',
    category: 'activities',
    categoryTitle: {
      English: 'Games & Activities',
      Hindi: 'खेल और यादें',
      Assamese: 'খেল আৰু স্মৃতি',
    },
    shortLabel: {
      English: 'Listening to songs',
      Hindi: 'गीत सुन रहे हैं',
      Assamese: 'গান শুনি আছোঁ',
    },
    text: {
      English: 'Listening to some sweet old traditional melodies.',
      Hindi: 'पुराने मधुर और पारंपरिक गीत सुन रहे हैं।',
      Assamese: 'পুৰণি মিঠা লোকগীত কিছুমান শুনি আছোঁ।',
    },
  },

  // 5. Encouragement & Rest
  {
    key: 'take_care',
    category: 'encouragement_rest',
    categoryTitle: {
      English: 'Rest & Goodbye',
      Hindi: 'विश्राम और विदा',
      Assamese: 'জিৰণি আৰু বিদায়',
    },
    shortLabel: {
      English: 'Take care',
      Hindi: 'ख़्याल रखिएगा',
      Assamese: 'যত্ন ল’ব',
    },
    text: {
      English: 'Take good care of yourself and rest well.',
      Hindi: 'अपना बहुत अच्छे से ख़्याल रखिएगा और आराम कीजिएगा।',
      Assamese: 'আপোনাৰ ভালদৰে যত্ন ল’ব আৰু জিৰণি ল’ব।',
    },
  },
  {
    key: 'resting_now',
    category: 'encouragement_rest',
    categoryTitle: {
      English: 'Rest & Goodbye',
      Hindi: 'विश्राम और विदा',
      Assamese: 'জিৰণি আৰু বিদায়',
    },
    shortLabel: {
      English: 'Resting now',
      Hindi: 'आराम कर रहा हूँ',
      Assamese: 'জিৰণি লৈছোঁ',
    },
    text: {
      English: 'I am resting now for a while. It was nice connecting.',
      Hindi: 'मैं अभी कुछ समय आराम कर रहा हूँ। आपसे जुड़कर अच्छा लगा।',
      Assamese: 'মই এতিয়া অলপ জিৰণি লৈছোঁ। আপোনাৰ লগত কথা পাতি ভাল লাগিল।',
    },
  },
  {
    key: 'talk_later',
    category: 'encouragement_rest',
    categoryTitle: {
      English: 'Rest & Goodbye',
      Hindi: 'विश्राम और विदा',
      Assamese: 'জিৰণি আৰু বিদায়',
    },
    shortLabel: {
      English: 'Speak soon',
      Hindi: 'फिर मिलेंगे',
      Assamese: 'আকৌ কথা হ’ম',
    },
    text: {
      English: 'It was lovely hearing from you. Let us speak again soon!',
      Hindi: 'आपसे मिलकर बहुत प्रसन्नता हुई। जल्द ही फिर बात करेंगे!',
      Assamese: 'আপোনাৰ খবৰ পাই বহুত আনন্দ পালোঁ। সোনকালে আকৌ কথা হ’ম!',
    },
  },
];

export const CHAT_REACTIONS: ChatReactionDefinition[] = [
  {
    code: 'wave',
    emoji: '👋',
    label: {
      English: 'Friendly Wave',
      Hindi: 'नमस्ते इशारा',
      Assamese: 'হাত জোকাৰা',
    },
  },
  {
    code: 'smile',
    emoji: '😊',
    label: {
      English: 'Warm Smile',
      Hindi: 'मधुर मुस्कान',
      Assamese: 'মৰমৰ হাঁহি',
    },
  },
  {
    code: 'heart',
    emoji: '❤️',
    label: {
      English: 'Warm Heart',
      Hindi: 'स्नेह / प्यार',
      Assamese: 'আন্তৰিক মৰম',
    },
  },
  {
    code: 'flower',
    emoji: '🌸',
    label: {
      English: 'Garden Flower',
      Hindi: 'सुंदर फूल',
      Assamese: 'ফুলৰ উপহাৰ',
    },
  },
  {
    code: 'tea',
    emoji: '☕',
    label: {
      English: 'Assam Tea',
      Hindi: 'गरम चाय',
      Assamese: 'একাঁহী চাহ',
    },
  },
];

export const TEMPLATE_LOOKUP = new Map<string, ChatTemplateDefinition>(
  CHAT_TEMPLATES.map((t) => [t.key, t])
);

export const REACTION_LOOKUP = new Map<string, ChatReactionDefinition>(
  CHAT_REACTIONS.map((r) => [r.code, r])
);

export function getTemplate(key?: string | null): ChatTemplateDefinition | undefined {
  if (!key) return undefined;
  return TEMPLATE_LOOKUP.get(key);
}

export function getReaction(code?: string | null): ChatReactionDefinition | undefined {
  if (!code) return undefined;
  return REACTION_LOOKUP.get(code);
}
