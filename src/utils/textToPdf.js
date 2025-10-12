import { dirname } from 'node:path'
import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import PDFDocument from 'pdfkit'

export default async function textToPdf(text, outputPath) {
    await fsp.mkdir(dirname(outputPath), { recursive: true })
    await new Promise((resolvePromise, rejectPromise) => {
        const doc = new PDFDocument({ margin: 50 }) // default font, no styling
        const stream = fs.createWriteStream(outputPath)
        doc.pipe(stream)
        // Write text as-is; PDFKit wraps lines automatically
        doc.font('Times-Roman').fontSize(12).text(text || '')
        doc.end()
        stream.on('finish', resolvePromise)
        stream.on('error', rejectPromise)
    })
}
