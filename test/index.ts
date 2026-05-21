//tester: /vite-project
import { GeneratePrivateKey, GeneratePublicKey, GenerateMemeberLeaf, GenerateInvitation, GetPollId, VerifyPollFull, VerifyPollFullResult } from "../vite-project/src/crypto";
import { Api_CreatePoll, Api_GetPoll, Api_GetPollMembersAll } from "../vite-project/src/api";
import { poll_max_description_length, poll_max_members_count } from "../vite-project/src/config";


//other
import request from "supertest";
import { faker } from "@faker-js/faker";

const BASE_URL = "http://localhost:3000";

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


(async () => {
    //Tests
    //================================================
    // GET /

    //################################################
    //#region TEST: Hello - /API

    const res1 = await request(BASE_URL).get("/api");
    console.log("GET /api ->", res1.status, res1.body);

    //#endregion

    let participantsCount : number = 4;
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
    participantsCount = poll_max_members_count;

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
    //#region TEST: Poll Information Check (via deterministic ID)

    //#endregion

    //------------------------------------------------
    //#region Generate votes

    //#endregion

    //------------------------------------------------
    //#region Generate fake votes

    //#endregion

    //------------------------------------------------
    //#region Mix Legit and Fake votes together

    //#endregion

    //################################################
    //#region TEST: Cast Votes and fetch Poll's votes.

    //#endregion

    //================================================
    //All is done

    // GET /api/users
    /*
    const res2 = await request(BASE_URL).get("/api/users");
    console.log("GET /api/users ->", res2.status, res2.body);

    // POST /api/login
    const res3 = await request(BASE_URL)
        .post("/api/login")
        .send({ username: "test", password: "test" });

    console.log("POST /api/login ->", res3.status, res3.body);
    */

})();
