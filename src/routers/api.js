import express from 'express'
import crypto from 'node:crypto'
import {getUser, saveUser} from '../utils/db.js'
import User from '../modules/User.js'

const router = express.Router()

function validateTMA(initDataRaw, botToken) {
    const params = new URLSearchParams(initDataRaw)
    const receivedHash = params.get('hash')
    if (!receivedHash) return {ok: false}

    // Build data check string
    params.delete('hash')
    const pairs = []
    for (const [k, v] of params.entries()) {
        pairs.push(`${k}=${v}`)
    }
    pairs.sort()
    const dataCheckString = pairs.join('\n')

    // secret = HMAC_SHA256("WebAppData", botToken)
    const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
    // computed = HMAC_SHA256(secret, dataCheckString) hex
    const computedHash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex')

    const ok = crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(receivedHash))
    if (!ok) return {ok: false}

    // If valid, parse user
    const userJson = params.get('user')
    const user = userJson ? JSON.parse(userJson) : null
    return {ok: true, user, params}
}

router.post('/startProgram', async (req, res) => {
    const auth = req.header('authorization') || ''
    const [scheme, token] = auth.split(' ')
    if (scheme !== 'tma' || !token) return res.status(401).json({error: 'unauthorized'})

    const result = validateTMA(token, process.env.TG_BOT_TOKEN)
    if (!result.ok) return res.status(401).json({error: 'bad signature'})

    const {program, inputType, outputType} = req.body
    const telegramID = result.user?.id
    console.log(telegramID, program, inputType, outputType)

    const userFromDB = await getUser(telegramID)
    const user = new User(userFromDB)


    const helloProgram = 'hello'
    const inputProgram = 'input.' + inputType
    const outputProgram = 'output.' + outputType

    let helloText = 'Привет! Эмм... как я тут оказался?'

    if (program === 'konspekt') {
        helloText = 'Это будет твой лучший конспект!'
    } else if (program === 'zapominator') {
        helloText = 'Будем делать карточки, чтобы не зубрить а понимать что к чему. В знании - сила, слышал(а) о таком?'
    } else if (program === 'structure') {
        helloText = 'Сделаю порядок. В тексте. А за донат наведу порядок в комнате.'
    } else if (program === 'addWater') {
        helloText = 'Отлично! Ты выбрал программу H20 - просто добавь воды...'
    } else if (program === 'extractFrom') {
        helloText = 'Загрузи фото — я по нему всё распознаю и переведу в текст. Настоящее волшебство!'
    }

    await user.addProgram({
        operationLabelList: [helloProgram, inputProgram, 'requestAI', outputProgram],
        context: {
            aiProgram: program,
            helloText: helloText,
            input: [],
        },
    })

    await saveUser(user)

    res.json({ok: true, user_id: result.user?.id})
})

export default router
