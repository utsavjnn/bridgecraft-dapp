import React, { useState, useRef, useEffect } from 'react';

interface WalletDropdownProps {
  address: string;
  onDisconnect: () => void;
  onShowAccount: () => void;
}

const WalletDropdown: React.FC<WalletDropdownProps> = ({
  address,
  onDisconnect,
  onShowAccount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="text-xs font-mono bg-bridge-accent/30 text-white px-3 py-1.5 rounded-full hover:bg-bridge-accent/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {address}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-[#1d1d25] border border-bridge-accent/30">
          <div className="py-1">
            <button
              onClick={() => {
                onShowAccount();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-bridge-accent/40 transition-colors"
            >
              Account
            </button>
            <button
              onClick={() => {
                onDisconnect();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-bridge-accent/40 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletDropdown; 