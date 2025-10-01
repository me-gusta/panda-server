import {bot} from './bot.js'

const sendMessage = async (ctx) => {
    const {user, text} = ctx

    console.log('send message to user')
    await bot.api.sendMessage(user.telegramID, text)
}

const addDataElement = async (ctx) => {
    const {user, key, value} = ctx
}

// onboarding = [onboarding.q1, onboarding.q2]
// konspekt file to message = program([aiProgram.konspekt, inputFile, requestAI, aiResponseToMessage])

export default {
    onboarding: [
        {
            init: async (ctx) => {
                const {user} = ctx
                await sendMessage({...ctx, text: 'Вы кто,'})
            },
            triggers: {
                text: async (ctx) => {
                    const {user, value} = ctx
                    console.log('received message from user')
                    await addDataElement({...ctx, key: 'onboarding', value: {q1: value}})
                    await next(ctx)
                }
            }
        },
        {
            init: async (ctx) => {
                const {user} = ctx
                await sendMessage({...ctx, text: 'Что вы хотите'})
            },
            triggers: {
                text: async (ctx) => {
                    const {user, value} = ctx
                    console.log('received message from user')
                    await addDataElement({...ctx, key: 'onboarding', value: {q2: value}})
                    await next(ctx)
                }
            }
        },
        {
            init: async (ctx) => {
                const {user} = ctx
                await sendMessage({...ctx, text: 'Что вы хотите'})
            }
        }
    ],
    textToText: [
        {
            init: async (ctx) => {
                const {user} = ctx
                await sendMessage({...ctx, text: 'Отправьте промпт'})
            },
            triggers: {
                text: async (ctx) => {
                    const {user, value} = ctx
                    await next(ctx)
                }
            }
        },
        {
            init: async (ctx) => {
                const {user, aiProgram} = ctx
                // request OpenAPI
                // disable canMenu
            },
            triggers: {
                aiResponse: async (ctx) => {
                    const {user, value} = ctx
                    await next(ctx)
                },
                aiError: async (ctx) => {
                    // enable canMenu
                    // send Menu
                }
            }
        }
    ],

    imgToText: [
        {
            init: async (ctx) => {
                const {user} = ctx
                await sendMessage({...ctx, text: 'Отправьте картинки'})
            },
            triggers: {
                image: async (ctx) => {
                    const {url, data} = ctx
                    // setGlobalContext({uploadUrlList: [imageUrl]})
                    // if ctx.timeout clearTimeout()
                    // const tid = setTimeout(sendMessage)
                    // setGlobalContext({timeout: tid})
                },
                text: async (ctx) => {
                    // send message with two buttons "Cancel" "Confirm"
                    // if uploadUrlList.length < 1 : send "No images uploaded"
                },
                inlineButton: async (ctx) => {
                    // if ctx cancel : end(ctx) ; sendMenu(ctx)
                }
            }
        },
        {
            init: async (ctx) => {
                const {user, aiProgram} = ctx
                // request OpenAPI
                // disable canMenu
            },
            triggers: {
                aiResponse: async (ctx) => {
                    const {user, value} = ctx
                    await next(ctx)
                },
                aiError: async (ctx) => {
                    // enable canMenu
                    // send Menu
                }
            }
        }
    ],
}
