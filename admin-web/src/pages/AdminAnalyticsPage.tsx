import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminAnalyticsPage() {
    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">Analytics functionality coming soon...</p>
                </CardContent>
            </Card>
        </div>
    )
}
