
import React from 'react';
import { X } from 'lucide-react';
import Button from './Button';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'error' | 'details' | 'signing';
  errorMessage?: string;
  transaction?: {
    from: string;
    to: string;
    fromChain: 'ETH' | 'SOL' | 'USDT';
    toChain: 'ETH' | 'SOL';
    amount: string;
    status: 'completed' | 'processing' | 'failed';
    hash?: string;
    date?: string;
    gas?: string;
    slippage?: string;
  };
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  type,
  errorMessage,
  transaction,
}) => {
  if (!isOpen) return null;

  const renderContent = () => {
    switch (type) {
      case 'error':
        return (
          <div className="flex flex-col items-center p-8">
            <div className="h-16 w-16 rounded-full bg-bridge-error/20 flex items-center justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-bridge-error/40 flex items-center justify-center">
                <div className="h-8 w-8 bg-bridge-error text-white rounded-full flex items-center justify-center">
                  <span className="transform rotate-45">+</span>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Could not start transaction.</h3>
            <p className="text-bridge-muted mb-6">{errorMessage || '<FAILURE REASON COMES HERE>'}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={onClose}>Retry?</Button>
            </div>
          </div>
        );
      case 'details':
        if (!transaction) return null;
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Transaction details</h3>
              <button onClick={onClose} className="text-bridge-muted hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="chain-icon">
                  <span className="text-xs font-mono">tt</span>
                </div>
                <div className="flex flex-col">
                  <div className="text-sm font-bold">BRIDGE</div>
                  <div className="flex items-center text-sm">
                    <span>{transaction.fromChain}</span>
                    <span className="mx-2">→</span>
                    <span>{transaction.toChain}</span>
                    <span className={`ml-3 badge ${
                      transaction.status === 'completed' 
                        ? 'badge-completed' 
                        : transaction.status === 'processing' 
                          ? 'badge-processing' 
                          : 'badge-failed'
                    }`}>
                      {transaction.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-sm text-bridge-error">-{transaction.amount} {transaction.fromChain}</div>
                  <div className="text-sm text-bridge-success">+{parseFloat(transaction.amount) * 12} {transaction.toChain}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-8"></div>
                <div className="text-xs text-bridge-muted">Ethereum</div>
                <div className="text-xs text-bridge-muted mx-2">→</div>
                <div className="text-xs text-bridge-muted">Arbitrum</div>
              </div>
              
              <div className="pt-2">
                <div className="flex justify-between py-1">
                  <span className="text-sm text-bridge-muted">Gas</span>
                  <span className="text-sm">{transaction.gas || '0.0012'}ETH</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm text-bridge-muted">Slippage</span>
                  <span className="text-sm">{transaction.slippage || '2%'}</span>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="flex justify-between py-1">
                  <span className="text-sm text-bridge-muted">Submitted on</span>
                  <span className="text-sm">{transaction.date || '07 Mar 2023 15:58'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm text-bridge-muted">Completed on</span>
                  <span className="text-sm">{transaction.date || '07 Mar 2023 15:59'}</span>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="flex justify-between py-1">
                  <span className="text-sm text-bridge-muted">Receiver address</span>
                  <div className="flex items-center">
                    <span className="text-sm font-mono">TYe123...1Qa</span>
                    <button className="ml-1 p-1 text-bridge-muted hover:text-white">
                      <span className="text-xs">↗</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="flex justify-between py-1">
                  <span className="text-sm text-bridge-muted">Exchange Rate</span>
                  <div className="flex items-center">
                    <span className="text-sm">1ETH = 12 SOL</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex justify-between gap-4">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Back
                </Button>
                <Button className="flex-1">
                  View on Explorer
                </Button>
              </div>
            </div>
          </div>
        );
      case 'signing':
        return (
          <div className="flex flex-col items-center p-8">
            <div className="relative h-16 w-16 mb-6">
              <div className="absolute animate-pen-rotate">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.5 5.5L18.5 9.5M3 21L7.5 16.5M11.5 8.5L16.5 13.5M7.5 12.5L12.5 17.5M15.5 4.5L19.5 8.5L8.5 19.5L3.5 20.5L4.5 15.5L15.5 4.5Z" stroke="#A142F5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Sign transaction in your wallet</h3>
            <p className="text-bridge-muted mb-6">to allow spending.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
      <div 
        className="bg-bridge-card border border-bridge-accent/40 rounded-lg max-w-md w-full max-h-[90vh] overflow-auto animate-slide-up shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default TransactionModal;
