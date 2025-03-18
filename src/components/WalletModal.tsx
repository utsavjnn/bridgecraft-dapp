import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (walletId: string) => void;
}

const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  const handleWalletSelect = (walletId: string) => {
    onSelect(walletId);
    onClose();
  };

  const wallets = [
    {
      name: 'MetaMask',
      icon: '/assets/wallets/metamask-logo.svg',
      description: 'Connect to Ethereum, BSC, and Scroll networks',
      onClick: () => handleWalletSelect('metamask')
    },
    {
      name: 'Phantom',
      icon: '/assets/wallets/phantom-logo.svg',
      description: 'Connect to Solana network',
      onClick: () => handleWalletSelect('phantom')
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#18181f] border-bridge-accent/30 text-white">
        <div className="space-y-4">
          <div className="flex items-center">
            <h3 className="text-lg font-medium">Select a wallet</h3>
          </div>
          
          <div className="space-y-2">
            {wallets.map((wallet) => (
              <button
                key={wallet.name}
                onClick={wallet.onClick}
                className="flex items-center w-full p-4 space-x-4 text-left transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <img 
                  src={wallet.icon} 
                  alt={`${wallet.name} logo`}
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <div className="font-semibold">{wallet.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{wallet.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletModal; 