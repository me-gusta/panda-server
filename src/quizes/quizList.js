import {createConversation, updateUser} from '../utils/db.js'
import {bot} from '../bot.js'

export default {
  onboarding: {
    "questions": [
      {
        "text": "Кто вы такой?",
        "accept": "text"
      },
      {
        "text": "Что вы хотите?",
        "accept": "text"
      }
    ],
    onEnd: async (user) => {
      await createConversation(user, user.data)
      user.state = 'unassigned'
      user.data = {}
      await updateUser(user)

      await bot.api.sendMessage(
          user.telegramID,
          `Спасибо за ответ! Пользуйтесь ботом: /start`)
    }
  }

}
