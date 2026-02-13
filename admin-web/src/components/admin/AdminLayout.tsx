"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
    Activity,
    Barcode,
    LineChart,
    LogOut,
    Package,
    Settings,
    Shield,
    ShieldCheck,
    ShoppingCart,
    Upload,
    Users,
} from 'lucide-react'
import { adminApi } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/errors'

export type AdminUser = {
    id: string
    email: string
    role: 'admin' | 'super_admin' | string
    firstName?: string
    lastName?: string
    partitions?: string[]
}

export type AdminPartition = { id: string; label: string }

type AdminContextValue = {
    user: AdminUser
    partitions: AdminPartition[]
    hasPartition: (partitionId: string) => boolean
    refresh: () => Promise<void>
    logout: () => void
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function useAdmin() {
    const ctx = useContext(AdminContext)
    if (!ctx) {
        throw new Error('useAdmin must be used within <AdminLayout />')
    }
    return ctx
}

type NavItem = {
    name: string
    href: string
    icon: React.ReactNode
    partition?: string
    roles?: Array<'admin' | 'super_admin'>
}

const NAV_ITEMS: NavItem[] = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: <Package className="h-5 w-5" />, partition: 'overview' },
    { name: 'Brands', href: '/admin/brands', icon: <Shield className="h-5 w-5" />, partition: 'brands' },
    { name: 'Inventory', href: '/admin/inventory', icon: <Barcode className="h-5 w-5" />, partition: 'products' },
    { name: 'Bulk Ops', href: '/admin/bulk', icon: <Upload className="h-5 w-5" />, partition: 'products' },
    { name: 'Orders', href: '/admin/orders', icon: <ShoppingCart className="h-5 w-5" />, partition: 'orders' },
    { name: 'Analytics', href: '/admin/analytics', icon: <LineChart className="h-5 w-5" />, partition: 'analytics' },
    { name: 'Users', href: '/admin/users', icon: <Users className="h-5 w-5" />, partition: 'users' },
    { name: 'Audit', href: '/admin/audit', icon: <Activity className="h-5 w-5" />, partition: 'overview' },
    { name: 'Admins', href: '/admin/admins', icon: <ShieldCheck className="h-5 w-5" />, roles: ['super_admin'] },
    { name: 'Settings', href: '/admin/settings', icon: <Settings className="h-5 w-5" />, partition: 'settings' },
]

const isAllowed = (user: AdminUser | null, item: NavItem) => {
    if (!user) return false
    if (user.role === 'super_admin') return true

    const role = user.role === 'admin' || user.role === 'super_admin' ? user.role : null
    if (item.roles && (!role || !item.roles.includes(role))) {
        return false
    }

    if (!item.partition) return true
    const parts = Array.isArray(user.partitions) ? user.partitions : []
    return parts.includes('*') || parts.includes(item.partition)
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const demoEnabled = String(import.meta.env.VITE_DEMO_LOGIN ?? 'true').toLowerCase() !== 'false'
    const location = useLocation()
    const navigate = useNavigate()
    const pathname = location.pathname

    const [user, setUser] = useState<AdminUser | null>(null)
    const [partitions, setPartitions] = useState<AdminPartition[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const logout = useCallback(() => {
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem('adminToken')
            window.localStorage.removeItem('adminDemoSession')
        }
        navigate('/admin/login')
    }, [navigate])

    const refresh = useCallback(async () => {
        if (typeof window === 'undefined') return
        const token = window.localStorage.getItem('adminToken')
        if (!token) {
            logout()
            return
        }

        setError(null)
        setLoading(true)
        try {
            if (demoEnabled) {
                const rawDemoSession = window.localStorage.getItem('adminDemoSession')
                if (rawDemoSession) {
                    const demoUser = JSON.parse(rawDemoSession) as AdminUser
                    if (demoUser?.id && ['admin', 'super_admin'].includes(demoUser.role)) {
                        setUser(demoUser)
                        setPartitions([
                            { id: 'overview', label: 'Overview' },
                            { id: 'admins', label: 'Admin Management' },
                            { id: 'users', label: 'User Management' },
                            { id: 'brands', label: 'Brand Authorizations' },
                            { id: 'products', label: 'Products' },
                            { id: 'orders', label: 'Orders' },
                            { id: 'analytics', label: 'Analytics' },
                            { id: 'settings', label: 'Settings' },
                        ])
                        return
                    }
                }
            }

            const [meRes, partsRes] = await Promise.all([
                adminApi.me(),
                adminApi.getPartitions().catch(() => null),
            ])

            const nextUser = meRes?.data?.user as AdminUser | undefined
            if (!nextUser?.id) {
                throw new Error('Invalid session')
            }

            // Hard gate: only admin/super_admin can use the admin web.
            if (!['admin', 'super_admin'].includes(nextUser.role)) {
                throw new Error('Access denied')
            }

            setUser(nextUser)

            const nextPartitions = (partsRes?.data?.partitions || []) as AdminPartition[]
            if (Array.isArray(nextPartitions) && nextPartitions.length) {
                setPartitions(nextPartitions)
            }
        } catch (e: unknown) {
            console.error('Admin auth bootstrap failed:', e)
            setError(getApiErrorMessage(e, 'Failed to load admin session'))
            logout()
        } finally {
            setLoading(false)
        }
    }, [logout])

    useEffect(() => {
        refresh()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const hasPartition = useCallback(
        (partitionId: string) => {
            if (!user) return false
            if (user.role === 'super_admin') return true
            const parts = Array.isArray(user.partitions) ? user.partitions : []
            return parts.includes('*') || parts.includes(partitionId)
        },
        [user]
    )

    const allowedNavItems = useMemo(() => {
        return NAV_ITEMS.filter((item) => isAllowed(user, item))
    }, [user])

    const currentItem = useMemo(() => {
        // Prefer the longest href match (handles nested routes like /admin/brands/xyz later).
        const sorted = [...NAV_ITEMS].sort((a, b) => b.href.length - a.href.length)
        return sorted.find((item) => pathname === item.href || pathname.startsWith(item.href + '/')) || null
    }, [pathname])

    const canViewCurrent = useMemo(() => {
        if (!currentItem) return true
        return isAllowed(user, currentItem)
    }, [user, currentItem])

    const ctxValue = useMemo(() => {
        if (!user) return null
        return { user, partitions, hasPartition, refresh, logout }
    }, [user, partitions, hasPartition, refresh, logout])

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-gray-600">Loading admin session...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
                <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm">
                    <h1 className="text-lg font-semibold text-gray-900">Session Error</h1>
                    <p className="mt-2 text-sm text-gray-600">{error}</p>
                    <div className="mt-4 flex gap-2">
                        <Button onClick={() => navigate('/admin/login')}>Go to Login</Button>
                        <Button variant="outline" onClick={refresh}>
                            Retry
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    if (!ctxValue) {
        // Should not happen, but keeps types happy.
        return null
    }

    return (
        <AdminContext.Provider value={ctxValue}>
            <div className="flex min-h-screen bg-gray-50">
                {/* Sidebar */}
                <div className="hidden w-72 flex-col bg-white shadow-sm md:flex">
                    <div className="flex h-16 items-center justify-between border-b px-5">
                        <div className="min-w-0">
                            <h1 className="truncate text-lg font-semibold text-primary">Wholexale Admin</h1>
                            <p className="truncate text-xs text-gray-500">{ctxValue.user.email}</p>
                        </div>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {ctxValue.user.role}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <nav className="space-y-1">
                            {allowedNavItems.map((item) => (
                                <Link key={item.name} to={item.href}>
                                    <Button
                                        variant={pathname === item.href ? 'secondary' : 'ghost'}
                                        className="w-full justify-start gap-3"
                                    >
                                        {item.icon}
                                        <span className="truncate">{item.name}</span>
                                    </Button>
                                </Link>
                            ))}
                        </nav>
                    </div>
                    <div className="border-t p-4">
                        <Button variant="outline" className="w-full justify-start gap-3" onClick={logout}>
                            <LogOut className="h-5 w-5" />
                            <span>Logout</span>
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto">
                    <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:hidden">
                        <div className="min-w-0">
                            <h1 className="truncate text-base font-semibold text-primary">Wholexale Admin</h1>
                            <p className="truncate text-xs text-gray-500">{ctxValue.user.email}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={logout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </header>

                    <main className="p-4 md:p-6">
                        {!canViewCurrent ? (
                            <div className="rounded-lg border bg-white p-6">
                                <h2 className="text-lg font-semibold text-gray-900">Access Denied</h2>
                                <p className="mt-2 text-sm text-gray-600">
                                    You do not have permission to access this section.
                                </p>
                            </div>
                        ) : (
                            children
                        )}
                    </main>
                </div>
            </div>
        </AdminContext.Provider>
    )
} 
