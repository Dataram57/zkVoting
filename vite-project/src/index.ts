const globalConfig = {
    p: 21888242871839275222246405745257275088548364400416034343698204186575808495617n,
    MerkleTreeHeight: 8n,
    apiURL: "http://localhost:3000",
};

//================================================================
//#region Window and page switching

let tagPageContent: HTMLElement | null = null;

window.onload = async (): Promise<void> => {
    // get <main> tag
    tagPageContent = document.getElementsByTagName('main')[0] as HTMLElement;

    // Update page
    await LoadPage(null, { skipHistory: true });
};

window.onpopstate = (): void => {
    LoadPage(null, { skipHistory: true });
};

//#endregion

//================================================================
//#region Page Management - URL Helpers

interface URLParameterResult {
    parameter: string;
    remainder: string;
}

const GetNextURLPrivateParameter = (url?: string): URLParameterResult => {
    if (!url) url = window.location.href;

    let i = url.indexOf('#');
    if (i > -1) {
        url = url.substring(i + 1);
        i = url.indexOf('#');

        if (i > -1) {
            return {
                parameter: url.substring(0, i),
                remainder: url.substring(i + 1)
            };
        }

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

const FetchContent = async (url: string): Promise<string | null> => {
    const options: RequestInit = {};

    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        return await response.text();
    } catch {
        return null;
    }
};

//#endregion

//================================================================
//#region Page Management

interface LoadPageOptions {
    skipHistory?: boolean;
}

const LoadPage = async (
    pageName: string | null,
    options?: LoadPageOptions
): Promise<void> => {

    if (!tagPageContent) return;

    // History
    if (!options?.skipHistory) {
        window.history.pushState(Math.random(), '', "#" + (pageName ?? ''));
    }

    // If empty, get from URL
    let pageAddress : string | null = pageName;
    if (!pageName) {
        pageName = GetNextURLPrivateParameter().parameter;
        pageAddress = GetNextURLPrivateParameter().remainder;
        if(pageAddress.length)
            pageAddress = pageName + "#" + pageAddress;
        else
            pageAddress = pageName;
    }

    if (!pageName || pageName.length <= 0) return;

    const pageSource = "./" + pageName;

    window.location.hash = pageAddress as string;

    const results = await Promise.all([
        FetchContent(pageSource + '/index.html'),
        FetchContent(pageSource + '/index.css'),
    ]);
    await FetchJSModule(pageName);

    SetPageContent(results[0], results[1]);
};

interface PageModule {
    init?: (container: HTMLElement, config : any) => void;
    destroy?: () => void;
}

const pageModules = import.meta.glob("../src/*/index.ts");

let pageJSModule: PageModule | null = null;

const FetchJSModule = async (pageName: string): Promise<void> => {
    if (pageJSModule?.destroy) {
        pageJSModule.destroy();
    }

    const modulePath = `./${pageName}/index.ts`;
    const loader = pageModules[modulePath];

    if (!loader) {
        pageJSModule = null;
        return;
    }

    try {
        pageJSModule = (await loader()) as PageModule;
    } catch (e) {
        console.error(e);
        pageJSModule = null;
    }
};

const SetPageContent = (
    html: string | null,
    css: string | null
): void => {
    if (!tagPageContent || !html) return;

    tagPageContent.innerHTML = html;

    if (css) {
        SetPageCSS(css);
    }

    if (pageJSModule?.init) {
        pageJSModule.init(tagPageContent, globalConfig);
    }
};

const SetPageCSS = (code: string): void => {
    let tag = document.getElementById('tagPageCSS');
    if (tag) tag.remove();

    tag = document.createElement('style');
    tag.id = 'tagPageCSS';
    tag.textContent = code;

    tagPageContent?.appendChild(tag);
};

//#endregion

//================================================================
//#region Export to window

declare global {
  interface Window {
    LoadPage: typeof LoadPage;
  }
}

window.LoadPage = LoadPage;

//#endregion