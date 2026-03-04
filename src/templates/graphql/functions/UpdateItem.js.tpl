import { util } from '@aws-appsync/utils'

export function request(ctx) {
    const { payload } = ctx.args
    const id = payload.id
    const now = util.time.nowISO8601()

    if (!id) {
        util.error("Missing 'id' in payload for update operation", 'BadRequest')
    }

    const expressionParts = []
    const expressionNames = {}
    const expressionValues = {}

    // Always update updatedAt
    expressionParts.push('#updatedAt = :updatedAt')
    expressionNames['#updatedAt'] = 'updatedAt'
    expressionValues[':updatedAt'] = util.dynamodb.toDynamoDB(now)

    Object.keys(payload).forEach((key) => {
        const value = payload[key]
        if (
            ['id', 'createdAt', 'updatedAt'].includes(key) ||
            value === undefined
        ) {
            return
        }

        const nameKey = `#${key}`
        const valueKey = `:${key}`

        expressionParts.push(`${nameKey} = ${valueKey}`)
        expressionNames[nameKey] = key
        expressionValues[valueKey] = util.dynamodb.toDynamoDB(value)
    })

    return {
        operation: 'UpdateItem',
        key: util.dynamodb.toMapValues({ id }),
        update: {
            expression: 'SET ' + expressionParts.join(', '),
            expressionNames,
            expressionValues,
        },
    }
}

export function response(ctx) {
    if (ctx.error) {
        util.error(ctx.error.message, ctx.error.type, '', ctx.args)
    }
    ctx.stash.result = ctx.result
    return ctx.result
}
