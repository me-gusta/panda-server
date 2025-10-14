import {PrismaClient} from '../../generated/prisma/index.js'

const prisma = new PrismaClient()


export async function ensureUserExists(ctx) {
    const {id, username, first_name, last_name} = ctx.from

    let user = await prisma.user.findUnique({
        where: {telegramID: BigInt(id)},
    })

    if (!user) {
        user = await prisma.user.create({
            data: {
                telegramID: BigInt(id),
                username,
                firstName: first_name,
                lastName: last_name,
                context: {},
            },
        })
        return true
    } else {
        if (
            user.username !== username ||
            user.firstName !== first_name ||
            user.lastName !== last_name
        ) {
            user = await prisma.user.update({
                where: {telegramID: BigInt(id)},
                data: {
                    username,
                    firstName: first_name,
                    lastName: last_name,
                },
            })
        }
    }
}

export async function getUser(telegramID) {
    let user = await prisma.user.findUnique({
        where: {telegramID: BigInt(telegramID)},
        include: {programs: true},
    })

    if (!user) {
        throw 'No user'
    }

    return user
}


export async function addProgram(userId, {context = {}, operationLabelList, pointer = 0}) {
    return prisma.program.create({
        data: {
            context,
            operationLabelList,
            pointer,
            User: {connect: {id: userId}},
        },
    })
}


export async function saveUser(user) {
    const {id, programs, removedPrograms, context} = user

    const removedSet = new Set(removedPrograms)

    const userPromise = prisma.user.update({
        where: {id},
        data: {
            context,
            programs: {
                disconnect: removedPrograms.map(pid => ({id: pid})),
            },
        },
    })

    const programPromises = programs
        .filter(p => !removedSet.has(p.id))
        .map(p => {
                return prisma.program.update({
                    where: {id: p.id},
                    data: {context: p.context, pointer: p.pointer},
                })
            },
        )

    const [userResult, programResults] = await Promise.all([
        userPromise,
        Promise.all(programPromises),
    ])

}
