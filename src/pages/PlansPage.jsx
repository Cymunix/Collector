import React from 'react'

export default function PlansPage({ scope }) {
  const {
    SubscriptionCard,
    authMessage,
    cartItems,
    formatDate,
    formatPlanPrice,
    getPlanActionMeta,
    getPlanDisplayLabel,
    handlePlanAction,
    isPlansLoading,
    isUpdatingPlan,
    plansError,
    profile,
    renewalStatus,
    subscriptionPlans,
    tx
  } = scope
  return (
          <section className="plans-screen" aria-label="Subscription plans">
            <h1>{tx('Subscription Plans')}</h1>
            <p className="subtitle">{tx('Choose the right tier for your collecting journey.')}</p>

            {profile && (
              <section className="mx-auto mb-4 grid max-w-[1420px] grid-cols-1 gap-2 rounded-xl border border-[#cfdcf1] bg-white/75 p-3 text-left shadow-[0_6px_18px_rgba(18,32,61,0.08)] sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <p className="m-0 text-[0.73rem] font-bold uppercase tracking-[0.05em] text-[#5f7088]">Current plan</p>
                  <p className="m-0 mt-1 text-sm font-extrabold text-[#12315b]">{getPlanDisplayLabel(profile)}</p>
                </div>
                <div>
                  <p className="m-0 text-[0.73rem] font-bold uppercase tracking-[0.05em] text-[#5f7088]">Started date</p>
                  <p className="m-0 mt-1 text-sm font-bold text-[#23416d]">{formatDate(profile.subscription_started_at)}</p>
                </div>
                <div>
                  <p className="m-0 text-[0.73rem] font-bold uppercase tracking-[0.05em] text-[#5f7088]">Next billing date</p>
                  <p className="m-0 mt-1 text-sm font-bold text-[#23416d]">{formatDate(profile.subscription_current_period_end)}</p>
                </div>
                <div>
                  <p className="m-0 text-[0.73rem] font-bold uppercase tracking-[0.05em] text-[#5f7088]">Billing cycle</p>
                  <p className="m-0 mt-1 text-sm font-bold text-[#23416d]">{profile.billing_cycle || 'monthly'}</p>
                </div>
                <div>
                  <p className="m-0 text-[0.73rem] font-bold uppercase tracking-[0.05em] text-[#5f7088]">Renewal status</p>
                  <p className="m-0 mt-1 text-sm font-bold text-[#23416d]">{renewalStatus}</p>
                </div>
              </section>
            )}

            {authMessage && <p className="auth-banner">{authMessage}</p>}
            {isPlansLoading && <p className="auth-banner">{tx('Loading plans...')}</p>}
            {plansError && <p className="auth-error inline-error">{plansError}</p>}

            {!isPlansLoading && !plansError && (
              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {subscriptionPlans.map((plan) => {
                  const isCurrentTier =
                    profile?.subscription_tier === plan.tier ||
                    (plan.tier === 'event_organizer' && Boolean(profile?.has_event_organizer))
                  const actionMeta = getPlanActionMeta(plan)
                  const hasCollectorPlusInCart = cartItems.some((item) => item.tier === 'collector_plus')
                  const effectivePriceCents =
                    plan.tier === 'event_organizer' && (profile?.subscription_tier === 'collector_plus' || hasCollectorPlusInCart)
                      ? 1000
                      : plan.monthly_price_cents
                  return (
                    <SubscriptionCard
                      key={plan.tier}
                      plan={{
                        ...plan,
                        monthly_price_cents: effectivePriceCents,
                      }}
                      isCurrentTier={isCurrentTier}
                      actionLabel={actionMeta.label}
                      actionDisabled={actionMeta.disabled || isUpdatingPlan}
                      statusBadge={actionMeta.statusBadge}
                      statusBadgeTone={actionMeta.statusBadgeTone}
                      actionHint={actionMeta.hint}
                      onChoose={() => handlePlanAction(plan, actionMeta.intent)}
                      formatPlanPrice={formatPlanPrice}
                    />
                  )
                })}
              </div>
            )}
          </section>
  )
}
