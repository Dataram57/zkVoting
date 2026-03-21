import { sql } from "./_lib/db.js";

export default async function handler(req, res) {
    // Check secret token
    const token = req.headers['x-cron-secret'];
    if (!token || token !== process.env.CRON_SECRET) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    //delete polls older than 3 days
    await sql`
        DELETE FROM polls
        WHERE created_at < now() - interval '3 days';
    `;

    //end
    res.status(200).json({ message: "Task executed" });
}