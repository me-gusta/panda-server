import Program from './Program.js'
import {addProgram} from '../utils/db.js'

export default class User {
    id = null
    context = {}
    programs = []
    removedPrograms = []

    constructor(userFromDB) {
        const {id, programs, context} = userFromDB
        this.id = id
        this.context = context
        for (let p of programs) {
            const program = new Program(this, p)
            this.programs.push(program)
        }
    }

    clearPrograms() {
        this.removedPrograms = this.programs.map(el => {
            el.removed = true

            return el.id
        })
    }

    async addProgram(programSchema) {
        const p = await addProgram(programSchema)

        const program = new Program(this, p)

        await program.initiateCurrentOperation()
    }

    removeProgram(programID) {
        this.removedPrograms.push(programID)
    }
}
