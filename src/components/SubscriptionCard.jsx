function SubscriptionCard({
  plan,
  isCurrentTier,
  onChoose,
  formatPlanPrice,
  actionLabel,
  actionDisabled,
  statusBadge,
  statusBadgeTone = 'blue',
  actionHint,
}) {
  const isMostPopular = plan.tier === 'collector_plus'
  const includeText =
    plan.tier === 'collector_plus'
      ? 'Includes Collector'
      : plan.tier === 'store'
      ? 'Includes Event Organizer'
      : plan.tier === 'store_pro'
        ? 'Includes Store + Event Organizer'
        : ''

  return (
    <article
      className={`relative h-full rounded-2xl border border-[#cfdcf1] bg-gradient-to-b from-white to-[#f8faff] p-4 text-left shadow-[0_6px_20px_rgba(18,32,61,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(18,32,61,0.14)] ${
        isCurrentTier
          ? 'border-[#2d67ea] bg-gradient-to-b from-[#f0f5ff] to-[#f8fbff] ring-2 ring-[#2d67ea]/35 shadow-[0_14px_30px_rgba(31,86,216,0.24)]'
          : ''
      }`}
    >
      {isCurrentTier && (
        <span className="absolute -top-3 right-4 rounded-full bg-[#2d67ea] px-3 py-1 text-xs font-bold text-white shadow">
          ✓ Current Plan
        </span>
      )}

      {isMostPopular && (
        <span className="absolute -top-3 left-4 rounded-full bg-gradient-to-r from-[#1f56d8] to-[#21a373] px-3 py-1 text-xs font-bold text-white shadow">
          Most Popular
        </span>
      )}

      {statusBadge && (
        <span
          className={`absolute ${isMostPopular ? 'top-8' : 'top-4'} left-4 rounded-full px-2.5 py-1 text-[0.67rem] font-bold shadow ${
            statusBadgeTone === 'green'
              ? 'bg-[#21a373] text-white'
              : statusBadgeTone === 'slate'
                ? 'bg-[#dce6f8] text-[#31527f]'
                : 'bg-[#e6efff] text-[#1d4cb8]'
          }`}
        >
          {statusBadge}
        </span>
      )}

      <div className="flex h-full flex-col">
        <div className="min-h-[8.5rem]">
          <p className="m-0 text-[1.03rem] font-extrabold text-[#12315b]">{plan.display_name}</p>
          <p className="m-0 mt-2 min-h-[1.2rem] text-[0.74rem] font-semibold uppercase tracking-[0.04em] text-[#2f63cb]">
            {includeText}
          </p>
          <p className="m-0 mt-2 text-[1.05rem] font-extrabold text-[#1851cf]">
            {formatPlanPrice(plan.monthly_price_cents)}
          </p>
          <p className="m-0 mt-2 text-sm leading-snug text-[#314d74]">{plan.description}</p>
        </div>

        <ul className="m-0 mt-3 list-disc space-y-1 pl-5 text-[0.84rem] leading-snug text-[#2b4468]">
          {(plan.features || []).map((feature) => (
            <li key={`${plan.tier}-${feature}`}>{feature}</li>
          ))}
        </ul>

        <div className="mt-auto border-t border-[#d7e1f2] pt-3">
          {actionHint && <p className="m-0 mb-2 text-[0.72rem] font-semibold text-[#5d7091]">{actionHint}</p>}
          <button
            type="button"
            className={`w-full rounded-[10px] border-0 px-3 py-2.5 text-sm font-bold transition-all duration-200 ${
              actionDisabled
                ? 'cursor-not-allowed bg-[#dce8ff] text-[#1d4cb8] ring-1 ring-[#9fbdf7] opacity-80'
                : 'bg-gradient-to-r from-[#1f56d8] to-[#21a373] text-white hover:opacity-95'
            }`}
            onClick={onChoose}
            disabled={actionDisabled}
            aria-label={actionLabel}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </article>
  )
}

export default SubscriptionCard
