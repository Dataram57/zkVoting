
import { poseidon1, poseidon2, poseidon3 } from "poseidon-lite";
import * as snarkjs from "snarkjs";
import { p } from "./config";
import vote_verifier from "./circuits/vote.json";

async function GenerateSalt(data : string) : Promise<string>{
    const bytes = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
    const preHash = BigInt("0x" + Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join(""));
    const salt = poseidon1([preHash % p]);
    return salt.toString();
}


//salts
export const SALT_IDENTITY : string = await GenerateSalt("zkVoting_IDENTITY");
export const SALT_POLL : string = await GenerateSalt("zkVoting_POLL");
export const SALT_LEAF : string = await GenerateSalt("zkVoting_LEAF");
export const SALT_NULLIFIER_BASE : string = await GenerateSalt("zkVoting_NULLIFIER_BASE");  //not used here
export const SALT_NULLIFIER : string = await GenerateSalt("zkVoting_NULLIFIER");       //not used here

//check pre-defined salts
console.log({
    SALT_IDENTITY, SALT_POLL, SALT_LEAF, SALT_NULLIFIER_BASE, SALT_NULLIFIER
});
console.log("check SALT_IDENTITY", SALT_IDENTITY == "2930996857342901638159601487792286970470209671487906641678817720245646941774");
console.log("check SALT_POLL", SALT_POLL == "7512478420072554091054407658194692655047781415488857595863341920757143076957");
console.log("check SALT_LEAF", SALT_LEAF == "15508546515753695292987831276891861764197150468030429292841948281315619319598");
console.log("check SALT_NULLIFIER_BASE", SALT_NULLIFIER_BASE == "17655328339939302180868851446331250730986858468645658769908281704971883778123");
console.log("check SALT_NULLIFIER", SALT_NULLIFIER == "158508368761311659699926858248834935040342510550644700966438814198616225925");


export async function jsonToID<T>(obj: T): Promise<string> {
    const data = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(data);

    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

export async function voteValueToVoteHash(data : string) : Promise<bigint> {
    const bytes = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
    const hash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
    return BigInt("0x" + hash) % p;
}

export function GeneratePublicKey(secret: bigint): bigint{
    return poseidon2([SALT_IDENTITY, secret]);
}

export function GenerateMemeberLeaf(public_key: bigint, invitation: bigint = 0n): bigint{
    return poseidon3([SALT_LEAF, public_key, invitation]);
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

export function GetPollHash(pollId : string) : string{
    // Ensure pollId is hex-safe
    const pollHex = pollId.startsWith("0x") ? pollId : "0x" + pollId;
    //get hash
    return poseidon2([SALT_POLL, BigInt(pollHex) % p]).toString();
}

export interface VoteSubmission {
    pollId: string;
    pollMerkleRoot: string;
    nullifier: string;
    voteValue: string;
    proof: any;
}

export async function GenerateVote(
    privateKey: bigint,
    publicKey_index: number,
    invitation: bigint,
    pollId: string,
    vote: string,
    merklePath: bigint[]
) : Promise<VoteSubmission> {
    const proofInput = {
        // snarkjs expects strings, not bigint
        privateKey: privateKey.toString(),
        publicKey_index: publicKey_index.toString(),
        invitation: invitation.toString(),
        pollHash: GetPollHash(pollId),
        vote: (await voteValueToVoteHash(vote)).toString(),
        merkle_leafs: merklePath.map(x => x.toString())
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        proofInput,
        "/circuits/vote.wasm",
        "/circuits/vote.zkey"
    );

    return {
        pollId: pollId,
        pollMerkleRoot: publicSignals[1] as string, 
        nullifier: publicSignals[2] as string,
        voteValue: vote,
        proof: proof
    };
}

export async function VerifyVote(
    vote : VoteSubmission,
    pollId : string,
    pollMerkleRoot : string
) : Promise<boolean> {

    //check if fields match
    if(vote.pollId != pollId)
        return false;
    if(vote.pollMerkleRoot != pollMerkleRoot)
        return false;

    //reconstruct public signals
    const publicSignals = [
        GetPollHash(vote.pollId),
        vote.pollMerkleRoot,
        vote.nullifier,
        (await voteValueToVoteHash(vote.voteValue)).toString()
    ];
    
    //check zk proof
    return await snarkjs.groth16.verify(
        vote_verifier,
        publicSignals,
        vote.proof
    ) as boolean;
}