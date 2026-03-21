import { sql } from "./_lib/db.js";
import { verifyProof, p } from "./_lib/zk.js";
import { applyCors } from "./_lib/cors.js";
import { Hash } from "./_lib/crypto.js";

export default async function handler(req, res) {
    //================================
    // CORS headers
    if (applyCors(req, res)) return;
    //================================
    
    if (req.method !== "POST") {
        return res.status(405).end();
    }

    const voteData = req.body;

    try {
        const poll = await sql`
            SELECT id, merkle_root
            FROM polls
            WHERE id = ${voteData.pollId}
        `;

        if (poll.length === 0) {
            return res.status(404).json({ error: "Poll not found" });
        }

        const isValid = await verifyProof(
            voteData.vote.publicSignals,
            voteData.vote.proof
        );

        if (!isValid) {
            return res.status(400).json({ error: "Proof failed verification." });
        }

        const ps = voteData.vote.publicSignals;

        const out_pollHash = BigInt(ps[0]);
        const out_merkleRoot = ps[1];
        const out_nullifier = ps[2];
        const out_vote = ps[3];

        const expectedPollHash =
            BigInt("0x" + voteData.pollId.replace(/^0x/, "")) % p;

        const expectedVote = (BigInt("0x" + Hash(voteData.voteValue)) % p).toString();

        if (out_pollHash !== expectedPollHash) {
            return res.status(400).json({ error: "Poll hash mismatch" });
        }

        if (out_merkleRoot !== poll[0].merkle_root) {
            return res.status(400).json({ error: "Invalid merkle root" });
        }

        if (expectedVote !== out_vote) {
            return res.status(400).json({ error: "Vote hash mismatch" });
        }

        await sql`
            INSERT INTO votes (poll_id, nullifier, vote_value, proof)
            VALUES (
            ${voteData.pollId},
            ${out_nullifier.toString()},
            ${voteData.voteValue.toString()},
            ${JSON.stringify(voteData.vote.proof)}
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