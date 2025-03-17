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

const ELECTRON_ETH_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"; // Replace with actual address
const ELECTRON_SOL_ADDRESS = "BUX7s2ef2htTGb2KKoPHWkmzxPj4nTWMWRgs5CSbQxf9"; // Replace with actual address

export const connectMetaMask = async (): Promise<WalletConnection | null> => {
  try {
    if (!window.ethereum) {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask extension",
        variant: "destructive"
      });
      return null;
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    const chainId = await window.ethereum.request({
      method: 'eth_chainId'
    });

    if (accounts[0]) {
      return {
        address: accounts[0],
        chainId: parseInt(chainId, 16)
      };
    }

    return null;
  } catch (error: any) {
    console.error('Error connecting to MetaMask:', error);
    toast({
      title: "Connection Failed",
      description: error.message,
      variant: "destructive"
    });
    return null;
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

    const resp = await window.solana.connect();
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