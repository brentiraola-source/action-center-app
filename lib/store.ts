import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface CaseItem {
  id: string
  tracking_number?: string
  caseNo?: string
  title: string
  description?: string
  status: string
  priority: string
  priorityLevel?: string
  assigned_to?: string
  due_date?: string
  category?: string
  client_name?: string
  complainantName?: string
  targetOffice?: string
  locationBarangay?: string
  referredAt?: string
  summaryEnglish?: string
  referralLetter?: string
  created_at?: string
  createdAt?: string
}

interface CaseStore {
  cases: CaseItem[]
  loading: boolean
  fetchCases: () => Promise<void>
  addCase: (newCase: Omit<CaseItem, 'id' | 'created_at'>) => Promise<void>
  updateCaseStatus: (id: string, status: string) => Promise<void>
}

export const useCaseStore = create<CaseStore>((set, get) => ({
  cases: [],
  loading: false,

  fetchCases: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cases from Supabase:', error.message)
      set({ loading: false })
    } else {
      set({ cases: data || [], loading: false })
    }
  },

  addCase: async (newCase) => {
    const { data, error } = await supabase
      .from('cases')
      .insert([newCase])
      .select()

    if (error) {
      console.error('Error adding case to Supabase:', error.message)
    } else if (data) {
      set({ cases: [data[0], ...get().cases] })
    }
  },

  updateCaseStatus: async (id, status) => {
    const { error } = await supabase
      .from('cases')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('Error updating case status:', error.message)
    } else {
      set({
        cases: get().cases.map((c) => (c.id === id ? { ...c, status } : c)),
      })
    }
  },
}))
