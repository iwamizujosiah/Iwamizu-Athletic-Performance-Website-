import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }

  // Your secure live Google Sheet link
  const sheetCsvUrl = "https://docs.google.com/spreadsheets/d/1UBb3gdPOzrl0XHSU9DMJ_n3iVtzrShER/export?format=csv&gid=0";

  try {
    const response = await fetch(sheetCsvUrl, { 
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch spreadsheet data');
    }

    const csvText = await response.text();
    
    // Parse the CSV rows cleanly
    const rows = csvText.split('\n').map(row => {
      return row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.replace(/^"|"$/g, '').trim());
    });

    // Find the row where the first column (Code) matches the athlete's input
    const athleteRow = rows.find(r => r[0]?.toUpperCase() === code);

    if (!athleteRow) {
      return NextResponse.json({ error: 'Access code not recognized.' }, { status: 404 });
    }

    // Map columns securely to match your layout
    const athleteData = {
      code: athleteRow[0],
      name: athleteRow[1],
      sessionsMissed: athleteRow[2] || "0",
      volumeSets: athleteRow[3] || "0",
      volumeReps: athleteRow[4] || "0",
      loadPBs: athleteRow[5] || "0",
      fiveTenFive: athleteRow[6] || "--",
      verticalJump: athleteRow[7] || "--",
      flyingTen: athleteRow[8] || "--",
      flyingTwenty: athleteRow[9] || "--",
      workoutUrl: athleteRow[10] || "#"
    };

    return NextResponse.json(athleteData);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Secure connection to roster failed. Try again.' }, { status: 500 });
  }
}
