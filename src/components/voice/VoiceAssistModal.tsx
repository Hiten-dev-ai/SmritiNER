import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Mic,
  MicOff,
  PhoneCall,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { audioManager } from '../../services/audioManager';
import { voiceService } from '../../services/voiceService';
import type { DetectedVoiceCommand, VoiceActionId } from '../../types';

interface VoiceAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (actionId: VoiceActionId) => void;
}

export const VoiceAssistModal: React.FC<VoiceAssistModalProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
}) => {
  const { selectedLanguage, t } = useApp();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [detectedCommand, setDetectedCommand] = useState<DetectedVoiceCommand | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<DetectedVoiceCommand | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      voiceService.stopListening();
      setIsListening(false);
      setTranscript('');
      setDetectedCommand(null);
      setPendingConfirmation(null);
      setErrorMessage(null);
      return;
    }

    setTranscript('');
    setDetectedCommand(null);
    setPendingConfirmation(null);
    setErrorMessage(null);

    const started = voiceService.startListening(selectedLanguage, {
      onStart: () => {
        setIsListening(true);
        audioManager.play('tap');
      },
      onTranscript: (text, isFinal) => {
        setTranscript(text);
        if (isFinal) {
          const cmd = voiceService.parseVoiceCommand(text, selectedLanguage);
          if (cmd) {
            setDetectedCommand(cmd);
            if (cmd.requiresConfirmation) {
              setPendingConfirmation(cmd);
              audioManager.play('gentle-nudge');
            } else {
              audioManager.play('pair-match');
              setTimeout(() => {
                onExecuteCommand(cmd.actionId);
                onClose();
              }, 600);
            }
          }
        }
      },
      onCommandDetected: (cmd) => {
        setDetectedCommand(cmd);
        if (cmd.requiresConfirmation) {
          setPendingConfirmation(cmd);
          audioManager.play('gentle-nudge');
        } else {
          audioManager.play('pair-match');
          setTimeout(() => {
            onExecuteCommand(cmd.actionId);
            onClose();
          }, 600);
        }
      },
      onError: (err) => {
        setIsListening(false);
        if (err !== 'no-speech') {
          setErrorMessage('Could not hear clearly. Please tap a command below or try again.');
        }
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (!started) {
      setErrorMessage('Microphone access is unavailable on this device.');
    }

    return () => {
      voiceService.stopListening();
    };
  }, [isOpen, selectedLanguage, onClose, onExecuteCommand]);

  if (!isOpen) return null;

  const handleManualCommand = (actionId: VoiceActionId) => {
    audioManager.play('tap');
    onExecuteCommand(actionId);
    onClose();
  };

  const confirmAction = () => {
    if (pendingConfirmation) {
      audioManager.play('pair-match');
      onExecuteCommand(pendingConfirmation.actionId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 p-3 sm:p-5 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl overflow-hidden text-stone-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-900">
              <Volume2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-stone-950">{t.voiceAssist}</h2>
              <span className="text-[11px] font-bold text-stone-500">{selectedLanguage} voice control</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Listening Animation & Transcript */}
        <div className="flex flex-col items-center justify-center py-3 text-center">
          {pendingConfirmation ? (
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-800 mb-2">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-black text-stone-900">{t.confirmAction}</h3>
              <p className="text-sm font-bold text-teal-900 mt-1">{pendingConfirmation.label}</p>
            </div>
          ) : (
            <>
              <div
                className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all ${
                  isListening
                    ? 'bg-teal-700 text-white shadow-xl scale-105 animate-pulse'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {isListening ? <Mic className="h-9 w-9" /> : <MicOff className="h-9 w-9" />}
                {isListening && (
                  <span className="absolute inset-0 rounded-full border-4 border-teal-400 opacity-75 animate-ping" />
                )}
              </div>

              <p className="mt-3 text-sm font-black text-stone-900">
                {isListening ? t.listening : t.speakNow}
              </p>

              {transcript ? (
                <div className="mt-2.5 max-w-xs rounded-2xl bg-stone-100 px-4 py-2 text-sm font-bold text-teal-950 border border-stone-200 shadow-inner">
                  "{transcript}"
                </div>
              ) : (
                <p className="mt-1 text-xs font-semibold text-stone-500">
                  {t.speakNow}
                </p>
              )}
            </>
          )}

          {detectedCommand && !pendingConfirmation && (
            <div className="mt-3 flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-black text-emerald-900 animate-bounce">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{detectedCommand.label}</span>
            </div>
          )}

          {errorMessage && (
            <p className="mt-3 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2 max-w-xs">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Confirmation Actions */}
        {pendingConfirmation ? (
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              onClick={confirmAction}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-teal-800 px-4 font-black text-white shadow-md hover:bg-teal-900"
            >
              <Check className="h-5 w-5" /> {t.confirm}
            </button>
            <button
              onClick={() => {
                setPendingConfirmation(null);
                setDetectedCommand(null);
                setTranscript('');
              }}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-stone-300 bg-stone-50 px-4 font-black text-stone-800"
            >
              <X className="h-5 w-5" /> {t.cancel}
            </button>
          </div>
        ) : (
          /* Quick Tap Fallbacks */
          <div className="mt-4 pt-3 border-t border-stone-200">
            <p className="text-[11px] font-black uppercase tracking-wider text-stone-400 mb-2 text-center">
              Quick Voice Commands
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => handleManualCommand('start_game')}
                className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-teal-50 flex items-center justify-between text-stone-900"
              >
                <span>{t.startGame}</span>
                <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
              </button>
              <button
                onClick={() => handleManualCommand('open_routine')}
                className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-teal-50 flex items-center justify-between text-stone-900"
              >
                <span>{t.openRoutine}</span>
                <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
              </button>
              <button
                onClick={() => handleManualCommand('drink_water')}
                className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-teal-50 flex items-center justify-between text-stone-900"
              >
                <span>{t.addGlass}</span>
                <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
              </button>
              <button
                onClick={() => handleManualCommand('call_family')}
                className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 flex items-center justify-between text-rose-900"
              >
                <span className="flex items-center gap-1">
                  <PhoneCall className="h-3.5 w-3.5" /> {t.callFamily}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-rose-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
