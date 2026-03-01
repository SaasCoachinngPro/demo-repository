"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { Loader2 } from "lucide-react"

export default function CreateTestWizard() {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        duration: 60,
        test_type: "PRACTICE",
        total_marks: 100,
        passing_marks: 40,
        is_proctored: false,
        shuffle_questions: true,
    })

    const handleNext = () => setStep(s => Math.min(s + 1, 3))
    const handleBack = () => setStep(s => Math.max(s - 1, 1))

    const handleSubmit = async () => {
        try {
            setLoading(true)
            const res = await api.post('/tests', formData)
            router.push(`/tests/${res.data.id}`)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Create New Test</h2>
                <p className="text-muted-foreground mt-1">Step {step} of 3: {step === 1 ? 'Basic Details' : step === 2 ? 'Configuration' : 'Review & Publish'}</p>
            </div>

            <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-2 flex-1 rounded-full ${step >= i ? 'bg-primary' : 'bg-muted'}`} />
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        {step === 1 && "Basic Information"}
                        {step === 2 && "Test Configuration"}
                        {step === 3 && "Review Details"}
                    </CardTitle>
                    <CardDescription>
                        {step === 1 && "Give your test a meaningful title and description."}
                        {step === 2 && "Configure rules, timings, and proctoring settings."}
                        {step === 3 && "Review all settings before creating the test shell."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                    {/* STEP 1 */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Test Title</Label>
                                <Input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Chapter 4 Physics Mock Test"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief instructions or summary..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Duration (Minutes)</Label>
                                    <Input
                                        type="number"
                                        value={formData.duration}
                                        onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Test Type</Label>
                                    <select
                                        value={formData.test_type}
                                        onChange={e => setFormData({ ...formData, test_type: e.target.value })}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="PRACTICE">Practice Test</option>
                                        <option value="MOCK_EXAM">Mock Exam</option>
                                        <option value="ASSIGNMENT">Assignment</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Total Marks</Label>
                                    <Input
                                        type="number"
                                        value={formData.total_marks}
                                        onChange={e => setFormData({ ...formData, total_marks: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Passing Marks</Label>
                                    <Input
                                        type="number"
                                        value={formData.passing_marks}
                                        onChange={e => setFormData({ ...formData, passing_marks: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex items-center space-x-2 border p-4 rounded-md">
                                    <input
                                        type="checkbox"
                                        id="proctored"
                                        checked={formData.is_proctored}
                                        onChange={e => setFormData({ ...formData, is_proctored: e.target.checked })}
                                        className="h-4 w-4 bg-background"
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label htmlFor="proctored" className="font-medium cursor-pointer">Enable Video Proctoring</Label>
                                        <p className="text-sm text-muted-foreground">Students will be monitored via webcam during the attempt.</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 border p-4 rounded-md">
                                    <input
                                        type="checkbox"
                                        id="shuffle"
                                        checked={formData.shuffle_questions}
                                        onChange={e => setFormData({ ...formData, shuffle_questions: e.target.checked })}
                                        className="h-4 w-4"
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label htmlFor="shuffle" className="font-medium cursor-pointer">Shuffle Questions</Label>
                                        <p className="text-sm text-muted-foreground">Each student will get questions in a random order.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3 */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-1 text-sm">
                                    <span className="text-muted-foreground">Title:</span>
                                    <span className="font-medium">{formData.title || "Untitled"}</span>

                                    <span className="text-muted-foreground">Type:</span>
                                    <span className="font-medium">{formData.test_type}</span>

                                    <span className="text-muted-foreground">Duration:</span>
                                    <span className="font-medium">{formData.duration} mins</span>

                                    <span className="text-muted-foreground">Total Marks:</span>
                                    <span className="font-medium">{formData.total_marks}</span>

                                    <span className="text-muted-foreground">Proctored:</span>
                                    <span className="font-medium">{formData.is_proctored ? 'Yes' : 'No'}</span>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground text-center pt-2">
                                Click create to generate this test. You can add questions from the question bank to the test sections on the next page.
                            </p>
                        </div>
                    )}

                </CardContent>
                <CardFooter className="flex justify-between border-t p-6">
                    <Button variant="outline" onClick={handleBack} disabled={step === 1 || loading}>
                        Back
                    </Button>
                    {step < 3 ? (
                        <Button onClick={handleNext} disabled={step === 1 && !formData.title}>Next Step</Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Test
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
