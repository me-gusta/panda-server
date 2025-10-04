import 'dotenv/config'
import {Bot} from 'grammy'
import {hydrateFiles} from '@grammyjs/files'
import path from 'path'
import {generateUniqueFileName, uploadToS3} from './utils/s3.js'
import {getOperation} from './operations.js'
import {nanoid} from 'nanoid'
import actionRouter from './modules/actionRouter.js'
import {ALLOWED_EXTENSIONS} from './modules/constants.js'

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

// bot.use(async (grammyContext, next) => {
//     if (!(grammyContext.from && grammyContext.from.id)) return
//
//     grammyContext.ctx = await getContext(grammyContext)
//
//     console.log('== Start operations ==', Date.now())
//     console.log(JSON.stringify(grammyContext.ctx, null, 2))
//     console.log('==  ==', Date.now())
//
//     await next()
//
//     await saveContext(grammyContext.ctx)
//     console.log('== End operations ==', Date.now())
//     console.log(JSON.stringify(grammyContext.ctx, null, 2))
//     console.log('==  ==', Date.now())
// })

bot.command('reset', async (grammyContext) => {
    const {ctx} = grammyContext
    ctx.programs = [
        {
            id: nanoid(),
            operationLabelList: ['onboarding.before', 'onboarding.q1', 'onboarding.q2', 'setBasic'],
            current: 0,
            ctx: {},
        },
    ]
})

bot.command('konspekt', async (grammyContext) => {
    const {ctx} = grammyContext
    const program = {
        operationLabelList: ['input.text', 'requestAI', 'output.text'],
        current: 0,
        ctx: {aiTool: 'konspekt'},
    }
    ctx.programs.push(program)

    const operation = getOperation(program.operationLabelList[0])
    await operation.init(ctx)
})

bot.on('message:text', async (ctx) => {
    await actionRouter({
        action: 'tgText',
        telegramID: ctx.from.id,
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

    await actionRouter({
        action: 'tgFile',
        telegramID: ctx.from.id,
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
        cdnURL,
        extension: extension
    })
})

bot.on("callback_query:data", async (ctx) => {
    await ctx.answerCallbackQuery()

    await actionRouter({
        action: 'tgInlineButton',
        telegramID: ctx.from.id,
        data: ctx.callbackQuery.data,
    })
})


