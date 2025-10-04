import 'dotenv/config'
import {Bot} from 'grammy'
import {hydrateFiles} from '@grammyjs/files'
import path from 'path'
import {generateUniqueFileName, uploadToS3} from './utils/s3.js'
import {getOperation} from './operations.js'
import {nanoid} from 'nanoid'
import actionRouter from './modules/actionRouter.js'
import {ALLOWED_EXTENSIONS, MAX_FILE_SIZE} from './modules/constants.js'
import {ensureUserExists} from './utils/db.js'

const {TG_BOT_TOKEN} = process.env


/*




*/

export const bot = new Bot(TG_BOT_TOKEN, {
    client: {
        environment: 'test',
    },
})

bot.api.config.use(hydrateFiles(bot.token, {
    environment: 'test',
}))

bot.use(async (ctx, next) => {
    if (!(ctx.from && ctx.from.id)) return
    await ensureUserExists(ctx)

    await next()
})

bot.command('reset', async (grammyContext) => {
})

bot.command('konspekt', async (grammyContext) => {
    // const {ctx} = grammyContext
    // const program = {
    //     operationLabelList: ['input.text', 'requestAI', 'output.text'],
    //     current: 0,
    //     ctx: {aiTool: 'konspekt'},
    // }
    // ctx.programs.push(program)
    //
    // const operation = getOperation(program.operationLabelList[0])
    // await operation.init(ctx)
})

bot.on('message:text', async (ctx) => {
    await actionRouter({
        action: 'tgText',
        telegramID: ctx.from.id,
        data: {
            text: ctx.message.text
        }
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

    await actionRouter({
        action: 'tgFile',
        telegramID: ctx.from.id,
        data: {
            cdnURL,
            extension: 'jpg',
        }
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
    const extension = path.extname(fileName).replace('.', '')
    if (!ALLOWED_EXTENSIONS.has(extension)) {
        await ctx.reply('Я не знаю такой формат файла!')
        return
    }

    const fp = await file.download(`./data/tmp/${generateUniqueFileName('jpg')}`)
    const cdnURL = await uploadToS3(fp)

    await actionRouter({
        action: 'tgFile',
        telegramID: ctx.from.id,
        data: {
            cdnURL,
            extension,
        },
    })
})

bot.on("callback_query:data", async (ctx) => {
    await ctx.answerCallbackQuery()

    await actionRouter({
        action: 'tgInlineButton',
        telegramID: ctx.from.id,
        data: {
            data: ctx.callbackQuery.data,
        },
    })
})


