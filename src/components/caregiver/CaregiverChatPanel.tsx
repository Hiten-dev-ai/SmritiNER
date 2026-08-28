import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Check,
  Copy,
  Eye,
  Flag,
  History,
  Key,
  Lock,
  MessageCircle,
  RefreshCw,
  ShieldAlert,
  Unlock,
  UserCheck,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { audioManager } from '../../services/audioManager';
import { chatService } from '../../services/chatService';
import { getReaction, getTemplate } from '../../services/chatTemplates';
import type {
  ChatMessage,
  ConversationAuditEvent,
  ConversationSummary,
  ModerationFlag,
} from '../../types';

interface CaregiverChatPanelProps {
  patientId: string;
  patientName: string;
  isOwner: boolean;
}

export const CaregiverChatPanel: React.FC<CaregiverChatPanelProps> = ({
  patientId,
  patientName,
  isOwner,
}) => {
  const { selectedLanguage, t } = useApp();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [flags, setFlags] = useState<ModerationFlag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals & Panels
  const [generateModalOpen, setGenerateModalOpen] = useState<boolean>(false);
  const [generatedInvite, setGeneratedInvite] = useState<{ tokenCode: string; expiresAt: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const [redeemModalOpen, setRedeemModalOpen] = useState<boolean>(false);
  const [redeemCodeInput, setRedeemCodeInput] = useState<string>('');
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const [historyConv, setHistoryConv] = useState<ConversationSummary | null>(null);
  const [historyMessages, setHistoryMessages] = useState<ChatMessage[]>([]);
  const [auditEvents, setAuditEvents] = useState<ConversationAuditEvent[]>([]);
  const [auditModalOpen, setAuditModalOpen] = useState<boolean>(false);

  const [blockConfirmConv, setBlockConfirmConv] = useState<ConversationSummary | null>(null);
  const [blockReason, setBlockReason] = useState<string>('Caregiver safety decision');

  const [flagModalTarget, setFlagModalTarget] = useState<{ convId: string; msgId?: string } | null>(null);
  const [flagCategory, setFlagCategory] = useState<string>('distress');
  const [flagNotes, setFlagNotes] = useState<string>('');

  const [resolveFlagTarget, setResolveFlagTarget] = useState<ModerationFlag | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');

  const loadData = async () => {
    try {
      const [convs, flagList] = await Promise.all([
        chatService.listConversations(patientId),
        chatService.listFlags(patientId),
      ]);
      setConversations(convs);
      setFlags(flagList);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [patientId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    audioManager.play('tap');
    void loadData();
  };

  const handleCreateInvite = async () => {
    audioManager.play('tap');
    try {
      const res = await chatService.createInvite(patientId);
      setGeneratedInvite(res.invite);
      setGenerateModalOpen(true);
    } catch (err: any) {
      alert(err instanceof Error ? err.message : 'Could not create invite.');
    }
  };

  const handleRedeemInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCodeInput.trim()) return;
    setRedeemError(null);
    audioManager.play('tap');

    try {
      await chatService.redeemInvite(patientId, redeemCodeInput.trim());
      setRedeemModalOpen(false);
      setRedeemCodeInput('');
      audioManager.play('pair-match');
      void loadData();
    } catch (err: any) {
      setRedeemError(err instanceof Error ? err.message : 'Invalid or expired invite code.');
    }
  };

  const handleOpenHistory = async (conv: ConversationSummary) => {
    audioManager.play('tap');
    setHistoryConv(conv);
    const msgs = await chatService.getMessages(patientId, conv.id);
    setHistoryMessages(msgs.messages);
  };

  const handleMuteToggle = async (conv: ConversationSummary) => {
    audioManager.play('tap');
    const isCurrentlyMuted = conv.controls?.incomingMode === 'held-for-caregiver';
    if (isCurrentlyMuted) {
      await chatService.unmuteConnection(patientId, conv.connection.id);
    } else {
      await chatService.muteConnection(patientId, conv.connection.id);
    }
    audioManager.play('pair-match');
    void loadData();
  };

  const handleBlockConfirm = async () => {
    if (!blockConfirmConv) return;
    audioManager.play('tap');
    await chatService.blockConnection(patientId, blockConfirmConv.connection.id, blockReason);
    setBlockConfirmConv(null);
    audioManager.play('pair-match');
    void loadData();
  };

  const handleReleaseMessage = async (convId: string, msgId: string) => {
    audioManager.play('tap');
    await chatService.releaseHeldMessage(patientId, convId, msgId);
    setHistoryMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, recipientVisibility: 'visible' } : m))
    );
    audioManager.play('pair-match');
    void loadData();
  };

  const handleHideMessage = async (convId: string, msgId: string) => {
    audioManager.play('tap');
    await chatService.hideMessage(patientId, convId, msgId, 'Hidden by caregiver during review');
    setHistoryMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, recipientVisibility: 'hidden' } : m))
    );
    audioManager.play('pair-match');
    void loadData();
  };

  const handleRaiseFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagModalTarget) return;
    audioManager.play('tap');
    await chatService.raiseFlag(patientId, flagModalTarget.convId, {
      messageId: flagModalTarget.msgId,
      category: flagCategory,
      notes: flagNotes,
    });
    setFlagModalTarget(null);
    setFlagNotes('');
    audioManager.play('pair-match');
    void loadData();
  };

  const handleResolveFlag = async (status: string) => {
    if (!resolveFlagTarget) return;
    audioManager.play('tap');
    await chatService.updateFlag(patientId, resolveFlagTarget.id, {
      status,
      resolutionNotes,
    });
    setResolveFlagTarget(null);
    setResolutionNotes('');
    audioManager.play('pair-match');
    void loadData();
  };

  const handleOpenAudit = async (conv: ConversationSummary) => {
    audioManager.play('tap');
    const events = await chatService.getAuditEvents(patientId, conv.id);
    setAuditEvents(events);
    setAuditModalOpen(true);
  };

  return (
    <div className="space-y-6 text-stone-900 animate-fadeIn">
      {/* ------------------------------------------------------------- */}
      {/* HEADER & ACTION BUTTONS                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-stone-950 flex items-center gap-2">
            <MessageCircle className="h-7 w-7 text-teal-700" />
            Supervised Greetings & Connections
          </h2>
          <p className="text-sm font-semibold text-stone-600">
            Caregiver-moderated messaging for {patientName}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isOwner && (
            <>
              <button
                onClick={handleCreateInvite}
                className="flex h-11 items-center gap-2 rounded-xl bg-tea-800 px-4 text-xs font-black text-white hover:bg-tea-900 shadow-sm transition"
              >
                <Key className="h-4 w-4" />
                <span>{t.generateInvite}</span>
              </button>

              <button
                onClick={() => {
                  setRedeemError(null);
                  setRedeemCodeInput('');
                  setRedeemModalOpen(true);
                }}
                className="flex h-11 items-center gap-2 rounded-xl border-2 border-stone-300 bg-white px-4 text-xs font-black text-stone-800 hover:bg-stone-50 shadow-sm transition"
              >
                <UserCheck className="h-4 w-4 text-teal-700" />
                <span>{t.redeemInvite}</span>
              </button>
            </>
          )}

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition shadow-sm"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* OPEN FLAGS NOTICE IF ANY */}
      {flags.filter((f) => f.status === 'open' || f.status === 'reviewing').length > 0 && (
        <div className="rounded-3xl border-2 border-rose-300 bg-rose-50/90 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-rose-950">
            <ShieldAlert className="h-6 w-6 text-rose-600" />
            <h3 className="text-lg font-black">
              Active Moderation Flags ({flags.filter((f) => f.status === 'open' || f.status === 'reviewing').length})
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {flags.filter((f) => f.status === 'open' || f.status === 'reviewing').map((flag) => (
              <div
                key={flag.id}
                className="rounded-2xl border border-rose-200 bg-white p-4 space-y-2 text-xs font-bold"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-block rounded-full bg-rose-100 px-2.5 py-0.5 font-black uppercase text-rose-800 text-[10px]">
                    {flag.category}
                  </span>
                  <span className="text-stone-400">{new Date(flag.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-stone-900 text-sm font-extrabold">{flag.notes || 'Caregiver or patient flagged concern.'}</p>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setResolveFlagTarget(flag);
                      setResolutionNotes('');
                    }}
                    className="rounded-lg bg-rose-700 px-3 py-1.5 font-black text-white hover:bg-rose-800 transition"
                  >
                    Resolve Flag
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CONNECTION CARDS                                              */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3">
        <h3 className="text-lg font-black text-stone-900">Approved Patient Connections</h3>

        {conversations.length === 0 && !loading && (
          <div className="rounded-3xl border-2 border-dashed border-stone-300 bg-white p-8 text-center text-stone-500 font-bold">
            <MessageCircle className="mx-auto h-12 w-12 text-stone-300 mb-2" />
            <p>No active connections found for {patientName}.</p>
            {isOwner && <p className="text-xs mt-1 text-teal-800">Tap "Generate 24-hr Invite Code" above to connect with another family.</p>}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {conversations.map((conv) => {
            const isMuted = conv.controls?.incomingMode === 'held-for-caregiver';
            const isBlocked = conv.connection.status === 'blocked';
            const isAwaitingAck = conv.connection.status === 'awaiting-patient-ack';

            return (
              <div
                key={conv.id}
                className="rounded-3xl border-2 border-stone-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div>
                  {/* Title & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-2xl shadow-inner">
                        👤
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-stone-950">
                          {conv.connection.otherPatientName}
                        </h4>
                        <span className="text-xs font-bold text-stone-500">
                          {conv.connection.otherPatientDistrict || 'Approved Contact'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isBlocked && (
                        <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-rose-800">
                          Blocked
                        </span>
                      )}
                      {isMuted && !isBlocked && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-800">
                          Muted (Held)
                        </span>
                      )}
                      {isAwaitingAck && !isBlocked && (
                        <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-sky-800">
                          Awaiting Ack
                        </span>
                      )}
                      {!isBlocked && !isMuted && !isAwaitingAck && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-800">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Held / Flag notices */}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                    {(conv.heldMessageCount || 0) > 0 && (
                      <span className="rounded-xl bg-amber-100 px-3 py-1 text-amber-900 border border-amber-300">
                        ⚠️ {conv.heldMessageCount} message(s) held for review
                      </span>
                    )}
                    {(conv.openFlagCount || 0) > 0 && (
                      <span className="rounded-xl bg-rose-100 px-3 py-1 text-rose-900 border border-rose-300">
                        🚩 {conv.openFlagCount} open flag(s)
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="border-t border-stone-100 pt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleOpenHistory(conv)}
                    className="flex-1 min-h-11 flex items-center justify-center gap-1.5 rounded-xl bg-teal-800 px-3 text-xs font-black text-white hover:bg-teal-900 shadow-sm transition"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Supervised History</span>
                  </button>

                  <button
                    onClick={() => handleMuteToggle(conv)}
                    disabled={isBlocked}
                    className={`min-h-11 px-3 rounded-xl border text-xs font-black transition flex items-center gap-1 ${
                      isMuted
                        ? 'border-teal-300 bg-teal-50 text-teal-900 hover:bg-teal-100'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {isMuted ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    <span>{isMuted ? t.unmuteContact : t.muteContact}</span>
                  </button>

                  <button
                    onClick={() => handleOpenAudit(conv)}
                    className="min-h-11 px-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 text-xs font-black transition flex items-center gap-1"
                    aria-label="Audit history"
                  >
                    <History className="h-4 w-4" />
                  </button>

                  {!isBlocked ? (
                    <button
                      onClick={() => setBlockConfirmConv(conv)}
                      className="min-h-11 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-black transition flex items-center gap-1"
                    >
                      <Ban className="h-4 w-4" />
                      <span>{t.emergencyBlock}</span>
                    </button>
                  ) : (
                    isOwner && (
                      <button
                        onClick={handleCreateInvite}
                        className="min-h-11 px-3 rounded-xl bg-amber-100 text-amber-900 font-black text-xs hover:bg-amber-200 transition"
                      >
                        Reconnect Invite
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* GENERATE INVITE MODAL                                         */}
      {/* ------------------------------------------------------------- */}
      {generateModalOpen && generatedInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-stone-900 border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h2 className="text-xl font-black text-stone-950">{t.generateInvite}</h2>
              <button
                onClick={() => setGenerateModalOpen(false)}
                className="h-8 w-8 rounded-xl border flex items-center justify-center text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-xs font-semibold text-stone-600">
              Share this 10-character code with the other patient's owner caregiver. Valid for 24 hours.
            </p>

            <div className="my-5 rounded-2xl bg-teal-50 p-5 border-2 border-teal-200 text-center">
              <span className="block text-xs font-black uppercase tracking-widest text-teal-700 mb-1">
                {t.inviteCode}
              </span>
              <span className="block text-3xl font-black tracking-wider text-teal-950 font-mono">
                {generatedInvite.tokenCode}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedInvite.tokenCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 3000);
                }}
                className="min-h-12 flex-1 rounded-xl bg-teal-800 font-black text-white hover:bg-teal-900 transition flex items-center justify-center gap-2"
              >
                {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
              <button
                onClick={() => setGenerateModalOpen(false)}
                className="min-h-12 px-6 rounded-xl border border-stone-300 font-black text-stone-700 hover:bg-stone-100"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* REDEEM INVITE MODAL                                           */}
      {/* ------------------------------------------------------------- */}
      {redeemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-stone-900 border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h2 className="text-xl font-black text-stone-950">{t.redeemInvite}</h2>
              <button
                onClick={() => setRedeemModalOpen(false)}
                className="h-8 w-8 rounded-xl border flex items-center justify-center text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRedeemInvite} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-stone-500 mb-1">
                  10-Character Invite Code
                </label>
                <input
                  type="text"
                  value={redeemCodeInput}
                  onChange={(e) => setRedeemCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. 4X9K-MN27PQ"
                  className="w-full rounded-xl border-2 border-stone-300 p-3 font-mono text-lg font-black uppercase text-stone-900 focus:border-teal-600 focus:outline-none"
                  maxLength={12}
                  required
                />
                <span className="mt-1 block text-[11px] font-semibold text-stone-500">
                  {t.enterInviteCode}
                </span>
              </div>

              {redeemError && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-900">
                  {redeemError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRedeemModalOpen(false)}
                  className="min-h-12 flex-1 rounded-xl border border-stone-300 font-black text-stone-700 hover:bg-stone-100"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="min-h-12 flex-1 rounded-xl bg-teal-800 font-black text-white hover:bg-teal-900 shadow-md transition"
                >
                  Accept Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUPERVISED HISTORY VIEWER MODAL                               */}
      {/* ------------------------------------------------------------- */}
      {historyConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-5 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-5 sm:p-6 shadow-2xl max-h-[90vh] flex flex-col border border-stone-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 shrink-0">
              <div>
                <h3 className="text-xl font-black text-stone-950">
                  Supervised Message History
                </h3>
                <span className="text-xs font-bold text-stone-500">
                  {patientName} ↔ {historyConv.connection.otherPatientName}
                </span>
              </div>
              <button
                onClick={() => setHistoryConv(null)}
                className="h-9 w-9 rounded-xl border flex items-center justify-center text-stone-600 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Message Stream */}
            <div className="my-4 flex-1 overflow-y-auto space-y-3 pr-1">
              {historyMessages.length === 0 && (
                <div className="text-center py-12 text-stone-400 font-bold">
                  No messages found in this conversation.
                </div>
              )}

              {historyMessages.map((msg) => {
                const isMyPatient = msg.senderPatientId === patientId;
                const template = getTemplate(msg.templateKey);
                const reaction = getReaction(msg.reactionCode);
                const isHeld = msg.recipientVisibility === 'held';
                const isHidden = msg.recipientVisibility === 'hidden';

                return (
                  <div
                    key={msg.id}
                    className={`rounded-2xl border p-4 space-y-2 text-sm ${
                      isHeld
                        ? 'border-amber-300 bg-amber-50/80'
                        : isHidden
                        ? 'border-stone-300 bg-stone-100 opacity-75'
                        : 'border-stone-200 bg-white'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-stone-700">
                        {isMyPatient ? `${patientName} (Sender)` : `${historyConv.connection.otherPatientName} (Sender)`} · via {msg.compositionMethod}
                      </span>
                      <span className="text-stone-400 font-mono">
                        {new Date(msg.acceptedAt || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Message content */}
                    {msg.messageType === 'reaction' && reaction && (
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{reaction.emoji}</span>
                        <span className="font-black text-stone-900">
                          {reaction.label.English} ({reaction.label[selectedLanguage]})
                        </span>
                      </div>
                    )}

                    {msg.messageType === 'template' && template && (
                      <div className="space-y-1">
                        <p className="font-extrabold text-stone-950 text-base">"{template.text.English}"</p>
                        {selectedLanguage !== 'English' && (
                          <p className="text-xs font-bold text-stone-600 italic">"{template.text[selectedLanguage]}"</p>
                        )}
                      </div>
                    )}

                    {/* Moderation Badges & Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                      <div>
                        {isHeld && (
                          <span className="inline-block rounded-md bg-amber-200 px-2 py-0.5 font-black text-amber-950">
                            Held from recipient
                          </span>
                        )}
                        {isHidden && (
                          <span className="inline-block rounded-md bg-stone-300 px-2 py-0.5 font-black text-stone-800">
                            Hidden from patient
                          </span>
                        )}
                        {!isHeld && !isHidden && (
                          <span className="inline-block rounded-md bg-emerald-100 px-2 py-0.5 font-black text-emerald-900">
                            Visible to recipient
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isHeld && (
                          <button
                            onClick={() => handleReleaseMessage(historyConv.id, msg.id)}
                            className="rounded-lg bg-emerald-700 px-2.5 py-1 font-black text-white hover:bg-emerald-800 text-[11px]"
                          >
                            Release to Patient
                          </button>
                        )}
                        {!isHidden && (
                          <button
                            onClick={() => handleHideMessage(historyConv.id, msg.id)}
                            className="rounded-lg bg-stone-200 px-2.5 py-1 font-bold text-stone-800 hover:bg-stone-300 text-[11px]"
                          >
                            Hide
                          </button>
                        )}
                        <button
                          onClick={() => setFlagModalTarget({ convId: historyConv.id, msgId: msg.id })}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 font-bold text-rose-800 hover:bg-rose-100 text-[11px] flex items-center gap-1"
                        >
                          <Flag className="h-3 w-3" />
                          <span>Flag</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setHistoryConv(null)}
                className="rounded-xl border bg-stone-100 px-5 py-2 text-xs font-black text-stone-700 hover:bg-stone-200"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* EMERGENCY BLOCK CONFIRMATION MODAL                           */}
      {/* ------------------------------------------------------------- */}
      {blockConfirmConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-stone-900 border border-stone-200">
            <AlertTriangle className="mx-auto h-12 w-12 text-rose-600 mb-2" />
            <h2 className="text-xl font-black text-center text-stone-950">{t.emergencyBlock}</h2>
            <p className="mt-2 text-xs font-semibold text-stone-600 text-center">
              Blocking immediately suspends messaging in both directions and rejects any offline pending deliveries upon synchronization.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-black uppercase text-stone-500 mb-1">
                Reason for Block
              </label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full rounded-xl border border-stone-300 p-2.5 text-sm font-bold"
                placeholder="Caregiver safety decision"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setBlockConfirmConv(null)}
                className="min-h-12 flex-1 rounded-xl border border-stone-300 font-black text-stone-700 hover:bg-stone-100"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleBlockConfirm}
                className="min-h-12 flex-1 rounded-xl bg-rose-700 font-black text-white hover:bg-rose-800 shadow-md"
              >
                Confirm Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FLAG CREATION MODAL                                           */}
      {/* ------------------------------------------------------------- */}
      {flagModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-stone-900 border border-stone-200">
            <h2 className="text-xl font-black text-stone-950 flex items-center gap-2">
              <Flag className="h-5 w-5 text-rose-600" />
              Flag Conversation / Message
            </h2>
            <p className="mt-1 text-xs font-bold text-amber-800">
              Note: Moderation notes are shared with the linked care circles on both sides.
            </p>

            <form onSubmit={handleRaiseFlag} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-black uppercase text-stone-500 mb-1">
                  Category
                </label>
                <select
                  value={flagCategory}
                  onChange={(e) => setFlagCategory(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-sm font-bold bg-white"
                >
                  <option value="distress">Distress / Anxiety</option>
                  <option value="confusion">Confusion / Disorientation</option>
                  <option value="repeated-contact">Repeated / Excessive Contact</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="patient-requested-help">Patient Requested Help</option>
                  <option value="other">Other Concern</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-stone-500 mb-1">
                  Shared Moderation Notes
                </label>
                <textarea
                  value={flagNotes}
                  onChange={(e) => setFlagNotes(e.target.value)}
                  placeholder="Describe concern for caregivers..."
                  rows={3}
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-sm font-semibold"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFlagModalTarget(null)}
                  className="min-h-12 flex-1 rounded-xl border border-stone-300 font-black text-stone-700 hover:bg-stone-100"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="min-h-12 flex-1 rounded-xl bg-rose-700 font-black text-white hover:bg-rose-800"
                >
                  Submit Flag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* RESOLVE FLAG MODAL                                            */}
      {/* ------------------------------------------------------------- */}
      {resolveFlagTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-stone-900 border border-stone-200">
            <h2 className="text-xl font-black text-stone-950">Resolve Moderation Flag</h2>
            <p className="mt-1 text-xs font-bold text-stone-500">
              Flag: {resolveFlagTarget.category} ({resolveFlagTarget.notes})
            </p>

            <div className="my-4">
              <label className="block text-xs font-black uppercase text-stone-500 mb-1">
                Resolution Notes
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Action taken (e.g. reviewed with elder, contact adjusted)..."
                rows={3}
                className="w-full rounded-xl border border-stone-300 p-2.5 text-sm font-semibold"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setResolveFlagTarget(null)}
                className="min-h-12 flex-1 rounded-xl border border-stone-300 font-black text-stone-700"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => handleResolveFlag('resolved')}
                className="min-h-12 flex-1 rounded-xl bg-teal-800 font-black text-white hover:bg-teal-900"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* AUDIT LOG MODAL                                               */}
      {/* ------------------------------------------------------------- */}
      {auditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl max-h-[85vh] flex flex-col border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h2 className="text-xl font-black text-stone-950 flex items-center gap-2">
                <History className="h-5 w-5 text-teal-700" />
                {t.auditTrail}
              </h2>
              <button
                onClick={() => setAuditModalOpen(false)}
                className="h-8 w-8 rounded-xl border flex items-center justify-center text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-4 flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {auditEvents.length === 0 && (
                <p className="text-center py-8 text-stone-400 font-bold">No audit events recorded.</p>
              )}
              {auditEvents.map((evt) => (
                <div key={evt.id} className="rounded-xl border bg-stone-50 p-3 space-y-1">
                  <div className="flex items-center justify-between font-black">
                    <span className="text-teal-950 uppercase tracking-wider">{evt.eventType}</span>
                    <span className="text-stone-400 font-mono">{new Date(evt.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-stone-600 font-semibold font-mono text-[11px] break-all">{evt.detailsJson}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setAuditModalOpen(false)}
              className="min-h-12 w-full rounded-xl bg-stone-100 font-black text-stone-700 hover:bg-stone-200"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
