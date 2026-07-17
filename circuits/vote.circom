pragma circom 2.0.0;

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
    signal input publicKey_index_bits[merkle_levelCount];
    signal input invitation;
    
    //poll
    signal input pollHash;
    
    //vote
    signal input vote;

    //Merkle Proof
    signal input merkle_leafs[merkle_levelCount];

    //================================================================
    //Force publicKey_bits to have only bits

    for(var i = 0; i < merkle_levelCount; i++)
        publicKey_index_bits[i] === publicKey_index_bits[i] * publicKey_index_bits[i];

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
    //Merkle Trace

    component mt_root[merkle_levelCount];
    signal mt_root_next[merkle_levelCount + 1];
    signal mt_left_1[merkle_levelCount];
    signal mt_left_2[merkle_levelCount];
    signal mt_right_1[merkle_levelCount];
    signal mt_right_2[merkle_levelCount];

    mt_root_next[0] <== merkleEntry.out;

    for(var i = 0; i < merkle_levelCount; i++){
        //left
        mt_left_1[i] <== (1 - publicKey_index_bits[i]) * mt_root_next[i];
        mt_left_2[i] <== publicKey_index_bits[i] * merkle_leafs[i];

        //right
        mt_right_1[i] <== publicKey_index_bits[i] * mt_root_next[i];
        mt_right_2[i] <== (1 - publicKey_index_bits[i]) * merkle_leafs[i];

        //Poseidon hash
        mt_root[i] = Poseidon(2);
        mt_root[i].inputs[0] <== mt_left_1[i] + mt_left_2[i];
        mt_root[i].inputs[1] <== mt_right_1[i] + mt_right_2[i];
        
        //next
        mt_root_next[i + 1] <== mt_root[i].out;
    }

    //================================================================
    //Public signals

    signal output out_pollHash <== pollHash;
    signal output out_merkleRoot <== mt_root_next[merkle_levelCount];
    signal output out_nullifier <== nullifer.out;
    signal output out_vote <== vote;
}

component main = Vote(8);