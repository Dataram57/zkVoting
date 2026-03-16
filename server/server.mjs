import express from "express";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const app = express();
const PORT = 3000;

app.use(express.json());

// test route
app.get("/", (req, res) => {
    res.json({ message: "API is running" });
});

// get users
app.get("/users", async (req, res) => {
    res.json(await getData());
});

// create user
app.post("/users", (req, res) => {
    const user = req.body;
    res.json({
        message: "User created",
        user
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

import { neon } from "@neondatabase/serverless";

export async function getData() {
    const sql = neon(process.env.DATABASE_URL);
    const data = await sql`SELECT * FROM test;`;
    return data;
}