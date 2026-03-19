import crypto from "crypto";

export const Hash = (data) =>
    crypto.createHash("sha256").update(data).digest("hex");