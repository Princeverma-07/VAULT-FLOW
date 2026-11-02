import React, { useState } from 'react';
import { Lock, Delete } from 'lucide-react';
import { MoneyMaxLogo } from './MoneyMaxLogo';

interface PinLockModalProps {
  isOpen: boolean;
  correctPin: string;
  onUnlock: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  correctPin,
  onUnlock,
}) => {
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorShake, setErrorShake] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (enteredPin.length >= 4) return;
    const newPin = enteredPin + num;
    setEnteredPin(newPin);

    if (newPin.length === 4) {
      if (newPin === correctPin) {
        setEnteredPin('');
        onUnlock();
      } else {
        setErrorShake(true);
        setTimeout(() => {
          setEnteredPin('');
          setErrorShake(false);
        }, 500);
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Security PIN Screen"
    >
      <div className="w-full max-w-xs flex flex-col items-center text-center">
        <div className="mb-4">
          <MoneyMaxLogo size="xl" showText={false} />
        </div>

        <div className="flex items-center gap-1.5 mb-1">
          <h2 className="text-xl font-black tracking-tight">MONEY<span className="text-emerald-400">MAX</span></h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold uppercase tracking-wider">Locked</span>
        </div>
        <p className="text-xs text-slate-400 mb-8">Enter your 4-digit PIN to access your vault</p>

        {/* PIN Indicators */}
        <div className={`flex items-center gap-4 mb-10 ${errorShake ? 'animate-bounce text-rose-500' : ''}`}>
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = enteredPin.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-emerald-400 scale-110 shadow-sm shadow-emerald-400/50'
                    : 'bg-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Numeric Touch Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-16 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:bg-emerald-600/30 text-xl font-bold text-white border border-slate-800 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:bg-emerald-600/30 text-xl font-bold text-white border border-slate-800 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label="Delete digit"
            className="h-16 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:bg-rose-500/20 text-slate-400 hover:text-white border border-slate-800 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
