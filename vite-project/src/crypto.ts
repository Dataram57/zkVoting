
import { poseidon1, poseidon2 } from "poseidon-lite";

export function GeneratePublicKey(secret: bigint): bigint{
    return poseidon1([secret]);
}

export function GenerateMemeberLeaf(public_key: bigint, mask: bigint = 0n): bigint{
    return poseidon2([public_key, mask]);
}

export function MerkleHash(leaf_left : bigint = 0n, leaf_right : bigint = 0n){
    return poseidon2([leaf_left, leaf_right]);
}


export function ComputeMerkleRoot(members: string[], merkleTreeHeight : bigint): bigint {

    const leafCount = 1n << merkleTreeHeight;
    const leaves: bigint[] = new Array(leafCount).fill(0n);

    for (let i = 0; i < members.length && i < leafCount; i++)
        leaves[i] = BigInt(members[i]);

    let level = leaves;

    while (level.length > 1) {

        const next: bigint[] = [];

        for (let i = 0; i < level.length; i += 2) {
            next.push(MerkleHash(level[i], level[i + 1]));
        }

        level = next;
    }

    return level[0];
}

export async function jsonToID<T>(obj: T): Promise<string> {
    const data = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(data);

    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}