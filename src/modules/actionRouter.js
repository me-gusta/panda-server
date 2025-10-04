import {getOperation} from '../operations.js'
import {getUser, saveUser} from '../utils/db.js'
import User from './User.js'

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
/*

telegramID =>

User
ctx
    telegramID
    username
*programs

Program
ctx
    ...
pointer
*operationLabelList

------------------

inputType = 'tgText' | 'tgPhoto' | 'tgFile' | 'aiResponse'
data = ...

for program of User.iter_programs()
    operation = program.current()
    if (operation.inputs.inputType) {
        const halt = operation.input.inputType(data)
        if (halt) return
    }

compare User.programs vs User.programsAsInputed: remove or update (ctx, pointer)
update User.ctx

------------------

operation._next() -> this.program.current += 1
operation._end() -> this.user.removeProgram(this.program.id)
operation.extendCtxProgram({...})
operation.extendCtxUser({...})
operation.getCtxProgram('name')
operation.getCtxUser('name.with.dots')


 */

export default async (actionData) => {
    const {action, telegramID, data} = actionData

    const userFromDB = await getUser(telegramID)
    const user = new User(userFromDB)
    console.log('------ vvvvvv ------')
    console.log('action', action)
    console.log('data', data)
    console.log('user', user.id)
    const programs = user.programs.toReversed()
    for (let program of programs) {
        console.log('program', program.id)
        const operation = program.getCurrentOperation()
        console.log('operation')
        console.log(operation.triggers)
        const shouldHalt = await operation.runTrigger(action, data)
        if (shouldHalt) break
    }

    console.log('------ ///// ------')
    await saveUser(user)
}
