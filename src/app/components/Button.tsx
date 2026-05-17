import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  disabled?: boolean;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  fullWidth = false,
  disabled = false,
}: ButtonProps) {
  const baseStyles = 'px-6 py-4 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg';
  const variantStyles = {
    primary: 'bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary text-white',
    secondary: 'bg-card hover:bg-card-hover border-2 border-border text-foreground',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {children}
    </button>
  );
}
