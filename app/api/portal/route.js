import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: "Access code is required." }, { status: 400 });
    }

    // Hardcoded to your new business Google Sheet ID to bypass Vercel environment variable glitches
    const spreadsheetId = "1UBb3gdPOzrl0XHSU9DMJ_n3iVtzrShER";

    // 1. Fetch public Google Sheet data cleanly as a JSON stream using Google's visualization query endpoint
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;
    const res = await fetch(url, { next: { revalidate: 0 } }); // Force no-cache

    if (!res.ok) {
      throw new Error(`Google Sheets responded with status: ${res.status}`);
    }

    const text = await res.text();
    
    // 2. Parse Google's JSONP wrapper format safely
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}') + 1;
    if (startIdx === -1 || endIdx === -1) {
      throw new Error("Invalid response format from Google Sheets.");
    }
    
    const jsonString = text.slice(startIdx, endIdx);
    const rawData = JSON.parse(jsonString);

    // Extract columns and rows
    const columns = rawData.table.cols.map(col => col.label ? col.label.trim() : "");
    const rows = rawData.table.rows;

    // Helper to safely extract string value from Google Sheet cell object
    const getVal = (rowObj, colIndex) => {
      if (!rowObj || !rowObj.c || !rowObj.c[colIndex]) return "";
      const cell = rowObj.c[colIndex];
      return cell.f !== undefined ? cell.f : (cell.v !== undefined ? String(cell.v) : "");
    };

    // Find indices based on expected column headers
    const codeColIndex = columns.findIndex(col => col.toLowerCase() === "access code");
    const nameColIndex = columns.findIndex(col => col.toLowerCase() === "name");
    const missedColIndex = columns.findIndex(col => col.toLowerCase() === "sessions missed");
    const volSetsColIndex = columns.findIndex(col => col.toLowerCase() === "volume (sets)");
    const volRepsColIndex = columns.findIndex(col => col.toLowerCase() === "volume (reps)");
    const loadPBsColIndex = columns.findIndex(col => col.toLowerCase() === "load pbs");
    const fiveTenFiveColIndex = columns.findIndex(col => col.toLowerCase() === "5-10-5 time");
    const verticalColIndex = columns.findIndex(col => col.toLowerCase() === "vertical jump");
    const flyingTenColIndex = columns.findIndex(col => col.toLowerCase() === "flying 10");
    const flyingTwentyColIndex = columns.findIndex(col => col.toLowerCase() === "flying 20");
    const workoutUrlColIndex = columns.findIndex(col => col.toLowerCase() === "today's assigned workout");

    if (codeColIndex === -1) {
      return NextResponse.json({ error: "Spreadsheet structure invalid: 'Access Code' column missing." }, { status: 500 });
    }

    // 3. Look up the row matching the typed code (case-insensitive)
    const matchingRow = rows.find(row => {
      const rowCode = getVal(row, codeColIndex);
      return rowCode.trim().toUpperCase() === code.trim().toUpperCase();
    });

    if (!matchingRow) {
      return NextResponse.json({ error: "Access code not recognized." }, { status: 404 });
    }

    // 4. Build and return the clean athlete object
    const athleteData = {
      name: nameColIndex !== -1 ? getVal(matchingRow, nameColIndex) : "Athlete",
      sessionsMissed: missedColIndex !== -1 ? getVal(matchingRow, missedColIndex) : "0",
      volumeSets: volSetsColIndex !== -1 ? getVal(matchingRow, volSetsColIndex) : "0",
      volumeReps: volRepsColIndex !== -1 ? getVal(matchingRow, volRepsColIndex) : "0",
      loadPBs: loadPBsColIndex !== -1 ? getVal(matchingRow, loadPBsColIndex) : "0",
      fiveTenFive: fiveTenFiveColIndex !== -1 ? getVal(matchingRow, fiveTenFiveColIndex) : "-",
      verticalJump: verticalColIndex !== -1 ? getVal(matchingRow, verticalColIndex) : "-",
      flyingTen: flyingTenColIndex !== -1 ? getVal(matchingRow, flyingTenColIndex) : "-",
      flyingTwenty: flyingTwentyColIndex !== -1 ? getVal(matchingRow, flyingTwentyColIndex) : "-",
      workoutUrl: workoutUrlColIndex !== -1 ? getVal(matchingRow, workoutUrlColIndex) : "#"
    };

    return NextResponse.json(athleteData);
  } catch (error) {
    console.error("Backend API Error:", error);
    return NextResponse.json({ error: "Internal server error connecting to Google Sheets." }, { status: 500 });
  }
}
