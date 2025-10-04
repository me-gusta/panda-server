export default class Program {
    user
    currentOperation = 0
    operations = []
    constructor(programData) {
        const {operations, currentOperation, context} = programData
        this.context = context

        this.currentOperation = currentOperation
        this.operations = operations
    }

    setUser(user) {
        this.user = user
    }
}
