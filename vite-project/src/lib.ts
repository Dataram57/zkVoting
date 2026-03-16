interface URLParameterResult {
    parameter: string;
    remainder: string;
}

export function GetNextURLPrivateParameter(url?: string): URLParameterResult {
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