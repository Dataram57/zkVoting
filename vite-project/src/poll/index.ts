import { apiURL } from "../config"
import { GetNextURLPrivateParameter } from "../lib";
import { marked } from "marked";
import DOMPurify from "dompurify";

export function markdownToSafeHTML(markdown: string): string {
    const rawHTML = marked.parse(markdown, { async: false }) as string;
    return DOMPurify.sanitize(rawHTML);
}

async function ButtonVerifyPoll_click(e : Event | null = null){
    //disable buttons
    (document.getElementById("button-verify") as HTMLButtonElement).disabled = true;
    const tag : HTMLInputElement = document.getElementById("input-poll-id") as HTMLInputElement;
    tag.disabled = true;
    const pollId = tag.value;

    try{
        const response = await (await fetch(apiURL + "/poll/" + pollId, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        })).json();

        console.log(response);
        (document.getElementById("poll-description") as HTMLElement).innerHTML = markdownToSafeHTML(response.description);
    }
    catch(e : any){
        console.log(e);
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
