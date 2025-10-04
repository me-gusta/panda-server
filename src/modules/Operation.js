export default class Operation {
    program // Program
    user // User
    triggers = {}
    init = async () => {}

    constructor(operationData) {
        const {triggers, init} = operationData
        if (init) this.init = init
        if (triggers) this.triggers = triggers
    }

    setParent(program) {
        this.program = program
    }

    setUser(user) {
        this.user = user
    }

    _next() {
        // this.program.current += 1
    }

    _end() {
        // this.user.removeProgram(this.program.id)
    }

    extendCtxProgram(update) {

    }
    extendCtxUser(update) {

    }
    getCtxProgram(label) {
        return ''
    }
    getCtxUser(label) {
        return ''
    }
}
