'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCaseStore } from '@/lib/store';
import { FileText, Send, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function IntakePage() {
  const router = useRouter();
  const { addCase } = useCaseStore();

  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any | null>(null);

  const handleParse = () => {
    if (!rawText.trim()) return;
    setIsParsing(true);

    // Simulated intelligent parsing of incoming report/complaint
    setTimeout(() => {
      setParsedData({
        complainantName: 'Maria Santos (Barangay Health Worker)',
        locationBarangay: 'Palsong',
        category: 'Infrastructure & Public Safety',
        priorityLevel: 'High',
        targetOffice: 'Municipal Engineering Office (MEO)',
        summaryEnglish: 'Complainant reports damaged drainage canals causing stagnant water and health risks along the municipal road in Palsong.',
        referralLetter: `REPUBLIC OF THE PHILIPPINES\nMUNICIPALITY OF BULA\nOFFICE OF THE MUNICIPAL MAYOR\n\nMEMORANDUM\n\nTO: Municipal Engineering Office (MEO)\nFROM: Office of the Municipal Mayor\nDATE: ${new Date().toLocaleDateString()}\nSUBJECT: Action Referral - Infrastructure Concern in Brgy. Palsong\n\n1. Forwarded herewith is a verified community concern regarding damaged drainage canals in Barangay Palsong.\n\n2. In line with our 72-hour SLA policy under the NIAC Action Center, please conduct an immediate ocular inspection and institute necessary remedial actions.\n\n3. Submit feedback report to this office promptly.\n\nFOR THE MAYOR:\nMAYOR NONOY IBASCO`,
      });
      setIsParsing(false);
    }, 800);
  };

  const handleConfirmAndLog = () => {
    if (!parsedData) return;

    addCase({
      complainantName: parsedData.complainantName,
      locationBarangay: parsedData.locationBarangay,
      category: parsedData.category,
      priorityLevel: parsedData.priorityLevel,
      targetOffice: parsedData.targetOffice,
      summaryEnglish: parsedData.summaryEnglish,
      referralLetter: parsedData.referralLetter,
      referredAt: new Date().toISOString().slice(0, 10),
    });

    // Automatically navigate to the dashboard after logging
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-blue-900 text-white p-6 rounded-xl shadow-lg">
          <div>
            <h1 className="text-2xl font-bold">Hi, Brent! </h1>
            <p className="text-blue-200 text-sm">Needs, Inquiries, and Assistance Center of LGU Bula — Office of the Municipal Mayor </p>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition border border-blue-700 shadow"
          >
            View Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-xl shadow border p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Paste Raw Report / Complaint
          </h2>
          <textarea
            rows={5}
            className="w-full p-4 border rounded-xl bg-gray-50 text-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Paste raw text report from SMS, Messenger, or blotter record here..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          <button
            onClick={handleParse}
            disabled={isParsing || !rawText.trim()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition shadow"
          >
            <Send className="w-4 h-4" /> {isParsing ? 'Parsing Report...' : 'Parse & Generate Memo'}
          </button>
        </div>

        {/* Parsed Preview Card */}
        {parsedData && (
          <div className="bg-white rounded-xl shadow border p-6 space-y-6 animate-in fade-in duration-200">
            <h2 className="text-lg font-bold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Parsed Case Preview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-sm border">
              <div><strong className="text-gray-600">Complainant:</strong> <span className="text-gray-900 font-semibold">{parsedData.complainantName}</span></div>
              <div><strong className="text-gray-600">Barangay:</strong> <span className="text-gray-900 font-semibold">{parsedData.locationBarangay}</span></div>
              <div><strong className="text-gray-600">Category:</strong> <span className="text-gray-900 font-semibold">{parsedData.category}</span></div>
              <div><strong className="text-gray-600">Priority Level:</strong> <span className="text-amber-700 font-bold">{parsedData.priorityLevel}</span></div>
              <div><strong className="text-gray-600">Assigned Office:</strong> <span className="text-blue-700 font-bold">{parsedData.targetOffice}</span></div>
            </div>

            <div className="space-y-1">
              <strong className="text-sm text-gray-700">Summary:</strong>
              <p className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-gray-800">
                {parsedData.summaryEnglish}
              </p>
            </div>

            <div className="space-y-1">
              <strong className="text-sm text-gray-700">Generated Memorandum Preview:</strong>
              <textarea 
                readOnly 
                className="w-full h-40 p-3 text-xs font-mono border rounded-lg bg-gray-50 text-gray-800 leading-relaxed" 
                value={parsedData.referralLetter} 
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleConfirmAndLog}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition"
              >
                <CheckCircle2 className="w-5 h-5" /> Confirm and Log to Action Center
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}