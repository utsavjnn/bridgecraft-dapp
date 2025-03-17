
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface AddressInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  showErrorMessage?: boolean;
}

const AddressInput: React.FC<AddressInputProps> = ({
  className,
  error,
  showErrorMessage = true,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const hasError = Boolean(error);
  
  return (
    <div className="w-full">
      <div 
        className={cn(
          "bridge-input overflow-hidden",
          hasError ? "border border-bridge-error" : isFocused ? "ring-2 ring-white/20" : "",
          className
        )}
      >
        <input
          type="text"
          className="w-full bg-transparent border-none outline-none font-mono"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </div>
      {hasError && showErrorMessage && (
        <p className="mt-1 text-sm text-bridge-error">{error}</p>
      )}
    </div>
  );
};

export default AddressInput;
