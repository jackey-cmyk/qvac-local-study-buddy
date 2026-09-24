const loadButton = document.getElementById('loadButton')
const askButton = document.getElementById('askButton')
const questionInput = document.getElementById('question')
const status = document.getElementById('status')
const answer = document.getElementById('answer')
const thinking = document.getElementById('thinking')

let modelLoaded = false

qvacAPI.onLoadProgress((progress) => {
  status.textContent = 'Loading model: ' + Math.round(progress) + '%'
})

qvacAPI.onCompletionStream((token) => {
  answer.textContent += token
})

qvacAPI.onCompletionFinished(() => {
  thinking.textContent = 'Complete'
  askButton.disabled = false
})

async function loadQVACModel() {
  try {
    loadButton.disabled = true
    askButton.disabled = true

    status.textContent = 'Loading QVAC model...'
    thinking.textContent = 'Please wait...'
    answer.textContent =
      'Loading the local AI model. This may take a while on the first run.'

    const result = await qvacAPI.loadModel()

    if (result.success) {
      modelLoaded = true

      status.textContent = 'Model loaded'
      thinking.textContent = 'Ready'

      loadButton.textContent = 'Model Loaded'
      askButton.disabled = false

      answer.textContent =
        'QVAC is ready. Enter a study question and click Ask QVAC AI.'
    }
  } catch (error) {
    status.textContent = 'Error loading model'
    thinking.textContent = 'Error'

    loadButton.disabled = false
    askButton.disabled = true

    answer.textContent =
      'QVAC Error:\n' + error.message
  }
}

loadButton.addEventListener('click', loadQVACModel)

askButton.addEventListener('click', async () => {
  const question = questionInput.value.trim()

  if (!question) {
    answer.textContent = 'Please enter a study question first.'
    return
  }

  if (!modelLoaded) {
    answer.textContent = 'The QVAC model is still loading.'
    return
  }

  try {
    askButton.disabled = true
    thinking.textContent = 'QVAC is thinking...'
    answer.textContent = ''

    await qvacAPI.infer([
      {
        role: 'user',
        content: question,
      },
    ])
  } catch (error) {
    thinking.textContent = 'Error'

    answer.textContent =
      'QVAC Error:\n' + error.message

    askButton.disabled = false
  }
})

window.addEventListener('beforeunload', async () => {
  if (modelLoaded) {
    try {
      await qvacAPI.unloadModel()
    } catch (error) {
      console.error(error)
    }
  }
})

loadQVACModel()