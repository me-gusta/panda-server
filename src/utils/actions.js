import {bot} from '../bot.js'
import {getOperation} from '../operations.js'
import {setContext} from './db.js'

const makeNext = (ctx, program, end) => async () => {
    const {operationLabelList, current} = program

    if (operationLabelList.length - 1 === current) {
        end()
        return
    }

    program.current += 1

    const removeIds = []
    const nextProgram = getOperation(operationLabelList[program.current])
    await nextProgram.init({
        ...ctx,
        next: makeNext(ctx, program, () => removeIds.push(program.id)),
    })

    if (removeIds.length) ctx.programs = ctx.programs.filter(el => !removeIds.includes(el.id))
}

export default {
    text: async (ctx) => {
        // {text} = ctx

        const {programs} = ctx

        const removeIds = []
        for (let program of [...programs]) {
            const {operationLabelList, current} = program
            const operationLabel = operationLabelList[current]
            const operation = getOperation(operationLabel)
            if (operation.triggers && operation.triggers.text) {
                await operation.triggers.text({
                    ...ctx,
                    next: makeNext(ctx, program, () => removeIds.push(program.id)),
                })
            }
        }

        if (removeIds.length) ctx.programs = ctx.programs.filter(el => !removeIds.includes(el.id))
    },
    file: async (ctx) => {
        // {cdnURL, extension} = ctx
    },
    inlineButton: async (ctx) => {
        // {data} = ctx
    },
}
