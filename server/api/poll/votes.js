import { sql } from "../_lib/db.js";
import { applyCors } from "../_lib/cors.js";

export default async function handler(req, res) {
    //================================
    // CORS headers
    if (applyCors(req, res)) return;
    //================================
    const { pollId } = req.query;

    try {
        const poll = await sql`
            SELECT id FROM polls WHERE id = ${pollId}
        `;

        if (poll.length === 0) {
            return res.status(404).json({ error: "Poll not found" });
        }

        const votes = await sql`
            SELECT vote_value, nullifier, proof, created_at
            FROM votes
            WHERE poll_id = ${pollId}
            ORDER BY created_at ASC
        `;

        res.json({ pollId, votes });

    } catch {
        res.status(500).json({ error: "Database error" });
    }
}