"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, ChevronRight, ChevronLeft, Check, GraduationCap, BookOpen, Layers, Target } from "lucide-react"
import { cn } from "@/lib/utils"

// Step configuration
const CLASSES = [
    { id: "11", label: "Class 11th" },
    { id: "12", label: "Class 12th" },
    { id: "dropper", label: "Dropper / Repeater" },
]

const EXAM_TYPES = [
    { id: "JEE_MAIN", label: "JEE Main", color: "bg-blue-100 text-blue-700 border-blue-300" },
    { id: "JEE_ADVANCED", label: "JEE Advanced", color: "bg-purple-100 text-purple-700 border-purple-300" },
    { id: "NEET", label: "NEET", color: "bg-green-100 text-green-700 border-green-300" },
    { id: "MHT_CET", label: "MHT-CET", color: "bg-orange-100 text-orange-700 border-orange-300" },
    { id: "ALL", label: "All Exams", color: "bg-gray-100 text-gray-700 border-gray-300" },
]

const DIFFICULTIES = [
    { id: "EASY", label: "Easy", color: "bg-green-100 text-green-700 border-green-300", emoji: "🟢" },
    { id: "MEDIUM", label: "Medium", color: "bg-yellow-100 text-yellow-700 border-yellow-300", emoji: "🟡" },
    { id: "HARD", label: "Hard", color: "bg-red-100 text-red-700 border-red-300", emoji: "🔴" },
    { id: "ALL", label: "All Levels", color: "bg-gray-100 text-gray-700 border-gray-300", emoji: "⚪" },
]

interface SmartImportWizardProps {
    isOpen: boolean
    onClose: () => void
    onImport: (questionIds: string[]) => void
}

export function SmartImportWizard({ isOpen, onClose, onImport }: SmartImportWizardProps) {
    const [step, setStep] = useState(1)
    const [selectedClass, setSelectedClass] = useState("")
    const [selectedExam, setSelectedExam] = useState("")
    const [selectedChapter, setSelectedChapter] = useState("")
    const [selectedDifficulty, setSelectedDifficulty] = useState("")
    const [chapters, setChapters] = useState<any[]>([])
    const [chaptersLoading, setChaptersLoading] = useState(false)
    const [questions, setQuestions] = useState<any[]>([])
    const [questionsLoading, setQuestionsLoading] = useState(false)
    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])

    // Fetch chapters/subjects when we reach step 3
    useEffect(() => {
        if (step === 3) {
            fetchChapters()
        }
    }, [step])

    // Fetch questions when we reach step 5 (results)
    useEffect(() => {
        if (step === 5) {
            fetchFilteredQuestions()
        }
    }, [step])

    const fetchChapters = async () => {
        setChaptersLoading(true)
        try {
            const res = await api.get('/questions/subjects')
            const subjects = res?.data || res || []
            // Also extract any unique chapter-like info from questions tags
            const chapterList = Array.isArray(subjects) ? subjects : []
            // Supplement with common physics/chemistry/math chapters
            const defaultChapters = [
                { id: "circular_motion", name: "Circular Motion" },
                { id: "kinematics", name: "Kinematics" },
                { id: "laws_of_motion", name: "Laws of Motion" },
                { id: "work_energy_power", name: "Work, Energy & Power" },
                { id: "gravitation", name: "Gravitation" },
                { id: "rotational_motion", name: "Rotational Motion" },
                { id: "oscillations", name: "Simple Harmonic Motion" },
                { id: "thermodynamics", name: "Thermodynamics" },
                { id: "electrostatics", name: "Electrostatics" },
                { id: "current_electricity", name: "Current Electricity" },
                { id: "optics", name: "Optics" },
                { id: "modern_physics", name: "Modern Physics" },
                { id: "organic_chemistry", name: "Organic Chemistry" },
                { id: "inorganic_chemistry", name: "Inorganic Chemistry" },
                { id: "physical_chemistry", name: "Physical Chemistry" },
                { id: "algebra", name: "Algebra" },
                { id: "calculus", name: "Calculus" },
                { id: "coordinate_geometry", name: "Coordinate Geometry" },
                { id: "all", name: "All Chapters" },
            ]
            // Merge: if API returned subjects, use those + default
            if (chapterList.length > 0) {
                setChapters([...chapterList, { id: "all", name: "All Chapters" }])
            } else {
                setChapters(defaultChapters)
            }
        } catch {
            // Fallback chapters even if API fails
            setChapters([
                { id: "circular_motion", name: "Circular Motion" },
                { id: "kinematics", name: "Kinematics" },
                { id: "laws_of_motion", name: "Laws of Motion" },
                { id: "all", name: "All Chapters" },
            ])
        } finally {
            setChaptersLoading(false)
        }
    }

    const fetchFilteredQuestions = async () => {
        setQuestionsLoading(true)
        try {
            const params: any = { limit: 100 }
            if (selectedDifficulty && selectedDifficulty !== 'ALL') {
                params.difficulty = selectedDifficulty
            }
            // Search by chapter name in question text if chapter is selected
            if (selectedChapter && selectedChapter !== 'all') {
                const chapterObj = chapters.find(c => c.id === selectedChapter)
                if (chapterObj) {
                    params.search = chapterObj.name
                }
            }
            const res = await api.get('/questions', { params })
            const data = res?.data?.data || res?.data || res || []
            setQuestions(Array.isArray(data) ? data : [])
        } catch {
            setQuestions([])
        } finally {
            setQuestionsLoading(false)
        }
    }

    const handleNext = () => {
        if (step < 5) setStep(step + 1)
    }

    const handleBack = () => {
        if (step > 1) setStep(step - 1)
    }

    const handleImport = () => {
        onImport(selectedQuestions)
        resetWizard()
    }

    const resetWizard = () => {
        setStep(1)
        setSelectedClass("")
        setSelectedExam("")
        setSelectedChapter("")
        setSelectedDifficulty("")
        setSelectedQuestions([])
        setQuestions([])
    }

    const handleClose = () => {
        resetWizard()
        onClose()
    }

    const canProceed = () => {
        switch (step) {
            case 1: return !!selectedClass
            case 2: return !!selectedExam
            case 3: return !!selectedChapter
            case 4: return !!selectedDifficulty
            case 5: return selectedQuestions.length > 0
            default: return false
        }
    }

    if (!isOpen) return null

    const steps = [
        { num: 1, label: "Class", icon: GraduationCap },
        { num: 2, label: "Exam", icon: BookOpen },
        { num: 3, label: "Chapter", icon: Layers },
        { num: 4, label: "Difficulty", icon: Target },
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-2xl flex flex-col max-h-[90vh]">
                <CardHeader className="pb-4 border-b">
                    <CardTitle className="text-xl">Import Questions from Library</CardTitle>
                    <CardDescription>Filter questions step-by-step to find exactly what you need</CardDescription>

                    {/* Stepper */}
                    {step <= 4 && (
                        <div className="flex items-center gap-1 mt-4">
                            {steps.map((s, i) => (
                                <div key={s.num} className="flex items-center">
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                        step === s.num ? "bg-primary text-primary-foreground" :
                                            step > s.num ? "bg-green-100 text-green-700" :
                                                "bg-muted text-muted-foreground"
                                    )}>
                                        {step > s.num ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                                        {s.label}
                                    </div>
                                    {i < steps.length - 1 && (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardHeader>

                <CardContent className="overflow-y-auto flex-1 py-6">
                    {/* Step 1: Select Class */}
                    {step === 1 && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg mb-4">🎓 Select Class</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {CLASSES.map(cls => (
                                    <button
                                        key={cls.id}
                                        onClick={() => setSelectedClass(cls.id)}
                                        className={cn(
                                            "w-full text-left px-5 py-4 rounded-lg border-2 transition-all font-medium",
                                            selectedClass === cls.id
                                                ? "border-primary bg-primary/5 text-primary shadow-sm"
                                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                                        )}
                                    >
                                        {cls.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Select Exam Type */}
                    {step === 2 && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg mb-4">📝 Select Exam Type</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {EXAM_TYPES.map(exam => (
                                    <button
                                        key={exam.id}
                                        onClick={() => setSelectedExam(exam.id)}
                                        className={cn(
                                            "text-left px-5 py-4 rounded-lg border-2 transition-all font-medium",
                                            selectedExam === exam.id
                                                ? "border-primary bg-primary/5 text-primary shadow-sm"
                                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                                        )}
                                    >
                                        {exam.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Select Chapter */}
                    {step === 3 && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg mb-4">📖 Select Chapter</h3>
                            {chaptersLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                                    {chapters.map(ch => (
                                        <button
                                            key={ch.id}
                                            onClick={() => setSelectedChapter(ch.id)}
                                            className={cn(
                                                "text-left px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium",
                                                selectedChapter === ch.id
                                                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                                                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                                            )}
                                        >
                                            {ch.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Select Difficulty */}
                    {step === 4 && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg mb-4">🎯 Select Difficulty Level</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {DIFFICULTIES.map(diff => (
                                    <button
                                        key={diff.id}
                                        onClick={() => setSelectedDifficulty(diff.id)}
                                        className={cn(
                                            "text-left px-5 py-4 rounded-lg border-2 transition-all font-medium text-lg",
                                            selectedDifficulty === diff.id
                                                ? "border-primary bg-primary/5 text-primary shadow-sm"
                                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                                        )}
                                    >
                                        <span className="mr-2">{diff.emoji}</span> {diff.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 5: Show Results */}
                    {step === 5 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-lg">✅ Select Questions ({questions.length} found)</h3>
                                {questions.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            if (selectedQuestions.length === questions.length) {
                                                setSelectedQuestions([])
                                            } else {
                                                setSelectedQuestions(questions.map(q => q.id))
                                            }
                                        }}
                                    >
                                        {selectedQuestions.length === questions.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                )}
                            </div>

                            {/* Active filters summary */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    {CLASSES.find(c => c.id === selectedClass)?.label}
                                </span>
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                    {EXAM_TYPES.find(e => e.id === selectedExam)?.label}
                                </span>
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                    {chapters.find(c => c.id === selectedChapter)?.name || 'All'}
                                </span>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    {DIFFICULTIES.find(d => d.id === selectedDifficulty)?.label}
                                </span>
                            </div>

                            {questionsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    <span className="ml-2 text-muted-foreground">Searching question bank...</span>
                                </div>
                            ) : questions.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p className="text-lg font-medium">No questions match your filters</p>
                                    <p className="text-sm mt-1">Try broadening your search by selecting "All Chapters" or "All Levels"</p>
                                    <Button variant="outline" className="mt-4" onClick={() => setStep(3)}>
                                        Change Filters
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    {questions.map((q, i) => (
                                        <label
                                            key={q.id}
                                            className={cn(
                                                "flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all",
                                                selectedQuestions.includes(q.id)
                                                    ? "border-primary bg-primary/5"
                                                    : "hover:bg-muted/50"
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                className="mt-1 flex-shrink-0 h-4 w-4"
                                                checked={selectedQuestions.includes(q.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedQuestions(prev => [...prev, q.id])
                                                    else setSelectedQuestions(prev => prev.filter(id => id !== q.id))
                                                }}
                                            />
                                            <div className="text-sm flex-1 min-w-0">
                                                <p className="font-medium line-clamp-2">
                                                    <span className="text-muted-foreground mr-1">Q{i + 1}.</span>
                                                    {q.question_text || q.text}
                                                </p>
                                                <div className="flex gap-2 mt-1.5">
                                                    <span className="text-xs bg-muted px-2 py-0.5 rounded">{q.question_type || q.type || 'MCQ'}</span>
                                                    <span className={cn("text-xs px-2 py-0.5 rounded",
                                                        q.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
                                                            q.difficulty === 'HARD' ? 'bg-red-100 text-red-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                    )}>{q.difficulty}</span>
                                                    <span className="text-xs text-muted-foreground">+{q.marks || 4} / -{q.negative_marks || 1}</span>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>

                {/* Footer with navigation */}
                <div className="flex items-center justify-between p-6 border-t bg-card">
                    <div>
                        {step === 5 && (
                            <span className="text-sm font-medium text-primary">
                                {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} selected
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {step > 1 && (
                            <Button variant="outline" onClick={handleBack}>
                                <ChevronLeft className="h-4 w-4 mr-1" /> Back
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleClose}>Cancel</Button>
                        {step < 5 ? (
                            <Button onClick={handleNext} disabled={!canProceed()}>
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        ) : (
                            <Button onClick={handleImport} disabled={selectedQuestions.length === 0}>
                                Import {selectedQuestions.length} Question{selectedQuestions.length !== 1 ? 's' : ''}
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
}
