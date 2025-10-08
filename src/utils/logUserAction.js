import { promises as fs } from 'node:fs'
import path from 'node:path'

const logsDir = 'logs'

const logUserAction = async (user, action) => {
    try {
        await fs.mkdir(logsDir, { recursive: true })

        const filePath = path.join(logsDir, `${user.telegramID}.txt`)

        // Check for file existence by trying to access it
        try {
            await fs.access(filePath)
        } catch {
            // File doesn't exist, create it with user info
            const userInfo =
                `[UserInfo]\n` +
                `telegramID: ${user.telegramID}\n` +
                `firstName: ${user.firstName}\n` +
                `lastName: ${user.lastName}\n` +
                `username: ${user.username}\n`
            await fs.writeFile(filePath, userInfo, { encoding: 'utf8' })
        }

        let logEntry = ''
        const { action: type, data } = action

        switch (type) {
            case 'tgText':
                logEntry = `[tgText]\ntext:\n${data.text}\n`
                break
            case 'tgFile':
                logEntry =
                    `[tgFile]\n` +
                    `cdnURL: ${data.cdnURL}\n` +
                    `extension: ${data.extension}\n` +
                    `caption: ${data.caption}\n`
                break
            case 'aiResponse':
                logEntry = data.error
                    ? `[aiResponse]\nerror: true\n`
                    : `[aiResponse]\nsuccess:\n${data.success}\n`
                break
            case 'tgInlineButton':
                logEntry = `[tgInlineButton]\ncallbackData: ${data.callbackData}\n`
                break
        }

        await fs.appendFile(filePath, logEntry, { encoding: 'utf8' })
    } catch (error) {
        console.error('Failed to log user action:', error)
    }
}

export default logUserAction
