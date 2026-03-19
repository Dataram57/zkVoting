import * as snarkjs from "snarkjs";

//================================================================
//import vote_verifier from "../../vote_verifier.json" assert { type: "json" };
import fs from "fs";
import path from "path";

let cachedVerifier;

export function getVerifier() {
    if (!cachedVerifier) {
        const verifierPath = path.join(process.cwd(), "api", "../circuits/vote_verifier.json");
        cachedVerifier = JSON.parse(fs.readFileSync(verifierPath, "utf-8"));
    }
    return cachedVerifier;
}
//================================================================

export const verifyProof = async (publicSignals, proof) => {
  const verifier = getVerifier();
  return snarkjs.groth16.verify(verifier, publicSignals, proof);
};


export const p =
    21888242871839275222246405745257275088548364400416034343698204186575808495617n;