import {
    DynamoDBDocumentClient,
    GetCommand,
    type GetCommandInput,
    PutCommand,
    type PutCommandInput,
    QueryCommand,
    type QueryCommandInput,
    UpdateCommand,
    type UpdateCommandInput,
    DeleteCommand,
    type DeleteCommandInput,
    BatchWriteCommand,
    type BatchWriteCommandInput,
    ScanCommand,
    type ScanCommandInput,
} from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

class DynamoDBError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'DynamoDBError'
        Object.setPrototypeOf(this, DynamoDBError.prototype)
    }
}

type DynamoRecord = Record<string, unknown>
type GlobalWithDDB = typeof globalThis & {
    dynamoDBDocClient?: DynamoDBDocumentClient
}

interface GetItemParams extends Omit<GetCommandInput, 'TableName' | 'Key'> {
    TableName: string
    Key: DynamoRecord
}

interface QueryItemsParams extends Omit<QueryCommandInput, 'TableName'> {
    TableName: string
}

interface PutItemParams extends Omit<PutCommandInput, 'TableName' | 'Item'> {
    TableName: string
    Item: DynamoRecord
}

interface UpdateItemParams extends Omit<
    UpdateCommandInput,
    'TableName' | 'Key'
> {
    TableName: string
    Key: DynamoRecord
}

interface DeleteItemParams extends Omit<
    DeleteCommandInput,
    'TableName' | 'Key'
> {
    TableName: string
    Key: DynamoRecord
}

interface BulkPutParams {
    TableName: string
    Items: DynamoRecord[]
}

export function getDynamoDBClient(): DynamoDBDocumentClient {
    const g = globalThis as GlobalWithDDB
    if (!g.dynamoDBDocClient) {
        const client = new DynamoDBClient({
            region: process.env.AWS_REGION || 'us-east-2',
        })
        g.dynamoDBDocClient = DynamoDBDocumentClient.from(client, {
            marshallOptions: {
                removeUndefinedValues: true,
                convertEmptyValues: true,
                convertClassInstanceToMap: true,
            },
            unmarshallOptions: {
                wrapNumbers: false,
            },
        })
    }
    return g.dynamoDBDocClient
}

export async function getItem(
    params: GetItemParams
): Promise<DynamoRecord | undefined> {
    try {
        const client = getDynamoDBClient()
        const command = new GetCommand({
            TableName: params.TableName,
            Key: params.Key,
            ...params,
        } as GetCommandInput)
        const result = await client.send(command)
        return result.Item as DynamoRecord | undefined
    } catch (error) {
        if (error instanceof Error) {
            throw new DynamoDBError(`Failed to get item: ${error.message}`)
        }
        throw new DynamoDBError('Failed to get item: Unknown error')
    }
}

export async function queryItems<T = DynamoRecord>(
    params: QueryItemsParams
): Promise<T[] | undefined> {
    try {
        const client = getDynamoDBClient()
        const command = new QueryCommand({
            TableName: params.TableName,
            ...params,
        } as QueryCommandInput)
        const result = await client.send(command)
        return result.Items as T[] | undefined
    } catch (error) {
        if (error instanceof Error) {
            throw new DynamoDBError(`Failed to query items: ${error.message}`)
        }
        throw new DynamoDBError('Failed to query items: Unknown error')
    }
}

export async function putItem(params: PutItemParams): Promise<void> {
    try {
        const client = getDynamoDBClient()
        const command = new PutCommand({
            TableName: params.TableName,
            Item: params.Item,
            ...params,
        } as PutCommandInput)
        await client.send(command)
    } catch (error) {
        if (error instanceof Error) {
            throw new DynamoDBError(`Failed to put item: ${error.message}`)
        }
        throw new DynamoDBError('Failed to put item: Unknown error')
    }
}

export async function updateItem(
    params: UpdateItemParams
): Promise<DynamoRecord | undefined> {
    try {
        const client = getDynamoDBClient()
        const command = new UpdateCommand({
            TableName: params.TableName,
            Key: params.Key,
            ReturnValues: 'UPDATED_NEW',
            ...params,
        } as UpdateCommandInput)
        const result = await client.send(command)
        return result.Attributes as DynamoRecord | undefined
    } catch (error) {
        if (error instanceof Error) {
            throw new DynamoDBError(`Failed to update item: ${error.message}`)
        }
        throw new DynamoDBError('Failed to update item: Unknown error')
    }
}

export async function deleteItem(params: DeleteItemParams): Promise<void> {
    try {
        const client = getDynamoDBClient()
        const command = new DeleteCommand({
            TableName: params.TableName,
            Key: params.Key,
            ...params,
        } as DeleteCommandInput)
        await client.send(command)
    } catch (error) {
        if (error instanceof Error) {
            throw new DynamoDBError(`Failed to delete item: ${error.message}`)
        }
        throw new DynamoDBError('Failed to delete item: Unknown error')
    }
}

export function getUpdateParams(
    updateData: DynamoRecord,
    excludeKeys: string[] = ['id', '$id']
): {
    UpdateExpression: string
    ExpressionAttributeNames: Record<string, string>
    ExpressionAttributeValues: DynamoRecord
} {
    const updateExpressionParts: string[] = []
    const expressionAttributeNames: Record<string, string> = {}
    const expressionAttributeValues: DynamoRecord = {}

    Object.entries(updateData).forEach(([field, value]) => {
        if (!excludeKeys.includes(field)) {
            const attributeName = `#${field}`
            const attributeValue = `:${field}`
            updateExpressionParts.push(`${attributeName} = ${attributeValue}`)
            expressionAttributeNames[attributeName] = field
            expressionAttributeValues[attributeValue] = value
        }
    })

    return {
        UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
    }
}

export async function bulkPutItems(
    params: BulkPutParams,
    maxRetries: number = 5
): Promise<void> {
    const client = getDynamoDBClient()
    const { TableName, Items } = params

    if (!TableName) {
        throw new DynamoDBError('TableName is required for bulkPutItems.')
    }

    if (!Items || !Array.isArray(Items) || Items.length === 0) {
        throw new DynamoDBError(
            'Items must be a non-empty array for bulkPutItems.'
        )
    }

    const BATCH_SIZE = 25
    const batches: DynamoRecord[][] = []
    for (let i = 0; i < Items.length; i += BATCH_SIZE) {
        batches.push(Items.slice(i, i + BATCH_SIZE))
    }

    let retryCount = 0
    let unprocessedItems: DynamoRecord[] = []

    while (retryCount <= maxRetries) {
        const currentBatch = retryCount === 0 ? batches : [unprocessedItems]
        unprocessedItems = []

        const batchWritePromises = currentBatch.map(async (batch) => {
            const putRequests = batch.map((item) => ({
                PutRequest: {
                    Item: item,
                },
            }))

            const batchParams: BatchWriteCommandInput = {
                RequestItems: {
                    [TableName]: putRequests,
                },
            }

            try {
                const result = await client.send(
                    new BatchWriteCommand(batchParams)
                )
                if (
                    result.UnprocessedItems &&
                    result.UnprocessedItems[TableName]
                ) {
                    unprocessedItems.push(
                        ...result.UnprocessedItems[TableName].map(
                            (req) => req.PutRequest?.Item
                        ).filter((item): item is DynamoRecord => !!item)
                    )
                }
            } catch (error) {
                if (error instanceof Error) {
                    throw new DynamoDBError(
                        `Batch write failed: ${error.message}`
                    )
                }
                throw new DynamoDBError('Batch write failed: Unknown error')
            }
        })

        await Promise.all(batchWritePromises)

        if (unprocessedItems.length === 0) {
            return
        }

        retryCount += 1
        const delay = Math.pow(2, retryCount) * 100
        await new Promise((resolve) => setTimeout(resolve, delay))
    }

    throw new DynamoDBError(
        `Failed to process all items after ${maxRetries} retries. Unprocessed items remain.`
    )
}

export async function scanAllItems(tableName: string): Promise<DynamoRecord[]> {
    const client = getDynamoDBClient()
    let items: DynamoRecord[] = []
    let ExclusiveStartKey: DynamoRecord | undefined = undefined

    try {
        do {
            const input: ScanCommandInput = {
                TableName: tableName,
                ExclusiveStartKey,
            }
            const result = await client.send(new ScanCommand(input))
            items = items.concat((result.Items ?? []) as DynamoRecord[])
            ExclusiveStartKey = result.LastEvaluatedKey as
                | DynamoRecord
                | undefined
        } while (ExclusiveStartKey)

        return items
    } catch (error) {
        if (error instanceof Error) {
            throw new DynamoDBError(`Failed to scan table: ${error.message}`)
        }
        throw new DynamoDBError('Failed to scan table: Unknown error')
    }
}

function attrNotExists(keys: string[]) {
    const expr = keys.map((k) => `attribute_not_exists(#${k})`).join(' AND ')
    const names = Object.fromEntries(keys.map((k) => [`#${k}`, k]))
    return { expr, names }
}

export async function bulkPutItemsIfNotExists(
    params: BulkPutParams,
    uniqueKeys: string[],
    maxConcurrency = 10
): Promise<{ inserted: number; skipped: number; errors: number }> {
    const ddb = DynamoDBDocumentClient.from(getDynamoDBClient())
    const { TableName, Items } = params
    if (!TableName) throw new Error('TableName is required')
    if (!Items?.length) throw new Error('Items must be a non-empty array')

    const { expr, names } = attrNotExists(uniqueKeys)

    let inserted = 0
    let skipped = 0
    let errors = 0

    const queue = [...Items]
    const workers: Promise<void>[] = []
    async function runWorker() {
        while (queue.length) {
            const Item = queue.shift()!
            try {
                await ddb.send(
                    new PutCommand({
                        TableName,
                        Item,
                        ConditionExpression: expr,
                        ExpressionAttributeNames: names,
                    })
                )
                inserted++
            } catch (e: unknown) {
                if (
                    e instanceof Error &&
                    e.name === 'ConditionalCheckFailedException'
                ) {
                    skipped++
                } else {
                    errors++
                }
            }
        }
    }

    for (let i = 0; i < Math.min(maxConcurrency, Items.length); i++) {
        workers.push(runWorker())
    }
    await Promise.all(workers)
    return { inserted, skipped, errors }
}
