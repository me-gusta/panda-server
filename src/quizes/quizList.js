import {createConversation, updateUser} from '../utils/db.js'
import {bot} from '../bot.js'
import {chatOnce} from '../utils/ai.js'

const konspekt = async (user) => {
    try {
        
        const response = await chatOnce({
            model: 'deepseek-v3.1-terminus',
            messages: [
                { role: 'system', content: `Ты профессор университета. 
Не пиши приветствий. 
Выведи только выполненное задание.
Используй грамотный русский академический язык. 
Не добавляй ничего от себя. 
Сохрани все важные моменты.
Проверяй достоверность фактов.
Структурируй знания.
Без оценочных суждений, только факты.` },
                {
                    role: 'user', message: {}
                }
            ]
        })
    }catch (e) {

    }

}

export default {
    onboarding: {
        questions: [
            {
                "text": "Кто вы такой?",
                "accept": "text",
            },
            {
                "text": "Что вы хотите?",
                "accept": "text",
            },
        ],
        onEnd: async (user) => {
            await createConversation(user, user.data)
            user.state = 'unassigned'
            user.data = {}
            await updateUser(user)

            await bot.api.sendMessage(
                user.telegramID,
                `Спасибо за ответ! Пользуйтесь ботом: /start`)
        },
    },

    inputText: {
        questions: [
            {
                "text": "Введите запрос",
                "accept": "text",
            },
        ],
        onEnd: async (user) => {
            const program = user.data.program
            if (program === 'konspekt') {
                user.state = 'halt'
                await updateUser(user)
                await bot.api.sendMessage(user.telegramID, 'Обрабатываю ваш запрос')
                konspekt(user)
            }
        },
    },

}
