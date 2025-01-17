import Airtable from 'airtable';
import { NextResponse } from 'next/server';

// Enable Airtable debug mode
Airtable.configure({ apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY });

export async function GET() {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_AIRTABLE_API_KEY || !process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID) {
      console.error('Environment variables check:', {
        hasApiKey: !!process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
        hasBaseId: !!process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID
      });
      throw new Error('Missing required environment variables');
    }

    console.log('Initializing Airtable with:', {
      baseId: process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID
    });

    const base = new Airtable({ apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY })
      .base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID);

    console.log('Fetching records from Airtable...');
    
    // Use 'tblMEem2wJxdup7L9' as the table ID
    const records = await base('tblMEem2wJxdup7L9').select({
      maxRecords: 100,
      view: 'Grid view'
    }).all();

    console.log(`Successfully fetched ${records.length} records`);

    const tasks = records.map(record => {
      const fields = record.fields;
      return {
        id: record.id,
        task: fields['Task'],
        month: fields['Month'],
        track: fields['Track'],
        branch: fields['Branch'],
        linkedText: fields['Linked Text'],
        link: fields['Link'],
        description: fields['Description']
      };
    });

    console.log(`Processed ${tasks.length} tasks`);
    return NextResponse.json(tasks);

  } catch (error: any) {
    console.error('Detailed error in /api/tasks:', {
      message: error.message,
      stack: error.stack,
      error
    });

    return NextResponse.json(
      { 
        error: 'Failed to fetch tasks', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 