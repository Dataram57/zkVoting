//tester: /vite-project
import { GeneratePrivateKey, GeneratePublicKey, GenerateMemeberLeaf, GenerateInvitation, GetPollId, VerifyPollFull, VerifyPollFullResult, GenerateVote, ComputeMerkleProof, VerifyVote, GetPollMeta } from "../../src/crypto";
import { Api_CreatePoll, Api_GetPoll, Api_GetPollMembersAll, Api_GetPollVotesAll, Api_Vote } from "../../src/api";
import { apiURL, merkleTreeHeight, p, poll_max_description_length, poll_max_members_count } from "../../src/config";

//other
import { faker } from "@faker-js/faker";

let testFailsCount : number = 0;
let testCount : number = 0;
function LogTest(title : string, result : any, expected : any){
    testCount++;
    console.log();
    if(result === expected){
        console.log(`Test ${testCount}. ✅ - `, title);
    }
    else{
        testFailsCount++;
        console.log(`Test ${testCount}. ❌ - `, title);
        console.log("Got:", result);
        console.log("Expected:", expected);
    }
    console.log();
}

function LogTestFail(title : string){
    testCount++;
    testFailsCount++;
    console.log();
    console.log(`Test ${testCount}. ❌ - `, title);
    console.log();
}

function LogTestSuccess(title : string){
    testCount++;
    console.log();
    console.log(`Test ${testCount}. ✅ - `, title);
    console.log();
}

function LogTestError(title: string, ...err: any[]) {
    testCount++;
    testFailsCount++;
    console.log();
    console.log(`Test ${testCount}. ❌ -`, title);
    console.log("Error:", ...err);
    console.log();
}

function randomLetters(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const charsLength = chars.length;

    // Use cryptographically secure randomness
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);

    let result = '';

    for (let i = 0; i < length; i++) {
        result += chars[randomValues[i] as number % charsLength];
    }

    return result;
}

function randomIndexes(count: number, modulo: number): number[] {
    if (count > modulo) {
        throw new Error("count cannot be greater than modulo");
    }

    const result = new Set<number>();

    while (result.size < count) {
        result.add(Math.floor(Math.random() * modulo));
    }

    return [...result];
}

function randomBigInt(bits: number): bigint {
    const bytes = Math.ceil(bits / 8);
    const buffer = new Uint8Array(bytes);
    crypto.getRandomValues(buffer);

    let result = 0n;
    for (const byte of buffer) {
        result = (result << 8n) | BigInt(byte);
    }

    return result % p;
}

function randomMerklePath(height : number) : bigint[]{
    const array : bigint[] = Array(height);
    while(height--)
        array[height] = randomBigInt(p.toString(2).length) % p;
    return array;
}

(async () => {
    //api url
    console.log("Quering:", apiURL);

    //vars
    let participantsCount : number = 16;
    let description : string = "";
    let privateKeys : bigint[] = [];
    let publicKeys : bigint[] = [];
    let invitations : bigint[] = [];
    let members : string[] = [];
    let pollId : string = "";
    
    async function RandomizeData(){
        //------------------------------------------------
        //#region Generate Random description

        description = `Will ${faker.finance.currency().name} become the currency of the world before year 21${ Math.ceil(Math.random() * 100) }?`;

        //#endregion

        //------------------------------------------------
        //#region Generate Private Keys - Identities

        privateKeys = Array.from({ length: participantsCount }, () => GeneratePrivateKey());

        //#endregion
    };

    async function CommitData(){
        //------------------------------------------------
        //#region Generate Public Keys

        publicKeys = privateKeys.map(pk => GeneratePublicKey(pk));

        //#endregion

        //------------------------------------------------
        //#region Generate Members

        invitations = Array.from({ length: participantsCount }, () => GenerateInvitation());
        members = publicKeys.map((pk, i) => {
            return GenerateMemeberLeaf(pk, invitations[i]);
        });

        //#endregion

        //------------------------------------------------
        //#region Generate Poll ID

        pollId = await GetPollId(description, members);

        //#endregion
    };

    async function VerifyPollData(){
        
        //get poll basic info
        const pollMeta = await Api_GetPoll(pollId);

        const pollMembers = await Api_GetPollMembersAll(pollId);

        const verificationResult = await VerifyPollFull(pollId, pollMeta, pollMembers);

        return verificationResult;
    };

    //################################################
    //#region TEST: Poll Creation - Voter's count limit
    
    //save setting
    let temp = participantsCount;

    //test
    try{
        participantsCount = poll_max_members_count + 1;
        await RandomizeData();
        await CommitData();
        const result = await Api_CreatePoll(description, members);
        LogTest("Poll Creation - Voter's count limit", result.ok, false);
    }
    catch(e : any){
        LogTestError("Poll Creation - Voter's count limit", e);
    }

    //repair settings
    participantsCount = temp;

    //#endregion

    //################################################
    //#region TEST: Poll Creation - Description size limit.

    try{
        await RandomizeData();
        description = randomLetters(poll_max_description_length + 1);
        await CommitData();
        const result = await Api_CreatePoll(description, members);
        LogTest("Poll Creation - Description size limit.", result.ok, false);
    }
    catch(e : any){
        LogTestError("Poll Creation - Description size limit.", e);
    }

    //#endregion

    //################################################
    //#region TEST: Poll Creation - Fake Merkle root.

    //Affects the library.

    //#endregion

    //################################################
    //#region TEST: Poll Creation

    try{
        await RandomizeData();
        await CommitData();
        await Api_CreatePoll(description, members);
        LogTest("Poll Verification", await VerifyPollData(), VerifyPollFullResult.correct);
    }
    catch(e : any){
        LogTestError("Poll Creation", e);
    }

    //#endregion

    //################################################
    //#region TEST: Submit fake vote
    
    try{
        const i = randomIndexes(1, privateKeys.length)[0] as number;
        const vote = await GenerateVote(
            await GeneratePrivateKey(),
            i,
            0n,
            pollId,
            randomLetters(32),
            await ComputeMerkleProof(members, merkleTreeHeight, i)
        );
        const result = await Api_Vote(vote);
        LogTest("Submit fake vote", result.ok, false);
    }catch(e : any){
        LogTestError("Submit fake vote", e);
    }

    //#endregion

    //################################################
    //#region TEST: Submit fake vote - invalid privateKey
    
    try{
        const i = randomIndexes(1, privateKeys.length)[0] as number;
        const vote = await GenerateVote(
            0n,
            i,
            invitations[i] as bigint,
            pollId,
            randomLetters(32),
            await ComputeMerkleProof(members, merkleTreeHeight, i)
        );
        const result = await Api_Vote(vote);
        LogTest("Submit fake vote - invalid privateKey", result.ok, false);
    }catch(e : any){
        LogTestError("Submit fake vote - invalid privateKey", e);
    }

    //#endregion

    //################################################
    //#region TEST: Submit fake vote - invalid invitation
    
    try{
        const i = randomIndexes(1, privateKeys.length)[0] as number;
        const vote = await GenerateVote(
            privateKeys[i] as bigint,
            i,
            0n,
            pollId,
            randomLetters(32),
            await ComputeMerkleProof(members, merkleTreeHeight, i)
        );
        const result = await Api_Vote(vote);
        LogTest("Submit fake vote - invalid invitation", result.ok, false);
    }catch(e : any){
        LogTestError("Submit fake vote - invalid invitation", e);
    }

    //#endregion

    //################################################
    //#region TEST: Submit fake vote - invalid pollId
    
    try{
        const i = randomIndexes(1, privateKeys.length)[0] as number;
        const vote = await GenerateVote(
            privateKeys[i] as bigint,
            i,
            invitations[i] as bigint,
            await GetPollId(randomLetters(32), []),
            randomLetters(32),
            await ComputeMerkleProof(members, merkleTreeHeight, i)
        );
        const result = await Api_Vote(vote);
        LogTest("Submit fake vote - invalid pollId", result.ok, false);
    }catch(e : any){
        LogTestError("Submit fake vote - invalid pollId", e);
    }

    //#endregion

    //################################################
    //#region TEST: Submit fake vote - invalid merkle index
    
    try{
        const ix = randomIndexes(2, privateKeys.length) as number[];
        const i = ix[0] as number;
        const f = ix[1] as number;
        const vote = await GenerateVote(
            privateKeys[i] as bigint,
            f,
            invitations[i] as bigint,
            pollId,
            randomLetters(32),
            await ComputeMerkleProof(members, merkleTreeHeight, i)
        );
        const result = await Api_Vote(vote);
        LogTest("Submit fake vote - invalid merkle index", result.ok, false);
    }catch(e : any){
        LogTestError("Submit fake vote - invalid merkle index", e);
    }

    //#endregion

    //################################################
    //#region TEST: Submit fake vote - invalid merkle path
    
    try{
        const ix = randomIndexes(2, privateKeys.length) as number[];
        const i = ix[0] as number;
        const f = ix[1] as number;
        const vote = await GenerateVote(
            privateKeys[i] as bigint,
            i,
            invitations[i] as bigint,
            pollId,
            randomLetters(32),
            await ComputeMerkleProof(members, merkleTreeHeight, f)
        );
        const result = await Api_Vote(vote);
        LogTest("Submit fake vote - invalid merkle path", result.ok, false);
    }catch(e : any){
        LogTestError("Submit fake vote - invalid merkle path", e);
    }

    //#endregion

    //################################################
    //#region TEST: Submit fake vote - invalid merkle root
    
    try{
        const i = randomIndexes(2, privateKeys.length)[0] as number;
        const vote = await GenerateVote(
            privateKeys[i] as bigint,
            i,
            invitations[i] as bigint,
            pollId,
            randomLetters(32),
            randomMerklePath(Number(merkleTreeHeight))
        );
        const result = await Api_Vote(vote);
        LogTest("Submit fake vote - invalid merkle root", result.ok, false);
    }catch(e : any){
        LogTestError("Submit fake vote - invalid merkle root", e);
    }

    //#endregion

    //################################################
    //#region TEST: Submit fake vote - invalid vote hash
    
    try{
        const ix = randomIndexes(2, privateKeys.length) as number[];
        const i = ix[0] as number;
        const f = ix[1] as number;
        const vote = await GenerateVote(
            privateKeys[i] as bigint,
            i,
            invitations[i] as bigint,
            pollId,
            randomLetters(32),
            await ComputeMerkleProof(members, merkleTreeHeight, i)
        );
        vote.voteValue = randomLetters(32);
        const result = await Api_Vote(vote);
        LogTest("Submit fake vote - invalid vote hash", result.ok, false);
    }catch(e : any){
        LogTestError("Submit fake vote - invalid vote hash", e);
    }

    //#endregion

    //################################################
    //#region TEST: Cast half of the votes

    const expectedVoteCount = members.length >> 1;
    try{
        const indexes = randomIndexes(expectedVoteCount, members.length);

        for (const [f, i] of indexes.entries()) {
            try {
                const vote = await GenerateVote(
                    privateKeys[i] as bigint,
                    i,
                    invitations[i] as bigint,
                    pollId,
                    randomLetters(32),
                    await ComputeMerkleProof(members, merkleTreeHeight, i)
                );

                const result = await Api_Vote(vote);

                LogTest(
                    `Cast half of the votes - (${f + 1}/${expectedVoteCount}, ${i})`,
                    result.ok,
                    true
                );
            }
            catch (e: any) {
                LogTestError(
                    `Cast half of the votes - (${f + 1}/${expectedVoteCount}, ${i})`,
                    e
                );
            }
        }
    }
    catch(e : any){
        LogTestError(`Cast half of the votes`, e);
    }

    //#endregion

    //################################################
    //#region TEST: Verify Casted Votes

    try {
        let validVotes = 0;

        const votes = await Api_GetPollVotesAll(pollId);
        const pollMeta = await GetPollMeta(description, members);

        for (const [i, vote] of votes.entries()) {
            const result = await VerifyVote(vote, pollMeta);

            if (result) {
                validVotes++;
                LogTestSuccess(`Verify Casted Votes (${i + 1}/${votes.length})`);
            }
            else {
                LogTestFail(`Verify Casted Votes (${i + 1}/${votes.length})`);
            }
        }

        LogTest("Verify Casted Votes", validVotes, expectedVoteCount);
    }
    catch (e: any) {
        LogTestError("Verify Casted Votes", e);
    }

    //#endregion

    console.log("End of tests");
    console.log(`Score ${testCount - testFailsCount}/${testCount}`);
    process.exit(testFailsCount);
})();
