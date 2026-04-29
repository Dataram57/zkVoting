
import { apiURL } from "./config";
import { merkleTreeHeight } from "./config";
import { ComputeMerkleRoot, type PollMember, type PollMeta, type VoteSubmission, type VoteUnknown } from "./crypto";


export function Api_CreatePoll(
    description : string,
    members : string[],

) : Promise<Response>{
    return fetch(apiURL + "/create_poll", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            root: ComputeMerkleRoot(members, merkleTreeHeight).toString(),
            members: members,
            description: description
        })
    });
}

export async function Api_GetPoll(
    pollId : string
) : Promise<PollMeta>{
    const response = await (await fetch(apiURL + "/poll/?pollId=" + pollId, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    })).json();
    
    //check types
    if(typeof response.id != "string" || response.id != pollId)
        throw "id";
    if(typeof response.merkle_root != "string")
        throw "merkle_root";
    if(typeof response.description != "string")
        throw "description";
    
    //return
    return {
        id: response.id,
        merkle_root: response.merkle_root,
        description: response.description
    };
}

export async function Api_GetPollMembersAll(
    pollId: string
): Promise<PollMember[]> {
    const response = await (await fetch(apiURL + "/poll/members/?pollId=" + pollId, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    })).json();

    if (!Array.isArray(response)) {
        throw new Error("Invalid response: expected an array");
    }

    const validated : PollMember[] = response.map((item, index) => {
        if (typeof item !== "object" || item === null) {
            throw new Error(`Invalid item at index ${index}: not an object`);
        }

        if (typeof item.leaf !== "string") {
            throw new Error(`Invalid item at index ${index}: 'leaf' must be a string`);
        }

        if (typeof item.position !== "number") {
            throw new Error(`Invalid item at index ${index}: 'position' must be a number`);
        }

        if (!Number.isInteger(item.position)) {
            throw new Error(`Invalid item at index ${index}: 'position' must be an integer`);
        }

        if (item.position < 0) {
            throw new Error(`Invalid item at index ${index}: 'position' must be >= 0`);
        }

        return {
            leaf: item.leaf,
            position: item.position
        };
    });

    return validated;
}

export async function Api_GetPollVotesAll(
    pollId: string
): Promise<VoteUnknown[]> {
    const response = await (await fetch(apiURL + "/poll/votes?pollId=" + pollId, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    })).json();

    if (typeof response !== "object" || response === null) {
        throw new Error("Invalid response: expected an object");
    }

    const votes = (response as any).votes;

    if (!Array.isArray(votes)) {
        throw new Error("Invalid response: 'votes' must be an array");
    }

    const validated: VoteUnknown[] = votes.map((item, index) => {
        if (typeof item !== "object" || item === null) {
            throw new Error(`Invalid item at index ${index}: not an object`);
        }

        if (typeof item.vote_value !== "string") {
            throw new Error(`Invalid item at index ${index}: 'vote_value' must be a string`);
        }

        if (typeof item.nullifier !== "string") {
            throw new Error(`Invalid item at index ${index}: 'nullifier' must be a string`);
        }

        // proof is "any", but still ensure it exists
        if (!("proof" in item)) {
            throw new Error(`Invalid item at index ${index}: missing 'proof' field`);
        }

        return {
            vote_value: item.vote_value,
            nullifier: item.nullifier,
            proof: item.proof
        };
    });

    return validated;
}

export function Api_Vote(
    vote : VoteSubmission
) : Promise<Response>{
    return fetch(apiURL + "/vote", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(vote)
    })
}