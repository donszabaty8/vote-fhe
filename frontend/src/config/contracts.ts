// Import deployed contract information
import deployment from '../../../deployments/sepolia/EncryptedPolls.json';

export const CONTRACT_ADDRESS = deployment.address;
export const CONTRACT_ABI = deployment.abi;

// Sepolia network configuration
export const SEPOLIA_CHAIN_ID = 11155111;
export const RELAYER_URL = 'https://relayer.testnet.zama.org';

// Note: ACL contract no longer needed for public decryption
// Public decryption uses self-relaying pattern instead
