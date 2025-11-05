import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        {/* The native HTML checkbox, hidden but functional */}
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            'peer h-4 w-4 shrink-0 appearance-none rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            'checked:bg-primary checked:text-primary-foreground', // Styling for checked state
            className
          )}
          {...props}
        />
        {/* The "Check" icon, shown only when the peer (input) is checked */}
        <div className="pointer-events-none absolute left-0 top-0 flex h-4 w-4 items-center justify-center text-
primary-foreground opacity-0 peer-checked:opacity-100">
          <Check className="h-4 w-4" />
        </div>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };