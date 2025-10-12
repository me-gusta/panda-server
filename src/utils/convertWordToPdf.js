import { extname } from 'node:path'
import textToPdf from '../utils/textToPdf.js'
import docxPathToText from '../utils/docxPathToText.js'
import docPathToText from '../utils/docPathToText.js'


export async function convertWordToPdf(inputPath, outputPath) {
    const ext = extname(inputPath).toLowerCase()
    if (!(ext === '.doc' || ext === '.docx')) {
        return false
    }
    const text = ext === '.docx'
        ? await docxPathToText(inputPath)
        : await docPathToText(inputPath)
    await textToPdf(text, outputPath)
    return true
}
