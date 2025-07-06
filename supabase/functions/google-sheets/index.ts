import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SheetsTransaction {
  date: string;
  description: string;
  amount: string;
  category: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Get OAuth URL
    if (path === '/auth/google' && method === 'GET') {
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-sheets/auth/callback`
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/spreadsheets')}&` +
        `access_type=offline&` +
        `prompt=consent`

      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // OAuth callback
    if (path === '/auth/callback' && method === 'GET') {
      const code = url.searchParams.get('code')
      if (!code) {
        return new Response(
          JSON.stringify({ error: 'Authorization code required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-sheets/auth/callback`
        })
      })

      const tokens = await tokenResponse.json()

      // Store tokens in database
      await supabaseClient
        .from('users')
        .update({
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token
        })
        .eq('id', 1)

      // Redirect to frontend
      const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5000'
      return Response.redirect(`${frontendUrl}/dashboard?connected=true`)
    }

    // Connect to spreadsheet
    if (path === '/connect' && method === 'POST') {
      const { spreadsheetId } = await req.json()
      
      // Get user's access token
      const { data: user, error: userError } = await supabaseClient
        .from('users')
        .select('google_access_token')
        .eq('id', 1)
        .single()

      if (userError || !user?.google_access_token) {
        return new Response(
          JSON.stringify({ error: 'Google account not connected' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify spreadsheet access
      const verifyResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
        {
          headers: {
            'Authorization': `Bearer ${user.google_access_token}`,
          }
        }
      )

      if (!verifyResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'Cannot access spreadsheet. Check ID and permissions.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Store spreadsheet ID
      await supabaseClient
        .from('users')
        .update({ google_sheets_id: spreadsheetId })
        .eq('id', 1)

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sync transactions to Google Sheets
    if (path === '/sync' && method === 'POST') {
      // Get user data
      const { data: user, error: userError } = await supabaseClient
        .from('users')
        .select('google_access_token, google_sheets_id')
        .eq('id', 1)
        .single()

      if (userError || !user?.google_access_token || !user?.google_sheets_id) {
        return new Response(
          JSON.stringify({ error: 'Google Sheets not properly configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get transactions and categories
      const { data: transactions, error: transactionsError } = await supabaseClient
        .from('transactions')
        .select(`
          *,
          categories (name)
        `)
        .eq('user_id', 1)
        .order('date', { ascending: false })

      if (transactionsError) throw transactionsError

      // Prepare data for Google Sheets
      const sheetsData: SheetsTransaction[] = transactions.map(transaction => ({
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount.toString(),
        category: transaction.categories?.name || 'Unknown'
      }))

      // Add header row
      const values = [
        ['Date', 'Description', 'Amount', 'Category'],
        ...sheetsData.map(t => [t.date, t.description, t.amount, t.category])
      ]

      // Sync to Google Sheets
      const sheetsResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${user.google_sheets_id}/values/Transactions!A1:D${values.length}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${user.google_access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values })
        }
      )

      if (!sheetsResponse.ok) {
        const error = await sheetsResponse.text()
        return new Response(
          JSON.stringify({ error: `Failed to sync to Google Sheets: ${error}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          syncedCount: sheetsData.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Google Sheets Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})