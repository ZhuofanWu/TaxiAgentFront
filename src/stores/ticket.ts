import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TicketVO, TicketDetailVO, TicketQueryParams, ActionType } from '@/types/ticket'
import type { PageResult } from '@/types/user'
import {
  getTicketPage,
  getTicketDetail,
  claimTicket,
  assignTicket,
  reassignTicket,
  transferTicket,
  escalateTicket,
  handleTicket,
  rejectTicket,
} from '@/api/ticket'

export const useTicketStore = defineStore('ticket', () => {
  // 状态
  const unassignedTickets = ref<TicketVO[]>([])
  const assignedTickets = ref<TicketVO[]>([])
  const currentTicket = ref<TicketDetailVO | null>(null)
  const unassignedPagination = ref({ current: 1, size: 20, total: 0 })
  const assignedPagination = ref({ current: 1, size: 20, total: 0 })
  const loading = ref(false)

  // 获取未分配工单列表
  async function fetchUnassignedTickets(page = 1, size = 20) {
    loading.value = true
    try {
      const result = await getTicketPage({
        status: 0,
        current: page,
        size,
      })
      unassignedTickets.value = result.records
      unassignedPagination.value = {
        current: result.current,
        size: result.size,
        total: result.total,
      }
      return result
    } finally {
      loading.value = false
    }
  }

  // 获取已分配工单列表
  async function fetchAssignedTickets(page = 1, size = 20) {
    loading.value = true
    try {
      const result = await getTicketPage({
        status: 1,
        current: page,
        size,
      })
      assignedTickets.value = result.records
      assignedPagination.value = {
        current: result.current,
        size: result.size,
        total: result.total,
      }
      return result
    } finally {
      loading.value = false
    }
  }

  // 获取工单详情
  async function fetchTicketDetail(ticketId: string) {
    loading.value = true
    try {
      const result = await getTicketDetail(ticketId)
      currentTicket.value = result
      return result
    } finally {
      loading.value = false
    }
  }

  // 认领工单
  async function claim(ticketId: string) {
    const result = await claimTicket(ticketId)
    if (result) {
      if (currentTicket.value?.ticketId === ticketId) {
        await fetchTicketDetail(ticketId)
      }
      await fetchUnassignedTickets()
      await fetchAssignedTickets()
    }
    return result
  }

  // 分配工单
  async function assign(ticketId: string, handlerId: string) {
    const result = await assignTicket(ticketId, handlerId)
    if (result) {
      if (currentTicket.value?.ticketId === ticketId) {
        await fetchTicketDetail(ticketId)
      }
      await fetchUnassignedTickets()
      await fetchAssignedTickets()
    }
    return result
  }

  // 接管工单
  async function takeOver(ticketId: string) {
    return reassign(ticketId)
  }

  // 再分配工单
  async function reassign(ticketId: string, handlerId?: string) {
    const result = await reassignTicket(ticketId, handlerId)
    if (result) {
      if (currentTicket.value?.ticketId === ticketId) {
        await fetchTicketDetail(ticketId)
      }
      await fetchUnassignedTickets()
      await fetchAssignedTickets()
    }
    return result
  }

  // 加急工单
  async function escalate(ticketId: string, targetLevel: number, reason: string) {
    const result = await escalateTicket(ticketId, targetLevel, reason)
    if (result && currentTicket.value?.ticketId === ticketId) {
      await fetchTicketDetail(ticketId)
    }
    return result
  }

  // 提交确认（解决工单）
  async function resolve(ticketId: string, content: string) {
    const result = await handleTicket({ ticketId, content, actionType: 'RESOLVE' as ActionType })
    if (result && currentTicket.value?.ticketId === ticketId) {
      await fetchTicketDetail(ticketId)
    }
    return result
  }

  // 转交工单（转回待分配，清空 handler）
  async function transfer(ticketId: string, content?: string) {
    const result = await transferTicket(ticketId, content)
    if (result && currentTicket.value?.ticketId === ticketId) {
      await fetchTicketDetail(ticketId)
    }
    await fetchUnassignedTickets()
    await fetchAssignedTickets()
    return result
  }

  // 驳回工单
  async function reject(ticketId: string, content: string) {
    const result = await rejectTicket(ticketId, content)
    if (result && currentTicket.value?.ticketId === ticketId) {
      await fetchTicketDetail(ticketId)
    }
    await fetchUnassignedTickets()
    await fetchAssignedTickets()
    return result
  }

  // 刷新所有数据
  async function refreshAll() {
    await Promise.all([fetchUnassignedTickets(), fetchAssignedTickets()])
  }

  return {
    unassignedTickets,
    assignedTickets,
    currentTicket,
    unassignedPagination,
    assignedPagination,
    loading,
    fetchUnassignedTickets,
    fetchAssignedTickets,
    fetchTicketDetail,
    claim,
    assign,
    takeOver,
    reassign,
    escalate,
    resolve,
    transfer,
    reject,
    refreshAll,
  }
})
