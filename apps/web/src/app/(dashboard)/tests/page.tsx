"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Loader2 } from "lucide-react"

export default function TestsPage() {
    const [tests, setTests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    const fetchTests = async () => {
        try {
            setLoading(true)
            const res = await api.get('/tests')
            const testsData = res?.data?.data || res?.data || res || []
            setTests(Array.isArray(testsData) ? testsData : [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTests()
    }, [])

    const filteredTests = tests.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tests & Assignments</h2>
                    <p className="text-muted-foreground mt-1">Manage tests, assignments, and mock exams.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    {/* Navigate to wizard in real app, triggering modal for prototype sake or simple standard form */}
                    <Button onClick={() => window.location.href = '/tests/create'}>
                        <Plus className="mr-2 h-4 w-4" /> Create Test
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search tests..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9"
                />
            </div>

            <div className="border rounded-md bg-card">
                {loading ? (
                    <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total Marks</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTests.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No tests found</TableCell></TableRow>
                            ) : (
                                filteredTests.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="font-medium">{t.title}</TableCell>
                                        <TableCell><span className="text-xs bg-muted px-2 py-1 rounded-md">{t.test_type.replace('_', ' ')}</span></TableCell>
                                        <TableCell>
                                            <span className={`text-xs px-2 py-1 rounded-md ${t.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>{t.is_published ? 'Published' : 'Draft'}</span>
                                        </TableCell>
                                        <TableCell className="text-right">{t.total_marks}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => window.location.href = `/tests/${t.id}`}>Manage</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    )
}
