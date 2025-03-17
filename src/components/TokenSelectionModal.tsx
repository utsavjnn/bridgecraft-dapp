
import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Token {
  symbol: string;
  name: string;
}

const tokens: Token[] = [
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'USDC', name: 'USD Coin' },
  { symbol: 'DAI', name: 'DAI' },
];

interface TokenSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  mode: 'send' | 'receive';
}

const TokenSelectionModal: React.FC<TokenSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  mode
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#18181f] border-bridge-accent/30 text-white">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Select token & chain</h3>
          
          <div className="grid grid-cols-3 gap-2">
            {tokens.map((token) => (
              <button
                key={token.symbol}
                className="flex flex-col items-center p-4 rounded-md bg-[#1d1d25] hover:bg-bridge-accent/40 transition-colors"
                onClick={() => {
                  onSelect(token);
                  onClose();
                }}
              >
                <div className="w-8 h-8 bg-[#121217] rounded-md flex items-center justify-center mb-2">
                  <span className="text-xs">{token.symbol.charAt(0)}</span>
                </div>
                <span className="text-xs">{token.name}</span>
              </button>
            ))}
          </div>
          
          <div className="py-4">
            <input
              type="text"
              placeholder="Search name or paste address"
              className="w-full px-4 py-3 bg-[#1d1d25] rounded-md text-sm border border-bridge-accent/20 focus:outline-none focus:ring-1 focus:ring-white/30"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {Array(5).fill(0).map((_, i) => (
              <button key={i} className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#1d1d25] text-xs">
                <span className="w-3 h-3 rounded-full bg-[#121217] flex items-center justify-center text-[8px]">D</span>
                <span>DAI</span>
              </button>
            ))}
          </div>
          
          <div className="space-y-2">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-md hover:bg-bridge-accent/20">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <span className="text-xs">U</span>
                  </div>
                  <span>USDC</span>
                </div>
                <div className="text-right">
                  <div className="text-sm">24.12</div>
                  <div className="text-xs text-bridge-muted">$24.12</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TokenSelectionModal;
