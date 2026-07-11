import { useEffect, useState } from 'react';

interface LimitWarningModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  currentPlanName?: string;
  currentLimit?: number;
  newPlanName?: string;
  newLimit?: number;
  price?: string;
}

export function LimitWarningModal({
  open,
  onClose,
  onUpgrade,
  currentPlanName = 'Starter Plan',
  currentLimit = 20,
  newPlanName = 'Growth Plan',
  newLimit = 50,
  price = '$400/mo',
}: LimitWarningModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  if (!open) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      style={{
        background: 'rgba(11, 15, 25, 0.5)',
        backdropFilter: 'blur(4px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full"
        style={{
          maxWidth: 520,
          padding: 32,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
          transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease',
        }}
      >
        {/* Header with icon */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-11 h-11 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1e1b4b] m-0">Teacher Limit Reached</h2>
          </div>
        </div>

        {/* Body text */}
        <p className="text-sm text-slate-600 leading-relaxed mb-5 m-0">
          Your school is currently on the <strong>{currentPlanName}</strong>, which supports a maximum of{' '}
          <strong>{currentLimit} teachers</strong>. To add a {currentLimit + 1}st teacher and continue expanding
          your staff, you must upgrade your workspace subscription to the <strong>{newPlanName}</strong>.
        </p>

        {/* Comparison box */}
        <div className="border border-indigo-200 bg-indigo-50/50 rounded-lg px-4 py-3 flex items-center justify-between mb-6">
          <div className="text-sm text-slate-600">
            <span className="font-medium text-slate-800">Current:</span> {currentPlanName} ({currentLimit} Teachers max)
          </div>
          <span className="text-indigo-500 font-bold mx-3">→</span>
          <div className="text-sm text-slate-600">
            <span className="font-medium text-emerald-700">New Tier:</span> {newPlanName} (Up to {newLimit} Teachers)
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-transparent border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              handleClose();
              setTimeout(onUpgrade, 220);
            }}
            className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-700 to-indigo-800 rounded-lg shadow-[0_4px_16px_rgba(67,56,202,0.3)] hover:from-indigo-800 hover:to-indigo-900 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(67,56,202,0.4)] transition-all duration-150 cursor-pointer"
          >
            Upgrade to {newPlanName} ({price})
          </button>
        </div>
      </div>
    </div>
  );
}