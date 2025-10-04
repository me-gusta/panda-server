import Program from './Program.js'

export default class User {
    context = {}
    programs = []
    constructor(userFromDB) {
        const {programs, context} = userFromDB
        this.context = context
        for (let p of programs) {
            const program = new Program(p)
            this.programs.push(program)
        }
    }
}
