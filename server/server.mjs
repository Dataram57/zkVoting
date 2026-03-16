//================================================================
//#region Requirements

//server
import express from "express";

//db
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

//crypto
import crypto from "crypto";
const Hash = (data) => crypto.createHash("sha256").update(data).digest("hex");

//zk
import * as snarkjs from "snarkjs";

//zk-proof verifiers
import vote_verifier from "./vote_verifier.json" with { type: "json" };

//#endregion

//================================================================
//#region Database

const sql = neon(process.env.DATABASE_URL);

export async function getData() {
    const data = await sql`SELECT * FROM test;`;
    return data;
}

//#endregion

//================================================================
//#region Server

const app = express();
const PORT = 3000;

app.use(express.json());

//Hello world
app.get("/", (req, res) => {
    res.json({ message: "API is running" });
});

app.post("/create_poll", async (req, res) => {
    try {

        //get data
        const pollData = req.body;
        
        //calculate id
        const pollHash = Hash(JSON.stringify(pollData));

        const memberQueries = pollData.members.map((leaf, i) =>
            sql`
                INSERT INTO poll_members (poll_id, leaf, position)
                VALUES (${pollHash}, ${leaf}, ${i})
            `
        );

        await sql.transaction([
            sql`
                INSERT INTO polls (id, description, merkle_root)
                VALUES (${pollHash}, ${pollData.description}, ${pollData.root})
            `,
            ...memberQueries
        ]);

        res.json({ id: pollHash });

    } catch (err) {
        res.status(500).json({ error: "Failed to create poll" });
    }
});

app.get("/poll/:pollId", async (req, res) => {
    try {

        const pollId = req.params.pollId;

        const result = await sql`
            SELECT id, description, merkle_root, created_at
            FROM polls
            WHERE id = ${pollId}
        `;

        if (result.length === 0) {
            return res.status(404).json({ error: "Poll not found" });
        }

        res.json(result[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

app.get("/poll/:pollId/members", async (req, res) => {
    try {

        const pollId = req.params.pollId;

        const members = await sql`
            SELECT leaf, position
            FROM poll_members
            WHERE poll_id = ${pollId}
            ORDER BY position
        `;

        res.json(members);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});


//vote
app.post("/vote", async (req, res) => {
    //get data
    const voteData = req.body;

    //verify vote
    if(voteData.proof && voteData.signals)
        if(await snarkjs.groth16.verify(vote_verifier, voteData.signals, voteData.proof)){
            //proof is legit
            //try to insert it into the db

        }

    res.json({ message: "Vote received", data: voteData });
});



//await snarkjs.groth16.verify(vKey, publicSignals, proof);

//#endregion

//================================================================
//#region Startup

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

//#endregion