import { useEffect, useState, ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { adminApi } from '@/lib/api'
import { ShieldCheck, Sparkles, TrendingUp, Users2 } from 'lucide-react'

export default function AdminLoginPage() {
    const demoEnabled = String(import.meta.env.VITE_DEMO_LOGIN ?? 'false').toLowerCase() !== 'false'
    const testEmail = import.meta.env.VITE_TEST_ADMIN_EMAIL || 'admin@wholexale.com'
    const testPassword = import.meta.env.VITE_TEST_ADMIN_PASSWORD || ''
    const isDev = import.meta.env.DEV

    const [email, setEmail] = useState(isDev ? testEmail : '')
    const [password, setPassword] = useState(isDev ? testPassword : '')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [heroIndex, setHeroIndex] = useState(0)
    const navigate = useNavigate()
    const heroImages = [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1800&q=80',
        'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1800&q=80',
        'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1800&q=80',
        'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1800&q=80',
    ]

    useEffect(() => {
        const timer = window.setInterval(() => {
            setHeroIndex((prev) => (prev + 1) % heroImages.length)
        }, 4200)
        return () => window.clearInterval(timer)
    }, [heroImages.length])

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (demoEnabled) {
                const normalizedEmail = email.trim().toLowerCase()
                const validEmails = [testEmail.toLowerCase(), 'admin@wholexale.com', 'superadmin@wholexale.com']
                if (!validEmails.includes(normalizedEmail) || password !== testPassword) {
                    setError('Invalid demo credentials.')
                    return
                }

                const demoUser = {
                    id: 'demo-admin-1',
                    email: normalizedEmail,
                    role: normalizedEmail === 'superadmin@wholexale.com' ? 'super_admin' : 'admin',
                    firstName: 'Demo',
                    lastName: 'Admin',
                    partitions: normalizedEmail === 'superadmin@wholexale.com'
                        ? ['*']
                        : ['overview', 'users', 'brands', 'products', 'orders', 'analytics', 'settings'],
                }

                window.localStorage.setItem('adminToken', 'demo-admin-token')
                window.localStorage.setItem('adminDemoSession', JSON.stringify(demoUser))
                navigate('/admin/dashboard')
                return
            }

            const response = await adminApi.login({ email, password })
            const token = response?.data?.token as string | undefined
            const user = response?.data?.user as { role?: string } | undefined

            if (!token) {
                throw new Error('Missing token')
            }

            if (!user?.role || !['admin', 'super_admin'].includes(user.role)) {
                window.localStorage.removeItem('adminToken')
                window.localStorage.removeItem('adminDemoSession')
                setError('Access denied: this account is not an admin.')
                return
            }

            window.localStorage.setItem('adminToken', token)
            window.localStorage.removeItem('adminDemoSession')

            navigate('/admin/dashboard')
        } catch (err) {
            setError('Invalid credentials. Please try again.')
            console.error('Login failed:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[var(--surface-0)]">
            <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="relative overflow-hidden px-8 py-16 text-white">
                    <div className="absolute inset-0">
                        {heroImages.map((src, idx) => (
                            <img
                                key={src}
                                src={src}
                                alt={`Admin hero ${idx + 1}`}
                                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                                    heroIndex === idx ? 'opacity-100' : 'opacity-0'
                                }`}
                            />
                        ))}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0B5ED7]/80 via-[#0A3E8C]/70 to-[#0B1020]/85" />
                    <div className="absolute inset-0 opacity-30">
                        <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-cyan-300 blur-[120px]" />
                        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-blue-400 blur-[140px]" />
                        <div className="absolute bottom-10 left-24 h-72 w-72 rounded-full bg-emerald-300 blur-[160px]" />
                    </div>

                    <div className="relative z-10 flex h-full flex-col justify-between gap-16">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-white/70">Wholexale</p>
                                <h1 className="font-display text-2xl font-semibold tracking-tight">Admin Control Center</h1>
                            </div>
                        </div>

                        <div className="max-w-lg space-y-5">
                            <h2 className="font-display text-4xl font-semibold leading-tight">
                                Operate the marketplace with clarity and speed.
                            </h2>
                            <p className="text-base text-white/80">
                                Monitor inventory health, resolve brand submissions, and orchestrate admin access with
                                partition-level control.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                                    <TrendingUp className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-medium">Real-time analytics</p>
                                <p className="text-xs text-white/70">Live insights across orders and catalogs.</p>
                            </div>
                            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                                    <Users2 className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-medium">Partitioned access</p>
                                <p className="text-xs text-white/70">Granular control for each admin.</p>
                            </div>
                            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-medium">Audit-ready</p>
                                <p className="text-xs text-white/70">Every change tracked for compliance.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {heroImages.map((_, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    aria-label={`Show hero image ${idx + 1}`}
                                    onClick={() => setHeroIndex(idx)}
                                    className={`h-2.5 rounded-full transition-all ${
                                        heroIndex === idx ? 'w-7 bg-white' : 'w-2.5 bg-white/50'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center px-6 py-12 lg:px-10">
                    <Card className="w-full max-w-md border-none bg-[var(--surface-1)] shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)]">
                        <CardHeader className="space-y-2">
                            <CardTitle className="font-display text-3xl text-[var(--ink-900)]">Sign in</CardTitle>
                            <CardDescription className="text-[var(--ink-700)]">
                                Use your admin credentials to access the control plane.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@wholexale.com"
                                        value={email}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                        required
                                        className="h-11 bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Password</Label>
                                        <span className="text-xs text-gray-400">Contact ops for reset</span>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                        required
                                        className="h-11 bg-white"
                                    />
                                </div>
                                {error && (
                                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                                        {error}
                                    </div>
                                )}
                                {isDev && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-10 w-full"
                                        onClick={() => {
                                            setEmail(testEmail)
                                            setPassword(testPassword)
                                        }}
                                    >
                                        Use Seeded Test Admin
                                    </Button>
                                )}
                                <Button type="submit" className="h-11 w-full" disabled={loading}>
                                    {loading ? 'Signing in...' : 'Continue to dashboard'}
                                </Button>
                                {isDev && (
                                    <p className="text-center text-[11px] text-gray-500">
                                        Dev seed: {testEmail} / {testPassword}
                                    </p>
                                )}
                                {demoEnabled && !isDev && (
                                    <p className="text-center text-[11px] text-gray-500">
                                        Demo login enabled
                                    </p>
                                )}
                                <p className="text-center text-xs text-gray-500">
                                    Protected by Wholexale security standards.
                                </p>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
