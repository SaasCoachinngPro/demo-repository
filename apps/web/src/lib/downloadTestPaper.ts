import { jsPDF } from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from 'docx'
import { saveAs } from 'file-saver'

interface TestQuestion {
    id: string
    question_text?: string
    text?: string
    question_type?: string
    type?: string
    difficulty?: string
    marks?: number
    negative_marks?: number
    options?: { A?: string; B?: string; C?: string; D?: string } | string[]
    correct_answer?: string
}

interface TestSection {
    id: string
    name: string
    test_questions?: {
        id: string
        marks: number
        negative_marks?: number
        questions?: TestQuestion
    }[]
}

interface TestData {
    id: string
    title: string
    description?: string
    test_type?: string
    duration?: number
    total_marks?: number
    passing_marks?: number
    is_published?: boolean
    test_sections?: TestSection[]
    created_at?: string
}

// Sanitize text: replace Unicode characters that jsPDF cannot render
function sanitizeText(text: string): string {
    if (!text) return ''
    return text
        // Greek letters
        .replace(/π|𝜋/g, 'pi')
        .replace(/θ|𝜃/g, 'theta')
        .replace(/ω|𝜔/g, 'omega')
        .replace(/α|𝛼/g, 'alpha')
        .replace(/β|𝛽/g, 'beta')
        .replace(/γ|𝛾/g, 'gamma')
        .replace(/δ|𝛿/g, 'delta')
        .replace(/ε|𝜀/g, 'epsilon')
        .replace(/μ|𝜇/g, 'mu')
        .replace(/λ|𝜆/g, 'lambda')
        .replace(/σ|𝜎/g, 'sigma')
        .replace(/Σ/g, 'Sigma')
        .replace(/Δ|∆/g, 'Delta')
        .replace(/Ω/g, 'Omega')
        .replace(/φ|𝜙/g, 'phi')
        .replace(/ρ|𝜌/g, 'rho')
        .replace(/τ|𝜏/g, 'tau')
        // Math symbols
        .replace(/√/g, 'sqrt')
        .replace(/∞/g, 'infinity')
        .replace(/≠/g, '!=')
        .replace(/≤/g, '<=')
        .replace(/≥/g, '>=')
        .replace(/±/g, '+/-')
        .replace(/×/g, 'x')
        .replace(/÷/g, '/')
        .replace(/→/g, '->')
        .replace(/←/g, '<-')
        .replace(/↔/g, '<->')
        .replace(/∈/g, 'in')
        .replace(/∉/g, 'not in')
        .replace(/∪/g, 'U')
        .replace(/∩/g, 'intersection')
        .replace(/⊂/g, 'subset')
        .replace(/⊆/g, 'subset=')
        .replace(/°/g, 'deg')
        .replace(/²/g, '^2')
        .replace(/³/g, '^3')
        .replace(/¹/g, '^1')
        .replace(/⁰/g, '^0')
        .replace(/⁴/g, '^4')
        .replace(/⁵/g, '^5')
        // Subscripts
        .replace(/₀/g, '_0')
        .replace(/₁/g, '_1')
        .replace(/₂/g, '_2')
        .replace(/₃/g, '_3')
        // Special quotes and dashes
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")
        .replace(/—/g, '-')
        .replace(/–/g, '-')
        .replace(/…/g, '...')
        // Remove any remaining non-ASCII that jsPDF can't handle
        .replace(/[^\x00-\x7F]/g, (char) => {
            // Try to keep common accented chars
            const map: Record<string, string> = {
                'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
                'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a',
                'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
                'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o',
                'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
                'ñ': 'n', 'ç': 'c',
            }
            return map[char] || '?'
        })
}

// ============================================
// PDF DOWNLOAD — Professional Quality
// ============================================
export function downloadTestAsPdf(test: TestData, instituteName = 'KAP Edutech') {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()  // 210mm
    const pageHeight = doc.internal.pageSize.getHeight() // 297mm
    const marginLeft = 18
    const marginRight = 18
    const contentWidth = pageWidth - marginLeft - marginRight // ~174mm
    let y = 20

    const addFooter = (pdf: jsPDF) => {
        const totalPages = pdf.getNumberOfPages()
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i)
            // Footer line
            pdf.setDrawColor(200)
            pdf.setLineWidth(0.3)
            pdf.line(marginLeft, pageHeight - 15, pageWidth - marginRight, pageHeight - 15)
            // Page number
            pdf.setFontSize(8)
            pdf.setTextColor(130)
            pdf.setFont('helvetica', 'normal')
            pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
            pdf.text(sanitizeText(instituteName), marginLeft, pageHeight - 10)
            pdf.text('All the Best!', pageWidth - marginRight, pageHeight - 10, { align: 'right' })
        }
    }

    const checkPageBreak = (needed: number) => {
        if (y + needed > pageHeight - 22) {
            doc.addPage()
            y = 20
        }
    }

    // ===== HEADER =====
    // Blue header bar
    doc.setFillColor(30, 60, 160)
    doc.rect(0, 0, pageWidth, 32, 'F')

    // Institute name
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(sanitizeText(instituteName), pageWidth / 2, 14, { align: 'center' })

    // Test title
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(220, 220, 255)
    doc.text(sanitizeText(test.title), pageWidth / 2, 24, { align: 'center' })

    y = 40

    // Metadata row with boxes
    const totalMarks = test.total_marks || calculateTotalMarks(test)
    const testType = (test.test_type || 'PRACTICE').replace(/_/g, ' ')
    const duration = test.duration || 0
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

    doc.setFillColor(245, 245, 250)
    doc.roundedRect(marginLeft, y - 4, contentWidth, 14, 2, 2, 'F')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(60)

    const col1 = marginLeft + 5
    const col2 = marginLeft + contentWidth * 0.25
    const col3 = marginLeft + contentWidth * 0.5
    const col4 = marginLeft + contentWidth * 0.75

    doc.text('Type:', col1, y + 3)
    doc.text('Duration:', col2, y + 3)
    doc.text('Total Marks:', col3, y + 3)
    doc.text('Date:', col4, y + 3)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30)
    doc.text(testType, col1, y + 8)
    doc.text(`${duration} min`, col2, y + 8)
    doc.text(`${totalMarks}`, col3, y + 8)
    doc.text(dateStr, col4, y + 8)

    y += 18

    // ===== INSTRUCTIONS =====
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 60, 160)
    doc.text('GENERAL INSTRUCTIONS', marginLeft, y)
    y += 1
    doc.setDrawColor(30, 60, 160)
    doc.setLineWidth(0.5)
    doc.line(marginLeft, y, marginLeft + 50, y)
    y += 5

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(70)
    const instructions = [
        '1. Do not open the question paper until instructed to do so.',
        '2. Read each question carefully before answering.',
        '3. Use of calculators and electronic devices is NOT permitted unless stated.',
        '4. For MCQs, mark only ONE correct option. Multiple markings will not be evaluated.',
        '5. Negative marking applies for incorrect answers unless stated otherwise.',
        '6. Use the blank space at the end for rough work.',
    ]
    instructions.forEach(line => {
        doc.text(sanitizeText(line), marginLeft + 3, y)
        y += 4
    })
    y += 4

    // Separator
    doc.setDrawColor(30, 60, 160)
    doc.setLineWidth(0.4)
    doc.line(marginLeft, y, pageWidth - marginRight, y)
    y += 8

    // ===== SECTIONS & QUESTIONS =====
    let globalQ = 1
    test.test_sections?.forEach((section, sIdx) => {
        checkPageBreak(25)

        // Section header bar
        doc.setFillColor(235, 240, 255)
        doc.roundedRect(marginLeft, y - 4, contentWidth, 12, 2, 2, 'F')
        doc.setDrawColor(30, 60, 160)
        doc.setLineWidth(0.3)
        doc.roundedRect(marginLeft, y - 4, contentWidth, 12, 2, 2, 'S')

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 60, 160)
        doc.text(sanitizeText(`Section ${sIdx + 1}: ${section.name}`), marginLeft + 5, y + 3)

        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100)
        doc.text(`(${section.test_questions?.length || 0} Questions)`, pageWidth - marginRight - 5, y + 3, { align: 'right' })
        y += 14

        // Questions
        section.test_questions?.forEach((tq) => {
            const q = tq.questions
            if (!q) return

            const rawText = q.question_text || q.text || 'Question text not available'
            const questionText = sanitizeText(rawText)
            const marks = tq.marks || q.marks || 4
            const negMarks = tq.negative_marks || q.negative_marks || 1
            const qType = q.question_type || q.type || 'MCQ'

            checkPageBreak(30)

            // Question number + marks badge
            doc.setFontSize(9)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(30, 60, 160)
            const qLabel = `Q${globalQ}.`
            doc.text(qLabel, marginLeft, y)

            // Marks badge on the right
            doc.setFontSize(7)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(100)
            const marksStr = `[+${marks} / -${negMarks}]`
            doc.text(marksStr, pageWidth - marginRight, y, { align: 'right' })

            // Question text (wrapped properly)
            const textStartX = marginLeft + 10
            const textWidth = contentWidth - 10 - 25 // Leave room for marks badge
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(20)

            const wrappedLines = doc.splitTextToSize(questionText, textWidth)
            wrappedLines.forEach((line: string, lIdx: number) => {
                if (lIdx > 0) {
                    checkPageBreak(5)
                }
                doc.text(line, textStartX, y)
                y += 4.2
            })

            y += 1

            // Options (for MCQ)
            if (qType === 'MCQ' && q.options) {
                doc.setFontSize(8.5)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(40)

                let options: Record<string, string> = {}
                if (Array.isArray(q.options)) {
                    q.options.forEach((opt: string, i: number) => {
                        options[String.fromCharCode(65 + i)] = sanitizeText(opt)
                    })
                } else if (typeof q.options === 'object') {
                    Object.entries(q.options as Record<string, string>).forEach(([k, v]) => {
                        options[k] = sanitizeText(String(v))
                    })
                }

                const optKeys = Object.keys(options)

                if (optKeys.length === 4) {
                    // 2x2 grid layout
                    const colWidth = (contentWidth - 10) / 2
                    const optStartX = marginLeft + 10

                    for (let row = 0; row < 2; row++) {
                        checkPageBreak(8)
                        const i1 = row * 2
                        const i2 = row * 2 + 1

                        const label1 = `(${optKeys[i1]}) `
                        const text1 = options[optKeys[i1]] || ''
                        const label2 = i2 < 4 ? `(${optKeys[i2]}) ` : ''
                        const text2 = i2 < 4 ? (options[optKeys[i2]] || '') : ''

                        // Option 1 - left column
                        const wrapped1 = doc.splitTextToSize(label1 + text1, colWidth - 5)
                        // Option 2 - right column
                        const wrapped2 = text2 ? doc.splitTextToSize(label2 + text2, colWidth - 5) : []

                        const maxLines = Math.max(wrapped1.length, wrapped2.length)
                        for (let j = 0; j < maxLines; j++) {
                            if (wrapped1[j]) doc.text(wrapped1[j], optStartX, y)
                            if (wrapped2[j]) doc.text(wrapped2[j], optStartX + colWidth, y)
                            y += 4
                        }
                    }
                } else {
                    // Vertical layout for non-4 options
                    optKeys.forEach(key => {
                        checkPageBreak(6)
                        const optLine = `(${key}) ${options[key]}`
                        const wrapped = doc.splitTextToSize(optLine, contentWidth - 15)
                        wrapped.forEach((line: string) => {
                            doc.text(line, marginLeft + 12, y)
                            y += 4
                        })
                    })
                }
            }

            // Light separator between questions
            y += 2
            doc.setDrawColor(220)
            doc.setLineWidth(0.15)
            doc.line(marginLeft + 10, y, pageWidth - marginRight - 10, y)
            y += 5

            globalQ++
        })

        y += 3
    })

    // ===== END OF PAPER =====
    checkPageBreak(20)
    y += 5
    doc.setDrawColor(30, 60, 160)
    doc.setLineWidth(0.5)
    doc.line(marginLeft, y, pageWidth - marginRight, y)
    y += 8
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 60, 160)
    doc.text('--- END OF QUESTION PAPER ---', pageWidth / 2, y, { align: 'center' })
    y += 6
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100)
    doc.text('All the Best!', pageWidth / 2, y, { align: 'center' })

    // Add footers on all pages
    addFooter(doc)

    // Save
    const filename = `${test.title.replace(/[^a-zA-Z0-9]/g, '_')}_Paper.pdf`
    doc.save(filename)
}

// ============================================
// WORD DOWNLOAD
// ============================================
export async function downloadTestAsWord(test: TestData, instituteName = 'KAP Edutech') {
    const children: any[] = []

    // Header
    children.push(
        new Paragraph({
            children: [new TextRun({ text: instituteName, bold: true, size: 36, color: '1E3CA0', font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
        }),
        new Paragraph({
            children: [],
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1E3CA0' } },
            spacing: { after: 80 },
        }),
        new Paragraph({
            children: [new TextRun({ text: test.title, bold: true, size: 28, font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
        })
    )

    // Metadata
    const totalMarks = test.total_marks || calculateTotalMarks(test)
    const metaLine = `Type: ${(test.test_type || 'PRACTICE').replace(/_/g, ' ')}  |  Duration: ${test.duration || 0} min  |  Total Marks: ${totalMarks}`
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

    children.push(
        new Paragraph({
            children: [new TextRun({ text: metaLine, size: 18, color: '555555', font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
        }),
        new Paragraph({
            children: [new TextRun({ text: `Date: ${dateStr}`, size: 18, color: '555555', font: 'Arial' })],
            alignment: AlignmentType.LEFT,
            spacing: { after: 100 },
        })
    )

    // Separator
    children.push(
        new Paragraph({
            children: [],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '1E3CA0' } },
            spacing: { after: 150 },
        })
    )

    // Instructions
    children.push(
        new Paragraph({
            children: [new TextRun({ text: 'GENERAL INSTRUCTIONS', bold: true, size: 22, color: '1E3CA0', font: 'Arial' })],
            spacing: { after: 60 },
        })
    )

    const instructions = [
        '1. Do not open the question paper until instructed.',
        '2. Read each question carefully before answering.',
        '3. Use of calculators and electronic devices is NOT permitted.',
        '4. For MCQs, mark only ONE correct option.',
        '5. Negative marking applies for incorrect answers.',
        '6. Use the blank space at the end for rough work.',
    ]

    instructions.forEach(line => {
        children.push(
            new Paragraph({
                children: [new TextRun({ text: line, size: 18, color: '444444', font: 'Arial' })],
                spacing: { after: 30 },
                indent: { left: 200 },
            })
        )
    })

    children.push(
        new Paragraph({
            children: [],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' } },
            spacing: { after: 200, before: 100 },
        })
    )

    // Sections & Questions
    let globalQ = 1
    test.test_sections?.forEach((section, sIdx) => {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({ text: `Section ${sIdx + 1}: ${section.name}`, bold: true, size: 24, color: '1E3CA0', font: 'Arial' }),
                    new TextRun({ text: `  (${section.test_questions?.length || 0} Questions)`, size: 18, color: '888888', font: 'Arial' }),
                ],
                spacing: { before: 200, after: 100 },
                shading: { type: 'clear' as any, fill: 'EBF0FF' },
            })
        )

        section.test_questions?.forEach((tq) => {
            const q = tq.questions
            if (!q) return

            const questionText = q.question_text || q.text || ''
            const marks = tq.marks || q.marks || 4
            const negMarks = tq.negative_marks || q.negative_marks || 1

            children.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: `Q${globalQ}. `, bold: true, size: 20, color: '1E3CA0', font: 'Arial' }),
                        new TextRun({ text: questionText, size: 20, font: 'Arial' }),
                        new TextRun({ text: `  [+${marks}/-${negMarks}]`, size: 16, color: '999999', font: 'Arial' }),
                    ],
                    spacing: { before: 120, after: 60 },
                })
            )

            // Options
            const qType = q.question_type || q.type || 'MCQ'
            if (qType === 'MCQ' && q.options) {
                let options: Record<string, string> = {}
                if (Array.isArray(q.options)) {
                    q.options.forEach((opt: string, i: number) => {
                        options[String.fromCharCode(65 + i)] = opt
                    })
                } else if (typeof q.options === 'object') {
                    options = q.options as Record<string, string>
                }

                Object.entries(options).forEach(([key, val]) => {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: `(${key}) `, bold: true, size: 18, font: 'Arial' }),
                                new TextRun({ text: String(val), size: 18, font: 'Arial' }),
                            ],
                            spacing: { after: 30 },
                            indent: { left: 400 },
                        })
                    )
                })
            }

            globalQ++
        })
    })

    // Footer
    children.push(
        new Paragraph({
            children: [],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '1E3CA0' } },
            spacing: { before: 300, after: 100 },
        }),
        new Paragraph({
            children: [new TextRun({ text: '--- END OF QUESTION PAPER ---', bold: true, size: 20, color: '1E3CA0', font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 100 },
        }),
        new Paragraph({
            children: [new TextRun({ text: 'All the Best!', italics: true, size: 20, color: '888888', font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 60 },
        })
    )

    const doc = new Document({
        sections: [{
            properties: {},
            children,
        }],
    })

    const blob = await Packer.toBlob(doc)
    const filename = `${test.title.replace(/[^a-zA-Z0-9]/g, '_')}_Paper.docx`
    saveAs(blob, filename)
}

// Utility
function calculateTotalMarks(test: TestData): number {
    let total = 0
    test.test_sections?.forEach(section => {
        section.test_questions?.forEach(tq => {
            total += tq.marks || 4
        })
    })
    return total
}
