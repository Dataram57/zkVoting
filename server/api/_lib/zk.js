import * as snarkjs from "snarkjs";
import vote_verifier from "../vote_verifier.json" assert { type: "json" };

export const verifyProof = async (publicSignals, proof) => {
    return snarkjs.groth16.verify(vote_verifier, publicSignals, proof);
};

export const p =
    21888242871839275222246405745257275088548364400416034343698204186575808495617n;