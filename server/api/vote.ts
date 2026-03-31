import { sql } from "./_lib/db.js";
import { applyCors } from "./_lib/cors.js";
import { VerifyVote, VoteSubmission } from "./_lib/crypto.js";

export default async function handler(req, res) {
    //================================
    // CORS headers
    if (applyCors(req, res)) return;
    //================================
    
    if (req.method !== "POST") {
        return res.status(405).end();
    }

    const vote : VoteSubmission = req.body;

    try {
        const poll = await sql`
            SELECT id, merkle_root
            FROM polls
            WHERE id = ${vote.pollId}
        `;

        if (poll.length === 0) {
            return res.status(404).json({ error: "Poll not found" });
        }

        //get poll info
        const pollId : string = poll[0].id;
        const pollMerkleRoot : string = poll[0].merkle_root;

        //verify vote
        if (!VerifyVote(vote, pollId, pollMerkleRoot)) {
            return res.status(400).json({ error: "Vote failed verification." });
        }

        await sql`
            INSERT INTO votes (poll_id, nullifier, vote_value, proof)
            VALUES (
            ${pollId},
            ${vote.nullifier},
            ${vote.voteValue},
            ${JSON.stringify(vote.proof)}
            )
        `;

        res.json({ message: "Vote recorded successfully" });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(400).json({ error: "You have already voted" });
        }
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
}