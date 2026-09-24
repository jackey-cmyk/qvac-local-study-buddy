import {
  loadModel,
  LLAMA_3_2_1B_INST_Q4_0,
  completion,
  unloadModel,
} from '@qvac/sdk'

console.log('')
console.log('========================================')
console.log('       QVAC LOCAL STUDY BUDDY')
console.log('========================================')
console.log('Running AI locally on this device.')
console.log('No cloud AI API is being used.')
console.log('')

let modelId = null

try {
  console.log('Loading QVAC model...')
  console.log('The first run may download the model.')
  console.log('')

  modelId = await loadModel({
    modelSrc: LLAMA_3_2_1B_INST_Q4_0,
    onProgress: (progress) => {
      if (progress && progress.percentage !== undefined) {
        console.log(
          'Downloading model: ' +
            progress.percentage.toFixed(0) +
            '%'
        )
      }
    },
  })

  console.log('')
  console.log('Model loaded successfully!')
  console.log('')

  const question =
    'Explain photosynthesis in simple terms for a student.'

  console.log('Question: ' + question)
  console.log('')
  console.log('AI Answer:')
  console.log('----------------------------------------')

  const result = completion({
    modelId: modelId,
    history: [
      {
        role: 'user',
        content: question,
      },
    ],
    stream: true,
  })

  for await (const token of result.tokenStream) {
    process.stdout.write(token)
  }

  console.log('')
  console.log('----------------------------------------')
  console.log('QVAC inference completed locally.')
} catch (error) {
  console.error('')
  console.error('QVAC Error:')
  console.error(error)
  process.exitCode = 1
} finally {
  if (modelId) {
    await unloadModel({ modelId: modelId })
  }
}