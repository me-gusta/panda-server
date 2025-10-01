import express from 'express'
import path from 'path'
import nunjucks from 'nunjucks'
import {fileURLToPath} from 'url'


const startExpressApp = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

startExpressApp.use(express.json())
// app.use(express.urlencoded({extended: false}))
startExpressApp.use(express.static(path.join(__dirname, '../public')))

const nunjucksConfig = nunjucks.configure('./views', {
    autoescape: true,
    express: startExpressApp,
})

startExpressApp.get('/', async (req, res) => {
    console.log('aaa')
    res.render('index.html')
})

startExpressApp.listen(3010, () => console.log(`Server running on http://localhost:3010`))
