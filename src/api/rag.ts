import request from '@/utils/request'
import type {
  RagQAQueryDTO,
  RagQAQueryVO,
  RagPageResult,
  RagQAAddDTO,
  RagQADelDTO,
  QaDocument,
} from '@/types/rag'

export function getRagQaPage(params: RagQAQueryDTO): Promise<RagPageResult<RagQAQueryVO>> {
  return request.post('/rag/qa/page', params)
}

export function addRagQa(params: RagQAAddDTO): Promise<void> {
  return request.post('/rag/qa/add', params)
}

export function deleteRagQa(params: RagQADelDTO): Promise<void> {
  return request.post('/rag/admin/qa/delete', params)
}

export function searchRag(question: string): Promise<QaDocument[]> {
  return request.get(`/rag/search?question=${encodeURIComponent(question)}`)
}
