//================================================================
//#region Window and page switching

let tagPageContent = null;

window.onload = async () => {    
    //get tags
    tagPageContent = document.getElementsByTagName('main')[0];

    //Update page
    await UpdatePage();
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

const UpdatePage = async (pageName) => {
    //skip if window hasn't loaded
    if(!tagPageContent)
        return;

    //get pageName
    if(!pageName)
        pageName = "./" + GetNextURLPrivateParameter().parameter;
    //make it all local
    pageName = "./" + pageName;
    
    //skip empty page
    if(pageName.length <= 0)
        return;

    //fetch HTML, CSS, JS and apply
    const results = await Promise.all([
        FetchContent(pageName + '/index.html')
        ,FetchContent(pageName + '/index.css')
        ,FetchJSModule(pageName + '/index.js')
    ]);
    SetPageContent(results[0], results[1]);
};

let pageJSModule = null;
const FetchJSModule = async (url) => {
    //"destroy" current
    if(pageJSModule)
        pageJSModule.destroy?.();
    //load/fetch
    try{
        pageJSModule = await import(url);
    }
    catch(e){
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
