import Operation from './Operation.js'
import {getOperation} from './operationMap.js'

export default class Program {
    id
    user
    operations = []
    pointer = 0
    pointerMax = 0
    context = {}
    removed = false
    telegramID = 0
    constructor(user, programData) {
        this.user = user

        const {id, operationLabelList, pointer, context} = programData
        this.id = id
        this.context = context
        this.pointerMax = operationLabelList.length - 1

        this.telegramID = user.telegramID

        this.pointer = pointer
        for (let operationLabel of operationLabelList) {
            const o = getOperation(operationLabel)
            this.operations.push(
                new Operation(user, this, operationLabel, o)
            )
        }
    }

    getCurrentOperation() {
        return this.operations[this.pointer]
    }

    async initiateCurrentOperation() {
        const o = this.getCurrentOperation()
        await o.runInit()
    }

    async initiateNextOperation() {
        if (this.pointer === this.pointerMax) {
            this.user.removeProgram(this.id)
            return
        }
        this.pointer += 1
        const o = this.getCurrentOperation()
        await o.runInit()
    }
}
