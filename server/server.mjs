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
const p = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

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

// GET all votes for a poll, including proof
app.get("/poll/:pollId/votes", async (req, res) => {
    try {
        const pollId = req.params.pollId;

        // 1️⃣ Check if poll exists
        const poll = await sql`
            SELECT id
            FROM polls
            WHERE id = ${pollId}
        `;

        if (poll.length === 0) {
            return res.status(404).json({ error: "Poll not found" });
        }

        // 2️⃣ Fetch votes including proof
        const votes = await sql`
            SELECT vote_value, nullifier, proof, created_at
            FROM votes
            WHERE poll_id = ${pollId}
            ORDER BY created_at ASC
        `;

        // 3️⃣ Return votes
        res.json({ pollId, votes });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

//vote
app.post("/vote", async (req, res) => {
    const voteData = req.body;

    try {
        // 1️⃣ Fetch poll from DB
        const poll = await sql`
            SELECT id, merkle_root
            FROM polls
            WHERE id = ${voteData.pollId}
        `;

        if (poll.length === 0) {
            return res.status(404).json({ error: "Poll not found" });
        }

        // 2️⃣ Verify zk-proof
        const isValid = await snarkjs.groth16.verify(
            vote_verifier,
            voteData.vote.publicSignals,
            voteData.vote.proof
        );

        if (!isValid) {
            return res.status(400).json({ error: "Proof failed verification." });
        }

        const publicSignals = voteData.vote.publicSignals;

        // 3️⃣ Map signals based on your circuit
        const out_pollHash   = BigInt(publicSignals[0]);
        const out_merkleRoot = publicSignals[1];
        const out_nullifier  = publicSignals[2];
        const out_vote       = publicSignals[3];

        // 4️⃣ Validate pollHash (modulo p, same as client)
        const expectedPollHash = (BigInt(voteData.pollId.startsWith("0x") ? voteData.pollId : "0x" + voteData.pollId) % p);

        if (out_pollHash !== expectedPollHash) {
            return res.status(400).json({ error: "Poll hash mismatch" });
        }

        // 5️⃣ Validate Merkle root matches DB
        if (out_merkleRoot !== poll[0].merkle_root) {
            return res.status(400).json({ error: "Invalid merkle root" });
        }

        // 6️⃣ Insert vote
        await sql`
            INSERT INTO votes (poll_id, nullifier, vote_value, proof)
            VALUES (
                ${voteData.pollId},
                ${out_nullifier.toString()},
                ${out_vote.toString()},
                ${JSON.stringify(voteData.vote.proof)}
            )
        `;

        return res.json({ message: "Vote recorded successfully" });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(400).json({ error: "You have already voted" });
        }
        console.error(error);
        return res.status(500).json({ error: "Database error" });
    }
});



//await snarkjs.groth16.verify(vKey, publicSignals, proof);

//#endregion

//================================================================
//#region Startup

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

//#endregion