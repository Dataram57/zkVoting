import { sql } from "./_lib/db.js";
import { Hash } from "./_lib/crypto.js";
import { applyCors } from "../_lib/cors.js";

export default async function handler(req, res) {
    //================================
    // CORS headers
    if (applyCors(req, res)) return;
    //================================

    if (req.method !== "POST") {
        return res.status(405).end();
    }

    try {
    const pollData = req.body;
    const pollHash = Hash(JSON.stringify(pollData));

    const memberQueries = pollData.members.map((leaf, i) =>
        sql`
        INSERT INTO poll_members (poll_id, leaf, position)
        VALUES (${pollHash}, ${leaf}, ${i})
        `
    );

    await sql.transaction([
        sql`
        INSERT INTO polls (id, description, merkle_root)
        VALUES (${pollHash}, ${pollData.description}, ${pollData.root})
        `,
        ...memberQueries,
    ]);

    res.json({ id: pollHash });

    } catch (err) {
        res.status(500).json({ error: "Failed to create poll" });
    }
}