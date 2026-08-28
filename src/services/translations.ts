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
  accessibilitySettings: string;
  close: string;
  listen: string;
  stopListening: string;
  speechUnavailable: string;
  startGame: string;
  readyToBegin: string;
  dueNow: string;
  markDone: string;
  snooze: string;
  openRoutine: string;
  reminderAlert: string;
  reminderSound: string;
  recommendedActivity: string;
  otherActivities: string;
  nextStep: string;
  outstanding: string;
  wonderfulWork: string;
  goodEffort: string;
  encouragementStrong: string;
  encouragementSteady: string;
  encouragementPractice: string;
  adaptationStart: string;
  adaptationHarder: string;
  adaptationHighest: string;
  adaptationGentler: string;
  adaptationGentlest: string;
  adaptationSame: string;
  adaptationReminiscence: string;
  judgeDemoTools: string;
  judgeDemoDescription: string;
  localDemoAccess: string;
  majuliInstruction: string;
  harvestInstruction: string;
  sequenceInstruction: string;
  weaveInstruction: string;
  albumInstruction: string;
  pairsCleared: string;
  tapCard: string;
  timelineOrder: string;
  tapCardsInOrder: string;
  availableCards: string;
  resetSequence: string;
  step: string;
  patternQuestion: string;
  memoryRecallQuestion: string;
  hideClue: string;
  listenFamilyClue: string;
  correct: string;
  tryAgain: string;
  nextMemory: string;
  completeSession: string;
  noPhotos: string;
  noPhotosHelp: string;
  returnToMenu: string;
  basketReady: string;

  voiceAssist: string;
  voiceCommands: string;
  startListening: string;
  listening: string;
  speakNow: string;
  liveTranscript: string;
  commandRecognized: string;
  confirmAction: string;
  confirm: string;
  cancel: string;
  unsupportedBrowser: string;
  permissionDenied: string;
  noMicrophone: string;
  noSpeechHeard: string;
  recognitionNeedsNetwork: string;
  commandNotRecognized: string;
  assameseFallbackNotice: string;
  confirmHydration: string;
  confirmFamilyCall: string;
  nothingScheduledToday: string;
  allTasksCompleted: string;
  readRoutine: string;
  alertsCenter: string;
  overdueMedicine: string;
  missedAppointment: string;
  prolongedInactivity: string;
  sosAlertRaised: string;
  acknowledge: string;
  resolve: string;
  savedOnDevice: string;
  mahjongBlockedHelp: string;

  greetings: string;
  greetingsDesc: string;
  supervisionNotice: string;
  newContactApproved: string;
  newContactDesc: string;
  sayHello: string;
  notNow: string;
  waitingForFriend: string;
  waitingToSend: string;
  sentSafely: string;
  conversationResting: string;
  askCaregiverHelp: string;
  helpRequested: string;
  choosePrompt: string;
  sendGreeting: string;
  tapToSend: string;
  reactions: string;
  noConversationsYet: string;
  generateInvite: string;
  redeemInvite: string;
  inviteCode: string;
  enterInviteCode: string;
  heldMessages: string;
  releaseToPatient: string;
  hideFromPatient: string;
  muteContact: string;
  unmuteContact: string;
  emergencyBlock: string;
  auditTrail: string;
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
    activities: '8 activities', checklist: 'Checklist', openPhotos: 'Open photos',
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
    accessibilitySettings: 'Accessibility settings', close: 'Close', listen: 'Listen', stopListening: 'Stop listening',
    speechUnavailable: 'Read aloud is not available on this device.', startGame: 'Start game', readyToBegin: 'Ready when you are',
    dueNow: 'Due now', markDone: 'Mark done', snooze: 'Snooze 10 minutes', openRoutine: 'Open routine', reminderAlert: 'Reminder alert', reminderSound: 'Reminder sound',
    recommendedActivity: 'Recommended today', otherActivities: 'More activities', nextStep: 'What happens next',
    outstanding: 'Outstanding!', wonderfulWork: 'Wonderful work!', goodEffort: 'Good effort!',
    encouragementStrong: 'Your memory and focus were strong today.', encouragementSteady: 'You stayed focused and kept going.', encouragementPractice: 'Every gentle practice supports your routine.',
    adaptationStart: 'The next game will begin at a gentle starting level.', adaptationHarder: 'The next game will be a little more challenging after your steady answers.', adaptationHighest: 'The next game will stay at the highest level after your steady answers.', adaptationGentler: 'The next game will be gentler because more time or support was helpful.', adaptationGentlest: 'The next game will stay gentle so you can continue comfortably.', adaptationSame: 'The next game will stay at the same comfortable level.', adaptationReminiscence: 'This memory activity will stay gentle and reassuring.',
    judgeDemoTools: 'Judge Demo Tools', judgeDemoDescription: 'Show manual game levels for an SIH walkthrough. This resets when the tab closes.', localDemoAccess: 'Device-local demo access only',
    majuliInstruction: 'Match the pairs of familiar North Eastern symbols.', harvestInstruction: 'Tap fresh tea leaves and golden buds. Avoid twigs and caterpillars.', sequenceInstruction: 'Place the daily activities in the order they happen.', weaveInstruction: 'Choose the motif that completes the traditional pattern.', albumInstruction: 'Look at each familiar photo and choose the matching memory.',
    pairsCleared: 'pairs cleared', tapCard: 'Tap card', timelineOrder: 'Timeline order', tapCardsInOrder: 'Tap the cards below in order', availableCards: 'Available sequence cards', resetSequence: 'Reset sequence', step: 'Step', patternQuestion: 'Which motif correctly completes the weave?',
    memoryRecallQuestion: 'Memory question', hideClue: 'Hide family clue', listenFamilyClue: 'Listen to family clue', correct: 'Correct', tryAgain: 'Try again', nextMemory: 'Next cherished memory', completeSession: 'Complete session', noPhotos: 'No memory photos yet', noPhotosHelp: 'A caregiver can add family and regional photographs from the caregiver dashboard.', returnToMenu: 'Return to menu', basketReady: 'Basket ready',
    voiceAssist: 'Voice Commands', voiceCommands: 'Voice Commands', startListening: 'Start listening', listening: 'Listening...', speakNow: 'Speak a command (e.g. "Start memory game", "What do I do today", "Drink water")',
    liveTranscript: 'Listening for your command…', commandRecognized: 'Command recognized', confirmAction: 'Confirm Action', confirm: 'Confirm', cancel: 'Cancel',
    unsupportedBrowser: 'Voice input is not available on this browser. You can continue using the large buttons below.',
    permissionDenied: 'Microphone access was denied. Please check your browser permissions or use the buttons below.',
    noMicrophone: 'No microphone detected on this device. Please use the buttons below.',
    noSpeechHeard: 'No speech was heard. Please tap Start listening and speak clearly.',
    recognitionNeedsNetwork: 'Voice recognition may require an internet connection on some browsers.',
    commandNotRecognized: 'I did not recognise that command. Try saying "Start memory game" or use the buttons below.',
    assameseFallbackNotice: 'Assamese speech recognition is trying alternate language support.',
    confirmHydration: 'Confirm adding one glass of water?',
    confirmFamilyCall: 'Confirm calling your emergency contact / family?',
    nothingScheduledToday: 'Nothing is scheduled for today.',
    allTasksCompleted: 'All scheduled tasks and medicines are complete for today.',
    readRoutine: 'Read routine',
    alertsCenter: 'Caregiver Alert Centre', overdueMedicine: 'Overdue Medicine', missedAppointment: 'Missed Appointment',
    prolongedInactivity: 'Prolonged Inactivity Check-in', sosAlertRaised: 'Emergency SOS Raised',
    acknowledge: 'Acknowledge', resolve: 'Resolve', savedOnDevice: 'Saved on this device',
    mahjongBlockedHelp: 'This tile needs one free lateral side and no tile covering it from above.',

    greetings: 'Friends & Greetings',
    greetingsDesc: 'Caregiver-supervised greetings with approved friends',
    supervisionNotice: 'Caregivers on both sides can review all messages to keep everyone safe.',
    newContactApproved: 'New Approved Contact',
    newContactDesc: 'Your caregivers approved this trusted contact. Would you like to connect?',
    sayHello: 'Say hello',
    notNow: 'Not now',
    waitingForFriend: 'Waiting for your friend to say hello before sending messages.',
    waitingToSend: 'Waiting to send — your contact and caregivers cannot see this yet.',
    sentSafely: 'Sent safely',
    conversationResting: 'This conversation is resting for now.',
    askCaregiverHelp: 'Ask my caregiver for help',
    helpRequested: 'Help requested — your caregiver has been notified.',
    choosePrompt: 'Choose a greeting prompt',
    sendGreeting: 'Send Greeting',
    tapToSend: 'Tap to send safely',
    reactions: 'Safe Reactions',
    noConversationsYet: 'No approved friends yet. A caregiver can invite contacts from their dashboard.',
    generateInvite: 'Generate 24-hr Invite Code',
    redeemInvite: 'Accept / Redeem Invite Code',
    inviteCode: 'Invite Code',
    enterInviteCode: 'Enter the 10-character code provided by the other family',
    heldMessages: 'Held Messages for Review',
    releaseToPatient: 'Release to Patient',
    hideFromPatient: 'Hide from Patient',
    muteContact: 'Mute Contact',
    unmuteContact: 'Unmute Contact',
    emergencyBlock: 'Emergency Block',
    auditTrail: 'Audit Trail',
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
    activities: '8 गतिविधियाँ', checklist: 'जाँच सूची', openPhotos: 'फोटो खोलें',
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
    accessibilitySettings: 'सुलभता सेटिंग', close: 'बंद करें', listen: 'सुनें', stopListening: 'सुनना बंद करें',
    speechUnavailable: 'इस डिवाइस पर पढ़कर सुनाने की सुविधा उपलब्ध नहीं है।', startGame: 'खेल शुरू करें', readyToBegin: 'जब आप तैयार हों',
    dueNow: 'अभी समय है', markDone: 'पूरा किया', snooze: '10 मिनट बाद', openRoutine: 'दिनचर्या खोलें', reminderAlert: 'याद दिलाने की सूचना', reminderSound: 'याद दिलाने की ध्वनि',
    recommendedActivity: 'आज के लिए सुझाव', otherActivities: 'और गतिविधियाँ', nextStep: 'आगे क्या होगा',
    outstanding: 'बहुत बढ़िया!', wonderfulWork: 'शानदार काम!', goodEffort: 'अच्छा प्रयास!',
    encouragementStrong: 'आज आपकी याददाश्त और ध्यान बहुत अच्छे रहे।', encouragementSteady: 'आपने ध्यान बनाए रखा और प्रयास जारी रखा।', encouragementPractice: 'हर हल्का अभ्यास आपकी दिनचर्या को मजबूत करता है।',
    adaptationStart: 'अगला खेल हल्के शुरुआती स्तर से शुरू होगा।', adaptationHarder: 'लगातार सही उत्तरों के बाद अगला खेल थोड़ा कठिन होगा।', adaptationHighest: 'अगला खेल सबसे ऊँचे स्तर पर रहेगा।', adaptationGentler: 'अधिक समय या सहायता उपयोगी होने के कारण अगला खेल हल्का होगा।', adaptationGentlest: 'अगला खेल आरामदायक हल्के स्तर पर रहेगा।', adaptationSame: 'अगला खेल इसी आरामदायक स्तर पर रहेगा।', adaptationReminiscence: 'यह स्मृति गतिविधि हल्की और भरोसा देने वाली रहेगी।',
    judgeDemoTools: 'जज डेमो टूल', judgeDemoDescription: 'SIH प्रदर्शन के लिए मैनुअल स्तर दिखाएँ। टैब बंद होने पर यह रीसेट होगा।', localDemoAccess: 'केवल डिवाइस-स्थानीय डेमो प्रवेश',
    majuliInstruction: 'उत्तर-पूर्व के परिचित चिन्हों के जोड़े मिलाएँ।', harvestInstruction: 'ताज़ी चाय की पत्तियाँ और सुनहरी कलियाँ चुनें। टहनियों और कीड़ों से बचें।', sequenceInstruction: 'दैनिक गतिविधियों को सही क्रम में रखें।', weaveInstruction: 'पारंपरिक पैटर्न पूरा करने वाला चिन्ह चुनें।', albumInstruction: 'परिचित फोटो देखें और उससे जुड़ी सही याद चुनें।',
    pairsCleared: 'जोड़े पूरे', tapCard: 'कार्ड दबाएँ', timelineOrder: 'दिनचर्या का क्रम', tapCardsInOrder: 'नीचे के कार्ड सही क्रम में दबाएँ', availableCards: 'उपलब्ध क्रम कार्ड', resetSequence: 'क्रम फिर शुरू करें', step: 'चरण', patternQuestion: 'कौन-सा चिन्ह बुनाई को सही पूरा करता है?',
    memoryRecallQuestion: 'याद का प्रश्न', hideClue: 'परिवार का संकेत छिपाएँ', listenFamilyClue: 'परिवार का संकेत सुनें', correct: 'सही', tryAgain: 'फिर प्रयास करें', nextMemory: 'अगली प्यारी याद', completeSession: 'सत्र पूरा करें', noPhotos: 'अभी कोई यादों की फोटो नहीं है', noPhotosHelp: 'देखभालकर्ता डैशबोर्ड से परिवार और क्षेत्र की फोटो जोड़ सकते हैं।', returnToMenu: 'सूची पर लौटें', basketReady: 'टोकरी तैयार',
    voiceAssist: 'आवाज़ आदेश', voiceCommands: 'आवाज़ आदेश', startListening: 'सुनना शुरू करें', listening: 'सुन रहे हैं...', speakNow: 'आदेश बोलें (उदा. "खेल शुरू करें", "आज क्या करना है", "पानी पिया")',
    liveTranscript: 'आपके आदेश को सुन रहे हैं…', commandRecognized: 'पहचाना गया आदेश', confirmAction: 'पुष्टि करें', confirm: 'स्वीकार', cancel: 'रद्द करें',
    unsupportedBrowser: 'इस ब्राउज़र पर आवाज़ इनपुट उपलब्ध नहीं है। आप नीचे दिए गए बड़े बटनों का उपयोग कर सकते हैं।',
    permissionDenied: 'माइक्रोफ़ोन की अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग जांचें या नीचे दिए गए बटनों का उपयोग करें।',
    noMicrophone: 'इस डिवाइस पर कोई माइक्रोफ़ोन नहीं मिला। कृपया नीचे दिए गए बटनों का उपयोग करें।',
    noSpeechHeard: 'कोई आवाज़ सुनाई नहीं दी। कृपया सुनना शुरू करें दबाकर स्पष्ट बोलें।',
    recognitionNeedsNetwork: 'कुछ ब्राउज़रों पर आवाज़ पहचान के लिए इंटरनेट कनेक्शन की आवश्यकता हो सकती है।',
    commandNotRecognized: 'यह आदेश समझ में नहीं आया। "खेल शुरू करें" बोलकर देखें या नीचे दिए बटनों का उपयोग करें।',
    assameseFallbackNotice: 'असमिया आवाज़ पहचान वैकल्पिक भाषा समर्थन का प्रयास कर रही है।',
    confirmHydration: 'क्या आप एक गिलास पानी जोड़ना चाहते हैं?',
    confirmFamilyCall: 'क्या आप परिवार / आपातकालीन संपर्क को फोन करना चाहते हैं?',
    nothingScheduledToday: 'आज के लिए कुछ भी निर्धारित नहीं है।',
    allTasksCompleted: 'आज के सभी निर्धारित कार्य और दवाइयाँ पूरी हो चुकी हैं।',
    readRoutine: 'दिनचर्या सुनाओ',
    alertsCenter: 'अलर्ट केंद्र', overdueMedicine: 'दवाई का समय बीत गया', missedAppointment: 'छूटी हुई अपॉइंटमेंट',
    prolongedInactivity: 'लंबे समय से निष्क्रियता जाँच', sosAlertRaised: 'आपात सहायता सूचना',
    acknowledge: 'स्वीकार करें', resolve: 'समाधान करें', savedOnDevice: 'डिवाइस पर सुरक्षित',
    mahjongBlockedHelp: 'इस टाइल का एक किनारा खुला होना चाहिए और ऊपर कोई अन्य टाइल नहीं होनी चाहिए।',

    greetings: 'मित्र और संदेश',
    greetingsDesc: 'स्वीकृत मित्रों के साथ देखभालकर्ता-पर्यवेक्षित संदेश',
    supervisionNotice: 'सभी की सुरक्षा के लिए दोनों पक्षों के देखभालकर्ता सभी संदेश देख सकते हैं।',
    newContactApproved: 'नया स्वीकृत संपर्क',
    newContactDesc: 'आपके देखभालकर्ताओं ने इस विश्वसनीय संपर्क को स्वीकृति दी है। क्या आप जुड़ना चाहते हैं?',
    sayHello: 'नमस्ते कहें',
    notNow: 'अभी नहीं',
    waitingForFriend: 'संदेश भेजने से पहले आपके मित्र के नमस्ते कहने की प्रतीक्षा है।',
    waitingToSend: 'भेजने की प्रतीक्षा में — आपके संपर्क और देखभालकर्ता इसे अभी नहीं देख सकते।',
    sentSafely: 'सफलतापूर्वक भेजा गया',
    conversationResting: 'यह बातचीत अभी विश्राम में है।',
    askCaregiverHelp: 'मेरी देखभालकर्ता से सहायता माँगें',
    helpRequested: 'सहायता माँगी गई — आपकी देखभालकर्ता को सूचित कर दिया गया है।',
    choosePrompt: 'अभिवादन संदेश चुनें',
    sendGreeting: 'संदेश भेजें',
    tapToSend: 'सुरक्षित रूप से भेजने के लिए दबाएँ',
    reactions: 'शुभकामना प्रतिक्रिया',
    noConversationsYet: 'अभी कोई स्वीकृत मित्र नहीं हैं। देखभालकर्ता अपने डैशबोर्ड से संपर्क जोड़ सकते हैं।',
    generateInvite: '24 घंटे का आमंत्रण कोड बनाएँ',
    redeemInvite: 'आमंत्रण कोड स्वीकार / दर्ज करें',
    inviteCode: 'आमंत्रण कोड',
    enterInviteCode: 'दूसरे परिवार द्वारा दिया गया 10-अक्षरों का कोड दर्ज करें',
    heldMessages: 'समीक्षा हेतु रोके गए संदेश',
    releaseToPatient: 'रोगी को दिखाएँ',
    hideFromPatient: 'रोगी से छिपाएँ',
    muteContact: 'संपर्क म्यूट करें',
    unmuteContact: 'म्यूट हटाएँ',
    emergencyBlock: 'आपातकालीन ब्लॉक',
    auditTrail: 'ऑडिट इतिहास',
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
    activities: '৮টা কাৰ্যকলাপ', checklist: 'তালিকা', openPhotos: 'ফটো খোলক',
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
    accessibilitySettings: 'সহায়ক ছেটিং', close: 'বন্ধ কৰক', listen: 'শুনক', stopListening: 'শুনা বন্ধ কৰক',
    speechUnavailable: 'এই ডিভাইচত পঢ়ি শুনোৱাৰ সুবিধা উপলব্ধ নহয়।', startGame: 'খেল আৰম্ভ কৰক', readyToBegin: 'আপুনি সাজু হ’লে',
    dueNow: 'এতিয়া সময় হৈছে', markDone: 'সম্পূৰ্ণ হৈছে', snooze: '১০ মিনিট পাছত', openRoutine: 'নিয়ম খোলক', reminderAlert: 'স্মৰণ জাননী', reminderSound: 'স্মৰণৰ শব্দ',
    recommendedActivity: 'আজিৰ পৰামৰ্শ', otherActivities: 'আৰু কাৰ্যকলাপ', nextStep: 'পৰৱৰ্তী পদক্ষেপ',
    outstanding: 'বহুত ভাল!', wonderfulWork: 'সুন্দৰ কাম!', goodEffort: 'ভাল চেষ্টা!',
    encouragementStrong: 'আজি আপোনাৰ স্মৃতি আৰু মনোযোগ ভাল আছিল।', encouragementSteady: 'আপুনি মনোযোগ ধৰি ৰাখি চেষ্টা কৰি গ’ল।', encouragementPractice: 'প্ৰতিটো সহজ অনুশীলনে আপোনাৰ নিয়মত সহায় কৰে।',
    adaptationStart: 'পৰৱৰ্তী খেল সহজ আৰম্ভণিৰ স্তৰৰ পৰা হ’ব।', adaptationHarder: 'ধাৰাবাহিক শুদ্ধ উত্তৰৰ বাবে পৰৱৰ্তী খেল অলপ কঠিন হ’ব।', adaptationHighest: 'পৰৱৰ্তী খেল সৰ্বোচ্চ স্তৰত থাকিব।', adaptationGentler: 'অধিক সময় বা সহায় উপকাৰী হোৱা বাবে পৰৱৰ্তী খেল সহজ হ’ব।', adaptationGentlest: 'পৰৱৰ্তী খেল আৰামদায়ক সহজ স্তৰত থাকিব।', adaptationSame: 'পৰৱৰ্তী খেল একে আৰামদায়ক স্তৰত থাকিব।', adaptationReminiscence: 'এই স্মৃতি কাৰ্যকলাপ সহজ আৰু আশ্বাসজনক হৈ থাকিব।',
    judgeDemoTools: 'বিচাৰক ডেমো সঁজুলি', judgeDemoDescription: 'SIH প্ৰদৰ্শনৰ বাবে মেনুৱেল স্তৰ দেখুৱাওক। টেব বন্ধ হ’লে ই ৰিছেট হ’ব।', localDemoAccess: 'কেৱল ডিভাইচ-স্থানীয় ডেমো প্ৰৱেশ',
    majuliInstruction: 'উত্তৰ-পূবৰ চিনাকি চিহ্নৰ জোৰা মিলাওক।', harvestInstruction: 'কুমলীয়া চাহপাত আৰু সোণালী কুঁহিপাত টিপক। ডাল আৰু পোক এৰাই চলক।', sequenceInstruction: 'দৈনিক কামবোৰ হোৱা ক্ৰমত সজাওক।', weaveInstruction: 'পৰম্পৰাগত নক্সাটো সম্পূৰ্ণ কৰা চিহ্ন বাছক।', albumInstruction: 'চিনাকি ফটোখন চাওক আৰু মিল থকা স্মৃতি বাছক।',
    pairsCleared: 'জোৰা সম্পূৰ্ণ', tapCard: 'কাৰ্ড টিপক', timelineOrder: 'দিনটোৰ ক্ৰম', tapCardsInOrder: 'তলৰ কাৰ্ডবোৰ সঠিক ক্ৰমত টিপক', availableCards: 'উপলব্ধ ক্ৰমৰ কাৰ্ড', resetSequence: 'ক্ৰম আকৌ আৰম্ভ কৰক', step: 'খোজ', patternQuestion: 'কোনটো চিহ্নই বোৱনটো সঠিকভাৱে সম্পূৰ্ণ কৰে?',
    memoryRecallQuestion: 'স্মৃতিৰ প্ৰশ্ন', hideClue: 'পৰিয়ালৰ ইংগিত লুকুৱাওক', listenFamilyClue: 'পৰিয়ালৰ ইংগিত শুনক', correct: 'শুদ্ধ', tryAgain: 'আকৌ চেষ্টা কৰক', nextMemory: 'পৰৱৰ্তী মৰমৰ স্মৃতি', completeSession: 'অধিৱেশন সম্পূৰ্ণ কৰক', noPhotos: 'এতিয়াও স্মৃতিৰ ফটো নাই', noPhotosHelp: 'যত্ন লোৱা ব্যক্তিয়ে ডেশ্ববৰ্ডৰ পৰা পৰিয়াল আৰু অঞ্চলৰ ফটো যোগ কৰিব পাৰে।', returnToMenu: 'সূচীলৈ উভতি যাওক', basketReady: 'টুকুৰি সাজু',
    voiceAssist: 'কণ্ঠ আদেশ', voiceCommands: 'কণ্ঠ আদেশ', startListening: 'শুনিবলৈ আৰম্ভ কৰক', listening: 'শুনি থকা হৈছে...', speakNow: 'আদেশ কওক (যেনে "খেল আৰম্ভ কৰক", "আজি কি কৰিব লাগে", "পানী খালো")',
    liveTranscript: 'আপোনাৰ আদেশ শুনা হৈছে…', commandRecognized: 'চিনাক্ত হোৱা আদেশ', confirmAction: 'নিশ্চিত কৰক', confirm: 'নিশ্চিত', cancel: 'বাতিল',
    unsupportedBrowser: 'এই ব্ৰাউজাৰত কণ্ঠ ইনপুট উপলব্ধ নহয়। আপুনি তলৰ ডাঙৰ বুটামবোৰ ব্যৱহাৰ কৰিব পাৰে।',
    permissionDenied: 'মাইক্ৰ\'ফ\'নৰ অনুমতি দিয়া নহ\'ল। অনুগ্ৰহ কৰি ব্ৰাউজাৰ ছেটিং পৰীক্ষা কৰক বা তলৰ বুটামবোৰ ব্যৱহাৰ কৰক।',
    noMicrophone: 'এই ডিভাইচত কোনো মাইক্ৰ\'ফ\'ন পোৱা নগ\'ল। অনুগ্ৰহ কৰি তলৰ বুটামবোৰ ব্যৱহাৰ কৰক।',
    noSpeechHeard: 'কোনো কথা শুনা নগ\'ল। অনুগ্ৰহ কৰি শুনা আৰম্ভ কৰক টিপি স্পষ্টকৈ কওক।',
    recognitionNeedsNetwork: 'কিছুমান ব্ৰাউজাৰত কণ্ঠ চিনাক্তকৰণৰ বাবে ইণ্টাৰনেট সংযোগৰ প্ৰয়োজন হ\'ব পাৰে।',
    commandNotRecognized: 'এই আদেশটো বুজি পোৱা নগ\'ল। "খেল আৰম্ভ কৰক" বুলি কওক বা তলৰ বুটামবোৰ ব্যৱহাৰ কৰক।',
    assameseFallbackNotice: 'অসমীয়া কণ্ঠ চিনাক্তকৰণে বিকল্প ভাষা সমৰ্থন চেষ্টা কৰি আছে।',
    confirmHydration: 'এগিলাচ পানী যোগ কৰিব নেকি?',
    confirmFamilyCall: 'পৰিয়াল বা জৰুৰী যোগাযোগক ফোন কৰিব নেকি?',
    nothingScheduledToday: 'আজিৰ বাবে একো তালিকাভুক্ত নাই।',
    allTasksCompleted: 'আজিৰ সকলো কাম আৰু ঔষধ সম্পূৰ্ণ হৈছে।',
    readRoutine: 'ৰুটিন শুনক',
    alertsCenter: 'জাননী কেন্দ্ৰ', overdueMedicine: 'ঔষধৰ সময় উকলি গ\'ল', missedAppointment: 'ছুটি হোৱা এপইণ্টমেণ্ট',
    prolongedInactivity: 'দীৰ্ঘ সময়ৰ নিষ্ক্ৰিয়তা পৰীক্ষা', sosAlertRaised: 'জৰুৰী সহায়ৰ জাননী',
    acknowledge: 'গ্ৰহণ কৰক', resolve: 'সমাধান কৰক', savedOnDevice: 'এই ডিভাইচত সংৰক্ষিত',
    mahjongBlockedHelp: 'এই টাইলটোৰ এটা কাষ খোলা থাকিব লাগিব আৰু ওপৰত আন কোনো টাইল থাকিব নালাগিব।',

    greetings: 'বন্ধু আৰু সম্ভাষণ',
    greetingsDesc: 'অনুমোদিত বন্ধুসকলৰ সৈতে তত্ত্বাৱধানত বাৰ্তালাপ',
    supervisionNotice: 'সকলোৰে সুৰক্ষাৰ বাবে উভয় পক্ষৰ তত্ত্বাৱধায়কে সকলো বাৰ্তা পৰীক্ষা কৰিব পাৰে।',
    newContactApproved: 'নতুন অনুমোদিত যোগাযোগ',
    newContactDesc: 'আপোনাৰ তত্ত্বাৱধায়কে এই বিশ্বস্ত যোগাযোগ অনুমোদন কৰিছে। আপুনি সংযোগ কৰিব বিচাৰে নেকি?',
    sayHello: 'নমস্কাৰ জনাওক',
    notNow: 'এতিয়া নহয়',
    waitingForFriend: 'বাৰ্তা পঠোৱাৰ আগতে আপোনাৰ বন্ধুৱে নমস্কাৰ জনোৱালৈ অপেক্ষা কৰা হৈছে।',
    waitingToSend: 'পঠিয়াবলৈ অপেক্ষাৰত — আপোনাৰ যোগাযোগ বা তত্ত্বাৱধায়কে এতিয়াও ইয়াক দেখা নাই।',
    sentSafely: 'সুৰক্ষিতভাৱে পঠিওৱা হ’ল',
    conversationResting: 'এই বাৰ্তালাপ এতিয়া জিৰণিত আছে।',
    askCaregiverHelp: 'মোৰ তত্ত্বাৱধায়কৰ সহায় বিচৰক',
    helpRequested: 'সহায় বিচৰা হ’ল — আপোনাৰ তত্ত্বাৱধায়কক জনোৱা হৈছে।',
    choosePrompt: 'সম্ভাষণ বাৰ্তা বাছক',
    sendGreeting: 'বাৰ্তা পঠাওক',
    tapToSend: 'সুৰক্ষিতভাৱে পঠিয়াবলৈ টিপক',
    reactions: 'মৰমৰ প্ৰতিক্ৰিয়া',
    noConversationsYet: 'এতিয়াও কোনো অনুমোদিত বন্ধু নাই। তত্ত্বাৱধায়কে নিজৰ ডেশ্বব’ৰ্ডৰ পৰা যোগাযোগ যোগ কৰিব পাৰে।',
    generateInvite: '২৪ ঘণ্টাৰ নিমন্ত্ৰণ ক’ড তৈয়াৰ কৰক',
    redeemInvite: 'নিমন্ত্ৰণ ক’ড গ্ৰহণ / ব্যৱহাৰ কৰক',
    inviteCode: 'নিমন্ত্ৰণ ক’ড',
    enterInviteCode: 'আনটো পৰিয়ালে দিয়া ১০টা আখৰৰ ক’ডটো লিখক',
    heldMessages: 'পুনৰীক্ষণৰ বাবে ৰখা বাৰ্তা',
    releaseToPatient: 'ৰোগীক দেখুৱাওক',
    hideFromPatient: 'ৰোগীৰ পৰা লুকুৱাওক',
    muteContact: 'যোগাযোগ বন্ধ ৰাখক',
    unmuteContact: 'বন্ধ আঁতৰাওক',
    emergencyBlock: 'জৰুৰী ব্লক',
    auditTrail: 'অডিট ইতিবৃত্ত',
  },
};

