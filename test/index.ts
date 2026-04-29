import request from "supertest";
import { GeneratePrivateKey, GeneratePublicKey, GenerateMemeberLeaf, GenerateInvitation, GetPollId, VerifyPollFull } from "../vite-project/src/crypto";
import { Api_CreatePoll, Api_GetPoll, Api_GetPollMembersAll } from "../vite-project/src/api";

import { faker } from "@faker-js/faker";

const BASE_URL = "http://localhost:3000";

(async () => {
    //Tests
    //================================================
    // GET /

    //################################################
    //#region TEST: Hello - /API

    const res1 = await request(BASE_URL).get("/api");
    console.log("GET /api ->", res1.status, res1.body);

    //#endregion

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
        //#region Generate Identities

        privateKeys = Array.from({ length: 256 }, () => GeneratePrivateKey());
        publicKeys = privateKeys.map(pk => GeneratePublicKey(pk));

        //#endregion

        //------------------------------------------------
        //#region Generate Members

        invitations = Array.from({ length: 256 }, () => GenerateInvitation());
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

    };


    //################################################
    //#region TEST: Poll Creation - Voter's count limit
    


    //#endregion

    //################################################
    //#region TEST: Poll Creation - Description size limit.

    //#endregion

    //################################################
    //#region TEST: Poll Creation - Fake Merkle root.

    //#endregion

    //################################################
    //#region TEST: Poll Creation

    RandomizeData();
    const result = await Api_CreatePoll(description, members);
    try{
        console.log(await result.json());
    }
    catch(e : any){
        return e;
    }

    // - - - - - - - - - - - - - - - - - - - - - - - -
    //verify data




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
