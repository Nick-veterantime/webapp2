import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = cookies();
    let response = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            response = NextResponse.next();
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name, options) {
            response = NextResponse.next();
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching user data:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const jsonResponse = NextResponse.json(data);
    response.cookies.getAll().forEach(cookie => {
      jsonResponse.cookies.set(cookie);
    });

    return jsonResponse;
  } catch (error) {
    console.error('Error in GET /api/user-data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    let response = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            response = NextResponse.next();
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name, options) {
            response = NextResponse.next();
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();

    // First check if the user data exists
    const { data: existingData, error: checkError } = await supabase
      .from('user_data')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no data found
      console.error('Error checking existing data:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    let result;
    if (!existingData) {
      // Insert new record
      result = await supabase
        .from('user_data')
        .insert({
          user_id: session.user.id,
          ...body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
    } else {
      // Update existing record
      result = await supabase
        .from('user_data')
        .update({
          ...body,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id)
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error saving user data:', result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    const jsonResponse = NextResponse.json(result.data);
    response.cookies.getAll().forEach(cookie => {
      jsonResponse.cookies.set(cookie);
    });

    return jsonResponse;
  } catch (error) {
    console.error('Error in POST /api/user-data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 