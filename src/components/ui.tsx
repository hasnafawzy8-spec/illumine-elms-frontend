import { ReactNode } from 'react';

// Button
interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}

export function Button({ children, onClick, variant = 'primary', size = 'md', className = '', disabled, type = 'button', fullWidth }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl cursor-pointer border border-transparent select-none focus:outline-none focus:ring-2 focus:ring-offset-2';
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-5 py-2.5 text-sm', lg: 'px-7 py-3.5 text-base' };
  const variants = {
    primary: 'bg-[#1E6BB8] text-white hover:bg-[#155a9c] focus:ring-[#1E6BB8] shadow-sm hover:shadow-md active:scale-[0.98]',
    secondary: 'bg-[#C2660A] text-white hover:bg-[#a85708] focus:ring-[#C2660A] shadow-sm hover:shadow-md active:scale-[0.98]',
    outline: 'bg-transparent text-[#1E6BB8] border-[#1E6BB8] hover:bg-[#eff6ff] focus:ring-[#1E6BB8]',
    danger: 'bg-[#D42B2B] text-white hover:bg-[#b71c1c] focus:ring-[#D42B2B] shadow-sm hover:shadow-md active:scale-[0.98]',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-300',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`ui-button ${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

// Badge
interface BadgeProps {
  children: ReactNode;
  color?: 'blue' | 'green' | 'red' | 'amber' | 'slate' | 'purple' | 'teal';
  className?: string;
}

export function Badge({ children, color = 'blue', className = '' }: BadgeProps) {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    slate: 'bg-slate-100 text-slate-600',
    purple: 'bg-purple-100 text-purple-700',
    teal: 'bg-teal-100 text-teal-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color]} ${className}`}>
      {children}
    </span>
  );
}

// StatusPill
export function statusColor(status: string): 'green' | 'amber' | 'red' | 'blue' | 'slate' | 'purple' | 'teal' {
  const map: Record<string, 'green' | 'amber' | 'red' | 'blue' | 'slate' | 'purple' | 'teal'> = {
    'Paid': 'green', 'Delivered': 'green', 'Open': 'green', 'Confirmed': 'green', 'Completed': 'green',
    'Pending': 'amber', 'Processing': 'blue', 'Upcoming': 'blue',
    'Preparing': 'purple', 'Ready for Collection': 'teal', 'Out for Delivery': 'teal',
    'Failed': 'red', 'Cancelled': 'red', 'Full': 'red',
    'Closed': 'slate', 'Refunded': 'slate', 'Ongoing': 'green',
  };
  return map[status] || 'slate';
}

// Card
export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`ui-card bg-white rounded-2xl shadow-sm border border-slate-100 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

// Input
interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  type?: string;
  autoComplete?: string;
  min?: string;
  max?: string;
  maxLength?: number;
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  required?: boolean;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Input({ label, placeholder, value, onChange, type = 'text', autoComplete, min, max, maxLength, inputMode, required, error, hint, icon, className = '', disabled = false }: InputProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          type={type}
          autoComplete={autoComplete}
          min={min}
          max={max}
          maxLength={maxLength}
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={e => onChange?.(e.target.value)}
          className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E6BB8]/40 focus:border-[#1E6BB8] transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${icon ? 'pl-10' : ''} ${error ? 'border-red-400 focus:ring-red-300' : 'border-slate-200'}`}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// Select
export function Select({ label, value, onChange, options, required, className = '' }: {
  label?: string; value?: string; onChange?: (v: string) => void;
  options: { value: string; label: string }[]; required?: boolean; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <select
        value={value}
        onChange={e => onChange?.(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E6BB8]/40 focus:border-[#1E6BB8]"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// Textarea
export function Textarea({ label, placeholder, value, onChange, rows = 4, required, className = '' }: {
  label?: string; placeholder?: string; value?: string; onChange?: (v: string) => void;
  rows?: number; required?: boolean; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <textarea
        placeholder={placeholder}
        value={value}
        rows={rows}
        onChange={e => onChange?.(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E6BB8]/40 focus:border-[#1E6BB8] resize-none"
      />
    </div>
  );
}

// Empty state
export function EmptyState({ icon, title, description, action }: {
  icon: ReactNode; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">{icon}</div>
      <h3 className="font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-400 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Stat card
export function StatCard({ label, value, icon, color = 'blue', trend }: {
  label: string; value: string | number; icon: ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  trend?: string;
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-800 font-display">{value}</p>
          {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

// Page header
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 font-display">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Toast
export function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  const styles = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-[#1E6BB8]',
  };
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };
  return (
    <div className={`toast-enter fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white shadow-xl max-w-sm ${styles[type]}`}>
      <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">{icons[type]}</span>
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}

// Loading skeleton
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

// Modal
export function Modal({ children, title, onClose, size = 'md' }: {
  children: ReactNode; title?: string; onClose: () => void; size?: 'sm' | 'md' | 'lg';
}) {
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${widths[size]} fade-in-up max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 font-display">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 text-xl">×</button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
