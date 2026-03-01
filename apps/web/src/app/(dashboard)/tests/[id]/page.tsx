"use client"

import { useState, useEffect, use } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Plus, MoreHorizontal, Download, FileText, FileDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { SmartImportWizard } from "@/components/test/SmartImportWizard"
import { downloadTestAsPdf, downloadTestAsWord } from "@/lib/downloadTestPaper"

export default function TestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [test, setTest] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const [isAddSectionOpen, setIsAddSectionOpen] = useState(false)
    const [newSectionName, setNewSectionName] = useState("")
    const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false)
    const [activeSection, setActiveSection] = useState<string | null>(null)
    const [availableQuestions, setAvailableQuestions] = useState<any[]>([])
    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
    const [actionLoading, setActionLoading] = useState(false)
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
    const [isSmartImportOpen, setIsSmartImportOpen] = useState(false)
    const [smartImportSectionId, setSmartImportSectionId] = useState<string | null>(null)
    const [isDownloadOpen, setIsDownloadOpen] = useState(false)

    const fetchTest = async () => {
        try {
            const res = await api.get(`/tests/${resolvedParams.id}`)
            setTest(res?.data || res)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTest()
    }, [resolvedParams.id])

    const handleAddSection = async () => {
        if (!newSectionName) return
        try {
            setActionLoading(true)
            await api.post(`/tests/${test.id}/sections`, { name: newSectionName })
            setIsAddSectionOpen(false)
            setNewSectionName("")
            fetchTest()
        } catch (err) {
            console.error(err)
        } finally {
            setActionLoading(false)
        }
    }

    const openAddQuestions = async (sectionId: string) => {
        setActiveSection(sectionId)
        setSelectedQuestions([])
        try {
            const res = await api.get('/questions')
            // Handle different response nesting: res could be { data: [...] } or { data: { data: [...] } }
            const questions = res?.data?.data || res?.data || res || []
            setAvailableQuestions(Array.isArray(questions) ? questions : [])
            setIsAddQuestionOpen(true)
        } catch (err) {
            console.error('Failed to fetch questions:', err)
            setAvailableQuestions([])
            setIsAddQuestionOpen(true)
        }
    }

    const handleAssignQuestions = async () => {
        if (!activeSection || selectedQuestions.length === 0) return
        try {
            setActionLoading(true)
            const payload = selectedQuestions.map(qid => ({
                questionId: qid,
                sectionId: activeSection,
                marks: 1, // Default, can be overridden per test backend logic
                negativeMarks: 0
            }))
            await api.post(`/tests/${test.id}/questions`, { questions: payload })
            setIsAddQuestionOpen(false)
            fetchTest()
        } catch (err) {
            console.error(err)
        } finally {
            setActionLoading(false)
        }
    }

    const handlePublish = async () => {
        try {
            setActionLoading(true)
            await api.post(`/tests/${test.id}/publish`)
            fetchTest()
        } catch (err) {
            console.error(err)
        } finally {
            setActionLoading(false)
        }
    }

    const handleSmartImport = async (questionIds: string[]) => {
        if (!smartImportSectionId || questionIds.length === 0) return
        try {
            setActionLoading(true)
            const payload = questionIds.map(qid => ({
                questionId: qid,
                sectionId: smartImportSectionId,
                marks: 4,
                negativeMarks: 1,
            }))
            await api.post(`/tests/${test.id}/questions`, { questions: payload })
            setIsSmartImportOpen(false)
            setSmartImportSectionId(null)
            fetchTest()
        } catch (err) {
            console.error(err)
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    }

    if (!test) {
        return <div className="text-center p-12"><h2 className="text-2xl font-bold">Test not found</h2></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/tests')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{test.title}</h2>
                    <p className="text-muted-foreground mt-1">{test.description || "No description provided."}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold">Test Sections</h3>
                        <Button variant="outline" size="sm" onClick={() => setIsAddSectionOpen(true)}>+ Add Section</Button>
                    </div>

                    {test.test_sections?.length === 0 ? (
                        <Card>
                            <CardContent className="text-center p-12">
                                <p className="text-muted-foreground mb-4">No sections added yet. A test needs at least one section.</p>
                                <Button onClick={() => setIsAddSectionOpen(true)}>Create First Section</Button>
                            </CardContent>
                        </Card>
                    ) : (
                        test.test_sections?.map((section: any) => (
                            <Card key={section.id}>
                                <CardHeader className="pb-3 border-b flex flex-row justify-between items-center">
                                    <div>
                                        <CardTitle className="text-lg">{section.name}</CardTitle>
                                        <CardDescription>{section.test_questions?.length || 0} Questions</CardDescription>
                                    </div>
                                    <div className="relative">
                                        <Button
                                            size="sm"
                                            onClick={() => setOpenDropdownId(openDropdownId === section.id ? null : section.id)}
                                            className="flex items-center gap-2"
                                            variant="secondary"
                                        >
                                            + Add Questions
                                        </Button>
                                        {openDropdownId === section.id && (
                                            <>
                                                <div className="fixed inset-0 z-0" onClick={() => setOpenDropdownId(null)}></div>
                                                <div className="absolute right-0 mt-2 w-72 bg-popover text-popover-foreground rounded-md shadow-lg border z-10 py-1 text-sm overflow-hidden animate-in fade-in-80 zoom-in-95">
                                                    <button className="w-full text-left px-4 py-2 hover:bg-muted flex items-center gap-2" onClick={() => { setOpenDropdownId(null); }}>
                                                        <span className="text-muted-foreground font-bold text-lg leading-none">+</span> Create Question
                                                    </button>
                                                    <button className="w-full text-left px-4 py-2 hover:bg-muted" onClick={() => { setOpenDropdownId(null); }}>
                                                        Bulk Upload from Word Doc <span className="text-[10px] bg-red-500 text-white rounded px-1 py-0.5 ml-1 inline-block transform -translate-y-0.5">Beta</span>
                                                    </button>
                                                    <button className="w-full text-left px-4 py-2 hover:bg-muted" onClick={() => { setOpenDropdownId(null); setSmartImportSectionId(section.id); setIsSmartImportOpen(true); }}>
                                                        Import from Existing Test
                                                    </button>
                                                    <button className="w-full text-left px-4 py-2 hover:bg-muted" onClick={() => { setOpenDropdownId(null); openAddQuestions(section.id); }}>
                                                        Import Questions from Global Library
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    {section.test_questions?.length === 0 ? (
                                        <div className="text-sm text-center text-muted-foreground py-4 border border-dashed rounded-md bg-muted/20">
                                            Empty section. Add some questions from your question bank.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {section.test_questions?.map((tq: any, i: number) => (
                                                <div key={tq.id} className="text-sm p-3 border rounded-md bg-background flex justify-between">
                                                    <div>
                                                        <span className="font-medium mr-2">Q{i + 1}.</span>
                                                        {tq.questions?.question_text || tq.questions?.text || "Unknown Question"}
                                                    </div>
                                                    <span className="text-muted-foreground ml-4">[{tq.marks} Marks]</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Test Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Type:</span>
                                <span className="font-medium">{test.test_type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Duration:</span>
                                <span className="font-medium">{test.duration} mins</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Marks:</span>
                                <span className="font-medium">{test.passing_marks} / {test.total_marks || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <span className={`text-xs px-2 py-1 rounded-md ${test.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {test.is_published ? 'Published' : 'Draft'}
                                </span>
                            </div>

                            {!test.is_published && (
                                <Button className="w-full mt-4" variant="default" onClick={handlePublish} disabled={actionLoading || test.test_sections?.length === 0}>
                                    {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Publish Test'}
                                </Button>
                            )}

                            {/* Download Paper */}
                            <div className="relative mt-3">
                                <Button className="w-full" variant="outline" onClick={() => setIsDownloadOpen(!isDownloadOpen)}>
                                    <Download className="mr-2 h-4 w-4" /> Download Paper
                                </Button>
                                {isDownloadOpen && (
                                    <>
                                        <div className="fixed inset-0 z-0" onClick={() => setIsDownloadOpen(false)} />
                                        <div className="absolute left-0 right-0 mt-2 bg-popover text-popover-foreground rounded-md shadow-lg border z-10 py-1 text-sm overflow-hidden">
                                            <button
                                                className="w-full text-left px-4 py-2.5 hover:bg-muted flex items-center gap-2"
                                                onClick={() => { setIsDownloadOpen(false); downloadTestAsPdf(test) }}
                                            >
                                                <FileText className="h-4 w-4 text-red-500" /> Download as PDF
                                            </button>
                                            <button
                                                className="w-full text-left px-4 py-2.5 hover:bg-muted flex items-center gap-2"
                                                onClick={() => { setIsDownloadOpen(false); downloadTestAsWord(test) }}
                                            >
                                                <FileDown className="h-4 w-4 text-blue-500" /> Download as Word (.docx)
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Add Section Dialog (Simplified modal overlay logic for proto) */}
            {isAddSectionOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-full max-w-sm">
                        <CardHeader>
                            <CardTitle>Add Section</CardTitle>
                            <CardDescription>Create a new section for this test.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="e.g. Physics / Section A"
                                value={newSectionName}
                                onChange={e => setNewSectionName(e.target.value)}
                            />
                        </CardContent>
                        <div className="flex justify-end gap-2 p-6 pt-0">
                            <Button variant="outline" onClick={() => setIsAddSectionOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddSection} disabled={!newSectionName || actionLoading}>Save</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Add Questions Dialog */}
            {isAddQuestionOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-3xl flex flex-col max-h-[90vh]">
                        <CardHeader>
                            <CardTitle>Select Questions</CardTitle>
                            <CardDescription>Pick questions from your bank to add to this section.</CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-y-auto flex-1 space-y-2">
                            {availableQuestions.length === 0 ? (
                                <p className="text-center text-muted-foreground p-8">No questions found in the bank. Go to Question Bank to add some.</p>
                            ) : (
                                availableQuestions.map(q => (
                                    <label key={q.id} className="flex items-start gap-3 p-3 border rounded hover:bg-muted/50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="mt-1 flex-shrink-0"
                                            checked={selectedQuestions.includes(q.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedQuestions(prev => [...prev, q.id]);
                                                else setSelectedQuestions(prev => prev.filter(id => id !== q.id));
                                            }}
                                        />
                                        <div className="text-sm">
                                            <p className="font-medium line-clamp-2">{q.question_text || q.text}</p>
                                            <p className="text-muted-foreground text-xs mt-1">
                                                [{q.question_type || q.type}] | Difficulty: {q.difficulty} | Marks: {q.marks}
                                            </p>
                                        </div>
                                    </label>
                                ))
                            )}
                        </CardContent>
                        <div className="flex items-center justify-between p-6 border-t bg-card">
                            <span className="text-sm font-medium">{selectedQuestions.length} selected</span>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setIsAddQuestionOpen(false)}>Cancel</Button>
                                <Button onClick={handleAssignQuestions} disabled={selectedQuestions.length === 0 || actionLoading}>
                                    {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Add to Section'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Smart Import Wizard */}
            <SmartImportWizard
                isOpen={isSmartImportOpen}
                onClose={() => { setIsSmartImportOpen(false); setSmartImportSectionId(null); }}
                onImport={handleSmartImport}
            />
        </div>
    )
}
