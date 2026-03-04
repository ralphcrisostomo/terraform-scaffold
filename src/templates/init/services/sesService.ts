import {
    SESClient,
    SendRawEmailCommand,
    type SendRawEmailCommandInput,
} from '@aws-sdk/client-ses'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { createMimeMessage } from 'mimetext'
import type { Readable } from 'stream'

class SESError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'SESError'
        Object.setPrototypeOf(this, SESError.prototype)
    }
}

interface GlobalWithSES {
    sesClient?: SESClient
    s3Client?: S3Client
}

const g = globalThis as unknown as GlobalWithSES

export interface S3Attachment {
    bucket: string
    key: string
    filename: string
}

export interface SendEmailParams {
    from: string
    to: string[]
    cc?: string[]
    bcc?: string[]
    subject: string
    textBody?: string
    htmlBody?: string
    replyTo?: string[]
    s3Attachments?: S3Attachment[]
}

function getSESClient(): SESClient {
    if (!g.sesClient) {
        g.sesClient = new SESClient({
            region: process.env.AWS_REGION ?? 'us-east-2',
        })
    }
    return g.sesClient
}

function getS3Client(): S3Client {
    if (!g.s3Client) {
        g.s3Client = new S3Client({
            region: process.env.AWS_REGION ?? 'us-east-2',
        })
    }
    return g.s3Client
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = []
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
        stream.on('error', (err) => reject(err))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
    })
}

export async function getAttachmentFromS3(
    attachment: S3Attachment
): Promise<{ content: Buffer; contentType: string }> {
    const s3Client = getS3Client()
    const command = new GetObjectCommand({
        Bucket: attachment.bucket,
        Key: attachment.key,
    })

    const response = await s3Client.send(command)

    if (!response.Body) {
        throw new SESError('Empty S3 file body')
    }

    const content = await streamToBuffer(response.Body as Readable)
    const contentType = response.ContentType ?? 'application/octet-stream'

    return { content, contentType }
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
    const {
        from,
        to,
        cc = [],
        bcc = [],
        subject,
        textBody,
        htmlBody,
        replyTo = [],
        s3Attachments = [],
    } = params

    try {
        const client = getSESClient()
        const msg = createMimeMessage()
        msg.setSender(from)
        msg.setRecipient(to)
        if (cc.length) msg.setCc(cc)
        if (bcc.length) msg.setBcc(bcc)
        msg.setSubject(subject)

        if (textBody)
            msg.addMessage({ contentType: 'text/plain', data: textBody })
        if (htmlBody)
            msg.addMessage({ contentType: 'text/html', data: htmlBody })

        for (const attachment of s3Attachments) {
            const { content, contentType } =
                await getAttachmentFromS3(attachment)

            msg.addAttachment({
                filename: attachment.filename,
                data: content.toString('base64'),
                contentType,
            })
        }

        if (replyTo.length) msg.setHeader('Reply-To', replyTo.join(', '))

        const commandInput: SendRawEmailCommandInput = {
            RawMessage: { Data: Buffer.from(msg.asRaw()) },
        }

        const command = new SendRawEmailCommand(commandInput)
        await client.send(command)
    } catch (error) {
        if (error instanceof Error) {
            throw new SESError(`Failed to send email: ${error.message}`)
        }
        throw new SESError('Failed to send email: Unknown error')
    }
}
