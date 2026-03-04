import { util } from '@aws-appsync/utils'

export function request(ctx) {
    const {{FIELD}} = ctx.args.{{FIELD}} || ctx.source.{{FIELD}} || ctx.stash.{{FIELD}}
    return {
        operation: 'Query',
        index: '{{INDEX}}',
        query: {
            expression: '#{{FIELD}} = :{{FIELD}}',
            expressionNames: {
                '#{{FIELD}}': '{{FIELD}}',
            },
            expressionValues: {
                ':{{FIELD}}': util.dynamodb.toDynamoDB({{FIELD}}),
            },
        },
    }
}

export function response(ctx) {
    if (ctx.error) {
        util.error(ctx.error.message, ctx.error.type, '', ctx.args)
    }
    return ctx.result.items ?? null
}
