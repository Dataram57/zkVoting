import { InsertVote, sql, Vote } from "./_lib/db.js";
import { applyCors } from "./_lib/cors.js";
import { VerifyVote } from "./_lib/crypto.js";
import { poll_max_vote_length } from "./config.js";

export default async function handler(req, res) {
    //================================
    // CORS headers
    if (applyCors(req, res)) return;
    //================================
    if (req.method !== "POST") {
        return res.status(405).end();
    }

    const vote : Vote = req.body;

    if(vote.pollId === undefined){
        return res.status(400).json({ error: "`vote.pollId` is undefined." });
    }

    //check limits
    if(vote.voteValue.toString().length > poll_max_vote_length){
        return res.status(400).json({ error: "`vote.voteValue` is too long" });
    }

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
        if (await VerifyVote(vote, pollId, pollMerkleRoot) === false) {
            console.log("err");
            return res.status(400).json({ error: "Vote failed verification." });
        }

        await InsertVote(pollId, vote);

        res.json({ message: "Vote recorded successfully" });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(400).json({ error: "You have already voted" });
        }
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
}