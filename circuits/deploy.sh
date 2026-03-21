#!/usr/bin/env bash

DEPLOYDIR="./public_deploy"

mkdir -p "$DEPLOYDIR"

# vote
cp "./vote_js/vote.wasm" "$DEPLOYDIR/vote.wasm"
cp "./vote_verifier.json" "$DEPLOYDIR/vote.json"
cp "./vote_prover.zkey" "$DEPLOYDIR/vote.zkey"