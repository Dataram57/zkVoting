import { sql } from "../_lib/db.js";

export default async function handler(req, res) {
    //================================
    //cors
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
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