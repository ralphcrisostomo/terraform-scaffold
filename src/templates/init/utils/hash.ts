export function djb2Hash(input: string): string {
    const str = input.length > 1000 ? input.slice(0, 1000) : input
    let hash = 5381
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i)
        if (code >= 32 && code <= 126) {
            hash = (hash * 33 + code) % 4294967296
        }
    }
    return `${hash}`
}
