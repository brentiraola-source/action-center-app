'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CaseItem {
  id: string;
  caseNo: string;
  complainantName: string;
  locationBarangay: string;
  category: string;
  priorityLevel: string;
  targetOffice: string;
  summaryEnglish: string;
  referralLetter: string;
  status: 'Pending' | 'Resolved' | 'Breached';
  createdAt: string;
  referredAt: string;
}

interface CaseStore {
  cases: CaseItem[];
  addCase: (newCase: Omit<CaseItem, 'id' | 'caseNo' | 'createdAt' | 'status'>) => void;
  updateStatus: (id: string, status: 'Pending' | 'Resolved' | 'Breached') => void;
  updateReferralDate: (id: string, referredAt: string) => void;
  updateMemo: (id: string, referralLetter: string) => void;
  importExternalCases: (importedCases: CaseItem[]) => void;
}

export const useCaseStore = create<CaseStore>()(
  persist(
    (set) => ({
      cases: [],
      addCase: (caseData) =>
        set((state) => {
          // Starts numbering at 37 and increments based on existing items
          const nextNumber = 37 + state.cases.length;
          const formattedCaseNo = `Case #${String(nextNumber).padStart(4, '0')}`;

          return {
            cases: [
              {
                ...caseData,
                id: Math.random().toString(36).substring(2, 9),
                caseNo: formattedCaseNo,
                status: 'Pending',
                createdAt: new Date().toISOString(),
                referredAt: new Date().toISOString().slice(0, 10),
              },
              ...state.cases,
            ],
          };
        }),
      updateStatus: (id, status) =>
        set((state) => ({
          cases: state.cases.map((c) => (c.id === id ? { ...c, status } : c)),
        })),
      updateReferralDate: (id, referredAt) =>
        set((state) => ({
          cases: state.cases.map((c) => (c.id === id ? { ...c, referredAt } : c)),
        })),
      updateMemo: (id, referralLetter) =>
        set((state) => ({
          cases: state.cases.map((c) => (c.id === id ? { ...c, referralLetter } : c)),
        })),
      importExternalCases: (importedCases) =>
        set((state) => {
          const existingCaseNos = new Set(state.cases.map((c) => c.caseNo));
          const newUniqueCases = importedCases.filter((c) => !existingCaseNos.has(c.caseNo));
          return { cases: [...newUniqueCases, ...state.cases] };
        }),
    }),
    {
      name: 'niac-cases-storage',
    }
  )
);