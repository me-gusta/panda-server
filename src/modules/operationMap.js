import {bot} from '../bot.js'
import {InlineKeyboard, InputFile} from 'grammy'
import {chatOnce} from '../utils/ai.js'
import deepGetFromObject from '../utils/deepGetFromObject.js'
import actionRouter from './actionRouter.js'
import {convertMarkdownToDocx} from '@mohtasham/md-to-docx'
import removeMd from 'remove-markdown'
import mdToPdf from 'md-to-pdf'
import splitTextIntoChunks from '../utils/splitTextIntoChunks.js'


const requestAI = async (messages) => {
    try {
        const resp = await chatOnce({
            model: 'deepseek-v3.1-terminus',
            messages,
        })

        await actionRouter({
            action: 'aiResponse',
            telegramID: op.telegramID,
            data: {success: resp},
        })
    } catch (e) {
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
        }
    }, 1200)

    return {
        loadingIntervalID,
        loadingMessageID: loadingMessage.message_id
    }
}

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
                    if (text === '/start') {
                        op.end()
                        return
                    }
                    op.extendCtxProgram({
                        input: [{type: 'text', text}],
                    })
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
                    op.extendCtxProgram({
                        input: [{type: 'photo', cdnURL}],
                    })
                    if (caption) {
                        op.extendCtxProgram({
                            input: [{type: 'text', text: caption}],
                        })
                    }

                    await bot.api.sendMessage(
                        op.telegramID,
                        'Это все?',
                        {
                            reply_markup: new InlineKeyboard().text("Click me!", "submit-photo"),
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
                await bot.api.sendMessage(op.telegramID, 'Привет! Отправь изоббражение')
            },
            triggers: {
                tgFile: async (op, data) => {
                    const {cdnURL, extension, caption} = data
                    if (!['docx', 'pdf', 'txt', 'md', 'odt', 'pages'].includes(extension)) {
                        return
                    }
                    op.extendCtxProgram({
                        input: [{type: 'file', cdnURL, extension}],
                    })
                    if (caption) {
                        op.extendCtxProgram({
                            input: [{type: 'text', text: caption}],
                        })
                    }

                    await bot.api.sendMessage(
                        op.telegramID,
                        'Это все?',
                        {
                            reply_markup: new InlineKeyboard().text("Click me!", "submit-file"),
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
                await bot.api.sendMessage(op.telegramID, aiResponse, {parse_mode: 'MarkdownV2'})
            },
        },
        textNoFormat: {
            init: async (op) => {
                const aiResponse = op.getCtxProgram('aiResponse')
                const plainText = removeMd(aiResponse)
                await bot.api.sendMessage(op.telegramID, plainText)
            },
        },
        docx: {
            init: async (op) => {
                const aiResponse = op.getCtxProgram('aiResponse')
                const docxBlob = await convertMarkdownToDocx(aiResponse)
                const docxBuffer = Buffer.from(await docxBlob.arrayBuffer())
                const inputFile = new InputFile(docxBuffer, 'файл.docx')

                await bot.api.sendDocument(op.telegramID, inputFile)
            },
        },
        pdf: {
            init: async (op) => {
                const aiResponse = op.getCtxProgram('aiResponse')
                const pdf = await mdToPdf({content: aiResponse})
                const inputFile = new InputFile(pdf.content, 'файл.pdf')
                await bot.api.sendDocument(op.telegramID, inputFile)
            },
        },
    },
    requestAI: {
        init: async (op) => {
            const {input} = op.program.context
            const systemMessage = {role: 'system', content: ''}
            const aiProgram = op.getCtxProgram('aiProgram')

            if (aiProgram === 'konspekt') {
                systemMessage.content = 'Ты профессор. сделай конспект.'
            } else if (aiProgram === 'zapominator') {
                systemMessage.content = 'Ты профессор. сделай конспект.'
            } else if (aiProgram === 'structure') {
                systemMessage.content = 'Ты профессор. сделай конспект.'
            } else if (aiProgram === 'addWater') {
                systemMessage.content = 'Ты профессор. сделай конспект.'
            } else if (aiProgram === 'extractFrom') {
                systemMessage.content = 'Ты профессор. сделай конспект.'
            } else if (aiProgram === 'cheers') {
                systemMessage.content = 'Ты профессор. сделай конспект.'
            } else if (aiProgram === 'poems') {
                systemMessage.content = 'Ты профессор. сделай конспект.'
            }

            const userMessages = input.map(el => {
                if (el.type === 'text') {
                    return {
                        role: 'user',
                        content: el.text,
                    }
                } else if (el.type === 'photo') {
                    return {
                        role: 'user',
                        image_url: {
                            url: el.cdnURL,
                        },
                    }
                } else if (el.type === 'file') {
                    return {
                        role: 'file',
                        file: {
                            filename: `file.${el.extension}`,
                            file_data: el.cdnURL,
                        },
                    }
                }
            })

            await bot.api.sendMessage(op.telegramID, 'Отправил запрос к нейронке')


            requestAI([systemMessage, ...userMessages])
        },
        triggers: {
            tgText: async (op, data) => {
                return true
            },
            aiResponse: async (op, data) => {
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
    aiChat: {
        init: async (op) => {
            await bot.api.sendMessage(op.telegramID, 'Давай поговорим')
        },
        triggers: {
            tgText: async (op, data) => {
                const isRequestSent = op.getCtxProgram('isRequestSent')
                if (isRequestSent) return

                const {text} = data
                if (text === '/start') {
                    op.end()
                    return
                }

                op.extendCtxProgram({messages: [{role: 'user', content: text}]})
                const messages = op.getCtxProgram('messages')
                if (messages.length > 10) {
                    messages.shift()
                    op.program.context.messages = messages
                }

                const {loadingIntervalID,loadingMessageID} = await createLoadingMessage(op)

                op.extendCtxProgram({
                    isRequestSent: true,
                    loadingIntervalID,
                    loadingMessageID
                })

                requestAI(messages)
            },
            aiResponse: async (op,data) => {
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
                op.extendCtxProgram({messages: [{role: 'assistant', content: success}]})

                const chunks = splitTextIntoChunks(success, 4000)
                for (let chunk of chunks) {
                    await bot.api.sendMessage(op.telegramID, chunk)
                }

                if (loadingMessageID) {
                    await bot.api.deleteMessage(op.telegramID, loadingMessageID)
                }

            },
            tgFile: async (op, data) => {
                const isRequestSent = op.getCtxProgram('isRequestSent')
                if (isRequestSent) return

                const {cdnURL, extension, caption} = data

                let docType = ''
                if (['docx', 'pdf', 'txt', 'md', 'odt', 'pages'].includes(extension)) {
                    docType = 'file'
                    op.extendCtxProgram({
                        input: [{
                            type: 'file',
                            file: {
                                filename: `file.${extension}`,
                                file_data: cdnURL,
                            },
                        }],
                    })
                } else if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
                    docType = 'image'
                    op.extendCtxProgram({
                        input: [{
                            type: 'image',
                            image_url: {
                                url: cdnURL,
                            },
                        }],
                    })
                } else {
                    return
                }

                if (!caption) {
                    if (docType === 'photo') await bot.api.sendMessage(op.telegramID, 'Фото загружено. Что с ним делать?')
                    else await bot.api.sendMessage(op.telegramID, 'Документ загружен. Что с ним делать?')
                    return
                }

                op.extendCtxProgram({
                    input: [{
                        type: 'text',
                        content: caption,
                    }],
                })

                const {loadingIntervalID,loadingMessageID} = await createLoadingMessage(op)

                op.extendCtxProgram({
                    isRequestSent: true,
                    loadingIntervalID,
                    loadingMessageID
                })

                requestAI(messages)

            },
        },
    },
}

export const getOperation = (operationLabel) => {
    return deepGetFromObject(operationMap, operationLabel)
}

