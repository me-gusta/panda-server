import {getOperation} from '../operations.js'
import {getContext, setContext} from './db.js'

const makeNext = (ctx, program, end) => async () => {
    console.log('next')
    console.log(program)
    const {operationLabelList, current} = program

    if (operationLabelList.length - 1 === current) {
        console.log('END')
        end()
        return
    }

    program.current += 1

    const removeIds = []
    const programsToAdd = []
    const nextProgram = getOperation(operationLabelList[program.current])
    await nextProgram.init({
        ...ctx,
        program,
        next: makeNext(ctx, program, () => removeIds.push(program.id)),
        end: async () => removeIds.push(program.id),
        removeProgram: (programID) => removeIds.push(programID),
        addProgram: (spec) => programsToAdd.push(spec),
    })

    if (removeIds.length) ctx.setContext({
        programs: ctx.programs.filter(el => !removeIds.includes(el.id)),
    })

    ctx.setContext({
        programs: {$push: programsToAdd},
    })
}

const operate = async ctx => {
    const {programs} = ctx

    const programsToAdd = []
    const removeIds = []
    for (let program of [...programs]) {
        const {operationLabelList, current} = program
        const operationLabel = operationLabelList[current]
        const operation = getOperation(operationLabel)

        if (operation.triggers && operation.triggers.text) {
            await operation.triggers.text({
                ...ctx,
                program,
                next: makeNext(ctx, program, () => removeIds.push(program.id)),
                end: async () => removeIds.push(program.id),
                removeProgram: (programID) => removeIds.push(programID),
                addProgram: (spec) => programsToAdd.push(spec),
            })
        }
    }

    if (removeIds.length) ctx.setContext({
        programs: ctx.programs.filter(el => !removeIds.includes(el.id)),
    })

    ctx.setContext({
        programs: {$push: programsToAdd},
    })
}

export default {
    text: async (ctx, more) => {
        // {text} = ctx
        await operate({
                ...ctx,
                setContext: upd => setContext(ctx, upd),
                ...more,
            },
        )
    },
    aiResponse: async (ctx, more) => {
        // {cdnURL, extension} = ctx
        await operate({
            ...ctx,
            setContext: upd => setContext(ctx, upd),
            ...more,
        })
    },
    file: async (ctx) => {
        // {cdnURL, extension} = ctx
        await operate(ctx)
    },
    inlineButton: async (ctx) => {
        // {data} = ctx
        await operate(ctx)
    },
}
