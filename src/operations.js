import {bot} from './bot.js'
import {InlineKeyboard} from 'grammy'


const operationTree = {
    menuSender: {
        triggers: {
            text: async (ctx) => {
                const {text} = ctx

                if (text === '/start') {
                    const keyboard = new InlineKeyboard()
                        .webApp("Выбрать программу", "http://127.0.0.1:3010")

                    await bot.api.sendMessage(ctx.telegramID, 'Привет! Это главное меню',{
                        reply_markup: keyboard,
                    })
                }
            }
        }
    },
    input: {
        text: {
            init: async (ctx) => {
                await bot.api.sendMessage(ctx.telegramID, 'Привет! Введи данные сообщение')
            },
            triggers: {
                text: async (ctx) => {
                    const {user, text} = ctx
                    // setContextValue(ctx, {input: [{text}]})
                    // next(ctx)
                },
            },
        },
        photo: {
            init: async (ctx) => {
                await bot.api.sendMessage(ctx.telegramID, 'Привет! Отправь изоббражение')
            },
            triggers: {
                photo: async (ctx) => {
                    const {user, cdnUrl, extension} = ctx
                    if (!['png', 'jpg', 'webm', 'svg'].includes(extension)) {
                        return
                    }
                    // setContextValue(ctx, {input: [{cdnUrl, extension}]})
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
                    const {user, cdnUrl, extension} = ctx
                    if (!['docx', 'doc', 'pdf', 'xls'].includes(extension)) {
                        return
                    }
                    // setContextValue(ctx, {input: [{cdnUrl, extension}]})
                    // next
                },
            },
        },
    },
    requestAI: {
        init: async (ctx) => {
            if (!ctx.input || ctx.input.length !== 0) {
                await bot.api.sendMessage(ctx.telegramID, 'Не могу сделать запрос')
                return
            }

            const messages = [] // ctx.input.map()
            // detachProgram('MenuSender')
            // ai.then(() => {attachProgram('MenuSender')})
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
                    ctx.setContext( {onboarding: {q1: text}})
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
            ctx.setContext( {
                programs: {
                    $push: [
                        {
                            id: 'menuSender',
                            operationLabelList: ['menuSender'],
                            current: 0
                        },
                    ],
                },
            })
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

