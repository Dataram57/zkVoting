import { sql } from "../lib/db";
import { applyCors } from "../lib/cors";

export default async function handler(req : any, res : any) {
    //================================
    // CORS headers
    if (applyCors(req, res)) return;
    //================================

    try {
        const pollId : string = req.query.pollId;
        
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