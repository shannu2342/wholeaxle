import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminBulkPage() {
    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Bulk Operations</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">Bulk operations functionality coming soon...</p>
                </CardContent>
            </Card>
        </div>
    )
}
