import { util } from '@aws-appsync/utils'

export function request(ctx) {
    const filter = ctx.args.filter ?? {}

    const expressionParts = []
    const expressionNames = {}
    const expressionValues = {}

    for (const key of Object.keys(filter)) {
        const value = filter[key]
        const nameKey = `#${key}`
        const valueKey = `:${key}`
        expressionParts.push(`${nameKey} = ${valueKey}`)
        expressionNames[nameKey] = key
        expressionValues[valueKey] = util.dynamodb.toDynamoDB(value)
    }

    return {
        operation: 'Scan',
        ...(expressionParts.length > 0 && {
            filter: {
                expression: expressionParts.join(' AND '),
                expressionNames,
                expressionValues,
            },
        }),
    }
}

export function response(ctx) {
    if (ctx.error) {
        util.error(ctx.error.message, ctx.error.type, '', ctx.args)
    }
    return ctx.result.items ?? null
}
