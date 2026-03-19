
import { apiURL } from "./config";
import { merkleTreeHeight } from "./config";
import { ComputeMerkleRoot } from "./crypto";


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

export function Api_GetPoll(
    pollId : string
) : Promise<Response>{
    return fetch(apiURL + "/poll/" + pollId, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    })
}

export function Api_GetPollMembers(
    pollId : string
) : Promise<Response>{
    return fetch(apiURL + "/poll/members/?pollId=" + pollId, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    })
}

export function Api_GetPollVotes(
    pollId : string
) : Promise<Response>{
    return fetch(apiURL + "/poll/votes?pollId=" + pollId, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    })
}

export function Api_Vote(
    pollId : string,
    vote : any
) : Promise<Response>{
    return fetch(apiURL + "/vote", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            pollId: pollId,
            vote: vote
        })
    })
}