import { djb2Hash } from '~~/utils/hash'

interface GraphqlResponse<TData> {
    data?: TData
    errors?: Array<{ message: string }>
}

interface UseGraphqlOptions {
    key: string
    token?: string
    immediate?: boolean
}

function deepParseJsonStrings(obj: unknown): unknown {
    if (typeof obj === 'string') {
        const trimmed = obj.trim()
        if (
            (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']'))
        ) {
            try {
                return deepParseJsonStrings(JSON.parse(trimmed))
            } catch {
                return obj
            }
        }
        return obj
    }
    if (Array.isArray(obj)) return obj.map(deepParseJsonStrings)
    if (obj !== null && typeof obj === 'object') {
        const result: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(obj)) {
            result[key] = deepParseJsonStrings(value)
        }
        return result
    }
    return obj
}

export function sanitizeGraphqlQuery(query: string) {
    return query.replace(/\s+/g, ' ').trim()
}

export async function graphqlMutate<
    TData,
    TVariables extends Record<string, unknown> = Record<string, unknown>,
>(
    query: string,
    variables: TVariables,
    options: { token?: string } = {}
): Promise<{ data?: TData; errors?: Array<{ message: string }> }> {
    const config = useRuntimeConfig()
    const endpoint = config.public.appSyncEndpoint as string

    const cleanVariables = JSON.parse(JSON.stringify(variables))
    const hash = djb2Hash(JSON.stringify(deepParseJsonStrings(cleanVariables)))

    const raw = await $fetch<{
        data?: TData
        errors?: Array<{ message: string }>
    }>(endpoint, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-hbm-hash': hash,
            ...(options.token
                ? { Authorization: `Bearer ${options.token}` }
                : {}),
        },
        body: {
            query: sanitizeGraphqlQuery(query),
            variables: cleanVariables,
        },
    })

    return deepParseJsonStrings(raw) as {
        data?: TData
        errors?: Array<{ message: string }>
    }
}

export default function useGraphql<
    TData,
    TVariables extends Record<string, unknown> = Record<string, unknown>,
>(query: string, variables: TVariables, options: UseGraphqlOptions) {
    const config = useRuntimeConfig()
    const endpoint = config.public.appSyncEndpoint as string

    const cleanVariables = JSON.parse(JSON.stringify(variables))
    const hash = djb2Hash(JSON.stringify(deepParseJsonStrings(cleanVariables)))

    return useFetch<GraphqlResponse<TData>>(endpoint, {
        method: 'POST',
        key: options.key,
        immediate: options.immediate ?? true,
        watch: false,
        headers: {
            'content-type': 'application/json',
            'x-hbm-hash': hash,
            ...(options.token
                ? { Authorization: `Bearer ${options.token}` }
                : {}),
        },
        body: {
            query: sanitizeGraphqlQuery(query),
            variables: cleanVariables,
        },
        transform: (raw) => deepParseJsonStrings(raw) as GraphqlResponse<TData>,
    })
}
