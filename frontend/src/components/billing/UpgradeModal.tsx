import { useState, useEffect } from 'react';
import type { Plan } from '@/types';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  plans?: Plan[];
  currentPlanName?: string;
  currentPrice?: number;
  currency?: string;
  onConfirm?: (planId: string, billing: 'monthly' | 'annual') => void;
}

export function UpgradeModal({
  open,
  onClose,
  plans = [],
  currentPlanName = 'Starter Plan',
  currentPrice = 20000,
  currency = 'KES',
  onConfirm,
}: UpgradeModalProps) {
  const [selected, setSelected] = useState('');
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');
  const [step, setStep] = useState<'pick' | 'confirm'>('pick');
  const [visible, setVisible] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Map DB plans to display format, or use defaults if no plans exist
  const displayPlans = plans.length > 0
    ? plans.map((p, i) => ({
        id: p.id,
        name: p.name,
        price: p.priceMinor,
        badge: i === 0 ? 'Recommended' : i === 1 ? 'Enterprise' : 'Plan',
        badgeColor: i === 0 ? '#6366f1' : i === 1 ? '#7c3aed' : '#64748b',
        students: p.features?.find(f => f.featureKey === 'max_students')?.limitValue ?? 150,
        teachers: p.features?.find(f => f.featureKey === 'max_teachers')?.limitValue ?? 20,
        storage: p.features?.find(f => f.featureKey === 'storage_gb')?.limitValue
          ? `${p.features.find(f => f.featureKey === 'storage_gb')?.limitValue} GB`
          : '50 GB',
        features: p.features?.map(f => f.featureKey.replace(/_/g, ' ')) ?? [],
        highlight: i === 0,
      }))
    : [];

  // Pre-select first plan
  useEffect(() => {
    if (displayPlans.length > 0 && !selected) {
      setSelected(displayPlans[0].id);
    }
  }, [displayPlans, selected]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
      setStep('pick');
      setConfirmed(false);
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 220);
  };

  const activePlan = displayPlans.find(p => p.id === selected);
  const price = billing === 'annual' && activePlan
    ? Math.round(activePlan.price * 0.8)
    : activePlan?.price ?? 0;
  const savings = billing === 'annual' && activePlan
    ? Math.round(activePlan.price * 12 - price * 12)
    : 0;

  const handleConfirm = () => {
    setConfirmed(true);
    if (onConfirm && activePlan) {
      onConfirm(activePlan.id, billing);
    }
    setTimeout(handleClose, 2200);
  };

  // Show nothing if modal is not open
  if (!open) return null;

  const activeDisplayPlan = activePlan;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      style={{
        background: 'rgba(15, 14, 36, 0.65)',
        backdropFilter: 'blur(4px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.22s ease',
      }}
    >
      <div
        className="bg-white rounded-2xl w-full max-h-[90vh] overflow-y-auto relative"
        style={{
          maxWidth: 780,
          boxShadow: '0 32px 80px rgba(15,14,36,0.35)',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease',
        }}
      >
        {/* Modal Header */}
        <div className="px-8 pt-7 pb-6 border-b border-slate-100 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-2xl">⚡</span>
              <h2 className="m-0 text-[22px] font-extrabold text-[#1e1b4b] tracking-tight">
                {confirmed ? 'Upgrade Successful!' : step === 'pick' ? 'Upgrade Your Plan' : 'Confirm Upgrade'}
              </h2>
            </div>
            <p className="m-0 text-sm text-muted-foreground">
              {confirmed
                ? `You're now on the ${activeDisplayPlan?.name}. Enjoy your expanded capacity.`
                : step === 'pick'
                  ? "Choose the plan that fits your school's growth."
                  : 'Review your selection before confirming.'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer text-lg flex items-center justify-center text-muted-foreground hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            ×
          </button>
        </div>

        {confirmed ? (
          <div className="px-8 py-16 text-center">
            <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-5 text-3xl text-white font-bold shadow-[0_8px_24px_rgba(16,185,129,0.3)]">
              ✓
            </div>
          </div>
        ) : step === 'pick' ? (
          <PickStep
            plans={displayPlans}
            selected={selected}
            setSelected={setSelected}
            billing={billing}
            setBilling={setBilling}
            savings={savings}
            currentPlanName={currentPlanName}
            currentPrice={currentPrice}
            currency={currency}
            onNext={() => setStep('confirm')}
          />
        ) : (
          <ConfirmStep
            plan={activeDisplayPlan!}
            billing={billing}
            price={price}
            savings={savings}
            currency={currency}
            currentPlanName={currentPlanName}
            currentPrice={currentPrice}
            onBack={() => setStep('pick')}
            onConfirm={handleConfirm}
          />
        )}
      </div>
    </div>
  );
}

// ─── Pick Step ───────────────────────────────────────────────────────────────

type DisplayPlan = {
  id: string; name: string; price: number; badge: string; badgeColor: string;
  students: number; teachers: number; storage: string;
  features: string[]; highlight: boolean;
};

function PickStep({
  plans, selected, setSelected, billing, setBilling, savings,
  currentPlanName, currentPrice, currency, onNext,
}: {
  plans: DisplayPlan[]; selected: string; setSelected: (id: string) => void;
  billing: 'monthly' | 'annual'; setBilling: (b: 'monthly' | 'annual') => void;
  savings: number; currentPlanName: string; currentPrice: number;
  currency: string; onNext: () => void;
}) {
  return (
    <div className="px-8 pt-6 pb-8">
      {/* Billing toggle */}
      <div className="flex justify-center mb-7">
        <div className="bg-slate-100 rounded-full p-1 inline-flex items-center gap-0.5">
          {(['monthly', 'annual'] as const).map(b => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`px-5 py-2 rounded-full border-none cursor-pointer text-[13px] font-semibold transition-all duration-150 ${
                billing === b
                  ? 'bg-white text-[#1e1b4b] shadow-[0_1px_6px_rgba(0,0,0,0.1)]'
                  : 'bg-transparent text-muted-foreground'
              }`}
            >
              {b === 'monthly' ? 'Monthly' : 'Annual'}
              {b === 'annual' && (
                <span className="ml-1.5 bg-emerald-100 text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  –20%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {billing === 'annual' && savings > 0 && (
        <div className="text-center mb-5 text-[13px] text-emerald-600 font-semibold">
          🎉 You save <strong>{(currency === 'KES' ? 'KSh ' : '$')}{savings.toLocaleString()}/year</strong> with annual billing
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
        {plans.map(plan => {
          const planPrice = billing === 'annual' ? Math.round(plan.price * 0.8) : plan.price;
          const isSelected = selected === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={`rounded-2xl p-[22px] cursor-pointer relative transition-all duration-150 ${
                isSelected
                  ? 'border-2 border-indigo-700 bg-indigo-50/30 shadow-[0_4px_20px_rgba(67,56,202,0.12)]'
                  : 'border-2 border-slate-200 bg-white hover:border-indigo-200'
              }`}
            >
              {/* Selection indicator */}
              <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected ? 'border-indigo-700 bg-indigo-700' : 'border-slate-300 bg-white'
              }`}>
                {isSelected && <span className="text-white text-[11px] font-black">✓</span>}
              </div>

              <div
                className="inline-flex text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-3"
                style={{ background: plan.badgeColor + '18', color: plan.badgeColor }}
              >
                {plan.badge}
              </div>

              <h3 className="m-0 text-lg font-bold text-[#1e1b4b]">{plan.name}</h3>

              <div className="flex items-baseline gap-1 my-3">
                <span className="text-[32px] font-extrabold text-[#1e1b4b] tracking-tight">
                  {currency === 'KES' ? 'KSh ' : '$'}{planPrice.toLocaleString()}
                </span>
                <span className="text-[13px] text-muted-foreground">/mo</span>
              </div>

              <div className="flex gap-3 mb-4 text-xs text-slate-500 font-medium">
                <span>🎓 {plan.students} students</span>
                <span>👩‍🏫 {plan.teachers} teachers</span>
              </div>

              <ul className="m-0 p-0 list-none space-y-1">
                {plan.features.slice(0, 5).map(f => (
                  <li key={f} className="text-[13px] text-slate-600 flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> {f}
                  </li>
                ))}
                {plan.features.length > 5 && (
                  <li className="text-xs text-muted-foreground italic pt-1">
                    +{plan.features.length - 5} more features
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Current plan reminder */}
      <div className="bg-slate-50 rounded-xl px-[18px] py-3.5 flex items-center gap-3 border border-slate-100 mb-6">
        <span className="text-xl">📋</span>
        <div className="text-[13px] text-slate-500">
          You're currently on <strong className="text-[#1e1b4b]">{currentPlanName}</strong> at{' '}
          {(currency === 'KES' ? 'KSh ' : '$')}{(currentPrice / 100).toLocaleString()}/mo.
          Upgrading will be prorated for the remainder of your billing cycle.
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full py-3.5 bg-gradient-to-r from-indigo-700 to-indigo-800 text-white border-none rounded-xl text-[15px] font-bold cursor-pointer tracking-tight shadow-[0_4px_16px_rgba(67,56,202,0.3)] hover:from-indigo-800 hover:to-indigo-900 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(67,56,202,0.4)] transition-all duration-150"
      >
        Continue with {plans.find(p => p.id === selected)?.name} →
      </button>
    </div>
  );
}

// ─── Confirm Step ─────────────────────────────────────────────────────────────

function ConfirmStep({
  plan, billing, price, savings, currency,
  currentPlanName, currentPrice,
  onBack, onConfirm,
}: {
  plan: DisplayPlan; billing: 'monthly' | 'annual'; price: number;
  savings: number; currency: string;
  currentPlanName: string; currentPrice: number;
  onBack: () => void; onConfirm: () => void;
}) {
  const planPriceMinor = plan.price;

  return (
    <div className="px-8 pt-6 pb-8">
      {/* Summary card */}
      <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/50 border border-indigo-200 rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-start mb-5">
          <div>
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Upgrading to</div>
            <h3 className="m-0 text-[22px] font-extrabold text-[#1e1b4b]">{plan.name}</h3>
            <div className="text-[13px] text-indigo-600 font-semibold mt-1">
              Billed {billing === 'annual' ? 'annually' : 'monthly'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[36px] font-extrabold text-[#1e1b4b] tracking-tight">
              {currency === 'KES' ? 'KSh ' : '$'}{price.toLocaleString()}
            </div>
            <div className="text-[13px] text-muted-foreground">per month</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Students', from: String(plan.students), to: String(plan.students), icon: '🎓' },
            { label: 'Teachers', from: String(plan.teachers), to: String(plan.teachers), icon: '👩‍🏫' },
            { label: 'Storage', from: plan.storage, to: plan.storage, icon: '💾' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-lg p-3.5 border border-indigo-100">
              <div className="text-base mb-1.5">{item.icon}</div>
              <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">{item.label}</div>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] text-muted-foreground line-through">{item.from}</span>
                <span className="text-[10px] text-indigo-500">→</span>
                <span className="text-sm font-bold text-emerald-600">{item.to}</span>
              </div>
            </div>
          ))}
        </div>

        {billing === 'annual' && savings > 0 && (
          <div className="mt-4 bg-emerald-100 rounded-lg px-3.5 py-2.5 flex items-center gap-2 text-[13px] text-emerald-800 font-semibold">
            🎉 Annual discount applied — you save{' '}
            <strong>{(currency === 'KES' ? 'KSh ' : '$')}{savings.toLocaleString()}</strong> per year
          </div>
        )}
      </div>

      {/* Payment method (mock) */}
      <div className="border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-7 bg-gradient-to-r from-slate-800 to-blue-600 rounded-md flex items-center justify-center text-[10px] text-white font-black tracking-wider">
            VISA
          </div>
          <div>
            <div className="text-sm font-semibold text-[#1e1b4b]">Visa ending in 4892</div>
            <div className="text-xs text-muted-foreground">Expires 09/2028</div>
          </div>
        </div>
        <button className="text-[13px] text-indigo-600 font-semibold bg-transparent border-none cursor-pointer">
          Change
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-slate-200 rounded-xl bg-white text-sm font-semibold text-slate-500 cursor-pointer hover:bg-slate-50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onConfirm}
          className="flex-[2] py-3 bg-gradient-to-r from-indigo-700 to-indigo-800 text-white border-none rounded-xl text-[15px] font-bold cursor-pointer shadow-[0_4px_16px_rgba(67,56,202,0.3)] hover:from-indigo-800 hover:to-indigo-900 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(67,56,202,0.4)] transition-all duration-150"
        >
          ⚡ Confirm Upgrade — {(currency === 'KES' ? 'KSh ' : '$')}{price.toLocaleString()}/mo
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4">
        🔒 Secured by Stripe. Cancel or downgrade anytime from your billing settings.
      </p>
    </div>
  );
}