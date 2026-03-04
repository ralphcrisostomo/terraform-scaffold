import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

class S3ServiceError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'S3ServiceError'
        Object.setPrototypeOf(this, S3ServiceError.prototype)
    }
}

interface GlobalWithS3 {
    s3Client?: S3Client
}

const g = globalThis as unknown as GlobalWithS3

function getS3Client(): S3Client {
    if (!g.s3Client) {
        g.s3Client = new S3Client({
            region: process.env.AWS_REGION ?? 'us-east-2',
        })
    }
    return g.s3Client
}

interface PutObjectParams {
    key: string
    body: Buffer
    contentType: string
    bucket?: string
}

async function putObject(params: PutObjectParams): Promise<string> {
    const {
        key,
        body,
        contentType,
        bucket = process.env.AWS_S3_BUCKET_STORAGE_NAME,
    } = params

    if (!bucket) {
        throw new S3ServiceError('AWS_S3_BUCKET_STORAGE_NAME is not configured')
    }

    const client = getS3Client()

    try {
        await client.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: body,
                ContentType: contentType,
            })
        )

        return `https://${bucket}.s3.${process.env.AWS_REGION ?? 'us-east-2'}.amazonaws.com/${key}`
    } catch (error) {
        if (error instanceof Error) {
            throw new S3ServiceError(
                `Failed to upload to S3: ${error.message}`
            )
        }
        throw new S3ServiceError('Failed to upload to S3: Unknown error')
    }
}

function buildS3Key(prefix: string, userId: string, mimeType: string): string {
    const ext = mimeType === 'image/png' ? 'png' : 'jpg'
    const timestamp = Date.now()
    return `${prefix}/${userId}/${timestamp}-${uuidv4()}.${ext}`
}

export { putObject, buildS3Key, S3ServiceError }
