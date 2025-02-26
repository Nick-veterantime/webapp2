import Airtable from 'airtable';
import { NextResponse } from 'next/server';

// Cache tasks for 5 minutes
let cachedTasks: any[] | null = null;
let lastFetchTime: number | null = null;
let fetchInProgress: boolean = false;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET() {
  try {
    // Return cached tasks if available and not expired
    const now = Date.now();
    if (cachedTasks && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
      return NextResponse.json(cachedTasks);
    }

    // Prevent multiple concurrent fetches to Airtable
    if (fetchInProgress) {
      // If a fetch is already in progress but we have cached data, return that
      if (cachedTasks) {
        return NextResponse.json(cachedTasks);
      }
      // Otherwise return an empty array with a 202 status
      return NextResponse.json([], { status: 202 });
    }

    fetchInProgress = true;

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_AIRTABLE_API_KEY || !process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID) {
      console.error('Environment variables check:', {
        hasApiKey: !!process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
        hasBaseId: !!process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID
      });
      fetchInProgress = false;
      throw new Error('Missing required environment variables');
    }

    const base = new Airtable({
      apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
      endpointUrl: 'https://api.airtable.com',
    }).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID);

    try {
      const records = await base('tblMEem2wJxdup7L9').select({
        maxRecords: 250,
        view: 'Grid view'
      }).all();

      const tasks = records.map(record => {
        const fields = record.fields;
        
        // Helper function to normalize branch names
        const normalizeBranchName = (branch: string): string => {
          if (!branch) return 'All';
          const branchStr = String(branch).trim();
          
          // Handle common variations (standardize to official names)
          const branchLower = branchStr.toLowerCase();
          if (branchLower === 'marines' || branchLower === 'marine' || branchLower === 'usmc') {
            return 'Marine Corps';
          }
          if (branchLower === 'air' || branchLower === 'usaf') {
            return 'Air Force';
          }
          if (branchLower === 'space' || branchLower === 'ussf') {
            return 'Space Force';
          }
          if (branchLower === 'usa') {
            return 'Army';
          }
          if (branchLower === 'usn') {
            return 'Navy';
          }
          if (branchLower === 'uscg') {
            return 'Coast Guard';
          }
          if (branchLower === 'all') {
            return 'All';
          }
          
          // For capitalization consistency, capitalize the first letter of each word
          return branchStr.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        };
        
        // Convert track to trackIds array
        const trackIds = Array.isArray(fields['Track']) 
          ? fields['Track'] 
          : fields['Track'] ? [fields['Track']] : ['Misc'];
        
        // Convert month to whenMonthsLeft array of numbers
        const whenMonthsLeft = Array.isArray(fields['Month']) 
          ? fields['Month'].map((m: any) => typeof m === 'number' ? m : parseInt(String(m), 10)) 
          : fields['Month'] ? [typeof fields['Month'] === 'number' ? fields['Month'] : parseInt(String(fields['Month']), 10)] : [6];
        
        // Convert branch to branchIds array with normalized names
        const originalBranches = Array.isArray(fields['Branch']) 
          ? fields['Branch'].map((b: any) => typeof b === 'string' ? b.trim() : String(b)) 
          : fields['Branch'] ? [typeof fields['Branch'] === 'string' ? fields['Branch'].trim() : String(fields['Branch'])] : ['All'];
        
        // Normalize branch names
        const branchIds = originalBranches.map(branch => normalizeBranchName(branch));
        
        return {
          id: record.id,
          title: fields['Task'] || 'Untitled Task',
          priority: fields['Priority'] || 'medium',
          completed: fields['Completed'] === true,
          linkedText: fields['Linked Text'] || '',
          link: fields['Link'] || '',
          description: fields['Description'] || '',
          trackIds,
          whenMonthsLeft,
          branchIds,
          location: fields['Location'] || null,
          locationType: fields['Location Type'] || null
        };
      });

      // Update cache
      cachedTasks = tasks;
      lastFetchTime = now;
      fetchInProgress = false;

      return NextResponse.json(tasks);
    } catch (airtableError: any) {
      console.error('Airtable fetch error:', airtableError);
      fetchInProgress = false;
      
      // If we have cached tasks, return them despite the error
      if (cachedTasks) {
        return NextResponse.json(cachedTasks, {
          status: 206, // Partial content - indicating stale data
          headers: {
            'X-Cache-Status': 'stale-on-error'
          }
        });
      }
      
      throw airtableError; // Re-throw to be caught by the outer catch
    }
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    fetchInProgress = false;
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
} 