import { util } from '@aws-appsync/utils'

export function request(ctx) {
    const { payload } = ctx.args

    const tableName = payload[0].tableName
    const deleteRequests = payload.map((item) =>
        util.dynamodb.toMapValues({
            userId: item.userId,
            id: item.id,
        })
    )

    return {
        operation: 'BatchDeleteItem',
        tables: {
            [tableName]: deleteRequests,
        },
    }
}

export function response(ctx) {
    if (ctx.error) {
        util.error(ctx.error.message, ctx.error.type, '', ctx.args)
    }
    return []
}
