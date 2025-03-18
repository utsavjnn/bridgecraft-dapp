import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

export interface Token {
  symbol: string;
  name: string;
  chains: Chain[];
  icon?: string;
  address?: string; // Contract address for ERC20 tokens
}

export interface Chain {
  id: string;
  name: string;
  icon?: string;
  address?: string; // Chain-specific token address
}

// Available tokens and their supported chains
const tokens: Token[] = [
  // {
  //   symbol: 'ETH',
  //   name: 'Ethereum',
  //   icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  //   chains: [
  //     { 
  //       id: 'ethereum', 
  //       name: 'Ethereum', 
  //       icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
  //     },
  //     {
  //       id: 'scroll',
  //       name: 'Scroll',
  //       icon: '/assets/tokens/scroll.png'
  //     }
  //   ],
  // },
  // {
  //   symbol: 'BNB',
  //   name: 'Binance Coin',
  //   icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
  //   chains: [
  //     {
  //       id: 'bsc',
  //       name: 'BNB Chain',
  //       icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png'
  //     }
  //   ],
  // },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    icon: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Ethereum USDT
    chains: [
      { 
        id: 'ethereum', 
        name: 'Ethereum', 
        icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
      },
      { 
        id: 'solana', 
        name: 'Solana', 
        icon: 'https://cryptologos.cc/logos/solana-sol-logo.png'
      },
      {
        id: 'bsc',
        name: 'BNB Chain',
        icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
        address: '0x55d398326f99059fF775485246999027B3197955' // BSC USDT
      },
      {
        id: 'scroll',
        name: 'Scroll',
        icon: '/assets/tokens/scroll.png',
        address: '0xf55BEC9cafE438A8799c8940E623d9B6EAb6337c' // Scroll USDT
      }
    ],
  },
  // {
  //   symbol: 'SOL',
  //   name: 'Solana',
  //   icon: 'https://cryptologos.cc/logos/solana-sol-logo.png',
  //   chains: [
  //     { 
  //       id: 'solana', 
  //       name: 'Solana', 
  //       icon: 'https://cryptologos.cc/logos/solana-sol-logo.png'
  //     },
  //   ],
  // }
];

interface TokenSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: { token: Token; chain: Chain }) => void;
  mode: 'send' | 'receive';
}

const TokenSelectionModal: React.FC<TokenSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  mode
}) => {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = tokens.filter(token => 
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#18181f] border-bridge-accent/30 text-white">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Select token & chain</h3>
          </div>

          <div className="py-4">
            <input
              type="text"
              placeholder="Search by token name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-[#1d1d25] rounded-md text-sm border border-bridge-accent/20 focus:outline-none focus:ring-1 focus:ring-white/30"
            />
          </div>

          <div className="space-y-2">
            {filteredTokens.map((token) => (
              <div key={token.symbol}>
                <button
                  className={`w-full flex items-center p-4 rounded-lg ${
                    selectedToken?.symbol === token.symbol 
                      ? 'bg-bridge-accent/40' 
                      : 'bg-[#1d1d25] hover:bg-bridge-accent/20'
                  } transition-colors`}
                  onClick={() => setSelectedToken(token)}
                >
                  <img 
                    src={token.icon} 
                    alt={token.symbol}
                    className="w-8 h-8 mr-3 object-contain"
                  />
                  <div className="text-left">
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-sm text-bridge-muted">{token.name}</div>
                  </div>
                </button>

                {selectedToken?.symbol === token.symbol && (
                  <div className="mt-2 pl-4 space-y-2">
                    <div className="text-sm text-bridge-muted mb-2">Select Chain</div>
                    {token.chains.map((chain) => (
                      <button
                        key={chain.id}
                        className="w-full flex items-center p-3 rounded-lg bg-[#1d1d25] hover:bg-bridge-accent/20 transition-colors"
                        onClick={() => {
                          onSelect({ token, chain });
                          onClose();
                        }}
                      >
                        <img 
                          src={chain.icon} 
                          alt={chain.name}
                          className="w-6 h-6 mr-3 object-contain"
                        />
                        <span className="text-sm">{chain.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TokenSelectionModal;
