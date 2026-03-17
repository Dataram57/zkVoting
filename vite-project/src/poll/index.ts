import { apiURL } from "../config"
import { GetNextURLPrivateParameter, sha256json } from "../lib";
import { marked } from "marked";
import DOMPurify from "dompurify";

export function markdownToSafeHTML(markdown: string): string {
    const rawHTML = marked.parse(markdown, { async: false }) as string;
    return DOMPurify.sanitize(rawHTML);
}

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
    //disable buttons and get id
    (document.getElementById("button-verify") as HTMLButtonElement).disabled = true;
    const tag : HTMLInputElement = document.getElementById("input-poll-id") as HTMLInputElement;
    tag.disabled = true;
    const pollId = tag.value;

    //clear logs
    ClearCheckLogs();

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

        //fetch poll members
        const pollMembers = await (await fetch(apiURL + "/poll/" + pollId + "/members", {
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
        const pollHash = await sha256json(pollData);
        if(pollHash != pollId){
            CheckFailure("Server has altered poll's data.");
            return;
        }
        CheckSuccess("Poll's data is legit.");
        


        //fetch and verify poll's votes
    
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
    const pollId = GetNextURLPrivateParameter("#" + GetNextURLPrivateParameter().remainder).parameter;
    if(pollId.length){
        (document.getElementById("input-poll-id") as HTMLInputElement).value = pollId;
        ButtonVerifyPoll_click();
    }

}

export function destroy() {}
