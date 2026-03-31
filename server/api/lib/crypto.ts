import crypto from "crypto";
import { p, SALT_POLL } from "../config.crypto.js"
//poseidon
import { poseidon2 } from "poseidon-lite";
//zk
import * as snarkjs from "snarkjs";
import vote_verifier from "../circuits/vote.json" with { type: "json" };

const ClassicHash = (data) : string => crypto.createHash("sha256").update(data).digest("hex");

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

export const GetPollId = (pollData) => {
    return ClassicHash(JSON.stringify(pollData))
};

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