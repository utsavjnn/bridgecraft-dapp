
import React, { useState } from 'react';
import Logo from '@/components/Logo';
import Button from '@/components/Button';
import AddressInput from '@/components/AddressInput';
import TransactionModal from '@/components/TransactionModal';
import AccountModal from '@/components/AccountModal';
import { useToast } from '@/hooks/use-toast';
import TransactionHistory from '@/components/TransactionHistory';

// Sample transaction data
const sampleTransactions = [
  {
    hash: 'tx1',
    fromToken: 'ETH',
    toToken: 'SOL',
    fromAmount: '3',
    toAmount: '36',
    date: '2023-03-07T15:58:00',
    status: 'completed' as const,
  },
  {
    hash: 'tx2',
    fromToken: 'USDT',
    toToken: 'SOL',
    fromAmount: '100',
    toAmount: '120',
    date: '2023-03-06T12:30:00',
    status: 'pending' as const,
  },
  {
    hash: 'tx3',
    fromToken: 'ETH',
    toToken: 'SOL',
    fromAmount: '1',
    toAmount: '12',
    date: '2023-03-05T09:45:00',
    status: 'failed' as const,
  },
];

// Account transaction history
const accountTransactions = [
  {
    date: 'March 6, 2024',
    type: 'BRIDGE',
    from: 'ETH',
    to: 'SOL',
    fromAmount: '3 ETH',
    toAmount: '36 SOL',
    status: 'processing' as const,
    hash: 'TYe123...1Qa',
  },
  {
    date: 'March 6, 2024',
    type: 'BRIDGE',
    from: 'USDT',
    to: 'SOL',
    fromAmount: '100 USDT',
    toAmount: '120 SOL',
    status: 'completed' as const,
    hash: 'TYe123...1Qa',
  },
  {
    date: 'March 5, 2024',
    type: 'BRIDGE',
    from: 'ETH',
    to: 'SOL',
    fromAmount: '1 ETH',
    toAmount: '12 SOL',
    status: 'failed' as const,
    hash: 'TYe123...1Qa',
  },
];

const Bridge: React.FC = () => {
  const { toast } = useToast();
  const [sendAmount, setSendAmount] = useState('123.1123');
  const [receiveAmount, setReceiveAmount] = useState('123.1123');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'bridge' | 'explorer'>('bridge');
  const [sendToken, setSendToken] = useState<'ETH' | 'SOL'>('ETH');
  const [receiveToken, setReceiveToken] = useState<'ETH' | 'SOL'>('SOL');
  
  // Modals
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionModalType, setTransactionModalType] = useState<'error' | 'details' | 'signing'>('error');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentTransaction, setCurrentTransaction] = useState<any | null>(null);
  
  const handleMaxAmount = () => {
    setSendAmount('123.1123');
    setReceiveAmount('123.1123');
    toast({
      title: "Maximum amount set",
      description: "You've set the maximum available amount.",
    });
  };
  
  const toggleSendReceive = () => {
    const tempToken = sendToken;
    setSendToken(receiveToken);
    setReceiveToken(tempToken);
    toast({
      title: "Tokens swapped",
      description: `Now sending ${receiveToken} and receiving ${sendToken}.`,
    });
  };
  
  const validateAddress = (address: string) => {
    if (!address) {
      setAddressError('Address is required');
      return false;
    }
    
    if (address.length < 10) {
      setAddressError('Invalid address format');
      return false;
    }
    
    setAddressError('');
    return true;
  };
  
  const handleConfirmTransaction = () => {
    if (!isConnected) {
      setIsConnected(true);
      toast({
        title: "Wallet connected",
        description: "Your wallet has been connected successfully.",
      });
      return;
    }
    
    if (!receiverAddress) {
      setAddressError('Receiver address is required');
      return;
    }
    
    const isValid = validateAddress(receiverAddress);
    
    if (!isValid) {
      return;
    }
    
    // Simulate random transaction outcomes for demo
    const outcomes = ['success', 'error', 'signing'];
    const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    
    if (randomOutcome === 'success') {
      toast({
        title: "Transaction confirmed",
        description: `Successfully bridged ${sendAmount} ${sendToken} to ${receiveAmount} ${receiveToken}.`,
      });
    } else if (randomOutcome === 'error') {
      setTransactionModalType('error');
      setErrorMessage('Insufficient funds for transaction.');
      setShowTransactionModal(true);
    } else {
      setTransactionModalType('signing');
      setShowTransactionModal(true);
      
      // Simulate wallet signing delay
      setTimeout(() => {
        setShowTransactionModal(false);
        toast({
          title: "Transaction signed",
          description: "Your transaction has been signed and submitted.",
        });
      }, 3000);
    }
  };
  
  const handleViewTransactionDetails = (hash: string) => {
    const transaction = sampleTransactions.find(tx => tx.hash === hash);
    if (transaction) {
      setCurrentTransaction({
        from: transaction.fromToken,
        to: transaction.toToken,
        fromChain: transaction.fromToken,
        toChain: transaction.toToken,
        amount: transaction.fromAmount,
        status: transaction.status,
        hash: transaction.hash,
        date: new Date(transaction.date).toLocaleString(),
      });
      setTransactionModalType('details');
      setShowTransactionModal(true);
    }
  };
  
  const handleConnectWallet = () => {
    setIsConnected(true);
    toast({
      title: "Wallet connected",
      description: "Your wallet has been connected successfully.",
    });
  };
  
  return (
    <div className="min-h-screen bg-bridge-bg text-white flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 flex justify-between items-center border-b border-bridge-accent/20">
        <div className="flex items-center space-x-6">
          <Logo />
          <nav className="hidden md:flex space-x-4">
            <button 
              className={`px-1 py-0.5 text-sm font-medium ${selectedTab === 'bridge' ? 'text-white' : 'text-bridge-muted hover:text-white/80'}`}
              onClick={() => setSelectedTab('bridge')}
            >
              BRIDGE
            </button>
            <button 
              className={`px-1 py-0.5 text-sm font-medium ${selectedTab === 'explorer' ? 'text-white' : 'text-bridge-muted hover:text-white/80'}`}
              onClick={() => setSelectedTab('explorer')}
            >
              EXPLORER
            </button>
          </nav>
        </div>
        
        <div className="flex items-center space-x-3">
          {isConnected ? (
            <button 
              className="text-xs font-mono bg-bridge-accent/30 text-white px-3 py-1.5 rounded-full hover:bg-bridge-accent/50 transition-colors"
              onClick={() => setShowAccountModal(true)}
            >
              0x1213131...123
            </button>
          ) : (
            <Button size="sm" onClick={handleConnectWallet}>
              Connect
            </Button>
          )}
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 flex">
        {/* Left panel */}
        <div className="w-1/3 border-r border-bridge-accent/20 p-6">
          <div className="h-full flex flex-col">
            <h1 className="text-4xl font-bold mb-4">BRIDGE</h1>
            <p className="text-bridge-muted text-sm mb-6">
              No contracts. No custodians.<br />
              No bullshit. Send anything.<br />
              Receive anything.
            </p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-bridge-muted">Volume Bridged</span>
                <span className="font-medium">$129M</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-bridge-muted">Transactions</span>
                <span className="font-medium">$129M</span>
              </div>
            </div>
            
            <div className="mt-auto text-sm text-bridge-muted flex items-center">
              <span>Brought to you by</span>
              <span className="ml-2 italic font-medium tracking-wider">Electron</span>
            </div>
          </div>
        </div>
        
        {/* Right panel */}
        <div className="flex-1 p-6">
          {selectedTab === 'bridge' ? (
            <div className="max-w-lg mx-auto">
              {/* Send Section */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-bridge-muted">Send</span>
                  <div className="flex items-center space-x-1 bg-bridge-accent/30 px-2 py-1 rounded">
                    <div className="w-4 h-4 bg-bridge-bg rounded-sm flex items-center justify-center">
                      <span className="text-xs">Ξ</span>
                    </div>
                    <span className="text-xs">{sendToken}</span>
                    <span className="text-xs text-bridge-muted">{sendToken === 'ETH' ? 'Ethereum' : 'Solana'}</span>
                  </div>
                </div>
                
                <div className="bridge-input flex items-center">
                  <input
                    type="text"
                    className="bg-transparent border-none outline-none flex-1 font-mono"
                    value={sendAmount}
                    onChange={(e) => {
                      setSendAmount(e.target.value);
                      setReceiveAmount(e.target.value); // Simple 1:1 for demo
                    }}
                  />
                  <div className="flex space-x-2 items-center ml-2">
                    <span className="text-xs text-bridge-muted">$124,123</span>
                    <button 
                      className="text-xs bg-white/10 text-white px-2 py-0.5 rounded hover:bg-white/20 transition-colors"
                      onClick={handleMaxAmount}
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Direction toggle */}
              <div className="flex justify-center mb-4">
                <button 
                  className="w-8 h-8 rounded-full bg-bridge-accent/20 flex items-center justify-center hover:bg-bridge-accent/40 transition-colors"
                  onClick={toggleSendReceive}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 10L12 15L7 10M7 14L12 9L17 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              {/* Receive Section */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-bridge-muted">Receive</span>
                  <div className="flex items-center space-x-1 bg-bridge-accent/30 px-2 py-1 rounded">
                    <div className="w-4 h-4 bg-bridge-bg rounded-sm flex items-center justify-center">
                      <span className="text-xs">{receiveToken === 'SOL' ? 'S' : 'Ξ'}</span>
                    </div>
                    <span className="text-xs">{receiveToken}</span>
                    <span className="text-xs text-bridge-muted">{receiveToken === 'SOL' ? 'Solana' : 'Ethereum'}</span>
                  </div>
                </div>
                
                <div className="bridge-input flex items-center mb-4">
                  <input
                    type="text"
                    className="bg-transparent border-none outline-none flex-1 font-mono"
                    value={receiveAmount}
                    onChange={(e) => {
                      setReceiveAmount(e.target.value);
                      setSendAmount(e.target.value); // Simple 1:1 for demo
                    }}
                  />
                  <div className="flex space-x-2 items-center ml-2">
                    <span className="text-xs text-bridge-muted">$124,123</span>
                  </div>
                </div>
                
                <AddressInput
                  placeholder="Receiver address"
                  value={receiverAddress}
                  onChange={(e) => {
                    setReceiverAddress(e.target.value);
                    if (e.target.value) validateAddress(e.target.value);
                  }}
                  error={addressError}
                />
              </div>
              
              {/* Confirm Button */}
              <div className="mb-8">
                <Button
                  fullWidth
                  className="py-6 text-lg"
                  onClick={handleConfirmTransaction}
                >
                  {isConnected ? 'Confirm transaction' : 'Connect Wallet'}
                </Button>
              </div>
              
              {/* Transaction info */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-bridge-muted">Exchange Rate</span>
                    <button className="ml-1 text-bridge-muted hover:text-white">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <span>1ETH = 12 SOL</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-bridge-muted">Slippage</span>
                  <div className="flex items-center">
                    <span>5%</span>
                    <button className="ml-1 text-bridge-muted hover:text-white">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.2322 5.23223L18.7677 8.76777M16.7322 3.73223C17.7085 2.75592 19.2914 2.75592 20.2677 3.73223C21.244 4.70854 21.244 6.29146 20.2677 7.26777L6.5 21.0355H3V17.4644L16.7322 3.73223Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-bridge-muted">Gas</span>
                  <span>$8.612</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-4xl font-bold mb-6 opacity-40">EXPLORER</h2>
              <TransactionHistory 
                transactions={sampleTransactions}
                onViewDetails={handleViewTransactionDetails}
              />
            </div>
          )}
        </div>
      </main>
      
      {/* Modals */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        type={transactionModalType}
        errorMessage={errorMessage}
        transaction={currentTransaction}
      />
      
      <AccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        transactions={accountTransactions}
      />
    </div>
  );
};

export default Bridge;
