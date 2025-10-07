import {getUser, saveUser} from '../utils/db.js'
import User from './User.js'


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
