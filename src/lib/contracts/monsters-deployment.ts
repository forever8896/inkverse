import monstersMetadata from './monsters.json'

export const monstersContract = {
  metadata: monstersMetadata,
  // H160 EVM-style addresses for Revive/PolkaVM chains (Pop Network)
  evmAddresses: {
    pop: "0xf421934060ffc65e778315200a07023cce719581", // Pop Network Testnet
  },
  // SS58 addresses for traditional Contracts pallet chains
  ss58Addresses: {
    pop: "5GALB9ZyMoEHis6WbVL5hQDzzoP6MpCM6qh27UMgzVDt2G6H",
    passethub: "5GALB9ZyMoEHis6WbVL5hQDzzoP6MpCM6qh27UMgzVDt2G6H", // Same for now
    shibuya: "5HF6qhAMhoqCdBZDsf1iL6eLeDhnRMxx56xbJQV7Udizw6gh", // Latest deployment with correct IPFS hash
  }
}

export const monstersDeployments = {
  // Add new deployments here as they become available
  shibuya: '5HF6qhAMhoqCdBZDsf1iL6eLeDhnRMxx56xbJQV7Udizw6gh', // Latest deployment with correct IPFS hash
} as const 