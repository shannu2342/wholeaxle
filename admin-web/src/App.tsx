import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminDashboard from '@/components/admin/AdminDashboard'
import AdminLoginPage from '@/pages/AdminLoginPage'
import AdminBrandsPage from '@/pages/AdminBrandsPage'
import AdminInventoryPage from '@/pages/AdminInventoryPage'
import AdminBulkPage from '@/pages/AdminBulkPage'
import AdminOrdersPage from '@/pages/AdminOrdersPage'
import AdminAnalyticsPage from '@/pages/AdminAnalyticsPage'
import AdminUsersPage from '@/pages/AdminUsersPage'
import AdminAuditPage from '@/pages/AdminAuditPage'
import AdminAdminsPage from '@/pages/AdminAdminsPage'
import AdminSettingsPage from '@/pages/AdminSettingsPage'
import AdminOperationsPage from '@/pages/AdminOperationsPage'
import AdminChatPage from '@/pages/AdminChatPage'
import HomePage from '@/pages/HomePage'

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route
                    path="/admin/dashboard"
                    element={
                        <AdminLayout>
                            <AdminDashboard />
                        </AdminLayout>
                    }
                />
                <Route
                    path="/admin/brands"
                    element={
                        <AdminLayout>
                            <AdminBrandsPage />
                        </AdminLayout>
                    }
                />
                <Route
                    path="/admin/inventory"
                    element={
                        <AdminLayout>
                            <AdminInventoryPage />
                        </AdminLayout>
                    }
                />
                <Route
                    path="/admin/bulk"
                    element={
                        <AdminLayout>
                            <AdminBulkPage />
                        </AdminLayout>
                    }
                />
                <Route
                    path="/admin/orders"
                    element={
                        <AdminLayout>
                            <AdminOrdersPage />
                        </AdminLayout>
                    }
                />
                <Route
                    path="/admin/analytics"
                    element={
                        <AdminLayout>
                            <AdminAnalyticsPage />
                        </AdminLayout>
                    }
                />
                <Route
                    path="/admin/users"
                    element={
                        <AdminLayout>
                            <AdminUsersPage />
                        </AdminLayout>
                    }
                />
                <Route
                    path="/admin/audit"
                    element={
                        <AdminLayout>
                            <AdminAuditPage />
                        </AdminLayout>
                    }
                />
                <Route
                    path="/admin/admins"
                    element={
                        <AdminLayout>
                            <AdminAdminsPage />
                        </AdminLayout>
                    }
                />
                <Route
                    path="/admin/settings"
                    element={
                        <AdminLayout>
                            <AdminSettingsPage />
                        </AdminLayout>
                    }
                />
                <Route
                    path="/admin/operations"
                    element={
                        <AdminLayout>
                            <AdminOperationsPage />
                        </AdminLayout>
                    }
                />
                <Route
                    path="/admin/coverage"
                    element={
                        <AdminLayout>
                            <AdminOperationsPage initialModule="coverage" />
                        </AdminLayout>
                    }
                />
                <Route
                    path="/admin/chat"
                    element={
                        <AdminLayout>
                            <AdminChatPage />
                        </AdminLayout>
                    }
                />
            </Routes>
        </Router>
    )
}

export default App
