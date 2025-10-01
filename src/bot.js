import 'dotenv/config'
import {Bot} from 'grammy'
import {hydrateFiles} from '@grammyjs/files'
import {createWriteStream} from 'fs'
import {pipeline} from 'stream/promises'
import path from 'path'
import {assertAccept, enableQuiz, nextQuizStep} from './quizes/quiz.js'
import {getOrCreateUser} from './utils/db.js'
import {generateUniqueFileName, uploadToS3} from './utils/s3.js'
import actions from './utils/actions.js'

const {TG_BOT_TOKEN} = process.env
const MAX_FILE_SIZE = 5 * 1024 * 1024
const IMAGE_EXTENSIONS = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'tif',
    'tiff',
    'bmp',
    'svg',
]
const ALLOWED_EXTENSIONS = [
    'doc',
    'docx',
    'pdf',
    'txt',
    'rtf',
    'odt',
    'pages',
    ...IMAGE_EXTENSIONS,
    'xls',
    'xlsx',
    'ods',
    'csv',
    'md',
]

export const bot = new Bot(TG_BOT_TOKEN, {
    client: {
        environment: 'test',
    },
})

// Enable file downloads
bot.api.config.use(hydrateFiles(bot.token, {
    environment: 'test',
}))

bot.use(async (ctx, next) => {
    if (ctx.from && ctx.from.id) {
        ctx.ctx = {
            user: await getOrCreateUser(ctx),
            tags: []
        }
    }
    return next()
})

bot.on('message:text', async (ctx) => {
    console.log(ctx.ctx)
    actions.text({
        ...ctx.ctx,
        text: ctx.message.text,
    })
})

bot.on('message:photo', async (ctx) => {
    const photo = ctx.message.photo[ctx.message.photo.length - 1]
    if (photo.file_size && photo.file_size > MAX_FILE_SIZE) {
        await ctx.reply('Я не могу обработать такой огромный файл! Максимальный размер файлов: 5 Мегабайт!')
        return
    }
    const file = await ctx.getFile()
    const fp = await file.download(`./data/tmp/${generateUniqueFileName('jpg')}`)
    const cdnURL = await uploadToS3(fp)

    actions.file({
        ...ctx.ctx,
        cdnURL,
        extension: 'jpg',
    })
})


bot.on('message:document', async (ctx) => {
    const document = ctx.message.document
    const file = await ctx.getFile()

    // Check file size
    if (document.file_size && document.file_size > MAX_FILE_SIZE) {
        await ctx.reply('Я не могу обработать такой огромный файл! Максимальный размер файлов: 5 Мегабайт!')
        return
    }

    const fileName = document.file_name || 'file'
    const extension = path.extname(fileName)
    if (!ALLOWED_EXTENSIONS.has(extension)) {
        await ctx.reply('Я не знаю такой формат файла!')
        return
    }

    const fp = await file.download(`./data/tmp/${generateUniqueFileName('jpg')}`)
    const cdnURL = await uploadToS3(fp)

    actions.file({
        ...ctx.ctx,
        cdnURL,
        extension: extension.replace('.', ''),
    })
})


bot.start()
