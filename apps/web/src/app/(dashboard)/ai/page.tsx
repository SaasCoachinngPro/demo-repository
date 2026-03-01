"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Sparkles, Loader2, Copy } from "lucide-react"

export default function AIToolsPage() {
    const [questionText, setQuestionText] = useState("")
    const [classification, setClassification] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([])
    const [genLoading, setGenLoading] = useState(false)

    const handleClassify = async () => {
        if (!questionText) return
        try {
            setLoading(true)
            const res = await api.post('/ai/classify', { questionText })
            setClassification(res.data)
        } catch (err) {
            console.error(err)
            alert("Failed to classify question")
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateSimilar = async () => {
        // In a real app, we'd pass an actual question ID. For preview, we classify then use that topic.
        if (!classification) return alert("Classify a question first to generate similar ones.")

        try {
            setGenLoading(true)
            // Mocking the generated response logic since /ai/generate/:id expects a DB ID
            // We'll simulate the AI return for UI demonstration
            await new Promise(r => setTimeout(r, 2000))
            setGeneratedQuestions([
                { text: `A variant of the "${classification.topic}" question with different numbers.`, difficulty: classification.difficulty },
                { text: `Another concept-testing question for ${classification.subject}.`, difficulty: 'HARD' }
            ])
        } catch (err) {
            console.error(err)
        } finally {
            setGenLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">AI Teaching Assistant</h2>
                <p className="text-muted-foreground mt-1">Powered by Google Gemini — Auto-classify questions and generate variants.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Question Classification</CardTitle>
                        <CardDescription>Paste any raw question text to automatically extract metadata.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Raw Question Text</Label>
                            <textarea
                                className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={questionText}
                                onChange={e => setQuestionText(e.target.value)}
                                placeholder="e.g., Calculate the velocity of a 5kg block sliding down a 30 degree incline with friction coefficient 0.2 after 3 seconds."
                            />
                        </div>
                        <Button onClick={handleClassify} disabled={loading || !questionText} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Analyze with Gemini
                        </Button>

                        {classification && (
                            <div className="mt-6 p-4 rounded-md bg-muted/50 border space-y-3">
                                <h4 className="font-semibold text-sm">AI Analysis Results:</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground text-xs block">Subject</span>
                                        <span className="font-medium">{classification.subject}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground text-xs block">Difficulty</span>
                                        <span className="font-medium">{classification.difficulty}</span>
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <span className="text-muted-foreground text-xs block">Topic / Chapter</span>
                                        <span className="font-medium">{classification.topic} ({classification.chapter})</span>
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <span className="text-muted-foreground text-xs block">Concepts Identified</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {classification.concepts?.map((c: string, i: number) => (
                                                <span key={i} className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Similar Question Generator</CardTitle>
                        <CardDescription>Generate new practice variants to prevent cheating and build larger test banks.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-primary/5 border border-primary/20 rounded-md p-4 flex flex-col items-center justify-center min-h-[150px] text-center">
                            {classification ? (
                                <>
                                    <p className="text-sm font-medium mb-4">Ready to generate variants based on:<br /><span className="text-muted-foreground font-normal">"{questionText.substring(0, 60)}..."</span></p>
                                    <Button onClick={handleGenerateSimilar} disabled={genLoading} variant="secondary">
                                        {genLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Generate 2 Similar Questions
                                    </Button>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">Classify a base question first to unlock generation.</p>
                            )}
                        </div>

                        {generatedQuestions.length > 0 && (
                            <div className="space-y-3 mt-4">
                                <h4 className="font-semibold text-sm">Generated Variants:</h4>
                                {generatedQuestions.map((gq, i) => (
                                    <div key={i} className="p-3 border rounded-md text-sm space-y-2 relative group">
                                        <p>{gq.text}</p>
                                        <span className="text-[10px] bg-muted px-2 py-1 rounded inline-block">{gq.difficulty}</span>
                                        <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
