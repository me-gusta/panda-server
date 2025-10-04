import Program from './Program.js'
import {addProgram} from '../utils/db.js'

export default class User {
    id = null
    context = {}
    programs = []
    removedPrograms = []
    telegramID

    constructor(userFromDB) {
        const {id, programs, context, telegramID} = userFromDB
        this.id = id
        this.context = context
        this.telegramID = parseInt(telegramID)
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
        const p = await addProgram(this.id, programSchema)

        const program = new Program(this, p)
        this.programs.push(program)

        await program.initiateCurrentOperation()
    }

    removeProgram(programID) {
        this.removedPrograms.push(programID)
        const program = this.programs.find(el => el.id === programID)
        if (program) {
            program.removed = true
        }
    }
}
