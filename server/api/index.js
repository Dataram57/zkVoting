import { applyCors } from "./_lib/cors.js";

export default function handler(req, res) {
    //================================
    // CORS headers
    if (applyCors(req, res)) return;
    //================================
    res.json({ message: "API is running" });
}