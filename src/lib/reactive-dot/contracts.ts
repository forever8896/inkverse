// FIXME: "contracts" export not found in @polkadot-api/descriptors
// The descriptors only export "pop" and "passethub" chains, not contract descriptors
// import { contracts } from "@polkadot-api/descriptors"
import { defineContract } from "@reactive-dot/core"

// NOTE: Currently unused - needs proper contract descriptor when available
export const flipperContract = defineContract({
  descriptor: null as any, // contracts.flipper when available
})
