import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminAdminsPage() {
    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Admins</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">Admins management functionality coming soon...</p>
                </CardContent>
            </Card>
        </div>
    )
}
