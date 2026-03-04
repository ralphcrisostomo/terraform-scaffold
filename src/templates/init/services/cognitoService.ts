import {
    AdminGetUserCommand,
    ChangePasswordCommand,
    CognitoIdentityProviderClient,
    ConfirmForgotPasswordCommand,
    ConfirmSignUpCommand,
    ForgotPasswordCommand,
    GetUserCommand,
    GlobalSignOutCommand,
    InitiateAuthCommand,
    ResendConfirmationCodeCommand,
    SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider'

export type CognitoAuthResult = {
    accessToken: string
    idToken: string
    refreshToken: string
    expiresIn: number
}

export type CognitoGetUserResponse = {
    username: string
    attributes: Record<string, string>
}

export type CognitoError = {
    code: string
    message: string
}

export class CognitoServiceError extends Error {
    code: string
    constructor(code: string, message: string) {
        super(message)
        this.name = 'CognitoServiceError'
        this.code = code
    }
}

function toCognitoError(error: unknown): CognitoError {
    if (error && typeof error === 'object' && 'name' in error) {
        const err = error as { name: string; message?: string }
        const code = err.name

        const messages: Record<string, string> = {
            NotAuthorizedException: 'Incorrect email or password.',
            UserNotFoundException: 'No account found with that email.',
            UsernameExistsException:
                'An account with this email already exists.',
            CodeMismatchException:
                'Invalid verification code. Please try again.',
            ExpiredCodeException:
                'Verification code has expired. Please request a new one.',
            InvalidPasswordException:
                'Password does not meet requirements. Must be at least 8 characters.',
            LimitExceededException:
                'Too many attempts. Please wait and try again.',
            UserNotConfirmedException:
                'Account not verified. Please check your email for a verification code.',
            InvalidParameterException:
                'Invalid input. Please check your details and try again.',
            TooManyRequestsException:
                'Too many requests. Please wait a moment.',
        }

        return {
            code,
            message:
                messages[code] ?? err.message ?? 'An unknown error occurred.',
        }
    }

    return {
        code: 'UnknownError',
        message: 'An unexpected error occurred. Please try again.',
    }
}

async function withCognitoErrorHandling<T>(fn: () => Promise<T>): Promise<T> {
    try {
        return await fn()
    } catch (error) {
        const cognitoError = toCognitoError(error)
        throw new CognitoServiceError(cognitoError.code, cognitoError.message)
    }
}

function getRuntime() {
    const config = useRuntimeConfig()
    const region = config.public.cognitoRegion as string
    const clientId = config.public.cognitoClientId as string

    if (!region || !clientId) {
        throw new Error('Cognito configuration is missing.')
    }

    return { region, clientId }
}

function createClient() {
    const { region } = getRuntime()
    return new CognitoIdentityProviderClient({ region })
}

function buildBase() {
    return {
        client: createClient(),
        clientId: getRuntime().clientId,
    }
}

export async function cognitoSignIn(
    username: string,
    password: string
): Promise<CognitoAuthResult> {
    const { client, clientId } = buildBase()

    return withCognitoErrorHandling(async () => {
        const response = await client.send(
            new InitiateAuthCommand({
                AuthFlow: 'USER_PASSWORD_AUTH',
                ClientId: clientId,
                AuthParameters: {
                    USERNAME: username,
                    PASSWORD: password,
                },
            })
        )

        const result = response.AuthenticationResult
        if (!result) {
            throw new Error('Authentication failed: no result returned.')
        }

        return {
            accessToken: result.AccessToken ?? '',
            idToken: result.IdToken ?? '',
            refreshToken: result.RefreshToken ?? '',
            expiresIn: result.ExpiresIn ?? 3600,
        }
    })
}

export async function cognitoSignUp(
    username: string,
    password: string,
    meta?: { email?: string }
): Promise<string> {
    const { client, clientId } = buildBase()

    const userAttributes = meta?.email
        ? [{ Name: 'email', Value: meta.email }]
        : []

    return withCognitoErrorHandling(async () => {
        const response = await client.send(
            new SignUpCommand({
                ClientId: clientId,
                Username: username,
                Password: password,
                UserAttributes: userAttributes,
            })
        )

        return response.UserSub ?? ''
    })
}

export async function cognitoConfirmSignUp(
    username: string,
    code: string
): Promise<void> {
    const { client, clientId } = buildBase()

    return withCognitoErrorHandling(async () => {
        await client.send(
            new ConfirmSignUpCommand({
                ClientId: clientId,
                Username: username,
                ConfirmationCode: code,
            })
        )
    })
}

export async function cognitoResendConfirmationCode(
    username: string
): Promise<void> {
    const { client, clientId } = buildBase()

    return withCognitoErrorHandling(async () => {
        await client.send(
            new ResendConfirmationCodeCommand({
                ClientId: clientId,
                Username: username,
            })
        )
    })
}

export async function cognitoForgotPassword(username: string): Promise<void> {
    const { client, clientId } = buildBase()

    return withCognitoErrorHandling(async () => {
        await client.send(
            new ForgotPasswordCommand({
                ClientId: clientId,
                Username: username,
            })
        )
    })
}

export async function cognitoConfirmForgotPassword(
    username: string,
    code: string,
    newPassword: string
): Promise<void> {
    const { client, clientId } = buildBase()

    return withCognitoErrorHandling(async () => {
        await client.send(
            new ConfirmForgotPasswordCommand({
                ClientId: clientId,
                Username: username,
                ConfirmationCode: code,
                Password: newPassword,
            })
        )
    })
}

export async function cognitoRefreshTokens(
    refreshToken: string
): Promise<CognitoAuthResult> {
    const { client, clientId } = buildBase()

    return withCognitoErrorHandling(async () => {
        const response = await client.send(
            new InitiateAuthCommand({
                AuthFlow: 'REFRESH_TOKEN_AUTH',
                ClientId: clientId,
                AuthParameters: {
                    REFRESH_TOKEN: refreshToken,
                },
            })
        )

        const result = response.AuthenticationResult
        if (!result) {
            throw new Error('Token refresh failed: no result returned.')
        }

        return {
            accessToken: result.AccessToken ?? '',
            idToken: result.IdToken ?? '',
            refreshToken: result.RefreshToken ?? refreshToken,
            expiresIn: result.ExpiresIn ?? 3600,
        }
    })
}

export async function cognitoGetUser(
    accessToken: string
): Promise<CognitoGetUserResponse> {
    const client = createClient()

    return withCognitoErrorHandling(async () => {
        const response = await client.send(
            new GetUserCommand({ AccessToken: accessToken })
        )

        const attributes: Record<string, string> = {}
        for (const attr of response.UserAttributes ?? []) {
            if (attr.Name && attr.Value) {
                attributes[attr.Name] = attr.Value
            }
        }

        return {
            username: response.Username ?? '',
            attributes,
        }
    })
}

export async function cognitoSignOut(accessToken: string): Promise<void> {
    const client = createClient()

    return withCognitoErrorHandling(async () => {
        await client.send(
            new GlobalSignOutCommand({ AccessToken: accessToken })
        )
    })
}

export async function cognitoChangePassword(
    accessToken: string,
    previousPassword: string,
    proposedPassword: string
): Promise<void> {
    const client = createClient()

    return withCognitoErrorHandling(async () => {
        await client.send(
            new ChangePasswordCommand({
                AccessToken: accessToken,
                PreviousPassword: previousPassword,
                ProposedPassword: proposedPassword,
            })
        )
    })
}

export async function cognitoAdminGetUser(
    userPoolId: string,
    region: string,
    email: string
): Promise<CognitoGetUserResponse | null> {
    const client = new CognitoIdentityProviderClient({ region })

    try {
        const response = await client.send(
            new AdminGetUserCommand({
                UserPoolId: userPoolId,
                Username: email,
            })
        )

        const attributes: Record<string, string> = {}
        for (const attr of response.UserAttributes ?? []) {
            if (attr.Name && attr.Value) {
                attributes[attr.Name] = attr.Value
            }
        }

        return {
            username: response.Username ?? '',
            attributes,
        }
    } catch (error) {
        if (
            error &&
            typeof error === 'object' &&
            'name' in error &&
            (error as { name: string }).name === 'UserNotFoundException'
        ) {
            return null
        }

        return withCognitoErrorHandling(() => {
            throw error
        })
    }
}
