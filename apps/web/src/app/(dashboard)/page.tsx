"use client"

import { useAuthStore } from "@/store/useAuthStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { useEffect, useState } from "react"
import { Users, BookOpen, GraduationCap, Clock } from "lucide-react"

export default function DashboardPage() {
    const { user } = useAuthStore()
    const [stats, setStats] = useState<any>(null)

    useEffect(() => {
        // Only fetch for admins or teachers
        if (user?.role === 'ADMIN' || user?.role === 'TEACHER') {
            api.get('/analytics/dashboard')
                .then(res => {
                    // Robust response parsing for Axios interceptor
                    const data = res?.data?.data || res?.data || res
                    setStats(data)
                })
                .catch(console.error)
        }
    }, [user])

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Welcome, {user?.name}</h2>
                <p className="text-muted-foreground mt-1">
                    Here's an overview of your institute's performance today.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.stats?.totalStudents || 0}</div>
                        <p className="text-xs text-muted-foreground">+2 from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.stats?.totalTeachers || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Question Bank</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.stats?.totalQuestions || 0}</div>
                        <p className="text-xs text-muted-foreground">+120 questions added this week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Tests</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.stats?.totalTests || 0}</div>
                        <p className="text-xs text-muted-foreground">3 tests awaiting publication</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Tests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {stats?.recentTests?.length > 0 ? (
                                stats.recentTests.map((test: any) => (
                                    <div key={test.id} className="flex items-center">
                                        <div className="ml-4 space-y-1 w-full">
                                            <div className="flex justify-between items-center w-full">
                                                <p className="text-sm font-medium leading-none">{test.title}</p>
                                                <span className={`text-xs px-2 py-1 rounded-full ${test.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {test.is_published ? 'Published' : 'Draft'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {test.test_type.replace('_', ' ')} • Created {new Date(test.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No recent tests found.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common tasks to manage your institute.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <button className="w-full justify-start text-left px-4 py-3 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-md transition-colors">
                            + Generate AI Questions
                        </button>
                        <button className="w-full justify-start text-left px-4 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-md transition-colors">
                            + Create New Test
                        </button>
                        <button className="w-full justify-start text-left px-4 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-md transition-colors">
                            + Mark Attendance
                        </button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
