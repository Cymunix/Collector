import React from 'react'

export default function HomePage({ scope }) {
  const {
    authMessage,
    currentUser,
    homeColumns,
    homeHeading,
    settingsHomeShowEmptyStateHints,
    t,
    tx
  } = scope
  return (
          <>
            <h1>{homeHeading}</h1>
            <p className="subtitle">
              {currentUser
                ? ''
                : t('tagline')}
            </p>
            {authMessage && <p className="auth-banner">{authMessage}</p>}

            <section className="panel-grid" aria-label="Homepage content sections">
              {homeColumns.map((column) => (
                <article key={column.title} className="panel-column">
                  <header className="column-head">
                    <h2>{tx(column.title)}</h2>
                    {column.action && (
                      <a href="#" className="column-link">
                        {tx(column.action)}
                      </a>
                    )}
                  </header>
                  <div className={`cards cards-${column.variant}`}>
                    {Array.from({ length: column.cards }).map((_, index) => (
                      <div key={`${column.title}-${index}`} className="card-placeholder">
                        {settingsHomeShowEmptyStateHints && column.showMessage && <span>{tx('No purchases yet')}</span>}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </section>
          </>
  )
}
