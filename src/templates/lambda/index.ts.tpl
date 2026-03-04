// terraform/lambda/src/{{FULL_NAME}}/index.ts

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = async (ctx: any) => {
    console.log('--------------------------------')
    console.log(JSON.stringify(ctx, null, 2))

    // TODO: implement handler logic

    return ctx
}

export { handler }
