import { sql } from "../_lib/db";
import { applyCors } from "../_lib/cors";

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