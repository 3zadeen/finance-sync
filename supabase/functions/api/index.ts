import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname.replace('/api', '')
    const method = req.method

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Route handling
    if (path === '/stats' && method === 'GET') {
      const { data: totalTransactions } = await supabaseClient
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', 1)

      const { data: autoCategorized } = await supabaseClient
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', 1)
        .eq('needs_review', false)

      const { data: pendingReview } = await supabaseClient
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', 1)
        .eq('needs_review', true)

      const total = totalTransactions?.length || 0
      const auto = autoCategorized?.length || 0
      const pending = pendingReview?.length || 0

      return new Response(
        JSON.stringify({
          totalTransactions: total,
          autoCategorizedPercentage: total > 0 ? (auto / total) * 100 : 0,
          pendingReview: pending,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (path === '/transactions' && method === 'GET') {
      const { data, error } = await supabaseClient
        .from('transactions')
        .select('*')
        .eq('user_id', 1)
        .order('date', { ascending: false })
        .limit(50)

      if (error) throw error

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (path === '/categories' && method === 'GET') {
      const { data, error } = await supabaseClient
        .from('categories')
        .select('*')
        .eq('user_id', 1)

      if (error) throw error

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (path === '/category-breakdown' && method === 'GET') {
      const { data, error } = await supabaseClient
        .from('categories')
        .select(`
          name,
          color,
          transactions!inner(amount)
        `)
        .eq('user_id', 1)

      if (error) throw error

      const breakdown = data.map(category => ({
        categoryName: category.name,
        categoryColor: category.color,
        total: category.transactions.reduce((sum: number, t: any) => sum + t.amount, 0).toString()
      })).filter(item => parseFloat(item.total) > 0)

      return new Response(
        JSON.stringify(breakdown),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (path === '/google-sheets-status' && method === 'GET') {
      const { data, error } = await supabaseClient
        .from('users')
        .select('google_access_token, google_sheets_id')
        .eq('id', 1)
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({
          connected: !!data?.google_access_token,
          spreadsheetId: data?.google_sheets_id || null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle file upload for PDF processing
    if (path === '/upload' && method === 'POST') {
      const formData = await req.formData()
      const file = formData.get('file') as File

      if (!file) {
        return new Response(
          JSON.stringify({ error: 'No file uploaded' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create bank statement record
      const { data: statement, error: statementError } = await supabaseClient
        .from('bank_statements')
        .insert({
          user_id: 1,
          filename: file.name,
          status: 'processing'
        })
        .select()
        .single()

      if (statementError) throw statementError

      // Here you would integrate with your PDF processing logic
      // For now, return a success response
      return new Response(
        JSON.stringify({ 
          message: 'File uploaded successfully',
          statementId: statement.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Default 404
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})