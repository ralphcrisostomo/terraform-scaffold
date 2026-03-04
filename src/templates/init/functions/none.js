export function request(ctx) {
    // NONE data source – nothing to send
    return {}
}
export function response(ctx) {
    // Make userId available to child resolvers as ctx.source.userId
    return { userId: ctx.args.userId }
}
