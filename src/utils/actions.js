import {bot} from '../bot.js'

const programs = {
    // 'menuSender': {
    //     triggers: {
    //         text: async (ctx) => {
    //             const {user} = ctx
    //             if (ctx.text === '/start') {
    //                 await bot.api.sendMessage(user.telegramID, 'Hello')
    //             }
    //             if (ctx.text === '/reset') {
    //                 await bot.api.sendMessage(user.telegramID, 'Hello')
    //             }
    //         }
    //     }
    // },
    'onboardingInitial': {
        triggers: {
            text: async (ctx) => {
                const {user} = ctx
                if (ctx.text === '/start') {
                    await bot.api.sendMessage(user.telegramID, 'Привет пользователь! Кто ты?')
                    await removeProgram({
                        ...ctx,
                        label: 'onboardingInitial'
                    })
                    await addProgram({
                        ...ctx,
                        label: 'onboardingQ1'
                    })
                }
            }
        }
    }
}

export default {
    text: (ctx) => {
        for (let program of Object.values(programs)) {
            if (program.triggers && program.triggers.text) {
                console.log('actions ctx')
                console.log(ctx)
                program.triggers.text(ctx)
            }
        }
    },
    file: (ctx) => {

    }
}
