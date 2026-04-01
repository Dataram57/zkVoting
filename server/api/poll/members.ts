import { GetPollMembers, PollMembers, sql } from "../_lib/db.js";
import { applyCors } from "../_lib/cors.js";

export default async function handler(req : any, res : any) {
    //================================
    // CORS headers
    if (applyCors(req, res)) return;
    //================================

    try {
        const pollId : string = req.query.pollId;

        if(typeof pollId != "string"){
            return res.status(400).json({ error: "`pollId` is not a string" });
        }

        const members : PollMembers = await GetPollMembers(pollId);
        
        res.json(members);

    } catch {
        res.status(500).json({ error: "Database error" });
    }
}