// Monthly / Annual segmented toggle for the Pricing page. Controlled — the parent owns the
// selected interval. Surfaces the annual savings as an ochre accent badge.
import { cn } from '@/lib/utils';
import type { BillingInterval } from '@/lib/billingApi';
import { ANNUAL_SAVINGS_PCT } from '@/lib/pricingPlans';

interface BillingIntervalToggleProps {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
}

const OPTIONS: { id: BillingInterval; label: string }[] = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'annual', label: 'Annual' },
];

export function BillingIntervalToggle({ value, onChange }: BillingIntervalToggleProps) {
  return (
    <div className="inline-flex items-center gap-3">
      <div className="inline-flex rounded-full border border-border/70 bg-card p-1 shadow-sm">
        {OPTIONS.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.id)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent-foreground">
        Save {ANNUAL_SAVINGS_PCT}% annually
      </span>
    </div>
  );
}

export default BillingIntervalToggle;
