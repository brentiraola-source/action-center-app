// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useCaseStore } from '@/lib/store'

export default function DashboardPage() {
  const { cases, loading, fetchCases, updateCaseStatus } = useCaseStore()
  const [filterStatus, setFilterStatus] = useState<string>('All')

  // Fetch cases from Supabase when the component mounts
  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  // Filter cases based on selected status tab
  const filteredCases = filterStatus === 'All' 
    ? cases 
    : cases.filter((c) => (c.status || '').toLowerCase() === filterStatus.toLowerCase())

  // Helper for badge color coding based on status
  const getStatusBadgeClass = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'resolved':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in progress':
      case 'ongoing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'urgent':
      case 'high priority':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200' // Pending / Default
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              NIAC Executive Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Real-time case monitoring and SLA tracking for LGU Bula.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchCases()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition"
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>

        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Cases</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{cases.length}</p>
          </div>
          <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending / Active</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">
              {cases.filter(c => (c.status || '').toLowerCase() !== 'resolved' && (c.status || '').toLowerCase() !== 'completed').length}
            </p>
          </div>
          <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Resolved</p>
            <p className="text-3xl font-extrabold text-green-600 mt-1">
              {cases.filter(c => (c.status || '').toLowerCase() === 'resolved' || (c.status || '').toLowerCase() === 'completed').length}
            </p>
          </div>
          <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cloud Sync</p>
            <p className="text-sm font-semibold text-emerald-600 mt-2 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Supabase Connected
            </p>
          </div>
        </div>

        {/* Filter Tabs & Content Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Table Toolbar */}
          <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {['All', 'Pending', 'In Progress', 'Resolved'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Showing {filteredCases.length} of {cases.length} entries
            </p>
          </div>

          {/* Table Data or Loading State */}
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <p className="animate-pulse">Loading real-time cases from Supabase...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p>No cases found.</p>
              <p className="text-xs mt-1">Submit a new case or adjust your filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                    <th className="py-3 px-4 font-semibold">Tracking #</th>
                    <th className="py-3 px-4 font-semibold">Title / Description</th>
                    <th className="py-3 px-4 font-semibold">Client</th>
                    <th className="py-3 px-4 font-semibold">Priority</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {filteredCases.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-4 font-mono text-xs text-gray-600">
                        {item.tracking_number || item.caseNo || item.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 truncate max-w-xs">{item.description}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {item.client_name || item.complainantName || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium text-gray-700 capitalize">
                          {item.priority || item.priorityLevel || 'Medium'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(item.status)}`}>
                          {item.status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {(item.status || '').toLowerCase() !== 'resolved' && (
                          <button
                            onClick={() => updateCaseStatus(item.id, 'Resolved')}
                            className="text-xs font-medium text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2.5 py-1 rounded transition"
                          >
                            Mark Resolved
                          </button>
                        )}
                        {(item.status || '').toLowerCase() !== 'in progress' && (item.status || '').toLowerCase() !== 'resolved' && (
                          <button
                            onClick={() => updateCaseStatus(item.id, 'In Progress')}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition"
                          >
                            Set In Progress
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>
    </main>
  )
}
