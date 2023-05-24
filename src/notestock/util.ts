export function getPostIdFromUrl(url: string) {
    const id = url.split("/").pop();
    if (!id) {
        throw new Error("url is invalid");
    }
    return id;
}

export function getAcctFromAttributedTo(attributedTo: string) {
    const acct = attributedTo.split("/").pop();
    if (!acct) {
        throw new Error("attributedTo is invalid");
    }
    return acct;
}
