import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'welcomePrimary' | 'welcomeSecondary';
  fullWidth?: boolean;
  disabled?: boolean;
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  fullWidth = false,
  disabled = false,
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center text-center rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantStyles = {
    primary: 'h-12 bg-[#00ddff] text-[#090f1e] px-4 text-[18px] font-medium shadow-lg shadow-primary/30',
    secondary: 'h-12 bg-card hover:bg-card-hover border-2 border-border text-foreground px-4 text-[18px] font-medium shadow-lg',
    welcomePrimary: 'bg-[#00ddff] text-[#090f1e] py-[10px] px-4 text-[18px] font-medium shadow-lg shadow-primary/30',
    welcomeSecondary: 'bg-transparent border border-[#00ddff] text-[#00ddff] py-[10px] px-4 text-[18px] font-medium shadow-none',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {children}
    </button>
  );
}
