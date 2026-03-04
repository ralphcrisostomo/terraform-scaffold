import { util } from '@aws-appsync/utils'

export function request(ctx) {
    return {
        operation: 'GetItem',
        key: util.dynamodb.toMapValues({
            {{FIELD}}:
                ctx.args.{{FIELD}} ||
                ctx.source.{{FIELD}} ||
                ctx.stash.{{FIELD}},
        }),
    }
}

export function response(ctx) {
    if (ctx.error) {
        util.error(ctx.error.message, ctx.error.type)
    }
    return ctx.result
}
