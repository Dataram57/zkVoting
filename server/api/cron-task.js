import { sql } from "./_lib/db.js";

export default async function handler(req, res) {
    // Check secret token
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`)
        return new Response('Unauthorized', {
            status: 401,
        }
    );
    console.log("test");
    //delete polls older than 3 days
    await sql`
        DELETE FROM polls
        WHERE created_at < now() - interval '3 days';
    `;

    //end
    res.status(200).json({ message: "Task executed" });
}