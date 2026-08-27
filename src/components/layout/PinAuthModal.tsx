import React, { useState } from 'react';
import { ShieldCheck, X, Delete } from 'lucide-react';
import { audioManager } from '../../services/audioManager';
import { useApp } from '../../context/AppContext';

interface PinAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
}

export const PinAuthModal: React.FC<PinAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Caregiver & Clinical Access',
}) => {
  const { t } = useApp();
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    audioManager.playTap();
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(false);

      if (newPin.length === 4) {
        if (newPin === '1234') {
          audioManager.playSuccess();
          setTimeout(() => {
            onSuccess();
            setPin('');
          }, 200);
        } else {
          audioManager.playTryAgain();
          setError(true);
          setTimeout(() => setPin(''), 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    audioManager.playTap();
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="pin-title">
      <div className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-sm overflow-y-auto rounded-3xl border-2 border-tea-600/30 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-tea-100 text-tea-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 id="pin-title" className="font-bold text-gray-900 text-lg leading-tight">{title}</h3>
              <p className="text-xs text-gray-500">Security PIN required</p>
              <p className="text-xs font-semibold text-amber-700">{t.localDemoAccess}</p>
            </div>
          </div>
          <button
            onClick={() => {
              audioManager.playTap();
              onClose();
            }}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            aria-label="Close caregiver access"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-6 text-center">
          <p className="text-sm text-gray-600 mb-3">
            Enter the four-digit caregiver PIN
          </p>
          <div className="flex justify-center space-x-4">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                  error
                    ? 'border-red-500 bg-red-50 text-red-600 animate-shake'
                    : pin.length > idx
                    ? 'border-tea-600 bg-tea-50 text-tea-800'
                    : 'border-gray-200 bg-gray-50 text-gray-400'
                }`}
              >
                {pin.length > idx ? '●' : ''}
              </div>
            ))}
          </div>
          {error && <p className="text-xs font-semibold text-red-600 mt-2" role="alert">Incorrect PIN. Please try again.</p>}
        </div>

        {/* Tactile Keypad */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="tactile-btn h-[56px] rounded-2xl bg-gray-100 hover:bg-gray-200 text-xl font-bold text-gray-800 active:bg-tea-100"
              aria-label={`PIN digit ${d}`}
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => {
              audioManager.playTap();
              setPin('');
            }}
            className="tactile-btn h-[56px] rounded-2xl bg-gray-50 text-sm font-bold text-gray-600 hover:bg-gray-100"
            aria-label="Clear PIN"
          >
            CLEAR
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="tactile-btn h-[56px] rounded-2xl bg-gray-100 hover:bg-gray-200 text-xl font-bold text-gray-800 active:bg-tea-100"
            aria-label="PIN digit 0"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="tactile-btn flex h-[56px] items-center justify-center rounded-2xl bg-gray-100 text-gray-700 hover:bg-gray-200"
            aria-label="Delete last PIN digit"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
