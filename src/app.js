import express from 'express'
import path from 'path'
import nunjucks from 'nunjucks'
import {fileURLToPath} from 'url'


const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.json())
// app.use(express.urlencoded({extended: false}))
app.use(express.static(path.join(__dirname, '../public')))

const nunjucksConfig = nunjucks.configure('./views', {
    autoescape: true,
    express: app,
})

app.get('/', async (req, res) => {
    console.log('aaa')
    res.render('index.html')
})

app.listen(3010, () => console.log(`Server running on http://localhost:3010`))
