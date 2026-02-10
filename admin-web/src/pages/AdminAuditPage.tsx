import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminAuditPage() {
    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Audit Log</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">Audit log functionality coming soon...</p>
                </CardContent>
            </Card>
        </div>
    )
}
