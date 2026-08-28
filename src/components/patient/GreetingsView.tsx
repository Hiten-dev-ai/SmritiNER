import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  HelpCircle,
  MessageCircle,
  Mic,
  RefreshCw,
  Send,
  Shield,
  UserCheck,
  Volume2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { audioManager } from '../../services/audioManager';
import { chatService } from '../../services/chatService';
import {
  CHAT_REACTIONS,
  CHAT_TEMPLATES,
  getReaction,
  getTemplate,
  type ChatReactionDefinition,
  type ChatTemplateCategory,
  type ChatTemplateDefinition,
} from '../../services/chatTemplates';
import type { ChatMessage, ConversationSummary } from '../../types';

interface GreetingsViewProps {
  onBack: () => void;
}

export const GreetingsView: React.FC<GreetingsViewProps> = ({ onBack }) => {
  const { currentPatient, selectedLanguage, readAloud, stopReadAloud, t } = useApp();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Template / Reaction Composer state
  const [selectedCategory, setSelectedCategory] = useState<ChatTemplateCategory>('greetings');
  const [selectedTemplate, setSelectedTemplate] = useState<ChatTemplateDefinition | null>(null);
  const [selectedReaction, setSelectedReaction] = useState<ChatReactionDefinition | null>(null);
  const [confirmSendOpen, setConfirmSendOpen] = useState<boolean>(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState<boolean>(false);
  const [helpRequestedNotice, setHelpRequestedNotice] = useState<boolean>(false);

  // Voice template picker state
  const [voicePickerOpen, setVoicePickerOpen] = useState<boolean>(false);
  const { isListening, transcript, startListening, stopListening } =
    useVoiceInput(selectedLanguage);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const isConnectionActive = activeConv?.connection.status === 'active';
  const isAwaitingAck = activeConv?.connection.status === 'awaiting-patient-ack';
  const hasMyPatientAcknowledged = activeConv?.connection.hasMyPatientAcknowledged;
  const isComposerDisabled =
    !isConnectionActive ||
    activeConv?.controls?.canSend === false ||
    activeConv?.status !== 'active';

  // Load conversations on mount
  useEffect(() => {
    if (!currentPatient) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const convs = await chatService.listConversations(currentPatient.id);
      if (!mounted) return;
      setConversations(convs);
      if (convs.length > 0 && !activeConvId) {
        setActiveConvId(convs[0].id);
      }
      setLoading(false);
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [currentPatient, activeConvId]);

  // Load messages & poll active conversation every 15s
  useEffect(() => {
    if (!currentPatient || !activeConvId) return;
    let mounted = true;

    const fetchMsgs = async () => {
      const res = await chatService.getMessages(currentPatient.id, activeConvId);
      if (mounted) {
        setMessages(res.messages);
      }
      // Also trigger background outbox sync
      void chatService.syncOutbox(currentPatient.id);
    };

    void fetchMsgs();
    const interval = setInterval(() => {
      void fetchMsgs();
    }, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [currentPatient, activeConvId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleRefresh = async () => {
    if (!currentPatient || !activeConvId) return;
    setIsRefreshing(true);
    audioManager.play('tap');
    await chatService.syncOutbox(currentPatient.id);
    const [convs, msgs] = await Promise.all([
      chatService.listConversations(currentPatient.id),
      chatService.getMessages(currentPatient.id, activeConvId),
    ]);
    setConversations(convs);
    setMessages(msgs.messages);
    setIsRefreshing(false);
  };

  const handleAcknowledge = async () => {
    if (!currentPatient || !activeConv) return;
    audioManager.play('tap');
    try {
      const res = await chatService.acknowledgeConnection(currentPatient.id, activeConv.connection.id);
      setConversations((prev) =>
        prev.map((c) => (c.connection.id === res.connection.id ? { ...c, connection: res.connection } : c))
      );
      audioManager.play('pair-match');
    } catch {
      // Fallback
    }
  };

  const handleSelectTemplate = (template: ChatTemplateDefinition) => {
    audioManager.play('tap');
    setSelectedTemplate(template);
    setSelectedReaction(null);
    setConfirmSendOpen(true);
  };

  const handleSelectReaction = (reaction: ChatReactionDefinition) => {
    audioManager.play('tap');
    setSelectedReaction(reaction);
    setSelectedTemplate(null);
    setConfirmSendOpen(true);
  };

  const handleSendConfirmed = async (method: 'touch' | 'voice-selection' = 'touch') => {
    if (!currentPatient || !activeConvId || !activeConv) return;
    setConfirmSendOpen(false);
    audioManager.play('tap');

    const expectedRevision = activeConv.connection.revision || 1;
    let payload: any = null;

    if (selectedTemplate) {
      payload = {
        messageType: 'template',
        templateKey: selectedTemplate.key,
        catalogVersion: 1,
        compositionMethod: method,
      };
    } else if (selectedReaction) {
      payload = {
        messageType: 'reaction',
        reactionCode: selectedReaction.code,
        compositionMethod: method,
      };
    }

    if (!payload) return;

    // Optimistically queue & send
    const res = await chatService.queueOrSendMessage(
      currentPatient.id,
      activeConvId,
      expectedRevision,
      payload
    );

    setMessages((prev) => [...prev, res.message]);
    setSelectedTemplate(null);
    setSelectedReaction(null);

    if (res.sentOnline) {
      audioManager.play('pair-match');
    } else {
      audioManager.play('gentle-nudge');
    }
  };

  const handleRequestHelp = async () => {
    if (!currentPatient || !activeConvId) return;
    setHelpDialogOpen(false);
    audioManager.play('tap');
    try {
      await chatService.raiseFlag(currentPatient.id, activeConvId, {
        category: 'patient-requested-help',
        notes: 'Patient tapped "Ask my caregiver for help" from Greetings screen.',
      });
      setHelpRequestedNotice(true);
      audioManager.play('pair-match');
      setTimeout(() => setHelpRequestedNotice(false), 5000);
    } catch {
      // Fallback
    }
  };

  // Voice prompt matcher
  const handleStartVoice = () => {
    stopReadAloud();
    setVoicePickerOpen(true);
    startListening();
    audioManager.play('tap');
  };

  useEffect(() => {
    if (!voicePickerOpen || isListening || !transcript) return;
    // Match transcript against templates
    const clean = transcript.toLowerCase();
    const match = CHAT_TEMPLATES.find((t) => {
      const en = t.text.English.toLowerCase();
      const hi = t.text.Hindi.toLowerCase();
      const asText = t.text.Assamese.toLowerCase();
      const shortEn = t.shortLabel.English.toLowerCase();
      return (
        clean.includes(shortEn) ||
        en.includes(clean) ||
        clean.includes(en) ||
        clean.includes(hi) ||
        clean.includes(asText)
      );
    });

    if (match) {
      setSelectedTemplate(match);
      setSelectedReaction(null);
      setVoicePickerOpen(false);
      setConfirmSendOpen(true);
      audioManager.play('pair-match');
    }
  }, [voicePickerOpen, isListening, transcript]);

  if (!currentPatient) return null;

  const categories: Array<{ id: ChatTemplateCategory; label: string }> = [
    { id: 'greetings', label: selectedLanguage === 'Hindi' ? 'अभिवादन' : selectedLanguage === 'Assamese' ? 'সম্ভাষণ' : 'Greetings' },
    { id: 'wellbeing', label: selectedLanguage === 'Hindi' ? 'हालचाल' : selectedLanguage === 'Assamese' ? 'কুশল বাৰ্তা' : 'How are you?' },
    { id: 'daily_life', label: selectedLanguage === 'Hindi' ? 'चाय व दिन' : selectedLanguage === 'Assamese' ? 'চাহ আৰু নিয়ম' : 'Tea & Life' },
    { id: 'activities', label: selectedLanguage === 'Hindi' ? 'खेल व गीत' : selectedLanguage === 'Assamese' ? 'খেল আৰু গীত' : 'Games & Music' },
    { id: 'encouragement_rest', label: selectedLanguage === 'Hindi' ? 'विश्राम' : selectedLanguage === 'Assamese' ? 'জিৰণি' : 'Rest & Bye' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-3 sm:p-6 pb-24 text-stone-900 animate-fadeIn">
      {/* ------------------------------------------------------------- */}
      {/* HEADER WITH SUPERVISION NOTICE                                */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-stone-200 bg-white font-black text-stone-700 hover:bg-stone-50 transition shadow-sm"
            aria-label="Back to Home"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-tea-950 flex items-center gap-2">
              <MessageCircle className="h-7 w-7 text-tea-700" />
              {t.greetings}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-stone-500">{t.greetingsDesc}</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex h-11 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 text-xs font-black text-stone-700 hover:bg-stone-50 transition shadow-sm"
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Mandatory Supervision Banner */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50/90 p-3.5 flex items-start gap-3 text-teal-950 text-xs sm:text-sm font-bold">
        <Shield className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
        <p className="flex-1 leading-snug">{t.supervisionNotice}</p>
      </div>

      {/* Help Requested Notice */}
      {helpRequestedNotice && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-emerald-950 text-sm font-bold animate-fadeIn flex items-center gap-2">
          <Check className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{t.helpRequested}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CONVERSATION TABS (If multiple approved contacts)             */}
      {/* ------------------------------------------------------------- */}
      {conversations.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveConvId(conv.id)}
              className={`min-h-12 flex items-center gap-2 rounded-2xl px-4 font-black transition text-sm shrink-0 border ${
                conv.id === activeConvId
                  ? 'bg-tea-800 text-white border-tea-800 shadow-md'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <span>👤</span>
              <span>{conv.connection.otherPatientName}</span>
            </button>
          ))}
        </div>
      )}

      {/* If No Contacts exist */}
      {conversations.length === 0 && !loading && (
        <div className="rounded-3xl border-2 border-dashed border-stone-300 bg-white p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-tea-50 text-3xl mb-3">
            💌
          </div>
          <h2 className="text-xl font-black text-stone-900">{t.noConversationsYet}</h2>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CONTACT ONBOARDING / ACKNOWLEDGEMENT CARD                     */}
      {/* ------------------------------------------------------------- */}
      {activeConv && isAwaitingAck && (
        <div className="rounded-3xl border-2 border-amber-300 bg-amber-50/90 p-5 sm:p-6 shadow-md text-amber-950 animate-fadeIn">
          {!hasMyPatientAcknowledged ? (
            <div className="text-center max-w-md mx-auto">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-200 text-3xl mb-3 shadow-inner">
                👋
              </div>
              <h2 className="text-2xl font-black">{t.newContactApproved}</h2>
              <p className="mt-1 text-lg font-extrabold text-amber-900">
                {activeConv.connection.otherPatientName}
                {activeConv.connection.otherPatientDistrict ? ` (${activeConv.connection.otherPatientDistrict})` : ''}
              </p>
              <p className="mt-2 text-sm font-semibold text-amber-800">
                {t.newContactDesc}
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={handleAcknowledge}
                  className="min-h-14 flex-1 rounded-2xl bg-teal-800 font-black text-white hover:bg-teal-900 shadow-md transition text-lg flex items-center justify-center gap-2"
                >
                  <UserCheck className="h-6 w-6" />
                  {t.sayHello}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Clock className="mx-auto h-10 w-10 text-amber-700 mb-2 animate-pulse" />
              <h3 className="text-lg font-black">{t.waitingForFriend}</h3>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MESSAGE STREAM (Large high-contrast bubbles)                   */}
      {/* ------------------------------------------------------------- */}
      {activeConv && (
        <div className="rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 min-h-[380px] max-h-[460px] overflow-y-auto space-y-4 shadow-sm flex flex-col">
          {messages.length === 0 && (
            <div className="my-auto text-center text-stone-400 font-bold py-12">
              <p className="text-lg">No messages exchanged yet.</p>
              <p className="text-sm mt-1">Tap a friendly prompt or reaction below to say hello!</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMine = msg.senderPatientId === currentPatient.id;
            const template = getTemplate(msg.templateKey);
            const reaction = getReaction(msg.reactionCode);

            const displayText =
              template?.text[selectedLanguage] ||
              template?.text.English ||
              'Greeting message';

            return (
              <div
                key={msg.id || msg.clientEventId}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 sm:p-5 shadow-sm ${
                    isMine
                      ? 'bg-teal-800 text-white rounded-br-none'
                      : 'bg-stone-100 text-stone-950 rounded-bl-none border border-stone-200/80'
                  }`}
                >
                  {/* Reaction message */}
                  {msg.messageType === 'reaction' && reaction && (
                    <div className="flex items-center gap-3">
                      <span className="text-5xl">{reaction.emoji}</span>
                      <span className={`text-base font-black ${isMine ? 'text-teal-100' : 'text-stone-700'}`}>
                        {reaction.label[selectedLanguage] || reaction.label.English}
                      </span>
                    </div>
                  )}

                  {/* Template message */}
                  {msg.messageType === 'template' && (
                    <div className="space-y-2">
                      <p className="text-lg sm:text-xl font-bold leading-snug">{displayText}</p>
                      <div className="flex items-center justify-between pt-1 gap-2">
                        {/* Listen (TTS) button for patient comfort */}
                        <button
                          onClick={() => readAloud(displayText)}
                          className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition ${
                            isMine
                              ? 'bg-white/15 hover:bg-white/25 text-teal-100'
                              : 'bg-stone-200/70 hover:bg-stone-200 text-stone-800'
                          }`}
                          aria-label={t.listen}
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                          <span>{t.listen}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status footer */}
                  <div
                    className={`mt-2 flex items-center justify-end gap-1 text-[11px] font-bold ${
                      isMine ? 'text-teal-200' : 'text-stone-400'
                    }`}
                  >
                    {msg.status === 'pending-local' && (
                      <span className="flex items-center gap-1 text-amber-300">
                        <Clock className="h-3.5 w-3.5" />
                        {t.waitingToSend}
                      </span>
                    )}
                    {msg.status === 'rejected' && (
                      <span className="flex items-center gap-1 text-rose-300">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {msg.rejectionReason || 'Delivery blocked'}
                      </span>
                    )}
                    {msg.status === 'accepted' && (
                      <span className="flex items-center gap-1">
                        <span>{t.sentSafely}</span>
                        <CheckCheck className="h-3.5 w-3.5 text-teal-300" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PERMANENT "ASK MY CAREGIVER FOR HELP" BUTTON                 */}
      {/* ------------------------------------------------------------- */}
      <div className="flex justify-between items-center px-1">
        <button
          onClick={() => setHelpDialogOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-900 hover:bg-rose-100 transition shadow-sm"
        >
          <HelpCircle className="h-4 w-4 text-rose-700" />
          <span>{t.askCaregiverHelp}</span>
        </button>

        {activeConv?.controls?.canSend === false && (
          <span className="text-xs font-bold text-stone-500 italic">
            {t.conversationResting}
          </span>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* COMPOSER DRAWER & SAFE REACTION BAR                           */}
      {/* ------------------------------------------------------------- */}
      {activeConv && !isComposerDisabled && (
        <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
          {/* Reaction Shortcut Bar */}
          <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-stone-400">
              {t.reactions}:
            </span>
            <div className="flex gap-2">
              {CHAT_REACTIONS.map((reaction) => (
                <button
                  key={reaction.code}
                  onClick={() => handleSelectReaction(reaction)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 hover:bg-stone-200 text-2xl transition transform hover:scale-105 active:scale-95"
                  aria-label={reaction.label[selectedLanguage]}
                >
                  {reaction.emoji}
                </button>
              ))}
            </div>
            {/* Push-to-talk voice prompt selector */}
            <button
              onClick={handleStartVoice}
              className="flex h-12 items-center gap-1.5 rounded-2xl bg-teal-100 px-3 font-black text-xs text-teal-900 hover:bg-teal-200 transition"
              aria-label="Voice greeting selector"
            >
              <Mic className="h-5 w-5 text-teal-700" />
              <span className="hidden sm:inline">Voice Prompt</span>
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`min-h-10 rounded-xl px-3 text-xs font-black transition shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-tea-800 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Prompt Choices for selected category */}
          <div className="grid gap-2 sm:grid-cols-2">
            {CHAT_TEMPLATES.filter((t) => t.category === selectedCategory).map((template) => (
              <button
                key={template.key}
                onClick={() => handleSelectTemplate(template)}
                className="min-h-14 flex items-center justify-between gap-3 rounded-2xl border-2 border-stone-200 bg-stone-50/80 p-3 text-left hover:border-tea-400 hover:bg-white transition"
              >
                <span className="text-sm font-black text-stone-900 leading-snug">
                  {template.text[selectedLanguage] || template.text.English}
                </span>
                <Send className="h-4 w-4 text-tea-700 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CONFIRMATION DIALOG BEFORE SENDING GREETING                   */}
      {/* ------------------------------------------------------------- */}
      {confirmSendOpen && (selectedTemplate || selectedReaction) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-stone-900 border border-stone-200">
            <h2 className="text-xl font-black text-stone-950">{t.sendGreeting}</h2>
            <p className="mt-1 text-xs font-bold text-stone-500">
              To: {activeConv?.connection.otherPatientName}
            </p>

            <div className="my-5 rounded-2xl bg-teal-50 p-4 border border-teal-200 text-center">
              {selectedTemplate && (
                <p className="text-lg font-extrabold text-teal-950">
                  "{selectedTemplate.text[selectedLanguage] || selectedTemplate.text.English}"
                </p>
              )}
              {selectedReaction && (
                <div className="flex flex-col items-center">
                  <span className="text-6xl">{selectedReaction.emoji}</span>
                  <span className="mt-1 text-sm font-black text-teal-900">
                    {selectedReaction.label[selectedLanguage]}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setSelectedReaction(null);
                  setConfirmSendOpen(false);
                }}
                className="min-h-14 flex-1 rounded-2xl border-2 border-stone-300 font-black text-stone-700 hover:bg-stone-100 transition"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => handleSendConfirmed('touch')}
                className="min-h-14 flex-1 rounded-2xl bg-teal-800 font-black text-white hover:bg-teal-900 shadow-md transition flex items-center justify-center gap-2"
              >
                <Send className="h-5 w-5" />
                {t.tapToSend}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ASK CAREGIVER FOR HELP CONFIRMATION                           */}
      {/* ------------------------------------------------------------- */}
      {helpDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-stone-900 border border-stone-200">
            <HelpCircle className="mx-auto h-12 w-12 text-rose-600 mb-2" />
            <h2 className="text-xl font-black text-center text-stone-950">{t.askCaregiverHelp}?</h2>
            <p className="mt-2 text-sm font-semibold text-stone-600 text-center">
              This will discreetly notify your linked caregiver that you would like guidance or support with this conversation.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setHelpDialogOpen(false)}
                className="min-h-14 flex-1 rounded-2xl border-2 border-stone-300 font-black text-stone-700 hover:bg-stone-100 transition"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleRequestHelp}
                className="min-h-14 flex-1 rounded-2xl bg-rose-700 font-black text-white hover:bg-rose-800 shadow-md transition"
              >
                Notify Caregiver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VOICE PROMPT PICKER MODAL                                     */}
      {/* ------------------------------------------------------------- */}
      {voicePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-stone-900 border border-stone-200 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h2 className="text-lg font-black text-stone-950">Speak a Greeting</h2>
              <button
                onClick={() => {
                  stopListening();
                  setVoicePickerOpen(false);
                }}
                className="h-8 w-8 rounded-xl border flex items-center justify-center text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-6">
              <div
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg ${
                  isListening ? 'bg-rose-600 animate-pulse ring-4 ring-rose-200' : 'bg-teal-800'
                }`}
              >
                <Mic className="h-10 w-10" />
              </div>
              <p className="mt-3 text-base font-black">{isListening ? 'Listening...' : 'Processing...'}</p>
              {transcript && (
                <p className="mt-2 text-sm font-bold text-teal-900 italic">"{transcript}"</p>
              )}
            </div>

            <p className="text-xs font-semibold text-stone-500">
              Say e.g. "Good morning", "Have you had tea?", or "How are you?".
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
