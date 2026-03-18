
import { GenerateMemeberLeaf, ComputeMerkleRoot } from "../crypto";
import { p, merkleTreeHeight, apiURL } from "../config";

const maxParticipants : bigint = 1n << merkleTreeHeight;


let isBlocked : boolean = false;
let isPushing : boolean = false;
let errorCount: number = 0;


function randomBigInt(bits: number): bigint {
    const bytes = Math.ceil(bits / 8);
    const buffer = new Uint8Array(bytes);
    crypto.getRandomValues(buffer);

    let result = 0n;
    for (const byte of buffer) {
        result = (result << 8n) | BigInt(byte);
    }

    return result % p;
}

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

async function HostPoll(){
    //check errors
    if(errorCount != 0){
        alert("There are " + errorCount.toString() + " mistakes in the poll.");
        return;
    }

    //mark pushing
    isPushing = true;
    isBlocked = true;
    (document.getElementById("button-host_poll") as HTMLButtonElement).disabled = true;
    (document.getElementById("button-add_paricipant") as HTMLButtonElement).disabled = true;
    (document.getElementById("button-add_n_pariticipants") as HTMLButtonElement).disabled = true;
    (document.getElementById("n-participants") as HTMLButtonElement).disabled = true;
    (document.getElementById("poll-description") as HTMLButtonElement).disabled = true;
    document.getElementById("participants")?.querySelectorAll<HTMLInputElement>("input")?.forEach(input => {
        input.disabled = true;
    });

    //construct data
    const members : string[] = [];  //bigints can't be serialised in json
    const codes: { pk: bigint; code: bigint }[] = [];
    document.querySelectorAll<HTMLTableRowElement>("#participants tr").forEach((row, index) => {
        if (index === 0) return;

        const pk_text : string = row.querySelector<HTMLInputElement>('input[type="text"]')?.value as string;
        if(pk_text.length){
            const pk : bigint = (pk_text.length == 0) ? 0n : BigInt(pk_text);

            if(row.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked){
                const code = randomBigInt(254);
                members.push(GenerateMemeberLeaf(pk, code).toString());
                codes.push({
                    pk: pk,
                    code: code
                });
            }
            else    
                members.push(GenerateMemeberLeaf(pk).toString());
        }
        else
            members.push((0n).toString());
    });

    //form query
    try{
        const response = await fetch(apiURL + "/create_poll", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                root: ComputeMerkleRoot(members, merkleTreeHeight).toString(),
                members: members,
                description: (document.getElementById("poll-description") as HTMLInputElement).value
            })
        });
        const data = await response.json();
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

    //host poll
    document.getElementById("button-host_poll")?.addEventListener("click", HostPoll);
    
}

export function destroy(){

}
