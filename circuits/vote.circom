pragma circom 2.0.0;

include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/poseidon.circom";

template Vote(merkle_levelCount) {
    //consts
    var SALT_IDENTITY = 2930996857342901638159601487792286970470209671487906641678817720245646941774;
    var SALT_POLL = 7512478420072554091054407658194692655047781415488857595863341920757143076957;
    var SALT_LEAF = 15508546515753695292987831276891861764197150468030429292841948281315619319598;
    var SALT_NULLIFIER_BASE = 17655328339939302180868851446331250730986858468645658769908281704971883778123;
    var SALT_NULLIFIER = 158508368761311659699926858248834935040342510550644700966438814198616225925;

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

    component identityNullifier = Poseidon(2);
    identityNullifier.inputs[0] <== SALT_NULLIFIER_BASE;
    identityNullifier.inputs[1] <== privateKey;
    
    component nullifer = Poseidon(3);
    nullifer.inputs[0] <== SALT_NULLIFIER;
    nullifer.inputs[1] <== identityNullifier.out;
    nullifer.inputs[2] <== pollHash;

    //================================================================
    //Public Key Generator

    component publicKeyGenerator = Poseidon(2);
    publicKeyGenerator.inputs[0] <== SALT_IDENTITY;
    publicKeyGenerator.inputs[1] <== privateKey;

    //================================================================
    //Merkle Entry

    component merkleEntry = Poseidon(3);
    merkleEntry.inputs[0] <== SALT_LEAF;
    merkleEntry.inputs[1] <== publicKeyGenerator.out;
    merkleEntry.inputs[2] <== invitation;

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