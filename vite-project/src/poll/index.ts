import { getNextURLPrivateParameter, markdownToSafeHTML } from "../lib";
import { VerifyPollFull, VerifyPollFullResult, VerifyVote, type VoteSubmission } from "../crypto";
import { Api_GetPoll, Api_GetPollMembersAll, Api_GetPollVotesAll } from "../api";
import { PageThread } from "../PageThread";

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
    (document.getElementById("panel-results") as HTMLButtonElement).hidden = true;
    (document.getElementById("button-verify") as HTMLButtonElement).disabled = true;
    const tag : HTMLInputElement = document.getElementById("input-poll-id") as HTMLInputElement;
    tag.disabled = true;
    const pollId = tag.value;

    //===========================================
    //capture thread
    const thread : PageThread = new PageThread();
    //===========================================

    //clear logs
    ClearCheckLogs();

    try{
        //fetch poll meta
        const pollMeta = await Api_GetPoll(pollId);

        //============================
        //check exit
        if(thread.CheckExit()) return;
        //============================

        //update view
        (document.getElementById("poll-description") as HTMLElement).innerHTML = markdownToSafeHTML(pollMeta.description);
        CheckSuccess("Poll's profile loaded.");
        (document.getElementById("poll-description") as HTMLButtonElement).hidden = false;

        //fetch poll members
        const pollMembers = await Api_GetPollMembersAll(pollId);
        
        //============================
        //check exit
        if(thread.CheckExit()) return;
        //============================

        //update view
        CheckSuccess("Poll's members loaded.");

        //verify poll
        const verificationResult = await VerifyPollFull(pollId, pollMeta, pollMembers);

        //============================
        //check exit
        if(thread.CheckExit()) return;
        //============================

        //check verification result
        switch(verificationResult){
            case VerifyPollFullResult.different_merkle_root:
                CheckFailure("Server has provided members that doesn't belong to this poll.");
                break;
            case VerifyPollFullResult.different_id:
                CheckFailure("Server has altered poll's data.");
                break;
            case VerifyPollFullResult.correct:
                CheckSuccess("Poll's data is legit.");
            
                //fetch votes
                const pollVotes = await Api_GetPollVotesAll(pollId);

                //============================
                //check exit
                if(thread.CheckExit()) return;
                //============================
                

                // initialize a frequency map
                const voteCounts: Record<string, number> = {};

                for (const vote of pollVotes) {
                    //console.log(vote);

                    const isValid = await VerifyVote(vote, pollMeta);

                    //============================
                    //check exit
                    if(thread.CheckExit()) return;
                    //============================

                    //console.log(isValid);

                    // only count valid votes
                    if (isValid) {
                        const val = vote.vote_value; // ensure key is string
                        voteCounts[val] = (voteCounts[val] || 0) + 1;
                    }
                }

                // print stats
                if(Object.keys(voteCounts).length > 0){
                    //show panel
                    (document.getElementById("panel-results") as HTMLButtonElement).hidden = false;

                    //clear table
                    const table = document.getElementById("table-stats") as HTMLElement;
                    while (table.children.length > 1) {
                        table.removeChild(table.lastChild as Node);
                    }

                    //add records
                    const pattern = document.getElementById("pattern-stats-row")?.innerText as string;
                    for (const [option, count] of Object.entries(voteCounts)) {
                        // clone template
                        table.insertAdjacentHTML("beforeend", pattern);

                        // fill option
                        const optionEl = table.querySelector("#pattern-stats-row-option") as HTMLElement;
                        optionEl.id = "";
                        optionEl.innerText = option.toString();

                        // fill count
                        const countEl = table.querySelector("#pattern-stats-row-count") as HTMLElement;
                        countEl.id = "";
                        countEl.innerText = count.toString();
                
                    }
                }
                break;
            default:
                CheckFailure("Unknown Error.");
                break;
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



export function init() {
    //events
    document.getElementById("button-verify")?.addEventListener("click", ButtonVerifyPoll_click);

    //autofill inputs
    const pollId = getNextURLPrivateParameter("#" + getNextURLPrivateParameter().remainder).parameter;
    if(pollId.length){
        (document.getElementById("input-poll-id") as HTMLInputElement).value = pollId;
        ButtonVerifyPoll_click();
    }

}

export function destroy() {}
