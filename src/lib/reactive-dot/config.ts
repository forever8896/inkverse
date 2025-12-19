import { passethub } from "@polkadot-api/descriptors"
import { defineConfig } from "@reactive-dot/core"
import { InjectedWalletProvider } from "@reactive-dot/core/wallets.js"
import { getWsProvider } from "polkadot-api/ws-provider/web"

export const config = defineConfig({
  chains: {
    passethub: {
      descriptor: passethub,
      provider: getWsProvider("wss://passet-hub-paseo.ibp.network"),
    },
  },
  ssr: true,
  wallets: [new InjectedWalletProvider()],
})
