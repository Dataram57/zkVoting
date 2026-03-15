

const p : bigint = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const maxParticipants : bigint = 2n ** 8n;

//pattern_participant

function Participant_remove_click(e : Event){
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
            input.classList.add("error");
        else
            input.classList.remove("error");
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



export function init() {
    //pariticipants - buttons
    document.getElementById("button-add_paricipant")?.addEventListener("click", AddNewParticipant);
    document.getElementById("button-add_n_pariticipants")?.addEventListener("click", AddN_NewPariticipants);
    AddN_NewPariticipants();

    //
    
}

export function destroy(){

}
