import { applyCors } from "./_lib/cors.js";

export default function handler(req : any, res : any) {
    //================================
    // CORS headers
    if (applyCors(req, res)) return;
    //================================
    res.json({ message: "API is running" });
}