# Setup

## zkSNARK limitations

All operations computed by the zkSNARK are done within the prime `p` group.

```typescript
const p : bigint = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
```

## Pre-defined Constants

ZkVoting uses pre-defined custom salts to separate hashing domains.

```typescript
const SALT_IDENTITY : bigint = 2930996857342901638159601487792286970470209671487906641678817720245646941774n;
const SALT_POLL : bigint = 7512478420072554091054407658194692655047781415488857595863341920757143076957n;
const SALT_LEAF : bigint = 15508546515753695292987831276891861764197150468030429292841948281315619319598n;
const SALT_NULLIFIER_BASE : bigint = 17655328339939302180868851446331250730986858468645658769908281704971883778123n;
const SALT_NULLIFIER : bigint = 158508368761311659699926858248834935040342510550644700966438814198616225925n;
```

All of the these constants were the result of running hashing function on unique per role constant names:

```typescript
import { poseidon1 } from "poseidon-lite";

async function GenerateSalt(data : string) : Promise<string>{
    const bytes = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
    const preHash = BigInt("0x" + Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join(""));
    const salt = poseidon1([preHash % p]);
    return salt.toString();
}

export const SALT_IDENTITY : string = await GenerateSalt("zkVoting_IDENTITY");
export const SALT_POLL : string = await GenerateSalt("zkVoting_POLL");
export const SALT_LEAF : string = await GenerateSalt("zkVoting_LEAF");
export const SALT_NULLIFIER_BASE : string = await GenerateSalt("zkVoting_NULLIFIER_BASE");
export const SALT_NULLIFIER : string = await GenerateSalt("zkVoting_NULLIFIER");
```

# System

This document explains cryptography behind this tool...

## Public Key genration

```typescript
export function GeneratePublicKey(secret: bigint): bigint{
    return poseidon2([SALT_IDENTITY, secret]);
}
```

## Poll generation

### Merkle Leafs

TODO...

### Serialization of poll

TODO...

### Detereministic Poll ID

TODO...

## Casting Votes

TODO...
