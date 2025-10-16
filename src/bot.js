import 'dotenv/config'
import {Bot} from 'grammy'
import {hydrateFiles} from '@grammyjs/files'
import path from 'path'
import {generateUniqueFileName, uploadToS3} from './utils/s3.js'
import actionRouter from './modules/actionRouter.js'
import {ALLOWED_EXTENSIONS, IMAGE_EXTENSIONS, MAX_FILE_SIZE} from './modules/constants.js'
import {addProgram, ensureUserExists, getUser, saveUser} from './utils/db.js'
import User from './modules/User.js'
import {convertWordToPdf} from './utils/convertWordToPdf.js'
import { promises as fsp } from 'node:fs'
import textToPdf from './utils/textToPdf.js'
import {isModerator} from './utils/moderation.js'

const {TG_BOT_TOKEN, TG_ENV} = process.env

const sendPrograms = async (ctx) => {
    const telegramID = ctx.from.id

    const userFromDB = await getUser(telegramID)

    let out = `list of programs:\n`
    for (let program of userFromDB.programs) {
        out += `id: ${program.id}\noperations: ${program.operationLabelList.join('--')}\npointer: ${program.pointer}\n\n`
    }

    await ctx.reply(out)
}

export const bot = new Bot(TG_BOT_TOKEN, {
    client: {
        environment: TG_ENV,
    },
})

bot.api.config.use(hydrateFiles(bot.token, {
    environment: TG_ENV,
}))

bot.use(async (ctx, next) => {
    if (!(ctx.from && ctx.from.id)) return
    const isNewUser = await ensureUserExists(ctx)

    if (isNewUser) {
        const userFromDB = await getUser(ctx.from.id)
        const user = new User(userFromDB)
        await user.addProgram({
            context: {},
            operationLabelList: ['onboarding.before', 'onboarding.q1', 'setBasic'],
            pointer: 0,
        })
    }

    await next()
})

bot.command('reset', async (ctx) => {
    if (!isModerator(ctx.from.id)) return
    const telegramID = ctx.from.id

    const userFromDB = await getUser(telegramID)
    const user = new User(userFromDB)

    user.clearPrograms()

    await saveUser(user)
    await ctx.reply('reset /me')
})

bot.catch((err) => {
    console.log('----- <error> -----')
    console.log(err)
    console.log('----- </error> -----')
})

bot.command('error', async (ctx) => {
    if (!isModerator(ctx.from.id)) return
    await bot.api.sendMessage(4145115, 'Hello')
})

bot.command('me', async (ctx) => {
    if (!isModerator(ctx.from.id)) return
    await ctx.reply(`ID: ${ctx.from.id}`)
    await sendPrograms(ctx)
    await ctx.reply(`/start\n/reset\n/onboard\n/setmenu\n\n\n/aichat\n/konspekt`)
})

bot.command('aichat', async (ctx) => {
    if (!isModerator(ctx.from.id)) return
    const telegramID = 5000394127
    const userFromDB = await getUser(telegramID)
    const user = new User(userFromDB)

    await user.addProgram({
        operationLabelList: ['aiChat'],
        context: {
            messages: [],
            isRequestSent: false,
        }
    })

    await saveUser(user)
})


bot.command('onboard', async (ctx) => {
    if (!isModerator(ctx.from.id)) return
    const telegramID = ctx.from.id

    const userFromDB = await getUser(telegramID)
    const user = new User(userFromDB)

    await user.addProgram({
        operationLabelList: ['onboarding.before', 'onboarding.q1', 'setBasic'],
    })

    await saveUser(user)
})


bot.command('setmenu', async (ctx) => {
    if (!isModerator(ctx.from.id)) return
    const telegramID = ctx.from.id

    const userFromDB = await getUser(telegramID)
    const user = new User(userFromDB)

    await user.addProgram({
        operationLabelList: ['menuSender'],
    })

    await saveUser(user)
})

bot.on('message:text', async (ctx) => {
    await actionRouter({
        action: 'tgText',
        telegramID: ctx.from.id,
        data: {
            text: ctx.message.text,
        },
    })
})

bot.on('message:photo', async (ctx) => {
    const photo = ctx.message.photo[ctx.message.photo.length - 1]
    if (photo.file_size && photo.file_size > MAX_FILE_SIZE) {
        await ctx.reply('Я не могу обработать такой огромный файл! Максимальный размер файлов: 5 Мегабайт!')
        return
    }
    const caption = ctx.message.caption || ''

    const file = await ctx.getFile()
    const fp = await file.download(`./data/tmp/${generateUniqueFileName('jpg')}`)
    const cdnURL = await uploadToS3(fp)

    await actionRouter({
        action: 'tgFile',
        telegramID: ctx.from.id,
        data: {
            cdnURL,
            extension: 'jpg',
            caption
        },
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
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
        await ctx.reply(`Я не знаю такой формат файла: ${extension}!`)
        return
    }
    const caption = ctx.message.caption || ''

    const fp = await file.download(`./data/tmp/${generateUniqueFileName(extension)}`)

    if (IMAGE_EXTENSIONS.includes(extension)) {
        const cdnURL = await uploadToS3(fp)

        await actionRouter({
            action: 'tgFile',
            telegramID: ctx.from.id,
            data: {
                cdnURL,
                extension,
                caption,
            },
        })
    } else if (extension === 'txt') {
        const textContent = await fsp.readFile(fp, {encoding: 'utf-8'})
        const outFp = path.join(process.cwd(), `./data/tmp/${generateUniqueFileName('pdf')}`)
        await textToPdf(textContent, outFp)

        const cdnURL = await uploadToS3(outFp)

        await actionRouter({
            action: 'tgFile',
            telegramID: ctx.from.id,
            data: {
                cdnURL,
                extension: 'pdf',
                caption,
            },
        })

    } else if (['doc', 'docx'].includes(extension)){
        const outFp = path.join(process.cwd(), `./data/tmp/${generateUniqueFileName('pdf')}`)
        const hasConverted = await convertWordToPdf(fp, outFp)
        if (!hasConverted) {
            await ctx.reply(`Не удалось конвертировать файл.`)
            return
        }
        const cdnURL = await uploadToS3(outFp)

        await actionRouter({
            action: 'tgFile',
            telegramID: ctx.from.id,
            data: {
                cdnURL,
                extension: 'pdf',
                caption,
            },
        })
    }

})

bot.on("callback_query:data", async (ctx) => {
    await ctx.answerCallbackQuery()

    await actionRouter({
        action: 'tgInlineButton',
        telegramID: ctx.from.id,
        data: {
            callbackData: ctx.callbackQuery.data,
        },
    })
})


