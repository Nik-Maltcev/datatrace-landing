import { NextRequest, NextResponse } from 'next/server'
import { saveCheckResult } from '@/lib/checkHistory'

const BREACH_DIRECTORY_HOST = 'breachdirectory.p.rapidapi.com'

function extractRecords(payload: any): any[] {
  if (!payload) return []

  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.result)) {
    return payload.result
  }

  if (payload?.result && typeof payload.result === 'object') {
    if (Array.isArray(payload.result.records)) {
      return payload.result.records
    }
    if (Array.isArray(payload.result.entries)) {
      return payload.result.entries
    }
    return [payload.result]
  }

  if (Array.isArray(payload?.records)) {
    return payload.records
  }

  if (Array.isArray(payload?.entries)) {
    return payload.entries
  }

  if (Array.isArray(payload?.matches)) {
    return payload.matches
  }

  if (payload?.matches && typeof payload.matches === 'object') {
    const nested = Object.values(payload.matches).flatMap((item) => extractRecords(item))
    if (nested.length > 0) {
      return nested
    }
  }

  if (Array.isArray(payload?.Breaches)) {
    return payload.Breaches
  }

  if (payload?.Breaches && typeof payload.Breaches === 'object') {
    return [payload.Breaches]
  }

  return []
}

function buildResultLabel(entry: any, fallbackIndex: number): string {
  if (!entry) return `Breach ${fallbackIndex}`

  if (Array.isArray(entry.sources) && entry.sources.length > 0) {
    return entry.sources.join(', ')
  }

  if (Array.isArray(entry.dataClasses) && entry.dataClasses.length > 0) {
    return entry.dataClasses.join(', ')
  }

  if (entry.name) {
    return entry.name
  }

  if (entry.title) {
    return entry.title
  }

  if (entry.database || entry.database_name) {
    return entry.database || entry.database_name
  }

  if (entry.domain) {
    return entry.domain
  }

  return `Breach ${fallbackIndex}`
}

function countItems(entry: any): number {
  if (!entry) return 0

  const candidates = [entry.entries, entry.passwords, entry.lines, entry.records, entry.items]
    .filter((value) => Array.isArray(value)) as any[][]

  if (candidates.length > 0) {
    return candidates.reduce((sum, arr) => sum + arr.length, 0)
  }

  if (Array.isArray(entry.sources)) {
    return entry.sources.length
  }

  return 1
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, userId } = body

    if (!email) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Email is required' } },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid email format' } },
        { status: 400 }
      )
    }

    const apiKey = process.env.BREACHDIRECTORY_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: { code: 'CONFIG_ERROR', message: 'BreachDirectory API key is not configured' } },
        { status: 500 }
      )
    }

    const url = new URL('https://' + BREACH_DIRECTORY_HOST)
    url.searchParams.set('func', 'auto')
    url.searchParams.set('term', email)

    const response = await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': BREACH_DIRECTORY_HOST
      }
    })

    const raw = await response.text()
    let data: any = null

    if (raw) {
      try {
        data = JSON.parse(raw)
      } catch (parseError) {
        data = raw
      }
    }

    if (!response.ok) {
      const message = typeof data === 'string'
        ? data
        : data?.message || data?.error || `Request failed with status ${response.status}`

      return NextResponse.json(
        { ok: false, error: { code: 'UPSTREAM_ERROR', message } },
        { status: response.status }
      )
    }

    const records = extractRecords(data)

    const normalizedResults = records.map((entry, index) => {
      const label = buildResultLabel(entry, index + 1)
      const count = countItems(entry)

      return {
        name: label,
        ok: true,
        found: count > 0,
        count,
        items: entry
      }
    })

    const baseResults = normalizedResults.length > 0 ? normalizedResults : [
      {
        name: 'BreachDirectory',
        ok: true,
        found: false,
        count: 0
      }
    ]

    const foundEntries = baseResults.filter(entry => entry.found)
    const foundSources = foundEntries.length
    const totalLeaks = foundEntries.reduce((sum, item) => sum + (item.count || 0), 0)

    const responseData = {
      ok: true,
      email,
      found: foundSources > 0,
      totalLeaks,
      foundSources,
      results: baseResults,
      message: foundSources > 0
        ? `Найдено ${totalLeaks} записей в ${foundSources} источниках`
        : 'Новых утечек не обнаружено',
      timestamp: new Date().toISOString()
    }

    try {
      saveCheckResult({
        type: 'email_breach',
        query: email,
        results: responseData.results,
        totalLeaks: responseData.totalLeaks,
        foundSources: responseData.foundSources,
        message: responseData.message,
        userId: userId || 'current-user'
      })
    } catch (storeError) {
      console.error('Failed to persist email breach check:', storeError)
    }

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('Email breach check error:', error)
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
