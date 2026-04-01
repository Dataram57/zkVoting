
import { randomBigInt, GenerateMemeberLeaf } from "../crypto";
import { p, merkleTreeHeight } from "../config";
import { Api_CreatePoll } from "../api";
import { PageThread } from "../PageThread";
import { poll_max_description_length } from "../config.server";

const maxParticipants : bigint = 1n << merkleTreeHeight;


let isBlocked : boolean = false;
let isPushing : boolean = false;
let errorCount: number = 0;


//pattern_participant
function Participant_remove_click(e : Event){
    //block if isBlocked
    if(isBlocked)
        return; 

    //get tag
    let tag = e.target as HTMLElement;
    while(tag.tagName.toLowerCase() != "tr")
        tag = tag.parentElement as HTMLElement;

    //remove also useless tbodies.
    let tag_new: HTMLElement;
    while(tag.tagName.toLowerCase() != "table"){
        tag_new = tag.parentElement as HTMLElement;
        tag.remove();
        tag = tag_new;
    }
}

function Participant_input(e : Event){
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

//description
function Description_input(e : Event){
    const input : HTMLInputElement = e.target as HTMLInputElement;
    const wasError : boolean = input.classList.contains("error");
    const isError : boolean = input.value.length > poll_max_description_length;
    
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


function AddNewInvitation(pk: bigint, link: string, linkText: string){
    let tag : HTMLElement;
    tag = document.getElementById("invitations") as HTMLElement;
    tag.insertAdjacentHTML("beforeend", document.getElementById("pattern-invitation")?.innerText as string);

    //public key
    tag = document.getElementById("pattern-invitation-public_key") as HTMLElement;
    tag.id = "";
    (tag as HTMLInputElement).value = pk.toString();

    //link
    tag = document.getElementById("pattern-invitation-link") as HTMLElement;
    tag.id = "";
    (tag as HTMLLinkElement).href = link;
    tag.innerText = linkText;
}

function AddNewParticipant(){
    let tag : HTMLElement;
    tag = document.getElementById("participants") as HTMLElement;
    
    //block if too many children
    if(tag.children.length - 1 >= maxParticipants)
        return;

    //
    tag.insertAdjacentHTML("beforeend", document.getElementById("pattern-participant")?.innerText as string);

    //public key
    tag = document.getElementById("pattern-participant-public_key") as HTMLElement;
    tag.id = "";
    tag.addEventListener("input", Participant_input);

    //remove
    tag = document.getElementById("pattern-participant-remove") as HTMLElement;
    tag.id = "";
    tag.addEventListener("click", Participant_remove_click);
}

function AddN_NewPariticipants(){
    let i : number = Number((document.getElementById("n-participants") as HTMLInputElement).value);
    while(i-- > 0)
        AddNewParticipant();
}


function DisplayError(message : string){
    const tag : HTMLElement = document.getElementById("hosting-result-failure") as HTMLElement;
    tag.innerText = message;
    tag.classList.remove("show");
    tag.classList.add("show");
}

function DisplaySuccess(){
    let tag : HTMLElement = document.getElementById("hosting-result-failure") as HTMLElement;
    tag.classList.remove("show");
    tag = document.getElementById("hosting-result-success") as HTMLElement;
    tag.classList.add("show");
}

function SetGUIDisabled(dis: boolean) {
    (document.getElementById("button-host_poll") as HTMLButtonElement).disabled = dis;
    (document.getElementById("button-add_paricipant") as HTMLButtonElement).disabled = dis;
    (document.getElementById("button-add_n_pariticipants") as HTMLButtonElement).disabled = dis;
    (document.getElementById("n-participants") as HTMLInputElement).disabled = dis;
    (document.getElementById("poll-description") as HTMLInputElement).disabled = dis;

    document.querySelectorAll<HTMLInputElement>("#participants input")
        .forEach(input => input.disabled = dis);
}

async function HostPoll(){
    //check errors
    if(errorCount != 0){
        alert("There are " + errorCount.toString() + " mistakes in the poll.");
        return;
    }

    //check if empty field was found
    let emptyFieldsErrorCount : number = 0;
    document.getElementById("participants")?.querySelectorAll<HTMLInputElement>('input[type="text"]')?.forEach(input => {
        if(input.value.length == 0)
            emptyFieldsErrorCount++;
    });
    if(emptyFieldsErrorCount > 0){
            alert((emptyFieldsErrorCount > 1) ? ("There are " + emptyFieldsErrorCount.toString() + " empty member public keys.") : "There is an empty member public key.");
        return;
    }

    //mark pushing
    isPushing = true;
    isBlocked = true;
    SetGUIDisabled(true);

    //construct data
    const members : string[] = [];  //bigints can't be serialised in json
    const codes: { pk: bigint; code: bigint }[] = [];
    const rows = document.querySelectorAll<HTMLTableRowElement>("#participants tr");
    const seen = new Set<string>(); //used for checking duplicate members
    for (let index = 1; index < rows.length; index++) {
        const row = rows[index];

        const pk_text = row.querySelector<HTMLInputElement>('input[type="text"]')?.value ?? "";
        const pk: bigint = pk_text.length === 0 ? 0n : BigInt(pk_text);

        let leaf: string;

        if (row.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked) {
            const code = randomBigInt(254);
            leaf = GenerateMemeberLeaf(pk, code).toString();

            codes.push({ pk, code });
        } else {
            leaf = GenerateMemeberLeaf(pk).toString();
        }

        if (seen.has(leaf)) {
            //alert
            alert("Duplicate participant detected!");
            
            //re-enable editing
            isPushing = false;
            isBlocked = false;
            SetGUIDisabled(false);

            //end
            return;
        }

        seen.add(leaf);
        members.push(leaf);
    }

    //===========================================
    //capture thread
    const thread : PageThread = new PageThread();
    //===========================================

    //form query
    try{
        const response = await Api_CreatePoll(
            (document.getElementById("poll-description") as HTMLInputElement).value,
            members
        );
        //============================
        //check exit
        if(thread.CheckExit()) return;
        //============================
        
        
        const data = await response.json();
        //============================
        //check exit
        if(thread.CheckExit()) return;
        //============================
        if(!data.id)
            throw 0;

        //url for links
        const appBaseUrl = window.location.href.substring(0, window.location.href.length - window.location.hash.length);
        const pollLink = appBaseUrl + "#poll#" + data.id;
        const voteLink = appBaseUrl + "#vote#" + data.id;

        //display special invites
        if(codes.length)
            codes.forEach(invite => {
                AddNewInvitation(invite.pk, voteLink + "#" + invite.code.toString(), invite.code.toString());
            });
        else{
            //hide if no invitations
            (document.getElementById("invitations") as HTMLElement).hidden = true;
            (document.getElementById("invitations-header") as HTMLElement).hidden = true;
        }

        //link
        let tag = document.getElementById("poll-link-results") as HTMLLinkElement;
        tag.href = pollLink;
        tag.innerText = tag.href;

        tag = document.getElementById("poll-link-voting") as HTMLLinkElement;
        tag.href = voteLink;
        tag.innerText = tag.href;

        //mark success
        DisplaySuccess();
    }
    catch(error : any){
        isPushing = false;
        DisplayError("Error: " + error.toString());

        //re-enable clicking at the host_poll button
        (document.getElementById("button-host_poll") as HTMLButtonElement).disabled = false;
    }
    console.log(isPushing);
}




export function init() {
    //reset vars
    isBlocked = false;
    isPushing = false;
    errorCount = 0;

    //pariticipants - buttons
    document.getElementById("button-add_paricipant")?.addEventListener("click", AddNewParticipant);
    document.getElementById("button-add_n_pariticipants")?.addEventListener("click", AddN_NewPariticipants);
    AddN_NewPariticipants();

    //description
    document.getElementById("poll-description")?.addEventListener("input", Description_input);

    //host poll
    document.getElementById("button-host_poll")?.addEventListener("click", HostPoll);
    
}

export function destroy(){

}
