import express from 'express'
import path from 'path'
import nunjucks from 'nunjucks'


const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(express.static(path.join(__dirname, '../public')))

const nunjucksConfig = nunjucks.configure('./views', {
    autoescape: true,
    express: app,
})

app.get('/', async (req, res) => {
    res.render('index.html')
})
