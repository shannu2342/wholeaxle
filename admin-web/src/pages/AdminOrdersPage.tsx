import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminOrdersPage() {
    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">Orders management functionality coming soon...</p>
                </CardContent>
            </Card>
        </div>
    )
}
