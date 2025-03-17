import React, { useState, useEffect } from 'react';
import Logo from '@/components/Logo';
import Button from '@/components/Button';
import AddressInput from '@/components/AddressInput';
import TransactionModal from '@/components/TransactionModal';
import AccountModal from '@/components/AccountModal';
import TokenSelectionModal, { Token, Chain } from '@/components/TokenSelectionModal';
import { useToast } from '@/hooks/use-toast';
import TransactionHistory from '@/components/TransactionHistory';
import { Transaction } from '@/types/transaction';
import WalletModal from '@/components/WalletModal';
import WalletDropdown from '@/components/WalletDropdown';
import { connectMetaMask, connectPhantom, sendEthTransaction, sendSolTransaction, subscribeToWalletEvents } from '@/lib/wallet';
import Web3 from 'web3';

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
const accountTransactions: Transaction[] = [
  {
    date: 'March 6, 2024',
    type: 'BRIDGE',
    from: 'ETH',
    to: 'SOL',
    fromAmount: '3 ETH',
    toAmount: '36 SOL',
    status: 'processing',
    hash: 'TYe123...1Qa',
  },
  {
    date: 'March 6, 2024',
    type: 'BRIDGE',
    from: 'USDT',
    to: 'SOL',
    fromAmount: '100 USDT',
    toAmount: '120 SOL',
    status: 'completed',
    hash: 'TYe123...1Qa',
  },
  {
    date: 'March 5, 2024',
    type: 'BRIDGE',
    from: 'ETH',
    to: 'SOL',
    fromAmount: '1 ETH',
    toAmount: '12 SOL',
    status: 'failed',
    hash: 'TYe123...1Qa',
  },
];

const Bridge: React.FC = () => {
  const { toast } = useToast();
  const [sendAmount, setSendAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'bridge' | 'explorer'>('bridge');
  
  // Updated token state to include chain information
  const [sendTokenInfo, setSendTokenInfo] = useState<{ token: Token; chain: Chain } | null>(null);
  const [receiveTokenInfo, setReceiveTokenInfo] = useState<{ token: Token; chain: Chain } | null>(null);
  
  // Modals
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionModalType, setTransactionModalType] = useState<'error' | 'details' | 'signing'>('error');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTokenSelectionModal, setShowTokenSelectionModal] = useState(false);
  const [tokenSelectionMode, setTokenSelectionMode] = useState<'send' | 'receive'>('send');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentTransaction, setCurrentTransaction] = useState<any | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [slippage, setSlippage] = useState('5');
  const [isEditingSlippage, setIsEditingSlippage] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<{
    exchangeRate: string | null;
    gasFee: string | null;
  }>({
    exchangeRate: null,
    gasFee: null
  });
  
  // Setup wallet event listeners
  useEffect(() => {
    if (!isConnected) return;

    const cleanup = subscribeToWalletEvents(
      // Handle accounts changed
      (accounts) => {
        if (accounts.length === 0) {
          handleDisconnectWallet();
        } else {
          setWalletAddress(accounts[0]);
        }
      },
      // Handle chain changed
      (chainId) => {
        setChainId(parseInt(chainId, 16));
        toast({
          title: "Network Changed",
          description: `Switched to chain ID: ${parseInt(chainId, 16)}`,
        });
      },
      // Handle disconnect
      handleDisconnectWallet
    );

    return cleanup;
  }, [isConnected]);
  
  useEffect(() => {
    const getWalletBalance = async () => {
      if (!isConnected || !window.ethereum || !walletAddress || !sendTokenInfo) {
        setWalletBalance(null);
        return;
      }

      try {
        if (sendTokenInfo.token.symbol === 'USDT') {
          // USDT contract address on Ethereum mainnet
          const usdtContractAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
          
          // Get USDT balance using contract call
          const data = '0x70a08231' + '000000000000000000000000' + walletAddress.slice(2);
          const balance = await window.ethereum.request({
            method: 'eth_call',
            params: [{
              to: usdtContractAddress,
              data: data
            }, 'latest']
          });
          
          // Convert from USDT decimals (6) to display format
          const balanceInUsdt = (parseInt(balance, 16) / 1e6).toFixed(2);
          setWalletBalance(balanceInUsdt);
        } else {
          // For ETH balance
          const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [walletAddress, 'latest']
          });
          
          // Convert from wei to ether
          const balanceInEther = (parseInt(balance, 16) / 1e18).toFixed(4);
          setWalletBalance(balanceInEther);
        }
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
        setWalletBalance(null);
      }
    };

    getWalletBalance();
  }, [isConnected, walletAddress, sendTokenInfo]);
  
  const handleMaxAmount = () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to use MAX amount",
        variant: "destructive"
      });
      return;
    }

    if (!sendTokenInfo) {
      toast({
        title: "No token selected",
        description: "Please select a token first",
        variant: "destructive"
      });
      return;
    }

    if (!walletBalance) {
      toast({
        title: "Balance not available",
        description: "Unable to fetch wallet balance",
        variant: "destructive"
      });
      return;
    }

    setSendAmount(walletBalance);
    setReceiveAmount(walletBalance); // Simple 1:1 for demo
    toast({
      title: "Maximum amount set",
      description: `Set to maximum available balance: ${walletBalance} ${sendTokenInfo.token.symbol}`,
    });
  };
  
  const toggleSendReceive = () => {
    const tempTokenInfo = sendTokenInfo;
    setSendTokenInfo(receiveTokenInfo);
    setReceiveTokenInfo(tempTokenInfo);
    toast({
      title: "Tokens swapped",
      description: `Now sending ${receiveTokenInfo?.token.symbol || ''} on ${receiveTokenInfo?.chain.name || ''} and receiving ${sendTokenInfo?.token.symbol || ''} on ${sendTokenInfo?.chain.name || ''}.`,
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
  
  const handleConfirmTransaction = async () => {
    if (!isConnected) {
      setShowWalletModal(true);
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

    if (!sendTokenInfo || !receiveTokenInfo || !sendAmount || !walletAddress) {
      toast({
        title: "Invalid Transaction",
        description: "Please ensure all fields are filled correctly",
        variant: "destructive"
      });
      return;
    }

    // Validate wallet connection matches the selected chain
    const isEthereumChain = sendTokenInfo.chain.name.toLowerCase().includes('ethereum');
    const isSolanaChain = sendTokenInfo.chain.name.toLowerCase().includes('solana');

    if (isEthereumChain && (!window.ethereum || connectedWallet !== 'metamask')) {
      toast({
        title: "Wrong Wallet",
        description: "Please connect MetaMask to send from Ethereum chain",
        variant: "destructive"
      });
      setShowWalletModal(true);
      return;
    }

    if (isSolanaChain && (!window.solana?.isPhantom || connectedWallet !== 'phantom')) {
      toast({
        title: "Wrong Wallet",
        description: "Please connect Phantom wallet to send from Solana chain",
        variant: "destructive"
      });
      setShowWalletModal(true);
      return;
    }

    // Set transaction to signing state
    setTransactionModalType('signing');
    setShowTransactionModal(true);

    try {
      let txHash: string | null = null;

      // Check if sending from Ethereum chain
      if (isEthereumChain) {
        const web3 = new Web3(window.ethereum);
        
        if (sendTokenInfo.token.symbol === 'ETH') {
          // ETH balance check
          const balance = await web3.eth.getBalance(walletAddress);
          const amountInWei = web3.utils.toWei(sendAmount, 'ether');
          
          if (BigInt(balance) < BigInt(amountInWei)) {
            throw new Error("Insufficient ETH balance for transaction");
          }
        } else {
          // ERC20 token balance check
          const tokenContract = new web3.eth.Contract([
            {
              constant: true,
              inputs: [{ name: "_owner", type: "address" }],
              name: "balanceOf",
              outputs: [{ name: "balance", type: "uint256" }],
              type: "function"
            },
            {
              constant: true,
              inputs: [],
              name: "decimals",
              outputs: [{ name: "", type: "uint8" }],
              type: "function"
            }
          ] as const, sendTokenInfo.token.address);

          const decimals = parseInt(await tokenContract.methods.decimals().call());
          const balance = await tokenContract.methods.balanceOf(walletAddress).call();
          const amountInSmallestUnit = parseFloat(sendAmount) * Math.pow(10, decimals);

          if (BigInt(balance) < BigInt(amountInSmallestUnit)) {
            throw new Error(`Insufficient ${sendTokenInfo.token.symbol} balance for transaction`);
          }
        }

        txHash = await sendEthTransaction({
          fromAddress: walletAddress,
          toAddress: receiverAddress,
          amount: sendAmount,
          tokenAddress: sendTokenInfo.token.address
        });
      }
      // Check if sending from Solana chain
      else if (isSolanaChain) {
        // Validate if user has sufficient balance
        const connection = new window.solana.Connection("https://api.mainnet-beta.solana.com");
        const balance = await connection.getBalance(new window.solana.PublicKey(walletAddress));
        const amountInLamports = parseFloat(sendAmount) * window.solana.LAMPORTS_PER_SOL;
        
        if (balance < amountInLamports) {
          throw new Error("Insufficient balance for transaction");
        }

        txHash = await sendSolTransaction({
          fromAddress: walletAddress,
          toAddress: receiverAddress,
          amount: sendAmount
        });
      }

      if (txHash) {
        setShowTransactionModal(false);
        toast({
          title: "Transaction Submitted",
          description: "Your transaction has been signed and submitted to the network.",
        });

        // Add transaction to history
        const newTransaction = {
          date: new Date().toLocaleString(),
          type: 'BRIDGE',
          from: sendTokenInfo.token.symbol,
          to: receiveTokenInfo.token.symbol,
          fromAmount: `${sendAmount} ${sendTokenInfo.token.symbol}`,
          toAmount: `${receiveAmount} ${receiveTokenInfo.token.symbol}`,
          status: 'processing',
          hash: txHash
        };

        // Update transaction history (you'll need to implement this)
        // setTransactions([newTransaction, ...transactions]);
      } else {
        throw new Error("Could not start transaction. Please try again.");
      }
    } catch (error: any) {
      console.error('Transaction error:', error);
      setTransactionModalType('error');
      setErrorMessage(error.message || 'Transaction failed. Please try again.');
      setShowTransactionModal(true);
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
    setShowWalletModal(true);
  };

  const handleWalletSelect = async (walletId: string) => {
    if (walletId === 'metamask') {
      const connection = await connectMetaMask();
      
      if (connection) {
        setConnectedWallet('metamask');
        setWalletAddress(connection.address);
        setChainId(connection.chainId);
        setIsConnected(true);
        
        toast({
          title: "Wallet Connected",
          description: "Successfully connected to MetaMask",
        });
      }
    } else if (walletId === 'phantom') {
      const connection = await connectPhantom();
      
      if (connection) {
        setConnectedWallet('phantom');
        setWalletAddress(connection.address);
        setChainId(connection.chainId);
        setIsConnected(true);
        
        toast({
          title: "Wallet Connected",
          description: "Successfully connected to Phantom",
        });
      }
    } else {
      toast({
        title: "Not Implemented",
        description: `${walletId} connection not yet implemented`,
        variant: "destructive"
      });
    }
  };

  const handleDisconnectWallet = () => {
    setIsConnected(false);
    setConnectedWallet(null);
    setWalletAddress(null);
    setChainId(null);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  const openTokenSelection = (mode: 'send' | 'receive') => {
    setTokenSelectionMode(mode);
    setShowTokenSelectionModal(true);
  };
  
  const handleTokenSelect = (selection: { token: Token; chain: Chain }) => {
    if (tokenSelectionMode === 'send') {
      setSendTokenInfo(selection);
    } else {
      setReceiveTokenInfo(selection);
    }
  };
  
  const isFormValid = () => {
    return (
      isConnected &&
      sendTokenInfo !== null &&
      receiveTokenInfo !== null &&
      sendAmount !== '' &&
      parseFloat(sendAmount) > 0 &&
      receiverAddress !== '' &&
      !addressError
    );
  };
  
  const calculateTransactionDetails = async (
    amount: string,
    sendToken: { token: Token; chain: Chain } | null,
    receiveToken: { token: Token; chain: Chain } | null
  ) => {
    if (!amount || !sendToken || !receiveToken) {
      setTransactionDetails({
        exchangeRate: null,
        gasFee: null
      });
      return;
    }

    setIsCalculating(true);
    try {
      // Simulate API call - Replace with actual API call
      interface TransactionDetailsResponse {
        exchangeRate: string;
        estimatedGas: string;
        receivedAmount: string;
      }

      const response = await new Promise<TransactionDetailsResponse>((resolve) => {
        setTimeout(() => {
          resolve({
            exchangeRate: `1${sendToken.token.symbol} = 12 ${receiveToken.token.symbol}`,
            estimatedGas: '8.612',
            receivedAmount: amount
          });
        }, 1000);
      });

      setTransactionDetails({
        exchangeRate: response.exchangeRate,
        gasFee: `$${response.estimatedGas}`
      });
      setReceiveAmount(response.receivedAmount);
    } catch (error) {
      console.error('Error calculating transaction details:', error);
      toast({
        title: "Calculation Error",
        description: "Failed to calculate transaction details",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    if (sendAmount && sendTokenInfo && receiveTokenInfo) {
      calculateTransactionDetails(sendAmount, sendTokenInfo, receiveTokenInfo);
    } else {
      setTransactionDetails({
        exchangeRate: null,
        gasFee: null
      });
      setReceiveAmount('');
    }
  }, [sendAmount, sendTokenInfo, receiveTokenInfo]);

  const handleSendAmountChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSendAmount(value);
    
    if (value && sendTokenInfo && receiveTokenInfo) {
      calculateTransactionDetails(value, sendTokenInfo, receiveTokenInfo);
    } else {
      setTransactionDetails({
        exchangeRate: null,
        gasFee: null
      });
      setReceiveAmount('');
    }
  };
  
  const handleSlippageChange = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    if (parts.length > 2) return;
    
    // Limit to 1 decimal place
    if (parts[1] && parts[1].length > 1) return;
    
    // Maximum value of 100
    if (parseFloat(cleanValue) > 100) return;
    
    setSlippage(cleanValue);
  };

  const handleSlippageBlur = () => {
    // Ensure value is between 0.1 and 100
    const numValue = parseFloat(slippage);
    if (isNaN(numValue) || numValue < 0.1) {
      setSlippage('0.1');
    } else if (numValue > 100) {
      setSlippage('100');
    }
    setIsEditingSlippage(false);
  };
  
  return (
    <div className="min-h-screen bg-[#121217] text-white flex flex-col">
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
            {/* <button 
              className={`px-1 py-0.5 text-sm font-medium ${selectedTab === 'explorer' ? 'text-white' : 'text-bridge-muted hover:text-white/80'}`}
              onClick={() => setSelectedTab('explorer')}
            >
              EXPLORER
            </button> */}
          </nav>
        </div>
        
        <div className="flex items-center space-x-3">
          {isConnected ? (
            <WalletDropdown
              address={walletAddress || ''}
              onDisconnect={handleDisconnectWallet}
              onShowAccount={() => setShowAccountModal(true)}
            />
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
            <h1 className="text-6xl font-bold mb-4 text-gray-400">{selectedTab.toUpperCase()}</h1>
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
                  <button 
                    onClick={() => openTokenSelection('send')}
                    className="flex items-center space-x-1 bg-bridge-accent/30 px-2 py-1 rounded hover:bg-bridge-accent/50 transition-colors"
                  >
                    {sendTokenInfo ? (
                      <>
                        <img 
                          src={sendTokenInfo.token.icon} 
                          alt={sendTokenInfo.token.symbol}
                          className="w-6 h-6 mr-1 object-contain"
                        />
                        <div className="flex flex-col items-start">
                          <span className="text-xs">{sendTokenInfo.token.symbol}</span>
                          <span className="text-xs text-bridge-muted">{sendTokenInfo.chain.name}</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs">Select Token</span>
                    )}
                  </button>
                </div>
                
                <div className="bridge-input flex items-center">
                  <input
                    type="text"
                    className="bg-transparent border-none outline-none flex-1 font-mono"
                    value={sendAmount}
                    onChange={handleSendAmountChange}
                    placeholder="0.0"
                  />
                  <div className="flex space-x-2 items-center ml-2">
                    {isConnected && sendTokenInfo && walletBalance && (
                      <span className="text-xs text-bridge-muted">Balance: {walletBalance} {sendTokenInfo.token.symbol}</span>
                    )}
                    <button 
                      className={`text-xs px-2 py-0.5 rounded transition-colors ${
                        isConnected && sendTokenInfo
                          ? 'bg-white/10 text-white hover:bg-white/20' 
                          : 'bg-white/5 text-white/50 cursor-not-allowed'
                      }`}
                      onClick={handleMaxAmount}
                      disabled={!isConnected || !sendTokenInfo}
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
                  <button 
                    onClick={() => openTokenSelection('receive')}
                    className="flex items-center space-x-1 bg-bridge-accent/30 px-2 py-1 rounded hover:bg-bridge-accent/50 transition-colors"
                  >
                    {receiveTokenInfo ? (
                      <>
                        <img 
                          src={receiveTokenInfo.token.icon} 
                          alt={receiveTokenInfo.token.symbol}
                          className="w-6 h-6 mr-1 object-contain"
                        />
                        <div className="flex flex-col items-start">
                          <span className="text-xs">{receiveTokenInfo.token.symbol}</span>
                          <span className="text-xs text-bridge-muted">{receiveTokenInfo.chain.name}</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs">Select Token</span>
                    )}
                  </button>
                </div>
                
                <div className="bridge-input flex items-center mb-4">
                  <input
                    type="text"
                    className="bg-transparent border-none outline-none flex-1 font-mono opacity-50"
                    value={!receiveTokenInfo ? '' : isCalculating ? '' : receiveAmount}
                    readOnly
                    placeholder={!receiveTokenInfo ? 'Select token first' : isCalculating ? 'Calculating...' : '0.0'}
                  />
                  {isCalculating && (
                    <div className="ml-2">
                      <div className="animate-spin h-5 w-5 border-[2.5px] border-white/20 border-t-white rounded-full" />
                    </div>
                  )}
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
                  className={`py-6 text-lg flex items-center justify-center ${
                    !isFormValid() 
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                  onClick={handleConfirmTransaction}
                  disabled={!isFormValid()}
                >
                  <span>
                    {!isConnected 
                      ? 'Connect Wallet' 
                      : !sendTokenInfo || !receiveTokenInfo
                      ? 'Select Tokens'
                      : !sendAmount || parseFloat(sendAmount) <= 0
                      ? 'Enter Amount'
                      : !receiverAddress || addressError
                      ? 'Enter Valid Address'
                      : 'Confirm Transaction'
                    }
                  </span>
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
                  <span className="text-bridge-muted">
                    {isCalculating ? (
                      <div className="animate-pulse">Calculating...</div>
                    ) : transactionDetails.exchangeRate || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-bridge-muted">Slippage</span>
                  <div className="flex items-center">
                    {isEditingSlippage ? (
                      <div className="flex items-center">
                        <input
                          type="text"
                          className="w-12 bg-transparent border border-white/20 rounded px-1 text-right text-sm"
                          value={slippage}
                          onChange={(e) => handleSlippageChange(e.target.value)}
                          onBlur={handleSlippageBlur}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSlippageBlur();
                            }
                          }}
                          autoFocus
                        />
                        <span className="ml-1">%</span>
                      </div>
                    ) : (
                      <span>{slippage}%</span>
                    )}
                    <button 
                      className="ml-1 text-bridge-muted hover:text-white"
                      onClick={() => setIsEditingSlippage(true)}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.2322 5.23223L18.7677 8.76777M16.7322 3.73223C17.7085 2.75592 19.2914 2.75592 20.2677 3.73223C21.244 4.70854 21.244 6.29146 20.2677 7.26777L6.5 21.0355H3V17.4644L16.7322 3.73223Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-bridge-muted">Gas</span>
                  <span className="text-bridge-muted">
                    {isCalculating ? (
                      <div className="animate-pulse">Calculating...</div>
                    ) : transactionDetails.gasFee || '-'}
                  </span>
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
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSelect={handleWalletSelect}
      />
      
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

      <TokenSelectionModal
        isOpen={showTokenSelectionModal}
        onClose={() => setShowTokenSelectionModal(false)}
        onSelect={handleTokenSelect}
        mode={tokenSelectionMode}
      />
    </div>
  );
};

export default Bridge;
