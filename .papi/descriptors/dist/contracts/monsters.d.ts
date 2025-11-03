import type { FixedSizeBinary, Binary, ResultPayload, Enum, FixedSizeArray } from 'polkadot-api';
import type { InkDescriptors } from 'polkadot-api/ink';
type AnonymousEnum<T extends {}> = T & {
    __anonymous: true;
};
type MyTuple<T> = [T, ...T[]];
type SeparateUndefined<T> = undefined extends T ? undefined | Exclude<T, undefined> : T;
type Anonymize<T> = SeparateUndefined<T extends FixedSizeBinary<infer L> ? number extends L ? Binary : FixedSizeBinary<L> : T extends string | number | bigint | boolean | void | undefined | null | symbol | Uint8Array | Enum<any> ? T : T extends AnonymousEnum<infer V> ? Enum<V> : T extends MyTuple<any> ? {
    [K in keyof T]: T[K];
} : T extends [] ? [] : T extends FixedSizeArray<infer L, infer T> ? number extends L ? Array<T> : FixedSizeArray<L, T> : {
    [K in keyof T & string]: T[K];
}>;
type T3 = Enum<{
    "U8": number;
    "U16": number;
    "U32": number;
    "U64": bigint;
    "U128": bigint;
    "Bytes": Binary;
}>;
type T5 = (Anonymize<T3>) | undefined;
type T0 = Enum<{
    "CouldNotReadInput": undefined;
}>;
type T1 = ResultPayload<ResultPayload<undefined, Enum<{
    "Custom": string;
    "SelfApprove": undefined;
    "NotApproved": undefined;
    "TokenExists": undefined;
    "TokenNotExists": undefined;
    "SafeTransferCheckFailed": string;
}>>, Anonymize<T0>>;
type T2 = ResultPayload<bigint, Anonymize<T0>>;
type T4 = ResultPayload<boolean, Anonymize<T0>>;
type StorageDescriptor = {
    "data.token_owner": {
        "key": Anonymize<T3>;
        "value": FixedSizeBinary<20>;
    };
    "data.operator_approvals": {
        "key": [FixedSizeBinary<20>, FixedSizeBinary<20>, Anonymize<T5>];
        "value": undefined;
    };
    "data.balance.owned_tokens_count": {
        "key": FixedSizeBinary<20>;
        "value": number;
    };
    "metadata.attributes": {
        "key": [Anonymize<T3>, Binary];
        "value": Binary;
    };
    "attribute_delegates": {
        "key": [Anonymize<T3>, FixedSizeBinary<20>];
        "value": boolean;
    };
    "": {
        "key": undefined;
        "value": {
            "data": {
                "balance": {
                    "total_supply": bigint;
                };
            };
            "base_uri": string;
            "next_id": bigint;
        };
    };
};
type MessagesDescriptor = {
    "public_mint": {
        "message": {};
        "response": Anonymize<T1>;
        "mutates": true;
    };
    "get_next_id": {
        "message": {};
        "response": Anonymize<T2>;
    };
    "get_base_uri": {
        "message": {};
        "response": ResultPayload<string, Anonymize<T0>>;
    };
    "approve_item_attributes": {
        "message": {
            "token_id": Anonymize<T3>;
            "delegate": FixedSizeBinary<20>;
        };
        "response": Anonymize<T1>;
        "mutates": true;
    };
    "revoke_item_attributes": {
        "message": {
            "token_id": Anonymize<T3>;
            "delegate": FixedSizeBinary<20>;
        };
        "response": Anonymize<T1>;
        "mutates": true;
    };
    "is_approved_for_attributes": {
        "message": {
            "token_id": Anonymize<T3>;
            "delegate": FixedSizeBinary<20>;
        };
        "response": Anonymize<T4>;
    };
    "set_attribute": {
        "message": {
            "token_id": Anonymize<T3>;
            "key": Binary;
            "value": Binary;
        };
        "response": Anonymize<T1>;
        "mutates": true;
    };
    "PSP34::collection_id": {
        "message": {};
        "response": ResultPayload<Anonymize<T3>, Anonymize<T0>>;
    };
    "PSP34::total_supply": {
        "message": {};
        "response": Anonymize<T2>;
    };
    "PSP34::balance_of": {
        "message": {
            "owner": FixedSizeBinary<20>;
        };
        "response": ResultPayload<number, Anonymize<T0>>;
    };
    "PSP34::allowance": {
        "message": {
            "owner": FixedSizeBinary<20>;
            "operator": FixedSizeBinary<20>;
            "id"?: Anonymize<T5>;
        };
        "response": Anonymize<T4>;
    };
    "PSP34::transfer": {
        "message": {
            "to": FixedSizeBinary<20>;
            "id": Anonymize<T3>;
            "data": Binary;
        };
        "response": Anonymize<T1>;
        "mutates": true;
    };
    "PSP34::approve": {
        "message": {
            "operator": FixedSizeBinary<20>;
            "id"?: Anonymize<T5>;
            "approved": boolean;
        };
        "response": Anonymize<T1>;
        "mutates": true;
    };
    "PSP34::owner_of": {
        "message": {
            "id": Anonymize<T3>;
        };
        "response": ResultPayload<(FixedSizeBinary<20>) | undefined, Anonymize<T0>>;
    };
    "PSP34Mintable::mint": {
        "message": {
            "id": Anonymize<T3>;
        };
        "response": Anonymize<T1>;
        "mutates": true;
    };
    "PSP34Burnable::burn": {
        "message": {
            "account": FixedSizeBinary<20>;
            "id": Anonymize<T3>;
        };
        "response": Anonymize<T1>;
        "mutates": true;
    };
    "PSP34Metadata::get_attribute": {
        "message": {
            "id": Anonymize<T3>;
            "key": Binary;
        };
        "response": ResultPayload<(Binary) | undefined, Anonymize<T0>>;
    };
};
type ConstructorsDescriptor = {
    "new": {
        "message": {};
        "response": ResultPayload<undefined, Anonymize<T0>>;
    };
};
type EventDescriptor = Enum<{
    "Approval": {
        "owner": FixedSizeBinary<20>;
        "operator": FixedSizeBinary<20>;
        "id"?: Anonymize<T5>;
        "approved": boolean;
    };
    "Transfer": {
        "from"?: (FixedSizeBinary<20>) | undefined;
        "to"?: (FixedSizeBinary<20>) | undefined;
        "id": Anonymize<T3>;
    };
    "AttributeSet": {
        "id": Anonymize<T3>;
        "key": Binary;
        "data": Binary;
    };
    "ItemAttributesApprovalAdded": {
        "token_id": Anonymize<T3>;
        "owner": FixedSizeBinary<20>;
        "delegate": FixedSizeBinary<20>;
    };
    "ItemAttributesApprovalRemoved": {
        "token_id": Anonymize<T3>;
        "owner": FixedSizeBinary<20>;
        "delegate": FixedSizeBinary<20>;
    };
}>;
export declare const descriptor: InkDescriptors<StorageDescriptor, MessagesDescriptor, ConstructorsDescriptor, EventDescriptor>;
export {};
