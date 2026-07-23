import React from 'react'

export default function WishlistPage({ scope }) {
  const {
    currentUser,
    filteredWishlistItems,
    formatUsd,
    handleOpenAddToCollectionModal,
    handleOpenCatalog,
    handleOpenCatalogItem,
    handleWishlistRemove,
    isWishlistLoading,
    openAuth,
    ownedCatalogItemCounts,
    paginatedWishlistItems,
    setSelectedCatalogItem,
    setWishlistCategoryFilter,
    setWishlistPage,
    setWishlistRemoveConfirmId,
    setWishlistSearchQuery,
    setWishlistViewTab,
    wishlistCategories,
    wishlistCategoryFilter,
    wishlistItems,
    wishlistLoadError,
    wishlistPage,
    wishlistRemoveConfirmId,
    wishlistSearchQuery,
    wishlistSummary,
    wishlistTotalPages,
    wishlistViewTab
  } = scope
  return (
          <section className="collection-screen" aria-label="My Wishlist">
            <div className="catalog-head">
              <div>
                <h1>My Wishlist</h1>
                <p className="subtitle catalog-subtitle">Items you want — add them to your collection when you get them.</p>
              </div>
              <div className="catalog-actions">
                <button type="button" className="catalog-action-pill" onClick={handleOpenCatalog}>
                  Browse Catalog
                </button>
              </div>
            </div>

            {!currentUser ? (
              <div className="settings-empty-state">
                <p className="subtitle">Log in to view your wishlist.</p>
                <button type="button" className="auth-submit" onClick={() => openAuth('signin')}>
                  Log in
                </button>
              </div>
            ) : (
              <div className="collection-layout">
                <aside className="catalog-card collection-sidebar" aria-label="Wishlist filters">
                  <div className="collection-sidebar-section">
                    <p className="collection-sidebar-title">My Wishlist</p>
                    <button
                      type="button"
                      className={`collection-sidebar-link ${wishlistCategoryFilter === 'all' ? 'active' : ''}`}
                      onClick={() => { setWishlistCategoryFilter('all'); setWishlistPage(1) }}
                    >
                      All Items
                    </button>
                    {wishlistCategories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`collection-sidebar-link ${wishlistCategoryFilter === cat.id ? 'active' : ''}`}
                        onClick={() => { setWishlistCategoryFilter(cat.id); setWishlistPage(1) }}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </aside>

                <div className="collection-main-pane">
                  <div className="collection-topbar">
                    <input
                      type="search"
                      placeholder="Search wishlist…"
                      value={wishlistSearchQuery}
                      onChange={e => { setWishlistSearchQuery(e.target.value); setWishlistPage(1) }}
                    />
                    <div className="collection-tab-row" role="tablist" aria-label="Wishlist views">
                      <button
                        type="button"
                        className={`collection-tab-button ${wishlistViewTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setWishlistViewTab('overview')}
                      >
                        Overview
                      </button>
                    </div>
                  </div>

                  {isWishlistLoading ? (
                    <div className="catalog-card catalog-loading-panel">Loading your wishlist...</div>
                  ) : wishlistLoadError ? (
                    <div className="catalog-card catalog-loading-panel">{wishlistLoadError}</div>
                  ) : wishlistItems.length === 0 ? (
                    <div className="settings-empty-state">
                      <p className="subtitle">Your wishlist is empty. Browse the catalog and add items you want.</p>
                      <button type="button" className="auth-submit" onClick={handleOpenCatalog}>
                        Browse Catalog
                      </button>
                    </div>
                  ) : filteredWishlistItems.length === 0 ? (
                    <div className="catalog-card catalog-loading-panel">No items match your filters.</div>
                  ) : (
                    <>
                      <section className="collection-summary-grid" aria-label="Wishlist summary">
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">Total Wishlisted</p>
                          <strong>{wishlistSummary.totalItems}</strong>
                        </article>
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">Categories</p>
                          <strong>{wishlistSummary.uniqueCategories}</strong>
                        </article>
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">Unique Sets</p>
                          <strong>{wishlistSummary.uniqueSets}</strong>
                        </article>
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">Est. Price to Complete</p>
                          <strong>{wishlistSummary.pricedCount > 0 ? formatUsd(wishlistSummary.estimatedTotal) : '—'}</strong>
                          {wishlistSummary.pricedCount > 0 && wishlistSummary.pricedCount < wishlistSummary.filteredCount && (
                            <p style={{ fontSize: '0.72rem', color: '#667', marginTop: 2 }}>
                              {wishlistSummary.pricedCount} of {wishlistSummary.filteredCount} priced
                            </p>
                          )}
                        </article>
                      </section>

                      <section className="collection-list" aria-label="Wishlist items">
                        {paginatedWishlistItems.map(item => (
                          <article key={`wishlist-item-${item.id}`} className="catalog-card collection-item-row">
                            {item.imageUrl ? (
                              <img className="collection-item-image" src={item.imageUrl} alt={item.name} loading="lazy" />
                            ) : (
                              <div className="collection-item-image collection-item-image-placeholder">No image</div>
                            )}

                            <div className="collection-item-body">
                              <h3>{item.name}</h3>
                              <p className="collection-item-meta">
                                {[item.releaseYear, item.setName, item.categoryName].filter(Boolean).join(' | ')}
                              </p>
                              <div className="collection-item-stats">
                                <span>Est. Price: {item.market_price != null && Number(item.market_price) > 0 ? formatUsd(item.market_price) : '—'}</span>
                              </div>
                              {ownedCatalogItemCounts[item.id] > 0 && (
                                <p className="collection-item-meta" style={{ color: '#1a4ecf', fontWeight: 600 }}>
                                  You own {ownedCatalogItemCounts[item.id]}
                                </p>
                              )}
                            </div>

                            <div className="collection-item-actions">
                              <button
                                type="button"
                                className="catalog-action-pill"
                                onClick={() => {
                                  setSelectedCatalogItem(item)
                                  handleOpenAddToCollectionModal(item.id)
                                }}
                              >
                                Collect
                              </button>

                              <button
                                type="button"
                                className="catalog-action-pill"
                                onClick={() => handleOpenCatalogItem(item)}
                              >
                                View Catalog Card
                              </button>

                              {wishlistRemoveConfirmId === item.id ? (
                                <div className="collection-item-remove-confirm">
                                  <span className="collection-item-remove-label">Remove from wishlist?</span>
                                  <button type="button" className="collection-item-remove-choice collection-item-remove-all" onClick={() => handleWishlistRemove(item.id)}>Yes</button>
                                  <button type="button" className="collection-item-remove-cancel" onClick={() => setWishlistRemoveConfirmId('')}>No</button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="catalog-action-pill collection-item-remove-btn"
                                  onClick={() => setWishlistRemoveConfirmId(item.id)}
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </article>
                        ))}
                      </section>

                      {wishlistTotalPages > 1 && (
                        <div className="catalog-pagination" aria-label="Wishlist pagination">
                          <button
                            type="button"
                            className="catalog-pagination-btn"
                            onClick={() => setWishlistPage(p => Math.max(1, p - 1))}
                            disabled={wishlistPage <= 1}
                          >
                            Previous
                          </button>
                          <span className="catalog-pagination-page">Page {wishlistPage} / {wishlistTotalPages}</span>
                          <button
                            type="button"
                            className="catalog-pagination-btn"
                            onClick={() => setWishlistPage(p => Math.min(wishlistTotalPages, p + 1))}
                            disabled={wishlistPage >= wishlistTotalPages}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </section>
  )
}
