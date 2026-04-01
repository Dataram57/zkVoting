import { InsertPoll, isPoll, Poll } from "./_lib/db.js";
import { applyCors } from "./_lib/cors.js";
import { poll_max_description_length, poll_max_members_count } from "./config.js";

export default async function handler(req : any, res : any) {
    //================================
    // CORS headers
    if (applyCors(req, res)) return;
    //================================

    if (req.method !== "POST") {
        return res.status(405).end();
    }

    try {
        //get pollData
        const pollData : Poll = req.body as Poll;

        //check limits
        if(pollData.description.toString().length > poll_max_description_length)
            return res.status(400).json({ error: "`pollData.description` is too long." });
        if(!Array.isArray(pollData.members))
            return res.status(400).json({ error: "`pollData.members` is not an array." });
        if(pollData.members.length > poll_max_members_count)
            return res.status(400).json({ error: "`pollData.members` has too many entries." });

        //verify data
        if(!isPoll(pollData)){
            return res.status(400).json({ error: "`pollData` is not a Poll." });
        }

        const pollId = await InsertPoll(pollData);

        res.json({ id: pollId });

    } catch (err) {
        console.log(req.body);
        res.status(500).json({ error: "Failed to create poll." });
    }
}