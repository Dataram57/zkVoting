

const p : bigint = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

//pattern_participant

function Participant_remove_click(e : Event){
    let tag = e.target as HTMLElement;
    while(tag.tagName.toLowerCase() != "tr")
        tag = tag.parentElement as HTMLElement;
    tag.remove();
}

function AddNewParticipant(){
    let tag : HTMLElement;
    tag = document.getElementById("participants") as HTMLElement;
    tag.insertAdjacentHTML("beforeend", document.getElementById("pattern-participant")?.innerText as string);

    //public key
    tag = document.getElementById("pattern-participant-public_key") as HTMLElement;
    tag.id = "";

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

export function init() {
    //pariticipants - buttons
    document.getElementById("button-add_paricipant")?.addEventListener("click", AddNewParticipant);
    document.getElementById("button-add_n_pariticipants")?.addEventListener("click", AddN_NewPariticipants);
    AddN_NewPariticipants();
    
}

export function destroy(){

}
