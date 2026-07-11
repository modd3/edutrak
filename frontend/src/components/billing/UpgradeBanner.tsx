interface UpgradeBannerProps {
  onUpgrade: () => void;
  title?: string;
  description?: string;
  buttonLabel?: string;
}

export function UpgradeBanner({
  onUpgrade,
  title = 'Teacher limit reached',
  description = 'To add a 21st teacher or more staff members, your school must upgrade to the next tier.',
  buttonLabel = 'Upgrade to Growth Plan',
}: UpgradeBannerProps) {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-400 rounded-xl px-6 py-[18px] flex items-center justify-between gap-6 shadow-[0_2px_12px_rgba(251,191,36,0.12)]">
      <div className="flex items-start gap-3.5 flex-1">
        <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-400 flex items-center justify-center text-lg flex-shrink-0">
          ⚠️
        </div>
        <div>
          <p className="m-0 text-sm font-semibold text-amber-900">{title}</p>
          <p className="m-0 text-[13px] text-amber-700 leading-relaxed">{description}</p>
        </div>
      </div>

      <button
        onClick={onUpgrade}
        className="bg-gradient-to-r from-indigo-700 to-indigo-800 text-white border-none rounded-xl px-[22px] py-3 text-sm font-bold cursor-pointer whitespace-nowrap tracking-tight shadow-[0_4px_16px_rgba(67,56,202,0.35)] hover:from-indigo-800 hover:to-indigo-900 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(67,56,202,0.45)] transition-all duration-150 flex items-center gap-2"
      >
        <span>⚡</span>
        {buttonLabel}
      </button>
    </div>
  );
}