import Airtable from 'airtable';
import { NextResponse } from 'next/server';

// Cache tasks for 5 minutes
let cachedTasks: any[] | null = null;
let lastFetchTime: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET() {
  try {
    // Return cached tasks if available and not expired
    const now = Date.now();
    if (cachedTasks && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
      return NextResponse.json(cachedTasks);
    }

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_AIRTABLE_API_KEY || !process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID) {
      console.error('Environment variables check:', {
        hasApiKey: !!process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
        hasBaseId: !!process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID
      });
      throw new Error('Missing required environment variables');
    }

    const base = new Airtable({
      apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
      endpointUrl: 'https://api.airtable.com',
    }).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID);

    const records = await base('tblMEem2wJxdup7L9').select({
      maxRecords: 100,
      view: 'Grid view'
    }).all();

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

    // Update cache
    cachedTasks = tasks;
    lastFetchTime = now;

    return NextResponse.json(tasks);

  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    
    // Return cached tasks if available, even if expired
    if (cachedTasks) {
      console.log('Returning stale cached tasks due to error');
      return NextResponse.json(cachedTasks);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
} 