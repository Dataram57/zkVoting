
let threadGenerator : number = 0;

export function SignalNewThread(){
    threadGenerator++;
}

export class PageThread{
    threadNumber : number = threadGenerator;

    constructor(){}

    CheckExit() : boolean{
        return threadGenerator != this.threadNumber;
    }
}

/*
//Usage:

    //===========================================
    //capture thread
    const thread : PageThread = new PageThread();
    //===========================================

    //============================
    //check exit
    if(thread.CheckExit()) return;
    //============================

*/