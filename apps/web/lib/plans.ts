export type NormalizedPlan = 'free' | 'basic' | 'professional'

export const PLAN_LIMITS: Record<NormalizedPlan, number> = {
  free: 0,
  basic: 1,
  professional: 2,
}

const BASIC_ALIASES = new Set([
  'basic',
  'plan_basic',
])

const PROFESSIONAL_ALIASES = new Set([
  'professional',
  'professional-6m',
  'professional-12m',
  'professional_6m',
  'professional_12m',
  'pro',
  'expert',
  'corporate',
])

export function resolvePlanFromParam(planParam?: string | null) {
  const raw = (planParam ?? '').toString().trim().toLowerCase()

  if (BASIC_ALIASES.has(raw)) {
    return {
      plan: 'basic' as NormalizedPlan,
      limit: PLAN_LIMITS.basic,
      rawPlan: planParam ?? 'basic',
    }
  }

  if (PROFESSIONAL_ALIASES.has(raw)) {
    return {
      plan: 'professional' as NormalizedPlan,
      limit: PLAN_LIMITS.professional,
      rawPlan: planParam ?? 'professional',
    }
  }

  return {
    plan: 'free' as NormalizedPlan,
    limit: PLAN_LIMITS.free,
    rawPlan: planParam ?? 'free',
  }
}

export function getChecksLimit(plan?: string | null, fallback?: number) {
  const { limit } = resolvePlanFromParam(plan)
  return typeof fallback === 'number' ? fallback : limit
}
