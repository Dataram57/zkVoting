//================================================================
//#region Requirements

import {poseidon1 } from "poseidon-lite";
const GeneratePublicKey = (secret: bigint): bigint => poseidon1([secret]);
const p : bigint = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

//#endregion

//================================================================
//#region IO-Interface

function GetTargetElement(event: PointerEvent): HTMLElement | null{
    const targetElement = event.target as HTMLElement | null;
    if (!targetElement) return null;

    const targetId = targetElement.getAttribute("target");
    if (!targetId) return null;

    const element = document.getElementById(targetId);
    return element;
};

async function ButtonCopyValue_click(event: PointerEvent){
  const target = GetTargetElement(event);
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    await navigator.clipboard.writeText(target.value);
  }
};


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


function ButtonRandomPrivateKey_click() {
    const input = document.getElementById("private_key") as HTMLInputElement;
    input.value = randomBigInt(254).toString();
    InputPrivateKey_input();
};

function InputPrivateKey_input(){
    const input = document.getElementById("private_key") as HTMLInputElement;
    const output = document.getElementById("public_key") as HTMLInputElement;

    try{
        if(input.value.length == 0){
            output.value = "";
            return;
        }
        const secret : bigint= BigInt(input.value);
        if(secret >= p)
            output.value = "Private Key must be lower than " + p.toString() + "!!!";
        else if(secret <= 0)
            output.value = "Private Key must be a positive integer number!!!";
        else
            output.value = GeneratePublicKey(secret).toString();
    }
    catch(error : any){
        output.value = "Private Key must be a number!!!";
    }
};


export function init() {
    //console.log(poseidon1([3n]));

    //on change event
    (document.getElementById("private_key") as HTMLInputElement)
        .addEventListener("input", InputPrivateKey_input);

    //button-copy-value
    document.querySelectorAll<HTMLElement>(".button-copy-value").forEach((element) => {
        element.addEventListener("click", ButtonCopyValue_click);
    });

    //button-randoom-bigint
    (document.getElementById("button-random-private_key") as HTMLElement)
        .addEventListener("click", ButtonRandomPrivateKey_click);

    //button-random-value
}

export function destroy() {}

//#endregion


