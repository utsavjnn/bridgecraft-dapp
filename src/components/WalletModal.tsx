import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (wallet: string) => void;
}

const wallets = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '🔗',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '💰',
  }
];

const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#18181f] border-bridge-accent/30 text-white">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Select a wallet</h3>
            <button onClick={onClose} className="text-bridge-muted hover:text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div className="space-y-2">
            {wallets.map((wallet) => (
              <button
                key={wallet.id}
                className="w-full flex items-center p-4 rounded-lg bg-[#1d1d25] hover:bg-bridge-accent/40 transition-colors"
                onClick={() => {
                  onSelect(wallet.id);
                  onClose();
                }}
              >
                <span className="text-2xl mr-3">{wallet.icon}</span>
                <span className="text-sm font-medium">{wallet.name}</span>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletModal; 