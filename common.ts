export function sample(length: number, bytes = 32) {
    return Array.from({ length }, function () {
        return crypto.getRandomValues(new Uint8Array(bytes));
    });
}

