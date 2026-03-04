import { util } from '@aws-appsync/utils'

export function request(ctx) {
    const { payload } = ctx.args
    const id = payload.id ?? util.autoId()
    const now = util.time.nowISO8601()

    const attributeValues = {
        id: util.dynamodb.toDynamoDB(id),
        createdAt: util.dynamodb.toDynamoDB(payload.createdAt ?? now),
        updatedAt: util.dynamodb.toDynamoDB(now),
    }

    Object.keys(payload).forEach((key) => {
        const value = payload[key]
        if (
            ['id', 'createdAt', 'updatedAt'].indexOf(key) !== -1 ||
            value === undefined
        ) {
            return
        }
        attributeValues[key] = util.dynamodb.toDynamoDB(value)
    })

    return {
        operation: 'PutItem',
        key: util.dynamodb.toMapValues({ id }),
        attributeValues,
    }
}

export function response(ctx) {
    if (ctx.error) {
        util.error(ctx.error.message, ctx.error.type, '', ctx.args)
    }
    ctx.stash.result = ctx.result
    return ctx.result
}
