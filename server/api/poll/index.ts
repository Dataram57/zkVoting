import { sql } from "../_lib/db";
import { applyCors } from "../_lib/cors";

export default async function handler(req : any, res : any) {
    //================================
    // CORS headers
    if (applyCors(req, res)) return;
    //================================

    try {
        const pollId : string = req.query.pollId;

        const result = await sql`
            SELECT id, description, merkle_root, created_at
            FROM polls
            WHERE id = ${pollId}
        `;

        if (result.length === 0) {
            return res.status(404).json({ error: "Poll not found" });
        }

        res.json(result[0]);

    } catch (err : any) {
        console.log(err);
        res.status(500).json({ error: "Database error" });
    }
}