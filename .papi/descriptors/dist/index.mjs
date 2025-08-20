// .papi/descriptors/src/common.ts
var table = new Uint8Array(128);
for (let i = 0; i < 64; i++) table[i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i * 4 - 205] = i;
var toBinary = (base64) => {
  const n = base64.length, bytes = new Uint8Array((n - Number(base64[n - 1] === "=") - Number(base64[n - 2] === "=")) * 3 / 4 | 0);
  for (let i2 = 0, j = 0; i2 < n; ) {
    const c0 = table[base64.charCodeAt(i2++)], c1 = table[base64.charCodeAt(i2++)];
    const c2 = table[base64.charCodeAt(i2++)], c3 = table[base64.charCodeAt(i2++)];
    bytes[j++] = c0 << 2 | c1 >> 4;
    bytes[j++] = c1 << 4 | c2 >> 2;
    bytes[j++] = c2 << 6 | c3;
  }
  return bytes;
};

// .papi/descriptors/src/pop.ts
var descriptorValues = import("./descriptors-EQNLS6QA.mjs").then((module) => module["Pop"]);
var metadataTypes = import("./metadataTypes-4HBPHGZL.mjs").then(
  (module) => toBinary("default" in module ? module.default : module)
);
var asset = {};
var getMetadata = () => import("./pop_metadata-W4WUVORE.mjs").then(
  (module) => toBinary("default" in module ? module.default : module)
);
var genesis = "0xe8b2d197b82a0da1fffca832c050894ebe343b289c61ef439aa694bdcef78aa1";
var _allDescriptors = { descriptors: descriptorValues, metadataTypes, asset, getMetadata, genesis };
var pop_default = _allDescriptors;

// .papi/descriptors/src/passethub.ts
var descriptorValues2 = import("./descriptors-EQNLS6QA.mjs").then((module) => module["Passethub"]);
var metadataTypes2 = import("./metadataTypes-4HBPHGZL.mjs").then(
  (module) => toBinary("default" in module ? module.default : module)
);
var asset2 = {};
var getMetadata2 = () => import("./passethub_metadata-ZEGS5F42.mjs").then(
  (module) => toBinary("default" in module ? module.default : module)
);
var genesis2 = "0xfd974cf9eaf028f5e44b9fdd1949ab039c6cf9cc54449b0b60d71b042e79aeb6";
var _allDescriptors2 = { descriptors: descriptorValues2, metadataTypes: metadataTypes2, asset: asset2, getMetadata: getMetadata2, genesis: genesis2 };
var passethub_default = _allDescriptors2;

// .papi/descriptors/src/common-types.ts
import { _Enum } from "polkadot-api";
var DigestItem = _Enum;
var Phase = _Enum;
var DispatchClass = _Enum;
var TokenError = _Enum;
var ArithmeticError = _Enum;
var TransactionalError = _Enum;
var BalanceStatus = _Enum;
var TransactionPaymentEvent = _Enum;
var PreimageEvent = _Enum;
var XcmV5Junctions = _Enum;
var XcmV5Junction = _Enum;
var XcmV5NetworkId = _Enum;
var XcmV3JunctionBodyId = _Enum;
var XcmV2JunctionBodyPart = _Enum;
var XcmV3MultiassetFungibility = _Enum;
var XcmV3MultiassetAssetInstance = _Enum;
var XcmV3MaybeErrorCode = _Enum;
var XcmV2OriginKind = _Enum;
var XcmV5AssetFilter = _Enum;
var XcmV5WildAsset = _Enum;
var XcmV2MultiassetWildFungibility = _Enum;
var XcmV3WeightLimit = _Enum;
var XcmVersionedAssets = _Enum;
var XcmV3MultiassetAssetId = _Enum;
var XcmV3Junctions = _Enum;
var XcmV3Junction = _Enum;
var XcmV3JunctionNetworkId = _Enum;
var XcmVersionedLocation = _Enum;
var UpgradeGoAhead = _Enum;
var UpgradeRestriction = _Enum;
var BalancesTypesReasons = _Enum;
var PreimagePalletHoldReason = _Enum;
var TransactionPaymentReleases = _Enum;
var MultiAddress = _Enum;
var BalancesAdjustmentDirection = _Enum;
var XcmV3Instruction = _Enum;
var XcmV3Response = _Enum;
var XcmV3TraitsError = _Enum;
var XcmV3MultiassetMultiAssetFilter = _Enum;
var XcmV3MultiassetWildMultiAsset = _Enum;
var XcmV4Instruction = _Enum;
var XcmV4Response = _Enum;
var XcmV4AssetAssetFilter = _Enum;
var XcmV4AssetWildAsset = _Enum;
var XcmVersionedAssetId = _Enum;
var DispatchRawOrigin = _Enum;
var MultiSignature = _Enum;
var PreimagesBounded = _Enum;
var PreimageOldRequestStatus = _Enum;
var PreimageRequestStatus = _Enum;
var XcmPalletVersionMigrationStage = _Enum;
var TransactionValidityUnknownTransaction = _Enum;
var TransactionValidityTransactionSource = _Enum;
var MmrPrimitivesError = _Enum;
var XcmVersionedAsset = _Enum;
var TraitsScheduleDispatchTime = _Enum;
export {
  ArithmeticError,
  BalanceStatus,
  BalancesAdjustmentDirection,
  BalancesTypesReasons,
  DigestItem,
  DispatchClass,
  DispatchRawOrigin,
  MmrPrimitivesError,
  MultiAddress,
  MultiSignature,
  Phase,
  PreimageEvent,
  PreimageOldRequestStatus,
  PreimagePalletHoldReason,
  PreimageRequestStatus,
  PreimagesBounded,
  TokenError,
  TraitsScheduleDispatchTime,
  TransactionPaymentEvent,
  TransactionPaymentReleases,
  TransactionValidityTransactionSource,
  TransactionValidityUnknownTransaction,
  TransactionalError,
  UpgradeGoAhead,
  UpgradeRestriction,
  XcmPalletVersionMigrationStage,
  XcmV2JunctionBodyPart,
  XcmV2MultiassetWildFungibility,
  XcmV2OriginKind,
  XcmV3Instruction,
  XcmV3Junction,
  XcmV3JunctionBodyId,
  XcmV3JunctionNetworkId,
  XcmV3Junctions,
  XcmV3MaybeErrorCode,
  XcmV3MultiassetAssetId,
  XcmV3MultiassetAssetInstance,
  XcmV3MultiassetFungibility,
  XcmV3MultiassetMultiAssetFilter,
  XcmV3MultiassetWildMultiAsset,
  XcmV3Response,
  XcmV3TraitsError,
  XcmV3WeightLimit,
  XcmV4AssetAssetFilter,
  XcmV4AssetWildAsset,
  XcmV4Instruction,
  XcmV4Response,
  XcmV5AssetFilter,
  XcmV5Junction,
  XcmV5Junctions,
  XcmV5NetworkId,
  XcmV5WildAsset,
  XcmVersionedAsset,
  XcmVersionedAssetId,
  XcmVersionedAssets,
  XcmVersionedLocation,
  passethub_default as passethub,
  pop_default as pop
};
