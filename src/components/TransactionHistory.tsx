
import React from 'react';

interface TransactionProps {
  transactions: Array<{
    hash: string;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    date: string;
    status: 'completed' | 'pending' | 'failed';
  }>;
  onViewDetails: (hash: string) => void;
}

const TransactionHistory: React.FC<TransactionProps> = ({ 
  transactions,
  onViewDetails
}) => {
  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-bridge-muted">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((tx, index) => (
        <div 
          key={index} 
          className="p-4 bridge-card hover:border-white/20 transition-all cursor-pointer"
          onClick={() => onViewDetails(tx.hash)}
        >
          <div className="flex justify-between items-center">
            <div className="flex space-x-3 items-center">
              <div className="w-8 h-8 rounded-full bg-bridge-accent flex items-center justify-center">
                <span className="text-xs">
                  {tx.fromToken.substring(0, 1)}→{tx.toToken.substring(0, 1)}
                </span>
              </div>
              <div>
                <div className="font-medium">
                  {tx.fromToken} → {tx.toToken}
                </div>
                <div className="text-sm text-bridge-muted">
                  {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString()}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <span className={`badge ${
                  tx.status === 'completed' 
                    ? 'badge-completed' 
                    : tx.status === 'pending' 
                      ? 'badge-processing' 
                      : 'badge-failed'
                }`}>
                  {tx.status.toUpperCase()}
                </span>
              </div>
              <div className="text-sm mt-1">
                <span className="text-bridge-error">-{tx.fromAmount} {tx.fromToken}</span>
                <span className="mx-1">|</span>
                <span className="text-bridge-success">+{tx.toAmount} {tx.toToken}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionHistory;
