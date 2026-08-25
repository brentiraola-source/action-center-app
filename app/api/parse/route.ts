import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/" 
});

export async function POST(req: Request) {
  try {
    const { rawMessage } = await req.json();

    // Generate a simple unique case number based on timestamp (e.g., NIAC-2026-0825-1)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(100 + Math.random() * 900);
    const caseNumber = `NIAC-${dateStr}-${randomNum}`;
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const prompt = `
    You are an AI assistant for the Needs, Inquiries, & Assistance Center (NIAC) of LGU Bula. 
    Parse the following raw citizen report into structured JSON data.

    Raw Message: "${rawMessage}"

    STRICT INSTRUCTION FOR "targetOffice": You MUST choose the assigned office strictly from this official LGU Bula directory. Do not invent non-existent offices.
    - Business Permits and Licensing Office (BPLO) -> For business permits, business licences, business renewals and processes.
    - Municipal Engineering Office (MEO) -> For roads, bridges, public buildings, infrastructure, streetlights, drainage.
    - Bula Waterworks System -> For water supply, water pipe leaks, water distribution.
    - Municipal Health Office (MHO) -> For health concerns, sanitation, medical assistance, disease reports.
    - General Service Affairs Office (GSAO) -> For public safety, traffic, peace and order.
    - Municipal Social Welfare and Development Office (MSWDO) -> For financial aid, indigent assistance, family welfare, burial/medical aid.
    - Municipal Agriculture Office (MAO) -> For crop damage, livestock, fishery, agricultural support.
    - Office of the Municipal Treasurer / Assessor -> For local taxes, business permits, real property concerns.
    - Environment and Natural Resources Office (MENRO) -> For garbage collection, tree cutting, environmental nuisances.
    - Office of the Punong Barangay / Barangay Council -> For localized neighborhood disputes, barangay clearances, local purok issues.
    - National Agencies (e.g., DPWH, PNP Bula, Camarines Sur II Electric Cooperative - CASURECO II) -> For national roads, major crime enforcement, or power outages.

    Return JSON with exact keys:
    {
      "caseNo": "${caseNumber}",
      "complainantName": "Name or Anonymous",
      "locationBarangay": "Barangay name or Unspecified",
      "category": "Public Utility | Infrastructure | Public Health | Transport | Peace and Order | Others",
      "priorityLevel": "Critical | High | Normal",
      "targetOffice": "Primary office responsible (e.g., Municipal Engineering Office, Bula Waterworks, MHO, BPSO)",
      "summaryEnglish": "Concise 2-3 sentence executive summary in English",
      "cannedResponse": "Polite client acknowledgment in local Bikol/Tagalog mentioning NIAC and Mayor Nonoy's Serbisyong may Puso",
      "referralLetter": "ACTION REFERRAL\n\nTO:\t\t[Insert Target Office Head Name]\nOFFICE:\t\t[Insert Target Office/Department Name]\nFROM:\t\tNEEDS, INQUIRIES & ASSISTANCE CENTER\nDATE:\t\t${currentDate}\nSUBJECT:\tREFERRAL OF CITIZEN CONCERN/FEEDBACK CASE ${caseNumber}\n\n\nThe Needs, Inquiries, & Assistance Center has received and documented a formal concern from a constituent via our official communication channel. We are officially endorsing this matter to your office for immediate attention.\n\nCONCERN DETAILS:\n\n- Complainant: [Complainant Name]\n- Case No: ${caseNumber}\n- Date Received: ${currentDate}\n- Concern: [Concise summary of the problem and exact location]\n\nREQUESTED ACTION: In accordance with our 72-Hour Resolution Policy, we respectfully request that your office:\n1. Investigate/Verify the reported concern.\n2. Implement necessary corrective measures or provide the required service.\n3. Submit a brief status update or confirmation of resolution to NIAC so we may inform the constituent.\n\nYour prompt cooperation is vital in maintaining the public’s trust and ensuring the excellence of our municipal services.\nFor your appropriate and immediate action.\n\nRespectfully,\n\nBRIEN ARISTOTLE S. IRAOLA\nCommunity Affairs Officer, Mayor’s Office\n\n\n\t\t\t\t\t\t\t\t\tNoted by:\n\t\t\t\t\t\t\t\t\tMANUEL A. IBASCO JR.\n\t\t\t\t\t\t\t\t\tMunicipal Mayor"
    }
    `;

    const completion = await openai.chat.completions.create({
      model: "gemini-3.6-flash", 
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const parsedData = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("🔴 GEMINI API ERROR:", error.message || error);
    return NextResponse.json({ error: error.message || 'Failed to parse message' }, { status: 500 });
  }
}