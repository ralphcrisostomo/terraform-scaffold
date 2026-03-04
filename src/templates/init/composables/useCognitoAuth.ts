import {
    cognitoSignIn,
    cognitoSignUp,
    cognitoConfirmSignUp,
    cognitoResendConfirmationCode,
    cognitoForgotPassword,
    cognitoConfirmForgotPassword,
    cognitoRefreshTokens,
    cognitoSignOut,
    cognitoChangePassword,
} from '~~/services/cognitoService'

type CognitoSession = {
    accessToken: string
    idToken: string
    refreshToken: string
    expiresAt: number
}

function decodeJwtPayload(token: string): Record<string, unknown> {
    const base64 = token.split('.')[1]
    // @ts-expect-error - atob is not globally typed in all environments
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
}

function extractRoleFromIdToken(idToken: string): 'admin' | 'user' {
    const claims = decodeJwtPayload(idToken)
    const groups = (claims['cognito:groups'] as string[]) ?? []
    return groups.includes('admin') ? 'admin' : 'user'
}

function extractUserFromIdToken(idToken: string): {
    email: string
    sub: string
} {
    const claims = decodeJwtPayload(idToken)
    return {
        email: (claims.email as string) ?? '',
        sub: (claims.sub as string) ?? '',
    }
}

export function useCognitoAuth() {
    const { signIn: setAuthState, signOut: clearAuthState } = useAuthState()

    const cookieOptions = { sameSite: 'lax' as const }
    const longCookieOptions = {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 30, // 30 days
    }

    const accessTokenCookie = useCookie<string | null>('cognito-access-token', {
        ...cookieOptions,
        default: () => null,
    })
    const idTokenCookie = useCookie<string | null>('cognito-id-token', {
        ...cookieOptions,
        default: () => null,
    })
    const refreshTokenCookie = useCookie<string | null>(
        'cognito-refresh-token',
        { ...longCookieOptions, default: () => null }
    )
    const expiresAtCookie = useCookie<number | null>('cognito-expires-at', {
        ...cookieOptions,
        default: () => null,
    })

    const session = useState<CognitoSession | null>('cognito:session', () => {
        if (
            accessTokenCookie.value &&
            idTokenCookie.value &&
            refreshTokenCookie.value &&
            expiresAtCookie.value
        ) {
            return {
                accessToken: accessTokenCookie.value,
                idToken: idTokenCookie.value,
                refreshToken: refreshTokenCookie.value,
                expiresAt: expiresAtCookie.value,
            }
        }
        return null
    })

    function setSession(input: {
        accessToken: string
        idToken: string
        refreshToken: string
        expiresIn: number
    }) {
        const expiresAt = Date.now() + input.expiresIn * 1000

        const newSession: CognitoSession = {
            accessToken: input.accessToken,
            idToken: input.idToken,
            refreshToken: input.refreshToken,
            expiresAt,
        }

        session.value = newSession

        accessTokenCookie.value = input.accessToken
        idTokenCookie.value = input.idToken
        refreshTokenCookie.value = input.refreshToken
        expiresAtCookie.value = expiresAt
    }

    function clearSession() {
        session.value = null
        accessTokenCookie.value = null
        idTokenCookie.value = null
        refreshTokenCookie.value = null
        expiresAtCookie.value = null
        clearAuthState()
    }

    function isExpired(leewaySeconds = 30): boolean {
        if (!session.value) return true
        return Date.now() >= session.value.expiresAt - leewaySeconds * 1000
    }

    async function refreshSession(): Promise<void> {
        const currentRefreshToken = session.value?.refreshToken
        if (!currentRefreshToken) {
            clearSession()
            throw new Error('No refresh token available.')
        }

        try {
            const result = await cognitoRefreshTokens(currentRefreshToken)

            setSession({
                accessToken: result.accessToken,
                idToken: result.idToken,
                refreshToken: result.refreshToken,
                expiresIn: result.expiresIn,
            })

            const role = extractRoleFromIdToken(result.idToken)
            const user = extractUserFromIdToken(result.idToken)
            setAuthState(role, user)
        } catch {
            clearSession()
            throw new Error('Session expired. Please sign in again.')
        }
    }

    async function getAccessToken(): Promise<string> {
        if (!session.value) {
            throw new Error('Not authenticated.')
        }

        if (isExpired()) {
            await refreshSession()
        }

        return session.value!.accessToken
    }

    async function getIdToken(): Promise<string> {
        if (!session.value) {
            throw new Error('Not authenticated.')
        }

        if (isExpired()) {
            await refreshSession()
        }

        return session.value!.idToken
    }

    async function signIn(
        email: string,
        password: string
    ): Promise<CognitoSession> {
        const result = await cognitoSignIn(email, password)

        setSession({
            accessToken: result.accessToken,
            idToken: result.idToken,
            refreshToken: result.refreshToken,
            expiresIn: result.expiresIn,
        })

        const role = extractRoleFromIdToken(result.idToken)
        const user = extractUserFromIdToken(result.idToken)
        setAuthState(role, user)

        return session.value!
    }

    async function signUp(
        email: string,
        password: string,
        meta?: { email?: string }
    ): Promise<string> {
        return cognitoSignUp(email, password, meta)
    }

    async function confirmSignUp(email: string, code: string): Promise<void> {
        return cognitoConfirmSignUp(email, code)
    }

    async function resendConfirmationCode(email: string): Promise<void> {
        return cognitoResendConfirmationCode(email)
    }

    async function forgotPassword(email: string): Promise<void> {
        return cognitoForgotPassword(email)
    }

    async function confirmForgotPassword(
        email: string,
        code: string,
        newPassword: string
    ): Promise<void> {
        return cognitoConfirmForgotPassword(email, code, newPassword)
    }

    async function signOut(): Promise<void> {
        try {
            if (session.value?.accessToken) {
                await cognitoSignOut(session.value.accessToken)
            }
        } finally {
            clearSession()
        }
    }

    function restoreAuthState(): void {
        if (!session.value?.idToken) return
        const role = extractRoleFromIdToken(session.value.idToken)
        const user = extractUserFromIdToken(session.value.idToken)
        setAuthState(role, user)
    }

    async function changePassword(
        previousPassword: string,
        proposedPassword: string
    ): Promise<void> {
        const accessToken = await getAccessToken()
        return cognitoChangePassword(
            accessToken,
            previousPassword,
            proposedPassword
        )
    }

    return {
        session: readonly(session),
        signIn,
        signUp,
        confirmSignUp,
        resendConfirmationCode,
        forgotPassword,
        confirmForgotPassword,
        refreshSession,
        signOut,
        getAccessToken,
        getIdToken,
        isExpired,
        clearSession,
        changePassword,
        restoreAuthState,
    }
}
