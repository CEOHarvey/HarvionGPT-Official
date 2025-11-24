import ModelClient, { isUnexpected } from '@azure-rest/ai-inference'
import { AzureKeyCredential } from '@azure/core-auth'
import Bytez from 'bytez.js'

export type ModelType = 'auto' | 'gpt-4.1' | 'gpt-4.1-bytez' | 'gpt-4.1-mini'

interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
}

interface ModelConfig {
  id: ModelType
  name: string
  priority: number
  provider: 'azure' | 'bytez'
}

export const MODELS: ModelConfig[] = [
  { id: 'gpt-4.1', name: 'GPT-4.1', priority: 1, provider: 'azure' },
  { id: 'gpt-4.1-bytez', name: 'GPT-4.1 BYTEZ', priority: 2, provider: 'bytez' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 MINI', priority: 3, provider: 'azure' },
]

const MODEL_TIMEOUT_MS = 8000
let lastSuccessfulAutoModel: ModelType | null = null

const isRateLimitError = (status?: number, code?: unknown, message?: string) => {
  if (status === 429) return true
  if (typeof code === 'number' && code === 429) return true
  if (typeof code === 'string' && code.trim() === '429') return true
  if (typeof message === 'string' && message.toLowerCase().includes('rate limit')) return true
  return false
}

const withTimeout = async <T>(promise: PromiseLike<T>, modelName: string): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const error = new Error(`${modelName} did not respond in time`)
      ;(error as any).code = 'MODEL_TIMEOUT'
      reject(error)
    }, MODEL_TIMEOUT_MS)

    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

export async function callAIModel(
  messages: AIMessage[],
  selectedModel: ModelType,
  imageUrls: string[] = []
): Promise<{ success: boolean; response?: string; error?: string; modelUsed?: string }> {
  const token = process.env.GITHUB_TOKEN || process.env.AI_API_KEY
  const endpoint = process.env.AI_API_URL || 'https://models.github.ai/inference'
  const bytezKey = process.env.BYTEZ_KEY || '52bdd9e9771bae577be9ba7319d813eb'

  if (!token) {
    throw new Error('GITHUB_TOKEN or AI_API_KEY is not set')
  }

  const buildAutoList = () => {
    const sorted = [...MODELS].sort((a, b) => a.priority - b.priority)
    if (lastSuccessfulAutoModel && lastSuccessfulAutoModel !== 'auto') {
      const idx = sorted.findIndex((m) => m.id === lastSuccessfulAutoModel)
      if (idx > 0) {
        const [favored] = sorted.splice(idx, 1)
        sorted.unshift(favored)
      }
    }
    return sorted
  }

  const modelsToTry =
    selectedModel === 'auto'
      ? buildAutoList()
      : [MODELS.find((m) => m.id === selectedModel)!].filter(Boolean)

  for (const modelConfig of modelsToTry) {
    try {
      let response: string

      if (modelConfig.provider === 'azure') {
        const client = ModelClient(endpoint, new AzureKeyCredential(token))

        const apiMessages = messages.map((msg) => {
          if (typeof msg.content === 'string') {
            return { role: msg.role, content: msg.content }
          }
          return { role: msg.role, content: msg.content }
        })

        let modelName: string = modelConfig.id
        if (modelConfig.id === 'gpt-4.1') {
          modelName = 'openai/gpt-4.1'
        } else if (modelConfig.id === 'gpt-4.1-mini') {
          modelName = 'openai/gpt-4.1-mini'
        }

        const apiResponse = await withTimeout(
          client.path('/chat/completions').post({
            body: {
              messages: apiMessages,
              temperature: 0.7,
              top_p: 1,
              model: modelName,
            },
          }),
          modelConfig.name
        )

        if (isUnexpected(apiResponse)) {
          const error = apiResponse.body?.error
          const status = (apiResponse as any).status
          const errorCode = error?.code ?? status
          const errorMessage =
            typeof error?.message === 'string'
              ? error.message
              : typeof apiResponse.body === 'string'
                ? apiResponse.body
                : String(error?.message || 'Unexpected response from AI API')

          if (isRateLimitError(status, errorCode, errorMessage)) {
            console.log(`Rate limit on ${modelConfig.name}, trying next model...`)
            continue
          }

          throw new Error(errorMessage || 'Unexpected response from AI API')
        }

        response = apiResponse.body.choices[0]?.message?.content || ''
      } else {
        const sdk = new Bytez(bytezKey)
        const model = sdk.model('openai/gpt-4.1')

        const bytezMessages = messages.map((msg) => {
          if (typeof msg.content === 'string') {
            return { role: msg.role, content: msg.content }
          }
          const textContent = msg.content.find((c) => c.type === 'text')?.text || ''
          const imageCount = msg.content.filter((c) => c.type === 'image_url').length
          const content =
            imageCount > 0
              ? `${textContent}\n\n[${imageCount} image(s) attached - image analysis may be limited]`
              : textContent
          return { role: msg.role, content }
        })

        const { error, output } = await withTimeout(model.run(bytezMessages), modelConfig.name)

        if (error) {
          const errorObj = typeof error === 'object' && error !== null ? (error as any) : null
          const errorMessage = errorObj?.message || (typeof error === 'string' ? error : String(error))
          const errorCode = errorObj?.code ?? errorObj?.status

          if (isRateLimitError(undefined, errorCode, errorMessage)) {
            console.log(`Rate limit on ${modelConfig.name}, trying next model...`)
            continue
          }
          throw typeof error === 'object' ? error : new Error(String(error))
        }

        if (typeof output === 'object' && output !== null) {
          if (typeof (output as any).content === 'string') {
            response = (output as any).content
          } else if (typeof (output as any).message === 'string') {
            response = (output as any).message
          } else if (typeof (output as any).text === 'string') {
            response = (output as any).text
          } else {
            response = JSON.stringify(output)
          }
        } else {
          response = (output as string) || ''
        }

        if (typeof response !== 'string') {
          response = String(response)
        }
      }

      if (!response || !response.trim()) {
        throw new Error(`${modelConfig.name} returned an empty response`)
      }

      if (selectedModel === 'auto') {
        lastSuccessfulAutoModel = modelConfig.id
      }

      return {
        success: true,
        response: response.trim(),
        modelUsed: modelConfig.name,
      }
    } catch (error: any) {
      console.error(`Error with ${modelConfig.name}:`, error.message || error)

      if (
        error.code === 'MODEL_TIMEOUT' ||
        isRateLimitError(error.status ?? error.statusCode, error.code, error.message)
      ) {
        continue
      }

      if (selectedModel !== 'auto' || modelConfig === modelsToTry[modelsToTry.length - 1]) {
        return {
          success: false,
          error: error.message || 'Failed to get response from AI',
        }
      }
    }
  }

  return {
    success: false,
    error: 'All models are currently unavailable. Please try again later.',
  }
}

