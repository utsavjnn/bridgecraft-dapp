import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Copy, ExternalLink, LogOut } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

export interface WalletDropdownProps {
  address: string;
  onDisconnect: () => void;
  onShowAccount: () => void;
  walletType: 'metamask' | 'phantom';
  isActive: boolean;
  onSetActive: () => void;
}

const WalletDropdown: React.FC<WalletDropdownProps> = ({
  address,
  onDisconnect,
  onShowAccount,
  walletType,
  isActive,
  onSetActive
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
    setIsOpen(false);
  };

  const handleExplorer = () => {
    let url = '';
    if (walletType === 'metamask') {
      url = `https://etherscan.io/address/${address}`;
    } else {
      url = `https://solscan.io/account/${address}`;
    }
    window.open(url, '_blank');
    setIsOpen(false);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          if (!isActive) {
            onSetActive();
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
          isActive 
            ? 'bg-bridge-accent hover:bg-bridge-accent/80' 
            : 'bg-bridge-accent/30 hover:bg-bridge-accent/50'
        }`}
      >
        <img 
          src={`/assets/wallets/${walletType}-logo.svg`}
          alt={walletType === 'metamask' ? 'MetaMask' : 'Phantom'}
          className="w-4 h-4"
        />
        <span className="text-sm font-mono">{formatAddress(address)}</span>
        {isActive && <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </button>

      {isOpen && isActive && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-bridge-card border border-bridge-accent/40 shadow-xl z-50">
          <div className="py-1">
            <button
              onClick={handleCopyAddress}
              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-left hover:bg-bridge-accent/20"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Address</span>
            </button>
            <button
              onClick={handleExplorer}
              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-left hover:bg-bridge-accent/20"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View in Explorer</span>
            </button>
            <button
              onClick={onShowAccount}
              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-left hover:bg-bridge-accent/20"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Account</span>
            </button>
            <button
              onClick={() => {
                onDisconnect();
                setIsOpen(false);
              }}
              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-bridge-accent/20"
            >
              <LogOut className="w-4 h-4" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletDropdown; 