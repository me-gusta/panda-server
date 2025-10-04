import {bot} from '../bot.js'
import {InlineKeyboard} from 'grammy'
import {chatOnce} from '../utils/ai.js'
import deepGetFromObject from '../utils/deepGetFromObject.js'
import actionRouter from './actionRouter.js'


const operationMap = {
    menuSender: {
        triggers: {
            tgText: async (op, data) => {
                const {text} = data

                if (text === '/start') {
                    const keyboard = new InlineKeyboard()
                        .webApp("Выбрать программу", "http://127.0.0.1:3010")

                    await bot.api.sendMessage(op.telegramID, 'Привет! Это главное меню', {
                        reply_markup: keyboard,
                    })
                }
            },
        },
    },
    hello: {
        konspekt: {
            init: async (op) => {
                await bot.api.sendMessage(op.telegramID, 'Привет! Пишем конспект!')
                await op.next()
            },
        },
    },
    input: {
        text: {
            init: async (op) => {
                await bot.api.sendMessage(op.telegramID, 'Привет! Введи данные сообщением')
            },
            triggers: {
                tgText: async (op, data) => {
                    const {text} = data
                    if (text === '/start') {
                        op.end()
                        return
                    }
                    op.extendCtxProgram({
                        input: {type: 'text', text},
                    })
                    await op.next()
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
                tgText: async (ctx) => {
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
        tgText: {
            init: async (ctx) => {

                await bot.api.sendMessage(ctx.telegramID, 'Не могу сделать запрос')
            },
        },
    },
    requestAI: {
        init: async (op) => {
            const {input} = op.program.context


            const req = async () => {
                try {
                    await bot.api.sendMessage(op.telegramID, 'Отправил запрос к нейронке')
                    const resp = await chatOnce({
                        model: 'deepseek-v3.1-terminus',
                        messages: [
                            {role: 'user', content: 'Give me a 2-sentence summary of HTTP/2 vs HTTP/1.1.' }
                        ]
                    })
                    console.log('got response')
                    console.log(resp)

                    await actionRouter({
                        action: 'aiResponse',
                        telegramID: op.telegramID,
                        data: {data: resp}
                    })
                } catch (e) {
                    await actionRouter({
                        action: 'aiResponse',
                        telegramID: op.telegramID,
                        data: {error: true}
                    })
                }
            }

            req()
        },
        triggers: {
            tgText: async (op, data) => {
                console.log('halt')
                return true
            },
            aiResponse: async (op, data) => {
                if (data.error) {
                    await bot.api.sendMessage(op.telegramID, 'Ошибка нейросети')
                    op.end()
                    return
                }
                await bot.api.sendMessage(op.telegramID, 'Получил ответ! Обрабатываю файл...')
                await bot.api.sendMessage(op.telegramID, data.data)
                await op.next()
            }
        }
    },
    onboarding: {
        before: {
            init: async (op) => {
                await bot.api.sendMessage(op.telegramID, 'Onboarding set')
            },
            triggers: {
                tgText: async (op, data) => {
                    if (data.text === '/start') {
                        await op.next()
                    }
                },
            },
        },
        q1: {
            init: async (op) => {
                await bot.api.sendMessage(op.telegramID, 'Привет пользователь! Кто ты?')
            },
            triggers: {
                tgText: async (op, data) => {
                    const {text} = data
                    op.extendCtxUser({onboarding: {q1: text}})
                    await op.next()
                },
            },
        },
        q2: {
            init: async (op) => {
                await bot.api.sendMessage(op.telegramID, 'Привет пользователь! Что хочешь?')
            },
            triggers: {
                tgText: async (op, data) => {
                    const {text} = data
                    op.extendCtxUser({onboarding: {q2: text}})
                    await op.next()
                },
            },
        },
    },
    setBasic: {
        init: async (op) => {
            await bot.api.sendMessage(op.telegramID, 'Спасибо за ответы!')
            op.user.addProgram({
                operationLabelList: ['menuSender'],
            })
            await op.next()
        },
    },
}

export const getOperation = (operationLabel) => {
    return deepGetFromObject(operationMap, operationLabel)
}

