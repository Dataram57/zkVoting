import { apiURL, merkleTreeHeight, p } from "../config"
import { getNextURLPrivateParameter, markdownToSafeHTML } from "../lib";
import { jsonToID, GenerateMemeberLeaf, GeneratePublicKey, ComputeMerkleProof, RecomputeMerkleRootFromProof, ComputeMerkleRoot, GenerateVote } from "../crypto";


let errorCount = 0;

let pollMembers : { leaf: string; position: number }[] | null = null;

//================================================================
//#region Verify Poll

function ClearCheckLogs(){
    (document.getElementById("check_logs") as HTMLElement).innerText = "";
}

function CheckSuccess(message : string){
    (document.getElementById("check_logs") as HTMLElement).innerText += "\n✅ " + message;
}

function CheckFailure(message : string){
    (document.getElementById("check_logs") as HTMLElement).innerText += "\n❌ " + message;
}

async function ButtonVerifyPoll_click(e : Event | null = null){
    //disable buttons and hide panels and get id
    (document.getElementById("poll-description") as HTMLButtonElement).hidden = true;
    (document.getElementById("button-verify") as HTMLButtonElement).disabled = true;
    const tag : HTMLInputElement = document.getElementById("input-poll-id") as HTMLInputElement;
    tag.disabled = true;
    const pollId = tag.value;

    //clear logs
    ClearCheckLogs();

    //clear array
    pollMembers = null;

    try{
        //fetch poll meta
        const pollMeta = await (await fetch(apiURL + "/poll/" + pollId, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        })).json();
        (document.getElementById("poll-description") as HTMLElement).innerHTML = markdownToSafeHTML(pollMeta.description);
        CheckSuccess("Poll's profile loaded.");
        (document.getElementById("poll-description") as HTMLButtonElement).hidden = false;

        //fetch poll members
        pollMembers = await (await fetch(apiURL + "/poll/" + pollId + "/members", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        })).json() as { leaf: string; position: number }[];
        CheckSuccess("Poll's members loaded.");

        //verify poll's authenticity
        const pollData = {
            root: pollMeta.merkle_root,
            members: pollMembers.map(member => member.leaf),
            description: pollMeta.description
        };
        const pollHash = await jsonToID(pollData);
        if(pollHash != pollId)
            CheckFailure("Server has altered poll's data.");
        else{
            CheckSuccess("Poll's data is legit.");
            
            //check if vote has been already casted
            //...

            //all necessary tests have been made
            //switch to vote option
            (document.getElementById("panel-vote") as HTMLButtonElement).hidden = false;

            //return and don't re-eanble editing the poll
            return;
        }
    }
    catch(e : any){
        console.log(e);
        CheckFailure("There is no such poll or server has censored it.");
    }

    //enable again
    (document.getElementById("button-verify") as HTMLButtonElement).disabled = false;
    tag.disabled = false;
}

//#endregion

//================================================================
//#region Vote

function ClearVoteLogs(){
    (document.getElementById("vote_logs") as HTMLElement).innerText = "";
}

function VoteSuccess(message : string){
    (document.getElementById("vote_logs") as HTMLElement).innerText += "\n✅ " + message;
}

function VoteFailure(message : string){
    (document.getElementById("vote_logs") as HTMLElement).innerText += "\n❌ " + message;
}

function ZKValue_input(e : Event){
    const input : HTMLInputElement = e.target as HTMLInputElement;
    const wasError : boolean = input.classList.contains("error");
    let isError : boolean = false;
    if(input.value.length != 0){        
        try{
            const secret : bigint= BigInt(input.value);
            if(!(secret >= 0 && secret < p))
                isError = true;
        }
        catch(error : any){
            isError = true;
        }
    }
    
    //check display
    if(isError != wasError)
        if(isError)
        {
            errorCount++;
            input.classList.add("error");
        }
        else{
            errorCount--;
            input.classList.remove("error");
        }
}

async function ButtonVote_click(e : Event){
    //skip if errors are marked
    if(errorCount > 0)
        return;

    //clear logs
    ClearVoteLogs();

    //disable
    (document.getElementById("button-vote") as HTMLButtonElement).disabled =
    (document.getElementById("input-invitation") as HTMLInputElement).disabled =
    (document.getElementById("input-private_key") as HTMLInputElement).disabled =
    (document.getElementById("input-vote") as HTMLInputElement).disabled = true;

    //get poll id as a number
    const pollId = (document.getElementById("input-poll-id") as HTMLInputElement).value;

    //get vote value
    const voteValue = BigInt((document.getElementById("input-vote") as HTMLInputElement).value);;

    //try to find the user in the members's list
    const privateKey = BigInt((document.getElementById("input-private_key") as HTMLInputElement).value);
    const publicKey = GeneratePublicKey(privateKey);
    const invitation = BigInt((document.getElementById("input-invitation") as HTMLInputElement).value);
    const voterLeaf = GenerateMemeberLeaf(publicKey, invitation);
    const leafs: string[] = Array.isArray(pollMembers) ? pollMembers.map(m => m.leaf) : [];
    const leafIndex = leafs.findIndex(l => l === voterLeaf.toString());
    if(leafIndex >= 0){
        //generate MerkleProof
        const voteMerkleProof = ComputeMerkleProof(leafs, merkleTreeHeight, leafIndex);
        //console.log(RecomputeMerkleRootFromProof(voterLeaf, leafIndex, voteMerkleProof) == ComputeMerkleRoot(leafs, merkleTreeHeight));
        
        //generate zkProof
        try{
            //get vote
            const vote = await GenerateVote(privateKey, leafIndex, invitation, pollId, voteValue, voteMerkleProof);
            VoteSuccess("Vote's proof was generated successfully.");

            //submit proof
            try{
                const response = await (await fetch(apiURL + "/vote", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        pollId: pollId,
                        vote: vote
                    })
                })).json();
                if(response.error){
                    //failure
                    VoteFailure("Server: " + response.error);
                }
                else{
                    //success
                    VoteSuccess("Server: " + response.message);
                    return;
                }
            }catch(e : any){
                console.log(e);
                VoteFailure("Failed to submit the vote");
            }
        }
        catch(e : any){
            console.log(e);
            VoteFailure("Failed to construct the vote's proof.");
        }
    }
    else{
        VoteFailure("You are not a member of this poll.");
    }
    

    //enable
    (document.getElementById("button-vote") as HTMLButtonElement).disabled =
    (document.getElementById("input-invitation") as HTMLInputElement).disabled = 
    (document.getElementById("input-private_key") as HTMLInputElement).disabled =
    (document.getElementById("input-vote") as HTMLInputElement).disabled = false;
}




//#endregion

//================================================================
//#region Init

export function init() {
    //events
    document.getElementById("button-verify")?.addEventListener("click", ButtonVerifyPoll_click);
    document.getElementById("button-vote")?.addEventListener("click", ButtonVote_click);
    document.getElementById("input-invitation")?.addEventListener("input", ZKValue_input);
    document.getElementById("input-private_key")?.addEventListener("input", ZKValue_input);
    document.getElementById("input-vote")?.addEventListener("input", ZKValue_input);

    //autofill inputs
    const p1 = getNextURLPrivateParameter("#" + getNextURLPrivateParameter().remainder);
    const pollId = p1.parameter;
    if(pollId.length){
        (document.getElementById("input-poll-id") as HTMLInputElement).value = pollId;
        ButtonVerifyPoll_click();
    }
    const invitation = getNextURLPrivateParameter("#" + p1.remainder).parameter
    if(invitation.length)
        (document.getElementById("input-invitation") as HTMLInputElement).value = invitation;
    


}

export function destroy() {}

//#endregion