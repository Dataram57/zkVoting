
import { poseidon1, poseidon2 } from "poseidon-lite";

export async function jsonToID<T>(obj: T): Promise<string> {
    const data = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(data);

    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

export function GeneratePublicKey(secret: bigint): bigint{
    return poseidon1([secret]);
}

export function GenerateMemeberLeaf(public_key: bigint, mask: bigint = 0n): bigint{
    return poseidon2([public_key, mask]);
}

export function MerkleHash(leaf_left : bigint = 0n, leaf_right : bigint = 0n){
    return poseidon2([leaf_left, leaf_right]);
}


export function ComputeMerkleRoot(
    members: string[],
    merkleTreeHeight: bigint
): bigint {
    const height = Number(merkleTreeHeight);
    const leafCount = 1 << height; // 2^height

    // Convert members to bigint leaves
    let leaves: bigint[] = members.map(m => BigInt(m));

    // Pad with 0n if necessary
    while (leaves.length < leafCount) {
        leaves.push(0n);
    }

    // If too many leaves, truncate (optional safeguard)
    leaves = leaves.slice(0, leafCount);

    // Build the tree bottom-up
    let currentLevel = leaves;

    for (let level = 0; level < height; level++) {
        const nextLevel: bigint[] = [];

        for (let i = 0; i < currentLevel.length; i += 2) {
            const left = currentLevel[i];
            const right = currentLevel[i + 1];
            nextLevel.push(MerkleHash(left, right));
        }

        currentLevel = nextLevel;
    }

    // Root is the only remaining node
    return currentLevel[0];
}

export function ComputeMerkleProof(
    members: string[],
    merkleTreeHeight: bigint,
    index: number
): bigint[] {

    const leafCount = Number(1n << merkleTreeHeight);
    const leaves: bigint[] = new Array(leafCount).fill(0n);

    // fill leaves
    for (let i = 0; i < members.length && i < leafCount; i++) {
        leaves[i] = BigInt(members[i]);
    }

    let level = leaves;
    let idx = index;

    const proof: bigint[] = [];

    while (level.length > 1) {
        const next: bigint[] = [];

        for (let i = 0; i < level.length; i += 2) {
            const left = level[i];
            const right = level[i + 1];

            // if current pair contains our index
            if (i === idx || i + 1 === idx) {
            const sibling = (idx === i) ? right : left;
            proof.push(sibling);
            idx = Math.floor(i / 2); // move index to next level
            }

            next.push(MerkleHash(left, right));
        }

        level = next;
    }

    return proof;
}

export function RecomputeMerkleRootFromProof(
    leaf: bigint,
    index: number,
    proof: bigint[]
): bigint {
    let hash = leaf;
    let idx = index;

    for (const sibling of proof) {
        if ((idx & 1) === 0) {
            // current node is left, sibling is right
            hash = MerkleHash(hash, sibling);
        } else {
            // current node is right, sibling is left
            hash = MerkleHash(sibling, hash);
        }
        idx = idx >> 1;
    }

    return hash;
}