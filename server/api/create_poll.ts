import { sql } from "./_lib/db";
import { jsonToID } from "./_lib/crypto";
import { applyCors } from "./_lib/cors";

export default async function handler(req : any, res : any) {
    //================================
    // CORS headers
    if (applyCors(req, res)) return;
    //================================

    if (req.method !== "POST") {
        return res.status(405).end();
    }
    console.log(req.body);

    try {
        const pollData = req.body;
        const pollHash = await jsonToID(pollData);

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
        console.log(req.body);
        res.status(500).json({ error: "Failed to create poll" });
    }
}