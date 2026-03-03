//================================================================
//#region Window and page switching

let tagPageContent = null;

window.onload = async () => {    
    //get tags
    tagPageContent = document.getElementsByTagName('main')[0];

    //Update page
    await LoadPage(null, {skipHistory: true});
};

window.onpopstate = () => {
    //Load previous (current cause the window changes the URL automatically) page
    LoadPage(null, {skipHistory: true});
};

//#endregion

//================================================================
//#region Page Managment

const GetNextURLPrivateParameter = (url) => {
    if(!url)
        url = window.location.href;
    let i = url.indexOf('#');
    if(i > -1){
        url = url.substring(i + 1);
        i = url.indexOf('#');
        if(i > -1)
            return {
                parameter: url.substring(0, i),
                raminder: url.substring(i + 1)
            };
        return {
            parameter: url,
            remainder: ''
        };
    }
    return {
        parameter: '',
        remainder: ''
    };
};

const FetchContent = (url) => {
    const options = {};
    //{ cache: "force-cache" };
    //return promise
    return new Promise((resolve) => {
        try{
            fetch(url, options).then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                response.text().then(content => {
                    resolve(content);
                })
                .catch(()=>{
                    resolve(null);
                });
            })
            .catch(e=>{
                resolve(null);
            });
        }
        catch(e){
            resolve(null);
        }
    });
};

//#endregion

//================================================================
//#region Page Managment

const LoadPage = async (pageName, options) => {
    //skip if window hasn't loaded
    if(!tagPageContent)
        return;

    //history
    if(!options || !options.skipHistory)
        window.history.pushState(Math.random(), '', "#" + pageName);

    //skip empty pages
    if(!pageName)
        pageName = GetNextURLPrivateParameter().parameter;

    //skip empty page
    if(pageName.length <= 0)
        return;

    //get pageSource
    const pageSource = "./" + pageName;

    //update url
    window.location.hash = pageName;

    //fetch HTML, CSS, JS-ESM module and apply
    const results = await Promise.all([
        FetchContent(pageSource + '/index.html')
        ,FetchContent(pageSource + '/index.css')
        ,FetchJSModule(pageSource + '/index.js')
    ]);
    SetPageContent(results[0], results[1]);
};

let pageJSModule = null;
const FetchJSModule = async (url) => {
    console.log("call");
    //"destroy" current
    if(pageJSModule)
        pageJSModule.destroy?.();
    //load/fetch
    try{
        pageJSModule = await import(url);
    }
    catch(e){
        console.error(e);
        pageJSModule = null;
    }
};

const SetPageContent = (html, css) => {
    //apply data
    tagPageContent.innerHTML = html;
    if(css)
        SetPageCSS(css);
    //init js
    if(pageJSModule)
        pageJSModule.init?.(tagPageContent);
};


const SetPageCSS = (code) => {
    //remove old element
    let tag = document.getElementById('tagPageCSS');
    if(tag)
        tag.remove();
    //create new element
    tag = document.createElement('style');
    tag.id = 'tagPageCSS';
    tag.innerHTML = code;;
    tagPageContent.appendChild(tag);
};


//#endregion
