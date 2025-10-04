const tg = window.Telegram && window.Telegram.WebApp

// Prefer the raw init data provided by Telegram
const initDataRaw = tg?.initData || (function () {
    // Fallback: read from URL hash if needed
    // Telegram injects launch params in window.location.hash as a querystring
    const hash = window.location.hash.slice(1) // e.g. "tgWebAppData=...&tgWebAppVersion=..."
    const params = new URLSearchParams(hash)
    // tgWebAppData is the raw init data query string
    return params.get('tgWebAppData') || ''
})()

async function callBackend(path, body) {
    const res = await fetch(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `tma ${initDataRaw}`,
        },
        body: JSON.stringify(body),
        credentials: 'omit',
    })
    if (!res.ok) throw new Error('Request failed')
    return await res.json()
}

const inputTypeGroup = `
<div class="flex flex-col justify-center">
    <div class="text-center">
        <span>— Что обрабатываем? —</span>
    </div>
    <div class="flex flex-col justify-center gap-4">

        <label class="nb-card cursor-pointer">
            <span class="nb-card-content">
                <span class="nb-card-title">
                    <span class="nb-label">
                        <input value="file" name="inputType" type="radio" class="nb-checkbox default" checked>
                        Файл
                    </span>
                </span>
                <span class="nb-card-text mb-0!">Если тебя есть pdf или word файл</span>
            </span>
        </label>

        <label class="nb-card cursor-pointer">
            <span class="nb-card-content">
                <span class="nb-card-title">
                    <span class="nb-label">
                        <input value="photo" name="inputType" type="radio" class="nb-checkbox default">
                        Фотки
                    </span>
                </span>
                <span class="nb-card-text mb-0!">Оформить фотки слайдов/тетради</span>
            </span>
        </label>

        <label class="nb-card cursor-pointer">
            <span class="nb-card-content">
                <span class="nb-card-title">
                    <span class="nb-label">
                        <input value="text" name="inputType" type="radio" class="nb-checkbox default">
                        Напечатаю сам(а)
                    </span>
                </span>
                <span class="nb-card-text mb-0!">Просто напиши что нужно сделать</span>
            </span>
        </label>

    </div>
</div>
`

const outputTypeGroup = `
<div class="flex flex-col justify-center">
<div class="text-center">
    <span>— А что получим в итоге? —</span>
</div>
<div class="flex flex-col justify-center gap-4">
    <label class="nb-card cursor-pointer">
        <span class="nb-card-content">
            <span class="nb-card-title">
                <span class="nb-label">
                    <input value="text" name="outputType" type="radio" class="nb-checkbox default" checked>
                    Просто текст
                </span>
            </span>
            <span class="nb-card-text mb-0!">Сообщение придет тебе в телеграм</span>
        </span>
    </label>

    <label class="nb-card cursor-pointer">
        <span class="nb-card-content">
            <span class="nb-card-title">
                <span class="nb-label">
                    <input value="no-format" name="outputType" type="radio" class="nb-checkbox default">
                    Просто текст, но без форматирования
                </span>
            </span>
            <span class="nb-card-text mb-0!">Без <i>курсива</i>, <b>полужирного</b> и т.д.</span>
        </span>
    </label>

    <label class="nb-card cursor-pointer">
        <span class="nb-card-content">
            <span class="nb-card-title">
                <span class="nb-label">
                    <input value="docx" name="outputType" type="radio" class="nb-checkbox default">
                    Формат .docx
                </span>
            </span>
            <span class="nb-card-text mb-0!">Знаменитый "Ворд"</span>
        </span>
    </label>

    <label class="nb-card cursor-pointer">
        <span class="nb-card-content">
            <span class="nb-card-title">
                <span class="nb-label">
                    <input value="pdf" name="outputType" type="radio" class="nb-checkbox default">
                    Формат .pdf
                </span>
            </span>
            <span class="nb-card-text mb-0!">Для серьезных намерений</span>
        </span>
    </label>

</div>
</div>
`


const spawnSettings = ({title, hasInput, hasOutput}) => {
    const workArea = document.querySelector('#workArea')
    let routeSettings = `<div id="settings" class="route max-w-md flex flex-col gap-8 items-center">`
    routeSettings+= `
                        <div class="flex flex-col justify-center">
                            <span class="text-center">— Программа —</span>
                            <span class="text-center text-5xl font-bold">${title}</span>
                        </div>`
    if (hasInput) routeSettings += inputTypeGroup
    if (hasOutput) routeSettings += outputTypeGroup
    routeSettings += `<button id="startButton" class="nb-button flex! flex-col blue">
                        <b class="text-2xl">Начать</b>
                    </button>`
    routeSettings += `<button id="backButton" class="nb-button flex! flex-col orange">
                        <b class="text-2xl">Назад</b>
                    </button>`
    routeSettings += `</div>`
    workArea.insertAdjacentHTML('beforeend', routeSettings)

    document.querySelector('#backButton')
        .addEventListener('click', () => {
            document.getElementById('settings').remove()
            document.getElementById('pageMain').classList.remove('hidden!')
        })
}

window.addEventListener('load', () => {
    const workArea = document.querySelector('#workArea')
    const mainPageRoute = document.querySelector('#pageMain')
    const mainPageButtonList = document.querySelectorAll('#pageMain button')
    mainPageButtonList
        .forEach(el=> {
            el.addEventListener('click', () => {
                const action = el.getAttribute('data-btn')

                if (action === 'aiChat') {
                    // bot mode set aiChat
                    // close WebApp
                    return
                }
                if (action === 'cheers') {
                    // bot set quiz cheers
                    return
                }
                if (action === 'poems') {
                    // bot set quiz poems
                    return
                }

                mainPageRoute.classList.add('hidden!')

                if (action === 'konspect') {
                    spawnSettings({
                        title: 'Конспект+',
                        hasInput:true,
                        hasOutput: true,
                    })
                    document.querySelector('#startButton')
                        .addEventListener('click', async () => {
                            console.log('start konspekt')
                            const inputType = document.querySelector('[name="inputType"]:checked').value
                            const outputType = document.querySelector('[name="outputType"]:checked').value

                            await callBackend('/api/startProgram', {
                                program: 'konspekt',
                                inputType,
                                outputType
                            })
                            window.Telegram.WebApp.close()
                        })
                    return
                }
                if (action === 'zapominator') {
                    spawnSettings({
                        title: 'Запоминатор',
                        hasInput:true,
                        hasOutput: true,
                    })
                    document.querySelector('#startButton')
                        .addEventListener('click', () => {
                            console.log('start zapominator')
                        })
                    return
                }
                if (action === 'structure') {
                    spawnSettings({
                        title: 'Структурировать',
                        hasInput:true,
                        hasOutput: true,
                    })
                    document.querySelector('#startButton')
                        .addEventListener('click', () => {
                            console.log('start structure')
                        })
                    return
                }
                if (action === 'addWater') {
                    spawnSettings({
                        title: 'Добавить воды',
                        hasInput:true,
                        hasOutput: true,
                    })
                    document.querySelector('#startButton')
                        .addEventListener('click', () => {
                            console.log('start addWater')
                        })
                    return
                }
                if (action === 'extractFrom') {
                    spawnSettings({
                        title: 'Извлечь текст с фото',
                        hasInput:true,
                        hasOutput: true,
                    })
                    document.querySelector('#startButton')
                        .addEventListener('click', () => {
                            console.log('start extractFrom')
                        })
                    return
                }



            })
        })
})
