import quizList from './quizList.js'
import {bot} from '../bot.js'
import {updateUser} from '../utils/db.js'

export const enableQuiz = async (user, quizLabel) => {
    const {questions} = quizList[quizLabel]

    user.state = 'quiz'
    user.data.quiz = {
        label: quizLabel,
        questionID: 0,
        questions
    }

    await updateUser(user)

    const qu = questions[0]
    await bot.api.sendMessage(parseInt(user.telegramID), qu.text)
}

export const assertAccept = (user, acceptData) => {
    for(let dataType of acceptData) {
        const qu = user.data.quiz.questions[user.data.quiz.questionID]

        if (dataType !== qu.accept) {
            return false
        }
    }
    return true
}

export const nextQuizStep = async (user, quizStep) => {
    const qu = user.data.quiz.questions[user.data.quiz.questionID]
    if (!qu.answers) {
        qu.answers = [quizStep]
    } else {
        qu.answers.push(quizStep)
    }

    if (user.data.quiz.questionID === user.data.quiz.questions.length - 1) {
        const {onEnd} = quizList[user.data.quiz.label]
        await onEnd(user)
    } else {
        user.data.quiz.questionID += 1

        const quNew = user.data.quiz.questions[user.data.quiz.questionID]
        await bot.api.sendMessage(parseInt(user.telegramID), quNew.text)
    }

    await updateUser(user)
}
