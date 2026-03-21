#!/usr/bin/env bash
circom vote.circom --r1cs --sym --wasm
snarkjs groth16 setup vote.r1cs ppot_0080_14.ptau vote_prover.zkey
snarkjs zkey export verificationkey vote_prover.zkey vote_verifier.json