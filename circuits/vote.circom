pragma circom 2.0.0;

include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/poseidon.circom";

template Vote(merkle_levelCount) {
    //member
    signal input privateKey;
    signal input publicKey_index;
    signal input invitation;
    
    //poll
    signal input pollHash;
    
    //vote
    signal input vote;

    //Merkle Proof
    signal input merkle_leafs[merkle_levelCount];

    //================================================================
    //Nullifier

    component nullifer = Poseidon(2);
    nullifer.inputs[0] <== privateKey;
    nullifer.inputs[1] <== pollHash;

    //================================================================
    //Public Key Generator

    component publicKeyGenerator = Poseidon(1);
    publicKeyGenerator.inputs[0] <== privateKey;

    //================================================================
    //Merkle Entry

    component merkleEntry = Poseidon(2);
    merkleEntry.inputs[0] <== publicKeyGenerator.out;
    merkleEntry.inputs[1] <== invitation;

    //================================================================
    //Merkle Tree Path

    //get element (end leaf) path
    component bits = Num2Bits(merkle_levelCount);
    bits.in <== publicKey_index;

    //================================================================
    //Merkle Proof

    //computation parts
    component ph_left[merkle_levelCount];
    component ph_right[merkle_levelCount];
    signal ph_add_left[merkle_levelCount];
    signal ph_add_right[merkle_levelCount];
    signal ph_next[merkle_levelCount + 1];

    //define first root:    
    ph_next[0] <== merkleEntry.out;

    //blind computation of the merkle tree root
    for (var i = 0; i < merkle_levelCount; i++){
        //left
        ph_left[i] = Poseidon(2);
        ph_left[i].inputs[0] <== merkle_leafs[i];
        ph_left[i].inputs[1] <== ph_next[i];
        
        //right
        ph_right[i] = Poseidon(2);
        ph_right[i].inputs[0] <== ph_next[i];
        ph_right[i].inputs[1] <== merkle_leafs[i];
        
        //next
        ph_add_left[i] <== ph_left[i].out * bits.out[i];
        ph_add_right[i] <== ph_right[i].out * (1 - bits.out[i]);
        ph_next[i + 1] <== ph_add_left[i] + ph_add_right[i];
    }

    //================================================================
    //Public signals

    signal output out_pollHash <== pollHash;
    signal output out_merkleRoot <== ph_next[merkle_levelCount];
    signal output out_nullifier <== nullifer.out;
    signal output out_vote <== vote;
}

component main = Vote(8);