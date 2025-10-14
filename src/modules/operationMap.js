import 'dotenv/config'
import {bot} from '../bot.js'
import {InlineKeyboard, InputFile} from 'grammy'
import {chatOnce} from '../utils/ai.js'
import deepGetFromObject from '../utils/deepGetFromObject.js'
import actionRouter from './actionRouter.js'
import {convertMarkdownToDocx} from '@mohtasham/md-to-docx'
import removeMd from 'remove-markdown'
import {mdToPdf} from 'md-to-pdf'
import splitTextIntoChunks from '../utils/splitTextIntoChunks.js'
import {AICHAT_BASE_PROMPT, BASE_PROMPT, WELCOME_MESSAGE_TEXT} from './constants.js'
import {notifyModerator} from '../utils/moderation.js'


const requestAI = async (op, messages) => {
    try {
        console.log('messages')
        console.log(JSON.stringify(messages, null, 2))
        const resp = await chatOnce({
            model: 'gemini-2.5-flash',
            messages,
        })

        await actionRouter({
            action: 'aiResponse',
            telegramID: op.telegramID,
            data: {success: resp},
        })
    } catch (e) {
        console.log('--- error while requesting ai ---')
        console.log(e)
        await actionRouter({
            action: 'aiResponse',
            telegramID: op.telegramID,
            data: {error: true},
        })
    }
}

const createLoadingMessage = async (op) => {
    const loadingMessage = await bot.api.sendMessage(op.telegramID, '/ ... обрабатываю запрос')
    let loadingState = 0
    const loadingIntervalID = setInterval(async () => {
        let messageText = '... обрабатываю запрос'
        if (loadingState === 0) {
            messageText = '\\' + messageText
            loadingState++
        } else if (loadingState === 1) {
            messageText = '|' + messageText
            loadingState++
        } else if (loadingState === 2) {
            messageText = '/' + messageText
            loadingState = 0
        }
        try {
            await bot.api.editMessageText(op.telegramID, loadingMessage.message_id, messageText)
        } catch (e) {
            console.error('Cannot edit loader')
            clearInterval(loadingIntervalID)
        }
    }, 1200)[Symbol.toPrimitive]()

    return {
        loadingIntervalID,
        loadingMessageID: loadingMessage.message_id,
    }
}

const operationMap = {
    menuSender: {
        triggers: {
            tgText: async (op, data) => {
                const {text} = data

                if (['/start', '/menu'].includes(text)) {
                    const {TG_WEBAPP_LINK} = process.env
                    const keyboard = new InlineKeyboard()
                        .webApp("Выбрать программу", TG_WEBAPP_LINK)

                    await bot.api.sendMessage(op.telegramID, '🐼 Чем могу помочь?', {
                        reply_markup: keyboard,
                    })
                }
            },
        },
    },
    hello: {
        init: async (op) => {
            const helloText = op.getCtxProgram('helloText')
            await bot.api.sendMessage(op.telegramID, helloText)
            await op.next()
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
                    if (['/start', '/menu'].includes(text)) {
                        op.end()
                        return
                    }
                    op.program.context.input.push({type: 'text', text})
                    await op.next()
                },
            },
        },
        photo: {
            init: async (op) => {
                await bot.api.sendMessage(op.telegramID, 'Привет! Отправь изоббражение')
            },
            triggers: {
                tgFile: async (op, data) => {
                    const {cdnURL, extension, caption} = data
                    if (!['png', 'jpg', 'jpeg', 'webm'].includes(extension)) {
                        return
                    }

                    op.program.context.input.push({type: 'photo', cdnURL})

                    console.log('ctx1')
                    console.log(JSON.stringify(op.program.context, null, 2))
                    console.log('ctx2')
                    console.log(JSON.stringify(op.program.context, null, 2))

                    if (caption) {
                        op.program.context.input.push({type: 'text', text: caption})
                    }

                    await bot.api.sendMessage(
                        op.telegramID,
                        'Это все?',
                        {
                            reply_markup: new InlineKeyboard().text("Да! Запустить обработку", "submit-photo"),
                        },
                    )
                },
                tgInlineButton: async (op, data) => {
                    const {callbackData} = data
                    if (callbackData !== "submit-photo") return
                    await op.next()
                },
            },
        },
        file: {
            init: async (op) => {
                await bot.api.sendMessage(op.telegramID, 'Привет! Отправь файл')
            },
            triggers: {
                tgFile: async (op, data) => {
                    const {cdnURL, extension, caption} = data
                    if (!['docx', 'pdf', 'txt', 'md', 'odt', 'pages'].includes(extension)) {
                        return
                    }
                    op.program.context.input.push({type: 'file', cdnURL, extension})

                    if (caption) {
                        op.program.context.input.push({type: 'text', text: caption})
                    }

                    await bot.api.sendMessage(
                        op.telegramID,
                        'Это все?',
                        {
                            reply_markup: new InlineKeyboard().text("Да! Запустить обработку", "submit-file"),
                        },
                    )
                },
                tgInlineButton: async (op, data) => {
                    const {callbackData} = data
                    if (callbackData !== "submit-file") return
                    await op.next()
                },
            },
        },
    },
    output: {
        text: {
            init: async (op) => {
                const aiResponse = op.getCtxProgram('aiResponse')
                await bot.api.sendMessage(op.telegramID, aiResponse)
                await op.next()
            },
        },
        textNoFormat: {
            init: async (op) => {
                const aiResponse = op.getCtxProgram('aiResponse')
                const plainText = removeMd(aiResponse)
                await bot.api.sendMessage(op.telegramID, plainText)
                await op.next()
            },
        },
        docx: {
            init: async (op) => {
                const aiResponse = op.getCtxProgram('aiResponse')
                const docxBlob = await convertMarkdownToDocx(aiResponse)
                const docxBuffer = Buffer.from(await docxBlob.arrayBuffer())
                const inputFile = new InputFile(docxBuffer, 'файл.docx')

                await bot.api.sendDocument(op.telegramID, inputFile)
                await op.next()
            },
        },
        pdf: {
            init: async (op) => {
                const aiResponse = op.getCtxProgram('aiResponse')
                const pdf = await mdToPdf({content: aiResponse})
                const inputFile = new InputFile(pdf.content, 'файл.pdf')
                await bot.api.sendDocument(op.telegramID, inputFile)
                await op.next()
            },
        },
    },
    requestAI: {
        init: async (op) => {
            const {input} = op.program.context
            const systemMessage = {role: 'system', content: ''}
            const aiProgram = op.getCtxProgram('aiProgram')

            let targetPrompt = ''
            if (aiProgram === 'konspekt') {
                targetPrompt = 'Сделай конспект. не добавляй ничего нового. систематизируй то что есть.'
            } else if (aiProgram === 'zapominator') {
                targetPrompt = 'Дан материал. сделай карточки для запоминания. с одной стороны карточки вопрос, с другой ответ. не меньше 20 карточек.'
            } else if (aiProgram === 'structure') {
                targetPrompt = 'Дан материал. Структурируй текст. не добавляй ничего нового. систематизируй то что есть.'
            } else if (aiProgram === 'addWater') {
                targetPrompt = 'Дан текст. Добавь воды в текст. Сделай этот текст в (ВАЖНО!!) два раза больше по количеству слов, сохранив смысл.'
            } else if (aiProgram === 'extractFrom') {
                targetPrompt = 'Сделай OCR фото.'
            } else if (aiProgram === 'cheers') {
                targetPrompt = ''
            } else if (aiProgram === 'poems') {
                targetPrompt = ''
            }
            systemMessage.content = BASE_PROMPT

            const userMessages = input.map(el => {
                if (el.type === 'text') {
                    return {
                        type: 'text',
                        text: el.text,
                    }
                } else if (el.type === 'photo') {
                    return {
                        type: 'image_url',
                        image_url: {
                            url: el.cdnURL,
                        },
                    }
                } else if (el.type === 'file') {
                    return {
                        type: 'file',
                        file: {
                            filename: `file.${el.extension}`,
                            file_data: el.cdnURL,
                        },
                    }
                }
            })

            const {loadingIntervalID, loadingMessageID} = await createLoadingMessage(op)

            op.extendCtxProgram({
                loadingIntervalID,
                loadingMessageID,
            })


            requestAI(op, [
                systemMessage,
                {role: 'user', content: targetPrompt},
                {role: 'user', content: userMessages}
            ])
        },
        triggers: {
            tgText: async (op, data) => {
                return true
            },
            aiResponse: async (op, data) => {
                const loadingIntervalID = op.getCtxProgram('loadingIntervalID')
                const loadingMessageID = op.getCtxProgram('loadingMessageID')


                if (loadingIntervalID !== undefined) {
                    clearInterval(loadingIntervalID)
                }

                try {
                    await bot.api.deleteMessage(op.telegramID, loadingMessageID)
                } catch (e) {}

                if (data.error) {
                    await bot.api.sendMessage(op.telegramID, 'Ошибка нейросети')
                    op.end()
                    return
                }
                op.extendCtxProgram({
                    aiResponse: data.success,
                })
                await op.next()
            },
        },
    },
    onboarding: {
        before: {
            init: async (op) => {
                await bot.api.sendMessage(op.telegramID, WELCOME_MESSAGE_TEXT, {
                    parse_mode: 'HTML',
                    reply_markup: new InlineKeyboard().text("Да!", "onboard"),
                })
            },
            triggers: {
                tgInlineButton: async (op, data) => {
                    const {callbackData} = data
                    if (callbackData !== "onboard") return
                    await op.next()
                },
            },
        },
        q1: {
            init: async (op) => {
                await bot.api.sendMessage(op.telegramID, '<b>Вопрос [1/1]</b>\n\nКем ты работаешь или на каком факультете учишься?', {parse_mode: 'HTML'})
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
            await notifyModerator(`Новый пользователь ${op.telegramID}!\nusername: @${op.user.username || ''}\nonboarding: ${op.user.context.onboarding.q1}`)
            await bot.api.sendMessage(op.telegramID, 'Спасибо за ответ!\n\nЧем сегодня займемся? Открывай и выбирай программу\n 👉 /menu')

            op.user.addProgram({
                operationLabelList: ['menuSender'],
            })
            await op.next()
        },
    },
    aiChat: {
        init: async (op) => {
            await bot.api.sendMessage(op.telegramID, 'Давай поговорим')
        },
        triggers: {
            tgText: async (op, data) => {
                const isRequestSent = op.getCtxProgram('isRequestSent')
                if (isRequestSent) return

                const {text} = data
                if (['/start', '/menu'].includes(text)) {
                    op.end()
                    return
                }

                op.program.context.messages.push({role: 'user', content: text})

                const messages = op.getCtxProgram('messages')
                if (messages.length > 10) {
                    messages.shift()
                    op.program.context.messages = messages
                }

                const {loadingIntervalID, loadingMessageID} = await createLoadingMessage(op)

                op.extendCtxProgram({
                    isRequestSent: true,
                    loadingIntervalID,
                    loadingMessageID,
                })

                requestAI(op, [
                    {role: 'system', content: AICHAT_BASE_PROMPT},
                    ...messages
                ])
            },
            aiResponse: async (op, data) => {
                const {error, success} = data

                const isRequestSent = op.getCtxProgram('isRequestSent')
                const loadingIntervalID = op.getCtxProgram('loadingIntervalID')
                const loadingMessageID = op.getCtxProgram('loadingMessageID')

                if (!isRequestSent) return

                if (loadingIntervalID !== undefined) {
                    clearInterval(loadingIntervalID)
                }

                op.extendCtxProgram({
                    isRequestSent: false,
                    loadingIntervalID: undefined,
                    loadingMessageID: undefined,
                })

                if (error) {
                    await bot.api.sendMessage(op.telegramID, 'Ошибка связи с нейронкой')
                    op.end()
                    return
                }
                op.program.context.messages.push({role: 'assistant', content: success})

                const chunks = splitTextIntoChunks(success, 4000)
                for (let chunk of chunks) {
                    await bot.api.sendMessage(op.telegramID, chunk)
                }

                if (loadingMessageID) {
                    try {
                        await bot.api.deleteMessage(op.telegramID, loadingMessageID)
                    } catch (e) {}
                }

            },
            tgFile: async (op, data) => {
                return
                const isRequestSent = op.getCtxProgram('isRequestSent')
                if (isRequestSent) return

                const {cdnURL, extension, caption} = data

                let docType = ''
                if (['docx', 'pdf', 'txt', 'md', 'odt', 'pages'].includes(extension)) {
                    docType = 'file'
                    op.program.context.messages.push({
                        role: 'user',
                        content: [
                            {
                                type: 'file',
                                file: {
                                    filename: `file.${extension}`,
                                    file_data: cdnURL,
                                },
                            }
                        ]
                    })
                } else if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
                    docType = 'image'
                    op.program.context.messages.push({
                        role: 'user',
                        content: [
                            {
                                type: 'image_url',
                                image_url: {
                                    url: cdnURL,
                                },
                            }
                        ]
                    })
                } else {
                    return
                }

                if (!caption) {
                    if (docType === 'photo') await bot.api.sendMessage(op.telegramID, 'Фото загружено. Что с ним делать?')
                    else await bot.api.sendMessage(op.telegramID, 'Документ загружен. Что с ним делать?')
                    return
                }

                if (caption) {
                    op.program.context.messages.push({
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                content: caption,
                            }
                        ]
                    })
                }

                const {loadingIntervalID, loadingMessageID} = await createLoadingMessage(op)

                op.extendCtxProgram({
                    isRequestSent: true,
                    loadingIntervalID,
                    loadingMessageID,
                })

                requestAI(messages)

            },
        },
    },
}

export const getOperation = (operationLabel) => {
    return deepGetFromObject(operationMap, operationLabel)
}

