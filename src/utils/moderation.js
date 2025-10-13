import 'dotenv/config'
import {bot} from '../bot.js'

const {
    MODERATOR_ID
} = process.env

export const notifyModerator = async (text) => {
    if (!MODERATOR_ID) return
    try {
        await bot.api.sendMessage(MODERATOR_ID, text, {parse_mode: 'HTML'})
    } catch (e) {}
}

export const isModerator = (userID) => {
    if (Number(MODERATOR_ID) === Number(userID)) {
        return true
    }
}
