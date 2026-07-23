import React from 'react'
import CompletionPage from './CompletionPage'

export default function CollectionPage({ scope }) {
  const {
    COLLECTION_ACQUISITION_TYPE_LABELS,
    activeCollectionFilter,
    activeStorageFilter,
    allocationByCategory,
    assignableCustomCollections,
    collectionFilterCondition,
    collectionFilterFaction,
    collectionFilterOptions,
    collectionFilterSpecies,
    collectionFilterSubtheme,
    collectionLoadError,
    collectionOverviewPage,
    collectionOverviewPageInput,
    collectionOverviewTotalPages,
    collectionSearchQuery,
    collectionSortKey,
    collectionSummary,
    collectionViewTab,
    completionAfterProductLine,
    completionAfterSubtheme,
    completionBrandGroups,
    completionBrandSetCards,
    completionCategoryGroups,
    completionCategoryRollup,
    completionFacetStage,
    completionFranchiseGroups,
    completionIsLego,
    completionLabels,
    completionNavBrand,
    completionNavCategory,
    completionNavFranchise,
    completionNavSubcategory,
    completionNavSubset,
    completionNavSubtheme,
    completionProductLines,
    completionSetAllItems,
    completionSetSubsets,
    completionSubcategoryGroups,
    completionSubthemes,
    currentUser,
    customCollectionPerformance,
    customCollections,
    filteredCollectionItems,
    formatPercentValue,
    formatUsd,
    handleAssignStorageLocationToItem,
    handleCreateCustomCollection,
    handleCreateStorageLocation,
    handleDeleteActiveCollection,
    handleDeleteActiveStorageLocation,
    handleMoveActiveStorageLocation,
    handleOpenCatalog,
    handleOpenCatalogItem,
    handleOpenCollectionItemDetails,
    handleRemoveCollectionItem,
    handleRenameActiveCollection,
    handleRenameActiveStorageLocation,
    handleToggleCollectionMembership,
    isCollectionLoading,
    isCreatingCustomCollection,
    isCreatingStorageLocation,
    isSavingCollectionOrganization,
    largestGainItem,
    largestLossItem,
    monthlyAnalytics,
    mostValuableItem,
    newCustomCollectionName,
    newStorageLocationName,
    newStorageParentLocationId,
    openAuth,
    openCatalogItemById,
    overallCollectionValue,
    overallProfitLoss,
    overallRoi,
    overallTotalInvested,
    ownedCatalogItemIds,
    ownedItemsByCatalogId,
    paginatedCollectionItems,
    removeConfirmItemId,
    rollupCards,
    selectedCompletionSet,
    selectedCompletionSetEntries,
    selectedCompletionSetId,
    setActiveCollectionFilter,
    setActiveStorageFilter,
    setCollectionFilterCondition,
    setCollectionFilterFaction,
    setCollectionFilterSpecies,
    setCollectionFilterSubtheme,
    setCollectionOverviewPage,
    setCollectionOverviewPageInput,
    setCollectionSearchQuery,
    setCollectionSortKey,
    setCollectionViewTab,
    setCompletionNavBrand,
    setCompletionNavCategory,
    setCompletionNavFranchise,
    setCompletionNavProductLine,
    setCompletionNavSubcategory,
    setCompletionNavSubset,
    setCompletionNavSubtheme,
    setCompletionSheetPopup,
    setNewCustomCollectionName,
    setNewStorageLocationName,
    setNewStorageParentLocationId,
    setRemoveConfirmItemId,
    setSelectedCompletionSetId,
    storageLocationPathById,
    storageLocations,
    t
  } = scope
  return (
          <section className="collection-screen" aria-label="My collection">
            <div className="catalog-head">
              <div>
                <h1>{t('myCollection')}</h1>
                <p className="subtitle catalog-subtitle">Organize by custom collections and physical storage locations.</p>
              </div>
              <div className="catalog-actions">
                <button type="button" className="catalog-action-pill" onClick={handleOpenCatalog}>
                  Browse Catalog
                </button>
              </div>
            </div>

            {!currentUser ? (
              <div className="settings-empty-state">
                <p className="subtitle">Log in to view and manage your collection.</p>
                <button type="button" className="auth-submit" onClick={() => openAuth('signin')}>
                  Log in
                </button>
              </div>
            ) : (
              <div className="collection-layout">
                {collectionViewTab === 'completion' ? (
                  <aside className="catalog-card collection-sidebar" aria-label="Completion filters">
                    <div className="collection-sidebar-section">
                      <p className="collection-sidebar-title">Filter</p>

                      <label className="completion-filter-label">Category</label>
                      <select
                        value={completionNavCategory}
                        onChange={(e) => { setCompletionNavCategory(e.target.value); setCompletionNavSubcategory(''); setCompletionNavFranchise(''); setCompletionNavBrand(''); setSelectedCompletionSetId('') }}
                      >
                        <option value="">All categories</option>
                        {Object.keys(completionCategoryGroups).sort((a, b) => a.localeCompare(b)).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>

                      <label className="completion-filter-label">{completionLabels.subcategory}</label>
                      <select
                        value={completionNavSubcategory}
                        disabled={!completionNavCategory}
                        onChange={(e) => { setCompletionNavSubcategory(e.target.value); setCompletionNavFranchise(''); setCompletionNavBrand(''); setSelectedCompletionSetId('') }}
                      >
                        <option value="">All {completionLabels.subcategory.toLowerCase()}s</option>
                        {Object.keys(completionSubcategoryGroups).sort((a, b) => a.localeCompare(b)).map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>

                      <label className="completion-filter-label">{completionLabels.franchise}</label>
                      <select
                        value={completionNavFranchise}
                        disabled={!completionNavSubcategory}
                        onChange={(e) => { setCompletionNavFranchise(e.target.value); setCompletionNavBrand(''); setSelectedCompletionSetId('') }}
                      >
                        <option value="">All {completionLabels.franchise.toLowerCase()}s</option>
                        {Object.keys(completionFranchiseGroups).sort((a, b) => a.localeCompare(b)).map(fr => (
                          <option key={fr} value={fr}>{fr}</option>
                        ))}
                      </select>

                      <label className="completion-filter-label">{completionLabels.brand}</label>
                      <select
                        value={completionNavBrand}
                        disabled={!completionNavFranchise}
                        onChange={(e) => { setCompletionNavBrand(e.target.value); setSelectedCompletionSetId('') }}
                      >
                        <option value="">All {completionLabels.brand.toLowerCase()}s</option>
                        {Object.keys(completionBrandGroups).sort((a, b) => a.localeCompare(b)).map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>

                      {(completionNavCategory || completionNavSubcategory || completionNavFranchise || completionNavBrand) && (
                        <button
                          type="button"
                          className="completion-filter-clear"
                          onClick={() => { setCompletionNavCategory(''); setCompletionNavSubcategory(''); setCompletionNavFranchise(''); setCompletionNavBrand(''); setSelectedCompletionSetId('') }}
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </aside>
                ) : (
                  <aside className="catalog-card collection-sidebar" aria-label="Collections and storage">
                    <div className="collection-sidebar-section">
                      <p className="collection-sidebar-title">{t('myCollection')}</p>
                      <button
                        type="button"
                        className={`collection-sidebar-link ${activeCollectionFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveCollectionFilter('all')}
                      >
                        All Items
                      </button>
                      {customCollections.map((collection) => (
                        <button
                          key={collection.id}
                          type="button"
                          className={`collection-sidebar-link ${activeCollectionFilter === collection.id ? 'active' : ''}`}
                          onClick={() => setActiveCollectionFilter(collection.id)}
                        >
                          {collection.name}
                        </button>
                      ))}

                      <div className="collection-inline-create">
                        <input
                          type="text"
                          value={newCustomCollectionName}
                          onChange={(event) => setNewCustomCollectionName(event.target.value)}
                          placeholder="Create Collection"
                        />
                        <button type="button" className="catalog-action-pill" onClick={handleCreateCustomCollection} disabled={isCreatingCustomCollection}>
                          +
                        </button>
                      </div>

                      {activeCollectionFilter !== 'all' && (
                        <div className="collection-inline-actions">
                          <button type="button" className="catalog-action-pill" onClick={handleRenameActiveCollection}>Rename</button>
                          <button type="button" className="catalog-action-pill" onClick={handleDeleteActiveCollection}>Delete</button>
                        </div>
                      )}
                    </div>

                    <div className="collection-sidebar-section">
                      <p className="collection-sidebar-title">Storage</p>
                      {storageLocations.map((location) => {
                        const locationPath = storageLocationPathById[location.id] || location.name
                        const depth = locationPath ? Math.max(0, locationPath.split(' -> ').length - 1) : 0
                        return (
                          <button
                            key={location.id}
                            type="button"
                            className={`collection-sidebar-link ${activeStorageFilter === location.id ? 'active' : ''}`}
                            style={{ paddingLeft: `${12 + depth * 14}px` }}
                            onClick={() => setActiveStorageFilter((currentValue) => (currentValue === location.id ? '' : location.id))}
                          >
                            {location.name}
                          </button>
                        )
                      })}

                      <div className="collection-inline-create">
                        <input
                          type="text"
                          value={newStorageLocationName}
                          onChange={(event) => setNewStorageLocationName(event.target.value)}
                          placeholder="Create Location"
                        />
                        <button type="button" className="catalog-action-pill" onClick={handleCreateStorageLocation} disabled={isCreatingStorageLocation}>
                          +
                        </button>
                      </div>

                      <select
                        value={newStorageParentLocationId}
                        onChange={(event) => setNewStorageParentLocationId(event.target.value)}
                      >
                        <option value="">Top Level</option>
                        {storageLocations.map((location) => (
                          <option key={`storage-parent-${location.id}`} value={location.id}>
                            {storageLocationPathById[location.id] || location.name}
                          </option>
                        ))}
                      </select>

                      {activeStorageFilter && (
                        <>
                          <select
                            value=""
                            onChange={(event) => handleMoveActiveStorageLocation(event.target.value)}
                          >
                            <option value="">Move Location To...</option>
                            <option value="">Top Level</option>
                            {storageLocations
                              .filter((location) => location.id !== activeStorageFilter)
                              .map((location) => (
                                <option key={`move-storage-${location.id}`} value={location.id}>
                                  {storageLocationPathById[location.id] || location.name}
                                </option>
                              ))}
                          </select>
                          <div className="collection-inline-actions">
                            <button type="button" className="catalog-action-pill" onClick={handleRenameActiveStorageLocation}>Rename</button>
                            <button type="button" className="catalog-action-pill" onClick={handleDeleteActiveStorageLocation}>Delete</button>
                          </div>
                        </>
                      )}
                    </div>
                  </aside>
                )}

                <div className="collection-main-pane">
                  <div className="collection-topbar">
                    <input
                      type="search"
                      value={collectionSearchQuery}
                      onChange={(event) => setCollectionSearchQuery(event.target.value)}
                      placeholder="Search by item, collection, location, set, or category"
                    />
                    <div className="collection-filter-row">
                      {collectionFilterOptions.subthemes.length > 0 && (
                        <select className="collection-filter-select" value={collectionFilterSubtheme} onChange={(e) => setCollectionFilterSubtheme(e.target.value)} aria-label="Filter by set">
                          <option value="">All sets</option>
                          {collectionFilterOptions.subthemes.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      )}
                      {collectionFilterOptions.factions.length > 0 && (
                        <select className="collection-filter-select" value={collectionFilterFaction} onChange={(e) => setCollectionFilterFaction(e.target.value)} aria-label="Filter by faction">
                          <option value="">All factions</option>
                          {collectionFilterOptions.factions.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      )}
                      {collectionFilterOptions.species.length > 0 && (
                        <select className="collection-filter-select" value={collectionFilterSpecies} onChange={(e) => setCollectionFilterSpecies(e.target.value)} aria-label="Filter by species">
                          <option value="">All species</option>
                          {collectionFilterOptions.species.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      )}
                      {collectionFilterOptions.conditions.length > 0 && (
                        <select className="collection-filter-select" value={collectionFilterCondition} onChange={(e) => setCollectionFilterCondition(e.target.value)} aria-label="Filter by condition">
                          <option value="">All conditions</option>
                          {collectionFilterOptions.conditions.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      )}
                      <select className="collection-filter-select" value={collectionSortKey} onChange={(e) => setCollectionSortKey(e.target.value)} aria-label="Sort">
                        <option value="recent">Sort: Recently added</option>
                        <option value="name">Sort: Name (A–Z)</option>
                        <option value="value_desc">Sort: Value (high→low)</option>
                        <option value="value_asc">Sort: Value (low→high)</option>
                        <option value="quantity">Sort: Quantity</option>
                      </select>
                      {(collectionFilterSubtheme || collectionFilterFaction || collectionFilterSpecies || collectionFilterCondition) && (
                        <button type="button" className="catalog-action-pill" onClick={() => { setCollectionFilterSubtheme(''); setCollectionFilterFaction(''); setCollectionFilterSpecies(''); setCollectionFilterCondition('') }}>Clear filters</button>
                      )}
                    </div>
                    <div className="collection-tab-row" role="tablist" aria-label="Collection views">
                      <button
                        type="button"
                        className={`collection-tab-button ${collectionViewTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setCollectionViewTab('overview')}
                      >
                        Overview
                      </button>
                      <button
                        type="button"
                        className={`collection-tab-button ${collectionViewTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setCollectionViewTab('analytics')}
                      >
                        Analytics
                      </button>
                      <button
                        type="button"
                        className={`collection-tab-button ${collectionViewTab === 'completion' ? 'active' : ''}`}
                        onClick={() => setCollectionViewTab('completion')}
                      >
                        Completion
                      </button>
                    </div>
                  </div>

                  {isCollectionLoading ? (
                    <div className="catalog-card catalog-loading-panel">Loading your collection...</div>
                  ) : collectionLoadError ? (
                    <div className="catalog-card catalog-loading-panel">{collectionLoadError}</div>
                  ) : collectionViewTab !== 'completion' && filteredCollectionItems.length === 0 ? (
                    <div className="catalog-card catalog-loading-panel">No matching items. Add cards from the catalog or adjust your filters.</div>
                  ) : collectionViewTab === 'analytics' ? (
                    <div className="collection-analytics-stack">
                      <section className="collection-summary-grid" aria-label="Portfolio summary">
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">Collection Value</p>
                          <strong>{formatUsd(overallCollectionValue)}</strong>
                        </article>
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">Total Invested</p>
                          <strong>{formatUsd(overallTotalInvested)}</strong>
                        </article>
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">Profit / Loss</p>
                          <strong className={overallProfitLoss >= 0 ? 'collection-positive' : 'collection-negative'}>{formatUsd(overallProfitLoss)}</strong>
                        </article>
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">ROI</p>
                          <strong className={overallRoi >= 0 ? 'collection-positive' : 'collection-negative'}>{formatPercentValue(overallRoi)}</strong>
                        </article>
                      </section>

                      <section className="collection-analytics-grid">
                        <article className="catalog-card collection-analytics-card">
                          <h3>Portfolio Allocation</h3>
                          <div className="collection-allocation-list">
                            {allocationByCategory.map((entry) => (
                              <div key={`allocation-${entry.categoryName}`} className="collection-allocation-row">
                                <div className="collection-allocation-row-head">
                                  <strong>{entry.categoryName}</strong>
                                  <span>{entry.allocationPercent.toFixed(1)}%</span>
                                </div>
                                <div className="collection-allocation-bar-track">
                                  <div className="collection-allocation-bar-fill" style={{ width: `${entry.allocationPercent}%` }} />
                                </div>
                                <p>{formatUsd(entry.currentMarketValue)} value | ROI {formatPercentValue(entry.roi)}</p>
                              </div>
                            ))}
                          </div>
                        </article>

                        <article className="catalog-card collection-analytics-card">
                          <h3>Collection Insights</h3>
                          <div className="collection-insight-list">
                            <div className="collection-insight-item">
                              <span>Most Valuable Item</span>
                              <strong>{mostValuableItem ? `${mostValuableItem.name} · ${formatUsd(mostValuableItem.currentMarketValue)}` : 'N/A'}</strong>
                            </div>
                            <div className="collection-insight-item">
                              <span>Largest Gain</span>
                              <strong>{largestGainItem ? `${largestGainItem.name} · ${formatUsd(largestGainItem.profitLoss)}` : 'N/A'}</strong>
                            </div>
                            <div className="collection-insight-item">
                              <span>Largest Loss</span>
                              <strong>{largestLossItem ? `${largestLossItem.name} · ${formatUsd(largestLossItem.profitLoss)}` : 'N/A'}</strong>
                            </div>
                          </div>
                        </article>
                      </section>

                      <section className="collection-analytics-grid">
                        <article className="catalog-card collection-analytics-card">
                          <h3>Monthly Spending</h3>
                          <div className="collection-metrics-list">
                            {monthlyAnalytics.length === 0 ? (
                              <p className="collection-muted">No monthly purchase data yet.</p>
                            ) : (
                              monthlyAnalytics.slice(-6).map((entry) => (
                                <div key={`monthly-spending-${entry.label}`} className="collection-metric-row">
                                  <strong>{entry.label}</strong>
                                  <span>{formatUsd(entry.investedValue)}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </article>

                        <article className="catalog-card collection-analytics-card">
                          <h3>Monthly Value Growth</h3>
                          <div className="collection-metrics-list">
                            {monthlyAnalytics.length === 0 ? (
                              <p className="collection-muted">No monthly value data yet.</p>
                            ) : (
                              monthlyAnalytics.slice(-6).map((entry) => (
                                <div key={`monthly-value-${entry.label}`} className="collection-metric-row">
                                  <strong>{entry.label}</strong>
                                  <span>{formatUsd(entry.currentMarketValue)}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </article>
                      </section>

                      <article className="catalog-card collection-analytics-card">
                        <h3>Custom Collection Performance</h3>
                        <div className="collection-performance-list">
                          {customCollectionPerformance.length === 0 ? (
                            <p className="collection-muted">Create custom collections to compare value, ROI, and goal progress.</p>
                          ) : (
                            customCollectionPerformance.map((entry) => (
                              <div key={`collection-performance-${entry.id}`} className="collection-performance-row">
                                <div>
                                  <strong>{entry.name}</strong>
                                  <p>{entry.itemCount} items</p>
                                </div>
                                <div>
                                  <span>{formatUsd(entry.currentMarketValue)}</span>
                                  <p>Invested {formatUsd(entry.totalInvested)}</p>
                                </div>
                                <div>
                                  <span>ROI {formatPercentValue(entry.roi)}</span>
                                  <p>Completion {entry.completionPercent == null ? 'N/A' : `${entry.completionPercent.toFixed(1)}%`}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </article>
                    </div>
                  ) : collectionViewTab === 'completion' ? (
                    <>
                    <CompletionPage
                      ownedCatalogItemIds={ownedCatalogItemIds}
                      onOpenItem={openCatalogItemById}
                      searchQuery={collectionSearchQuery}
                      filterCategory={completionNavCategory}
                      filterSubcategory={completionNavSubcategory}
                      filterFranchise={completionNavFranchise}
                      filterBrand={completionNavBrand}
                    />
                    <div className="completion-main" style={{ display: 'none' }}>
                        {/* Breadcrumb */}
                        {(completionNavCategory || completionNavSubcategory || completionNavFranchise || completionNavBrand || selectedCompletionSetId) && (
                          <nav className="completion-breadcrumb" aria-label="Completion breadcrumb">
                            <button type="button" className="completion-crumb" onClick={() => { setCompletionNavCategory(''); setCompletionNavSubcategory(''); setCompletionNavFranchise(''); setCompletionNavBrand(''); setSelectedCompletionSetId('') }}>All categories</button>
                            {completionNavCategory && (
                              <>
                                <span className="completion-crumb-sep" aria-hidden="true">›</span>
                                <button type="button" className={`completion-crumb${!completionNavSubcategory && !selectedCompletionSetId ? ' completion-crumb-current' : ''}`} onClick={() => { setCompletionNavSubcategory(''); setCompletionNavFranchise(''); setCompletionNavBrand(''); setSelectedCompletionSetId('') }}>{completionNavCategory}</button>
                              </>
                            )}
                            {completionNavSubcategory && (
                              <>
                                <span className="completion-crumb-sep" aria-hidden="true">›</span>
                                <button type="button" className={`completion-crumb${!completionNavFranchise && !selectedCompletionSetId ? ' completion-crumb-current' : ''}`} onClick={() => { setCompletionNavFranchise(''); setCompletionNavBrand(''); setSelectedCompletionSetId('') }}>{completionNavSubcategory}</button>
                              </>
                            )}
                            {completionNavFranchise && (
                              <>
                                <span className="completion-crumb-sep" aria-hidden="true">›</span>
                                <button type="button" className={`completion-crumb${!completionNavBrand && !selectedCompletionSetId ? ' completion-crumb-current' : ''}`} onClick={() => { setCompletionNavBrand(''); setSelectedCompletionSetId('') }}>{completionNavFranchise}</button>
                              </>
                            )}
                            {completionNavBrand && (
                              <>
                                <span className="completion-crumb-sep" aria-hidden="true">›</span>
                                <button type="button" className={`completion-crumb${!selectedCompletionSetId ? ' completion-crumb-current' : ''}`} onClick={() => setSelectedCompletionSetId('')}>{completionNavBrand}</button>
                              </>
                            )}
                            {selectedCompletionSetId && selectedCompletionSet && (
                              <>
                                <span className="completion-crumb-sep" aria-hidden="true">›</span>
                                <button
                                  type="button"
                                  className={`completion-crumb${!completionNavSubset ? ' completion-crumb-current' : ''}`}
                                  onClick={() => setCompletionNavSubset('')}
                                >
                                  {selectedCompletionSet.title}
                                </button>
                              </>
                            )}
                            {completionNavSubset && (
                              <>
                                <span className="completion-crumb-sep" aria-hidden="true">›</span>
                                <span className="completion-crumb completion-crumb-current">
                                  {completionSetSubsets.find(s => s.id === completionNavSubset)?.name || 'Subset'}
                                </span>
                              </>
                            )}
                          </nav>
                        )}

                        {/* Category context header — shown whenever a category is active and not in set detail */}
                        {completionNavCategory && !selectedCompletionSetId && (
                          <article className="catalog-card completion-context-header">
                            <div className="completion-context-header-body">
                              <h3 className="completion-context-name">{completionNavCategory}</h3>
                              <div className="completion-context-meta">
                                <span>{Object.keys(completionSubcategoryGroups).length} subcategor{Object.keys(completionSubcategoryGroups).length === 1 ? 'y' : 'ies'}</span>
                                <span aria-hidden="true">·</span>
                                <span>{completionCategoryRollup.setsStarted} set{completionCategoryRollup.setsStarted === 1 ? '' : 's'} started</span>
                                <span aria-hidden="true">·</span>
                                <span>{completionCategoryRollup.percent.toFixed(1)}% avg complete</span>
                              </div>
                            </div>
                            <div className="collection-allocation-bar-track completion-context-bar">
                              <div className="collection-allocation-bar-fill" style={{ width: `${Math.min(completionCategoryRollup.percent, 100)}%` }} />
                            </div>
                          </article>
                        )}

                        {/* Content area — one of five states */}
                        {selectedCompletionSetId ? (
                          selectedCompletionSet ? (
                            <div className="completion-set-sheet">
                              <div className="completion-sheet-header">
                                {(() => {
                                  // Back goes to the deepest branching level above the orange leaf.
                                  if (completionIsLego && selectedCompletionSet?._isLego) {
                                    let label, onBack
                                    if (completionProductLines.length > 1) {
                                      label = completionNavSubtheme || completionNavBrand
                                      onBack = () => { setCompletionNavSubset(''); setSelectedCompletionSetId(''); setCompletionNavProductLine('') }
                                    } else if (completionSubthemes.length > 1) {
                                      label = completionNavBrand
                                      onBack = () => { setCompletionNavSubset(''); setSelectedCompletionSetId(''); setCompletionNavProductLine(''); setCompletionNavSubtheme('') }
                                    } else {
                                      label = completionNavFranchise || 'Back'
                                      onBack = () => { setCompletionNavSubset(''); setSelectedCompletionSetId(''); setCompletionNavProductLine(''); setCompletionNavSubtheme(''); setCompletionNavBrand('') }
                                    }
                                    return <button type="button" className="catalog-action-pill" onClick={onBack}>← {label}</button>
                                  }
                                  const soleCard = completionBrandSetCards.length === 1 && completionBrandSetCards[0]?.id === selectedCompletionSetId
                                  return (
                                    <button type="button" className="catalog-action-pill" onClick={() => { setCompletionNavSubset(''); setSelectedCompletionSetId(''); if (soleCard) setCompletionNavBrand('') }}>
                                      ← {soleCard ? (completionNavFranchise || 'Back') : (completionNavBrand || 'All Sets')}
                                    </button>
                                  )
                                })()}
                                <div className="completion-sheet-title">
                                  <h3>{selectedCompletionSet.title}{completionNavSubset ? ` — ${completionSetSubsets.find(s => s.id === completionNavSubset)?.name}` : ''}</h3>
                                  <p>{selectedCompletionSet.ownedCount} / {selectedCompletionSet.totalItems} collected</p>
                                </div>
                                <div className="completion-sheet-pct">{selectedCompletionSet.completionPercent.toFixed(0)}%</div>
                              </div>
                              <div className="completion-sheet-progress-track">
                                <div className="completion-sheet-progress-fill" style={{ width: `${Math.min(selectedCompletionSet.completionPercent, 100)}%` }} />
                              </div>

                              {/* Subset picker — shown when set has subsets and none selected */}
                              {completionSetSubsets.length > 0 && !completionNavSubset ? (
                                <div className="completion-subset-grid">
                                  <button
                                    type="button"
                                    className="catalog-card completion-subset-card"
                                    onClick={() => setCompletionNavSubset('__all__')}
                                  >
                                    <strong>All Subsets</strong>
                                    <p>{selectedCompletionSet.totalItems} cards · {selectedCompletionSet.completionPercent.toFixed(0)}% complete</p>
                                  </button>
                                  {completionSetSubsets.map(subset => {
                                    const subItems = completionSetAllItems.filter(i => i.raw?.subcollectble_set_id === subset.id)
                                    const subOwned = subItems.filter(i => Boolean(ownedItemsByCatalogId[i.item_id])).length
                                    const subPct = subItems.length > 0 ? (subOwned / subItems.length) * 100 : 0
                                    return (
                                      <button
                                        key={subset.id}
                                        type="button"
                                        className="catalog-card completion-subset-card"
                                        onClick={() => setCompletionNavSubset(subset.id)}
                                      >
                                        <strong>{subset.name}</strong>
                                        <p>{subOwned} / {subItems.length} · {subPct.toFixed(0)}% complete</p>
                                        <div className="completion-sheet-progress-track" style={{ marginTop: 8 }}>
                                          <div className="completion-sheet-progress-fill" style={{ width: `${Math.min(subPct, 100)}%` }} />
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              ) : selectedCompletionSetEntries.length === 0 ? (
                                <p className="collection-muted completion-sheet-empty">No items tracked for this set yet.</p>
                              ) : (
                                <div className="completion-sheet-grid">
                                  {selectedCompletionSetEntries.map((entry, index) => {
                                    const na = (v) => (v && v !== 'N/A' ? v : '')
                                    const r = entry.raw
                                    const catalogItemObj = r ? {
                                      id:                 r.item_id,
                                      name:               entry.itemName,
                                      description:        r.description || '',
                                      release_year:       r.release_year || null,
                                      category_id:        r.category_id,
                                      subcategory_id:     r.subcategory_id,
                                      franchise_id:       r.franchise_id,
                                      collectible_set_id: r.collectible_set_id,
                                      brand_id:           r.brand_id,
                                      categoryName:       na(r.category),
                                      subcategoryName:    na(r.subcategory),
                                      brandName:          na(r.brand),
                                      card_number:        r.card_number !== 'N/A' ? r.card_number : null,
                                      print_count:        r.print_count,
                                      metadata:           { image_url: entry.imageUrl, set: na(r.collectible_set) },
                                      dynamic_fields:     {},
                                      _subject_name:      na(r.subject),
                                      _set_name:          na(r.collectible_set),
                                      _print_type:        na(r.print_type),
                                      _brand_name:        na(r.brand),
                                      _franchise_name:    na(r.franchise),
                                      _details:           r,
                                      front_image_path:   r.front_image_path || null,
                                    } : null
                                    return (
                                      <button
                                        key={`sheet-${entry.id}`}
                                        type="button"
                                        className={`completion-sheet-item${entry.isOwned ? ' owned' : ' missing'}`}
                                        onClick={() => catalogItemObj && setCompletionSheetPopup({ entry, catalogItemObj })}
                                      >
                                        <span className="completion-sheet-num">{index + 1}</span>
                                        <div className="completion-sheet-figure">
                                          {entry.imageUrl ? (
                                            <img src={entry.imageUrl} alt={entry.itemName} className="completion-sheet-img" />
                                          ) : (
                                            <svg className="completion-sheet-silhouette" viewBox="0 0 40 72" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                              <circle cx="20" cy="9" r="8" />
                                              <rect x="10" y="19" width="20" height="24" rx="4" />
                                              <rect x="6" y="19" width="8" height="18" rx="3" />
                                              <rect x="26" y="19" width="8" height="18" rx="3" />
                                              <rect x="11" y="43" width="8" height="20" rx="3" />
                                              <rect x="21" y="43" width="8" height="20" rx="3" />
                                            </svg>
                                          )}
                                        </div>
                                        <p className="completion-sheet-label">{entry.itemName}</p>
                                        {entry.isOwned && entry.quantity > 1 && (
                                          <span className="completion-sheet-qty">×{entry.quantity}</span>
                                        )}
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          ) : null
                        ) : completionNavBrand && completionIsLego && completionFacetStage === 'subtheme' ? (
                          /* LEGO facet: Subtheme blocks */
                          <section className="completion-block-grid">
                            {completionSubthemes.map((st) => {
                              const r = rollupCards(completionBrandSetCards.filter(c => c._subtheme === st))
                              return (
                                <article key={st} className="catalog-card completion-nav-block" role="button" tabIndex={0}
                                  onClick={() => { setCompletionNavProductLine(''); setCompletionNavSubtheme(st) }}
                                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCompletionNavProductLine(''); setCompletionNavSubtheme(st) } }}>
                                  <div className="completion-nav-block-head"><strong>{st}</strong><span className="completion-nav-block-pct">{r.percent.toFixed(1)}%</span></div>
                                  <div className="collection-allocation-bar-track"><div className="collection-allocation-bar-fill" style={{ width: `${Math.min(r.percent, 100)}%` }} /></div>
                                  <div className="completion-nav-block-meta"><span>{r.ownedCount} / {r.totalItems}</span></div>
                                </article>
                              )
                            })}
                          </section>
                        ) : completionNavBrand && completionIsLego && completionFacetStage === 'productLine' ? (
                          /* LEGO facet: Product Line blocks */
                          <section className="completion-block-grid">
                            {completionProductLines.map((pl) => {
                              const r = rollupCards(completionAfterSubtheme.filter(c => c._productLine === pl))
                              return (
                                <article key={pl} className="catalog-card completion-nav-block" role="button" tabIndex={0}
                                  onClick={() => setCompletionNavProductLine(pl)}
                                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCompletionNavProductLine(pl) } }}>
                                  <div className="completion-nav-block-head"><strong>{pl}</strong><span className="completion-nav-block-pct">{r.percent.toFixed(1)}%</span></div>
                                  <div className="collection-allocation-bar-track"><div className="collection-allocation-bar-fill" style={{ width: `${Math.min(r.percent, 100)}%` }} /></div>
                                  <div className="completion-nav-block-meta"><span>{r.ownedCount} / {r.totalItems}</span></div>
                                </article>
                              )
                            })}
                          </section>
                        ) : completionNavBrand ? (
                          /* Leaf collection cards (single one auto-opens to the orange items) */
                          (completionIsLego ? completionAfterProductLine : completionBrandSetCards).length === 0 ? (
                            <article className="catalog-card catalog-loading-panel">No items here yet.</article>
                          ) : (
                            <section className="collection-goal-grid" aria-label="Sets">
                              {(completionIsLego ? completionAfterProductLine : completionBrandSetCards).map((setCard) => (
                                <article
                                  key={`started-set-${setCard.id}`}
                                  className="catalog-card collection-goal-card"
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => setSelectedCompletionSetId(setCard.id)}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                      event.preventDefault()
                                      setSelectedCompletionSetId(setCard.id)
                                    }
                                  }}
                                >
                                  <div className="collection-goal-card-head">
                                    <div>
                                      <h3>{setCard.title}</h3>
                                      <p>{setCard.categoryName}</p>
                                    </div>
                                    <button type="button" className="catalog-action-pill" onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedCompletionSetId(setCard.id)
                                    }}>
                                      View
                                    </button>
                                  </div>
                                  <div className="collection-goal-progress-row">
                                    <strong>{setCard.ownedCount} / {setCard.totalItems}</strong>
                                    <span>{setCard.completionPercent.toFixed(1)}% Complete</span>
                                  </div>
                                  <div className="collection-allocation-bar-track">
                                    <div className="collection-allocation-bar-fill" style={{ width: `${Math.min(setCard.completionPercent, 100)}%` }} />
                                  </div>
                                  <div className="collection-goal-metrics">
                                    <span>Missing: {setCard.missingCount}</span>
                                    <span>Owned Value: {formatUsd(setCard.ownedValue)}</span>
                                  </div>
                                </article>
                              ))}
                            </section>
                          )
                        ) : completionNavFranchise ? (
                          /* Brand blocks */
                          Object.keys(completionBrandGroups).length === 0 ? (
                            <article className="catalog-card catalog-loading-panel">No sets started for this franchise yet.</article>
                          ) : (
                            <section className="completion-block-grid">
                              {Object.entries(completionBrandGroups).sort(([a], [b]) => a.localeCompare(b)).map(([brandName, cards]) => {
                                const r = rollupCards(cards)
                                return (
                                  <article
                                    key={brandName}
                                    className="catalog-card completion-nav-block"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setCompletionNavBrand(brandName)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCompletionNavBrand(brandName) } }}
                                  >
                                    <div className="completion-nav-block-head">
                                      <strong>{brandName}</strong>
                                      <span className="completion-nav-block-pct">{r.percent.toFixed(1)}%</span>
                                    </div>
                                    <div className="collection-allocation-bar-track">
                                      <div className="collection-allocation-bar-fill" style={{ width: `${Math.min(r.percent, 100)}%` }} />
                                    </div>
                                    <div className="completion-nav-block-meta">
                                      <span>{r.ownedCount} / {r.totalItems}</span>
                                      <span>{r.setsStarted} {r.setsStarted === 1 ? 'set' : 'sets'}</span>
                                    </div>
                                  </article>
                                )
                              })}
                            </section>
                          )
                        ) : completionNavSubcategory ? (
                          /* Franchise blocks */
                          Object.keys(completionFranchiseGroups).length === 0 ? (
                            <article className="catalog-card catalog-loading-panel">No sets started in this subcategory yet.</article>
                          ) : (
                            <section className="completion-block-grid">
                              {Object.entries(completionFranchiseGroups).sort(([a], [b]) => a.localeCompare(b)).map(([franchiseName, cards]) => {
                                const r = rollupCards(cards)
                                return (
                                  <article
                                    key={franchiseName}
                                    className="catalog-card completion-nav-block"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setCompletionNavFranchise(franchiseName)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCompletionNavFranchise(franchiseName) } }}
                                  >
                                    <div className="completion-nav-block-head">
                                      <strong>{franchiseName}</strong>
                                      <span className="completion-nav-block-pct">{r.percent.toFixed(1)}%</span>
                                    </div>
                                    <div className="collection-allocation-bar-track">
                                      <div className="collection-allocation-bar-fill" style={{ width: `${Math.min(r.percent, 100)}%` }} />
                                    </div>
                                    <div className="completion-nav-block-meta">
                                      <span>{r.ownedCount} / {r.totalItems}</span>
                                      <span>{r.setsStarted} {r.setsStarted === 1 ? 'set' : 'sets'}</span>
                                    </div>
                                  </article>
                                )
                              })}
                            </section>
                          )
                        ) : completionNavCategory ? (
                          /* Subcategory blocks */
                          Object.keys(completionSubcategoryGroups).length === 0 ? (
                            <article className="catalog-card catalog-loading-panel">No sets started in this category yet.</article>
                          ) : (
                            <section className="completion-block-grid">
                              {Object.entries(completionSubcategoryGroups).sort(([a], [b]) => a.localeCompare(b)).map(([subcatName, cards]) => {
                                const r = rollupCards(cards)
                                return (
                                  <article
                                    key={subcatName}
                                    className="catalog-card completion-nav-block"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setCompletionNavSubcategory(subcatName)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCompletionNavSubcategory(subcatName) } }}
                                  >
                                    <div className="completion-nav-block-head">
                                      <strong>{subcatName}</strong>
                                      <span className="completion-nav-block-pct">{r.percent.toFixed(1)}%</span>
                                    </div>
                                    <div className="collection-allocation-bar-track">
                                      <div className="collection-allocation-bar-fill" style={{ width: `${Math.min(r.percent, 100)}%` }} />
                                    </div>
                                    <div className="completion-nav-block-meta">
                                      <span>{r.ownedCount} / {r.totalItems}</span>
                                      <span>{r.setsStarted} {r.setsStarted === 1 ? 'set' : 'sets'}</span>
                                    </div>
                                  </article>
                                )
                              })}
                            </section>
                          )
                        ) : (
                          /* Category blocks — default view */
                          Object.keys(completionCategoryGroups).length === 0 ? (
                            <article className="catalog-card catalog-loading-panel">
                              No collection categories found yet. Add items to your collection to see completion progress.
                            </article>
                          ) : (
                            <section className="completion-block-grid">
                              {Object.entries(completionCategoryGroups).sort(([a], [b]) => a.localeCompare(b)).map(([catName, cards]) => {
                                const r = rollupCards(cards)
                                return (
                                  <article
                                    key={catName}
                                    className="catalog-card completion-nav-block"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => { setCompletionNavCategory(catName); setCompletionNavSubcategory(''); setCompletionNavFranchise(''); setCompletionNavBrand('') }}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCompletionNavCategory(catName); setCompletionNavSubcategory(''); setCompletionNavFranchise(''); setCompletionNavBrand('') } }}
                                  >
                                    <div className="completion-nav-block-head">
                                      <strong>{catName}</strong>
                                      <span className="completion-nav-block-pct">{r.percent.toFixed(1)}%</span>
                                    </div>
                                    <div className="collection-allocation-bar-track">
                                      <div className="collection-allocation-bar-fill" style={{ width: `${Math.min(r.percent, 100)}%` }} />
                                    </div>
                                    <div className="completion-nav-block-meta">
                                      <span>{r.ownedCount} / {r.totalItems}</span>
                                      <span>{r.setsStarted} {r.setsStarted === 1 ? 'set' : 'sets'}</span>
                                    </div>
                                  </article>
                                )
                              })}
                            </section>
                          )
                        )}
                    </div>
                    </>
                  ) : (
                    <>
                      <section className="collection-summary-grid" aria-label="Collection summary">
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">Unique Items</p>
                          <strong>{collectionSummary.uniqueItems}</strong>
                        </article>
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">Total Copies</p>
                          <strong>{collectionSummary.totalCopies}</strong>
                        </article>
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">Graded Copies</p>
                          <strong>{collectionSummary.gradedCopies}</strong>
                        </article>
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">Total Invested</p>
                          <strong>{formatUsd(collectionSummary.totalInvested)}</strong>
                        </article>
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">Collection Value</p>
                          <strong>{formatUsd(collectionSummary.totalValue)}</strong>
                        </article>
                      </section>

                      <section className="collection-list" aria-label="Collection items">
                        {paginatedCollectionItems.map((item) => {
                          const averageCost = item.pricedCopies > 0 ? item.totalInvested / item.pricedCopies : null
                          const primaryAcquisitionType = Object.entries(item.acquisitionTypes || {}).sort((left, right) => right[1] - left[1])[0]?.[0] || ''
                          const primaryLocationId = Array.isArray(item.locationIds) && item.locationIds.length > 0 ? item.locationIds[0] : ''

                          return (
                            <article key={`collection-item-${item.id}`} className="catalog-card collection-item-row">
                              {item.imageUrl ? (
                                <img className="collection-item-image" src={item.imageUrl} alt={item.name} loading="lazy" />
                              ) : (
                                <div className="collection-item-image collection-item-image-placeholder">No image</div>
                              )}

                              <div className="collection-item-body">
                                <h3>{item.name}</h3>
                                <p className="collection-item-meta">
                                  {item.releaseYear ? `${item.releaseYear}` : 'Year N/A'}
                                  {primaryAcquisitionType
                                    ? ` | ${COLLECTION_ACQUISITION_TYPE_LABELS[primaryAcquisitionType] || primaryAcquisitionType}`
                                    : ''}
                                  {/* Taxonomy: franchise + item type surface for every
                                      category (LEGO theme/type, Toy franchise/type). */}
                                  {item.franchiseName ? ` | ${item.franchiseName}` : ''}
                                  {item.setName ? ` | ${item.setName}` : ''}
                                  {item.brandName ? ` | ${item.brandName}` : ''}
                                  {item.categoryName ? ` | ${item.categoryName}` : ''}
                                </p>
                                <div className="collection-item-stats">
                                  <span>Qty: {item.totalQuantity}</span>
                                  <span>Certs: {item.certCount}</span>
                                  <span>Avg Cost: {averageCost == null ? 'N/A' : formatUsd(averageCost)}</span>
                                  <span>Invested: {formatUsd(item.totalInvested)}</span>
                                </div>
                                <p className="collection-item-organization-row">
                                  Collection(s): {item.collectionNames.length > 0 ? item.collectionNames.join(', ') : 'Unassigned'}
                                </p>
                                <p className="collection-item-organization-row">
                                  Location: {item.primaryLocationPath || 'Unassigned'}
                                </p>
                              </div>

                              <div className="collection-item-actions">
                                <select
                                  value={primaryLocationId}
                                  onChange={(event) => handleAssignStorageLocationToItem(item, event.target.value)}
                                  disabled={isSavingCollectionOrganization}
                                  aria-label={`Storage location for ${item.name}`}
                                >
                                  <option value="">Unassigned</option>
                                  {storageLocations.map((location) => (
                                    <option key={`item-location-${item.id}-${location.id}`} value={location.id}>
                                      {storageLocationPathById[location.id] || location.name}
                                    </option>
                                  ))}
                                </select>

                                {assignableCustomCollections.map((collection) => {
                                  const isAssigned = Array.isArray(item.collectionIds) && item.collectionIds.includes(collection.id)
                                  return (
                                    <button
                                      key={`item-collection-${item.id}-${collection.id}`}
                                      type="button"
                                      className={`catalog-action-pill ${isAssigned ? 'active' : ''}`}
                                      onClick={() => handleToggleCollectionMembership(item, collection.id)}
                                      disabled={isSavingCollectionOrganization}
                                    >
                                      {isAssigned ? '✓ ' : ''}{collection.name}
                                    </button>
                                  )
                                })}

                                <button
                                  type="button"
                                  className="catalog-action-pill"
                                  onClick={() => handleOpenCollectionItemDetails(item)}
                                >
                                  View Details
                                </button>

                                <button
                                  type="button"
                                  className="catalog-action-pill"
                                  onClick={() => {
                                    if (item.catalogItem) {
                                      handleOpenCatalogItem(item.catalogItem)
                                    }
                                  }}
                                  disabled={!item.catalogItem}
                                >
                                  View Catalog Card
                                </button>

                                {removeConfirmItemId === item.id ? (
                                  <div className="collection-item-remove-confirm">
                                    {item.totalQuantity > 1 ? (
                                      <>
                                        <span className="collection-item-remove-label">Remove:</span>
                                        <button type="button" className="collection-item-remove-choice" onClick={() => handleRemoveCollectionItem(item, 'one')}>1 copy</button>
                                        <button type="button" className="collection-item-remove-choice collection-item-remove-all" onClick={() => handleRemoveCollectionItem(item, 'all')}>All {item.totalQuantity}</button>
                                        <button type="button" className="collection-item-remove-cancel" onClick={() => setRemoveConfirmItemId('')}>Cancel</button>
                                      </>
                                    ) : (
                                      <>
                                        <span className="collection-item-remove-label">Remove item?</span>
                                        <button type="button" className="collection-item-remove-choice collection-item-remove-all" onClick={() => handleRemoveCollectionItem(item, 'all')}>Yes</button>
                                        <button type="button" className="collection-item-remove-cancel" onClick={() => setRemoveConfirmItemId('')}>No</button>
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="catalog-action-pill collection-item-remove-btn"
                                    onClick={() => setRemoveConfirmItemId(item.id)}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </article>
                          )
                        })}
                      </section>

                      {collectionOverviewTotalPages > 1 ? (
                        <div className="catalog-pagination" aria-label="Collection overview pagination">
                          <button
                            type="button"
                            className="catalog-pagination-btn"
                            onClick={() => setCollectionOverviewPage((currentPage) => Math.max(1, currentPage - 1))}
                            disabled={collectionOverviewPage <= 1}
                          >
                            Previous
                          </button>
                          <span className="catalog-pagination-page">
                            Page{' '}
                            <input
                              type="number"
                              className="catalog-pagination-input"
                              min={1}
                              max={collectionOverviewTotalPages}
                              value={collectionOverviewPageInput}
                              onChange={(e) => setCollectionOverviewPageInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                              onBlur={() => {
                                const n = parseInt(collectionOverviewPageInput, 10)
                                if (!Number.isFinite(n)) { setCollectionOverviewPageInput(String(collectionOverviewPage)); return }
                                const clamped = Math.min(collectionOverviewTotalPages, Math.max(1, n))
                                setCollectionOverviewPage(clamped)
                                setCollectionOverviewPageInput(String(clamped))
                              }}
                              aria-label="Go to page"
                            />
                            {' '}/ {collectionOverviewTotalPages}
                          </span>
                          <button
                            type="button"
                            className="catalog-pagination-btn"
                            onClick={() => setCollectionOverviewPage((currentPage) => Math.min(collectionOverviewTotalPages, currentPage + 1))}
                            disabled={collectionOverviewPage >= collectionOverviewTotalPages}
                          >
                            Next
                          </button>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            )}
          </section>
  )
}
