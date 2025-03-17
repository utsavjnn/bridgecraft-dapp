import { toast } from "@/hooks/use-toast"

declare global {
  interface Window {
    ethereum?: any;
  }
}

export async function connectMetaMask() {
  if (typeof window === 'undefined') return null;

  // Check if MetaMask is installed
  if (!window.ethereum || !window.ethereum.isMetaMask) {
    toast({
      title: "MetaMask not found",
      description: "Please install MetaMask browser extension to continue.",
      variant: "destructive"
    });
    // Open MetaMask installation page
    window.open('https://metamask.io/download/', '_blank');
    return null;
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });

    // Get the connected chain ID
    const chainId = await window.ethereum.request({ 
      method: 'eth_chainId' 
    });

    if (!accounts[0]) {
      throw new Error('No accounts found');
    }

    return {
      address: accounts[0],
      chainId: parseInt(chainId, 16),
    };
  } catch (error: any) {
    console.error('Error connecting to MetaMask:', error);
    toast({
      title: "Connection Failed",
      description: error.message || "Failed to connect to MetaMask",
      variant: "destructive"
    });
    return null;
  }
}

export function subscribeToWalletEvents(
  onAccountsChanged: (accounts: string[]) => void,
  onChainChanged: (chainId: string) => void,
  onDisconnect: () => void
) {
  if (typeof window === 'undefined' || !window.ethereum) return;

  window.ethereum.on('accountsChanged', onAccountsChanged);
  window.ethereum.on('chainChanged', onChainChanged);
  window.ethereum.on('disconnect', onDisconnect);

  // Return cleanup function
  return () => {
    window.ethereum.removeListener('accountsChanged', onAccountsChanged);
    window.ethereum.removeListener('chainChanged', onChainChanged);
    window.ethereum.removeListener('disconnect', onDisconnect);
  };
} 