import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminUsersPage() {
    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">Users management functionality coming soon...</p>
                </CardContent>
            </Card>
        </div>
    )
}
