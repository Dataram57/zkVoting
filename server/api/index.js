export default function handler(req, res) {
    //================================
    //cors
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    //================================
    res.json({ message: "API is running" });
}