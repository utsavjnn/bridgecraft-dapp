import React from 'react';
import { X, Copy, ExternalLink } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

export interface Transaction {
  date: string;
  type: 'BRIDGE';
  from: string;
  to: string;
  fromAmount: string;
  toAmount: string;
  status: 'processing' | 'completed' | 'failed';
  hash: string;
}

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  ethereumAddress?: string | null;
  solanaAddress?: string | null;
  ethereumChainId?: number | null;
}

const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  transactions,
  ethereumAddress,
  solanaAddress,
  ethereumChainId
}) => {
  if (!isOpen) return null;

  const getExplorerUrl = (address: string, chainId?: number | null) => {
    if (!chainId) return `https://etherscan.io/address/${address}`;
    
    switch (chainId) {
      case 1: // Ethereum Mainnet
        return `https://etherscan.io/address/${address}`;
      case 56: // BSC
        return `https://bscscan.com/address/${address}`;
      case 534352: // Scroll
        return `https://scrollscan.com/address/${address}`;
      default:
        return `https://etherscan.io/address/${address}`;
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
      <div 
        className="bg-bridge-card border border-bridge-accent/40 rounded-lg max-w-lg w-full max-h-[90vh] overflow-auto animate-slide-up shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Account</h3>
            <button onClick={onClose} className="text-bridge-muted hover:text-white">
              <X size={18} />
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-4">
              {ethereumAddress && (
                <div className="bg-[#2C243A] p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-300">EVM & L2s</span>
                    <div className="flex h-5 w-10 rounded-full bg-purple-900/50 p-1">
                      <div className="h-3 w-3 rounded-full bg-purple-400"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img src="/assets/wallets/metamask-logo.svg" alt="MetaMask" className="h-5 w-5" />
                      <span className="font-mono text-sm">{formatAddress(ethereumAddress)}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleCopyAddress(ethereumAddress)}
                        className="h-6 w-6 flex items-center justify-center rounded bg-bridge-accent/50 hover:bg-bridge-accent/80"
                      >
                        <Copy className="h-3 w-3 text-white" />
                      </button>
                      <button 
                        onClick={() => window.open(getExplorerUrl(ethereumAddress, ethereumChainId), '_blank')}
                        className="h-6 w-6 flex items-center justify-center rounded bg-bridge-accent/50 hover:bg-bridge-accent/80"
                      >
                        <ExternalLink className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {solanaAddress && (
                <div className="bg-[#1F3327] p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-300">SOLANA</span>
                    <div className="flex h-5 w-10 rounded-full bg-green-900/50 p-1 justify-end">
                      <div className="h-3 w-3 rounded-full bg-green-400"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img src="/assets/wallets/phantom-logo.svg" alt="Phantom" className="h-5 w-5" />
                      <span className="font-mono text-sm">{formatAddress(solanaAddress)}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleCopyAddress(solanaAddress)}
                        className="h-6 w-6 flex items-center justify-center rounded bg-bridge-accent/50 hover:bg-bridge-accent/80"
                      >
                        <Copy className="h-3 w-3 text-white" />
                      </button>
                      <button 
                        onClick={() => window.open(`https://solscan.io/account/${solanaAddress}`, '_blank')}
                        className="h-6 w-6 flex items-center justify-center rounded bg-bridge-accent/50 hover:bg-bridge-accent/80"
                      >
                        <ExternalLink className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-medium">History</h4>
                <div className="flex items-center space-x-2 bg-bridge-accent/30 rounded-full px-3 py-1">
                  <span className="text-xs">All chains</span>
                </div>
              </div>
              
              <div className="space-y-4">
                {transactions.length > 0 ? (
                  transactions.map((tx, index) => (
                    <div key={index} className="py-3 border-b border-bridge-accent/20 last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="chain-icon">
                            <span className="text-xs font-mono">{tx.from.slice(0, 2)}</span>
                          </div>
                          <div>
                            <div className="text-sm font-bold">BRIDGE</div>
                            <div className="flex items-center">
                              <span className="text-xs">{tx.from}</span>
                              <span className="mx-1 text-xs">→</span>
                              <span className="text-xs">{tx.to}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <svg className="h-3 w-3 text-bridge-muted mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span className="text-xs text-bridge-muted">{tx.date}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-bridge-error">-{tx.fromAmount}</div>
                          <div className="text-sm text-bridge-success">+{tx.toAmount}</div>
                          <div>
                            <span className={`badge mt-1 ${
                              tx.status === 'completed' 
                                ? 'badge-completed' 
                                : tx.status === 'processing' 
                                  ? 'badge-processing' 
                                  : 'badge-failed'
                            }`}>
                              {tx.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-bridge-muted">
                    <p>No transactions yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountModal;
