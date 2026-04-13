import { DeleteOldPolls } from "./_lib/db.js";

export default async function handler(request : any, response : any) {
    const authHeader = request.headers.authorization;
    if (
        !process.env.CRON_SECRET ||
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return response.status(401).json({ success: false });
    }

    //tasks
    await DeleteOldPolls();

    response.status(200).json({ message: "Task executed" });
}