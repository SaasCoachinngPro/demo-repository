"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"

export default function StudentsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Students Directory</h2>
                    <p className="text-muted-foreground mt-1">Manage all students enrolled in your institute.</p>
                </div>
                <Button>
                    <Users className="mr-2 h-4 w-4" /> Add Student
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Students</CardTitle>
                    <CardDescription>A list of all students currently enrolled.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center p-12 border border-dashed rounded-lg bg-muted/50">
                        <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium">No students found</h3>
                        <p className="text-muted-foreground mb-4">You haven't added any students yet.</p>
                        <Button variant="outline">Import from CSV</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
