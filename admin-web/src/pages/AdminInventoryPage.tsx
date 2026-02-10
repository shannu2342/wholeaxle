import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminInventoryPage() {
    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">Inventory management functionality coming soon...</p>
                </CardContent>
            </Card>
        </div>
    )
}
