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
import { connectMetaMask, connectPhantom, sendEthTransaction, sendSolTransaction, subscribeToWalletEvents, NETWORKS, switchNetwork } from '@/lib/wallet';
import Web3 from 'web3';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

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

interface WalletState {
  metamask?: {
    address: string;
    chainId: number;
  };
  phantom?: {
    address: string;
    chainId: number;
  };
}

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
  const [connectedWallets, setConnectedWallets] = useState<WalletState>({});
  const [activeWallet, setActiveWallet] = useState<'metamask' | 'phantom' | null>(null);
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
    if (!connectedWallets.metamask) return;

    const cleanup = subscribeToWalletEvents(
      // Handle accounts changed
      (accounts) => {
        if (accounts.length === 0) {
          handleDisconnectWallet('metamask');
        } else {
          setConnectedWallets(prev => ({
            ...prev,
            metamask: {
              ...prev.metamask!,
              address: accounts[0]
            }
          }));
        }
      },
      // Handle chain changed
      (chainId) => {
        const chainIdNumber = parseInt(chainId, 16);
        setConnectedWallets(prev => ({
          ...prev,
          metamask: {
            ...prev.metamask!,
            chainId: chainIdNumber
          }
        }));
        toast({
          title: "Network Changed",
          description: `Switched to chain ID: ${chainIdNumber}`,
        });
      },
      // Handle disconnect
      () => handleDisconnectWallet('metamask')
    );

    return cleanup;
  }, [connectedWallets.metamask]);
  
  useEffect(() => {
    const getWalletBalance = async () => {
      if (!sendTokenInfo) {
        setWalletBalance(null);
        return;
      }

      // Get the appropriate wallet based on the selected chain
      const isEthereumChain = ['ethereum', 'bsc', 'scroll'].includes(sendTokenInfo.chain.id);
      const isSolanaChain = sendTokenInfo.chain.id === 'solana';

      if (isEthereumChain && (!connectedWallets.metamask || activeWallet !== 'metamask')) {
        setWalletBalance(null);
        return;
      }

      if (isSolanaChain && (!connectedWallets.phantom || activeWallet !== 'phantom')) {
        setWalletBalance(null);
        return;
      }

      const walletAddress = isEthereumChain 
        ? connectedWallets.metamask?.address 
        : connectedWallets.phantom?.address;

      if (!walletAddress) {
        setWalletBalance(null);
        return;
      }

      try {
        if (isEthereumChain) {
          const web3 = new Web3(window.ethereum);
          
          if (sendTokenInfo.token.symbol === 'ETH') {
            const balance = await web3.eth.getBalance(walletAddress);
            const balanceInEther = web3.utils.fromWei(balance, 'ether');
            setWalletBalance(parseFloat(balanceInEther).toFixed(4));
          } else if (sendTokenInfo.token.address) {
            // For ERC20 tokens
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

            const [balance, decimals] = await Promise.all([
              tokenContract.methods.balanceOf(walletAddress).call(),
              tokenContract.methods.decimals().call()
            ].map(p => p.then(v => v.toString())));

            const balanceInToken = parseFloat(balance) / Math.pow(10, parseInt(decimals));
            setWalletBalance(balanceInToken.toFixed(4));
          }
        } else if (isSolanaChain && window.solana?.isPhantom) {
          try {
            const connection = new Connection("https://api.mainnet-beta.solana.com", 'confirmed');
            const publicKey = new PublicKey(walletAddress);
            
            if (sendTokenInfo.token.symbol === 'SOL') {
              const balance = await connection.getBalance(publicKey);
              const balanceInSol = balance / LAMPORTS_PER_SOL;
              setWalletBalance(balanceInSol.toFixed(4));
            } else if (sendTokenInfo.token.address) {
              try {
                const tokenMint = new PublicKey(sendTokenInfo.token.address);
                const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
                  mint: tokenMint
                });
                
                if (tokenAccounts.value.length > 0) {
                  const tokenBalance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
                  setWalletBalance(tokenBalance.uiAmountString);
                } else {
                  setWalletBalance('0');
                }
              } catch (error) {
                console.error('Error fetching SPL token balance:', error);
                setWalletBalance(null);
                toast({
                  title: "Error fetching token balance",
                  description: "Failed to fetch SPL token balance",
                  variant: "destructive"
                });
              }
            }
          } catch (error) {
            console.error('Error fetching Solana balance:', error);
            setWalletBalance(null);
          }
        }
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
        setWalletBalance(null);
      }
    };

    getWalletBalance();
  }, [sendTokenInfo, connectedWallets, activeWallet]);
  
  const handleMaxAmount = async () => {
    if (!sendTokenInfo) {
      toast({
        title: "No token selected",
        description: "Please select a token first",
        variant: "destructive"
      });
      return;
    }

    // Get the appropriate wallet based on the selected chain
    const isEthereumChain = ['ethereum', 'bsc', 'scroll'].includes(sendTokenInfo.chain.id);
    const isSolanaChain = sendTokenInfo.chain.id === 'solana';

    if (isEthereumChain && (!connectedWallets.metamask || activeWallet !== 'metamask')) {
      toast({
        title: "Connect MetaMask",
        description: "Please connect MetaMask to use MAX amount for Ethereum chains",
        variant: "destructive"
      });
      return;
    }

    if (isSolanaChain && (!connectedWallets.phantom || activeWallet !== 'phantom')) {
      toast({
        title: "Connect Phantom",
        description: "Please connect Phantom wallet to use MAX amount for Solana",
        variant: "destructive"
      });
      return;
    }

    const walletAddress = isEthereumChain 
      ? connectedWallets.metamask?.address 
      : connectedWallets.phantom?.address;

    if (!walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to use MAX amount",
        variant: "destructive"
      });
      return;
    }

    try {
      let maxAmount = '0';

      if (isEthereumChain) {
        const web3 = new Web3(window.ethereum);
        
        if (sendTokenInfo.token.symbol === 'ETH') {
          const balance = await web3.eth.getBalance(walletAddress);
          // Leave some ETH for gas
          const gasBuffer = web3.utils.toWei('0.01', 'ether');
          const maxBalance = BigInt(balance) - BigInt(gasBuffer);
          maxAmount = web3.utils.fromWei(maxBalance.toString(), 'ether');
        } else if (sendTokenInfo.token.address) {
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

          const [balance, decimals] = await Promise.all([
            tokenContract.methods.balanceOf(walletAddress).call(),
            tokenContract.methods.decimals().call()
          ].map(p => p.then(v => v.toString())));

          maxAmount = (parseFloat(balance) / Math.pow(10, parseInt(decimals))).toString();
        }
      } else if (isSolanaChain && window.solana?.isPhantom) {
        const connection = new Connection("https://api.mainnet-beta.solana.com", 'confirmed');
        const publicKey = new PublicKey(walletAddress);
        
        if (sendTokenInfo.token.symbol === 'SOL') {
          const balance = await connection.getBalance(publicKey);
          // Leave some SOL for gas (0.01 SOL)
          const gasBuffer = 0.01 * LAMPORTS_PER_SOL;
          const maxBalance = balance - gasBuffer;
          maxAmount = (maxBalance / LAMPORTS_PER_SOL).toFixed(4);
        } else if (sendTokenInfo.token.address) {
          try {
            const tokenMint = new PublicKey(sendTokenInfo.token.address);
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
              mint: tokenMint
            });
            
            if (tokenAccounts.value.length > 0) {
              const tokenBalance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
              maxAmount = tokenBalance.uiAmountString || '0';
            } else {
              maxAmount = '0';
              toast({
                title: "No token account found",
                description: "You don't have a token account for this SPL token",
                variant: "destructive"
              });
            }
          } catch (error) {
            console.error('Error fetching SPL token balance:', error);
            toast({
              title: "Error setting max amount",
              description: "Failed to fetch SPL token balance",
              variant: "destructive"
            });
            return;
          }
        }
      }

      setSendAmount(maxAmount);
      toast({
        title: "Maximum amount set",
        description: `Set to maximum available balance: ${maxAmount} ${sendTokenInfo.token.symbol}`,
      });
    } catch (error: any) {
      console.error('Error setting max amount:', error);
      toast({
        title: "Error setting max amount",
        description: error.message || "Failed to set maximum amount",
        variant: "destructive"
      });
    }
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

    if (isEthereumChain && (!window.ethereum || activeWallet !== 'metamask')) {
      toast({
        title: "Wrong Wallet",
        description: "Please connect MetaMask to send from Ethereum chain",
        variant: "destructive"
      });
      setShowWalletModal(true);
      return;
    }

    if (isSolanaChain && (!window.solana?.isPhantom || activeWallet !== 'phantom')) {
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
        const connection = new Connection("https://api.mainnet-beta.solana.com");
        const balance = await connection.getBalance(new PublicKey(walletAddress));
        const amountInLamports = parseFloat(sendAmount) * LAMPORTS_PER_SOL;
        
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
      // Determine target network based on selected token/chain
      let targetNetwork: 'ETHEREUM' | 'BSC' | 'SCROLL' | undefined;
      
      if (sendTokenInfo) {
        if (sendTokenInfo.chain.id === 'ethereum') {
          targetNetwork = 'ETHEREUM';
        } else if (sendTokenInfo.chain.id === 'bsc') {
          targetNetwork = 'BSC';
        } else if (sendTokenInfo.chain.id === 'scroll') {
          targetNetwork = 'SCROLL';
        }
      }

      const connection = await connectMetaMask(targetNetwork);
      
      if (connection) {
        setConnectedWallets(prev => ({
          ...prev,
          metamask: {
            address: connection.address,
            chainId: connection.chainId
          }
        }));
        setActiveWallet('metamask');
        setIsConnected(true);
        
        toast({
          title: "Wallet Connected",
          description: "Successfully connected to MetaMask",
        });
      }
    } else if (walletId === 'phantom') {
      const connection = await connectPhantom();
      
      if (connection) {
        setConnectedWallets(prev => ({
          ...prev,
          phantom: {
            address: connection.address,
            chainId: connection.chainId
          }
        }));
        setActiveWallet('phantom');
        setIsConnected(true);
        
        toast({
          title: "Wallet Connected",
          description: "Successfully connected to Phantom",
        });
      }
    }
    
    setShowWalletModal(false);
  };

  const handleDisconnectWallet = (wallet: 'metamask' | 'phantom') => {
    setConnectedWallets(prev => {
      const newState = { ...prev };
      delete newState[wallet];
      return newState;
    });
    
    if (activeWallet === wallet) {
      setActiveWallet(null);
    }
    
    if (Object.keys(connectedWallets).length === 1) {
      setIsConnected(false);
    }
    
    toast({
      title: "Wallet Disconnected",
      description: `Your ${wallet === 'metamask' ? 'MetaMask' : 'Phantom'} wallet has been disconnected.`,
    });
  };

  const openTokenSelection = (mode: 'send' | 'receive') => {
    setTokenSelectionMode(mode);
    setShowTokenSelectionModal(true);
  };
  
  const handleTokenSelect = async (selection: { token: Token; chain: Chain }) => {
    if (tokenSelectionMode === 'send') {
      setSendTokenInfo(selection);
      
      // Handle network switching for Ethereum-based chains
      if (['ethereum', 'bsc', 'scroll'].includes(selection.chain.id)) {
        // If not connected to MetaMask, connect first
        if (!isConnected || activeWallet !== 'metamask') {
          const targetNetwork = selection.chain.id === 'ethereum' ? 'ETHEREUM' :
                              selection.chain.id === 'bsc' ? 'BSC' :
                              selection.chain.id === 'scroll' ? 'SCROLL' : undefined;
          
          const connection = await connectMetaMask(targetNetwork);
          if (connection) {
            setConnectedWallets(prev => ({
              ...prev,
              metamask: {
                address: connection.address,
                chainId: connection.chainId
              }
            }));
            setActiveWallet('metamask');
            setIsConnected(true);
          }
        } else {
          // If already connected to MetaMask, just switch network
          const targetNetwork = selection.chain.id === 'ethereum' ? 'ETHEREUM' :
                              selection.chain.id === 'bsc' ? 'BSC' :
                              selection.chain.id === 'scroll' ? 'SCROLL' : undefined;
          
          if (targetNetwork) {
            const networkConfig = NETWORKS[targetNetwork];
            await switchNetwork(networkConfig);
          }
        }
      }
      // Handle Solana chain selection
      else if (selection.chain.id === 'solana' && (!isConnected || activeWallet !== 'phantom')) {
        const connection = await connectPhantom();
        if (connection) {
          setConnectedWallets(prev => ({
            ...prev,
            phantom: {
              address: connection.address,
              chainId: connection.chainId
            }
          }));
          setActiveWallet('phantom');
          setIsConnected(true);
        }
      }
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
  
  // Helper function to get current wallet info based on chain
  const getWalletForChain = (chainType: 'ethereum' | 'solana') => {
    if (chainType === 'ethereum') {
      return connectedWallets.metamask;
    } else {
      return connectedWallets.phantom;
    }
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
            <button 
              className={`px-1 py-0.5 text-sm font-medium ${selectedTab === 'explorer' ? 'text-white' : 'text-bridge-muted hover:text-white/80'}`}
              onClick={() => setSelectedTab('explorer')}
            >
              EXPLORER
            </button>
          </nav>
        </div>
        
        <div className="flex items-center space-x-3">
          {Object.keys(connectedWallets).length > 0 ? (
            <div className="flex items-center space-x-2">
              {connectedWallets.metamask && (
                <WalletDropdown
                  address={connectedWallets.metamask.address}
                  onDisconnect={() => handleDisconnectWallet('metamask')}
                  onShowAccount={() => setShowAccountModal(true)}
                  walletType="metamask"
                  isActive={activeWallet === 'metamask'}
                  onSetActive={() => setActiveWallet('metamask')}
                />
              )}
              {connectedWallets.phantom && (
                <WalletDropdown
                  address={connectedWallets.phantom.address}
                  onDisconnect={() => handleDisconnectWallet('phantom')}
                  onShowAccount={() => setShowAccountModal(true)}
                  walletType="phantom"
                  isActive={activeWallet === 'phantom'}
                  onSetActive={() => setActiveWallet('phantom')}
                />
              )}
              <Button size="sm" onClick={handleConnectWallet}>
                Add Wallet
              </Button>
            </div>
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
                    className="flex items-center space-x-1 bg-bridge-accent/30 px-3 py-2 rounded hover:bg-bridge-accent/50 transition-colors min-w-[140px] justify-center"
                  >
                    {sendTokenInfo ? (
                      <>
                        <div className="flex items-center justify-center">
                          <img 
                            src={sendTokenInfo.token.icon} 
                            alt={sendTokenInfo.token.symbol}
                            className="w-6 h-6 mr-2 object-contain"
                          />
                          <div className="flex flex-col items-center">
                            <span className="text-xs">{sendTokenInfo.token.symbol}</span>
                            <span className="text-xs text-bridge-muted">{sendTokenInfo.chain.name}</span>
                          </div>
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
                    className="flex items-center space-x-1 bg-bridge-accent/30 px-3 py-2 rounded hover:bg-bridge-accent/50 transition-colors min-w-[140px] justify-center"
                  >
                    {receiveTokenInfo ? (
                      <>
                        <div className="flex items-center justify-center">
                          <img 
                            src={receiveTokenInfo.token.icon} 
                            alt={receiveTokenInfo.token.symbol}
                            className="w-6 h-6 mr-2 object-contain"
                          />
                          <div className="flex flex-col items-center">
                            <span className="text-xs">{receiveTokenInfo.token.symbol}</span>
                            <span className="text-xs text-bridge-muted">{receiveTokenInfo.chain.name}</span>
                          </div>
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
      
      {showAccountModal && (
        <AccountModal
          isOpen={showAccountModal}
          onClose={() => setShowAccountModal(false)}
          transactions={accountTransactions}
          ethereumAddress={connectedWallets.metamask?.address || null}
          solanaAddress={connectedWallets.phantom?.address || null}
          ethereumChainId={connectedWallets.metamask?.chainId || null}
        />
      )}

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
