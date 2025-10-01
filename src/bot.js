import 'dotenv/config'
import { Bot } from 'grammy'
import { hydrateFiles } from '@grammyjs/files'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import path from 'path'
import {enableQuiz} from './quizes/quiz.js'

const {TG_BOT_TOKEN} = process.env

export const bot = new Bot(TG_BOT_TOKEN, {
    client: {
        environment: 'test'
    }
})

// Enable file downloads
bot.api.config.use(hydrateFiles(bot.token))
