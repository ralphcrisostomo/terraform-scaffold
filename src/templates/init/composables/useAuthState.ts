export type UserRole = 'user' | 'admin'

type UserMeta = {
    email: string
    sub: string
}

type AuthState = {
    isAuthenticated: boolean
    role: UserRole
    user: UserMeta | null
}

export function useAuthState() {
    const roleCookie = useCookie<UserRole | null>('auth-role', {
        sameSite: 'lax',
        default: () => null,
    })

    const auth = useState<AuthState>('auth-state', () => ({
        isAuthenticated:
            roleCookie.value === 'user' || roleCookie.value === 'admin',
        role: roleCookie.value ?? 'user',
        user: null,
    }))

    const isAuthenticated = computed(() => auth.value.isAuthenticated)
    const isAdmin = computed(() => auth.value.role === 'admin')
    const user = computed(() => auth.value.user)

    function signIn(role: UserRole = 'user', meta?: UserMeta) {
        auth.value = {
            isAuthenticated: true,
            role,
            user: meta ?? null,
        }
        roleCookie.value = role
    }

    function signOut() {
        auth.value = {
            isAuthenticated: false,
            role: 'user',
            user: null,
        }
        roleCookie.value = null
    }

    return {
        auth,
        isAuthenticated,
        isAdmin,
        user,
        signIn,
        signOut,
    }
}
