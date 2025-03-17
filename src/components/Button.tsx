
import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'success';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'default',
  size = 'default',
  children,
  fullWidth = false,
  ...props
}) => {
  return (
    <button
      className={cn(
        'rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:pointer-events-none',
        {
          'bg-white hover:bg-white/90 text-bridge-bg': variant === 'default',
          'bg-transparent border border-white/20 text-white hover:bg-white/10': variant === 'outline',
          'bg-transparent hover:bg-white/10 text-white': variant === 'ghost',
          'bg-transparent text-white underline-offset-4 hover:underline': variant === 'link',
          'bg-bridge-error hover:bg-bridge-error/90 text-white': variant === 'destructive',
          'bg-bridge-success hover:bg-bridge-success/90 text-white': variant === 'success',
          'h-10 px-4 py-2': size === 'default',
          'h-9 px-3': size === 'sm',
          'h-11 px-8': size === 'lg',
          'h-10 w-10': size === 'icon',
          'w-full': fullWidth,
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
