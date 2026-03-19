import { getNextURLPrivateParameter, markdownToSafeHTML } from "../lib";
import { jsonToID, VerifyVote } from "../crypto";
import { Api_GetPoll, Api_GetPollMembers, Api_GetPollVotes } from "../api";

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

    //clear logs
    ClearCheckLogs();

    try{
        //fetch poll meta
        const pollMeta = await (await Api_GetPoll(pollId)).json();
        (document.getElementById("poll-description") as HTMLElement).innerHTML = markdownToSafeHTML(pollMeta.description);
        CheckSuccess("Poll's profile loaded.");
        (document.getElementById("poll-description") as HTMLButtonElement).hidden = false;

        //fetch poll members
        const pollMembers = await (await Api_GetPollMembers(pollId)).json() as { leaf: string; position: number }[];
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
            
            //fetch votes
            const pollVotesMeta = await (await Api_GetPollVotes(pollId)).json();
            
            // verify votes and build frequency map
            const pollVotes = pollVotesMeta.votes;

            // initialize a frequency map
            const voteCounts: Record<string, number> = {};

            for (const vote of pollVotes) {
                //console.log(vote);

                const isValid = await VerifyVote(
                    pollId,
                    pollData.root,
                    vote.nullifier,
                    vote.vote_value,
                    vote.proof
                );

                //console.log(isValid);

                // only count valid votes
                if (isValid) {
                    const val = vote.vote_value.toString(); // ensure key is string
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
