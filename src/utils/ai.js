import {OpenAI} from 'openai'

const client = new OpenAI({
    apiKey: process.env.AITUNNEL_API_KEY,
    baseURL: 'https://api.aitunnel.ru/v1/'
})

export const chatOnce = async ({messages, model}) => {
    const res = await client.chat.completions.create({
        model,
        messages,
        max_tokens: 1800,
        temperature: 0.2
    })
    return res.choices[0]?.message?.content?.trim() ?? ''
}

// export const summarizeFromImages = async (imageSources, userRequirements = '') => {
//     const imageParts = await makeImageParts(imageSources)
//
//     const messages = [
//         { role: 'system', content: BASE_PROMPT },
//         {
//             role: 'user',
//             content: [
//                 { type: 'text', text: userRequirements || 'Сделай конспект по изображениям ниже' },
//                 ...imageParts
//             ]
//         }
//     ]
//
//     const out = await chatOnce(messages)
//     return out
// }
