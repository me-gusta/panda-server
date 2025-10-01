import { PrismaClient } from '../../generated/prisma/index.js'

const prisma = new PrismaClient()

export async function getOrCreateUser(ctx) {
    const { id, username, first_name, last_name } = ctx.from

    let user = await prisma.user.findUnique({
        where: { telegramID: BigInt(id) },
    })

    if (!user) {
        user = await prisma.user.create({
            data: {
                telegramID: BigInt(id),
                username,
                firstName: first_name,
                lastName: last_name,
                state: "initial",       // updated to string default state
                data: {},               // keep empty JSON object to satisfy non-null Json field
            },
        })
    } else {
        // Update user details if changed
        if (
            user.username !== username ||
            user.firstName !== first_name ||
            user.lastName !== last_name
        ) {
            user = await prisma.user.update({
                where: { telegramID: BigInt(id) },
                data: {
                    username,
                    firstName: first_name,
                    lastName: last_name,
                },
            })
        }
    }
    user.telegramID = parseInt(user.telegramID)
    return user
}

export async function updateUser(user) {
    const { id, username, firstName, lastName, state, data } = user

    const updateData = {}
    if (username !== undefined) updateData.username = username
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (state !== undefined) updateData.state = state
    if (data !== undefined) updateData.data = data

    const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
    })

    return updatedUser
}

export async function createConversation(user, data) {
    const conversation = await prisma.conversation.create({
        data: {
            userId: user.id,
            data
        },
    })

    return conversation
}
