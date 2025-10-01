import {bot} from './bot.js'

// const MAX_FILE_SIZE = 5 * 1024 * 1024  // 5 MB in bytes
// const IMAGE_EXTENSIONS = new Set([
//     '.jpg', '.jpeg', '.png', '.gif', '.webp',
//     '.bmp', '.tiff', '.tif', '.svg', '.avif', '.heic', '.heif',
// ])
//
// bot.command('set', async (ctx) => {
//     const user = await getOrCreateUser(ctx)
//     user.state = 'quiz'
//     user.data.inout = {
//         input: 'message',
//         output: 'message'
//     }
// })
//
//
// bot.command('reset', async (ctx) => {
//     const user = await getOrCreateUser(ctx)
//     user.state = 'initial'
//     user.data = {}
//
//     await updateUser(user)
// })
//
//
// bot.command('me', async (ctx) => {
//     const user = await getOrCreateUser(ctx)
//
//     await ctx.reply(`<code>${JSON.stringify(user, null, 2)}</code>`, { parse_mode: "html" })
// })
//
//
// bot.command('start', async (ctx) => {
//     const user = await getOrCreateUser(ctx)
//     if (user.state === 'halt') {
//
//     }
//
//     if (user.state === 'initial') {
//         console.log('onboarding started')
//         await enableQuiz(user, 'onboarding')
//         return
//     }
//
//     const keyboard = new InlineKeyboard()
//         .webApp("Выбрать программу", "http://127.0.0.1:3010")
//
//     ctx.reply("Click the button to open the Web App", {
//         reply_markup: keyboard,
//     })
// })
//
// // Echo text messages
// bot.on('message:text', async (ctx) => {
//     const user = await getOrCreateUser(ctx)
//     if (user.state === 'quiz') {
//         if (!assertAccept(user, ['text'])) return
//         await nextQuizStep(user, {text: ctx.message.text})
//     }
// })
//
// // Receive photo, save locally, send "ok"
// bot.on('message:photo', async (ctx) => {
//     const user = await getOrCreateUser(ctx)
//
//     const photo = ctx.message.photo[ctx.message.photo.length - 1] // highest quality
//
//     if (photo.file_size && photo.file_size > MAX_FILE_SIZE) {
//         await ctx.reply('Я не могу обработать такой огромный файл! Максимальный размер файлов: 5 Мегабайт!')
//         return
//     }
//
//     const file = await ctx.getFile()
//     await ctx.reply('ok')
//
//     processImage(file, 'jpg')
// })
//
// // Receive file, check extension, save locally, send "ok"
// bot.on('message:document', async (ctx) => {
//     const user = await getOrCreateUser(ctx)
//
//     const document = ctx.message.document
//     const file = await ctx.getFile()
//
//     // Check file size
//     if (document.file_size && document.file_size > MAX_FILE_SIZE) {
//         await ctx.reply('Я не могу обработать такой огромный файл! Максимальный размер файлов: 5 Мегабайт!')
//         return  // Skip file
//     }
//
//     const fileName = document.file_name || 'file'
//     const extension = path.extname(fileName)
//     await ctx.reply('ok')
//
//     // Route to correct handler based on extension
//     if (IMAGE_EXTENSIONS.has(extension)) {
//         processImage(file, extension.slice(1)) // Remove the dot from extension
//     } else {
//         processDocument(file, extension.slice(1))
//     }
// })
//
//
// const processImage = async (file, extension) => {
//     console.log(`Processing image with extension: ${extension}`)
//
//     // check if quiz
//     // check what question accepts
//     // if text - move to the next question or end quiz
// }
//
// const processDocument = async (file, extension) => {
//     console.log(`Processing document with extension: ${extension}`)
//
//     // check if quiz
//     // check what question accepts
//     // if text - move to the next question or end quiz
// }

console.log('Bot started')
bot.start()
