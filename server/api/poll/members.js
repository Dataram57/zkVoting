import { sql } from "../_lib/db.js";
import { applyCors } from "../_lib/cors.js";

export default async function handler(req, res) {
    //================================
    // CORS headers
    if (applyCors(req, res)) return;
    //================================
    const { pollId } = req.query;

    try {
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