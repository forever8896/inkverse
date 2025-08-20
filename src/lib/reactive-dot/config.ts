import { passethub, pop } from "@polkadot-api/descriptors"
import { defineConfig } from "@reactive-dot/core"
import { InjectedWalletProvider } from "@reactive-dot/core/wallets.js"
import { getWsProvider } from "polkadot-api/ws-provider/web"

export const config = defineConfig({
  chains: {
    pop: {
      descriptor: pop,
      provider: getWsProvider("wss://rpc1.paseo.popnetwork.xyz"),
    },
    passethub: {
      descriptor: passethub,
      provider: getWsProvider("wss://testnet-passet-hub.polkadot.io"),
    },
  },
  ssr: false, // Set to false to avoid SSR issues with wallet detection
  wallets: [
    new InjectedWalletProvider({
      // Wait longer for wallet extensions to load
    })
  ],
})
