"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react"

export default function AttendancePage() {
    const [classes, setClasses] = useState<any[]>([])
    const [selectedClass, setSelectedClass] = useState<string>("")
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const today = new Date().toISOString().split('T')[0]

    // State to hold attendance marks: { [studentId]: 'PRESENT' | 'ABSENT' | 'LATE' }
    const [attendanceVals, setAttendanceVals] = useState<Record<string, string>>({})

    useEffect(() => {
        // Fetch classes
        api.get('/attendance/classes')
            .then(res => {
                setClasses(res.data.data)
                if (res.data.data.length > 0) {
                    setSelectedClass(res.data.data[0].id)
                }
            })
            .catch(console.error)
    }, [])

    useEffect(() => {
        if (selectedClass) {
            setLoading(true)
            // Fetch students for the class and today's attendance if any
            Promise.all([
                api.get(`/attendance/classes/${selectedClass}/students`),
                api.get(`/attendance/class/${selectedClass}/date/${today}`)
            ]).then(([studentsRes, attendanceRes]) => {
                setStudents(studentsRes.data.data || [])

                // Map existing attendance
                const existing: Record<string, string> = {}
                const attData = attendanceRes.data.data || []

                // Default all to present first, then override with existing records
                const defaults: Record<string, string> = {}
                studentsRes.data.data?.forEach((s: any) => defaults[s.student_id] = 'PRESENT')

                attData.forEach((a: any) => existing[a.student_id] = a.status)
                setAttendanceVals({ ...defaults, ...existing })
            }).catch(console.error).finally(() => setLoading(false))
        }
    }, [selectedClass, today])

    const setStatus = (studentId: string, status: string) => {
        setAttendanceVals(prev => ({ ...prev, [studentId]: status }))
    }

    const handleSubmit = async () => {
        try {
            setSubmitting(true)
            const records = Object.keys(attendanceVals).map(studentId => ({
                studentId,
                status: attendanceVals[studentId]
            }))

            await api.post('/attendance/mark-bulk', {
                classId: selectedClass,
                date: today,
                records
            })

            alert('Attendance saved successfully!')
        } catch (err) {
            console.error(err)
            alert('Failed to save attendance.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Daily Attendance</h2>
                    <p className="text-muted-foreground mt-1">Mark attendance manually or verify face recognition data.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline">Import Face Scans</Button>
                    <Button onClick={handleSubmit} disabled={submitting || students.length === 0}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Attendance
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4 max-w-xl bg-card p-4 rounded-lg border">
                <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium">Select Class / Batch</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        title="Class Selection"
                    >
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name} - {c.batch}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium">Date</label>
                    <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            <div className="border rounded-md bg-card">
                {loading ? (
                    <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead>Roll / ID</TableHead>
                                <TableHead>Biometric Match</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No students in this class.</TableCell></TableRow>
                            ) : (
                                students.map((s) => {
                                    const status = attendanceVals[s.student_id]
                                    return (
                                        <TableRow key={s.student_id}>
                                            <TableCell className="font-medium">{s.users?.name || 'Unknown Student'}</TableCell>
                                            <TableCell className="text-muted-foreground">{s.student_id.substring(0, 8).toUpperCase()}</TableCell>
                                            <TableCell>
                                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Pending Scan</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant={status === 'PRESENT' ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setStatus(s.student_id, 'PRESENT')}
                                                        className={status === 'PRESENT' ? 'bg-green-600 hover:bg-green-700' : ''}
                                                    >
                                                        <CheckCircle2 className="h-4 w-4 mr-1" /> P
                                                    </Button>
                                                    <Button
                                                        variant={status === 'ABSENT' ? 'destructive' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setStatus(s.student_id, 'ABSENT')}
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" /> A
                                                    </Button>
                                                    <Button
                                                        variant={status === 'LATE' ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setStatus(s.student_id, 'LATE')}
                                                        className={status === 'LATE' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
                                                    >
                                                        <Clock className="h-4 w-4 mr-1" /> L
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    )
}
