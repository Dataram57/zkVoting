import { sql } from "../_lib/db.js";
import { applyCors } from "../_lib/cors.js";

export default async function handler(req, res) {
    //================================
    // CORS headers
    if (applyCors(req, res)) return;
    //================================
    const { pollId } = req.query;

    try {
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
        res.status(500).json({ error: "Database error" });
    }
}