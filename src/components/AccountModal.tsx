
import React from 'react';
import { X } from 'lucide-react';

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
}

const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  transactions
}) => {
  if (!isOpen) return null;

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
              <div className="bg-[#2C243A] p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-300">EVM & L2s</span>
                  <div className="flex h-5 w-10 rounded-full bg-purple-900/50 p-1">
                    <div className="h-3 w-3 rounded-full bg-purple-400"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 12L12 7M12 7L7 12M12 7V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="font-mono text-sm">0x2b2...1284</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="h-6 w-6 flex items-center justify-center rounded bg-bridge-accent/50 hover:bg-bridge-accent/80">
                      <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 16H6C4.89543 16 4 15.1046 4 14V6C4 4.89543 4.89543 4 6 4H14C15.1046 4 16 4.89543 16 6V8M10 20H18C19.1046 20 20 19.1046 20 18V10C20 8.89543 19.1046 8 18 8H10C8.89543 8 8 8.89543 8 10V18C8 19.1046 8.89543 20 10 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button className="h-6 w-6 flex items-center justify-center rounded bg-bridge-accent/50 hover:bg-bridge-accent/80">
                      <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 6H6C4.89543 6 4 6.89543 4 8V18C4 19.1046 4.89543 20 6 20H16C17.1046 20 18 19.1046 18 18V14M14 4H20M20 4V10M20 4L10 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#1F3327] p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-300">SOLANA</span>
                  <div className="flex h-5 w-10 rounded-full bg-green-900/50 p-1 justify-end">
                    <div className="h-3 w-3 rounded-full bg-green-400"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 12L12 7M12 7L7 12M12 7V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="font-mono text-sm">sol121...1143</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="h-6 w-6 flex items-center justify-center rounded bg-bridge-accent/50 hover:bg-bridge-accent/80">
                      <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 16H6C4.89543 16 4 15.1046 4 14V6C4 4.89543 4.89543 4 6 4H14C15.1046 4 16 4.89543 16 6V8M10 20H18C19.1046 20 20 19.1046 20 18V10C20 8.89543 19.1046 8 18 8H10C8.89543 8 8 8.89543 8 10V18C8 19.1046 8.89543 20 10 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button className="h-6 w-6 flex items-center justify-center rounded bg-bridge-accent/50 hover:bg-bridge-accent/80">
                      <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 6H6C4.89543 6 4 6.89543 4 8V18C4 19.1046 4.89543 20 6 20H16C17.1046 20 18 19.1046 18 18V14M14 4H20M20 4V10M20 4L10 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-medium">History</h4>
                <div className="flex items-center space-x-2 bg-bridge-accent/30 rounded-full px-3 py-1">
                  <span className="text-xs">All chains</span>
                </div>
              </div>
              
              <div className="space-y-4">
                {transactions.map((tx, index) => (
                  <div key={index} className="py-3 border-b border-bridge-accent/20 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="chain-icon">
                          <span className="text-xs font-mono">tt</span>
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
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountModal;
