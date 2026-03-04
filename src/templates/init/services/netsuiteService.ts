import * as crypto from 'node:crypto'

export type NetsuiteMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type NetsuiteConfig = {
    realm: string
    consumerKey: string
    consumerSecret: string
    tokenId: string
    tokenSecret: string
}

export type NetsuiteFetcher = <T = unknown>(
    url: string,
    options: {
        method: NetsuiteMethod
        body?: unknown
        headers?: Record<string, string>
    }
) => Promise<T>

function generateNonce(length = 16) {
    return crypto.randomBytes(length).toString('hex')
}

function getTimestamp() {
    return Math.floor(Date.now() / 1000)
}

function percentEncode(value: string) {
    return encodeURIComponent(value)
        .replace(/!/g, '%21')
        .replace(/\*/g, '%2A')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/'/g, '%27')
}

function getOAuthParams(config: NetsuiteConfig) {
    return {
        oauth_consumer_key: config.consumerKey,
        oauth_token: config.tokenId,
        oauth_signature_method: 'HMAC-SHA256',
        oauth_timestamp: getTimestamp().toString(),
        oauth_nonce: generateNonce(),
        oauth_version: '1.0',
    }
}

function getSignatureBaseString(
    method: NetsuiteMethod,
    url: string,
    oauthParams: Record<string, string>
) {
    const urlObj = new URL(url)
    const urlBase = urlObj.origin + urlObj.pathname
    const allParams: [string, string][] = []

    for (const [key, value] of Object.entries(oauthParams)) {
        allParams.push([key, value])
    }

    urlObj.searchParams.forEach((value, key) => {
        allParams.push([key, value])
    })

    allParams.sort((a, b) => {
        if (a[0] === b[0]) {
            return a[1].localeCompare(b[1])
        }
        return a[0].localeCompare(b[0])
    })

    const encodedParams = allParams
        .map(([key, value]) => `${percentEncode(key)}=${percentEncode(value)}`)
        .join('&')

    const encodedUrl = percentEncode(urlBase)
    const encodedParamsString = percentEncode(encodedParams)

    return `${method.toUpperCase()}&${encodedUrl}&${encodedParamsString}`
}

function getSignature(signatureBaseString: string, config: NetsuiteConfig) {
    const signingKey = `${percentEncode(config.consumerSecret)}&${percentEncode(
        config.tokenSecret
    )}`
    return crypto
        .createHmac('sha256', signingKey)
        .update(signatureBaseString)
        .digest('base64')
}

function buildAuthHeader(
    oauthParams: Record<string, string>,
    signature: string,
    realm: string
) {
    const fullParams: Record<string, string> = {
        ...oauthParams,
        oauth_signature: signature,
    }
    const headerParams = Object.entries(fullParams)
        .map(
            ([key, value]) => `${percentEncode(key)}="${percentEncode(value)}"`
        )
        .join(',')
    return `OAuth realm="${realm}",${headerParams}`
}

function getNetsuiteOauthHeader(
    method: NetsuiteMethod,
    url: string,
    config: NetsuiteConfig
) {
    const oauthParams = getOAuthParams(config)
    const baseString = getSignatureBaseString(method, url, oauthParams)
    const signature = getSignature(baseString, config)
    return buildAuthHeader(oauthParams, signature, config.realm)
}

export function createNetsuiteClient(
    config: NetsuiteConfig,
    fetcher: NetsuiteFetcher
) {
    return {
        netsuiteRequest: async function netsuiteRequest<T = unknown>(
            method: NetsuiteMethod,
            url: string,
            data?: unknown,
            customHeaders?: Record<string, string>
        ): Promise<T> {
            const headers: Record<string, string> = {
                Authorization: getNetsuiteOauthHeader(method, url, config),
                'Content-Type': 'application/json',
                ...(customHeaders ?? {}),
            }

            return fetcher<T>(url, {
                method,
                body: data,
                headers,
            })
        },
    }
}
