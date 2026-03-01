"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Filter, Loader2, Upload, Bot, Pencil, Trash2, BookOpen, BarChart3, CheckCircle2, AlertCircle, X, Eye, ChevronDown } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Label } from "@/components/ui/label"
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Card, CardContent } from "@/components/ui/card"

const questionSchema = z.object({
    text: z.string().min(10, 'Question text is required'),
    type: z.enum(['MCQ', 'NUMERICAL']),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    marks: z.coerce.number().min(1),
    negative_marks: z.coerce.number().min(0).optional(),
    option_a: z.string().optional(),
    option_b: z.string().optional(),
    option_c: z.string().optional(),
    option_d: z.string().optional(),
    correct_answer: z.string(),
    subject_id: z.string().optional(),
})

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isImportOpen, setIsImportOpen] = useState(false)
    const [importFile, setImportFile] = useState<File | null>(null)

    // AI Import State
    const [isAiImportOpen, setIsAiImportOpen] = useState(false)
    const [aiFile, setAiFile] = useState<File | null>(null)
    const [aiQuestions, setAiQuestions] = useState<any[]>([])
    const [isAiReviewOpen, setIsAiReviewOpen] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)

    // Edit State
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState<any>(null)

    // View/Expand State
    const [expandedId, setExpandedId] = useState<string | null>(null)

    // Filter State
    const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL")
    const [typeFilter, setTypeFilter] = useState<string>("ALL")

    const { register, handleSubmit, reset, watch, formState: { errors }, setValue } = useForm({
        resolver: zodResolver(questionSchema),
        defaultValues: {
            type: 'MCQ' as const,
            difficulty: 'MEDIUM' as const,
            marks: 4,
            negative_marks: 1,
            text: '',
            correct_answer: '',
            option_a: '',
            option_b: '',
            option_c: '',
            option_d: '',
        }
    })

    const qType = watch('type')

    const fetchQuestions = async () => {
        try {
            setLoading(true)
            const res = await api.get('/questions', { params: { search } })
            // Debug: log the raw response to find the correct data path
            console.log('📋 Questions API raw response:', JSON.stringify(res)?.substring(0, 300))
            console.log('📋 typeof res:', typeof res, 'isArray:', Array.isArray(res))

            // Try every possible nesting level
            let questionsData: any[] = []
            if (Array.isArray(res)) {
                questionsData = res
            } else if (Array.isArray(res?.data?.data)) {
                questionsData = res.data.data
            } else if (Array.isArray(res?.data)) {
                questionsData = res.data
            } else if (res?.data && typeof res.data === 'object') {
                // Paginated response — data is inside
                questionsData = res.data.data || res.data || []
            }

            console.log('📋 Parsed questions count:', questionsData.length)
            setQuestions(Array.isArray(questionsData) ? questionsData : [])
        } catch (err) {
            console.error('❌ Questions fetch error:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchQuestions()
    }, [search])

    const onSubmit = async (data: any) => {
        try {
            const options: any = {}
            if (data.type === 'MCQ') {
                options.A = data.option_a || 'Option A'
                options.B = data.option_b || 'Option B'
                options.C = data.option_c || 'Option C'
                options.D = data.option_d || 'Option D'
            }

            const payload = {
                questionText: data.text,
                questionType: data.type,
                difficulty: data.difficulty,
                marks: data.marks,
                negativeMarks: data.negative_marks,
                correctAnswer: data.correct_answer,
                options: data.type === 'MCQ' ? options : undefined
            }

            await api.post('/questions', payload)
            setIsAddOpen(false)
            reset()
            fetchQuestions()
        } catch (err) {
            console.error(err)
        }
    }

    // ==== EDIT HANDLERS ====
    const openEditDialog = (q: any) => {
        setEditingQuestion(q)
        const opts = q.options || {}
        setValue('text', q.question_text || q.text || '')
        setValue('type', q.question_type || q.type || 'MCQ')
        setValue('difficulty', q.difficulty || 'MEDIUM')
        setValue('marks', q.marks || 4)
        setValue('negative_marks', q.negative_marks || 1)
        setValue('correct_answer', q.correct_answer || '')
        setValue('option_a', opts.A || opts.a || '')
        setValue('option_b', opts.B || opts.b || '')
        setValue('option_c', opts.C || opts.c || '')
        setValue('option_d', opts.D || opts.d || '')
        setIsEditOpen(true)
    }

    const onEditSubmit = async (data: any) => {
        if (!editingQuestion) return
        try {
            const options: any = {}
            if (data.type === 'MCQ') {
                options.A = data.option_a || ''
                options.B = data.option_b || ''
                options.C = data.option_c || ''
                options.D = data.option_d || ''
            }

            const payload = {
                questionText: data.text,
                questionType: data.type,
                difficulty: data.difficulty,
                marks: data.marks,
                negativeMarks: data.negative_marks,
                correctAnswer: data.correct_answer,
                options: data.type === 'MCQ' ? options : undefined
            }

            await api.patch(`/questions/${editingQuestion.id}`, payload)
            setIsEditOpen(false)
            setEditingQuestion(null)
            reset()
            fetchQuestions()
        } catch (err) {
            console.error('Edit failed:', err)
            alert('Failed to update question.')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this question?')) return
        try {
            await api.delete(`/questions/${id}`)
            fetchQuestions()
        } catch (err) {
            console.error('Delete failed:', err)
        }
    }

    const handleImportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!importFile) return

        const formData = new FormData()
        formData.append('file', importFile)

        try {
            setLoading(true)
            await api.post('/questions/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setIsImportOpen(false)
            setImportFile(null)
            fetchQuestions()
        } catch (err) {
            console.error('Import failed', err)
            alert('Failed to import questions. Please check the CSV format.')
        } finally {
            setLoading(false)
        }
    }

    const handleAiImportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!aiFile) return

        const formData = new FormData()
        formData.append('file', aiFile)

        try {
            setAiLoading(true)
            const res = await api.post('/questions/import/ai', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 120000,
            })

            const questions = res?.data?.data || res?.data || res || []
            const questionArr = Array.isArray(questions) ? questions : []

            if (questionArr.length === 0) {
                alert('AI could not extract any questions from this document. Try a clearer PDF or wait 1-2 minutes for the AI rate limit to reset.')
                return
            }

            setAiQuestions(questionArr)
            setIsAiImportOpen(false)
            setAiFile(null)
            setIsAiReviewOpen(true)
        } catch (err: any) {
            console.error('AI Import failed', err)
            const errorMsg = err?.message || err?.response?.data?.message || err?.error?.message || 'Unknown error'
            alert(`AI Extraction failed: ${errorMsg}`)
        } finally {
            setAiLoading(false)
        }
    }

    const handleSaveAiQuestions = async () => {
        try {
            setAiLoading(true)
            await api.post('/questions/bulk', { questions: aiQuestions })
            setIsAiReviewOpen(false)
            setAiQuestions([])
            fetchQuestions()
        } catch (err) {
            console.error('Saving AI questions failed', err)
            alert('Failed to save questions to the database.')
        } finally {
            setAiLoading(false)
        }
    }

    const downloadTemplate = () => {
        const headers = ['Question', 'Type', 'A', 'B', 'C', 'D', 'Answer', 'Explanation', 'Difficulty', 'Marks', 'Negative_Marks', 'Tags']
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" +
            '"What is the capital of France?","MCQ","Berlin","Madrid","Paris","Rome","C","Paris is the capital.","EASY","1","0","Geography,Capitals"'

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "questions_template.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Stats
    const totalQ = questions.length
    const easyCount = questions.filter(q => (q.difficulty || '').toUpperCase() === 'EASY').length
    const mediumCount = questions.filter(q => (q.difficulty || '').toUpperCase() === 'MEDIUM').length
    const hardCount = questions.filter(q => (q.difficulty || '').toUpperCase() === 'HARD').length
    const mcqCount = questions.filter(q => (q.question_type || q.type || '') === 'MCQ').length

    // Filtered questions
    const filteredQuestions = questions.filter(q => {
        if (difficultyFilter !== 'ALL' && (q.difficulty || '').toUpperCase() !== difficultyFilter) return false
        if (typeFilter !== 'ALL' && (q.question_type || q.type || '') !== typeFilter) return false
        return true
    })

    const getDifficultyStyle = (d: string) => {
        const upper = (d || '').toUpperCase()
        if (upper === 'EASY') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
        if (upper === 'MEDIUM') return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'
    }

    const getDifficultyDot = (d: string) => {
        const upper = (d || '').toUpperCase()
        if (upper === 'EASY') return 'bg-emerald-500'
        if (upper === 'MEDIUM') return 'bg-amber-500'
        return 'bg-rose-500'
    }

    // Shared form JSX
    const renderQuestionForm = (submitHandler: any, submitLabel: string) => (
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-5">
            <div className="space-y-2">
                <Label className="text-sm font-semibold">Question Text *</Label>
                <textarea
                    {...register('text')}
                    placeholder="Enter the full question text..."
                    className="flex w-full rounded-lg border border-input bg-background px-4 py-3 text-sm min-h-[100px] resize-y focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                {errors.text && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{String(errors.text.message)}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm font-semibold">Type</Label>
                    <select {...register('type')} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                        <option value="MCQ">Multiple Choice (MCQ)</option>
                        <option value="NUMERICAL">Numerical</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-semibold">Difficulty</Label>
                    <select {...register('difficulty')} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                        <option value="EASY">🟢 Easy</option>
                        <option value="MEDIUM">🟡 Medium</option>
                        <option value="HARD">🔴 Hard</option>
                    </select>
                </div>
            </div>

            {qType === 'MCQ' && (
                <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                    <Label className="text-sm font-semibold">Options</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">A</span>
                            <Input {...register('option_a')} placeholder="Option A" className="h-9" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">B</span>
                            <Input {...register('option_b')} placeholder="Option B" className="h-9" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">C</span>
                            <Input {...register('option_c')} placeholder="Option C" className="h-9" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">D</span>
                            <Input {...register('option_d')} placeholder="Option D" className="h-9" />
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm font-semibold">Marks (+)</Label>
                    <Input type="number" {...register('marks')} className="h-10" />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-semibold">Negative (-)</Label>
                    <Input type="number" {...register('negative_marks')} className="h-10" />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-semibold">Answer</Label>
                    <Input {...register('correct_answer')} placeholder={qType === 'MCQ' ? "A, B, C, D" : "42"} className="h-10" />
                    {errors.correct_answer && <p className="text-xs text-destructive">{String(errors.correct_answer.message)}</p>}
                </div>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t">
                <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); reset(); }}>Cancel</Button>
                <Button type="submit">{submitLabel}</Button>
            </div>
        </form>
    )

    return (
        <div className="space-y-6">
            {/* Header with gradient accent */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6 text-white shadow-lg">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-30"></div>
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <BookOpen className="h-6 w-6" /> Question Bank
                        </h2>
                        <p className="text-white/80 mt-1 text-sm">Manage, organize, and import questions for your institute</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Dialog open={isAiImportOpen} onOpenChange={setIsAiImportOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white shadow-sm">
                                    <Bot className="mr-2 h-4 w-4" /> Auto-Extract (AI)
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-indigo-500" /> Extract Questions via AI</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAiImportSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Exam Paper (PDF or Word)</Label>
                                        <Input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.txt"
                                            onChange={e => setAiFile(e.target.files?.[0] || null)}
                                            className="cursor-pointer"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Upload a raw past paper. Our AI will automatically identify questions, options, difficulty, and correct answers.
                                        </p>
                                    </div>
                                    <div className="pt-4 flex justify-end gap-2">
                                        <Button type="button" variant="outline" onClick={() => setIsAiImportOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={!aiFile || aiLoading} className="bg-indigo-600 hover:bg-indigo-700">
                                            {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                                            {aiLoading ? 'Extracting...' : 'Start Extraction'}
                                        </Button>
                                    </div>
                                    {aiLoading && (
                                        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                                            <p className="text-xs text-center text-indigo-600 dark:text-indigo-400 animate-pulse">
                                                🤖 AI is reading your document. This may take up to 60 seconds...
                                            </p>
                                        </div>
                                    )}
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white shadow-sm">
                                    <Upload className="mr-2 h-4 w-4" /> Bulk Import
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Bulk Import Questions</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleImportSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>CSV or Excel File</Label>
                                        <Input
                                            type="file"
                                            accept=".csv,.xlsx,.xls"
                                            onChange={e => setImportFile(e.target.files?.[0] || null)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Upload a properly formatted spreadsheet to bulk add questions.
                                            <button type="button" onClick={downloadTemplate} className="text-primary hover:underline ml-1">Download Template</button>
                                        </p>
                                    </div>
                                    <div className="pt-4 flex justify-end gap-2">
                                        <Button type="button" variant="outline" onClick={() => setIsImportOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={!importFile || loading}>
                                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Upload'}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) reset(); }}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-white text-indigo-700 hover:bg-white/90 shadow-sm font-semibold">
                                    <Plus className="mr-2 h-4 w-4" /> Add Question
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-indigo-500" /> Add New Question</DialogTitle>
                                </DialogHeader>
                                {renderQuestionForm(onSubmit, 'Save Question')}
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-background">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalQ}</p>
                            <p className="text-xs text-muted-foreground">Total Questions</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-background">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{easyCount}</p>
                            <p className="text-xs text-muted-foreground">Easy</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-background">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                            <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{mediumCount}</p>
                            <p className="text-xs text-muted-foreground">Medium</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/30 dark:to-background">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{hardCount}</p>
                            <p className="text-xs text-muted-foreground">Hard</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-background">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                            <Filter className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{mcqCount}</p>
                            <p className="text-xs text-muted-foreground">MCQ Type</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search + Filter Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search questions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-10 rounded-lg"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={difficultyFilter}
                        onChange={e => setDifficultyFilter(e.target.value)}
                        className="h-10 px-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="ALL">All Difficulty</option>
                        <option value="EASY">🟢 Easy</option>
                        <option value="MEDIUM">🟡 Medium</option>
                        <option value="HARD">🔴 Hard</option>
                    </select>
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className="h-10 px-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="ALL">All Types</option>
                        <option value="MCQ">MCQ</option>
                        <option value="NUMERICAL">Numerical</option>
                    </select>
                </div>
                <p className="text-sm text-muted-foreground ml-auto">
                    Showing {filteredQuestions.length} of {totalQ} questions
                </p>
            </div>

            {/* Questions Table */}
            <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        <p className="text-sm text-muted-foreground">Loading questions...</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableHead className="font-semibold text-xs uppercase tracking-wider w-12">#</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wider">Question</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wider w-24">Type</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wider w-28">Difficulty</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wider text-center w-24">Marks</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wider text-right w-32">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredQuestions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                                            <p className="text-muted-foreground font-medium">No questions found</p>
                                            <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredQuestions.map((q, i) => (
                                    <TableRow
                                        key={q.id}
                                        className="group hover:bg-muted/40 transition-colors cursor-pointer"
                                        onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                                    >
                                        <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                                        <TableCell>
                                            <div className="max-w-[400px]">
                                                <p className={`text-sm font-medium ${expandedId === q.id ? '' : 'truncate'}`}>
                                                    {q.question_text || q.text}
                                                </p>
                                                {expandedId === q.id && q.options && (
                                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                                        {Object.entries(q.options).map(([key, val]) => (
                                                            <div key={key} className={`text-xs p-2 rounded-md border ${q.correct_answer === key
                                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                                                                : 'bg-muted/50'
                                                                }`}>
                                                                <span className="font-bold mr-1">({key})</span> {String(val)}
                                                                {q.correct_answer === key && <span className="ml-1 text-emerald-600">✓</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-medium bg-muted px-2.5 py-1 rounded-full">
                                                {q.question_type || q.type}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1.5 w-fit ${getDifficultyStyle(q.difficulty)}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${getDifficultyDot(q.difficulty)}`}></span>
                                                {q.difficulty}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-sm font-medium text-emerald-600">+{q.marks || 4}</span>
                                            <span className="text-muted-foreground mx-1">/</span>
                                            <span className="text-sm font-medium text-rose-500">-{q.negative_marks || 1}</span>
                                        </TableCell>
                                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30"
                                                    onClick={() => openEditDialog(q)}
                                                    title="Edit question"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30"
                                                    onClick={() => handleDelete(q.id)}
                                                    title="Delete question"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) { setEditingQuestion(null); reset(); } }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-indigo-500" /> Edit Question</DialogTitle>
                    </DialogHeader>
                    {renderQuestionForm(onEditSubmit, 'Update Question')}
                </DialogContent>
            </Dialog>

            {/* AI Review Dialog */}
            <Dialog open={isAiReviewOpen} onOpenChange={setIsAiReviewOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-indigo-500" />
                            Review Extracted Questions ({aiQuestions.length})
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground">The AI extracted these questions. Review them before saving to the Question Bank.</p>
                    </DialogHeader>
                    <div className="overflow-y-auto flex-1 p-2 border rounded-lg bg-muted/20">
                        {aiQuestions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-2">
                                <Bot className="h-10 w-10 text-muted-foreground/40" />
                                <p className="text-center text-muted-foreground">No questions were extracted.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {aiQuestions.map((q, i) => (
                                    <div key={i} className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-medium text-sm flex gap-2 flex-1 min-w-0">
                                                <span className="text-indigo-600 font-bold flex-shrink-0">Q{i + 1}.</span>
                                                <span className="break-words">{q.questionText}</span>
                                            </div>
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ml-3 ${getDifficultyStyle(q.difficulty)}`}>
                                                {q.questionType} • {q.difficulty}
                                            </span>
                                        </div>
                                        {q.options && Object.keys(q.options).length > 0 && (
                                            <div className="grid grid-cols-2 gap-2 text-sm mt-3 mb-3">
                                                {Object.entries(q.options).map(([key, val]) => (
                                                    <div key={key} className={`p-2.5 border rounded-lg text-xs ${q.correctAnswer === key ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-background'}`}>
                                                        <span className="font-bold mr-2">({key})</span>
                                                        {String(val)}
                                                        {q.correctAnswer === key && <span className="ml-2 text-emerald-600 font-bold">✓ Correct</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex gap-3 mt-3 text-xs text-muted-foreground border-t pt-2">
                                            <span>Marks: +{q.marks}</span>
                                            <span>Negative: -{q.negativeMarks}</span>
                                            {q.tags?.length > 0 && <span className="ml-auto">Tags: {q.tags.join(', ')}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="pt-4 flex justify-end gap-2 shrink-0 border-t">
                        <Button type="button" variant="outline" onClick={() => setIsAiReviewOpen(false)}>Discard</Button>
                        <Button type="button" onClick={handleSaveAiQuestions} disabled={aiQuestions.length === 0 || aiLoading} className="bg-indigo-600 hover:bg-indigo-700">
                            {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Save All to Question Bank
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
