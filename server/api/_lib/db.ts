import { neon } from "@neondatabase/serverless";

//================================================================
//#region Common

export const sql = neon(process.env.DATABASE_URL);

export async function jsonToID<T>(obj: T): Promise<string> {
    const data = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(data);

    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

//#endregion

//================================================================
//#region GetPollInformation

export interface PollInfo {
    id: string;
    description: string;
    merkle_root: string;
    created_at: string; // or Date depending on your DB client
}

export async function GetPollInformation(pollId: string): Promise<PollInfo | null> {
    const result = await sql`
        SELECT id, description, merkle_root, created_at
        FROM polls
        WHERE id = ${pollId}
    `;

    if (result.length === 0) {
        return null;
    }

    return result[0] as PollInfo;
}

//#endregion

//================================================================
//#region GetPollMembers

export interface PollMember {
    leaf: string;
    position: number;
}
export type PollMembers = PollMember[];

export async function GetPollMembers(pollId: string): Promise<PollMembers> {
    const members = await sql`
        SELECT leaf, position
        FROM poll_members
        WHERE poll_id = ${pollId}
        ORDER BY position
    `;

    return members as PollMembers;
}

//#endregion

//================================================================
//#region GetPollVotes

export interface PollVote {
    vote_value : string;
    nullifier : string;
    proof : string;
    created_at : string;
}
export type PollVotes = PollVote[];

export async function GetPollVotes(pollId: string): Promise<PollVotes>{
    const votes = await sql`
        SELECT vote_value, nullifier, proof, created_at
        FROM votes
        WHERE poll_id = ${pollId}
        ORDER BY created_at ASC
    `;

    return votes as PollVotes;
}

//#endregion

//================================================================
//#region InsertPoll

export interface Poll {
    root: string;
    description: string;
    members: string[];
}

export function isPoll(obj: any): obj is Poll {
    //check types
    if (
        typeof obj !== "object" ||
        obj === null ||
        typeof obj.root !== "string" ||
        typeof obj.description !== "string" ||
        !Array.isArray(obj.members) ||
        !obj.members.every(m => typeof m === "string")
    ) {
        return false;
    }

    // no extra fields
    const allowedKeys = ["root", "description", "members"];
    const keys = Object.keys(obj);
    if (keys.length !== allowedKeys.length || !keys.every(k => allowedKeys.includes(k))) {
        return false;
    }

    //

    // check for duplicates
    const uniqueMembers = new Set(obj.members);
    if (uniqueMembers.size !== obj.members.length) {
        return false;
    }

    return true;
}

export async function InsertPoll(pollData: Poll): Promise<string> {
    // generate ID
    const pollHash: string = await jsonToID(pollData);

    const memberQueries = pollData.members.map((leaf, i) =>
        sql`
        INSERT INTO poll_members (poll_id, leaf, position)
        VALUES (${pollHash}, ${leaf}, ${i})
        `
    );

    await sql.transaction([
        sql`
        INSERT INTO polls (id, description, merkle_root)
        VALUES (${pollHash}, ${pollData.description}, ${pollData.root})
        `,
        ...memberQueries,
    ]);

    return pollHash;
}

//#endregion

//================================================================
//#region InsertVote

export interface Vote {
    pollId: string;
    pollMerkleRoot: string;
    nullifier: string;
    voteValue: string;
    proof: any;
}

export async function InsertVote(pollId : string, vote : Vote){
    await sql`
        INSERT INTO votes (poll_id, nullifier, vote_value, proof)
        VALUES (
            ${pollId},
            ${vote.nullifier.toString()},
            ${vote.voteValue.toString()},
            ${JSON.stringify(vote.proof)}
        )
    `;
}

//#endregion

//================================================================
//#region DeleteOldPolls

export async function DeleteOldPolls(){
    // delete polls older than 3 days
    await sql`
        DELETE FROM polls
        WHERE created_at < now() - interval '3 days';
    `;
}

//#endregion
