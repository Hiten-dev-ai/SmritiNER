export type AppMode = 'patient' | 'caregiver' | 'asha';

export type LanguageCode = 'English' | 'Hindi' | 'Assamese';

export type UserRole = 'caregiver' | 'patient';

export interface UserAccount {
  id: string;
  role: UserRole;
  username: string;
  email?: string;
  displayName: string;
}

export interface AuthenticatedPatient {
  id: string;
  userId: string;
  username: string;
  name: string;
  age: number;
  dateOfBirth?: string;
  gender: string;
  preferredLanguage: string;
  state: string;
  district: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  clinicianCondition?: string;
  careNotes?: string;
  active: boolean;
  accessRole: 'owner' | 'editor' | 'self';
}

export interface PatientCaregiverAccess {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  accessRole: 'owner' | 'editor';
}

export type ThemeMode = 'tea' | 'brahma' | 'contrast';
export type FontSizeScale = 'normal' | 'large' | 'extralarge';

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  nativeLanguage: 'Assamese' | 'Bengali' | 'Bodo' | 'Manipuri' | 'Hindi' | 'English';
  villageOrDistrict: string;
  state: 'Assam' | 'Meghalaya' | 'Manipur' | 'Mizoram' | 'Nagaland' | 'Tripura' | 'Arunachal Pradesh' | 'Sikkim';
  diagnosisStage: 'Mild Cognitive Impairment' | 'Early Stage Dementia' | 'Moderate Dementia';
  emergencyContactName: string;
  emergencyContactPhone: string;
  ashaWorkerAssigned?: string;
  notes?: string;
}

export type JourneyGameType = 
  | 'majuli_memory'
  | 'tea_tray_recall'
  | 'market_list_recall'
  | 'missing_object'
  | 'daily_steps'
  | 'weave_pattern'
  | 'memory_lane'
  | 'mahjong_memory';

export type GameType = 
  | JourneyGameType
  | 'chai_harvest'
  | 'daily_sequence'
  | 'reminiscence_album';

export type CognitiveDomain = 'visual-memory' | 'working-memory' | 'recognition' | 'sequencing' | 'pattern-recognition' | 'reminiscence' | 'memory';

export interface GameDifficultyProfile {
  stage: number;
  memoryLoad: number;
  previewDurationMs: number;
  optionCount: number;
  roundCount: number;
  allowReplay: boolean;
  tileCount?: number;
  pairCount?: number;
  mode?: 'visible-match' | 'hidden-match' | 'shuffle-memory';
  shuffleCount?: number;
}

export interface GameDefinition {
  id: GameType;
  title: string;
  subtitle: string;
  domain: CognitiveDomain;
  estimatedMinutes: number;
}

export interface GameRoundResult {
  round: number;
  correct: boolean;
  responseMs: number;
  mistakes: number;
  hintsUsed: number;
  contentVariantId: string;
  mode?: 'visible-match' | 'hidden-match' | 'shuffle-memory';
  tileCount?: number;
  pairCount?: number;
  previewDurationMs?: number;
  shuffleCount?: number;
  effectiveMemoryLoad?: number;
  supportAdjustment?: 'none' | 'longer-preview' | 'fewer-tiles' | 'pair-reveal';
}

export interface GameProgress {
  patientId: string;
  gameType: JourneyGameType;
  unlockedStage: number;       // Highest available stage, 1–12
  recommendedStage: number;    // Default stage suggested by the app, 1–12
  lastPlayedStage?: number;
  lastStageSource?: 'recommended' | 'manual' | 'test';
  lastDecision:
    | 'start'
    | 'steady'
    | 'stage-unlocked'
    | 'gentler'
    | 'manual-replay'
    | 'highest-stage';
  reasonText: string;
  consecutiveStrong?: number;
  consecutiveSupport?: number;
  updatedAt: string;
}

export interface DifficultyDecision {
  playedStage: number;
  previousRecommendedStage: number;
  nextRecommendedStage: number;
  previousUnlockedStage: number;
  unlockedStage: number;
  outcome: 'strong' | 'steady' | 'support-needed' | 'ignored';
  reasonCode:
    | 'first-session'
    | 'building-evidence'
    | 'stage-unlocked'
    | 'remain-steady'
    | 'gentler-next-time'
    | 'manual-comfort-replay'
    | 'highest-stage';
}

export type SoundEvent =
  | 'tap'
  | 'tile-pick'
  | 'tile-reveal'
  | 'pair-match'
  | 'gentle-nudge'
  | 'hint'
  | 'round-complete'
  | 'stage-unlocked'
  | 'journey-complete'
  | 'reminder';

export interface AudioPreferences {
  effectsEnabled: boolean;
  effectsVolume: 'low' | 'medium' | 'high';
  ambienceEnabled: boolean;
  reminderEnabled: boolean;
}

export type DifficultyTier = 1 | 2 | 3 | 4 | 5;

export interface GameSession {
  id?: number | string;
  patientId: string;
  gameType: GameType;
  gameTitle: string;
  score: number;
  maxPossibleScore: number;
  accuracy: number; // 0 - 100%
  durationSeconds: number;
  difficultyLevel: DifficultyTier; // 1 to 5
  hesitationsCount: number;
  hintsUsedCount: number;
  avgReactionTimeMs: number;
  completedAt: string; // ISO string
  synced: boolean;
  domain?: CognitiveDomain;
  stage?: number;
  memoryLoad?: number;
  mistakes?: number;
  hintsUsed?: number;
  medianResponseMs?: number;
  responseVariabilityMs?: number;
  completionStatus?: 'completed' | 'abandoned';
  contentVariantIds?: string[];
  roundResults?: GameRoundResult[];
  startedAt?: string;
  clientEventId?: string;
  stageSource?: 'recommended' | 'manual';
}

export interface JourneyGameSession {
  id?: string;
  patientId: string;
  gameType: GameType;
  domain: CognitiveDomain;
  stage: number;
  accuracy: number;
  durationSeconds: number;
  memoryLoad: number;
  mistakes: number;
  hintsUsed: number;
  medianResponseMs: number;
  responseVariabilityMs: number;
  completionStatus: 'completed' | 'abandoned';
  contentVariantIds: string[];
  roundResults: GameRoundResult[];
  startedAt: string;
  completedAt: string;
  clientEventId: string;
  stageSource?: 'recommended' | 'manual' | 'test';
}

export interface CaregiverObservation {
  id: string;
  patientId: string;
  caregiverId: string;
  caregiverName: string;
  note: string;
  tags: Array<'sleep' | 'illness' | 'mood' | 'medication' | 'routine' | 'other'>;
  observedAt: string;
  createdAt: string;
}

export interface CognitiveMetrics {
  memoryIndex: number;        // 0 - 100
  attentionIndex: number;     // 0 - 100
  executiveFunction: number;  // 0 - 100
  motorReactionScore: number; // 0 - 100
  overallCognitiveScore: number; // 0 - 100
  fatigueIndex: number;       // 0 - 100
  engagementTrend: 'stable' | 'variable' | 'needs-support' | 'insufficient-data';
  supportSummary: string;
}

export interface ReminderItem {
  id?: number | string;
  patientId: string;
  title: string;
  category: 'medicine' | 'hydration' | 'routine' | 'appointment' | 'prayer';
  time: string; // e.g. "08:00 AM"
  notes?: string;
  dosage?: string;
  completedDates: string[]; // ['2026-08-27', ...]
  iconName: string;
  repeat?: 'daily' | 'once';
  scheduledDate?: string;
  alertsEnabled?: boolean;
  snoozedUntil?: string;
  lastAlertedDate?: string;
  synced: boolean;
}

export interface ReminiscencePhoto {
  id?: number | string;
  patientId: string;
  imageUrl: string;
  title: string;
  relationshipOrPlace: string;
  year?: string;
  memoryPromptQuestion: string;
  correctAnswer: string;
  audioPromptHint?: string;
  synced: boolean;
}

export interface AshaScreeningRecord {
  id?: number;
  elderName: string;
  elderAge: number;
  villageName: string;
  district: string;
  ashaWorkerName: string;
  screeningDate: string;
  orientationScore: number; // Max 5 (Year, Season, Month, Day, Place)
  memoryRecallScore: number; // Max 5 (5 regional words)
  attentionMathScore: number; // Max 5 (Counting reverse / sequence)
  handloomPatternScore: number; // Max 5
  routineRecallScore: number; // Max 5
  totalScore: number; // Max 25
  dementiaRiskCategory: 'Normal Cognitive Aging' | 'Mild Impairment / Watchlist' | 'Urgent Neurological Referral';
  ashaNotes: string;
  synced: boolean;
}

export interface DailyHydrationLog {
  id?: number | string;
  patientId: string;
  date: string; // YYYY-MM-DD
  glassesDrunk: number;
  targetGlasses: number;
  synced: boolean;
}

export type AlertKind = 'medicine' | 'hydration' | 'routine' | 'appointment' | 'inactivity' | 'sos' | 'engagement';
export type AlertStatus = 'due' | 'overdue' | 'snoozed' | 'completed' | 'acknowledged' | 'resolved';

export interface AlertEvent {
  id: string;
  patientId: string;
  reminderId?: string | null;
  occurrenceKey: string;
  alertKind: AlertKind;
  title: string;
  notes?: string | null;
  status: AlertStatus;
  scheduledTime?: string;
  dueDate: string;
  deliveredAt?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PushSubscriptionRecord {
  id: string;
  endpoint: string;
  saved: boolean;
}

export interface VoicePreferences {
  enabled: boolean;
  rate: number; // default 0.80
  pitch: number; // default 1.0
  preferredVoice?: string;
  showTranscript: boolean;
}

export type VoiceActionId =
  | 'home'
  | 'back'
  | 'repeat'
  | 'start_game'
  | 'read_routine'
  | 'pause'
  | 'continue'
  | 'hint'
  | 'open_routine'
  | 'mark_done'
  | 'snooze'
  | 'drink_water'
  | 'call_family'
  | 'stop_listening';

export type VoiceInputError =
  | 'unsupported'
  | 'permission-denied'
  | 'no-microphone'
  | 'no-speech'
  | 'network'
  | 'language-unavailable';

export interface DetectedVoiceCommand {
  actionId: VoiceActionId;
  label: string;
  confidence: number;
  requiresConfirmation: boolean;
  transcript: string;
}

// -----------------------------------------------------------------
// SUPERVISED PATIENT MESSAGING ("GREETINGS") MODELS
// -----------------------------------------------------------------

export type ConnectionStatus = 'awaiting-patient-ack' | 'active' | 'blocked' | 'ended';
export type MessageType = 'template' | 'reaction';
export type CompositionMethod = 'touch' | 'voice-selection';
export type RecipientVisibility = 'visible' | 'held' | 'hidden';
export type IncomingMode = 'normal' | 'held-for-caregiver';
export type FlagCategory =
  | 'distress'
  | 'confusion'
  | 'repeated-contact'
  | 'inappropriate'
  | 'patient-requested-help'
  | 'other';
export type FlagStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export interface ChatConnectionInvite {
  id: string;
  invitingPatientId: string;
  createdByCaregiverId: string;
  tokenCode?: string; // Only returned once on creation
  expiresAt: string;
  redeemedAt?: string | null;
  redeemedByCaregiverId?: string | null;
  revokedAt?: string | null;
  createdAt: string;
}

export interface PatientConnection {
  id: string;
  patientAId: string;
  patientBId: string;
  status: ConnectionStatus;
  aApprovedBy: string;
  aApprovedAt: string;
  bApprovedBy?: string | null;
  bApprovedAt?: string | null;
  aAcknowledgedAt?: string | null;
  bAcknowledgedAt?: string | null;
  blockedByUserId?: string | null;
  blockedForPatientId?: string | null;
  blockedReason?: string | null;
  blockedAt?: string | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
  // Augmented view fields
  otherPatientId: string;
  otherPatientName: string;
  otherPatientDistrict?: string;
  myPatientId: string;
  hasMyPatientAcknowledged: boolean;
  hasOtherPatientAcknowledged: boolean;
}

export interface ConversationSummary {
  id: string;
  connectionId: string;
  status: 'active' | 'archived' | 'closed';
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
  connection: PatientConnection;
  controls?: {
    incomingMode: IncomingMode;
    canSend: boolean;
    notificationsMuted: boolean;
    revision: number;
  };
  heldMessageCount?: number;
  openFlagCount?: number;
  unreadCount?: number;
  lastMessage?: ChatMessage | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderPatientId: string;
  recipientPatientId: string;
  messageType: MessageType;
  templateKey?: string | null;
  catalogVersion?: number | null;
  reactionCode?: string | null;
  compositionMethod: CompositionMethod;
  clientEventId: string;
  clientCreatedAt: string;
  acceptedAt?: string | null;
  recipientVisibility: RecipientVisibility;
  hiddenByUserId?: string | null;
  hiddenAt?: string | null;
  hiddenReason?: string | null;
  createdAt: string;
  // Client-only state
  status?: 'pending-local' | 'accepted' | 'rejected';
  rejectionReason?: string;
}

export interface ModerationFlag {
  id: string;
  conversationId: string;
  messageId?: string | null;
  flaggedForPatientId: string;
  flaggedByUserId: string;
  flaggedByRole?: 'caregiver' | 'patient';
  category: FlagCategory;
  notes?: string | null;
  status: FlagStatus;
  resolvedByUserId?: string | null;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationAuditEvent {
  id: string;
  conversationId: string;
  connectionId: string;
  actorUserId: string;
  actorRole: string;
  eventType: string;
  detailsJson: string;
  createdAt: string;
}

export interface ChatOutboxItem {
  id: string; // clientEventId
  patientId: string;
  conversationId: string;
  expectedConnectionRevision: number;
  payload: {
    messageType: MessageType;
    templateKey?: string;
    catalogVersion?: number;
    reactionCode?: string;
    compositionMethod: CompositionMethod;
    clientCreatedAt: string;
  };
  priority: 'normal' | 'critical';
  status: 'pending' | 'syncing' | 'failed' | 'rejected';
  attempts: number;
  nextRetryAt: string;
  lastError?: string | null;
  createdAt: string;
}


