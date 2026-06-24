import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export const runtime = 'nodejs'
export const maxDuration = 30

const SYSTEM_INSTRUCTION = `당신은 메모 요약 전문가입니다. 사용자의 메모를 읽고 핵심 내용을 간결하게 한국어로 요약해 주세요.

요약 규칙:
- 3~5문장 이내로 핵심만 요약
- 불필요한 수식어 없이 명확하게 작성
- 메모의 중요한 키워드와 결론을 포함
- 마크다운 기호 없이 순수 텍스트로 작성`

interface SummarizeRequest {
  title: string
  content: string
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.' },
      { status: 500 }
    )
  }

  let body: SummarizeRequest

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: '요청 형식이 올바르지 않습니다.' },
      { status: 400 }
    )
  }

  const { title, content } = body

  if (!title?.trim() && !content?.trim()) {
    return NextResponse.json(
      { error: '요약할 메모 내용이 없습니다.' },
      { status: 400 }
    )
  }

  const prompt = `제목: ${title}\n\n내용:\n${content}`

  try {
    const ai = new GoogleGenAI({ apiKey })

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
        maxOutputTokens: 512,
        thinkingConfig: { thinkingBudget: 0 },
      },
    })

    const summary = response.text

    if (!summary) {
      return NextResponse.json(
        { error: '요약 결과를 생성하지 못했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Gemini API 호출 오류:', error)

    if (error instanceof Error && error.message.includes('API_KEY')) {
      return NextResponse.json(
        { error: 'API 키가 유효하지 않습니다. GEMINI_API_KEY를 확인해 주세요.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'AI 요약 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    )
  }
}
