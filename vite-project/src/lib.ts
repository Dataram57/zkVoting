
import { marked } from "marked";
import DOMPurify from "dompurify";

interface URLParameterResult {
    parameter: string;
    remainder: string;
}

export function getNextURLPrivateParameter(url?: string): URLParameterResult {
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


export async function sha256json<T>(obj: T): Promise<string> {
    const data = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(data);

    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}


export function markdownToSafeHTML(markdown: string): string {
    const rawHTML = marked.parse(markdown, { async: false }) as string;
    return DOMPurify.sanitize(rawHTML);
}
