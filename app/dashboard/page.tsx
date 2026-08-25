'use client';

import { useState } from 'react';
import { ArrowLeft, BarChart3, Clock, CheckCircle2, AlertTriangle, FileText, Eye, X, Copy, Check, Printer, Upload, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { useCaseStore, CaseItem } from '@/lib/store';

export default function DashboardPage() {
  const { cases, updateStatus, updateReferralDate, updateMemo, importExternalCases } = useCaseStore();
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [sortBy, setSortBy] = useState<'caseNoDesc' | 'caseNoAsc' | 'dateDesc' | 'dateAsc' | 'office' | 'barangay'>('caseNoDesc');

  const isSlaBreached = (referredAt: string, status: string) => {
    if (status === 'Resolved') return false;
    if (!referredAt) return false;

    const referralDate = new Date(referredAt);
    const now = new Date();

    let workingHours = 0;
    let current = new Date(referralDate);

    while (current < now) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        workingHours += 24;
      }
      current.setDate(current.getDate() + 1);
    }

    return workingHours > 72;
  };

  const totalCases = cases.length;
  const resolvedCases = cases.filter((c) => c.status === 'Resolved').length;
  const breachedCases = cases.filter((c) => c.status === 'Breached' || (c.status === 'Pending' && isSlaBreached(c.referredAt, c.status))).length;
  const pendingCases = totalCases - resolvedCases - breachedCases >= 0 ? totalCases - resolvedCases - breachedCases : 0;
  
  const complianceRate = totalCases > 0 
    ? (((totalCases - breachedCases) / totalCases) * 100).toFixed(1) + '%' 
    : '100%';

  const formatDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Sorting Logic
  const sortedCases = [...cases].sort((a, b) => {
    if (sortBy === 'caseNoDesc') {
      const numA = parseInt(a.caseNo.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.caseNo.replace(/\D/g, '')) || 0;
      return numB - numA;
    }
    if (sortBy === 'caseNoAsc') {
      const numA = parseInt(a.caseNo.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.caseNo.replace(/\D/g, '')) || 0;
      return numA - numB;
    }
    if (sortBy === 'dateDesc') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'dateAsc') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'office') {
      return a.targetOffice.localeCompare(b.targetOffice);
    }
    if (sortBy === 'barangay') {
      return a.locationBarangay.localeCompare(b.locationBarangay);
    }
    return 0;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const parsedCases: CaseItem[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const row = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.replace(/^"|"$/g, '').trim());
        
        if (row.length >= 4) {
          parsedCases.push({
            id: Math.random().toString(36).substring(2, 9),
            caseNo: row[0] || `Case #${String(i).padStart(4, '0')}`,
            complainantName: row[1] || 'Unknown Complainant',
            locationBarangay: row[2] || 'Bula',
            category: 'General Concern',
            priorityLevel: 'Medium',
            targetOffice: row[3] || 'LGU General Office',
            summaryEnglish: 'Imported manually from Google Sheets registry.',
            referralLetter: 'Official referral memo generated via historical Google Sheet import.',
            status: (row[4] === 'Resolved' ? 'Resolved' : row[4] === 'Breached' ? 'Breached' : 'Pending') as any,
            createdAt: new Date().toISOString(),
            referredAt: row[5] || new Date().toISOString().slice(0, 10),
          });
        }
      }

      if (parsedCases.length > 0) {
        importExternalCases(parsedCases);
        alert(`Successfully imported ${parsedCases.length} cases from your Google Sheet!`);
      } else {
        alert('Could not parse cases. Ensure your CSV has columns: CaseNo, Complainant, Barangay, TargetOffice, Status, DateReferred.');
      }
    };
    reader.readAsText(file);
  };

  const copyMemoToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  const handlePrintMemo = (caseItem: CaseItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${caseItem.caseNo} - Official Memorandum</title>
          <style>
            body { font-family: monospace; padding: 40px; font-size: 14px; line-height: 1.6; color: #111; }
            .header { text-align: center; margin-bottom: 30px; font-weight: bold; }
            pre { white-space: pre-wrap; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="header">
            REPUBLIC OF THE PHILIPPINES<br/>
            MUNICIPALITY OF BULA<br/>
            OFFICE OF THE MUNICIPAL MAYOR
          </div>
          <hr style="border: 1px solid #333; margin-bottom: 20px;" />
          <pre>${caseItem.referralLetter}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans relative">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Navigation & Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-blue-900 text-white p-6 rounded-xl shadow-lg gap-4">
          <div>
            <h1 className="text-2xl font-bold">NIAC Executive Dashboard</h1>
            <p className="text-blue-200 text-sm">Real-time Performance & 72-Hour SLA Monitoring (Mayor Nonoy Ibasco Administration)</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition shadow">
              <Upload className="w-4 h-4" /> Import Google Sheet (.csv)
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>

            <Link 
              href="/"
              className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition border border-blue-700 shadow"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Intake
            </Link>
          </div>
        </div>

        {/* KPI Scorecards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-xl shadow border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Verified</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">{totalCases}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><BarChart3 className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Resolved</p>
              <h3 className="text-3xl font-bold text-emerald-600 mt-1">{resolvedCases}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Pending</p>
              <h3 className="text-3xl font-bold text-amber-600 mt-1">{pendingCases}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Clock className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">SLA Breached</p>
              <h3 className="text-3xl font-bold text-rose-600 mt-1">{breachedCases}</h3>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg"><AlertTriangle className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">SLA Compliance</p>
              <h3 className="text-2xl font-bold text-blue-700 mt-1">{complianceRate}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><CheckCircle2 className="w-6 h-6" /></div>
          </div>
        </div>

        {/* Live Confirmed Cases Table */}
        <div className="bg-white rounded-xl shadow border p-6 space-y-4">
          
          {/* Table Header & Sorting Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Confirmed Action Center Registry
            </h2>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-gray-50 border px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700">
                <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-bold text-blue-800 outline-none cursor-pointer"
                >
                  <option value="caseNoDesc">Case Number (Highest # first)</option>
                  <option value="caseNoAsc">Case Number (Lowest # first)</option>
                  <option value="dateDesc">Date Received (Newest)</option>
                  <option value="dateAsc">Date Received (Oldest)</option>
                  <option value="office">Target Office (A–Z)</option>
                  <option value="barangay">Barangay (A–Z)</option>
                </select>
              </div>

              <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-semibold ml-auto md:ml-0">
                {cases.length} Total Records
              </span>
            </div>
          </div>

          {cases.length === 0 ? (
            <div className="text-center py-12 text-gray-400 space-y-3">
              <p>No confirmed cases logged yet.</p>
              <p className="text-sm">Import your Google Sheet CSV above or paste a report on the intake page to begin.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 border-b text-xs uppercase tracking-wider">
                    <th className="p-3">Case No</th>
                    <th className="p-3">Complainant</th>
                    <th className="p-3">Barangay</th>
                    <th className="p-3">Target Office</th>
                    <th className="p-3">Date Received</th>
                    <th className="p-3">Date Referred</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCases.map((c) => {
                    const breached = isSlaBreached(c.referredAt, c.status);
                    return (
                      <tr 
                        key={c.id} 
                        className={`border-b transition ${breached ? 'bg-rose-50/60 hover:bg-rose-100/50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="p-3 font-mono font-bold text-blue-600">{c.caseNo}</td>
                        <td className="p-3">{c.complainantName}</td>
                        <td className="p-3">{c.locationBarangay}</td>
                        <td className="p-3 font-medium text-gray-700">{c.targetOffice}</td>
                        <td className="p-3 text-gray-600">{formatDate(c.createdAt)}</td>
                        <td className="p-3">
                          <input 
                            type="date"
                            value={c.referredAt || ''}
                            onChange={(e) => updateReferralDate(c.id, e.target.value)}
                            className="p-1 border rounded bg-white text-xs font-medium text-gray-800"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={breached ? 'Breached' : c.status}
                            onChange={(e) => updateStatus(c.id, e.target.value as any)}
                            className={`text-xs font-bold p-1.5 rounded border cursor-pointer ${
                              c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                              breached ? 'bg-rose-100 text-rose-800 border-rose-400 font-extrabold' :
                              'bg-amber-50 text-amber-700 border-amber-300'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Breached">Breached (Over 72h)</option>
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedCase(c)}
                            className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded text-xs font-bold transition shadow-sm"
                            title="View / Edit Memo"
                          >
                            <Eye className="w-3.5 h-3.5" /> View / Edit Memo
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* DETAIL & EDITABLE MEMO MODAL */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="bg-blue-900 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-xs bg-blue-800 text-blue-200 px-2.5 py-1 rounded-full font-mono font-bold">
                  {selectedCase.caseNo}
                </span>
                <h3 className="text-xl font-bold mt-1">Case Details & Official Memorandum</h3>
              </div>
              <button 
                onClick={() => setSelectedCase(null)}
                className="p-2 hover:bg-blue-800 rounded-full text-blue-200 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border text-sm">
                <div><strong className="text-gray-600">Complainant:</strong> <span className="text-gray-900 font-semibold">{selectedCase.complainantName}</span></div>
                <div><strong className="text-gray-600">Barangay:</strong> <span className="text-gray-900 font-semibold">{selectedCase.locationBarangay}</span></div>
                <div><strong className="text-gray-600">Category:</strong> <span className="text-gray-900 font-semibold">{selectedCase.category}</span></div>
                <div><strong className="text-gray-600">Priority Level:</strong> <span className="text-amber-700 font-bold">{selectedCase.priorityLevel}</span></div>
                <div><strong className="text-gray-600">Assigned Office:</strong> <span className="text-blue-700 font-bold">{selectedCase.targetOffice}</span></div>
                <div><strong className="text-gray-600">Date Referred:</strong> <span className="text-gray-900">{formatDate(selectedCase.referredAt)}</span></div>
              </div>

              <div className="space-y-1">
                <strong className="text-sm text-gray-700">Executive Summary:</strong>
                <p className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-gray-800">
                  {selectedCase.summaryEnglish}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <strong className="text-sm text-gray-700">Official Action Referral Memorandum (Editable):</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => copyMemoToClipboard(selectedCase.referralLetter)}
                      className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded font-semibold transition shadow-sm"
                    >
                      {copiedMemo ? <><Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Memo</>}
                    </button>
                    <button 
                      onClick={() => handlePrintMemo(selectedCase)}
                      className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-semibold transition shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print / PDF
                    </button>
                  </div>
                </div>
                <textarea 
                  className="w-full h-56 p-3 text-xs font-mono border rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 whitespace-pre-wrap leading-relaxed shadow-inner"
                  value={selectedCase.referralLetter}
                  onChange={(e) => updateMemo(selectedCase.id, e.target.value)}
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
              <button
                onClick={() => setSelectedCase(null)}
                className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-bold transition shadow"
              >
                Close & Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}