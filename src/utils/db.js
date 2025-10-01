import {PrismaClient} from '../../generated/prisma/index.js'
import {nanoid} from 'nanoid'

const prisma = new PrismaClient()

export async function getContext(grammyContext) {
    const telegramID = grammyContext.from.id
    const username = grammyContext.from.username
    const fullName = grammyContext.from.first_name
    const lastName = grammyContext.from.last_name

    let user = await prisma.user.findUnique({
        where: {telegramID: BigInt(telegramID)},
    })

    if (!user) {
        user = await prisma.user.create({
            data: {
                telegramID: BigInt(telegramID),
                context: {
                    telegramID: grammyContext.from.id,
                    user: {username, fullName, lastName},
                    programs: [
                        {
                            id: nanoid(),
                            operationLabelList: ['onboarding.before', 'onboarding.q1', 'onboarding.q2', 'setBasic'],
                            current: 0,
                            ctx: {},
                        },
                    ],
                },
            },
        })
    }

    user.context.user.username = username
    user.context.user.fullName = fullName
    user.context.user.lastName = lastName

    return user.context

}


export async function saveContext(grammyContext, ctx) {
    const telegramID = grammyContext.from.id

    await prisma.user.update({
        where: {telegramID: BigInt(telegramID)},
        data: {
            context: ctx
        }
    })
}

export async function getOrCreateUser(ctx) {
    return {hello: 'true', telegramID: ctx.from.id}

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
                where: {telegramID: BigInt(id)},
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

export function setContext(obj, extension) {
    console.log('setContext')
    for (const key in extension) {
        if (Object.prototype.hasOwnProperty.call(extension, key)) {
            const extensionValue = extension[key]
            const originalValue = obj[key]

            // Check if extensionValue is a plain object and not an array or null
            if (typeof extensionValue === 'object' && extensionValue !== null && !Array.isArray(extensionValue)) {
                // Handle special commands: $push, $add, $sub
                if (Object.prototype.hasOwnProperty.call(extensionValue, '$push')) {
                    if (Array.isArray(originalValue)) {
                        originalValue.push(...extensionValue.$push)
                    }
                } else if (Object.prototype.hasOwnProperty.call(extensionValue, '$add')) {
                    if (typeof originalValue === 'number') {
                        obj[key] += extensionValue.$add
                    }
                } else if (Object.prototype.hasOwnProperty.call(extensionValue, '$sub')) {
                    if (typeof originalValue === 'number') {
                        obj[key] -= extensionValue.$sub
                    }
                    // If it's a regular object for deep merging
                } else if (typeof originalValue === 'object' && originalValue !== null && !Array.isArray(originalValue)) {
                    setContext(originalValue, extensionValue)
                } else {
                    // If the key doesn't exist in obj or is not an object, assign it
                    obj[key] = extensionValue
                }
            } else {
                // For non-object values, just assign
                obj[key] = extensionValue
            }
        }
    }
    console.log(obj)
}
