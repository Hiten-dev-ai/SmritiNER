import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Droplets,
  HelpCircle,
  Mic,
  MicOff,
  PhoneCall,
  Pill,
  Play,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { audioManager } from '../../services/audioManager';
import { matchVoiceCommand } from '../../services/voiceService';
import type { DetectedVoiceCommand, VoiceActionId } from '../../types';

interface VoiceAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (actionId: VoiceActionId) => void;
  context?: 'patient-home' | 'routine';
}

export const VoiceAssistModal: React.FC<VoiceAssistModalProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
  context = 'patient-home',
}) => {
  const { selectedLanguage, stopReadAloud, t } = useApp();
  const { isListening, transcript, startListening, stopListening, isSupported, error } =
    useVoiceInput(selectedLanguage);

  const [detectedCommand, setDetectedCommand] = useState<DetectedVoiceCommand | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<DetectedVoiceCommand | null>(null);
  const [unrecognizedNotice, setUnrecognizedNotice] = useState<boolean>(false);

  // Auto-start listening on open after stopping any active readAloud audio
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setDetectedCommand(null);
      setPendingConfirmation(null);
      setUnrecognizedNotice(false);
      return;
    }

    setDetectedCommand(null);
    setPendingConfirmation(null);
    setUnrecognizedNotice(false);

    // Ensure audio output is stopped before capturing microphone input
    stopReadAloud();
    if (isSupported) {
      startListening();
      audioManager.play('tap');
    }
  }, [isOpen, isSupported, startListening, stopListening, stopReadAloud]);

  // When speech recognition finishes and delivers a transcript, evaluate commands
  useEffect(() => {
    if (!isOpen) return;

    if (!isListening && transcript) {
      const cmd = matchVoiceCommand(transcript, selectedLanguage, context);
      if (cmd) {
        setDetectedCommand(cmd);
        setUnrecognizedNotice(false);
        if (cmd.requiresConfirmation) {
          setPendingConfirmation(cmd);
          audioManager.play('gentle-nudge');
        } else {
          audioManager.play('pair-match');
          onExecuteCommand(cmd.actionId);
          onClose();
        }
      } else {
        setUnrecognizedNotice(true);
        audioManager.play('tile-blocked');
      }
    }
  }, [isListening, transcript, isOpen, selectedLanguage, context, onExecuteCommand, onClose]);

  if (!isOpen) return null;

  const handleManualAction = (actionId: VoiceActionId, requiresConfirm = false) => {
    audioManager.play('tap');
    if (requiresConfirm) {
      setPendingConfirmation({
        actionId,
        label: actionId === 'drink_water' ? t.hydrationTitle : t.callFamily,
        confidence: 1.0,
        requiresConfirmation: true,
        transcript: '',
      });
    } else {
      onExecuteCommand(actionId);
      onClose();
    }
  };

  const confirmAction = () => {
    if (pendingConfirmation) {
      audioManager.play('pair-match');
      onExecuteCommand(pendingConfirmation.actionId);
      onClose();
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      stopReadAloud();
      setUnrecognizedNotice(false);
      setDetectedCommand(null);
      startListening();
      audioManager.play('tap');
    }
  };

  const getErrorMessage = () => {
    if (!isSupported || error === 'unsupported') {
      return t.unsupportedBrowser;
    }
    if (error === 'permission-denied') {
      return t.permissionDenied;
    }
    if (error === 'no-microphone') {
      return t.noMicrophone;
    }
    if (error === 'network') {
      return t.recognitionNeedsNetwork;
    }
    if (error === 'no-speech') {
      return t.noSpeechHeard;
    }
    if (error === 'language-unavailable') {
      return t.assameseFallbackNotice;
    }
    if (unrecognizedNotice) {
      return t.commandNotRecognized;
    }
    return null;
  };

  const activeError = getErrorMessage();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-3 sm:p-5 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-[2rem] bg-white p-5 sm:p-6 shadow-2xl overflow-hidden text-stone-900 border border-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-100 text-teal-900">
              <Volume2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-950">{t.voiceCommands}</h2>
              <span className="text-xs font-bold text-stone-500">
                {selectedLanguage} · Push-to-talk
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 transition"
            aria-label={t.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Confirmation State for Sensitive Commands */}
        {pendingConfirmation ? (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-center animate-scaleUp">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-600 mb-2" />
            <h3 className="text-xl font-black text-amber-950">
              {pendingConfirmation.actionId === 'drink_water'
                ? t.confirmHydration
                : t.confirmFamilyCall}
            </h3>
            <p className="mt-1 text-sm font-semibold text-amber-800">
              {pendingConfirmation.actionId === 'drink_water'
                ? 'Adds 1 glass to your daily hydration goal.'
                : 'Initiates emergency call to your primary family contact.'}
            </p>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setPendingConfirmation(null)}
                className="min-h-14 flex-1 rounded-2xl border-2 border-stone-300 bg-white font-black text-stone-700 hover:bg-stone-100 transition"
              >
                {t.cancel}
              </button>
              <button
                onClick={confirmAction}
                className="min-h-14 flex-1 rounded-2xl bg-teal-800 font-black text-white hover:bg-teal-900 transition flex items-center justify-center gap-2"
              >
                <Check className="h-5 w-5" />
                {t.confirm}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-2 text-center">
            {/* Microphone Button (72-80px target) */}
            <div className="relative my-2">
              {isListening && (
                <div className="absolute -inset-3 rounded-full bg-teal-400/30 motion-safe:animate-ping" />
              )}
              <button
                onClick={handleMicToggle}
                className={`relative flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition transform hover:scale-105 active:scale-95 ${
                  isListening
                    ? 'bg-rose-600 text-white motion-safe:animate-pulse ring-4 ring-rose-200'
                    : 'bg-teal-800 text-white hover:bg-teal-900 ring-4 ring-teal-100'
                }`}
                aria-label={isListening ? t.stopListening : t.startListening}
              >
                {isListening ? <Mic className="h-10 w-10" /> : <MicOff className="h-9 w-9" />}
              </button>
            </div>

            {/* Listening / Status State */}
            <p className="text-base font-black text-stone-900 mt-2">
              {isListening ? t.listening : t.speakNow}
            </p>

            {/* Live Partial Transcript */}
            {transcript && (
              <div className="mt-3 w-full rounded-2xl bg-stone-100 p-3 border border-stone-200/80">
                <span className="text-[11px] font-black uppercase text-stone-500 block mb-1">
                  {isListening ? 'Live Transcript' : 'Heard'}
                </span>
                <p className="text-lg font-bold text-teal-950 italic">
                  "{transcript}"
                </p>
              </div>
            )}

            {/* Detected Command Highlight */}
            {detectedCommand && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1 text-sm font-black text-emerald-900 border border-emerald-300">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                {detectedCommand.label}
              </div>
            )}

            {/* Error or Guidance Notice */}
            {activeError && (
              <div className="mt-3 w-full rounded-2xl bg-amber-50 p-3 border border-amber-200 text-left flex items-start gap-2.5">
                <HelpCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-amber-950 leading-relaxed">
                  {activeError}
                </p>
              </div>
            )}

            {/* Direct Quick Action Buttons (>= 56px height) */}
            <div className="mt-5 w-full border-t border-stone-200 pt-4">
              <span className="block text-xs font-black uppercase text-stone-400 mb-2.5 text-left">
                Or tap a command below:
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleManualAction('start_game')}
                  className="min-h-14 flex items-center justify-start gap-2.5 rounded-2xl border-2 border-stone-200 bg-stone-50/80 px-3 text-left font-bold text-stone-900 hover:bg-white hover:border-teal-400 transition"
                >
                  <Play className="h-5 w-5 text-teal-700 shrink-0" />
                  <span className="text-sm font-black truncate">{t.startGame}</span>
                </button>

                <button
                  onClick={() => handleManualAction('read_routine')}
                  className="min-h-14 flex items-center justify-start gap-2.5 rounded-2xl border-2 border-stone-200 bg-stone-50/80 px-3 text-left font-bold text-stone-900 hover:bg-white hover:border-teal-400 transition"
                >
                  <Volume2 className="h-5 w-5 text-teal-700 shrink-0" />
                  <span className="text-sm font-black truncate">{t.readRoutine}</span>
                </button>

                <button
                  onClick={() => handleManualAction('open_routine')}
                  className="min-h-14 flex items-center justify-start gap-2.5 rounded-2xl border-2 border-stone-200 bg-stone-50/80 px-3 text-left font-bold text-stone-900 hover:bg-white hover:border-teal-400 transition"
                >
                  <Pill className="h-5 w-5 text-rose-600 shrink-0" />
                  <span className="text-sm font-black truncate">{t.openRoutine}</span>
                </button>

                <button
                  onClick={() => handleManualAction('drink_water', true)}
                  className="min-h-14 flex items-center justify-start gap-2.5 rounded-2xl border-2 border-stone-200 bg-stone-50/80 px-3 text-left font-bold text-stone-900 hover:bg-white hover:border-sky-400 transition"
                >
                  <Droplets className="h-5 w-5 text-sky-600 shrink-0" />
                  <span className="text-sm font-black truncate">+ {t.addGlass}</span>
                </button>

                <button
                  onClick={() => handleManualAction('call_family', true)}
                  className="col-span-2 min-h-14 flex items-center justify-center gap-2.5 rounded-2xl bg-rose-700 px-4 text-center font-black text-white hover:bg-rose-800 transition"
                >
                  <PhoneCall className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-black">{t.callFamily} / SOS</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
