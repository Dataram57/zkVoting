import request from "supertest";

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

    //------------------------------------------------
    //#region Generate Identities

    //#endregion

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
    const res2 = await request(BASE_URL).get("/api/users");
    console.log("GET /api/users ->", res2.status, res2.body);

    // POST /api/login
    const res3 = await request(BASE_URL)
        .post("/api/login")
        .send({ username: "test", password: "test" });

    console.log("POST /api/login ->", res3.status, res3.body);

})();
