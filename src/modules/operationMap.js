import {bot} from '../bot.js'
import {InlineKeyboard} from 'grammy'
import {chatOnce} from '../utils/ai.js'


const operationMap = {
    menuSender: {
        triggers: {
            text: async (ctx) => {
                const {text} = ctx

                if (text === '/start') {
                    const keyboard = new InlineKeyboard()
                        .webApp("Выбрать программу", "http://127.0.0.1:3010")

                    await bot.api.sendMessage(ctx.telegramID, 'Привет! Это главное меню', {
                        reply_markup: keyboard,
                    })
                }
            },
        },
    },
    input: {
        text: {
            init: async (ctx) => {
                await bot.api.sendMessage(ctx.telegramID, 'Привет! Введи данные сообщением')
            },
            triggers: {
                text: async (ctx) => {
                    const {next, text, program, end} = ctx
                    if (text === '/start') {
                        await end()
                        return
                    }

                    program.ctx.input = [{type: 'text', text}]
                    await next()
                },
            },
        },
        photo: {
            init: async (ctx) => {
                await bot.api.sendMessage(ctx.telegramID, 'Привет! Отправь изоббражение')
            },
            triggers: {
                photo: async (ctx) => {
                    const {cdnUrl, extension, program} = ctx
                    if (!['png', 'jpg', 'webm', 'svg'].includes(extension)) {
                        return
                    }
                    program.ctx.input.push({type: 'image_url', image_url: {url: cdnUrl}})

                    await bot.api.sendMessage(
                        ctx.telegramID,
                        'Это все?',
                        {
                            reply_markup: new InlineKeyboard().text("Click me!", "submit-photo"),
                        },
                    )
                },
                inlineButton: async (ctx) => {
                    if (ctx.data !== "submit-photo") return
                    // await next()
                },
            },
        },
        file: {
            init: async (ctx) => {
                await bot.api.sendMessage(ctx.telegramID, 'Привет! Отправь файлы')
            },
            triggers: {
                text: async (ctx) => {
                    const {program, cdnUrl, extension} = ctx
                    if (!['docx', 'doc', 'pdf', 'xls'].includes(extension)) {
                        return
                    }
                    program.ctx.input.push({type: 'file', file: {filename: `file.${extension}`, file_data: cdnUrl}})

                    await bot.api.sendMessage(
                        ctx.telegramID,
                        'Это все?',
                        {
                            reply_markup: new InlineKeyboard().text("Click me!", "submit-photo"),
                        },
                    )
                },
            },
        },
    },
    output: {
        text: {
            init: async (ctx) => {

                await bot.api.sendMessage(ctx.telegramID, 'Не могу сделать запрос')
            },
        },
    },
    requestAI: {
        init: async (ctx) => {
            const {program, next} = ctx
            const {input} = program.ctx

            if (!input || input.length === 0) {
                await bot.api.sendMessage(ctx.telegramID, 'Не могу сделать запрос')
                return
            }

            ctx.removeProgram('menuSender')
            const messages = [...input]
            const req = async () => {
                try {
                    await bot.api.sendMessage(ctx.telegramID, 'Отправил запрос к нейронке')
                    const resp = await chatOnce({model: 'deepseek-v3.1-terminus', messages})
                    console.log('got response')
                    console.log(resp)

                    await bot.api.sendMessage(ctx.telegramID, resp)
                    await next()
                } catch (e) {
                    await bot.api.sendMessage(ctx.telegramID, 'Ошибка')
                    await next()
                }
            }

            req()
        },
    },
    onboarding: {
        before: {
            triggers: {
                text: async (ctx) => {
                    const {next} = ctx
                    if (ctx.text === '/start') {
                        await next()
                    }
                },
            },
        },
        q1: {
            init: async (ctx) => {
                await bot.api.sendMessage(ctx.telegramID, 'Привет пользователь! Кто ты?')
            },
            triggers: {
                text: async (ctx) => {
                    const {text, next} = ctx
                    ctx.setContext({onboarding: {q1: text}})
                    await next()
                },
            },
        },
        q2: {
            init: async (ctx) => {
                await bot.api.sendMessage(ctx.telegramID, 'Привет пользователь! Что хочешь?')
            },
            triggers: {
                text: async (ctx) => {
                    const {text, next} = ctx
                    ctx.setContext({onboarding: {q2: text}})
                    await next()
                },
            },
        },
    },
    setBasic: {
        init: async (ctx) => {
            const {next} = ctx
            await bot.api.sendMessage(ctx.telegramID, 'Спасибо за ответы!')
            ctx.addProgram({
                id: 'menuSender',
                operationLabelList: ['menuSender'],
                current: 0,
            })
            await next()
        },
    },
}

export const getOperation = (operationLabel) => {
    const keys = operationLabel.split('.')

    let result = keys.reduce((acc, key) => {
        return (acc && acc[key] !== 'undefined') ? acc[key] : undefined
    }, operationTree)

    return result
}

