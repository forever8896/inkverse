import { pop } from "@polkadot-api/descriptors"
import { defineConfig } from "@reactive-dot/core"
import { InjectedWalletProvider } from "@reactive-dot/core/wallets.js"
import { getWsProvider } from "polkadot-api/ws-provider/web"

export const config = defineConfig({
  chains: {
    pop: {
      descriptor: pop,
      provider: getWsProvider("wss://rpc1.paseo.popnetwork.xyz"),
    },
  },
  ssr: true,
  wallets: [new InjectedWalletProvider()],
})
