import { sql } from "./_lib/db.js";

export default async function handler(request, response) {
    const authHeader = request.headers.authorization;
    console.log(request.headers);
    console.log(process.env.CRON_SECRET);
    if (
        !process.env.CRON_SECRET ||
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return response.status(401).json({ success: false });
    }

    console.log("test");

    // delete polls older than 3 days
    await sql`
        DELETE FROM polls
        WHERE created_at < now() - interval '3 days';
    `;

    response.status(200).json({ message: "Task executed" });
}