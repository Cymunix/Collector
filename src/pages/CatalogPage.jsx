import React from 'react'

export default function CatalogPage({ scope }) {
  const {
    CARD_CONDITION_CATEGORIES,
    CatalogAdminPanel,
    MTG_CARD_TREATMENT_NAMES,
    SPORTS_CARD_TYPE_NAMES,
    admin,
    allVisibleCatalogItemsSelected,
    bulkImportApprove,
    bulkImportCreatingPrintType,
    bulkImportIdx,
    bulkImportIsSaving,
    bulkImportMode,
    bulkImportNewPrintTypeName,
    bulkImportRows,
    bulkImportSaveError,
    bulkImportSaveProgress,
    bulkImportSheetSummary,
    bulkImportSkip,
    bulkImportSpeciesList,
    bulkImportSubjectResults,
    bulkImportSubjectSearch,
    bulkImportTeamSearch,
    bulkPhotoAnalyzeProgress,
    bulkPhotoAnalyzing,
    bulkPhotoApprove,
    bulkPhotoApproveAll,
    bulkPhotoIdx,
    bulkPhotoIsSaving,
    bulkPhotoManualResults,
    bulkPhotoManualSearch,
    bulkPhotoMode,
    bulkPhotoPhase,
    bulkPhotoPosition,
    bulkPhotoPrintTypeId,
    bulkPhotoRows,
    bulkPhotoSaveError,
    bulkPhotoSaveProgress,
    bulkPhotoSkip,
    catalogActiveContextRows,
    catalogAdminBackImageFile,
    catalogAdminBrandId,
    catalogAdminBrands,
    catalogAdminBricklinkId,
    catalogAdminCardNumber,
    catalogAdminCardTypeIds,
    catalogAdminCardTypes,
    catalogAdminCategories,
    catalogAdminCategoryId,
    catalogAdminFormError,
    catalogAdminFranchiseId,
    catalogAdminFranchises,
    catalogAdminFrontImageFile,
    catalogAdminInlineCreate,
    catalogAdminIsMtg,
    catalogAdminItemDescription,
    catalogAdminLegoSetNumber,
    catalogAdminMtgCardTypeId,
    catalogAdminPackagingId,
    catalogAdminPackagingList,
    catalogAdminPieceCount,
    catalogAdminPrintCount,
    catalogAdminPrintTypeId,
    catalogAdminPrintTypes,
    catalogAdminProductLineIds,
    catalogAdminProductLinesList,
    catalogAdminRarityId,
    catalogAdminRealFranchiseId,
    catalogAdminRealFranchises,
    catalogAdminRebrickableId,
    catalogAdminReleaseYear,
    catalogAdminRetailPrice,
    catalogAdminSeriesId,
    catalogAdminSeriesList,
    catalogAdminSpecies,
    catalogAdminSubcategories,
    catalogAdminSubcategoryId,
    catalogAdminSubjectIds,
    catalogAdminSubjectIsSearching,
    catalogAdminSubjectResults,
    catalogAdminSubjectSearch,
    catalogAdminSubsetId,
    catalogAdminSubsetSel,
    catalogAdminSubsets,
    catalogAdminSubsetsList,
    catalogAdminTeamIds,
    catalogAdminTeams,
    catalogAdminUpc,
    catalogAlbumResults,
    catalogAlbumSearch,
    catalogAlbumSearching,
    catalogAllCardTypes,
    catalogBrandById,
    catalogBrandId,
    catalogBulkBrandOptions,
    catalogBulkEditError,
    catalogBulkEditMessage,
    catalogBulkEditValues,
    catalogBulkSelectedIds,
    catalogBulkSetOptions,
    catalogCardTypeIds,
    catalogCategory,
    catalogCategoryById,
    catalogCategoryOptions,
    catalogContextThemeText,
    catalogFranchiseLinkedBrands,
    catalogFranchiseOptions,
    catalogFranchiseSearch,
    catalogItemNumbers,
    catalogListPricing,
    catalogListStats,
    catalogLoadError,
    catalogMaxYear,
    catalogMinYear,
    catalogMtgCardTypes,
    catalogPage,
    catalogPageInput,
    catalogPrintTypeId,
    catalogPrintTypes,
    catalogProductLineId,
    catalogProductLineOptions,
    catalogRarities,
    catalogRarityId,
    catalogSeriesId,
    catalogSeriesOptions,
    catalogSetId,
    catalogSets,
    catalogSidebarLabels,
    catalogSortKey,
    catalogSubcategory,
    catalogSubcategoryById,
    catalogSubcategoryOptions,
    catalogSubjectId,
    catalogSubjectResults,
    catalogSubjectSearch,
    catalogSubjectSearching,
    catalogSubsetId,
    catalogSubsets,
    catalogSubthemeId,
    catalogSubthemeOptions,
    catalogTeamId,
    catalogTeams,
    catalogThemeImageUrl,
    catalogThemeShortDesc,
    catalogThemeStats,
    catalogTotalItemCount,
    catalogTotalPages,
    catalogViewMode,
    currentUser,
    deriveMinifigShorthand,
    filteredCatalogItems,
    formatUsd,
    getCategoryLabels,
    handleApplyCatalogBulkEdit,
    handleBulkCreatePrintType,
    handleBulkImportFile,
    handleBulkImportSave,
    handleBulkPhotoFolder,
    handleBulkPhotoSave,
    handleCatalogAdminInlineSave,
    handleCatalogAdminRemoveSubject,
    handleCatalogAdminSelectSubject,
    handleClearCatalogBulkSelection,
    handleCreateCatalogItemInApp,
    handleOpenAddToCollectionModal,
    handleOpenCatalogItem,
    handleSelectAllCatalogPageItems,
    handleToggleCatalogBulkSelect,
    hasCatalogActiveContext,
    hasCollectorPlusAccess,
    imageQueueCount,
    imageQueueLoading,
    isApplyingCatalogBulkEdit,
    isCatalogAdminPanelOpen,
    isCatalogBulkEditMode,
    isCatalogItemModalOpen,
    isCatalogLoading,
    isCreatingCatalogItem,
    isPlatformAdmin,
    isSavingCatalogAdminInline,
    legoPropertyRegistry,
    ownedCatalogItemCounts,
    paginatedCatalogItemIds,
    paginatedCatalogItems,
    performQuickAdd,
    quickAddMode,
    quickAddPrice,
    selectedCatalogAdminCategoryName,
    selectedCatalogBulkFranchiseIds,
    selectedCatalogFranchiseRecord,
    setBulkImportCreatingPrintType,
    setBulkImportIdx,
    setBulkImportMode,
    setBulkImportNewPrintTypeName,
    setBulkImportRows,
    setBulkImportSheetSummary,
    setBulkImportSubjectResults,
    setBulkImportSubjectSearch,
    setBulkImportTeamSearch,
    setBulkPhotoIdx,
    setBulkPhotoManualResults,
    setBulkPhotoManualSearch,
    setBulkPhotoMode,
    setBulkPhotoPhase,
    setBulkPhotoPosition,
    setBulkPhotoPrintTypeId,
    setBulkPhotoRows,
    setCatalogAdminBackImageFile,
    setCatalogAdminBrandId,
    setCatalogAdminBricklinkId,
    setCatalogAdminCardNumber,
    setCatalogAdminCardTypeIds,
    setCatalogAdminCategoryId,
    setCatalogAdminFormError,
    setCatalogAdminFranchiseId,
    setCatalogAdminFrontImageFile,
    setCatalogAdminInlineCreate,
    setCatalogAdminItemDescription,
    setCatalogAdminLegoSetNumber,
    setCatalogAdminMtgCardTypeId,
    setCatalogAdminPackagingId,
    setCatalogAdminPieceCount,
    setCatalogAdminPrintCount,
    setCatalogAdminPrintTypeId,
    setCatalogAdminProductLineIds,
    setCatalogAdminRarityId,
    setCatalogAdminRealFranchiseId,
    setCatalogAdminRebrickableId,
    setCatalogAdminReleaseYear,
    setCatalogAdminRetailPrice,
    setCatalogAdminSeriesId,
    setCatalogAdminSubcategoryId,
    setCatalogAdminSubjectIds,
    setCatalogAdminSubjectResults,
    setCatalogAdminSubjectSearch,
    setCatalogAdminSubsetId,
    setCatalogAdminSubsetSel,
    setCatalogAdminTeamIds,
    setCatalogAdminUpc,
    setCatalogAlbumResults,
    setCatalogAlbumSearch,
    setCatalogBrandId,
    setCatalogBulkEditValues,
    setCatalogBulkSelectedIds,
    setCatalogCardTypeIds,
    setCatalogCategory,
    setCatalogFranchise,
    setCatalogFranchiseSearch,
    setCatalogListStats,
    setCatalogMaxYear,
    setCatalogMinYear,
    setCatalogPage,
    setCatalogPageInput,
    setCatalogPrintTypeId,
    setCatalogProductLineId,
    setCatalogRarityId,
    setCatalogReloadToken,
    setCatalogSeriesId,
    setCatalogSetId,
    setCatalogSortKey,
    setCatalogSubcategory,
    setCatalogSubjectId,
    setCatalogSubjectResults,
    setCatalogSubjectSearch,
    setCatalogSubsetId,
    setCatalogSubthemeId,
    setCatalogTeamId,
    setCatalogViewMode,
    setIsCatalogAdminPanelOpen,
    setIsCatalogBulkEditMode,
    setIsCatalogItemModalOpen,
    setQuickAddMode,
    setQuickAddPrice,
    setSelectedCatalogItem,
    setWishlistItemIds,
    startImageQueue,
    supabase,
    t,
    themeStatName,
    themeStatPct,
    updateBulkPhotoRow,
    updateBulkRow,
    wishlistItemIds
  } = scope
  return (
          <section className="catalog-screen" aria-label="Catalog">
            <div className="catalog-sticky-top">
            <div className="catalog-head">
              <div>
                <h1>{t('catalogPageTitle')}</h1>
                <p className="subtitle catalog-subtitle">{t('catalogPageSubtitle')}</p>
              </div>

              <div className="catalog-actions">
                <label className="catalog-sort-wrap" htmlFor="catalog-sort-select">
                  <span>{t('sortLabel')}</span>
                  <select
                    id="catalog-sort-select"
                    value={catalogSortKey}
                    onChange={(event) => setCatalogSortKey(event.target.value)}
                  >
                    <option value="newest_year">{t('sortNewestYear')}</option>
                    <option value="oldest_year">Oldest Year</option>
                    <option value="subject_az">Subject A–Z</option>
                    <option value="card_number_asc">Card # (Low–High)</option>
                    <option value="card_number_desc">Card # (High–Low)</option>
                  </select>
                </label>

                <button type="button" className="catalog-action-pill">
                  {t('suggestItemAction')}
                </button>
                {isPlatformAdmin && (
                  <>
                    <button
                      type="button"
                      className="catalog-action-pill"
                      onClick={() => {
                        setCatalogAdminFormError('')
                        setCatalogAdminItemDescription('')
                        setCatalogAdminCardNumber('')
                        setCatalogAdminPrintCount('')
                        setCatalogAdminRealFranchiseId('')
                        setCatalogAdminSubjectIds([])
                        setCatalogAdminTeamIds([])
                        setCatalogAdminPrintTypeId('')
                        setCatalogAdminCardTypeIds([])
                        setCatalogAdminSubsetId('')
                        setCatalogAdminFranchiseId('')
                        setCatalogAdminBrandId('')
                        setCatalogAdminFrontImageFile(null)
                        setCatalogAdminBackImageFile(null)
                        setIsCatalogItemModalOpen(true)
                      }}
                    >
                      {t('addItemAction')}
                    </button>
                    <button
                      type="button"
                      className="catalog-action-pill"
                      onClick={() => setIsCatalogAdminPanelOpen(true)}
                    >
                      Manage Catalog
                    </button>
                    <button
                      type="button"
                      className={`catalog-action-pill${isCatalogBulkEditMode ? ' active' : ''}`}
                      onClick={() => {
                        setIsCatalogBulkEditMode((current) => !current)
                        if (isCatalogBulkEditMode) setCatalogBulkSelectedIds(new Set())
                      }}
                    >
                      {isCatalogBulkEditMode ? 'Exit Bulk Edit' : 'Bulk Edit'}
                    </button>
                    <button
                      type="button"
                      className="catalog-action-pill"
                      disabled={imageQueueLoading || imageQueueCount === 0}
                      title="Step through every catalogue item that has no image"
                      onClick={startImageQueue}
                    >
                      {imageQueueLoading ? 'Loading…' : `Image Queue${imageQueueCount != null ? ` (${imageQueueCount})` : ''}`}
                    </button>
                  </>
                )}
                <button type="button" className="catalog-action-pill">
                  {t('mySuggestionsAction')}
                </button>
                <button
                  type="button"
                  className="catalog-action-pill"
                  onClick={() => {
                    setCatalogPage(1)
                    setCatalogReloadToken((currentToken) => currentToken + 1)
                  }}
                >
                  {t('refreshAction')}
                </button>
              </div>
            </div>

            {/* Quick Add bar */}
            {currentUser && (
              <div className="quick-add-bar">
                <label className="quick-add-toggle-wrap">
                  <span className="quick-add-label">Quick Add</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!!quickAddMode}
                    className={`quick-add-switch${quickAddMode ? ' quick-add-switch--on' : ''}`}
                    onClick={() => setQuickAddMode(m => m ? '' : 'gift')}
                  />
                </label>
                {quickAddMode && (
                  <div className="quick-add-options">
                    <button
                      type="button"
                      className={`quick-add-mode-btn${quickAddMode === 'gift' ? ' quick-add-mode-btn--active' : ''}`}
                      onClick={() => setQuickAddMode('gift')}
                    >
                      Gift
                    </button>
                    <button
                      type="button"
                      className={`quick-add-mode-btn${quickAddMode === 'purchase' ? ' quick-add-mode-btn--active' : ''}`}
                      onClick={() => setQuickAddMode('purchase')}
                    >
                      Purchase
                    </button>
                    {quickAddMode === 'purchase' && (
                      <div className="quick-add-price-wrap">
                        <span className="quick-add-price-symbol">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="quick-add-price-input"
                          value={quickAddPrice}
                          onChange={e => setQuickAddPrice(e.target.value)}
                        />
                      </div>
                    )}
                    <span className="quick-add-hint">
                      {quickAddMode === 'gift'
                        ? 'Click Collect to instantly add as a gift'
                        : quickAddPrice
                          ? `Click Collect to instantly add at $${Number(quickAddPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : 'Enter a price then click Collect'}
                    </span>
                  </div>
                )}
              </div>
            )}
            </div>

            <div className={`catalog-layout${catalogViewMode === 'list' ? ' catalog-layout-list-mode' : ''}`}>
              <aside className="catalog-card catalog-filters" aria-label="Catalog filters">
                <div className="catalog-card-head">
                  <h2>{t('filtersLabel')}</h2>
                  <button
                    type="button"
                    className="catalog-clear-btn"
                    onClick={() => {
                      setCatalogCategory('all')
                      setCatalogSubcategory('')
                      setCatalogFranchise('all')
                      setCatalogFranchiseSearch('')
                      setCatalogBrandId('')
                      setCatalogTeamId('')
                      setCatalogSetId('')
                      setCatalogSubsetId('')
                      setCatalogSubthemeId('')
                      setCatalogProductLineId('')
                      setCatalogSeriesId('')
                      setCatalogPrintTypeId('')
                      setCatalogCardTypeIds([])
                      setCatalogSubjectId('')
                      setCatalogSubjectSearch('')
                      setCatalogSubjectResults([])
                      setCatalogAlbumSearch('')
                      setCatalogAlbumResults([])
                      setCatalogMinYear('')
                      setCatalogMaxYear('')
                    }}
                  >
                    {t('clearAction')}
                  </button>
                </div>

                {/* Subject — typeahead search (category-scoped when a category is selected) */}
                <label>{catalogSidebarLabels.subject}</label>
                <div className="catalog-admin-subject-search-wrap">
                  <input
                    type="text"
                    value={catalogSubjectSearch}
                    placeholder={catalogSubjectSearching ? 'Searching…' : `Search ${catalogSidebarLabels.subject.toLowerCase()}…`}
                    style={{ width: '100%' }}
                    onChange={(event) => {
                      setCatalogSubjectSearch(event.target.value)
                      if (!event.target.value) { setCatalogSubjectId(''); setCatalogSubjectResults([]) }
                    }}
                  />
                  {catalogSubjectResults.length > 0 && (
                    <div className="catalog-admin-subject-results">
                      {catalogSubjectResults.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className="catalog-admin-subject-result"
                          onClick={() => {
                            setCatalogSubjectId(s.id)
                            setCatalogSubjectSearch(s.name)
                            setCatalogSubjectResults([])
                          }}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {catalogSubjectId && (
                    <div className="catalog-admin-subject-selected">
                      <span style={{ fontSize: '0.82rem' }}>{catalogSubjectSearch}</span>
                      <button
                        type="button"
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#5f7294', fontSize: '0.9rem' }}
                        onClick={() => { setCatalogSubjectId(''); setCatalogSubjectSearch(''); setCatalogSubjectResults([]) }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Category — standalone */}
                <label htmlFor="catalog-category">{t('categoryLabel')}</label>
                <select
                  id="catalog-category"
                  value={catalogCategory}
                  onChange={(event) => {
                    setCatalogCategory(event.target.value)
                    setCatalogSubcategory('')
                    if (event.target.value !== 'Music') { setCatalogAlbumSearch(''); setCatalogAlbumResults([]); setCatalogSetId('') }
                  }}
                >
                  <option value="all">All</option>
                  {catalogCategoryOptions.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                {/* Subcategory — cascades from category */}
                <label htmlFor="catalog-subcategory">{catalogSidebarLabels.subcategory}</label>
                <select
                  id="catalog-subcategory"
                  value={catalogSubcategory}
                  disabled={catalogCategory === 'all'}
                  onChange={(event) => setCatalogSubcategory(event.target.value)}
                >
                  <option value="">{catalogCategory === 'all' ? t('selectCategoryFirst') : 'All'}</option>
                  {catalogSubcategoryOptions.map((subcategory) => (
                    <option key={subcategory} value={subcategory}>{subcategory}</option>
                  ))}
                </select>

                {/* Franchise — global typeahead; works even when category/subcategory are not selected */}
                {!catalogSidebarLabels.hideFranchise && (
                  <>
                    <label>{catalogSidebarLabels.franchise}</label>
                    <div className="catalog-admin-subject-search-wrap">
                      <input
                        type="text"
                        list="catalog-franchise-options"
                        value={catalogFranchiseSearch}
                        placeholder="Search franchise/theme…"
                        style={{ width: '100%' }}
                        onChange={(event) => {
                          const nextValue = event.target.value
                          setCatalogFranchiseSearch(nextValue)
                          const exact = catalogFranchiseOptions.find((franchise) => franchise.name.toLowerCase() === nextValue.trim().toLowerCase())
                          if (exact) {
                            setCatalogFranchise(exact.id)
                            setCatalogFranchiseSearch(exact.name)
                            return
                          }
                          if (!nextValue.trim()) {
                            setCatalogFranchise('all')
                          }
                        }}
                      />
                      <datalist id="catalog-franchise-options">
                        {catalogFranchiseOptions.map((franchise) => (
                          <option key={franchise.id} value={franchise.name} />
                        ))}
                      </datalist>
                    </div>
                  </>
                )}

                {/* Brand — filtered to Music franchise brands when Music is selected */}
                <label htmlFor="catalog-brand">{catalogSidebarLabels.brand}</label>
                <select
                  id="catalog-brand"
                  value={catalogBrandId}
                  disabled={!selectedCatalogFranchiseRecord}
                  onChange={(event) => setCatalogBrandId(event.target.value)}
                >
                  <option value="">{selectedCatalogFranchiseRecord ? 'All' : 'Select franchise first'}</option>
                  {catalogFranchiseLinkedBrands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>

                {/* Team — cascades from franchise, only shown when options exist */}
                {catalogTeams.length > 0 && (
                  <>
                    <label htmlFor="catalog-team">Team</label>
                    <select
                      id="catalog-team"
                      value={catalogTeamId}
                      onChange={(event) => setCatalogTeamId(event.target.value)}
                    >
                      <option value="">All</option>
                      {catalogTeams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </>
                )}

                {/* Collectible Set — typeahead for Music, dropdown for others */}
                {catalogCategory === 'Music' ? (
                  <>
                    <label>{catalogSidebarLabels.collectibleSet}</label>
                    <div className="catalog-admin-subject-search-wrap">
                      <input
                        type="text"
                        value={catalogSetId ? (catalogAlbumSearch || '') : catalogAlbumSearch}
                        placeholder={catalogAlbumSearching ? 'Searching…' : 'Search albums…'}
                        style={{ width: '100%' }}
                        onChange={(e) => {
                          setCatalogAlbumSearch(e.target.value)
                          if (!e.target.value) setCatalogSetId('')
                        }}
                      />
                      {catalogAlbumResults.length > 0 && (
                        <div className="catalog-admin-subject-results">
                          {catalogAlbumResults.map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              className="catalog-admin-subject-result"
                              onClick={() => {
                                setCatalogSetId(a.id)
                                setCatalogAlbumSearch(a.name)
                                setCatalogAlbumResults([])
                              }}
                            >
                              {a.name}
                            </button>
                          ))}
                        </div>
                      )}
                      {catalogSetId && (
                        <div className="catalog-admin-subject-selected">
                          <span style={{ fontSize: '0.82rem' }}>{catalogAlbumSearch}</span>
                          <button
                            type="button"
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#5f7294', fontSize: '0.9rem' }}
                            onClick={() => { setCatalogSetId(''); setCatalogAlbumSearch(''); setCatalogAlbumResults([]) }}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : catalogSets.length > 0 ? (
                  <>
                    <label htmlFor="catalog-set">{catalogSidebarLabels.collectibleSet}</label>
                    <select
                      id="catalog-set"
                      value={catalogSetId}
                      onChange={(event) => setCatalogSetId(event.target.value)}
                    >
                      <option value="">All</option>
                      {catalogSets.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </>
                ) : null}

                {/* Subcollectible Set — cascades from set */}
                {catalogSubsets.length > 0 && (
                  <>
                    <label htmlFor="catalog-subset">{catalogSidebarLabels.subset}</label>
                    <select
                      id="catalog-subset"
                      value={catalogSubsetId}
                      onChange={(event) => setCatalogSubsetId(event.target.value)}
                    >
                      <option value="">All</option>
                      {catalogSubsets.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </>
                )}

                {/* Subtheme (faceted subsets) — cascades from Theme */}
                {catalogSubthemeOptions.length > 0 && (
                  <>
                    <label htmlFor="catalog-subtheme">{catalogSidebarLabels.subset}</label>
                    <select
                      id="catalog-subtheme"
                      value={catalogSubthemeId}
                      onChange={(event) => setCatalogSubthemeId(event.target.value)}
                    >
                      <option value="">All</option>
                      {catalogSubthemeOptions.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </>
                )}

                {/* Product Line (faceted) — cascades from Subtheme */}
                {catalogProductLineOptions.length > 0 && (
                  <>
                    <label htmlFor="catalog-productline">{catalogSidebarLabels.productLine}</label>
                    <select
                      id="catalog-productline"
                      value={catalogProductLineId}
                      onChange={(event) => setCatalogProductLineId(event.target.value)}
                    >
                      <option value="">All</option>
                      {catalogProductLineOptions.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </>
                )}

                {/* Series (facet) — scoped to Subcategory */}
                {catalogSeriesOptions.length > 0 && (
                  <>
                    <label htmlFor="catalog-series">Series</label>
                    <select
                      id="catalog-series"
                      value={catalogSeriesId}
                      onChange={(event) => setCatalogSeriesId(event.target.value)}
                    >
                      <option value="">All</option>
                      {catalogSeriesOptions.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </>
                )}

                {/* Print Type — cascades from subset */}
                {catalogPrintTypes.length > 0 && (
                  <>
                    <label htmlFor="catalog-print-type">Print Type</label>
                    <select
                      id="catalog-print-type"
                      value={catalogPrintTypeId}
                      onChange={(event) => setCatalogPrintTypeId(event.target.value)}
                    >
                      <option value="">All</option>
                      <option value="__none__">No print type</option>
                      {catalogPrintTypes.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </>
                )}

                {/* Card Treatment — checkboxes (cards only, filtered by subcategory) */}
                {CARD_CONDITION_CATEGORIES.has(catalogCategory) && (() => {
                  const isMtgFilter = catalogSubcategory === 'Magic: The Gathering'
                  const filterCardTypes = catalogAllCardTypes.filter(c => {
                    if (c.name === 'Normal') return false
                    return isMtgFilter ? MTG_CARD_TREATMENT_NAMES.has(c.name) : SPORTS_CARD_TYPE_NAMES.has(c.name)
                  })
                  if (!filterCardTypes.length) return null
                  return (
                    <div>
                      <label>Card Treatment</label>
                      <div className="catalog-admin-team-list catalog-filter-cardtype-grid">
                        {filterCardTypes.map(c => (
                          <label key={c.id} className="catalog-admin-team-checkbox">
                            <input
                              type="checkbox"
                              checked={catalogCardTypeIds.includes(c.id)}
                              onChange={e => setCatalogCardTypeIds(prev => e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id))}
                            />
                            <span>{c.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* Rarity — dropdown (MTG only) */}
                {catalogSubcategory === 'Magic: The Gathering' && catalogRarities.length > 0 && (
                  <div>
                    <label htmlFor="catalog-rarity">Rarity</label>
                    <select id="catalog-rarity" value={catalogRarityId} onChange={e => setCatalogRarityId(e.target.value)}>
                      <option value="">All</option>
                      {catalogRarities.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Year range */}
                <div className="catalog-year-grid">
                  <label htmlFor="catalog-min-year">
                    {t('minYearLabel')}
                    <input
                      id="catalog-min-year"
                      type="number"
                      min="1900"
                      max="2100"
                      placeholder="e.g. 1990"
                      value={catalogMinYear}
                      onChange={(event) => setCatalogMinYear(event.target.value)}
                    />
                  </label>
                  <label htmlFor="catalog-max-year">
                    {t('maxYearLabel')}
                    <input
                      id="catalog-max-year"
                      type="number"
                      min="1900"
                      max="2100"
                      placeholder="e.g. 2025"
                      value={catalogMaxYear}
                      onChange={(event) => setCatalogMaxYear(event.target.value)}
                    />
                  </label>
                </div>
              </aside>

              <div className="catalog-main-pane">
                {isCatalogLoading ? (
                  <div className="catalog-card catalog-loading-panel">{t('loadingCatalog')}</div>
                ) : catalogLoadError ? (
                  <div className="catalog-card catalog-loading-panel">{catalogLoadError}</div>
                ) : filteredCatalogItems.length === 0 ? (
                  <div className="catalog-card catalog-loading-panel">No catalog items found.</div>
                ) : (
                  <div>
                    <div className="catalog-view-bar">
                      <span className="catalog-view-count">{catalogTotalItemCount.toLocaleString()} items</span>
                      {isPlatformAdmin && isCatalogBulkEditMode && (
                        <div className="catalog-bulk-toolbar" role="group" aria-label="Bulk edit selection controls">
                          <button
                            type="button"
                            className="catalog-action-pill"
                            onClick={handleSelectAllCatalogPageItems}
                            disabled={paginatedCatalogItemIds.length === 0 || allVisibleCatalogItemsSelected}
                          >
                            Select Page
                          </button>
                          <button
                            type="button"
                            className="catalog-action-pill"
                            onClick={handleClearCatalogBulkSelection}
                            disabled={catalogBulkSelectedIds.size === 0}
                          >
                            Clear
                          </button>
                          <span className="catalog-bulk-count">{catalogBulkSelectedIds.size} selected</span>
                        </div>
                      )}
                      <div className="catalog-view-toggle">
                        <button
                          type="button"
                          className={`catalog-view-btn${catalogViewMode === 'grid' ? ' active' : ''}`}
                          onClick={() => setCatalogViewMode('grid')}
                          title="Grid view"
                          aria-label="Grid view"
                        >
                          <svg viewBox="0 0 16 16" fill="currentColor" width="15" height="15">
                            <rect x="1" y="1" width="6" height="6" rx="1.5"/>
                            <rect x="9" y="1" width="6" height="6" rx="1.5"/>
                            <rect x="1" y="9" width="6" height="6" rx="1.5"/>
                            <rect x="9" y="9" width="6" height="6" rx="1.5"/>
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={`catalog-view-btn${catalogViewMode === 'list' ? ' active' : ''}`}
                          onClick={() => setCatalogViewMode('list')}
                          title="List view"
                          aria-label="List view"
                        >
                          <svg viewBox="0 0 16 16" fill="currentColor" width="15" height="15">
                            <rect x="1" y="2" width="14" height="2.5" rx="1.25"/>
                            <rect x="1" y="6.75" width="14" height="2.5" rx="1.25"/>
                            <rect x="1" y="11.5" width="14" height="2.5" rx="1.25"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {isPlatformAdmin && isCatalogBulkEditMode && (
                      <section className="catalog-card catalog-bulk-edit-panel" aria-label="Bulk edit fields">
                        <div className="catalog-bulk-edit-head">
                          <h3>Bulk Update Selected Items</h3>
                          <p>Change collectible set for all selected items in one action. Franchise is not changed.</p>
                        </div>
                        <div className="catalog-bulk-edit-grid">
                          <label htmlFor="catalog-bulk-brand">Brand</label>
                          <select
                            id="catalog-bulk-brand"
                            value={catalogBulkEditValues.brand_id}
                            disabled={selectedCatalogBulkFranchiseIds.length !== 1}
                            onChange={(event) => setCatalogBulkEditValues((current) => ({
                              ...current,
                              brand_id: event.target.value,
                              collectible_set_id: '',
                            }))}
                          >
                            <option value="">{selectedCatalogBulkFranchiseIds.length === 1 ? 'Choose brand' : 'Select items from one franchise'}</option>
                            {catalogBulkBrandOptions.map((brand) => (
                              <option key={brand.id} value={brand.id}>{brand.name}</option>
                            ))}
                          </select>

                          <label htmlFor="catalog-bulk-set">Collectible Set</label>
                          <select
                            id="catalog-bulk-set"
                            value={catalogBulkEditValues.collectible_set_id}
                            disabled={selectedCatalogBulkFranchiseIds.length !== 1 || !catalogBulkEditValues.brand_id}
                            onChange={(event) => setCatalogBulkEditValues((current) => ({ ...current, collectible_set_id: event.target.value }))}
                          >
                            <option value="">{selectedCatalogBulkFranchiseIds.length === 1 && catalogBulkEditValues.brand_id ? 'Choose collectible set' : 'Choose brand first'}</option>
                            {catalogBulkSetOptions.map((setRow) => (
                              <option key={setRow.id} value={setRow.id}>{setRow.name}</option>
                            ))}
                          </select>
                        </div>

                        {(catalogBulkEditError || catalogBulkEditMessage) && (
                          <p className={`catalog-bulk-edit-feedback${catalogBulkEditError ? ' error' : ' success'}`}>
                            {catalogBulkEditError || catalogBulkEditMessage}
                          </p>
                        )}

                        <div className="catalog-bulk-edit-actions">
                          <button
                            type="button"
                            className="catalog-action-pill"
                            onClick={handleApplyCatalogBulkEdit}
                            disabled={isApplyingCatalogBulkEdit || catalogBulkSelectedIds.size === 0}
                          >
                            {isApplyingCatalogBulkEdit ? 'Applying…' : `Apply to ${catalogBulkSelectedIds.size} item${catalogBulkSelectedIds.size === 1 ? '' : 's'}`}
                          </button>
                        </div>
                      </section>
                    )}

                    {catalogViewMode === 'grid' ? (
                      <div className="catalog-results-grid">
                        {paginatedCatalogItems.map((item) => {
                          const categoryName     = catalogCategoryById[item.category_id] || ''
                          const franchiseName    = item._set_name || catalogItemNumbers[item.id] || 'Unassigned set'
                          const franchiseBrandName = item._franchise_name || ''
                          const subsetName       = item._details?.subcollectible_set || ''
                          const isCard           = CARD_CONDITION_CATEGORIES.has(categoryName)
                          const brandName        = item._brand_name || (item.brand_id ? catalogBrandById[item.brand_id] || 'Unknown brand' : '')
                          const isMusic          = categoryName === 'Music'
                          const itemCardLabels   = getCategoryLabels(categoryName)
                          const imageUrl         = item.front_image_path
                            ? item.front_image_path.startsWith('http')
                              ? item.front_image_path
                              : supabase.storage.from('item-images').getPublicUrl(item.front_image_path).data?.publicUrl
                            : ''

                          return (
                            <article
                              key={item.id}
                              className={`catalog-card catalog-item-card${isCatalogBulkEditMode && catalogBulkSelectedIds.has(item.id) ? ' catalog-item-card-selected' : ''}`}
                              role="button"
                              tabIndex={0}
                              onClick={() => handleOpenCatalogItem(item)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault()
                                  handleOpenCatalogItem(item)
                                }
                              }}
                            >
                              {isPlatformAdmin && isCatalogBulkEditMode && (
                                <label
                                  className="catalog-bulk-select-toggle"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={catalogBulkSelectedIds.has(item.id)}
                                    onChange={() => handleToggleCatalogBulkSelect(item.id)}
                                    aria-label={`Select ${item.name || 'catalog item'}`}
                                  />
                                </label>
                              )}
                              {imageUrl ? (
                                <img className="catalog-item-image" src={imageUrl} alt={item.name || 'Catalog item'} loading="lazy" />
                              ) : (
                                <div className="catalog-item-image catalog-item-image-placeholder">No image</div>
                              )}
                              <div className="catalog-item-content">
                                <h3>{isMusic ? franchiseName : (item.name || 'Untitled item')}</h3>
                                <p className="catalog-item-meta">{isMusic ? (item.name || 'Untitled item') : franchiseName}</p>
                                {isMusic
                                  ? (catalogSubcategoryById[item.subcategory_id] ? <p className="catalog-item-brand">Format: {catalogSubcategoryById[item.subcategory_id]}</p> : null)
                                  : isCard
                                    ? (subsetName ? <p className="catalog-item-brand">Subset: {subsetName}</p> : null)
                                    : (franchiseBrandName ? <p className="catalog-item-brand">Franchise: {franchiseBrandName}</p> : null)}
                                {brandName ? <p className="catalog-item-brand">{itemCardLabels.brand}: {brandName}</p> : null}
                                {item.release_year ? <p className="catalog-item-year">{item.release_year}</p> : null}
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="catalog-list-view">
                        {paginatedCatalogItems.map((item) => {
                          const categoryName    = catalogCategoryById[item.category_id] || ''
                          const subcategoryName = catalogSubcategoryById[item.subcategory_id] || ''
                          const setName         = item._set_name || ''
                          const brandName       = item._brand_name || (item.brand_id ? catalogBrandById[item.brand_id] || '' : '')
                          const isMusic         = categoryName === 'Music'
                          const ownedCount      = ownedCatalogItemCounts[item.id] || 0
                          const stats           = catalogListStats[item.id] || null
                          const pricing         = catalogListPricing[item.id] || {}
                          const isWishlisted    = wishlistItemIds.has(item.id)
                          const imageUrl        = item.front_image_path
                            ? item.front_image_path.startsWith('http')
                              ? item.front_image_path
                              : supabase.storage.from('item-images').getPublicUrl(item.front_image_path).data?.publicUrl
                            : ''
                          const tags = isMusic ? [
                            item.name || null,
                            subcategoryName,
                            item.release_year ? String(item.release_year) : null,
                          ].filter(Boolean) : [
                            item.card_number ? item.card_number : null,
                            categoryName,
                            subcategoryName !== categoryName ? subcategoryName : null,
                            setName,
                            item.release_year ? String(item.release_year) : null,
                          ].filter(Boolean)
                          const toggleWishlist = async () => {
                            if (!currentUser?.id) { handleOpenCatalogItem(item); return }
                            if (isWishlisted) {
                              setWishlistItemIds((prev) => { const next = new Set(prev); next.delete(item.id); return next })
                              await supabase.from('wishlist_items').delete().eq('user_id', currentUser.id).eq('catalog_item_id', item.id)
                              setCatalogListStats((prev) => { const s = prev[item.id]; return s ? { ...prev, [item.id]: { ...s, wanted_count: Math.max(0, Number(s.wanted_count) - 1) } } : prev })
                            } else {
                              setWishlistItemIds((prev) => new Set([...prev, item.id]))
                              await supabase.from('wishlist_items').upsert({ user_id: currentUser.id, catalog_item_id: item.id }, { onConflict: 'user_id,catalog_item_id', ignoreDuplicates: true })
                              setCatalogListStats((prev) => { const s = prev[item.id]; return s ? { ...prev, [item.id]: { ...s, wanted_count: Number(s.wanted_count) + 1 } } : prev })
                            }
                          }
                          const collect = () => {
                            if (quickAddMode) { performQuickAdd(item) }
                            else {
                              setSelectedCatalogItem({ ...item, categoryName: catalogCategoryById[item.category_id] || '', subcategoryName: catalogSubcategoryById[item.subcategory_id] || '', setName: item._set_name || '', brandName: item._brand_name || '', imageUrl: item.metadata?.image_url || '' })
                              handleOpenAddToCollectionModal(item.id)
                            }
                          }

                          return (
                            <article
                              key={item.id}
                              className={`catalog-list-row catalog-list-row-lego${isCatalogBulkEditMode && catalogBulkSelectedIds.has(item.id) ? ' catalog-list-row-selected' : ''}`}
                              role="button"
                              tabIndex={0}
                              onClick={() => handleOpenCatalogItem(item)}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenCatalogItem(item) } }}
                            >
                              {isPlatformAdmin && isCatalogBulkEditMode && (
                                <label
                                  className="catalog-bulk-select-toggle catalog-bulk-select-toggle-list"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={catalogBulkSelectedIds.has(item.id)}
                                    onChange={() => handleToggleCatalogBulkSelect(item.id)}
                                    aria-label={`Select ${item.name || 'catalog item'}`}
                                  />
                                </label>
                              )}
                              {/* Name above the photo for every category (was LEGO-only). */}
                              <h3 className="catalog-list-name catalog-list-name-top">{isMusic ? (setName || 'Untitled item') : (item.name || 'Untitled item')}</h3>
                              <div className="catalog-list-thumb">
                                {imageUrl
                                  ? <img src={imageUrl} alt={item.name || 'Item'} loading="lazy" />
                                  : <div className="catalog-list-thumb-placeholder" />}
                              </div>
                              <div className="catalog-list-body">
                                {/* Shared structured meta for ALL categories, labelled per
                                    category. Building Blocks renders exactly as before
                                    (Theme / Year / Pieces / Item Type) because its labels
                                    resolve to those; Toys gets Franchise / Year / Item Type. */}
                                {(() => {
                                  const rowLabels = getCategoryLabels(categoryName)
                                  const pieces = item._details?.piece_count
                                  const metaRows = [
                                    { label: rowLabels.franchise, value: item._franchise_name },
                                    { label: 'Year', value: item.release_year },
                                    { label: 'Pieces', value: pieces != null && pieces !== '' ? pieces : '' },
                                    { label: rowLabels.brand, value: brandName },
                                  ].filter(r => r.label && r.value)
                                  if (!metaRows.length) return null
                                  return (
                                    <div className="catalog-list-lego-meta">
                                      {metaRows.map(r => (
                                        <p key={r.label} className="cll-row"><span className="cll-label">{r.label}</span><span>{r.value}</span></p>
                                      ))}
                                    </div>
                                  )
                                })()}
                              </div>
                              <div className="catalog-list-purchase">
                                <p className="catalog-list-purchase-heading">Ownership</p>
                                <div className="catalog-list-stat-rows">
                                  <span className="catalog-list-stat-label">Owned:</span>
                                  <span className="catalog-list-stat-value catalog-list-stat-owned">
                                    {stats && stats.owned_count != null ? stats.owned_count : '—'}
                                  </span>
                                  <span className="catalog-list-stat-label">Available:</span>
                                  <span className="catalog-list-stat-value catalog-list-stat-available">
                                    {stats ? stats.available_count : '—'}
                                  </span>
                                  <span className="catalog-list-stat-label">Wanted:</span>
                                  <span className="catalog-list-stat-value catalog-list-stat-wanted">
                                    {stats ? stats.wanted_count : '—'}
                                  </span>
                                </div>
                                {/* Own / want controls for EVERY category (was LEGO-only).
                                    Only the noun adapts: "set" for Building Blocks. */}
                                <div className="catalog-list-purchase-checks" onClick={(e) => e.stopPropagation()}>
                                  <button type="button" className="catalog-ownwant-btn" onClick={collect}>
                                    <span className={`catalog-ownwant-count${ownedCount > 0 ? ' has' : ''}`}>{ownedCount}</span>
                                    <span>{ownedCount > 0 ? 'I own another' : `I own this ${categoryName === 'Building Blocks' ? 'set' : 'item'}`}</span>
                                  </button>
                                  <label className={`catalog-ownwant-check want${isWishlisted ? ' checked' : ''}`}>
                                    <input type="checkbox" checked={isWishlisted} onChange={toggleWishlist} />
                                    <span>I want this {categoryName === 'Building Blocks' ? 'set' : 'item'}</span>
                                  </label>
                                </div>
                              </div>
                              {/* Pricing + buy panel for EVERY category (was LEGO-only).
                                  Only the marketplace links differ, since BrickLink and
                                  Brick Owl are LEGO-specific; eBay applies to all. */}
                              <div className="catalog-list-ownwant" onClick={(e) => e.stopPropagation()}>
                                <div className="catalog-list-pricing">
                                  <p className="cll-pricing-head">Pricing</p>
                                  <div className="cll-price-row"><span className="cll-price-label">Value</span><span className="cll-price-val">{pricing.market != null ? formatUsd(Number(pricing.market)) : '—'}</span></div>
                                  <div className={`cll-price-row${hasCollectorPlusAccess ? '' : ' cll-price-locked'}`}><span className="cll-price-label">Local Value</span><span className="cll-price-val">{hasCollectorPlusAccess ? (pricing.local != null ? formatUsd(Number(pricing.local)) : '—') : 'Collector+'}</span></div>
                                  <div className="cll-price-row"><span className="cll-price-label">Retail</span><span className="cll-price-val">{pricing.retail != null ? formatUsd(Number(pricing.retail)) : '—'}</span></div>
                                </div>
                                <div className="catalog-list-buy">
                                  <span className="catalog-list-buy-label">Buy this item</span>
                                  {categoryName === 'Building Blocks' && (
                                    <>
                                      <a
                                        className="catalog-list-buy-link"
                                        href={item.card_number
                                          ? `https://www.bricklink.com/v2/catalog/catalogitem.page?M=${encodeURIComponent(item.card_number)}`
                                          : `https://www.bricklink.com/v2/search.page?q=${encodeURIComponent(item._subject_name || item.name || '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        BrickLink
                                      </a>
                                      <a
                                        className="catalog-list-buy-link"
                                        href={`https://www.brickowl.com/search/catalog?query=${encodeURIComponent(item._subject_name || item.name || '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        Brick Owl
                                      </a>
                                    </>
                                  )}
                                  <a
                                    className="catalog-list-buy-link"
                                    href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent((item._subject_name || item.name || '') + (item.card_number ? ' ' + item.card_number : ''))}&_sacat=0`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    eBay
                                  </a>
                                </div>
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    )}
                    <div className="catalog-pagination" aria-label="Catalog pagination">
                      <button
                        type="button"
                        className="catalog-pagination-btn"
                        onClick={() => setCatalogPage((currentPage) => Math.max(1, currentPage - 1))}
                        disabled={catalogPage <= 1}
                      >
                        Previous
                      </button>
                      <span className="catalog-pagination-page">
                        Page{' '}
                        <input
                          type="number"
                          className="catalog-pagination-input"
                          min={1}
                          max={catalogTotalPages}
                          value={catalogPageInput}
                          onChange={(e) => setCatalogPageInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                          onBlur={() => {
                            const n = parseInt(catalogPageInput, 10)
                            if (!Number.isFinite(n)) { setCatalogPageInput(String(catalogPage)); return }
                            const clamped = Math.min(catalogTotalPages, Math.max(1, n))
                            setCatalogPage(clamped)
                            setCatalogPageInput(String(clamped))
                          }}
                          aria-label="Go to page"
                        />
                        {' '}/ {catalogTotalPages}
                      </span>
                      <button
                        type="button"
                        className="catalog-pagination-btn"
                        onClick={() => setCatalogPage((currentPage) => Math.min(catalogTotalPages, currentPage + 1))}
                        disabled={catalogPage >= catalogTotalPages}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <aside className="catalog-card catalog-context" aria-label="Catalog context">
                {selectedCatalogFranchiseRecord ? (
                  <div className="catalog-theme-panel">
                    <div className="catalog-theme-hero">
                      {catalogThemeImageUrl
                        ? <img className="catalog-theme-logo" src={catalogThemeImageUrl} alt={selectedCatalogFranchiseRecord.name} loading="lazy" />
                        : <div className="catalog-theme-logo catalog-theme-logo-empty" aria-hidden="true" />}
                      <div className="catalog-theme-head">
                        <h2 className="catalog-theme-name">{selectedCatalogFranchiseRecord.name}</h2>
                        {catalogThemeStats?.release_year ? <p className="catalog-theme-year">{catalogThemeStats.release_year}</p> : null}
                      </div>
                    </div>
                    {catalogThemeShortDesc ? <p className="catalog-theme-desc">{catalogThemeShortDesc}</p> : null}
                    <div className="catalog-theme-stats">
                      <p className="catalog-theme-stat"><span>Total Items</span><strong>{catalogThemeStats?.total_items != null ? Number(catalogThemeStats.total_items).toLocaleString() : '—'}</strong></p>
                    </div>

                    <h3 className="catalog-theme-subhead">Community</h3>
                    <div className="catalog-theme-stats">
                      <p className="catalog-theme-stat"><span>Own at least one</span><strong>{themeStatPct(catalogThemeStats?.owner_pct)}</strong></p>
                      <p className="catalog-theme-stat"><span>Avg. completion</span><strong>{themeStatPct(catalogThemeStats?.avg_completion)}</strong></p>
                      <p className="catalog-theme-stat"><span>Most collected set</span><strong>{themeStatName(catalogThemeStats?.most_collected)}</strong></p>
                      <p className="catalog-theme-stat"><span>Rarest item</span><strong>{themeStatName(catalogThemeStats?.rarest)}</strong></p>
                      <p className="catalog-theme-stat"><span>Most wishlisted item</span><strong>{themeStatName(catalogThemeStats?.most_wishlisted)}</strong></p>
                      <p className="catalog-theme-stat"><span>Total Theme Value</span><strong>{catalogThemeStats?.total_value != null ? formatUsd(Number(catalogThemeStats.total_value)) : '—'}</strong></p>
                      <p className="catalog-theme-stat"><span>Most valuable item</span><strong>{catalogThemeStats?.most_valuable?.name ? `${catalogThemeStats.most_valuable.name}${catalogThemeStats.most_valuable.value != null ? ` (${formatUsd(Number(catalogThemeStats.most_valuable.value))})` : ''}` : '—'}</strong></p>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2>{t('contextTitle')}</h2>
                    {hasCatalogActiveContext ? (
                      <div className="catalog-context-list" aria-label="Active catalog filters">
                        {catalogActiveContextRows.map((row) => (
                          <p key={row.label} className="catalog-context-row">
                            <span>{row.label}</span>
                            <strong>{row.value}</strong>
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p>{t('contextHint')}</p>
                    )}
                    {catalogContextThemeText ? <p>{catalogContextThemeText}</p> : null}
                    <div className="catalog-context-stats" aria-label="Catalog scope stats">
                      <p><span>Matching Items</span><strong>{catalogTotalItemCount.toLocaleString()}</strong></p>
                      <p><span>Franchises</span><strong>{catalogFranchiseOptions.length.toLocaleString()}</strong></p>
                      <p><span>Brands</span><strong>{catalogFranchiseLinkedBrands.length.toLocaleString()}</strong></p>
                      <p><span>Teams</span><strong>{catalogTeams.length.toLocaleString()}</strong></p>
                      <p><span>Collectible Sets</span><strong>{catalogSets.length.toLocaleString()}</strong></p>
                    </div>
                  </>
                )}
              </aside>
            </div>

            <button type="button" className="catalog-floating-toggle" aria-label={t('filtersLabel')}>
              &#9783;
            </button>

            {isCatalogAdminPanelOpen && isPlatformAdmin && (
              <CatalogAdminPanel
                categories={catalogAdminCategories}
                onClose={() => setIsCatalogAdminPanelOpen(false)}
              />
            )}

            {isCatalogItemModalOpen && isPlatformAdmin && (
              <div className="auth-overlay" onClick={() => setIsCatalogItemModalOpen(false)}>
                <section className="auth-modal catalog-item-modal" onClick={(event) => event.stopPropagation()}>
                  <button type="button" className="close-auth" onClick={() => setIsCatalogItemModalOpen(false)}>
                    &#10005;
                  </button>
                  <h3>{t('adminCreateItem')}</h3>
                  <div className="bulk-import-tabs">
                    <button type="button" className={`bulk-import-tab${!bulkImportMode && !bulkPhotoMode ? ' bulk-import-tab-active' : ''}`} onClick={() => { setBulkImportMode(false); setBulkPhotoMode(false) }}>Single Item</button>
                    <button type="button" className={`bulk-import-tab${bulkImportMode && !bulkPhotoMode ? ' bulk-import-tab-active' : ''}`} onClick={() => { setBulkImportMode(true); setBulkPhotoMode(false); setBulkImportRows([]); setBulkImportIdx(0); setBulkImportSubjectSearch(''); setBulkImportSubjectResults([]) }}>Bulk Import</button>
                    <button type="button" className={`bulk-import-tab${bulkPhotoMode ? ' bulk-import-tab-active' : ''}`} onClick={() => { setBulkPhotoMode(true); setBulkImportMode(false); setBulkPhotoRows([]); setBulkPhotoIdx(0); setBulkPhotoManualSearch(''); setBulkPhotoPhase(null) }}>Bulk Photos</button>
                  </div>
                  {bulkPhotoMode ? (
                    <div className="bulk-import-container">
                      {bulkPhotoRows.length === 0 ? (
                        <div className="bulk-import-step1">
                          <p className="catalog-admin-section-title">1. Select the Collectible Set</p>
                          <div className="catalog-admin-two-col">
                            <div>
                              <label>Category</label>
                              <select value={catalogAdminCategoryId} onChange={e => { setCatalogAdminCategoryId(e.target.value); setCatalogAdminSubcategoryId('') }}>
                                <option value="">Select category…</option>
                                {catalogAdminCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </div>
                            {(() => { const _bl = getCategoryLabels(catalogAdminCategories.find(c => c.id === catalogAdminCategoryId)?.name || ''); return (<>
                            <div>
                              <label>{_bl.subcategory}</label>
                              <select value={catalogAdminSubcategoryId} onChange={e => { setCatalogAdminSubcategoryId(e.target.value); if (!_bl.hideFranchise) setCatalogAdminRealFranchiseId('') }} disabled={!catalogAdminCategoryId}>
                                <option value="">Select subcategory…</option>
                                {catalogAdminSubcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                            </div>
                            {!_bl.hideFranchise && (<div>
                              <label>{_bl.franchise}</label>
                              <select value={catalogAdminRealFranchiseId} onChange={e => { setCatalogAdminRealFranchiseId(e.target.value); setCatalogAdminBrandId(''); setCatalogAdminFranchiseId('') }} disabled={!catalogAdminSubcategoryId}>
                                <option value="">None</option>
                                {catalogAdminRealFranchises.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                              </select>
                            </div>)}
                            <div>
                              <label>{_bl.brand}</label>
                              <select value={catalogAdminBrandId} onChange={e => { setCatalogAdminBrandId(e.target.value); setCatalogAdminFranchiseId('') }} disabled={!catalogAdminRealFranchiseId}>
                                <option value="">None</option>
                                {catalogAdminBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label>{_bl.collectibleSet}</label>
                              <select value={catalogAdminFranchiseId} onChange={e => { setCatalogAdminFranchiseId(e.target.value); setCatalogAdminSubsetId('') }} disabled={!catalogAdminBrandId}>
                                <option value="">None</option>
                                {catalogAdminFranchises.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                            </div>
                            {catalogAdminSubsets.length > 0 && (
                              <div>
                                <label>{_bl.subset}</label>
                                <select value={catalogAdminSubsetId} onChange={e => setCatalogAdminSubsetId(e.target.value)} disabled={!catalogAdminFranchiseId}>
                                  <option value="">None</option>
                                  {catalogAdminSubsets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                              </div>
                            )}
                            </>) })()}
                          </div>
                          {CARD_CONDITION_CATEGORIES.has(selectedCatalogAdminCategoryName) && catalogAdminPrintTypes.length > 0 && (
                            <>
                              <p className="catalog-admin-section-title" style={{ marginTop: 20 }}>2. Print Type</p>
                              <select
                                value={bulkPhotoPrintTypeId}
                                onChange={e => setBulkPhotoPrintTypeId(e.target.value)}
                                style={{ maxWidth: 280 }}
                              >
                                <option value="">All print types</option>
                                <option value="__none__">No print type</option>
                                {catalogAdminPrintTypes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                              <p className="catalog-admin-hint" style={{ marginTop: 4, marginBottom: 0 }}>Selecting a print type filters card matching to that variant only.</p>
                            </>
                          )}
                          <p className="catalog-admin-section-title" style={{ marginTop: 20 }}>{CARD_CONDITION_CATEGORIES.has(selectedCatalogAdminCategoryName) && catalogAdminPrintTypes.length > 0 ? '3' : '2'}. Card Side</p>
                          <div className="bulk-photo-side-toggle">
                            <button type="button" className={`bulk-photo-side-btn${bulkPhotoPosition === 0 ? ' bulk-photo-side-btn--active' : ''}`} onClick={() => setBulkPhotoPosition(0)}>Front</button>
                            <button type="button" className={`bulk-photo-side-btn${bulkPhotoPosition === 1 ? ' bulk-photo-side-btn--active' : ''}`} onClick={() => setBulkPhotoPosition(1)}>Back</button>
                          </div>
                          <p className="catalog-admin-hint" style={{ marginTop: 6, marginBottom: 0 }}>OCR text will be pre-filled into the card's description — edit or clear it during review before approving.</p>
                          <p className="catalog-admin-section-title" style={{ marginTop: 20 }}>{CARD_CONDITION_CATEGORIES.has(selectedCatalogAdminCategoryName) && catalogAdminPrintTypes.length > 0 ? '4' : '3'}. Upload Folder of Images</p>
                          <p className="catalog-admin-hint" style={{ marginBottom: 8 }}>Images are OCR-scanned to match subject name. You approve or deny each match before saving.</p>
                          <label className={`bulk-import-upload-area${!catalogAdminFranchiseId ? ' bulk-import-upload-area--disabled' : ''}`}>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              webkitdirectory=""
                              style={{ display: 'none' }}
                              disabled={!catalogAdminFranchiseId}
                              onChange={e => handleBulkPhotoFolder(e.target.files)}
                            />
                            <span className="bulk-import-upload-icon">&#8679;</span>
                            <span>{catalogAdminFranchiseId ? 'Click to choose folder of images' : 'Select a Collectible Set first'}</span>
                          </label>
                        </div>
                      ) : bulkPhotoAnalyzing ? (
                        <div className="bulk-photo-analyzing">
                          <p className="catalog-admin-section-title">Scanning images with OCR…</p>
                          <div className="bulk-photo-progress-bar">
                            <div className="bulk-photo-progress-fill" style={{ width: `${bulkPhotoAnalyzeProgress.total ? (bulkPhotoAnalyzeProgress.done / bulkPhotoAnalyzeProgress.total) * 100 : 0}%` }} />
                          </div>
                          <p className="catalog-admin-hint">{bulkPhotoAnalyzeProgress.done} / {bulkPhotoAnalyzeProgress.total} images analysed</p>
                        </div>
                      ) : bulkPhotoPhase === 'review' ? (() => {
                        const skipped = bulkPhotoRows.filter(r => r.status === 'skipped')
                        const errors  = bulkPhotoRows.filter(r => r.status === 'error')
                        const saved   = bulkPhotoRows.filter(r => r.status === 'saved')
                        return (
                          <div className="bulk-photo-skipped-review">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <p className="catalog-admin-section-title" style={{ margin: 0 }}>Step 3 of 3 — Review</p>
                              <button type="button" className="catalog-admin-inline-cancel" onClick={() => { setBulkPhotoRows([]); setBulkPhotoIdx(0); setBulkPhotoManualSearch(''); setBulkPhotoPhase(null); setBulkPhotoPrintTypeId('') }}>Start Over</button>
                            </div>
                            <p className="catalog-admin-hint" style={{ marginBottom: 12 }}>
                              {saved.length} saved{errors.length > 0 ? `, ${errors.length} errors` : ''}{skipped.length > 0 ? `, ${skipped.length} skipped` : ''}
                            </p>
                            {errors.map(row => (
                              <div key={row._id} className="bulk-photo-skipped-row">
                                {row.preview && <img src={row.preview} alt="" className="bulk-photo-skipped-thumb" />}
                                <div className="bulk-photo-skipped-info">
                                  <span className="bulk-photo-skipped-filename">{row.filename}</span>
                                  {row.matchedItem && <span className="catalog-admin-hint"> — {row.matchedItem.subject || ''}</span>}
                                  <span className="bulk-photo-skipped-reason"> · Error: {row.errorMsg}</span>
                                </div>
                              </div>
                            ))}
                            {skipped.map(row => (
                              <div key={row._id} className="bulk-photo-skipped-row">
                                {row.preview && <img src={row.preview} alt="" className="bulk-photo-skipped-thumb" />}
                                <div className="bulk-photo-skipped-info">
                                  <span className="bulk-photo-skipped-filename">{row.filename}</span>
                                  {row.matchedItem && <span className="catalog-admin-hint"> — {row.matchedItem.subject || ''}</span>}
                                  {row.errorMsg
                                    ? <span className="bulk-photo-skipped-reason"> · {row.errorMsg}</span>
                                    : <span className="catalog-admin-hint"> — no match found</span>}
                                </div>
                              </div>
                            ))}
                            {skipped.length === 0 && errors.length === 0 && <p className="catalog-admin-hint">All images saved successfully.</p>}
                          </div>
                        )
                      })() : (() => {
                        const phaseRows = bulkPhotoRows
                          .map((r, i) => ({ ...r, _origIdx: i }))
                          .filter(r => bulkPhotoPhase === 'update' ? r.hasExistingImage : !r.hasExistingImage)
                        const cur = bulkPhotoRows[bulkPhotoIdx] || {}
                        const approvedCount = bulkPhotoRows.filter(r => r.status === 'approved').length
                        const phasePendingCount = phaseRows.filter(r => r.status === 'pending').length
                        const phaseDone = phasePendingCount === 0
                        return (
                          <div className="bulk-import-review">
                            <div className="bulk-photo-phase-header">
                              {bulkPhotoPhase === 'new'
                                ? 'Step 1 of 3 — Cards without an existing photo'
                                : 'Step 2 of 3 — Cards that already have a photo (will be replaced)'}
                            </div>
                            <div className="bulk-import-topbar">
                              <span className="bulk-import-stats">
                                {phaseRows.length} in this step &nbsp;·&nbsp;
                                <span className="bulk-stat-approved">{phaseRows.filter(r => r.status === 'approved').length} approved</span> &nbsp;·&nbsp;
                                <span className="bulk-stat-skipped">{phaseRows.filter(r => r.status === 'skipped').length} skipped</span>
                                {phasePendingCount > 0 && <>&nbsp;·&nbsp;{phasePendingCount} remaining</>}
                              </span>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                {bulkPhotoSaveError && <span className="catalog-admin-error" style={{ fontSize: '0.8rem' }}>{bulkPhotoSaveError}</span>}
                                <button
                                  type="button"
                                  className="catalog-action-pill"
                                  disabled={bulkPhotoIsSaving}
                                  onClick={bulkPhotoApproveAll}
                                >
                                  Approve All
                                </button>
                                <button
                                  type="button"
                                  className="catalog-action-pill"
                                  disabled={bulkPhotoIsSaving}
                                  onClick={() => setBulkPhotoRows(rows => rows.map(r => ({ ...r, description: '' })))}
                                >
                                  Clear All Descriptions
                                </button>
                                {bulkPhotoPhase === 'update' && (
                                  <button
                                    type="button"
                                    className="catalog-action-pill catalog-admin-submit-finish"
                                    disabled={approvedCount === 0 || bulkPhotoIsSaving}
                                    onClick={handleBulkPhotoSave}
                                  >
                                    {bulkPhotoIsSaving ? `Saving… ${bulkPhotoSaveProgress}/${approvedCount}` : `Save ${approvedCount} Approved & Finish`}
                                  </button>
                                )}
                                {bulkPhotoPhase === 'new' && phaseDone && (
                                  <button
                                    type="button"
                                    className="catalog-action-pill catalog-admin-submit-finish"
                                    onClick={() => {
                                      const firstUpdate = bulkPhotoRows.findIndex(r => r.status === 'pending' && r.hasExistingImage)
                                      setBulkPhotoPhase('update')
                                      if (firstUpdate >= 0) { setBulkPhotoIdx(firstUpdate); setBulkPhotoManualSearch('') }
                                    }}
                                  >
                                    Next: Update Existing Photos →
                                  </button>
                                )}
                                <button type="button" className="catalog-admin-inline-cancel" onClick={() => { setBulkPhotoRows([]); setBulkPhotoIdx(0); setBulkPhotoManualSearch(''); setBulkPhotoPhase(null); setBulkPhotoPrintTypeId('') }}>Start Over</button>
                              </div>
                            </div>
                            <div className="bulk-import-split">
                              <div className="bulk-import-list">
                                {phaseRows.map(row => (
                                  <button
                                    key={row._id}
                                    type="button"
                                    className={`bulk-import-list-row${row._origIdx === bulkPhotoIdx ? ' bulk-import-list-row-active' : ''} bulk-import-list-row-${row.status}`}
                                    onClick={() => { setBulkPhotoIdx(row._origIdx); setBulkPhotoManualSearch('') }}
                                  >
                                    {row.preview && <img src={row.preview} alt="" className="bulk-photo-list-thumb" />}
                                    <span className="bulk-import-row-icon">
                                      {row.status === 'pending'  ? (row.matchedItem ? '?' : '!') :
                                       row.status === 'approved' ? '✓' :
                                       row.status === 'skipped'  ? '–' :
                                       row.status === 'saved'    ? '✅' : '✗'}
                                    </span>
                                    <span className="bulk-import-row-label" style={{ fontSize: '0.75rem' }}>
                                      {row.matchedItem
                                        ? [row.matchedItem.card_number ? `#${row.matchedItem.card_number}` : null, row.matchedItem.subject || null, row.matchedItem.print_type || null].filter(Boolean).join(' — ')
                                        : row.filename}
                                    </span>
                                  </button>
                                ))}
                              </div>
                              <div className="bulk-import-editor">
                                {phaseDone ? (
                                  <p className="catalog-admin-hint" style={{ padding: 16 }}>
                                    {bulkPhotoPhase === 'new'
                                      ? 'All new-photo cards reviewed. Click "Next: Update Existing Photos →" above.'
                                      : 'All cards reviewed. Click "Save Approved & Finish" above.'}
                                  </p>
                                ) : (
                                  <>
                                    <p className="bulk-import-editor-rowlabel">{cur.filename}</p>
                                    {cur.preview && <img src={cur.preview} alt="card" className="bulk-photo-preview" />}
                                    <div className="bulk-import-editor-fields" style={{ marginTop: 12 }}>
                                      <div className="bulk-import-editor-field bulk-import-editor-field--wide">
                                        <label>Match</label>
                                        {cur.matchedItem ? (
                                          <span className="catalog-admin-subject-tag">
                                            {cur.matchedItem.card_number && <strong>#{cur.matchedItem.card_number}</strong>}
                                            {' '}{cur.matchedItem.subject || ''}
                                            {cur.matchedItem.print_type && <span style={{ marginLeft: 4 }}>— {cur.matchedItem.print_type}</span>}
                                            <span className="catalog-admin-hint" style={{ marginLeft: 6 }}>{cur.matchType === 'manual' ? 'manual' : 'name match'}</span>
                                            <button type="button" className="catalog-admin-subject-tag-remove" onClick={() => { updateBulkPhotoRow(bulkPhotoIdx, { matchedItem: null, matchType: null }); setBulkPhotoManualSearch('') }}>✕</button>
                                          </span>
                                        ) : (
                                          <div>
                                            <p className="catalog-admin-hint" style={{ marginBottom: 6 }}>No match found. Search to assign manually:</p>
                                            <input
                                              className="catalog-admin-inline-input"
                                              style={{ width: '100%', marginBottom: 4 }}
                                              placeholder="Type a subject name…"
                                              value={bulkPhotoManualSearch}
                                              onChange={e => setBulkPhotoManualSearch(e.target.value)}
                                              autoComplete="off"
                                            />
                                            {bulkPhotoManualResults.length > 0 && (
                                              <div className="catalog-admin-subject-results">
                                                {bulkPhotoManualResults.map(it => (
                                                  <button key={it.item_id} type="button" className="catalog-admin-subject-result"
                                                    onClick={() => { updateBulkPhotoRow(bulkPhotoIdx, { matchedItem: it, matchType: 'manual' }); setBulkPhotoManualSearch(''); setBulkPhotoManualResults([]) }}>
                                                    {it.card_number && <strong style={{ marginRight: 6 }}>#{it.card_number}</strong>}
                                                    <span style={{ textTransform: 'uppercase' }}>{it.subject || '—'}</span>
                                                    {it.print_type && <span className="catalog-admin-hint" style={{ marginLeft: 6 }}>— {it.print_type}</span>}
                                                  </button>
                                                ))}
                                              </div>
                                            )}
                                            {bulkPhotoManualSearch.trim().length >= 2 && bulkPhotoManualResults.length === 0 && (
                                              <p className="catalog-admin-hint" style={{ padding: '4px 0' }}>No items found.</p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <div className="bulk-import-editor-field bulk-import-editor-field--wide">
                                        <label>Description <span className="catalog-admin-hint">(from OCR — edit or clear before approving)</span></label>
                                        <textarea
                                          rows={4}
                                          className="catalog-admin-inline-input"
                                          style={{ width: '100%', fontFamily: 'inherit' }}
                                          value={cur.description || ''}
                                          onChange={e => updateBulkPhotoRow(bulkPhotoIdx, { description: e.target.value })}
                                          placeholder={bulkPhotoPosition === 0 ? 'No text detected on front' : 'No text detected on back'}
                                        />
                                      </div>
                                    </div>
                                    {cur.errorMsg && <p className="catalog-admin-error" style={{ marginTop: 8 }}>{cur.errorMsg}</p>}
                                    <div className="bulk-import-actions">
                                      <button type="button" className="catalog-admin-inline-cancel" onClick={bulkPhotoSkip} disabled={cur.status === 'saved'}>Skip</button>
                                      <button type="button" className="catalog-action-pill catalog-admin-submit-finish" onClick={bulkPhotoApprove} disabled={cur.status === 'saved'}>
                                        {cur.status === 'approved' ? 'Approved ✓' : cur.status === 'saved' ? 'Saved ✅' : 'Approve'}
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  ) : bulkImportMode ? (
                    <div className="bulk-import-container">
                      {bulkImportRows.length === 0 ? (
                        /* Step 1: pick set + upload CSV */
                        <div className="bulk-import-step1">
                          <p className="catalog-admin-section-title">1. Select Category &amp; Subcategory</p>
                          <div className="catalog-admin-two-col">
                            <div>
                              <label>Category</label>
                              <select value={catalogAdminCategoryId} onChange={e => { setCatalogAdminCategoryId(e.target.value); setCatalogAdminSubcategoryId('') }}>
                                <option value="">Select category…</option>
                                {catalogAdminCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label>Subcategory</label>
                              <select value={catalogAdminSubcategoryId} onChange={e => setCatalogAdminSubcategoryId(e.target.value)} disabled={!catalogAdminCategoryId}>
                                <option value="">Select subcategory…</option>
                                {catalogAdminSubcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                            </div>
                          </div>
                          <p className="catalog-admin-section-title" style={{ marginTop: 20 }}>2. Upload CSV or Excel</p>
                          <p className="catalog-admin-hint" style={{ marginBottom: 8 }}>Columns recognised: <code>subject_name, franchise, brand, collectible_set, card_number, team, print_count, piece_count, release_year, description, upc, bricklink_id, rebrickable_fig_id, card_treatments, rarity, parent_set</code></p>
                          <p className="catalog-admin-hint" style={{ marginBottom: 8 }}>Franchise, brand, and collectible set will be created automatically if they don't exist yet.</p>
                          <label className="bulk-import-upload-area">
                            <input type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" style={{ display: 'none' }} onChange={e => handleBulkImportFile(e.target.files?.[0])} />
                            <span className="bulk-import-upload-icon">&#8679;</span>
                            <span>Click to choose CSV or Excel file</span>
                          </label>
                        </div>
                      ) : (
                        /* Step 2: review queue */
                        (() => {
                          const cur = bulkImportRows[bulkImportIdx] || {}
                          const bulkLabels = getCategoryLabels(selectedCatalogAdminCategoryName)
                          // A LEGO row is a minifig (no packaging) unless it's a set —
                          // identified by a set number, numeric BrickLink id, or "Sets" brand.
                          const bulkRowIsSet = !!(cur.lego_set_number?.trim() || (cur.bricklink_id?.trim() && /^\d/.test(cur.bricklink_id.trim())) || /^sets?$/i.test((cur.brand_name || '').trim()))
                          const bulkIsMinifig = selectedCatalogAdminCategoryName === 'Building Blocks' && !bulkRowIsSet
                          const _legoPreviewCode = (() => {
                            if (selectedCatalogAdminCategoryName !== 'Building Blocks') return ''
                            // Sets don't get minifig codes — detect by lego_set_number or numeric BrickLink ID
                            const curBlId = cur.bricklink_id?.trim() || ''
                            if (cur.lego_set_number?.trim() || (curBlId && /^\d/.test(curBlId))) return ''
                            if (cur.minifig_code) return cur.minifig_code
                            const charName = cur.subjectObj?.name || cur.subject_name || ''
                            const shorthand = deriveMinifigShorthand(charName)
                            if (!shorthand) return ''
                            const colSetLower = (cur.collectible_set_name || '').toLowerCase().trim()
                            const propEntry = colSetLower
                              ? legoPropertyRegistry.find(p =>
                                  p.full_name.toLowerCase() === colSetLower ||
                                  p.full_name.toLowerCase().includes(colSetLower) ||
                                  colSetLower.includes(p.full_name.toLowerCase()))
                              : null
                            const themeAbbrev = propEntry?.theme_abbreviation || ''
                            const propAbbrev  = propEntry?.abbreviation || ''
                            if (!themeAbbrev || !propAbbrev) return `??-??-${shorthand}-??`
                            return `${themeAbbrev}-${propAbbrev}-${shorthand}-??`
                          })()
                          const approvedCount = bulkImportRows.filter(r => r.status === 'approved').length
                          const savedCount    = bulkImportRows.filter(r => r.status === 'saved').length
                          const skippedCount  = bulkImportRows.filter(r => r.status === 'skipped').length
                          const errorCount    = bulkImportRows.filter(r => r.status === 'error').length
                          const allDone       = bulkImportRows.every(r => r.status !== 'pending')
                          return (
                            <div className="bulk-import-review">
                              {bulkImportSheetSummary && (
                                <div className="bulk-import-sheet-summary">
                                  <strong>{bulkImportSheetSummary.length} sheets read.</strong>{' '}
                                  {bulkImportSheetSummary.map((s, i) => (
                                    <span key={s.sheet} className={s.included ? 'sheet-included' : 'sheet-skipped'}>
                                      {i > 0 ? ' · ' : ''}{s.sheet}: {s.included ? `${s.usable} imported` : 'skipped (no item/subject column)'}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="bulk-import-topbar">
                                <span className="bulk-import-stats">
                                  {bulkImportRows.length} rows &nbsp;·&nbsp;
                                  <span className="bulk-stat-approved">{approvedCount} approved</span> &nbsp;·&nbsp;
                                  <span className="bulk-stat-skipped">{skippedCount} skipped</span>
                                  {errorCount > 0 && <>&nbsp;·&nbsp;<span className="bulk-stat-error">{errorCount} errors</span></>}
                                  {savedCount > 0 && <>&nbsp;·&nbsp;<span className="bulk-stat-saved">{savedCount} saved</span></>}
                                </span>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                  {bulkImportSaveError && <span className="catalog-admin-error" style={{ fontSize: '0.8rem' }}>{bulkImportSaveError}</span>}
                                  <button
                                    type="button"
                                    className="catalog-action-pill"
                                    disabled={bulkImportIsSaving}
                                    onClick={() => setBulkImportRows(rows => rows.map(r => r.status === 'pending' ? { ...r, status: r.existingMatch ? 'skipped' : 'approved' } : r))}
                                  >
                                    Approve All
                                  </button>
                                  <button
                                    type="button"
                                    className="catalog-action-pill"
                                    disabled={bulkImportIsSaving}
                                    onClick={() => setBulkImportRows(rows => rows.map(r => ({ ...r, description: '' })))}
                                  >
                                    Clear All Descriptions
                                  </button>
                                  <button
                                    type="button"
                                    className="catalog-action-pill catalog-admin-submit-finish"
                                    disabled={approvedCount === 0 || bulkImportIsSaving}
                                    onClick={handleBulkImportSave}
                                  >
                                    {bulkImportIsSaving ? `Saving… ${bulkImportSaveProgress}/${approvedCount}` : `Save ${approvedCount} Approved`}
                                  </button>
                                  <button type="button" className="catalog-admin-inline-cancel" onClick={() => { setBulkImportRows([]); setBulkImportIdx(0); setBulkImportSheetSummary(null) }}>Start Over</button>
                                </div>
                              </div>
                              <div className="bulk-import-split">
                                <div className="bulk-import-list">
                                  {bulkImportRows.map((row, i) => (
                                    <button
                                      key={row._id}
                                      type="button"
                                      className={`bulk-import-list-row${i === bulkImportIdx ? ' bulk-import-list-row-active' : ''} bulk-import-list-row-${row.status}`}
                                      onClick={() => { setBulkImportIdx(i); setBulkImportSubjectSearch(''); setBulkImportSubjectResults([]) }}
                                    >
                                      <span className="bulk-import-row-icon">
                                        {row.status === 'pending'  ? (row.existingMatch ? '⚠' : '○') :
                                         row.status === 'approved' ? '✓' :
                                         row.status === 'skipped'  ? '–' :
                                         row.status === 'saved'    ? '✅' : '✗'}
                                      </span>
                                      <span className="bulk-import-row-label">{row.item_name || row.subjectObj?.name || row.subject_name || `Row ${i + 1}`}</span>
                                    </button>
                                  ))}
                                </div>
                                <div className="bulk-import-editor">
                                  {allDone && !bulkImportIsSaving ? (
                                    <p className="catalog-admin-hint" style={{ padding: 16 }}>All rows reviewed. Save approved items above.</p>
                                  ) : (
                                    <>
                                      <p className="bulk-import-editor-rowlabel">Row {bulkImportIdx + 1} of {bulkImportRows.length}</p>
                                      {cur.existingMatch && (
                                        <div style={{ margin: '0 0 10px 0', padding: '8px 12px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, fontSize: '0.8rem', color: '#856404' }}>
                                          ⚠ Already in the catalog{cur.existingMatch.lego_set_number ? ` — set ${cur.existingMatch.lego_set_number}` : cur.existingMatch.rebrickable_fig_id ? ` — ${cur.existingMatch.rebrickable_fig_id}` : cur.existingMatch.card_number ? ` — card #${cur.existingMatch.card_number}` : ''}. It will be skipped on save unless you edit it.
                                        </div>
                                      )}
                                      {cur._unknownCols?.length > 0 && (
                                        <div style={{ margin: '0 0 10px 0', padding: '8px 12px', background: '#e7f0ff', border: '1px solid #9ec1ff', borderRadius: 6, fontSize: '0.8rem', color: '#1a3a7a' }}>
                                          Unmapped column{cur._unknownCols.length > 1 ? 's' : ''}: <strong>{cur._unknownCols.join(', ')}</strong>. These aren't imported — rename them to a known field or ignore.
                                        </div>
                                      )}
                                      <div className="bulk-import-editor-fields">
                                        {selectedCatalogAdminCategoryName === 'Toys' ? (<>
                                          <div className="bulk-import-editor-field bulk-import-editor-field--wide">
                                            <label>Subject</label>
                                            <div className="catalog-admin-subject-search-wrap">
                                              <input
                                                type="text"
                                                value={cur.subjectObj ? cur.subjectObj.name : (cur.item_name || '')}
                                                onChange={e => {
                                                  const v = e.target.value
                                                  // Subject IS the item name — keep both in step and drop any
                                                  // previously-matched subject so it re-resolves as you type.
                                                  updateBulkRow(bulkImportIdx, { item_name: v, subject_name: v, subjectObj: null })
                                                  setBulkImportSubjectSearch(v)
                                                }}
                                                placeholder="e.g. Imperial Speeder Bike"
                                                autoComplete="off"
                                              />
                                              {!cur.subjectObj && bulkImportSubjectResults.length > 0 && (
                                                <div className="catalog-admin-subject-results">
                                                  {bulkImportSubjectResults.map(s => (
                                                    <button key={s.id} type="button" className="catalog-admin-subject-result"
                                                      onClick={() => { updateBulkRow(bulkImportIdx, { subjectObj: s, subject_name: s.name, item_name: s.name }); setBulkImportSubjectSearch(''); setBulkImportSubjectResults([]) }}>
                                                      <span style={{ textTransform: 'uppercase' }}>{s.name}</span>
                                                      <span className="catalog-admin-hint"> · {s.type}</span>
                                                    </button>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                            {cur.subjectObj ? (
                                              <span className="bulk-subject-state bulk-subject-existing">
                                                ✓ Using existing subject{cur.subjectObj.type ? ` · ${cur.subjectObj.type}` : ''}
                                                <button type="button" className="bulk-import-subject-search-link" onClick={() => { updateBulkRow(bulkImportIdx, { subjectObj: null }); setBulkImportSubjectSearch(cur.subjectObj.name) }}>change</button>
                                              </span>
                                            ) : (cur.item_name || '').trim() ? (
                                              <span className="bulk-subject-state bulk-subject-new">＋ Will create a new subject</span>
                                            ) : null}
                                          </div>
                                          <div className="bulk-import-editor-field"><label>Franchise</label><input type="text" value={cur.franchise_name || ''} onChange={e => updateBulkRow(bulkImportIdx, { franchise_name: e.target.value })} placeholder="e.g. Star Wars" /></div>
                                          <div className="bulk-import-editor-field"><label>Subfranchise</label><input type="text" value={cur.subtheme_name || ''} onChange={e => updateBulkRow(bulkImportIdx, { subtheme_name: e.target.value })} placeholder="e.g. Age of Rebellion" /></div>
                                          <div className="bulk-import-editor-field"><label>Product Line</label><input type="text" value={cur.product_line_names || ''} onChange={e => updateBulkRow(bulkImportIdx, { product_line_names: e.target.value })} placeholder="e.g. Micro Galaxy Squadron" /></div>
                                          <div className="bulk-import-editor-field"><label>Property</label><input type="text" value={cur.property_names || ''} onChange={e => updateBulkRow(bulkImportIdx, { property_names: e.target.value })} placeholder="e.g. Return of the Jedi" /></div>
                                          <div className="bulk-import-editor-field"><label>Brand/Manufacturer</label><input type="text" value={cur.manufacturer_name || ''} onChange={e => updateBulkRow(bulkImportIdx, { manufacturer_name: e.target.value })} placeholder="e.g. Jazwares" /></div>
                                          <div className="bulk-import-editor-field"><label>Item Type</label><input type="text" value={cur.brand_name || ''} onChange={e => updateBulkRow(bulkImportIdx, { brand_name: e.target.value })} placeholder="e.g. Vehicle" /></div>
                                          <div className="bulk-import-editor-field"><label>Series</label><input type="text" value={cur.series_name || ''} onChange={e => updateBulkRow(bulkImportIdx, { series_name: e.target.value })} placeholder="e.g. Series 1" /></div>
                                          <div className="bulk-import-editor-field"><label>ID Number</label><input type="text" value={cur.lego_set_number || ''} onChange={e => updateBulkRow(bulkImportIdx, { lego_set_number: e.target.value })} placeholder="Manufacturer / catalogue #" /></div>
                                          <div className="bulk-import-editor-field"><label>Piece Count</label><input type="number" min="1" value={cur.piece_count || ''} onChange={e => updateBulkRow(bulkImportIdx, { piece_count: e.target.value })} /></div>
                                          <div className="bulk-import-editor-field"><label>Retail Price</label><input type="number" step="0.01" min="0" value={cur.retail_price || ''} onChange={e => updateBulkRow(bulkImportIdx, { retail_price: e.target.value })} /></div>
                                          <div className="bulk-import-editor-field"><label>Release Year</label><input type="number" min="1900" max="2100" value={cur.release_year || ''} onChange={e => updateBulkRow(bulkImportIdx, { release_year: e.target.value })} /></div>
                                          <div className="bulk-import-editor-field"><label>Availability</label><input type="text" value={cur.availability || ''} onChange={e => updateBulkRow(bulkImportIdx, { availability: e.target.value })} placeholder="e.g. Retired" /></div>
                                          <div className="bulk-import-editor-field"><label>Barcode/UPC</label><input type="text" value={cur.upc || ''} onChange={e => updateBulkRow(bulkImportIdx, { upc: e.target.value })} /></div>
                                          <div className="bulk-import-editor-field"><label>Includes</label><input type="text" value={cur.includes || ''} onChange={e => updateBulkRow(bulkImportIdx, { includes: e.target.value })} placeholder="child IDs (comma-separated)" /></div>
                                          <div className="bulk-import-editor-field"><label>Included In</label><input type="text" value={cur.parent_set_bricklink_id || ''} onChange={e => updateBulkRow(bulkImportIdx, { parent_set_bricklink_id: e.target.value })} placeholder="parent IDs (comma-separated)" /></div>
                                          <div className="bulk-import-editor-field bulk-import-editor-field--wide"><label>Description</label><textarea rows={2} value={cur.description || ''} onChange={e => updateBulkRow(bulkImportIdx, { description: e.target.value })} /></div>
                                          <div className="bulk-import-editor-field bulk-import-editor-field--wide bulk-import-image-field">
                                            <label>Photo</label>
                                            <div className="bulk-import-image-row">
                                              {(cur.image_preview || cur.image_url) && <img src={cur.image_preview || cur.image_url} alt="preview" className="bulk-import-image-thumb" onError={e => { e.target.style.display = 'none' }} />}
                                              <div className="bulk-import-image-controls">
                                                <input type="text" placeholder="Image URL (from CSV or paste)" value={cur.image_url || ''} onChange={e => updateBulkRow(bulkImportIdx, { image_url: e.target.value, image_file: null, image_preview: '' })} />
                                                <span className="bulk-import-image-or">or</span>
                                                <label className="bulk-import-image-upload-btn">Upload file<input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (!f) return; updateBulkRow(bulkImportIdx, { image_file: f, image_preview: URL.createObjectURL(f), image_url: '' }) }} /></label>
                                                {(cur.image_file || cur.image_url) && <button type="button" className="bulk-import-image-clear" onClick={() => updateBulkRow(bulkImportIdx, { image_file: null, image_preview: '', image_url: '' })}>✕</button>}
                                              </div>
                                            </div>
                                          </div>
                                        </>) : (<>
                                        <div className="bulk-import-editor-field">
                                          <label>Item Name <span className="catalog-admin-hint">(= Subject)</span></label>
                                          <input type="text" value={cur.item_name || ''} onChange={e => updateBulkRow(bulkImportIdx, { item_name: e.target.value, subject_name: e.target.value, subjectObj: null })} placeholder="e.g. City of Atlantis" />
                                        </div>
                                        <div className="bulk-import-editor-field">
                                          <label>{bulkLabels.franchise}</label>
                                          <input type="text" value={cur.franchise_name || ''} onChange={e => updateBulkRow(bulkImportIdx, { franchise_name: e.target.value })} placeholder="e.g. Star Wars" />
                                        </div>
                                        <div className="bulk-import-editor-field">
                                          <label>{bulkLabels.brand}</label>
                                          <input type="text" value={cur.brand_name || ''} onChange={e => updateBulkRow(bulkImportIdx, { brand_name: e.target.value })} placeholder="e.g. LEGO" />
                                        </div>
                                        {!bulkIsMinifig && (
                                          <div className="bulk-import-editor-field">
                                            <label>{bulkLabels.collectibleSet}</label>
                                            <input type="text" value={cur.collectible_set_name || ''} onChange={e => updateBulkRow(bulkImportIdx, { collectible_set_name: e.target.value })} placeholder={selectedCatalogAdminCategoryName === 'Building Blocks' ? 'e.g. Box / Polybag' : 'e.g. UCS Millennium Falcon'} />
                                          </div>
                                        )}
                                        {selectedCatalogAdminCategoryName === 'Building Blocks' && _legoPreviewCode && (
                                          <div className="bulk-import-editor-field">
                                            <label>Minifig Code <span className="catalog-admin-hint">{cur.minifig_code ? '(from CSV)' : '(preview — # assigned on save)'}</span></label>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.9rem' }}>{_legoPreviewCode}</span>
                                          </div>
                                        )}
                                        <div className="bulk-import-editor-field">
                                          <label>{bulkLabels.subject} <span className="catalog-admin-hint">(optional)</span></label>
                                          {cur.subjectObj ? (
                                            <div className="catalog-admin-subject-tags">
                                              <span className="catalog-admin-subject-tag">
                                                <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{cur.subjectObj.name}</span>
                                                <span className="catalog-admin-hint"> · {cur.subjectObj.type}</span>
                                                <button type="button" className="catalog-admin-subject-tag-remove" onClick={() => { updateBulkRow(bulkImportIdx, { subjectObj: null }); setBulkImportSubjectSearch(cur.subject_name || '') }}>✕</button>
                                              </span>
                                            </div>
                                          ) : cur.subject_name && !bulkImportSubjectSearch ? (
                                            <div className="catalog-admin-subject-tags">
                                              <span className="catalog-admin-subject-tag bulk-import-subject-new">
                                                <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{cur.subject_name}</span>
                                                <span className="catalog-admin-hint"> · will create</span>
                                                <button type="button" className="catalog-admin-subject-tag-remove" onClick={() => { updateBulkRow(bulkImportIdx, { subject_name: '' }); setBulkImportSubjectSearch('') }}>✕</button>
                                              </span>
                                              <button type="button" className="bulk-import-subject-search-link" onClick={() => setBulkImportSubjectSearch(cur.subject_name)}>Search existing instead</button>
                                            </div>
                                          ) : (
                                            <div className="catalog-admin-subject-search-wrap">
                                              <input
                                                className="catalog-admin-inline-input"
                                                style={{ width: '100%' }}
                                                placeholder="Search subjects…"
                                                value={bulkImportSubjectSearch}
                                                onChange={e => setBulkImportSubjectSearch(e.target.value)}
                                                autoComplete="off"
                                              />
                                              {bulkImportSubjectResults.length > 0 && (
                                                <div className="catalog-admin-subject-results">
                                                  {bulkImportSubjectResults.map(s => (
                                                    <button key={s.id} type="button" className="catalog-admin-subject-result" onClick={() => { updateBulkRow(bulkImportIdx, { subjectObj: s, subject_name: s.name }); setBulkImportSubjectSearch(''); setBulkImportSubjectResults([]) }}>
                                                      <span style={{ textTransform: 'uppercase' }}>{s.name}</span>
                                                      <span className="catalog-admin-hint"> · {s.type}</span>
                                                    </button>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        {bulkImportSpeciesList.length > 0 && (
                                          <div className="bulk-import-editor-field">
                                            <label>Species</label>
                                            <select value={cur.species_id || ''} onChange={e => updateBulkRow(bulkImportIdx, { species_id: e.target.value })}>
                                              <option value="">Unknown</option>
                                              {bulkImportSpeciesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                          </div>
                                        )}
                                        {selectedCatalogAdminCategoryName === 'Building Blocks' ? (
                                          <>
                                            <div className="bulk-import-editor-field">
                                              <label>{bulkLabels.subset} {!catalogAdminRealFranchiseId && <span className="catalog-admin-hint">(match a theme first)</span>}</label>
                                              <select value={cur.subset_id || ''} onChange={e => updateBulkRow(bulkImportIdx, { subset_id: e.target.value, product_line_ids: [] })} disabled={!catalogAdminRealFranchiseId}>
                                                <option value="">None</option>
                                                {catalogAdminSubsetsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                              </select>
                                              {!cur.subset_id && cur.subtheme_name?.trim() && <span className="catalog-admin-hint">CSV: “{cur.subtheme_name}” — will create on save</span>}
                                            </div>
                                            <div className="bulk-import-editor-field">
                                              <label>{bulkLabels.productLine}</label>
                                              {cur.subset_id ? (
                                                catalogAdminProductLinesList.length > 0 ? (
                                                  <div className="catalog-admin-team-list">
                                                    {catalogAdminProductLinesList.map(p => {
                                                      const checked = (cur.product_line_ids || []).includes(p.id)
                                                      return (
                                                        <label key={p.id} className="catalog-admin-team-checkbox">
                                                          <input type="checkbox" checked={checked} onChange={() => updateBulkRow(bulkImportIdx, { product_line_ids: checked ? (cur.product_line_ids || []).filter(id => id !== p.id) : [...(cur.product_line_ids || []), p.id] })} />
                                                          <span>{p.name}</span>
                                                        </label>
                                                      )
                                                    })}
                                                  </div>
                                                ) : <span className="catalog-admin-hint">No product lines yet for this {bulkLabels.subset.toLowerCase()}.</span>
                                              ) : <span className="catalog-admin-hint">Select a {bulkLabels.subset.toLowerCase()} first.</span>}
                                              {cur.product_line_names?.trim() && <span className="catalog-admin-hint">CSV: “{cur.product_line_names}” — matched/created on save</span>}
                                            </div>
                                          </>
                                        ) : (
                                          <div className="bulk-import-editor-field">
                                            <label>{bulkLabels.subset}</label>
                                            <select value={cur.subcollectble_set_id || ''} onChange={e => updateBulkRow(bulkImportIdx, { subcollectble_set_id: e.target.value })}>
                                              <option value="">None</option>
                                              {catalogAdminSubsets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                          </div>
                                        )}
                                        <div className="bulk-import-editor-field">
                                          <label>Series <span className="catalog-admin-hint">(optional)</span></label>
                                          <input type="text" value={cur.series_name || ''} onChange={e => updateBulkRow(bulkImportIdx, { series_name: e.target.value })} placeholder="e.g. UCS, Topps Chrome" />
                                        </div>
                                        {CARD_CONDITION_CATEGORIES.has(selectedCatalogAdminCategoryName) && (
                                        <div className="bulk-import-editor-field">
                                          <label>Print Type</label>
                                          <select value={cur.print_type_id || ''} onChange={e => updateBulkRow(bulkImportIdx, { print_type_id: e.target.value })}>
                                            <option value="">None</option>
                                            {catalogAdminPrintTypes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                          </select>
                                          {bulkImportCreatingPrintType ? (
                                            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                              <input
                                                type="text"
                                                className="catalog-admin-inline-input"
                                                placeholder="Print type name…"
                                                value={bulkImportNewPrintTypeName}
                                                onChange={e => setBulkImportNewPrintTypeName(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleBulkCreatePrintType() } }}
                                                autoFocus
                                              />
                                              <button type="button" className="catalog-admin-inline-save" onClick={handleBulkCreatePrintType}>Add</button>
                                              <button type="button" className="catalog-admin-inline-cancel" onClick={() => { setBulkImportCreatingPrintType(false); setBulkImportNewPrintTypeName('') }}>✕</button>
                                            </div>
                                          ) : (
                                            <button type="button" className="catalog-admin-create-inline-link" style={{ marginTop: 2 }} onClick={() => setBulkImportCreatingPrintType(true)}>＋ New print type</button>
                                          )}
                                        </div>
                                        )}
                                        {CARD_CONDITION_CATEGORIES.has(selectedCatalogAdminCategoryName) && catalogRarities.length > 0 && (
                                          <div className="bulk-import-editor-field">
                                            <label>Rarity</label>
                                            <select value={cur.rarity_id || ''} onChange={e => updateBulkRow(bulkImportIdx, { rarity_id: e.target.value })}>
                                              <option value="">None</option>
                                              {catalogRarities.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                            </select>
                                          </div>
                                        )}
                                        {selectedCatalogAdminCategoryName === 'Building Blocks' && (
                                          <div className="bulk-import-editor-field">
                                            <label>BrickLink ID</label>
                                            <input type="text" value={cur.bricklink_id || ''} onChange={e => updateBulkRow(bulkImportIdx, { bricklink_id: e.target.value })} placeholder="e.g. col473" />
                                          </div>
                                        )}
                                        {selectedCatalogAdminCategoryName === 'Building Blocks' && (
                                          <div className="bulk-import-editor-field">
                                            <label>Rebrickable ID</label>
                                            <input type="text" value={cur.rebrickable_fig_id || ''} onChange={e => updateBulkRow(bulkImportIdx, { rebrickable_fig_id: e.target.value })} placeholder="e.g. fig-001234" />
                                          </div>
                                        )}
                                        {CARD_CONDITION_CATEGORIES.has(selectedCatalogAdminCategoryName) ? (
                                          <div className="bulk-import-editor-field">
                                            <label>Print Count</label>
                                            <input type="number" min="1" value={cur.print_count || ''} onChange={e => updateBulkRow(bulkImportIdx, { print_count: e.target.value })} />
                                          </div>
                                        ) : (
                                          <div className="bulk-import-editor-field">
                                            <label>Piece Count</label>
                                            <input type="number" min="1" value={cur.piece_count || ''} onChange={e => updateBulkRow(bulkImportIdx, { piece_count: e.target.value })} />
                                          </div>
                                        )}
                                        {CARD_CONDITION_CATEGORIES.has(selectedCatalogAdminCategoryName) && (
                                          <div className="bulk-import-editor-field">
                                            <label>Card Number</label>
                                            <input type="text" value={cur.card_number || ''} onChange={e => updateBulkRow(bulkImportIdx, { card_number: e.target.value })} />
                                          </div>
                                        )}
                                        <div className="bulk-import-editor-field">
                                          <label>Release Year</label>
                                          <input type="number" min="1932" max="2100" value={cur.release_year || ''} onChange={e => updateBulkRow(bulkImportIdx, { release_year: e.target.value })} />
                                        </div>
                                        <div className="bulk-import-editor-field">
                                          <label>UPC</label>
                                          <input type="text" value={cur.upc || ''} onChange={e => updateBulkRow(bulkImportIdx, { upc: e.target.value })} />
                                        </div>
                                        {CARD_CONDITION_CATEGORIES.has(selectedCatalogAdminCategoryName) && catalogAllCardTypes.filter(ct => ct.name !== 'Normal').length > 0 && (
                                          <div className="bulk-import-editor-field bulk-import-editor-field--wide">
                                            <label>Card Treatments <span className="catalog-admin-hint">(none = Normal)</span></label>
                                            <div className="catalog-admin-team-list">
                                              {catalogAllCardTypes.filter(ct => ct.name !== 'Normal').map(ct => (
                                                <label key={ct.id} className="catalog-admin-team-checkbox">
                                                  <input
                                                    type="checkbox"
                                                    checked={(cur.card_type_ids || []).includes(ct.id)}
                                                    onChange={e => updateBulkRow(bulkImportIdx, { card_type_ids: e.target.checked ? [...(cur.card_type_ids || []), ct.id] : (cur.card_type_ids || []).filter(id => id !== ct.id) })}
                                                  />
                                                  <span>{ct.name}</span>
                                                </label>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        <div className="bulk-import-editor-field bulk-import-editor-field--wide">
                                          <label>Factions / Affiliation</label>
                                          {(cur.team_ids || []).length > 0 && (
                                            <div className="catalog-admin-subject-tags" style={{ marginBottom: 4 }}>
                                              {(cur.team_ids || []).map(tid => {
                                                const tm = catalogAdminTeams.find(t => t.id === tid)
                                                if (!tm) return null
                                                return (
                                                  <span key={tid} className="catalog-admin-subject-tag">
                                                    <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{tm.name}</span>
                                                    <button type="button" className="catalog-admin-subject-tag-remove" onClick={() => updateBulkRow(bulkImportIdx, { team_ids: (cur.team_ids || []).filter(id => id !== tid) })}>✕</button>
                                                  </span>
                                                )
                                              })}
                                            </div>
                                          )}
                                          <div className="catalog-admin-subject-search-wrap">
                                            <input
                                              className="catalog-admin-inline-input"
                                              style={{ width: '100%' }}
                                              placeholder="Search factions…"
                                              value={bulkImportTeamSearch}
                                              onChange={e => setBulkImportTeamSearch(e.target.value)}
                                              autoComplete="off"
                                            />
                                            {bulkImportTeamSearch.trim().length > 0 && (() => {
                                              const q = bulkImportTeamSearch.trim().toLowerCase()
                                              const selected = new Set(cur.team_ids || [])
                                              const results = catalogAdminTeams.filter(t => !selected.has(t.id) && t.name.toLowerCase().includes(q))
                                              if (!results.length) return null
                                              return (
                                                <div className="catalog-admin-subject-results">
                                                  {results.map(t => (
                                                    <button key={t.id} type="button" className="catalog-admin-subject-result" onClick={() => { updateBulkRow(bulkImportIdx, { team_ids: [...(cur.team_ids || []), t.id] }); setBulkImportTeamSearch('') }}>
                                                      <span style={{ textTransform: 'uppercase' }}>{t.name}</span>
                                                    </button>
                                                  ))}
                                                </div>
                                              )
                                            })()}
                                          </div>
                                        </div>
                                        {selectedCatalogAdminCategoryName === 'Building Blocks' && (
                                          <div className="bulk-import-editor-field">
                                            <label>LEGO Set Number <span className="catalog-admin-hint">(e.g. 75357 — no variant suffix)</span></label>
                                            <input type="text" value={cur.lego_set_number || ''} onChange={e => updateBulkRow(bulkImportIdx, { lego_set_number: e.target.value })} placeholder="e.g. 75357" />
                                          </div>
                                        )}
                                        {selectedCatalogAdminCategoryName === 'Building Blocks' && (
                                          <div className="bulk-import-editor-field">
                                            <label>Parent Set <span className="catalog-admin-hint">(BrickLink ID or set number of the set this minifig comes in)</span></label>
                                            <input type="text" value={cur.parent_set_bricklink_id || ''} onChange={e => updateBulkRow(bulkImportIdx, { parent_set_bricklink_id: e.target.value })} placeholder="e.g. 75357-1 or 75357" />
                                          </div>
                                        )}
                                        <div className="bulk-import-editor-field bulk-import-editor-field--wide">
                                          <label>Description</label>
                                          <textarea rows={2} value={cur.description || ''} onChange={e => updateBulkRow(bulkImportIdx, { description: e.target.value })} />
                                        </div>
                                        <div className="bulk-import-editor-field bulk-import-editor-field--wide bulk-import-image-field">
                                          <label>Photo</label>
                                          <div className="bulk-import-image-row">
                                            {(cur.image_preview || cur.image_url) && (
                                              <img
                                                src={cur.image_preview || cur.image_url}
                                                alt="preview"
                                                className="bulk-import-image-thumb"
                                                onError={e => { e.target.style.display = 'none' }}
                                              />
                                            )}
                                            <div className="bulk-import-image-controls">
                                              <input
                                                type="text"
                                                placeholder="Image URL (from CSV or paste)"
                                                value={cur.image_url || ''}
                                                onChange={e => updateBulkRow(bulkImportIdx, { image_url: e.target.value, image_file: null, image_preview: '' })}
                                              />
                                              <span className="bulk-import-image-or">or</span>
                                              <label className="bulk-import-image-upload-btn">
                                                Upload file
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  style={{ display: 'none' }}
                                                  onChange={e => {
                                                    const f = e.target.files?.[0]
                                                    if (!f) return
                                                    const preview = URL.createObjectURL(f)
                                                    updateBulkRow(bulkImportIdx, { image_file: f, image_preview: preview, image_url: '' })
                                                  }}
                                                />
                                              </label>
                                              {(cur.image_file || cur.image_url) && (
                                                <button type="button" className="bulk-import-image-clear" onClick={() => updateBulkRow(bulkImportIdx, { image_file: null, image_preview: '', image_url: '' })}>✕</button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        </>)}
                                      </div>
                                      {cur.errorMsg && <p className="catalog-admin-error" style={{ marginTop: 8 }}>{cur.errorMsg}</p>}
                                      <div className="bulk-import-actions">
                                        <button type="button" className="catalog-admin-inline-cancel" onClick={bulkImportSkip} disabled={cur.status === 'saved'}>Skip</button>
                                        <button type="button" className="catalog-action-pill catalog-admin-submit-finish" onClick={bulkImportApprove} disabled={cur.status === 'saved'}>
                                          {cur.status === 'approved' ? 'Approved ✓' : cur.status === 'saved' ? 'Saved ✅' : 'Approve'}
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })()
                      )}
                    </div>
                  ) : (
                  <form className="catalog-admin-form" onSubmit={e => e.preventDefault()}>

                    <p className="catalog-admin-section-title">Classification</p>
                    <div className="catalog-admin-two-col">
                      <div>
                        <label htmlFor="cai-category">Category</label>
                        <select id="cai-category" value={catalogAdminCategoryId} onChange={e => { setCatalogAdminCategoryId(e.target.value); setCatalogAdminSubcategoryId(''); setCatalogAdminFormError('') }}>
                          <option value="">Select category…</option>
                          {catalogAdminCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {catalogAdminInlineCreate.field === 'category' ? (
                          <div className="catalog-admin-inline-create">
                            <input autoFocus className="catalog-admin-inline-input" placeholder="Category name" value={catalogAdminInlineCreate.value} onChange={e => setCatalogAdminInlineCreate(v => ({ ...v, value: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCatalogAdminInlineSave() } if (e.key === 'Escape') setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player' }) }} />
                            <button type="button" className="catalog-admin-inline-save" disabled={!catalogAdminInlineCreate.value.trim() || isSavingCatalogAdminInline} onClick={handleCatalogAdminInlineSave}>{isSavingCatalogAdminInline ? '…' : 'Save'}</button>
                            <button type="button" className="catalog-admin-inline-cancel" onClick={() => setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player', error: '' })}>Cancel</button>
                            {catalogAdminInlineCreate.error && <span className="catalog-admin-inline-error">{catalogAdminInlineCreate.error}</span>}
                          </div>
                        ) : <button type="button" className="catalog-admin-inline-toggle" onClick={() => setCatalogAdminInlineCreate({ field: 'category', value: '', subjectType: 'player' })}>+ New Category</button>}
                      </div>
                      <div>
                        <label htmlFor="cai-subcategory">{getCategoryLabels(catalogAdminCategories.find(c => c.id === catalogAdminCategoryId)?.name || '').subcategory}</label>
                        <select id="cai-subcategory" value={catalogAdminSubcategoryId} onChange={e => { setCatalogAdminSubcategoryId(e.target.value); setCatalogAdminFranchiseId(''); setCatalogAdminFormError('') }} disabled={!catalogAdminCategoryId}>
                          <option value="">Select subcategory…</option>
                          {catalogAdminSubcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        {catalogAdminCategoryId && (catalogAdminInlineCreate.field === 'subcategory' ? (
                          <div className="catalog-admin-inline-create">
                            <input autoFocus className="catalog-admin-inline-input" placeholder="Subcategory name" value={catalogAdminInlineCreate.value} onChange={e => setCatalogAdminInlineCreate(v => ({ ...v, value: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCatalogAdminInlineSave() } if (e.key === 'Escape') setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player' }) }} />
                            <button type="button" className="catalog-admin-inline-save" disabled={!catalogAdminInlineCreate.value.trim() || isSavingCatalogAdminInline} onClick={handleCatalogAdminInlineSave}>{isSavingCatalogAdminInline ? '…' : 'Save'}</button>
                            <button type="button" className="catalog-admin-inline-cancel" onClick={() => setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player', error: '' })}>Cancel</button>
                            {catalogAdminInlineCreate.error && <span className="catalog-admin-inline-error">{catalogAdminInlineCreate.error}</span>}
                          </div>
                        ) : <button type="button" className="catalog-admin-inline-toggle" onClick={() => setCatalogAdminInlineCreate({ field: 'subcategory', value: '', subjectType: 'player' })}>+ New Subcategory</button>)}
                      </div>
                      {!getCategoryLabels(catalogAdminCategories.find(c => c.id === catalogAdminCategoryId)?.name || '').hideFranchise && (
                      <div>
                        <label htmlFor="cai-franchise">{getCategoryLabels(catalogAdminCategories.find(c => c.id === catalogAdminCategoryId)?.name || '').franchise}</label>
                        <select id="cai-franchise" value={catalogAdminRealFranchiseId} onChange={e => { setCatalogAdminRealFranchiseId(e.target.value); setCatalogAdminBrandId(''); setCatalogAdminSubjectIds([]); setCatalogAdminSubjectSearch(''); setCatalogAdminSubjectResults([]); setCatalogAdminTeamIds([]); setCatalogAdminFranchiseId(''); setCatalogAdminSubsetId(''); setCatalogAdminPrintTypeId(''); setCatalogAdminFormError('') }}>
                          <option value="">None</option>
                          {catalogAdminRealFranchises.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                        {catalogAdminInlineCreate.field === 'franchise' ? (
                          <div className="catalog-admin-inline-create">
                            <input autoFocus className="catalog-admin-inline-input" placeholder="Franchise name" value={catalogAdminInlineCreate.value} onChange={e => setCatalogAdminInlineCreate(v => ({ ...v, value: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCatalogAdminInlineSave() } if (e.key === 'Escape') setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player' }) }} />
                            <button type="button" className="catalog-admin-inline-save" disabled={!catalogAdminInlineCreate.value.trim() || isSavingCatalogAdminInline} onClick={handleCatalogAdminInlineSave}>{isSavingCatalogAdminInline ? '…' : 'Save'}</button>
                            <button type="button" className="catalog-admin-inline-cancel" onClick={() => setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player', error: '' })}>Cancel</button>
                            {catalogAdminInlineCreate.error && <span className="catalog-admin-inline-error">{catalogAdminInlineCreate.error}</span>}
                          </div>
                        ) : <button type="button" className="catalog-admin-inline-toggle" onClick={() => setCatalogAdminInlineCreate({ field: 'franchise', value: '', subjectType: 'player' })}>+ New Franchise</button>}
                      </div>
                      )}
                      {/* Item Type — non-LEGO keeps it early because "Set" cascades from it.
                          The LEGO branch renders it after Product Line (taxonomy order). */}
                      {selectedCatalogAdminCategoryName !== 'Building Blocks' && (
                      <div>
                        <label htmlFor="cai-brand">{getCategoryLabels(catalogAdminCategories.find(c => c.id === catalogAdminCategoryId)?.name || '').brand}</label>
                        <select id="cai-brand" value={catalogAdminBrandId} onChange={e => { setCatalogAdminBrandId(e.target.value); setCatalogAdminFranchiseId(''); setCatalogAdminSubsetId(''); setCatalogAdminPrintTypeId(''); setCatalogAdminPackagingId(''); setCatalogAdminFormError('') }} disabled={!catalogAdminRealFranchiseId}>
                          <option value="">None</option>
                          {catalogAdminBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        {catalogAdminInlineCreate.field === 'brand' ? (
                          <div className="catalog-admin-inline-create">
                            <input autoFocus className="catalog-admin-inline-input" placeholder="Brand name" value={catalogAdminInlineCreate.value} onChange={e => setCatalogAdminInlineCreate(v => ({ ...v, value: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCatalogAdminInlineSave() } if (e.key === 'Escape') setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player' }) }} />
                            <button type="button" className="catalog-admin-inline-save" disabled={!catalogAdminInlineCreate.value.trim() || isSavingCatalogAdminInline} onClick={handleCatalogAdminInlineSave}>{isSavingCatalogAdminInline ? '…' : 'Save'}</button>
                            <button type="button" className="catalog-admin-inline-cancel" onClick={() => setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player', error: '' })}>Cancel</button>
                            {catalogAdminInlineCreate.error && <span className="catalog-admin-inline-error">{catalogAdminInlineCreate.error}</span>}
                          </div>
                        ) : <button type="button" className="catalog-admin-inline-toggle" onClick={() => setCatalogAdminInlineCreate({ field: 'brand', value: '', subjectType: 'player' })}>+ New Brand</button>}
                      </div>
                      )}
                      {selectedCatalogAdminCategoryName === 'Building Blocks' ? (
                        <>
                          {/* Subtheme (subset) — depends on Theme (franchise) */}
                          <div>
                            <label htmlFor="cai-subtheme">{getCategoryLabels('Building Blocks').subset} {!catalogAdminRealFranchiseId && <span className="catalog-admin-hint">(select a theme first)</span>}</label>
                            <select id="cai-subtheme" value={catalogAdminSubsetSel} onChange={e => { setCatalogAdminSubsetSel(e.target.value); setCatalogAdminProductLineIds([]); setCatalogAdminFormError('') }} disabled={!catalogAdminRealFranchiseId}>
                              <option value="">None</option>
                              {catalogAdminSubsetsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {catalogAdminRealFranchiseId && (catalogAdminInlineCreate.field === 'subtheme' ? (
                              <div className="catalog-admin-inline-create">
                                <input autoFocus className="catalog-admin-inline-input" placeholder="Subtheme name" value={catalogAdminInlineCreate.value} onChange={e => setCatalogAdminInlineCreate(v => ({ ...v, value: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCatalogAdminInlineSave() } if (e.key === 'Escape') setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player' }) }} />
                                <button type="button" className="catalog-admin-inline-save" disabled={!catalogAdminInlineCreate.value.trim() || isSavingCatalogAdminInline} onClick={handleCatalogAdminInlineSave}>{isSavingCatalogAdminInline ? '…' : 'Save'}</button>
                                <button type="button" className="catalog-admin-inline-cancel" onClick={() => setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player', error: '' })}>Cancel</button>
                                {catalogAdminInlineCreate.error && <span className="catalog-admin-inline-error">{catalogAdminInlineCreate.error}</span>}
                              </div>
                            ) : <button type="button" className="catalog-admin-inline-toggle" onClick={() => setCatalogAdminInlineCreate({ field: 'subtheme', value: '', subjectType: 'player' })}>+ New Subtheme</button>)}
                          </div>
                          {/* Product Line — under the Theme; Subtheme optional */}
                          <div>
                            <label htmlFor="cai-productline">{getCategoryLabels(selectedCatalogAdminCategoryName).property} {!catalogAdminRealFranchiseId ? <span className="catalog-admin-hint">(select a theme first)</span> : (!catalogAdminSubsetSel && <span className="catalog-admin-hint">(all — or pick a subfranchise to narrow)</span>)}</label>
                            <select id="cai-productline" value={catalogAdminProductLineIds[0] || ''} onChange={e => setCatalogAdminProductLineIds(e.target.value ? [e.target.value] : [])} disabled={!catalogAdminRealFranchiseId}>
                              <option value="">None</option>
                              {catalogAdminProductLinesList.map(pl => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
                            </select>
                            {catalogAdminRealFranchiseId && (catalogAdminInlineCreate.field === 'property' ? (
                              <div className="catalog-admin-inline-create">
                                <input autoFocus className="catalog-admin-inline-input" placeholder="Property name" value={catalogAdminInlineCreate.value} onChange={e => setCatalogAdminInlineCreate(v => ({ ...v, value: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCatalogAdminInlineSave() } if (e.key === 'Escape') setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player' }) }} />
                                <button type="button" className="catalog-admin-inline-save" disabled={!catalogAdminInlineCreate.value.trim() || isSavingCatalogAdminInline} onClick={handleCatalogAdminInlineSave}>{isSavingCatalogAdminInline ? '…' : 'Save'}</button>
                                <button type="button" className="catalog-admin-inline-cancel" onClick={() => setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player', error: '' })}>Cancel</button>
                                {catalogAdminInlineCreate.error && <span className="catalog-admin-inline-error">{catalogAdminInlineCreate.error}</span>}
                              </div>
                            ) : <button type="button" className="catalog-admin-inline-toggle" onClick={() => setCatalogAdminInlineCreate({ field: 'property', value: '', subjectType: 'player' })}>+ New {getCategoryLabels(selectedCatalogAdminCategoryName).property}</button>)}
                          </div>
                          {/* Item Type — taxonomy order: after Product Line, before Series */}
                          <div>
                            <label htmlFor="cai-brand">{getCategoryLabels('Building Blocks').brand}</label>
                            <select id="cai-brand" value={catalogAdminBrandId} onChange={e => { setCatalogAdminBrandId(e.target.value); setCatalogAdminFranchiseId(''); setCatalogAdminSubsetId(''); setCatalogAdminPrintTypeId(''); setCatalogAdminPackagingId(''); setCatalogAdminFormError('') }}>
                              <option value="">None</option>
                              {catalogAdminBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
                      <div>
                        <label htmlFor="cai-set">{getCategoryLabels(catalogAdminCategories.find(c => c.id === catalogAdminCategoryId)?.name || '').collectibleSet}</label>
                        <select id="cai-set" value={catalogAdminFranchiseId} onChange={e => { setCatalogAdminFranchiseId(e.target.value); setCatalogAdminSubsetId(''); setCatalogAdminFormError('') }} disabled={!catalogAdminBrandId}>
                          <option value="">None</option>
                          {catalogAdminFranchises.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        {catalogAdminInlineCreate.field === 'set' ? (
                          <div className="catalog-admin-inline-create">
                            <input autoFocus className="catalog-admin-inline-input" placeholder="Set name" value={catalogAdminInlineCreate.value} onChange={e => setCatalogAdminInlineCreate(v => ({ ...v, value: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCatalogAdminInlineSave() } if (e.key === 'Escape') setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player' }) }} />
                            <button type="button" className="catalog-admin-inline-save" disabled={!catalogAdminInlineCreate.value.trim() || isSavingCatalogAdminInline} onClick={handleCatalogAdminInlineSave}>{isSavingCatalogAdminInline ? '…' : 'Save'}</button>
                            <button type="button" className="catalog-admin-inline-cancel" onClick={() => setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player', error: '' })}>Cancel</button>
                            {catalogAdminInlineCreate.error && <span className="catalog-admin-inline-error">{catalogAdminInlineCreate.error}</span>}
                          </div>
                        ) : <button type="button" className="catalog-admin-inline-toggle" onClick={() => setCatalogAdminInlineCreate({ field: 'set', value: '', subjectType: 'player' })}>+ New Set</button>}
                      </div>
                      <div>
                        <label htmlFor="cai-subset">{getCategoryLabels(catalogAdminCategories.find(c => c.id === catalogAdminCategoryId)?.name || '').subset} {!catalogAdminFranchiseId && <span className="catalog-admin-hint">(select a set first)</span>}</label>
                        <select id="cai-subset" value={catalogAdminSubsetId} onChange={e => setCatalogAdminSubsetId(e.target.value)} disabled={!catalogAdminFranchiseId}>
                          <option value="">None</option>
                          {catalogAdminSubsets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        {catalogAdminFranchiseId && (catalogAdminInlineCreate.field === 'subset' ? (
                          <div className="catalog-admin-inline-create">
                            <input autoFocus className="catalog-admin-inline-input" placeholder="Subset name" value={catalogAdminInlineCreate.value} onChange={e => setCatalogAdminInlineCreate(v => ({ ...v, value: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCatalogAdminInlineSave() } if (e.key === 'Escape') setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player' }) }} />
                            <button type="button" className="catalog-admin-inline-save" disabled={!catalogAdminInlineCreate.value.trim() || isSavingCatalogAdminInline} onClick={handleCatalogAdminInlineSave}>{isSavingCatalogAdminInline ? '…' : 'Save'}</button>
                            <button type="button" className="catalog-admin-inline-cancel" onClick={() => setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player', error: '' })}>Cancel</button>
                            {catalogAdminInlineCreate.error && <span className="catalog-admin-inline-error">{catalogAdminInlineCreate.error}</span>}
                          </div>
                        ) : <button type="button" className="catalog-admin-inline-toggle" onClick={() => setCatalogAdminInlineCreate({ field: 'subset', value: '', subjectType: 'player' })}>+ New Subset</button>)}
                      </div>
                        </>
                      )}
                      {/* Series (facet) — subcategory-scoped, optional, all categories */}
                      <div>
                          <label htmlFor="cai-series">Series {catalogAdminSubcategoryId ? <span className="catalog-admin-hint">(optional)</span> : <span className="catalog-admin-hint">(select a subcategory first)</span>}</label>
                          <select id="cai-series" value={catalogAdminSeriesId} onChange={e => setCatalogAdminSeriesId(e.target.value)} disabled={!catalogAdminSubcategoryId}>
                            <option value="">None</option>
                            {catalogAdminSeriesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          {catalogAdminSubcategoryId && (catalogAdminInlineCreate.field === 'series' ? (
                            <div className="catalog-admin-inline-create">
                              <input autoFocus className="catalog-admin-inline-input" placeholder="Series name (e.g. UCS, Topps Chrome)" value={catalogAdminInlineCreate.value} onChange={e => setCatalogAdminInlineCreate(v => ({ ...v, value: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCatalogAdminInlineSave() } if (e.key === 'Escape') setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player' }) }} />
                              <button type="button" className="catalog-admin-inline-save" disabled={!catalogAdminInlineCreate.value.trim() || isSavingCatalogAdminInline} onClick={handleCatalogAdminInlineSave}>{isSavingCatalogAdminInline ? '…' : 'Save'}</button>
                              <button type="button" className="catalog-admin-inline-cancel" onClick={() => setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player', error: '' })}>Cancel</button>
                              {catalogAdminInlineCreate.error && <span className="catalog-admin-inline-error">{catalogAdminInlineCreate.error}</span>}
                            </div>
                          ) : <button type="button" className="catalog-admin-inline-toggle" onClick={() => setCatalogAdminInlineCreate({ field: 'series', value: '', subjectType: 'player' })}>+ New Series</button>)}
                      </div>
                      {/* Packaging — metadata, not a classification; sits last.
                          Sets only: minifigs have no packaging. */}
                      {selectedCatalogAdminCategoryName === 'Building Blocks'
                        && catalogAdminBrands.find(b => b.id === catalogAdminBrandId)?.name !== 'Minifigs' && (
                        <div>
                          <label htmlFor="cai-packaging">{getCategoryLabels('Building Blocks').collectibleSet}</label>
                          <select id="cai-packaging" value={catalogAdminPackagingId} onChange={e => setCatalogAdminPackagingId(e.target.value)}>
                            <option value="">None</option>
                            {catalogAdminPackagingList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                      )}
                    </div>

                    <p className="catalog-admin-section-title">{getCategoryLabels(catalogAdminCategories.find(c => c.id === catalogAdminCategoryId)?.name || '').subject}</p>
                    <div className="catalog-admin-two-col">
                      <div>
                        <label>{getCategoryLabels(catalogAdminCategories.find(c => c.id === catalogAdminCategoryId)?.name || '').subject}</label>
                        {catalogAdminSubjectIds.length > 0 && (
                          <div className="catalog-admin-subject-tags">
                            {catalogAdminSubjectIds.map(s => (
                              <span key={s.id} className="catalog-admin-subject-tag">
                                <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{s.name}</span>
                                <span className="catalog-admin-hint"> · {s.type}</span>
                                <button type="button" className="catalog-admin-subject-tag-remove" onClick={() => handleCatalogAdminRemoveSubject(s.id)}>✕</button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="catalog-admin-subject-search-wrap">
                          <input
                            className="catalog-admin-inline-input"
                            style={{ width: '100%' }}
                            placeholder="Search subjects to add…"
                            value={catalogAdminSubjectSearch}
                            onChange={e => setCatalogAdminSubjectSearch(e.target.value)}
                            autoComplete="off"
                          />
                          {catalogAdminSubjectIsSearching && <p className="catalog-admin-hint">Searching…</p>}
                          {catalogAdminSubjectResults.length > 0 && (
                            <div className="catalog-admin-subject-results">
                              {catalogAdminSubjectResults.map(s => (
                                <button key={s.id} type="button" className="catalog-admin-subject-result" onClick={() => handleCatalogAdminSelectSubject(s)}>
                                  <span style={{ textTransform: 'uppercase' }}>{s.name}</span>
                                  <span className="catalog-admin-hint"> · {s.type}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {catalogAdminInlineCreate.field === 'subject' ? (
                          <div className="catalog-admin-inline-create" style={{ marginTop: 6 }}>
                            <input autoFocus className="catalog-admin-inline-input" placeholder="Subject name" value={catalogAdminInlineCreate.value} onChange={e => setCatalogAdminInlineCreate(v => ({ ...v, value: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCatalogAdminInlineSave() } if (e.key === 'Escape') setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player', speciesId: '', error: '' }) }} />
                            <select value={catalogAdminInlineCreate.subjectType} onChange={e => setCatalogAdminInlineCreate(v => ({ ...v, subjectType: e.target.value, speciesId: '' }))} className="catalog-admin-inline-input" style={{ width: 'auto' }}>
                              <option value="player">Player</option>
                              <option value="character">Character</option>
                              <option value="comic">Comic</option>
                              <option value="artist">Artist</option>
                              <option value="set">Set</option>
                            </select>
                            {catalogAdminInlineCreate.subjectType === 'character' && (
                              <select value={catalogAdminInlineCreate.speciesId} onChange={e => setCatalogAdminInlineCreate(v => ({ ...v, speciesId: e.target.value }))} className="catalog-admin-inline-input" style={{ width: 'auto' }}>
                                <option value="">No species</option>
                                {catalogAdminSpecies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                            )}
                            <button type="button" className="catalog-admin-inline-save" disabled={!catalogAdminInlineCreate.value.trim() || isSavingCatalogAdminInline} onClick={handleCatalogAdminInlineSave}>{isSavingCatalogAdminInline ? '…' : 'Save'}</button>
                            <button type="button" className="catalog-admin-inline-cancel" onClick={() => setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player', speciesId: '', error: '' })}>Cancel</button>
                            {catalogAdminInlineCreate.error && <span className="catalog-admin-inline-error">{catalogAdminInlineCreate.error}</span>}
                          </div>
                        ) : <button type="button" className="catalog-admin-inline-toggle" style={{ marginTop: 4 }} onClick={() => setCatalogAdminInlineCreate({ field: 'subject', value: catalogAdminSubjectSearch, subjectType: 'player', speciesId: '', error: '' })}>+ New Subject</button>}
                      </div>
                      <div>
                        <label>Team / Affiliation {!catalogAdminRealFranchiseId && <span className="catalog-admin-hint">(select a franchise first)</span>}</label>
                        {catalogAdminRealFranchiseId ? (
                          catalogAdminTeams.length > 0 ? (
                            <div className="catalog-admin-team-list">
                              {catalogAdminTeams.map(tm => (
                                <label key={tm.id} className="catalog-admin-team-checkbox">
                                  <input type="checkbox" checked={catalogAdminTeamIds.includes(tm.id)} onChange={e => setCatalogAdminTeamIds(prev => e.target.checked ? [...prev, tm.id] : prev.filter(id => id !== tm.id))} />
                                  <span style={{ textTransform: 'uppercase' }}>{tm.name}</span>
                                </label>
                              ))}
                            </div>
                          ) : <p className="catalog-admin-hint" style={{ margin: '4px 0' }}>No teams in this franchise yet.</p>
                        ) : null}
                        {catalogAdminInlineCreate.field === 'team' ? (
                          <div className="catalog-admin-inline-create">
                            <input autoFocus className="catalog-admin-inline-input" placeholder="Team name" value={catalogAdminInlineCreate.value} onChange={e => setCatalogAdminInlineCreate(v => ({ ...v, value: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCatalogAdminInlineSave() } if (e.key === 'Escape') setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player', speciesId: '', error: '' }) }} />
                            <button type="button" className="catalog-admin-inline-save" disabled={!catalogAdminInlineCreate.value.trim() || isSavingCatalogAdminInline} onClick={handleCatalogAdminInlineSave}>{isSavingCatalogAdminInline ? '…' : 'Save'}</button>
                            <button type="button" className="catalog-admin-inline-cancel" onClick={() => setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player', speciesId: '', error: '' })}>Cancel</button>
                            {catalogAdminInlineCreate.error && <span className="catalog-admin-inline-error">{catalogAdminInlineCreate.error}</span>}
                          </div>
                        ) : catalogAdminRealFranchiseId ? <button type="button" className="catalog-admin-inline-toggle" onClick={() => setCatalogAdminInlineCreate({ field: 'team', value: '', subjectType: 'player', speciesId: '', error: '' })}>+ New Team</button> : null}
                      </div>
                    </div>

                    <p className="catalog-admin-section-title">Item Info</p>
                    <div className="catalog-admin-two-col">
                      <div>
                        <label htmlFor="cai-bricklink-id">BrickLink ID <span className="catalog-admin-hint">{selectedCatalogAdminCategoryName === 'Building Blocks' ? '(e.g. col473 or 75192)' : '(optional)'}</span></label>
                        <input id="cai-bricklink-id" type="text" value={catalogAdminBricklinkId} onChange={e => setCatalogAdminBricklinkId(e.target.value)} placeholder={selectedCatalogAdminCategoryName === 'Building Blocks' ? 'e.g. col473' : ''} />
                      </div>
                      <div>
                        <label htmlFor="cai-release-year">Release Year</label>
                        <input id="cai-release-year" type="number" min="1932" max="2100" value={catalogAdminReleaseYear} onChange={e => setCatalogAdminReleaseYear(e.target.value)} placeholder="e.g. 2023" />
                      </div>
                    </div>

                    <p className="catalog-admin-section-title">
                      {selectedCatalogAdminCategoryName === 'Building Blocks' ? 'Set / Minifig Details' : 'Card Details'}
                    </p>
                    <div className="catalog-admin-two-col">
                      {selectedCatalogAdminCategoryName === 'Building Blocks' ? (
                        <>
                          <div>
                            <label htmlFor="cai-rebrickable-id">Rebrickable ID <span className="catalog-admin-hint">(e.g. fig-001234)</span></label>
                            <input id="cai-rebrickable-id" type="text" value={catalogAdminRebrickableId} onChange={e => setCatalogAdminRebrickableId(e.target.value)} placeholder="e.g. fig-001234" />
                          </div>
                          <div>
                            <label htmlFor="cai-upc">UPC <span className="catalog-admin-hint">(barcode)</span></label>
                            <input id="cai-upc" type="text" value={catalogAdminUpc} onChange={e => setCatalogAdminUpc(e.target.value)} placeholder="e.g. 673419376358" />
                          </div>
                          <div>
                            <label htmlFor="cai-piece-count">Piece Count</label>
                            <input id="cai-piece-count" type="number" min="1" value={catalogAdminPieceCount} onChange={e => setCatalogAdminPieceCount(e.target.value)} placeholder="e.g. 1989" />
                          </div>
                          <div>
                            <label htmlFor="cai-set-number">Set Number <span className="catalog-admin-hint">(sets — e.g. 75192)</span></label>
                            <input id="cai-set-number" type="text" value={catalogAdminLegoSetNumber} onChange={e => setCatalogAdminLegoSetNumber(e.target.value)} placeholder="e.g. 75192" />
                          </div>
                          <div>
                            <label htmlFor="cai-retail-price">Retail Price <span className="catalog-admin-hint">(MSRP, CAD)</span></label>
                            <input id="cai-retail-price" type="number" min="0" step="0.01" value={catalogAdminRetailPrice} onChange={e => setCatalogAdminRetailPrice(e.target.value)} placeholder="e.g. 169.99" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label htmlFor="cai-print-type">Print Type {!catalogAdminSubsetId && <span className="catalog-admin-hint">(select a subset first)</span>}</label>
                            <select id="cai-print-type" value={catalogAdminPrintTypeId} onChange={e => setCatalogAdminPrintTypeId(e.target.value)} disabled={!catalogAdminSubsetId}>
                              <option value="">None</option>
                              {catalogAdminPrintTypes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            {catalogAdminInlineCreate.field === 'printType' ? (
                              <div className="catalog-admin-inline-create">
                                <input autoFocus className="catalog-admin-inline-input" placeholder="Print type name" value={catalogAdminInlineCreate.value} onChange={e => setCatalogAdminInlineCreate(v => ({ ...v, value: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCatalogAdminInlineSave() } if (e.key === 'Escape') setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player' }) }} />
                                <button type="button" className="catalog-admin-inline-save" disabled={!catalogAdminInlineCreate.value.trim() || isSavingCatalogAdminInline} onClick={handleCatalogAdminInlineSave}>{isSavingCatalogAdminInline ? '…' : 'Save'}</button>
                                <button type="button" className="catalog-admin-inline-cancel" onClick={() => setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player', error: '' })}>Cancel</button>
                                {catalogAdminInlineCreate.error && <span className="catalog-admin-inline-error">{catalogAdminInlineCreate.error}</span>}
                              </div>
                            ) : <button type="button" className="catalog-admin-inline-toggle" onClick={() => setCatalogAdminInlineCreate({ field: 'printType', value: '', subjectType: 'player' })}>+ New Print Type</button>}
                          </div>
                          <div>
                            <label>Card Treatments <span className="catalog-admin-hint">(none = Normal)</span></label>
                            {(() => {
                              const createCardTypes = catalogAdminCardTypes.filter(c => {
                                if (c.name === 'Normal') return false
                                return catalogAdminIsMtg ? MTG_CARD_TREATMENT_NAMES.has(c.name) : SPORTS_CARD_TYPE_NAMES.has(c.name)
                              })
                              return createCardTypes.length > 0 ? (
                                <div className="catalog-admin-team-list">
                                  {createCardTypes.map(c => (
                                    <label key={c.id} className="catalog-admin-team-checkbox">
                                      <input type="checkbox" checked={catalogAdminCardTypeIds.includes(c.id)}
                                        onChange={e => setCatalogAdminCardTypeIds(prev => e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id))} />
                                      <span>{c.name}</span>
                                    </label>
                                  ))}
                                </div>
                              ) : null
                            })()}
                          </div>
                          {catalogRarities.length > 0 && (
                            <div>
                              <label htmlFor="cai-rarity">Rarity</label>
                              <select id="cai-rarity" value={catalogAdminRarityId} onChange={e => setCatalogAdminRarityId(e.target.value)}>
                                <option value="">— Select —</option>
                                {catalogRarities.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                              </select>
                            </div>
                          )}
                          {catalogAdminIsMtg && (
                            <div>
                              <label htmlFor="cai-mtg-type">Card Type</label>
                              <select id="cai-mtg-type" value={catalogAdminMtgCardTypeId} onChange={e => setCatalogAdminMtgCardTypeId(e.target.value)}>
                                <option value="">— Select —</option>
                                {catalogMtgCardTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                              </select>
                            </div>
                          )}
                          <div>
                            <label htmlFor="cai-card-number">Card Number</label>
                            <input id="cai-card-number" type="text" value={catalogAdminCardNumber} onChange={e => setCatalogAdminCardNumber(e.target.value)} placeholder="e.g. 150" />
                          </div>
                          <div>
                            <label htmlFor="cai-print-count">Print Count</label>
                            <input id="cai-print-count" type="number" min="1" value={catalogAdminPrintCount} onChange={e => setCatalogAdminPrintCount(e.target.value)} placeholder="e.g. 99" />
                          </div>
                        </>
                      )}
                    </div>

                    <p className="catalog-admin-section-title">Notes</p>
                    <label htmlFor="cai-description">Description</label>
                    <textarea id="cai-description" rows={3} value={catalogAdminItemDescription} onChange={e => { setCatalogAdminItemDescription(e.target.value); setCatalogAdminFormError('') }} placeholder="Optional notes about this card" />

                    <p className="catalog-admin-section-title">Images</p>
                    <div className="catalog-admin-two-col">
                      <div>
                        <label className="catalog-admin-image-slot-label">Front <span className="catalog-admin-hint">(optional)</span></label>
                        <label className="catalog-admin-image-pick">
                          {catalogAdminFrontImageFile
                            ? <><span className="catalog-admin-image-pick-name">{catalogAdminFrontImageFile.name}</span><span className="catalog-admin-image-pick-change">Change</span></>
                            : <><span className="catalog-admin-image-pick-icon">+</span><span>Add front image</span></>
                          }
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { setCatalogAdminFrontImageFile(e.target.files?.[0] || null); e.target.value = '' }} />
                        </label>
                        {catalogAdminFrontImageFile && <button type="button" className="catalog-admin-inline-cancel" style={{ marginTop: 4 }} onClick={() => setCatalogAdminFrontImageFile(null)}>Remove</button>}
                      </div>
                      <div>
                        <label className="catalog-admin-image-slot-label">Back <span className="catalog-admin-hint">(optional)</span></label>
                        <label className="catalog-admin-image-pick">
                          {catalogAdminBackImageFile
                            ? <><span className="catalog-admin-image-pick-name">{catalogAdminBackImageFile.name}</span><span className="catalog-admin-image-pick-change">Change</span></>
                            : <><span className="catalog-admin-image-pick-icon">+</span><span>Add back image</span></>
                          }
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { setCatalogAdminBackImageFile(e.target.files?.[0] || null); e.target.value = '' }} />
                        </label>
                        {catalogAdminBackImageFile && <button type="button" className="catalog-admin-inline-cancel" style={{ marginTop: 4 }} onClick={() => setCatalogAdminBackImageFile(null)}>Remove</button>}
                      </div>
                    </div>

                    {catalogAdminFormError && <p className="catalog-admin-error">{catalogAdminFormError}</p>}

                    <div className="catalog-admin-form-footer">
                      <button type="button" className="catalog-action-pill catalog-admin-submit" disabled={isCreatingCatalogItem} onClick={() => handleCreateCatalogItemInApp('another')}>
                        {isCreatingCatalogItem ? '…' : '+ Add Another'}
                      </button>
                      <button type="button" className="catalog-action-pill catalog-admin-submit catalog-admin-submit-finish" disabled={isCreatingCatalogItem} onClick={() => handleCreateCatalogItemInApp('finish')}>
                        {isCreatingCatalogItem ? 'Saving…' : 'Finish'}
                      </button>
                    </div>
                  </form>
                  )}
                </section>
              </div>
            )}
          </section>
  )
}
