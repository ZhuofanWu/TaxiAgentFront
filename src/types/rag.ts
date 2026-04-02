export interface RagQAQueryDTO {
  groupId?: string
  page: number
  size: number
}

export interface RagQAQueryVO {
  groupId: string
  questionMap: Record<string, string>
  answer: string
}

export interface RagPageResult<T> {
  page: number
  size: number
  total: number
  records: T[]
}

export interface RagQAAddDTO {
  questions: string[]
  answer: string
}

export interface RagQADelDTO {
  groupIds?: string[]
  questionIds?: string[]
}

export interface QaDocument {
  groupId: string
  questionId: string
  question: string
  answer: string
  questionVector?: null
}
