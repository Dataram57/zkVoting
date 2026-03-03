//================================================================
//#region Requirements

import {poseidon1 } from "poseidon-lite";
const GeneratePublicKey = (secret: bigint): bigint => poseidon1([secret]);

//#endregion

//================================================================
//#region IO-Interface


export function init(container : HTMLElement) {
    console.log(666);
    //console.log(poseidon1([3n]));

    const input = document.getElementById("private_key") as HTMLInputElement;
    const output = document.getElementById("public_key") as HTMLInputElement;

    //add event
    input.addEventListener("input", (event) => {
        try{
            const secret : bigint= BigInt((event.target as HTMLInputElement).value);
            output.value = GeneratePublicKey(secret).toString();
        }
        catch(error : any){
            output.value = "Private Key is in wrong format!!!";
        }
    });
}

export function destroy() {
    console.log("destroy");
}

//#endregion


