import {
    TextractClient,
    AnalyzeDocumentCommand,
} from '@aws-sdk/client-textract'

class TextractServiceError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'TextractServiceError'
        Object.setPrototypeOf(this, TextractServiceError.prototype)
    }
}

interface GlobalWithTextract {
    textractClient?: TextractClient
}

const g = globalThis as unknown as GlobalWithTextract

function getTextractClient(): TextractClient {
    if (!g.textractClient) {
        g.textractClient = new TextractClient({
            region: process.env.AWS_REGION ?? 'us-east-2',
        })
    }
    return g.textractClient
}

async function analyzeDocument(s3Object: {
    Bucket: string
    Name: string
}): Promise<string> {
    const client = getTextractClient()

    try {
        const response = await client.send(
            new AnalyzeDocumentCommand({
                Document: {
                    S3Object: {
                        Bucket: s3Object.Bucket,
                        Name: s3Object.Name,
                    },
                },
                FeatureTypes: ['FORMS', 'TABLES'],
            })
        )

        const lines =
            response.Blocks?.filter((block) => block.BlockType === 'LINE')
                .map((block) => block.Text ?? '')
                .filter(Boolean) ?? []

        return lines.join('\n')
    } catch (error) {
        if (error instanceof Error) {
            throw new TextractServiceError(
                `Textract analysis failed: ${error.message}`
            )
        }
        throw new TextractServiceError(
            'Textract analysis failed: Unknown error'
        )
    }
}

export { analyzeDocument, TextractServiceError }
