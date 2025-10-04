import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null

function getSupabaseClient() {
  if (supabase) return supabase
  
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not found')
    return null
  }
  
  try {
    supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Supabase client initialized')
    return supabase
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    return null
  }
}

export interface CheckRecord {
  id: string
  user_id: string
  type: 'phone' | 'email' | 'email_breach' | 'password'
  query: string
  total_leaks: number
  found_sources: number
  results: any[]
  message: string
  created_at: string
}

export async function saveCheckToDatabase(data: {
  userId: string
  type: 'phone' | 'email' | 'email_breach' | 'password'
  query: string
  results: any[]
  totalLeaks: number
  foundSources: number
  message: string
}): Promise<CheckRecord> {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Supabase client not initialized')
  }

  const { data: savedCheck, error } = await client
    .from('user_checks')
    .insert({
      user_id: data.userId,
      type: data.type,
      query: data.query,
      total_leaks: data.totalLeaks,
      found_sources: data.foundSources,
      results: data.results,
      message: data.message
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving check to database:', error)
    throw new Error('Failed to save check result')
  }

  return savedCheck
}

export async function getUserChecks(userId: string, limit = 50): Promise<CheckRecord[]> {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Supabase client not initialized')
  }

  const { data: checks, error } = await client
    .from('user_checks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching user checks:', error)
    throw new Error('Failed to fetch check history')
  }

  return checks || []
}

export async function getCheckStats(userId: string) {
  const client = getSupabaseClient()
  if (!client) {
    return null
  }

  const { data: stats, error } = await client
    .from('user_checks')
    .select('type, total_leaks, found_sources, created_at')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching check stats:', error)
    return null
  }

  const totalChecks = stats.length
  const totalLeaks = stats.reduce((sum, check) => sum + check.total_leaks, 0)
  const phoneChecks = stats.filter(check => check.type === 'phone').length
  const emailChecks = stats.filter(check => check.type === 'email').length
  
  return {
    totalChecks,
    totalLeaks,
    phoneChecks,
    emailChecks,
    lastCheck: stats[0]?.created_at
  }
}