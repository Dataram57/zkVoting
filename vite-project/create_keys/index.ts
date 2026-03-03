//================================================================
//#region Requirements
console.log(777);
import * as mod from "poseidon-lite";
console.log(666, mod);

//#endregion

//================================================================
//#region IO-Interface

export function init(container: HTMLElement) : void {
    console.log("init");
}

export function destroy() : void {
    console.log("destroy");
}

//#endregion


