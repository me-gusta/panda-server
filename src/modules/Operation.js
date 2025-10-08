import deepUpdateObject from '../utils/deepUpdateObject.js'
import deepGetFromObject from '../utils/deepGetFromObject.js'

export default class Operation {
    label = ''
    program // Program
    user // User
    triggers = {}
    init = undefined
    telegramID = 0

    constructor(user, program, label, operationData) {
        this.label = label
        this.user = user
        this.program = program
        this.telegramID = user.telegramID
        const {triggers, init} = operationData
        if (init) this.init = init
        if (triggers) this.triggers = triggers
    }

    async next() {
        await this.program.initiateNextOperation()
    }

    end() {
        this.user.removeProgram(this.program.id)
    }

    async runInit() {
        if (this.program.removed) return
        if (this.init) await this.init(this)
    }

    async runTrigger(triggerLabel, data) {
        if (this.program.removed) return
        if (this.triggers[triggerLabel]) return await this.triggers[triggerLabel](this, data)
    }

    extendCtxProgram(update) {
        deepUpdateObject(this.program.context, update)
    }

    extendCtxUser(update) {
        deepUpdateObject(this.user.context, update)
    }

    getCtxProgram(label) {
        return deepGetFromObject(this.program.context, label)
    }

    getCtxUser(label) {
        return deepGetFromObject(this.user.context, label)
    }
}
