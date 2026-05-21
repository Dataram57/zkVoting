
export const p : bigint = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
export const merkleTreeHeight : bigint = 8n;
export const poll_max_description_length = 10000;
export const poll_max_members_count = Number(2n ** merkleTreeHeight);
export const apiURL : string = 
    (typeof(window) != "undefined" && window.location.hostname == "localhost")
        ? "http://localhost:3000/api"
        : "https://reptillian-zkvoting-api.vercel.app/api";