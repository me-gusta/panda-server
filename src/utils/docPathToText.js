import { extname, dirname, basename, resolve } from 'node:path'
import { promises as fs } from 'node:fs'
import { spawn } from 'node:child_process'
import mammoth from 'mammoth'            // for .docx [web:22]
import WordExtractor from 'word-extractor' // for .doc [web:21]
import PDFDocument from 'pdfkit'

export default async function docPathToText(inputPath) {
    // Primary: word-extractor; known to fetch body/headers/footers text for legacy .doc [web:21]
    try {
        const extractor = new WordExtractor()
        const doc = await extractor.extract(inputPath)
        const header = doc.getHeaders({ includeFooters: false }) || ''
        const body = doc.getBody() || ''
        const footer = doc.getFooters() || ''
        return [header, body, footer].filter(Boolean).join('\n')
    } catch {
        // Fallback: LibreOffice headless to plain .txt [web:36][web:27]
        const txtPath = resolve(dirname(inputPath), `${basename(inputPath, '.doc')}.txt`)
        await new Promise((res, rej) => {
            const proc = spawn('soffice', ['--headless', '--convert-to', 'txt:Text', '--outdir', dirname(inputPath), inputPath], { stdio: 'ignore' })
            proc.on('error', rej)
            proc.on('exit', code => code === 0 ? res() : rej(new Error(`LibreOffice exit ${code}`)))
        })
        const txt = await fs.readFile(txtPath, 'utf8')
        return txt
    }
}
