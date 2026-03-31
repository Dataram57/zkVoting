import { sql } from "../lib/db.js";
import { applyCors } from "../lib/cors.js";

export default async function handler(req : any, res : any) {
    //================================
    // CORS headers
    if (applyCors(req, res)) return;
    //================================

    try {
        const pollId : string = req.query.pollId;

        const members = await sql`
            SELECT leaf, position
            FROM poll_members
            WHERE poll_id = ${pollId}
            ORDER BY position
        `;

        res.json(members);

    } catch {
        res.status(500).json({ error: "Database error" });
    }
}