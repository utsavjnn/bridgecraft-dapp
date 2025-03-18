import { toast } from "@/hooks/use-toast"
import Web3 from 'web3'

declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
    web3?: Web3;
  }
}

export interface WalletConnection {
  address: string;
  chainId: number;
}

export interface TransactionRequest {
  fromAddress: string;
  toAddress: string;
  amount: string;
  tokenAddress?: string; // For ERC20 tokens
}

// Network configurations
export const NETWORKS = {
  ETHEREUM: {
    chainId: '0x1', // 1
    chainName: 'Ethereum Mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.infura.io/v3/your-project-id'],
    blockExplorerUrls: ['https://etherscan.io/']
  },
  BSC: {
    chainId: '0x38', // 56
    chainName: 'BNB Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    blockExplorerUrls: ['https://bscscan.com/']
  },
  SCROLL: {
    chainId: '0x82750', // 534352
    chainName: 'Scroll',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://rpc.scroll.io'],
    blockExplorerUrls: ['https://scrollscan.com/']
  }
};

const ELECTRON_ETH_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"; // Replace with actual address
const ELECTRON_SOL_ADDRESS = "BUX7s2ef2htTGb2KKoPHWkmzxPj4nTWMWRgs5CSbQxf9"; // Replace with actual address

// Helper function to switch networks
export const switchNetwork = async (networkConfig: typeof NETWORKS.ETHEREUM) => {
  try {
    // Get MetaMask provider
    // @ts-ignore - ethereum.providers is available in modern browsers
    const providers = window.ethereum.providers || [window.ethereum];
    const metamaskProvider = providers.find((p: any) => p.isMetaMask && !p.isPhantom);
    
    if (!metamaskProvider) {
      toast({
        title: "MetaMask Not Found",
        description: "Please ensure MetaMask is installed to switch networks",
        variant: "destructive"
      });
      return false;
    }

    await metamaskProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: networkConfig.chainId }],
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        // Get MetaMask provider again to ensure we're using the right one
        // @ts-ignore - ethereum.providers is available in modern browsers
        const providers = window.ethereum.providers || [window.ethereum];
        const metamaskProvider = providers.find((p: any) => p.isMetaMask && !p.isPhantom);
        
        if (!metamaskProvider) {
          return false;
        }

        await metamaskProvider.request({
          method: 'wallet_addEthereumChain',
          params: [networkConfig],
        });
        return true;
      } catch (addError) {
        console.error('Error adding network:', addError);
        return false;
      }
    }
    console.error('Error switching network:', switchError);
    return false;
  }
};

// Helper function to detect if MetaMask is available
const isMetaMaskAvailable = () => {
  return window.ethereum?.isMetaMask === true;
};

// Helper function to detect if Phantom's Ethereum provider is active
const isPhantomEthereumProvider = () => {
  return window.ethereum?.isPhantom === true;
};

export const connectMetaMask = async (targetNetwork?: 'ETHEREUM' | 'BSC' | 'SCROLL'): Promise<WalletConnection | null> => {
  try {
    // First check if MetaMask is installed
    if (!isMetaMaskAvailable()) {
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to continue",
        variant: "destructive"
      });
      return null;
    }

    // If Phantom's Ethereum provider is active, disconnect it first
    if (isPhantomEthereumProvider()) {
      try {
        // Disconnect Phantom's Solana connection if connected
        if (window.solana?.isConnected) {
          await window.solana.disconnect();
        }
        
        // Clear Phantom's Ethereum connection
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        
        // Add a small delay to ensure disconnection is complete
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log('Error disconnecting Phantom:', error);
      }
    }

    // Force MetaMask connection by directly requesting its provider
    try {
      // @ts-ignore - ethereum.providers is available in modern browsers
      const providers = window.ethereum.providers || [window.ethereum];
      const metamaskProvider = providers.find((p: any) => p.isMetaMask && !p.isPhantom);
      
      if (!metamaskProvider) {
        toast({
          title: "MetaMask Not Found",
          description: "Please ensure MetaMask is installed and try again",
          variant: "destructive"
        });
        return null;
      }

      // Use MetaMask's provider for the connection
      const accounts = await metamaskProvider.request({
        method: 'eth_requestAccounts'
      });

      if (targetNetwork) {
        const networkConfig = NETWORKS[targetNetwork];
        // Use metamaskProvider for network switching
        const switched = await switchNetworkWithProvider(metamaskProvider, networkConfig);
        if (!switched) {
          toast({
            title: "Network Switch Failed",
            description: `Failed to switch to ${networkConfig.chainName}`,
            variant: "destructive"
          });
          return null;
        }
      }

      const chainId = await metamaskProvider.request({
        method: 'eth_chainId'
      });

      if (accounts[0]) {
        // Set the provider globally for other functions to use
        window.ethereum = metamaskProvider;
        
        return {
          address: accounts[0],
          chainId: parseInt(chainId, 16)
        };
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to MetaMask. Please try again.",
        variant: "destructive"
      });
    }

    return null;
  } catch (error: any) {
    console.error('Error in connectMetaMask:', error);
    toast({
      title: "Connection Failed",
      description: error.message,
      variant: "destructive"
    });
    return null;
  }
};

// Helper function to switch networks using a specific provider
const switchNetworkWithProvider = async (provider: any, networkConfig: typeof NETWORKS.ETHEREUM) => {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: networkConfig.chainId }],
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [networkConfig],
        });
        return true;
      } catch (addError) {
        console.error('Error adding network:', addError);
        return false;
      }
    }
    console.error('Error switching network:', switchError);
    return false;
  }
};

export const connectPhantom = async (): Promise<WalletConnection | null> => {
  try {
    if (!window.solana?.isPhantom) {
      toast({
        title: "Phantom not found",
        description: "Please install Phantom wallet extension",
        variant: "destructive"
      });
      return null;
    }

    // Disconnect from both Ethereum and Solana if connected
    if (window.solana.isConnected) {
      await window.solana.disconnect();
    }
    
    // If Phantom is also connected to Ethereum, disconnect it
    if (window.ethereum?.isPhantom) {
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{
            eth_accounts: {}
          }]
        });
      } catch (error) {
        console.log('Error clearing Phantom Ethereum connection:', error);
      }
    }

    // Force a fresh Solana connection
    const resp = await window.solana.connect({ 
      onlyIfTrusted: false // This forces the connection dialog
    });
    
    return {
      address: resp.publicKey.toString(),
      chainId: 1 // Solana mainnet
    };
  } catch (error: any) {
    console.error('Error connecting to Phantom:', error);
    toast({
      title: "Connection Failed",
      description: error.message,
      variant: "destructive"
    });
    return null;
  }
};

export const sendEthTransaction = async (request: TransactionRequest): Promise<string | null> => {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed");
    }

    // Initialize Web3
    const web3 = new Web3(window.ethereum);
    let transactionParameters;

    if (request.tokenAddress) {
      // ERC20 token transfer
      const tokenContract = new web3.eth.Contract([
        {
          constant: true,
          inputs: [{ name: "_owner", type: "address" }],
          name: "balanceOf",
          outputs: [{ name: "balance", type: "uint256" }],
          type: "function"
        },
        {
          constant: false,
          inputs: [
            { name: "_to", type: "address" },
            { name: "_value", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ name: "success", type: "bool" }],
          type: "function"
        },
        {
          constant: true,
          inputs: [],
          name: "decimals",
          outputs: [{ name: "", type: "uint8" }],
          type: "function"
        }
      ], request.tokenAddress);

      // Get token decimals
      const decimals = parseInt(await tokenContract.methods.decimals().call());
      // Convert amount to token's smallest unit based on decimals
      const amount = parseFloat(request.amount) * Math.pow(10, decimals);

      const data = tokenContract.methods.transfer(
        ELECTRON_ETH_ADDRESS,
        amount.toString()
      ).encodeABI();

      transactionParameters = {
        to: request.tokenAddress,
        from: request.fromAddress,
        data: data,
      };
    } else {
      // Native ETH transfer
      transactionParameters = {
        to: ELECTRON_ETH_ADDRESS,
        from: request.fromAddress,
        value: web3.utils.toHex(web3.utils.toWei(request.amount, 'ether')),
      };
    }

    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    });

    return txHash;
  } catch (error: any) {
    console.error('Error sending ETH transaction:', error);
    toast({
      title: "Transaction Failed",
      description: error.message,
      variant: "destructive"
    });
    return null;
  }
};

export const sendSolTransaction = async (request: TransactionRequest): Promise<string | null> => {
  try {
    if (!window.solana?.isPhantom) {
      throw new Error("Phantom wallet not installed");
    }

    const connection = new window.solana.Connection("https://api.mainnet-beta.solana.com");
    
    // Convert amount to lamports (SOL's smallest unit)
    const lamports = Math.round(parseFloat(request.amount) * window.solana.LAMPORTS_PER_SOL);
    
    // Create transaction
    const transaction = new window.solana.Transaction().add(
      window.solana.SystemProgram.transfer({
        fromPubkey: new window.solana.PublicKey(request.fromAddress),
        toPubkey: new window.solana.PublicKey(ELECTRON_SOL_ADDRESS),
        lamports: lamports
      })
    );

    // Get latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new window.solana.PublicKey(request.fromAddress);

    // Sign and send transaction
    const signed = await window.solana.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    
    return signature;
  } catch (error: any) {
    console.error('Error sending SOL transaction:', error);
    toast({
      title: "Transaction Failed",
      description: error.message,
      variant: "destructive"
    });
    return null;
  }
};

export const subscribeToWalletEvents = (
  onAccountsChanged: (accounts: string[]) => void,
  onChainChanged: (chainId: string) => void,
  onDisconnect: () => void
) => {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', onAccountsChanged);
    window.ethereum.on('chainChanged', onChainChanged);
    window.ethereum.on('disconnect', onDisconnect);
  }

  return () => {
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged);
      window.ethereum.removeListener('chainChanged', onChainChanged);
      window.ethereum.removeListener('disconnect', onDisconnect);
    }
  };
}; 