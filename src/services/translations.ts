export type LanguageCode = 'Assamese' | 'Hindi' | 'English';

export interface TranslationDictionary {
  appTitle: string;
  appSubtitle: string;
  language: string;
  sound: string;
  soundOn: string;
  highContrast: string;
  standardContrast: string;
  elderMode: string;
  caregiverMode: string;
  caregiverAccess: string;
  online: string;
  offlineSaved: string;
  welcome: string;
  demoProfile: string;
  mindGames: string;
  mindGamesDesc: string;
  dailyCare: string;
  dailyCareDesc: string;
  photoLane: string;
  photoLaneDesc: string;
  activities: string;
  checklist: string;
  openPhotos: string;
  hydrationTitle: string;
  glasses: string;
  remaining: string;
  targetAchieved: string;
  addGlass: string;
  upNext: string;
  overdue: string;
  upcoming: string;
  viewRoutine: string;
  noUpcoming: string;
  emergencySos: string;
  callFamily: string;
  selectActivity: string;
  startExercise: string;
  memory: string;
  attention: string;
  executiveRecall: string;
  patterns: string;
  reminiscence: string;
  majuliTitle: string;
  majuliSubtitle: string;
  harvestTitle: string;
  harvestSubtitle: string;
  sequenceTitle: string;
  sequenceSubtitle: string;
  weaveTitle: string;
  weaveSubtitle: string;
  albumTitle: string;
  albumSubtitle: string;
  home: string;
  todaysRoutine: string;
  today: string;
  done: string;
  allActivities: string;
  medicinesOnly: string;
  routinesOnly: string;
  exit: string;
  hint: string;
  playAgain: string;
  backToMenu: string;
  level: string;
  score: string;
  accuracy: string;
  time: string;
}

export const translations: Record<LanguageCode, TranslationDictionary> = {
  English: {
    appTitle: 'SmritiNER', appSubtitle: 'Memory, routine and wellbeing support',
    language: 'Language', sound: 'Calming sound', soundOn: 'Sound on',
    highContrast: 'High contrast', standardContrast: 'Standard contrast',
    elderMode: 'Elder Mode', caregiverMode: 'Caregiver Dashboard', caregiverAccess: 'Caregiver access',
    online: 'Online', offlineSaved: 'Offline — saved on this device',
    welcome: 'Welcome', demoProfile: 'Demo profile',
    mindGames: 'Mind Games', mindGamesDesc: 'Memory & focus',
    dailyCare: 'Daily Routine', dailyCareDesc: 'Health & medicines',
    photoLane: 'Photo Album', photoLaneDesc: 'Cherished memories',
    activities: '5 activities', checklist: 'Checklist', openPhotos: 'Open photos',
    hydrationTitle: 'Daily Hydration', glasses: 'glasses', remaining: 'glasses remaining',
    targetAchieved: 'Target achieved', addGlass: 'Add glass',
    upNext: 'Up next', overdue: 'Overdue', upcoming: 'Upcoming', viewRoutine: 'View routine',
    noUpcoming: 'All scheduled items are complete for today.',
    emergencySos: 'Emergency support', callFamily: 'Call family',
    selectActivity: 'Select Mind Activity', startExercise: 'Start exercise',
    memory: 'Memory', attention: 'Attention', executiveRecall: 'Executive recall', patterns: 'Patterns', reminiscence: 'Reminiscence',
    majuliTitle: 'Majuli Memory Match', majuliSubtitle: 'Visual heritage pairing',
    harvestTitle: 'Tea Garden Harvest', harvestSubtitle: 'Focus & quick reaction',
    sequenceTitle: 'Daily Life Sequence', sequenceSubtitle: 'Routine chronology',
    weaveTitle: 'Weave the Pattern', weaveSubtitle: 'Textile motif logic',
    albumTitle: 'Photo Memory Lane', albumSubtitle: 'Family & heritage recall',
    home: 'Home', todaysRoutine: "Today's Routine & Medicines", today: 'Today', done: 'done',
    allActivities: 'All items', medicinesOnly: 'Medicines only', routinesOnly: 'Routine & care',
    exit: 'Exit', hint: 'Hint', playAgain: 'Play again', backToMenu: 'Back to menu',
    level: 'Level', score: 'Score', accuracy: 'Accuracy', time: 'Time',
  },
  Hindi: {
    appTitle: 'स्मृतिNER', appSubtitle: 'याददाश्त, दिनचर्या और स्वास्थ्य सहायता',
    language: 'भाषा', sound: 'शांत ध्वनि', soundOn: 'ध्वनि चालू',
    highContrast: 'गहरा कंट्रास्ट', standardContrast: 'सामान्य कंट्रास्ट',
    elderMode: 'वरिष्ठ मोड', caregiverMode: 'देखभालकर्ता डैशबोर्ड', caregiverAccess: 'देखभालकर्ता प्रवेश',
    online: 'ऑनलाइन', offlineSaved: 'ऑफ़लाइन — इस डिवाइस पर सुरक्षित',
    welcome: 'नमस्ते', demoProfile: 'डेमो प्रोफ़ाइल',
    mindGames: 'दिमागी खेल', mindGamesDesc: 'याददाश्त और ध्यान',
    dailyCare: 'दैनिक दिनचर्या', dailyCareDesc: 'स्वास्थ्य और दवाइयाँ',
    photoLane: 'फोटो एल्बम', photoLaneDesc: 'प्यारी यादें',
    activities: '5 गतिविधियाँ', checklist: 'जाँच सूची', openPhotos: 'फोटो खोलें',
    hydrationTitle: 'दैनिक जल सेवन', glasses: 'गिलास', remaining: 'गिलास बाकी',
    targetAchieved: 'लक्ष्य पूरा हुआ', addGlass: 'एक गिलास जोड़ें',
    upNext: 'अगला काम', overdue: 'समय निकल गया', upcoming: 'आगामी', viewRoutine: 'दिनचर्या देखें',
    noUpcoming: 'आज के सभी निर्धारित काम पूरे हो गए हैं।',
    emergencySos: 'आपात सहायता', callFamily: 'परिवार को कॉल करें',
    selectActivity: 'दिमागी गतिविधि चुनें', startExercise: 'गतिविधि शुरू करें',
    memory: 'याददाश्त', attention: 'ध्यान', executiveRecall: 'क्रम स्मरण', patterns: 'पैटर्न', reminiscence: 'पुरानी यादें',
    majuliTitle: 'माजुली स्मृति मिलान', majuliSubtitle: 'सांस्कृतिक चित्र मिलाएँ',
    harvestTitle: 'चाय बागान खेल', harvestSubtitle: 'ध्यान और त्वरित प्रतिक्रिया',
    sequenceTitle: 'दैनिक कार्य क्रम', sequenceSubtitle: 'दिनचर्या सही क्रम में',
    weaveTitle: 'पैटर्न बुनें', weaveSubtitle: 'कपड़ा आकृति पहचान',
    albumTitle: 'फोटो स्मृति यात्रा', albumSubtitle: 'परिवार और विरासत स्मरण',
    home: 'मुख्य पृष्ठ', todaysRoutine: 'आज की दिनचर्या और दवाइयाँ', today: 'आज', done: 'पूरे',
    allActivities: 'सभी काम', medicinesOnly: 'केवल दवाइयाँ', routinesOnly: 'दिनचर्या और देखभाल',
    exit: 'बाहर जाएँ', hint: 'संकेत', playAgain: 'फिर खेलें', backToMenu: 'सूची पर लौटें',
    level: 'स्तर', score: 'अंक', accuracy: 'सटीकता', time: 'समय',
  },
  Assamese: {
    appTitle: 'স্মৃতিNER', appSubtitle: 'স্মৃতি, দৈনন্দিন কাম আৰু সুস্থতাৰ সহায়',
    language: 'ভাষা', sound: 'শান্ত সুৰ', soundOn: 'সুৰ চলি আছে',
    highContrast: 'উচ্চ কনট্ৰাষ্ট', standardContrast: 'সাধাৰণ কনট্ৰাষ্ট',
    elderMode: 'জ্যেষ্ঠ মোড', caregiverMode: 'পৰিচৰ্য্যাকাৰীৰ ডেশ্বব’ৰ্ড', caregiverAccess: 'পৰিচৰ্য্যাকাৰীৰ প্ৰৱেশ',
    online: 'অনলাইন', offlineSaved: 'অফলাইন — এই ডিভাইচত সংৰক্ষিত',
    welcome: 'স্বাগতম', demoProfile: 'ডেমো প্ৰ’ফাইল',
    mindGames: 'মগজুৰ খেল', mindGamesDesc: 'স্মৃতি আৰু মনোযোগ',
    dailyCare: 'দৈনিক নিয়ম', dailyCareDesc: 'স্বাস্থ্য আৰু ঔষধ',
    photoLane: 'ফটো এলবাম', photoLaneDesc: 'আপোন স্মৃতি',
    activities: '৫টা কাৰ্যকলাপ', checklist: 'তালিকা', openPhotos: 'ফটো খোলক',
    hydrationTitle: 'দৈনিক পানী', glasses: 'গিলাচ', remaining: 'গিলাচ বাকী',
    targetAchieved: 'লক্ষ্য পূৰ্ণ হৈছে', addGlass: 'এগিলাচ যোগ কৰক',
    upNext: 'পৰৱৰ্তী কাম', overdue: 'সময় পাৰ হৈছে', upcoming: 'আগন্তুক', viewRoutine: 'নিয়ম চাওক',
    noUpcoming: 'আজিৰ সকলো নিৰ্ধাৰিত কাম সম্পূৰ্ণ হৈছে।',
    emergencySos: 'জৰুৰী সহায়', callFamily: 'পৰিয়াললৈ ফোন কৰক',
    selectActivity: 'মগজুৰ কাৰ্যকলাপ বাছক', startExercise: 'আৰম্ভ কৰক',
    memory: 'স্মৃতি', attention: 'মনোযোগ', executiveRecall: 'ক্ৰম স্মৰণ', patterns: 'নক্সা', reminiscence: 'পুৰণি স্মৃতি',
    majuliTitle: 'মাজুলী স্মৃতি মিল', majuliSubtitle: 'ঐতিহ্যৰ ছবি মিলাওক',
    harvestTitle: 'চাহ বাগিচা খেল', harvestSubtitle: 'মনোযোগ আৰু দ্ৰুত সঁহাৰি',
    sequenceTitle: 'দৈনিক কামৰ ক্ৰম', sequenceSubtitle: 'নিয়মীয়া কাম সজাওক',
    weaveTitle: 'নক্সা বোৱক', weaveSubtitle: 'কাপোৰৰ আৰ্হি চিনাক্তকৰণ',
    albumTitle: 'ফটো স্মৃতি পথ', albumSubtitle: 'পৰিয়াল আৰু ঐতিহ্য স্মৰণ',
    home: 'মূল পৃষ্ঠা', todaysRoutine: 'আজিৰ নিয়ম আৰু ঔষধ', today: 'আজি', done: 'সম্পূৰ্ণ',
    allActivities: 'সকলো কাম', medicinesOnly: 'কেৱল ঔষধ', routinesOnly: 'নিয়ম আৰু যত্ন',
    exit: 'বাহিৰ হওক', hint: 'সহায়', playAgain: 'পুনৰ খেলক', backToMenu: 'তালিকালৈ উভতক',
    level: 'স্তৰ', score: 'নম্বৰ', accuracy: 'শুদ্ধতা', time: 'সময়',
  },
};
