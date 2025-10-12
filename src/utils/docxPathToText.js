import { extname, dirname, basename, resolve } from 'node:path'
import { promises as fs } from 'node:fs'
import { spawn } from 'node:child_process'
import mammoth from 'mammoth'            // for .docx [web:22]
import WordExtractor from 'word-extractor' // for .doc [web:21]
import PDFDocument from 'pdfkit'

export default async function docxPathToText(inputPath) {
    const buf = await fs.readFile(inputPath)
    const result = await mammoth.extractRawText({ buffer: buf }) // paragraphs with newlines [web:26]
    return result.value || ''
}
