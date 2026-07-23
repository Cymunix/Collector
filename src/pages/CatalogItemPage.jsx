import React from 'react'

export default function CatalogItemPage({ scope }) {
  const {
    Admin,
    BGS_SUBGRADE_FIELDS,
    BGS_SUBGRADE_OPTIONS,
    CARD_CONDITION_CATEGORIES,
    DEFAULT_BGS_SUBGRADES,
    GRADING_COMPANIES,
    LEGO_PRESENCE_OPTIONS,
    LEGO_SET_BOX_GRADES,
    activeGradeEntry,
    activeGradeScale,
    addSetMinifigLink,
    admin,
    advanceImageQueue,
    bgsAllSubgradesAreTen,
    bgsAllSubgradesSet,
    bgsCertLookupUrl,
    catalogBrands,
    catalogCategories,
    catalogDetailAverageRating,
    catalogDetailBgsSubgrades,
    catalogDetailCardTypes,
    catalogDetailCertNumber,
    catalogDetailGradingCompany,
    catalogDetailIncludedIn,
    catalogDetailIncludes,
    catalogDetailIsGraded,
    catalogDetailLego,
    catalogDetailLegoCond,
    catalogDetailMtgCardTypeId,
    catalogDetailParentSets,
    catalogDetailRarityId,
    catalogDetailReviews,
    catalogDetailSelectedGrade,
    catalogDetailSetMinifigs,
    catalogDetailStats,
    catalogDetailSubjects,
    catalogDetailTeams,
    catalogDetailViewTab,
    catalogItemEditCardTypeIds,
    catalogItemEditError,
    catalogItemEditLookups,
    catalogItemEditMtgCardTypeId,
    catalogItemEditRarityId,
    catalogItemEditSubjectIds,
    catalogItemEditSubjectIsSearching,
    catalogItemEditSubjectResults,
    catalogItemEditSubjectSearch,
    catalogItemEditTeamIds,
    catalogItemEditValues,
    catalogItemImages,
    catalogItemIsMtg,
    catalogItemOrigin,
    catalogMarketVariants,
    catalogMtgCardTypes,
    catalogPricingSource,
    catalogRarities,
    catalogRawItemRow,
    catalogSetNavIndex,
    catalogSetNavItems,
    catalogSubcategories,
    cgcCertLookupUrl,
    conditionOptions,
    currentUser,
    effectiveBgsGradeEntry,
    exitImageQueue,
    formatUsd,
    getCategoryLabels,
    getListingCertNumber,
    handleAddRelatedItem,
    handleCatalogItemEditRemoveSubject,
    handleCatalogItemEditSelectSubject,
    handleDeleteCatalogItemImage,
    handleMiAddByUrl,
    handleMiApproveCandidate,
    handleMiFindImages,
    handleMiRejectCandidate,
    handleMiRemove,
    handleMiReorder,
    handleMiSaveSource,
    handleMiSetPrimary,
    handleMiUpload,
    handleOpenAddToCollectionModal,
    handleOpenCatalogItem,
    handleOpenCatalogItemEdit,
    handleRelSetQuantity,
    handleRemoveRelated,
    handleSaveCatalogItem,
    handleUploadCatalogItemImage,
    imageQueueActive,
    imageQueueItems,
    imageQueuePos,
    insights,
    isBgsActive,
    isBgsBlackLabel,
    isCardConditionCategory,
    isCatalogItemEditMode,
    isCgcActive,
    isLegoConditionCategory,
    isLegoMinifig,
    isLegoSet,
    isListingCertVerified,
    isPlatformAdmin,
    isPsaActive,
    isSavingCatalogItem,
    isSavingLink,
    isTAGActive,
    isUploadingCatalogItemImage,
    linkQty,
    linkResults,
    linkSearch,
    listings,
    localAvailability,
    manageImagesBusy,
    manageImagesCandidates,
    manageImagesEditSourceId,
    manageImagesError,
    manageImagesJobs,
    manageImagesNotice,
    manageImagesSourceDraft,
    manageImagesUrlDraft,
    marketPrice,
    marketTrendLabel,
    marketTrendPercent,
    marketplaceCompletionMatches,
    metric30Day,
    metricAllTimeHigh,
    metricLowListing,
    miResolveUrl,
    openCatalogItemById,
    openLightbox,
    ownershipCount,
    performQuickAdd,
    profile,
    psaCertLookupUrl,
    psaPrestigeScore,
    quickAddMode,
    relAddMode,
    relAddQty,
    relBusy,
    relError,
    relSearch,
    relSearchResults,
    removeSetMinifigLink,
    searchLegoItemsToLink,
    selectedCatalogItem,
    selectedCatalogItemCategoryLabels,
    selectedCatalogItemMetadata,
    selectedCondition,
    setCatalogBrandId,
    setCatalogCardTypeIds,
    setCatalogCategory,
    setCatalogDetailBgsSubgrades,
    setCatalogDetailCertNumber,
    setCatalogDetailGradingCompany,
    setCatalogDetailIsGraded,
    setCatalogDetailLegoCond,
    setCatalogDetailSelectedCondition,
    setCatalogDetailSelectedGrade,
    setCatalogDetailTagDigReport,
    setCatalogDetailTagLookupError,
    setCatalogDetailTagPopulation,
    setCatalogDetailTagScore,
    setCatalogDetailTagScoreRank,
    setCatalogDetailTagVerifiedSlab,
    setCatalogDetailViewTab,
    setCatalogFranchise,
    setCatalogItemEditCardTypeIds,
    setCatalogItemEditMtgCardTypeId,
    setCatalogItemEditRarityId,
    setCatalogItemEditSubjectSearch,
    setCatalogItemEditTeamIds,
    setCatalogItemEditValues,
    setCatalogMaxYear,
    setCatalogMinYear,
    setCatalogPricingSource,
    setCatalogPrintTypeId,
    setCatalogSetId,
    setCatalogSubcategory,
    setCatalogSubjectId,
    setCatalogSubjectSearch,
    setCatalogSubsetId,
    setCatalogTeamId,
    setCurrentScreen,
    setIsCatalogDetailTagLookupLoading,
    setIsCatalogItemEditMode,
    setLinkQty,
    setLinkResults,
    setLinkSearch,
    setManageImagesEditSourceId,
    setManageImagesSourceDraft,
    setManageImagesUrlDraft,
    setRelAddMode,
    setRelAddQty,
    setRelSearch,
    setRelSearchResults,
    setWishlistItemIds,
    supabase,
    t,
    tagDisplayedShortLabel,
    tagPopReportSearchUrl,
    wishlistItemIds
  } = scope
  return (
          <section className="catalog-detail-screen" aria-label="Catalog item detail">
            <div className="catalog-detail-head">
              <button
                type="button"
                className="catalog-action-pill"
                onClick={() => { setCurrentScreen(catalogItemOrigin || 'catalog') }}
              >
                {catalogItemOrigin === 'profile' ? '← Back to Profile' : '← Back to Catalog'}
              </button>

              {catalogSetNavItems.length > 1 && (
                <div className="catalog-detail-set-nav">
                  <button
                    type="button"
                    className="catalog-detail-set-nav-btn"
                    disabled={catalogSetNavIndex <= 0}
                    onClick={() => {
                      const prev = catalogSetNavItems[catalogSetNavIndex - 1]
                      if (!prev) return
                      const r = prev.raw
                      const na = (v) => (v && v !== 'N/A' ? v : '')
                      handleOpenCatalogItem({
                        id: r.item_id,
                        name: prev.name,
                        description: r.description || '',
                        release_year: r.release_year || null,
                        category_id: r.category_id,
                        subcategory_id: r.subcategory_id,
                        franchise_id: r.franchise_id,
                        brand_id: r.brand_id,
                        collectible_set_id: r.collectible_set_id,
                        card_number: r.card_number !== 'N/A' ? r.card_number : null,
                        metadata: { image_url: prev.imageUrl },
                        _subject_name: na(r.subject),
                        _set_name: na(r.collectible_set),
                        _print_type: na(r.print_type),
                        _details: r,
                        front_image_path: r.front_image_path || null,
                      })
                    }}
                  >
                    ‹ Prev
                  </button>
                  <span className="catalog-detail-set-nav-pos">
                    {catalogSetNavIndex >= 0 ? `${catalogSetNavIndex + 1} / ${catalogSetNavItems.length}` : `— / ${catalogSetNavItems.length}`}
                  </span>
                  <button
                    type="button"
                    className="catalog-detail-set-nav-btn"
                    disabled={catalogSetNavIndex < 0 || catalogSetNavIndex >= catalogSetNavItems.length - 1}
                    onClick={() => {
                      const next = catalogSetNavItems[catalogSetNavIndex + 1]
                      if (!next) return
                      const r = next.raw
                      const na = (v) => (v && v !== 'N/A' ? v : '')
                      handleOpenCatalogItem({
                        id: r.item_id,
                        name: next.name,
                        description: r.description || '',
                        release_year: r.release_year || null,
                        category_id: r.category_id,
                        subcategory_id: r.subcategory_id,
                        franchise_id: r.franchise_id,
                        brand_id: r.brand_id,
                        collectible_set_id: r.collectible_set_id,
                        card_number: r.card_number !== 'N/A' ? r.card_number : null,
                        metadata: { image_url: next.imageUrl },
                        _subject_name: na(r.subject),
                        _set_name: na(r.collectible_set),
                        _print_type: na(r.print_type),
                        _details: r,
                        front_image_path: r.front_image_path || null,
                      })
                    }}
                  >
                    Next ›
                  </button>
                </div>
              )}
            </div>

            {selectedCatalogItem ? (
              <>
                <header className="catalog-detail-title-row">
                  <div className="catalog-detail-title-block">
                    <h1 className="catalog-detail-title">
                      {selectedCatalogItemCategoryLabels.hideFranchise
                        ? (selectedCatalogItem._details?.collectible_set || selectedCatalogItem.name || 'N/A')
                        : (selectedCatalogItem._details?.subject || selectedCatalogItem.name || 'N/A')}
                    </h1>
                    <div className="catalog-detail-meta-list">
                      {selectedCatalogItem._details?.card_number && (
                        <span className="catalog-detail-meta-item">
                          <span className="catalog-detail-label">Card Number</span> #{selectedCatalogItem._details.card_number}
                        </span>
                      )}
                      {(selectedCatalogItem._details?.release_year ?? selectedCatalogItem.release_year) && (
                        <span className="catalog-detail-meta-item">
                          <span className="catalog-detail-label">Release Year</span> {selectedCatalogItem._details?.release_year ?? selectedCatalogItem.release_year}
                        </span>
                      )}
                    </div>
                    <div className="catalog-detail-meta-list">
                      {selectedCatalogItem._details?.subcategory && (
                        <span className="catalog-detail-meta-item">
                          <span className="catalog-detail-label">{selectedCatalogItemCategoryLabels.subcategory}</span>
                          <button type="button" className="catalog-detail-meta-link" onClick={() => {
                            setCatalogCategory(selectedCatalogItem._details.category || 'all')
                            setCatalogSubcategory(selectedCatalogItem._details.subcategory)
                            setCatalogFranchise('all')
                            setCatalogSetId('')
                            setCurrentScreen('catalog')
                          }}>{selectedCatalogItem._details.subcategory}</button>
                        </span>
                      )}
                      {selectedCatalogItem._details?.franchise && !selectedCatalogItemCategoryLabels.hideFranchise && (
                        <span className="catalog-detail-meta-item">
                          <span className="catalog-detail-label">{selectedCatalogItemCategoryLabels.franchise}</span>
                          <button type="button" className="catalog-detail-meta-link" onClick={() => {
                            setCatalogCategory(selectedCatalogItem._details.category || 'all')
                            setCatalogSubcategory(selectedCatalogItem._details.subcategory || '')
                            setCatalogFranchise(selectedCatalogItem._details.franchise_id || selectedCatalogItem._details.franchise || 'all')
                            setCatalogSetId('')
                            setCurrentScreen('catalog')
                          }}>{selectedCatalogItem._details.franchise}</button>
                        </span>
                      )}
                      {selectedCatalogItemCategoryLabels.hideFranchise
                        ? (selectedCatalogItem._details?.subject && (
                            <span className="catalog-detail-meta-item">
                              <span className="catalog-detail-label">{selectedCatalogItemCategoryLabels.subject}</span>
                              <span className="catalog-detail-info-value">{selectedCatalogItem._details.subject}</span>
                            </span>
                          ))
                        : (selectedCatalogItem._details?.collectible_set && (
                            <span className="catalog-detail-meta-item">
                              <span className="catalog-detail-label">{selectedCatalogItemCategoryLabels.collectibleSet}</span>
                              <button type="button" className="catalog-detail-meta-link" onClick={() => {
                                setCatalogCategory(selectedCatalogItem._details.category || 'all')
                                setCatalogSubcategory(selectedCatalogItem._details.subcategory || '')
                                setCatalogFranchise(selectedCatalogItem._details.franchise_id || selectedCatalogItem._details.franchise || 'all')
                                setCatalogSetId(selectedCatalogItem._details.collectible_set_id || '')
                                setCurrentScreen('catalog')
                              }}>{selectedCatalogItem._details.collectible_set}</button>
                            </span>
                          ))
                      }
                    </div>
                  </div>
                  <div className="catalog-detail-actions">
                    {isPlatformAdmin && !isCatalogItemEditMode && (
                      <button type="button" className="catalog-detail-btn catalog-detail-btn-edit" onClick={handleOpenCatalogItemEdit}>
                        Edit Item
                      </button>
                    )}
                    <button
                      type="button"
                      className="catalog-detail-btn catalog-detail-btn-collect"
                      onClick={() => quickAddMode ? performQuickAdd(selectedCatalogItem) : handleOpenAddToCollectionModal(selectedCatalogItem?.id)}
                    >
                      {quickAddMode ? (quickAddMode === 'gift' ? 'Collect (Gift)' : 'Collect (Purchase)') : 'Add to My Collection'}
                    </button>
                    <button
                      type="button"
                      className="catalog-detail-btn catalog-detail-btn-wishlist"
                      onClick={async () => {
                        if (!currentUser?.id || !selectedCatalogItem?.id) return
                        const itemId = selectedCatalogItem.id
                        if (wishlistItemIds.has(itemId)) {
                          setWishlistItemIds(prev => { const next = new Set(prev); next.delete(itemId); return next })
                          await supabase.from('wishlist_items').delete().eq('user_id', currentUser.id).eq('catalog_item_id', itemId)
                        } else {
                          setWishlistItemIds(prev => new Set([...prev, itemId]))
                          await supabase.from('wishlist_items').upsert({ user_id: currentUser.id, catalog_item_id: itemId }, { onConflict: 'user_id,catalog_item_id', ignoreDuplicates: true })
                        }
                      }}
                    >
                      {wishlistItemIds.has(selectedCatalogItem?.id) ? 'Wishlisted' : 'Add to My Wishlist'}
                    </button>
                    <a href="#" className="catalog-detail-owned-link" onClick={(event) => event.preventDefault()}>
                      You own {ownershipCount} of these items
                    </a>
                  </div>
                </header>

                <div className="catalog-detail-tabs" role="tablist" aria-label="Item detail tabs">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={catalogDetailViewTab === 'overview'}
                    className={`catalog-detail-tab-btn ${catalogDetailViewTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setCatalogDetailViewTab('overview')}
                  >
                    Overview
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={catalogDetailViewTab === 'insights'}
                    className={`catalog-detail-tab-btn ${catalogDetailViewTab === 'insights' ? 'active' : ''}`}
                    onClick={() => setCatalogDetailViewTab('insights')}
                  >
                    Insights
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={catalogDetailViewTab === 'reviews'}
                    className={`catalog-detail-tab-btn ${catalogDetailViewTab === 'reviews' ? 'active' : ''}`}
                    onClick={() => setCatalogDetailViewTab('reviews')}
                  >
                    Reviews ({catalogDetailReviews.length})
                  </button>
                  {(() => {
                    const relCount = catalogDetailIncludes.length + catalogDetailIncludedIn.length
                    return (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={catalogDetailViewTab === 'related'}
                        className={`catalog-detail-tab-btn ${catalogDetailViewTab === 'related' ? 'active' : ''}`}
                        onClick={() => setCatalogDetailViewTab('related')}
                      >
                        Related Items{relCount ? ` (${relCount})` : ''}
                      </button>
                    )
                  })()}
                  {isPlatformAdmin && (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={catalogDetailViewTab === 'manageImages'}
                      className={`catalog-detail-tab-btn ${catalogDetailViewTab === 'manageImages' ? 'active' : ''}`}
                      onClick={() => setCatalogDetailViewTab('manageImages')}
                    >
                      Images{catalogItemImages.length ? ` (${catalogItemImages.length})` : ''}
                    </button>
                  )}
                </div>

                {catalogDetailViewTab === 'overview' ? (
                  <>
                    {isCatalogItemEditMode && (
                      <section className="catalog-card catalog-detail-section catalog-item-edit-panel">
                    <div className="catalog-item-edit-header">
                      <h3>Edit Item</h3>
                      <div className="catalog-item-edit-header-actions">
                        <button type="button" className="catalog-detail-btn catalog-detail-btn-collect" disabled={isSavingCatalogItem} onClick={handleSaveCatalogItem}>
                          {isSavingCatalogItem ? 'Saving…' : 'Save Changes'}
                        </button>
                        <button type="button" className="catalog-admin-inline-cancel" onClick={() => setIsCatalogItemEditMode(false)}>Cancel</button>
                      </div>
                    </div>
                    {catalogItemEditError && <p className="catalog-admin-form-error">{catalogItemEditError}</p>}
                    <div className="catalog-item-edit-grid">
                      {(() => {
                        const editCatName = catalogCategories.find(c => c.id === catalogItemEditValues.category_id)?.name || ''
                        const editCatLabels = getCategoryLabels(editCatName)
                        const editIsLego = editCatName === 'Building Blocks'
                        const editBrandName = (catalogItemEditLookups.brands.find(b => b.id === catalogItemEditValues.brand_id) || catalogBrands.find(b => b.id === catalogItemEditValues.brand_id))?.name || ''
                        const editIsMinifig = editBrandName === 'Minifigs'   // minifigs have no packaging
                        return [
                          ['Category',                    'category_id',          catalogCategories,                false],
                          [editCatLabels.subcategory,     'subcategory_id',       catalogSubcategories,             false],
                          [editCatLabels.franchise,       'franchise_id',         catalogItemEditLookups.franchises, false],
                          [editCatLabels.brand,           'brand_id',             catalogItemEditLookups.brands,    false],
                          !editIsMinifig && [editCatLabels.collectibleSet,  'collectible_set_id',   catalogItemEditLookups.sets,      false],
                          editIsLego
                            ? [editCatLabels.subset,      'subset_id',            catalogItemEditLookups.subthemes, false]
                            : [editCatLabels.subset,      'subcollectble_set_id', catalogItemEditLookups.subsets,   false],
                          ...(editIsLego ? [[editCatLabels.productLine, 'product_line_id', catalogItemEditLookups.productLines, false]] : []),
                          ['Series',                      'series_id',            catalogItemEditLookups.series,    false],
                          !editIsLego && ['Print Type',   'print_type_id',        catalogItemEditLookups.printTypes, false],
                        ].filter(Boolean)
                      })().map(([label, field, options, upper]) => (
                        <label key={field} className="catalog-item-edit-field">
                          <span>{label}</span>
                          <select value={catalogItemEditValues[field] || ''} onChange={e => setCatalogItemEditValues(v => ({ ...v, [field]: e.target.value }))} style={upper ? { textTransform: 'uppercase' } : {}}>
                            <option value="">— None —</option>
                            {(options || []).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                          </select>
                        </label>
                      ))}
                      <div className="catalog-item-edit-field catalog-item-edit-field--wide">
                        <span>Subject(s)</span>
                        {catalogItemEditSubjectIds.length > 0 && (
                          <div className="catalog-admin-subject-tags">
                            {catalogItemEditSubjectIds.map(s => (
                              <span key={s.id} className="catalog-admin-subject-tag">
                                <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{s.name}</span>
                                <span className="catalog-admin-hint"> · {s.type}</span>
                                <button type="button" className="catalog-admin-subject-tag-remove" onClick={() => handleCatalogItemEditRemoveSubject(s.id)}>✕</button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="catalog-admin-subject-search-wrap">
                          <input className="catalog-admin-inline-input" style={{ width: '100%' }} placeholder="Search subjects to add…" value={catalogItemEditSubjectSearch} onChange={e => setCatalogItemEditSubjectSearch(e.target.value)} autoComplete="off" />
                          {catalogItemEditSubjectIsSearching && <p className="catalog-admin-hint">Searching…</p>}
                          {catalogItemEditSubjectResults.length > 0 && (
                            <div className="catalog-admin-subject-results">
                              {catalogItemEditSubjectResults.map(s => (
                                <button key={s.id} type="button" className="catalog-admin-subject-result" onClick={() => handleCatalogItemEditSelectSubject(s)}>
                                  <span style={{ textTransform: 'uppercase' }}>{s.name}</span>
                                  <span className="catalog-admin-hint"> · {s.type}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <label className="catalog-item-edit-field">
                        <span>Card Number</span>
                        <input type="text" value={catalogItemEditValues.card_number || ''} onChange={e => setCatalogItemEditValues(v => ({ ...v, card_number: e.target.value }))} />
                      </label>
                      <label className="catalog-item-edit-field">
                        <span>Print Count</span>
                        <input type="number" min="1" value={catalogItemEditValues.print_count ?? ''} onChange={e => setCatalogItemEditValues(v => ({ ...v, print_count: e.target.value }))} />
                      </label>
                      <label className="catalog-item-edit-field">
                        <span>Release Year</span>
                        <input type="number" min="1932" max="2100" value={catalogItemEditValues.release_year ?? ''} onChange={e => setCatalogItemEditValues(v => ({ ...v, release_year: e.target.value }))} placeholder="e.g. 2023" />
                      </label>
                      <label className="catalog-item-edit-field">
                        <span>Retail Price</span>
                        <input type="number" min="0" step="0.01" value={catalogItemEditValues.retail_price ?? ''} onChange={e => setCatalogItemEditValues(v => ({ ...v, retail_price: e.target.value }))} placeholder="e.g. 19.99" />
                      </label>
                      <label className="catalog-item-edit-field">
                        <span>Value (Market Price)</span>
                        <input type="number" min="0" step="0.01" value={catalogItemEditValues.market_price ?? ''} onChange={e => setCatalogItemEditValues(v => ({ ...v, market_price: e.target.value }))} placeholder="e.g. 24.99" />
                      </label>
                      {catalogRarities.length > 0 && (
                        <label className="catalog-item-edit-field">
                          <span>Rarity</span>
                          <select value={catalogItemEditRarityId} onChange={e => setCatalogItemEditRarityId(e.target.value)}>
                            <option value="">— None —</option>
                            {catalogRarities.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        </label>
                      )}
                      {selectedCatalogItem?.categoryName === 'Building Blocks' && (<>
                        <label className="catalog-item-edit-field">
                          <span>BrickLink ID</span>
                          <input type="text" value={catalogItemEditValues.bricklink_id || ''} onChange={e => setCatalogItemEditValues(v => ({ ...v, bricklink_id: e.target.value }))} placeholder="e.g. col473 or 75192" />
                        </label>
                        <label className="catalog-item-edit-field">
                          <span>Rebrickable ID</span>
                          <input type="text" value={catalogItemEditValues.rebrickable_fig_id || ''} onChange={e => setCatalogItemEditValues(v => ({ ...v, rebrickable_fig_id: e.target.value }))} placeholder="e.g. fig-001234" />
                        </label>
                        <label className="catalog-item-edit-field">
                          <span>UPC</span>
                          <input type="text" value={catalogItemEditValues.upc || ''} onChange={e => setCatalogItemEditValues(v => ({ ...v, upc: e.target.value }))} placeholder="Barcode" />
                        </label>
                        <label className="catalog-item-edit-field">
                          <span>Piece Count</span>
                          <input type="number" min="1" value={catalogItemEditValues.piece_count ?? ''} onChange={e => setCatalogItemEditValues(v => ({ ...v, piece_count: e.target.value }))} />
                        </label>
                      </>)}
                      <label className="catalog-item-edit-field catalog-item-edit-field--wide">
                        <span>Description</span>
                        <textarea rows={3} value={catalogItemEditValues.description || ''} onChange={e => setCatalogItemEditValues(v => ({ ...v, description: e.target.value }))} />
                      </label>
                      <div className="catalog-item-edit-field catalog-item-edit-field--wide">
                        <span>Teams / Affiliation</span>
                        {catalogItemEditLookups.teams.length > 0 ? (
                          <div className="catalog-admin-team-list">
                            {catalogItemEditLookups.teams.map(t => (
                              <label key={t.id} className="catalog-admin-team-checkbox">
                                <input type="checkbox" checked={catalogItemEditTeamIds.includes(t.id)} onChange={e => setCatalogItemEditTeamIds(prev => e.target.checked ? [...prev, t.id] : prev.filter(id => id !== t.id))} />
                                <span style={{ textTransform: 'uppercase' }}>{t.name}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <p className="catalog-admin-hint" style={{ margin: '4px 0' }}>{catalogItemEditValues.franchise_id ? 'No teams in this franchise' : 'Select a franchise to see teams'}</p>
                        )}
                      </div>
                      {CARD_CONDITION_CATEGORIES.has(selectedCatalogItem?.categoryName) && (
                        <div className="catalog-item-edit-field catalog-item-edit-field--wide">
                          <span>Card Treatments <span className="catalog-admin-hint">(none = Normal)</span></span>
                          {(() => {
                            const editCardTypes = catalogItemEditLookups.cardTypes.filter(ct => ct.name !== 'Normal')
                            return editCardTypes.length > 0 ? (
                              <div className="catalog-admin-team-list">
                                {editCardTypes.map(ct => (
                                  <label key={ct.id} className="catalog-admin-team-checkbox">
                                    <input type="checkbox" checked={catalogItemEditCardTypeIds.includes(ct.id)}
                                      onChange={e => setCatalogItemEditCardTypeIds(prev => e.target.checked ? [...prev, ct.id] : prev.filter(id => id !== ct.id))} />
                                    <span>{ct.name}</span>
                                  </label>
                                ))}
                              </div>
                            ) : <p className="catalog-admin-hint" style={{ margin: '4px 0' }}>No card treatments defined.</p>
                          })()}
                          {catalogItemIsMtg && (
                            <>
                              <span style={{ marginTop: 10, display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--detail-label)' }}>Card Type</span>
                              <select value={catalogItemEditMtgCardTypeId} onChange={e => setCatalogItemEditMtgCardTypeId(e.target.value)} style={{ marginTop: 4 }}>
                                <option value="">— Select —</option>
                                {catalogMtgCardTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                              </select>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="catalog-item-edit-images">
                      <p className="catalog-item-edit-images-label">Images</p>
                      <div className="catalog-item-edit-image-slots">
                        {[{ label: 'Front', position: 0 }, { label: 'Back', position: 1 }].map(({ label, position }) => {
                          const img = catalogItemImages.find(i => i.position === position)
                          const urlData = img
                            ? img.image_path.startsWith('http')
                              ? { publicUrl: img.image_path }
                              : supabase.storage.from('item-images').getPublicUrl(img.image_path).data
                            : null
                          return (
                            <div key={position} className="catalog-item-edit-image-slot">
                              <span className="catalog-item-edit-image-slot-label">{label}</span>
                              {img ? (
                                <div className="catalog-item-edit-image-wrap">
                                  <img src={urlData.publicUrl} alt={label} className="catalog-detail-item-image" />
                                  <button type="button" className="catalog-item-edit-image-delete" onClick={() => handleDeleteCatalogItemImage(img)} title={`Remove ${label}`} disabled={isUploadingCatalogItemImage}>✕</button>
                                </div>
                              ) : (
                                <label className="catalog-item-edit-image-upload">
                                  {isUploadingCatalogItemImage ? <span>Uploading…</span> : <><span className="catalog-item-edit-upload-icon">+</span><span>Add {label}</span></>}
                                  <input type="file" accept="image/*" style={{ display: 'none' }} disabled={isUploadingCatalogItemImage} onChange={e => { if (e.target.files?.[0]) handleUploadCatalogItemImage(e.target.files[0], position); e.target.value = '' }} />
                                </label>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {isPlatformAdmin && (isLegoSet || isLegoMinifig) && (
                      <div className="catalog-item-edit-field catalog-item-edit-field--wide">
                        <span>Set / Minifig Connections</span>

                        {isLegoSet && (
                          <>
                            <p className="catalog-admin-hint" style={{ margin: '4px 0 8px' }}>
                              Linked minifigs ({catalogDetailSetMinifigs.length})
                            </p>
                            <div className="catalog-detail-minifig-list">
                              {catalogDetailSetMinifigs.map((m) => (
                                <div key={m.item_id} className="catalog-detail-minifig-row">
                                  <button type="button" className="catalog-detail-minifig-rowmain" onClick={() => openCatalogItemById(m.item_id)}>
                                    <span className="catalog-detail-minifig-name">
                                      {m.name}
                                      {m.variant ? <span className="catalog-detail-minifig-variant"> — {m.variant}</span> : null}
                                      {m.quantity > 1 ? <span className="catalog-detail-minifig-qty"> ×{m.quantity}</span> : null}
                                    </span>
                                    {(m.code || m.figNum) ? <span className="catalog-detail-minifig-fig">{m.code || m.figNum}</span> : null}
                                  </button>
                                  <button
                                    type="button"
                                    className="catalog-detail-link-remove"
                                    title="Remove this minifig from the set"
                                    onClick={() => removeSetMinifigLink(selectedCatalogItem.id, m.item_id)}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="catalog-detail-link-editor">
                              <input
                                type="text"
                                className="catalog-admin-inline-input"
                                placeholder="Search minifigs to add…"
                                value={linkSearch}
                                onChange={async (e) => {
                                  setLinkSearch(e.target.value)
                                  setLinkResults(await searchLegoItemsToLink(e.target.value, 'minifig'))
                                }}
                              />
                              <input
                                type="number"
                                min="1"
                                className="catalog-admin-inline-input"
                                style={{ width: 64 }}
                                value={linkQty}
                                onChange={(e) => setLinkQty(e.target.value)}
                                title="Quantity in set"
                              />
                              {linkResults.length > 0 && (
                                <div className="catalog-admin-subject-results">
                                  {linkResults.map((r) => (
                                    <button
                                      key={r.id}
                                      type="button"
                                      className="catalog-admin-subject-result"
                                      disabled={isSavingLink}
                                      onClick={() => addSetMinifigLink(selectedCatalogItem.id, r.id, linkQty)}
                                    >
                                      {r.name}{r.code ? ` · ${r.code}` : ''}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {isLegoMinifig && (
                          <>
                            <p className="catalog-admin-hint" style={{ margin: '10px 0 8px' }}>
                              Linked sets ({catalogDetailParentSets.length})
                            </p>
                            <div className="catalog-detail-minifig-list">
                              {catalogDetailParentSets.map((setItem) => (
                                <div key={setItem.item_id} className="catalog-detail-minifig-row">
                                  <button type="button" className="catalog-detail-minifig-rowmain" onClick={() => openCatalogItemById(setItem.item_id)}>
                                    <span className="catalog-detail-parent-set-name">
                                      {setItem.name}
                                      {setItem.franchise ? <span className="catalog-detail-minifig-variant"> — {setItem.franchise}</span> : null}
                                      {setItem.release_year ? <span className="catalog-detail-minifig-variant"> • {setItem.release_year}</span> : null}
                                    </span>
                                    <span className="catalog-detail-parent-set-meta">
                                      {setItem.quantity > 1 ? `x${setItem.quantity} in set` : 'Included'}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    className="catalog-detail-link-remove"
                                    title="Remove this minifig from the set"
                                    onClick={() => removeSetMinifigLink(setItem.item_id, selectedCatalogItem.id)}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="catalog-detail-link-editor">
                              <input
                                type="text"
                                className="catalog-admin-inline-input"
                                placeholder="Search sets to add this minifig to…"
                                value={linkSearch}
                                onChange={async (e) => {
                                  setLinkSearch(e.target.value)
                                  setLinkResults(await searchLegoItemsToLink(e.target.value, 'set'))
                                }}
                              />
                              {linkResults.length > 0 && (
                                <div className="catalog-admin-subject-results">
                                  {linkResults.map((r) => (
                                    <button
                                      key={r.id}
                                      type="button"
                                      className="catalog-admin-subject-result"
                                      disabled={isSavingLink}
                                      onClick={() => addSetMinifigLink(r.id, selectedCatalogItem.id, 1)}
                                    >
                                      {r.name}{r.code ? ` · ${r.code}` : ''}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                      </section>
                    )}

                    <section className="catalog-detail-market-card">
                  <div className={`catalog-detail-market-image-wrap${isPsaActive ? ' psa-slab-wrap' : ''}${isBgsActive ? ` bgs-slab-wrap${isBgsBlackLabel ? ' bgs-black-label-wrap' : ''}` : ''}${isCgcActive ? ' cgc-slab-wrap' : ''}${isTAGActive ? ' tag-slab-wrap' : ''}`}>
                    <div className={`catalog-detail-image-frame${isPsaActive ? ' psa-slab-frame' : ''}${isBgsActive ? ` bgs-slab-frame${isBgsBlackLabel ? ' bgs-black-label-frame' : ''}` : ''}${isCgcActive ? ' cgc-slab-frame' : ''}${isTAGActive ? ' tag-slab-frame' : ''}`}>
                    {(() => {
                      const frontImg = catalogItemImages.find(i => i.position === 0)
                      const frontUrl = frontImg
                        ? frontImg.image_path.startsWith('http')
                          ? frontImg.image_path
                          : supabase.storage.from('item-images').getPublicUrl(frontImg.image_path).data?.publicUrl
                        : null
                      return frontUrl ? (
                        <img src={frontUrl} alt={selectedCatalogItem.name || 'Catalog item'} className="catalog-detail-market-image catalog-zoomable" onClick={() => openLightbox(frontUrl)} />
                      ) : (
                        <div className="catalog-detail-market-image catalog-item-image-placeholder">N/A</div>
                      )
                    })()}
                    </div>
                    {isPsaActive ? (
                      <div className="catalog-detail-slab-cert-label">
                        <span className="slab-cert-company">PSA</span>
                        {catalogDetailSelectedGrade ? (
                          <span className="slab-cert-grade">{activeGradeEntry ? activeGradeEntry.shortLabel : catalogDetailSelectedGrade}</span>
                        ) : null}
                        {catalogDetailCertNumber ? (
                          <span className="slab-cert-number">#{catalogDetailCertNumber}</span>
                        ) : (
                          <span className="slab-cert-number slab-cert-number-placeholder">Cert # —</span>
                        )}
                      </div>
                    ) : null}
                    {isBgsActive ? (
                      <div className={`catalog-detail-slab-cert-label bgs${isBgsBlackLabel ? ' black-label' : ''}`}>
                        <span className="slab-cert-company">BGS</span>
                        {(effectiveBgsGradeEntry || activeGradeEntry) ? (
                          <span className="slab-cert-grade">{(effectiveBgsGradeEntry || activeGradeEntry).shortLabel}</span>
                        ) : null}
                        {isBgsBlackLabel ? (
                          <span className="slab-cert-bl-tag">★ BLACK LABEL</span>
                        ) : null}
                        {catalogDetailCertNumber ? (
                          <span className="slab-cert-number">#{catalogDetailCertNumber}</span>
                        ) : (
                          <span className="slab-cert-number slab-cert-number-placeholder">Cert # —</span>
                        )}
                      </div>
                    ) : null}
                    {isCgcActive ? (
                      <div className="catalog-detail-slab-cert-label cgc">
                        <span className="slab-cert-company">CGC</span>
                        {activeGradeEntry ? (
                          <span className="slab-cert-grade">{activeGradeEntry.shortLabel}</span>
                        ) : null}
                        {catalogDetailCertNumber ? (
                          <span className="slab-cert-number">#{catalogDetailCertNumber}</span>
                        ) : (
                          <span className="slab-cert-number slab-cert-number-placeholder">Cert # —</span>
                        )}
                      </div>
                    ) : null}
                    {isTAGActive ? (
                      <div className="catalog-detail-slab-cert-label tag">
                        <span className="slab-cert-company">TAG</span>
                        {tagDisplayedShortLabel ? (
                          <span className="slab-cert-grade">{tagDisplayedShortLabel}</span>
                        ) : null}
                        {catalogDetailCertNumber ? (
                          <span className="slab-cert-number">#{catalogDetailCertNumber}</span>
                        ) : (
                          <span className="slab-cert-number slab-cert-number-placeholder">Cert # —</span>
                        )}
                      </div>
                    ) : null}
                    <p className="catalog-detail-image-caption">{selectedCatalogItemMetadata.image_caption || selectedCatalogItemMetadata.image_label || ''}</p>
                  </div>
                  <div className="catalog-detail-market-panel">
                    <div className="catalog-detail-market-panel-main">
                      <style>{`
                        .catalog-market-data-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
                        .catalog-market-data-heading h2{margin:0}
                        .catalog-pricing-source-tabs{display:inline-flex;gap:4px;padding:4px;border:1px solid rgba(255,255,255,.2);border-radius:999px;background:rgba(255,255,255,.08)}
                        .catalog-pricing-source-tabs button{border:0;border-radius:999px;padding:6px 12px;background:transparent;color:rgba(255,255,255,.72);font-size:12px;font-weight:700;cursor:pointer}
                        .catalog-pricing-source-tabs button.active{background:#fff;color:#0b2a63}
                        .catalog-pricing-source-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;opacity:.72}
                        .catalog-pricing-source-note{margin:5px 0 12px;font-size:12px;opacity:.66}
                      `}</style>
                      <div className="catalog-market-data-heading">
                        <h2>Market Data & Pricing</h2>
                        {(isPlatformAdmin ||
                          userProfile?.collector_plus ||
                          userProfile?.is_collector_plus ||
                          userProfile?.subscription_tier === 'collector_plus' ||
                          userProfile?.plan === 'collector_plus') ? (
                          <div className="catalog-pricing-source-tabs" role="tablist" aria-label="Pricing source">
                            {[['combined','Combined'],['online','Online'],['in_store','In-Store']].map(([value,label]) => (
                              <button key={value} type="button" role="tab"
                                aria-selected={catalogPricingSource === value}
                                className={catalogPricingSource === value ? 'active' : ''}
                                onClick={() => setCatalogPricingSource(value)}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                    {label}
                                    {value === 'in_store' ? (
                                      <span
                                        onClick={(event) => event.stopPropagation()}
                                        title="In-store prices are based on sales reported by participating stores within 250 km of your location. This provides a regional view of what collectors are actually paying in physical stores."
                                        aria-label="About In-Store Pricing"
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          width: '15px',
                                          height: '15px',
                                          border: '1.5px solid currentColor',
                                          borderRadius: '50%',
                                          fontSize: '9px',
                                          fontWeight: 800,
                                          lineHeight: 1,
                                          cursor: 'help',
                                          flexShrink: 0
                                        }}
                                      >i</span>
                                    ) : null}
                                  </span>
                                </button>
                            ))}
                          </div>
                        ) : <span className="catalog-pricing-source-label">Combined Market</span>}
                      </div>
                      <p className="catalog-pricing-source-note">
                        {catalogPricingSource === 'online' ? 'Online marketplace pricing' :
                         catalogPricingSource === 'in_store' ? 'Participating store and POS sales data' :
                         'Combined online and in-store market data'}
                      </p>
                      <p className="catalog-detail-price">
                        {marketPrice}{' '}
                        <span className={`catalog-detail-price-trend ${Number.isFinite(marketTrendPercent) && marketTrendPercent >= 0 ? 'positive' : ''}`}>
                          {marketTrendLabel}
                        </span>
                      </p>
                      <div className="catalog-detail-metrics">
                        <div className="catalog-detail-metric-box">
                          <span>30-Day Avg</span>
                          <strong>{metric30Day}</strong>
                          <em className="positive">{selectedCatalogItemMetadata.market_30_day_note || 'N/A'}</em>
                        </div>
                        <div className="catalog-detail-metric-box">
                          <span>All-Time High</span>
                          <strong>{metricAllTimeHigh}</strong>
                          <em>{selectedCatalogItemMetadata.market_all_time_note || 'N/A'}</em>
                        </div>
                        <div className="catalog-detail-metric-box">
                          <span>Low Listing Price</span>
                          <strong>{metricLowListing}</strong>
                          <em className="positive">{selectedCatalogItemMetadata.market_low_listing_note || 'N/A'}</em>
                        </div>
                      </div>
                      {isBgsActive ? (
                        <div className={`catalog-detail-bgs-subgrades catalog-detail-bgs-subgrades-main${isBgsBlackLabel ? ' black-label' : ''}`}>
                          <p className="catalog-detail-label bgs-subgrades-heading">
                            Beckett Subgrades
                            {bgsAllSubgradesSet && bgsAllSubgradesAreTen ? (
                              <span className="bgs-bl-auto-badge">AUTO BLACK LABEL</span>
                            ) : null}
                          </p>
                          <div className="bgs-subgrades-grid">
                            {BGS_SUBGRADE_FIELDS.map((field) => (
                              <div key={field.key} className="bgs-subgrade-item">
                                <label htmlFor={`bgs-sg-${field.key}`} className="bgs-subgrade-label">{field.label}</label>
                                <select
                                  id={`bgs-sg-${field.key}`}
                                  className={`bgs-subgrade-select${catalogDetailBgsSubgrades[field.key] === '10' ? ' perfect' : ''}`}
                                  value={catalogDetailBgsSubgrades[field.key]}
                                  onChange={(event) =>
                                    setCatalogDetailBgsSubgrades((prev) => ({ ...prev, [field.key]: event.target.value }))
                                  }
                                >
                                  <option value="" disabled>—</option>
                                  {BGS_SUBGRADE_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <aside className={`catalog-detail-market-controls${isPsaActive ? ' psa-active' : ''}${isBgsActive ? ' bgs-active' : ''}${isBgsBlackLabel ? ' bgs-black-label' : ''}${isTAGActive ? ' tag-active' : ''}`}>
                      {/* ── Market Variant (Condition) ─────────────────────── */}
                      {isCardConditionCategory ? null : conditionOptions.length > 0 ? (
                        <>
                          <label htmlFor="catalog-detail-condition" className="catalog-detail-label">
                            {(catalogMarketVariants.length > 0 || isLegoConditionCategory) ? 'Condition' : 'Market Variant'}
                            {catalogMarketVariants.length > 0 && !isLegoConditionCategory && (
                              <span title="Damaged = missing accessories or visible damage" style={{ cursor: 'help', marginLeft: 4, fontWeight: 'normal' }}>ⓘ</span>
                            )}
                          </label>
                          <select
                            id="catalog-detail-condition"
                            value={selectedCondition || ''}
                            onChange={(event) => setCatalogDetailSelectedCondition(event.target.value)}
                          >
                            <option value="">— Select —</option>
                            {conditionOptions.map((condition) => (
                              <option key={condition} value={condition}>{condition}</option>
                            ))}
                          </select>
                          {/* ── LEGO condition sub-fields ─────────────────────── */}
                          {isLegoConditionCategory && selectedCondition ? (() => {
                            const isSealed = selectedCondition.includes('Sealed')
                            const isIncomplete = selectedCondition.includes('Incomplete')
                            const setLego = (patch) => setCatalogDetailLegoCond(prev => ({ ...prev, ...patch }))
                            const lc = catalogDetailLegoCond
                            return (
                              <div className="catalog-detail-lego-cond">
                                {isSealed && isLegoSet ? (
                                  <>
                                    <label className="catalog-detail-label" htmlFor="lego-box-grade">Box condition</label>
                                    <select id="lego-box-grade" value={lc.boxGrade || ''} onChange={e => setLego({ boxGrade: e.target.value })}>
                                      <option value="">— Select —</option>
                                      {LEGO_SET_BOX_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                  </>
                                ) : null}
                                {isIncomplete ? (
                                  <>
                                    <label className="catalog-detail-label" htmlFor="lego-completeness">Completeness (%)</label>
                                    <input id="lego-completeness" type="number" min={0} max={99} placeholder="e.g. 85"
                                      value={lc.completenessPct ?? ''} onChange={e => setLego({ completenessPct: e.target.value })} />
                                  </>
                                ) : null}
                                {isLegoSet ? (
                                  <>
                                    <label className="catalog-detail-label" htmlFor="lego-instructions">Instructions</label>
                                    <select id="lego-instructions" value={lc.instructions || ''} onChange={e => setLego({ instructions: e.target.value })}>
                                      <option value="">— Select —</option>
                                      {LEGO_PRESENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                    <label className="catalog-detail-label" htmlFor="lego-box">Original box</label>
                                    <select id="lego-box" value={lc.box || ''} onChange={e => setLego({ box: e.target.value })}>
                                      <option value="">— Select —</option>
                                      {LEGO_PRESENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                    <label className="catalog-detail-label" htmlFor="lego-minifigs">Minifigs present</label>
                                    <select id="lego-minifigs" value={lc.minifigs || ''} onChange={e => setLego({ minifigs: e.target.value })}>
                                      <option value="">— Select —</option>
                                      <option value="All">All present</option>
                                      <option value="Some">Some present</option>
                                      <option value="None">None</option>
                                    </select>
                                  </>
                                ) : null}
                                {isLegoMinifig ? (
                                  <>
                                    <label className="catalog-detail-label" htmlFor="lego-accessories">All accessories</label>
                                    <select id="lego-accessories" value={lc.accessories || ''} onChange={e => setLego({ accessories: e.target.value })}>
                                      <option value="">— Select —</option>
                                      <option value="Yes">Yes — complete</option>
                                      <option value="No">No — missing parts</option>
                                    </select>
                                    <label className="catalog-detail-label" htmlFor="lego-polybag">Assembly</label>
                                    <select id="lego-polybag" value={lc.assembly || ''} onChange={e => setLego({ assembly: e.target.value })}>
                                      <option value="">— Select —</option>
                                      <option value="Sealed polybag">Sealed in polybag</option>
                                      <option value="Assembled">Assembled</option>
                                    </select>
                                  </>
                                ) : null}
                              </div>
                            )
                          })() : null}
                        </>
                      ) : null}

                      {/* ── Graded toggle ─────────────────────────────────── */}
                      {isCardConditionCategory ? (
                        <div className="catalog-detail-graded-toggle">
                          <span className="catalog-detail-label">Graded</span>
                          <label className="catalog-switch" htmlFor="catalog-detail-graded-toggle">
                            <input
                              id="catalog-detail-graded-toggle"
                              type="checkbox"
                              checked={catalogDetailIsGraded}
                              onChange={(event) => {
                                const nextIsGraded = event.target.checked
                                setCatalogDetailIsGraded(nextIsGraded)
                                if (!nextIsGraded) {
                                  setCatalogDetailGradingCompany('')
                                  setCatalogDetailSelectedGrade('')
                                  setCatalogDetailCertNumber('')
                                  setCatalogDetailBgsSubgrades({ ...DEFAULT_BGS_SUBGRADES })
                                  setCatalogDetailTagScore('')
                                  setCatalogDetailTagDigReport('')
                                  setCatalogDetailTagScoreRank('')
                                  setCatalogDetailTagPopulation('')
                                  setCatalogDetailTagVerifiedSlab('')
                                  setCatalogDetailTagLookupError('')
                                  setIsCatalogDetailTagLookupLoading(false)
                                }
                              }}
                            />
                            <span className="catalog-switch-slider" />
                          </label>
                          <span className="catalog-detail-graded-value">{catalogDetailIsGraded ? 'Yes' : 'No'}</span>
                        </div>
                      ) : null}

                      {/* ── Ungraded card condition (Market Variant) ──────── */}
                      {isCardConditionCategory && !catalogDetailIsGraded ? (
                        <>
                          <label htmlFor="catalog-detail-card-condition" className="catalog-detail-label">Market Variant</label>
                          <select
                            id="catalog-detail-card-condition"
                            value={selectedCondition || conditionOptions[0] || ''}
                            onChange={(event) => setCatalogDetailSelectedCondition(event.target.value)}
                          >
                            {(conditionOptions.length > 0 ? conditionOptions : []).map((condition) => (
                              <option key={condition} value={condition}>{condition}</option>
                            ))}
                          </select>
                        </>
                      ) : null}

                      {/* ── Grading Company ───────────────────────────────── */}
                      {catalogDetailIsGraded && isCardConditionCategory ? (
                        <>
                          <label htmlFor="catalog-detail-grading-company" className="catalog-detail-label">
                            Grading Company
                          </label>
                          <select
                            id="catalog-detail-grading-company"
                            className="catalog-detail-company-select"
                            value={catalogDetailGradingCompany}
                            onChange={(event) => {
                              setCatalogDetailGradingCompany(event.target.value)
                              setCatalogDetailSelectedGrade('')
                              setCatalogDetailCertNumber('')
                              setCatalogDetailBgsSubgrades({ ...DEFAULT_BGS_SUBGRADES })
                              setCatalogDetailTagScore('')
                              setCatalogDetailTagDigReport('')
                              setCatalogDetailTagScoreRank('')
                              setCatalogDetailTagPopulation('')
                              setCatalogDetailTagVerifiedSlab('')
                              setCatalogDetailTagLookupError('')
                              setIsCatalogDetailTagLookupLoading(false)
                            }}
                          >
                            <option value="" disabled>Select company</option>
                            {GRADING_COMPANIES.map((company) => (
                              <option key={company.id} value={company.id}>
                                {company.shortName} — {company.name}
                              </option>
                            ))}
                          </select>
                        </>
                      ) : null}

                      {/* ── Grade selector (dynamic per company) ─────────── */}
                      {catalogDetailIsGraded && catalogDetailGradingCompany && activeGradeScale.length > 0 ? (
                        <>
                          <label htmlFor="catalog-detail-grade" className="catalog-detail-label">
                            {isTAGActive ? 'TAG Grade' : `${catalogDetailGradingCompany} Grade`}
                          </label>
                          <select
                            id="catalog-detail-grade"
                            className={`catalog-detail-grade-select${isPsaActive ? ` psa-grade-prestige-${Math.floor(psaPrestigeScore / 10) * 10}` : ''}${isBgsActive ? ' bgs-grade-select' : ''}${isTAGActive ? ' tag-grade-select' : ''}`}
                            value={isBgsActive ? (bgsAllSubgradesSet && bgsAllSubgradesAreTen ? 'BL' : catalogDetailSelectedGrade) : isTAGActive ? (catalogDetailSelectedGrade || '10g') : catalogDetailSelectedGrade}
                            onChange={(event) => {
                              setCatalogDetailSelectedGrade(event.target.value)
                              // Selecting a non-BL / non-10 clears subgrades to avoid stale auto-promotion
                              if (event.target.value !== 'BL' && event.target.value !== '10') {
                                setCatalogDetailBgsSubgrades({ ...DEFAULT_BGS_SUBGRADES })
                              }
                            }}
                          >
                            <option value="" disabled>Select grade</option>
                            {activeGradeScale.map((grade) => (
                              <option key={grade.value} value={grade.value} title={grade.description}>
                                {isTAGActive ? `${grade.label} (${grade.scoreRange})` : grade.label}
                              </option>
                            ))}
                          </select>
                          {isPsaActive && activeGradeEntry ? (
                            <div
                              className={`catalog-detail-grade-badge${isPsaActive ? ' psa' : ''}`}
                              style={isPsaActive ? { '--prestige': psaPrestigeScore } : {}}
                            >
                              <span className="catalog-detail-grade-badge-label">{activeGradeEntry.label}</span>
                              {isPsaActive && psaPrestigeScore >= 90 ? (
                                <span className="catalog-detail-grade-badge-elite">ELITE</span>
                              ) : null}
                            </div>
                          ) : null}
                        </>
                      ) : null}

                      {/* ── PSA Certification Fields ──────────────────────── */}
                      {isPsaActive ? (
                        <div className="catalog-detail-cert-fields">
                          <label htmlFor="catalog-detail-cert-number" className="catalog-detail-label">PSA Cert #</label>
                          <input
                            id="catalog-detail-cert-number"
                            type="text"
                            className="catalog-detail-cert-input"
                            placeholder="e.g. 12345678"
                            value={catalogDetailCertNumber}
                            onChange={(event) => setCatalogDetailCertNumber(event.target.value)}
                            maxLength={12}
                          />
                          <a
                            href={psaCertLookupUrl}
                            className="catalog-detail-tag-search-link"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Search PSA Cert Lookup
                          </a>
                        </div>
                      ) : null}

                      {/* ── BGS Certification Fields ──────────────────────── */}
                      {isBgsActive ? (
                        <div className={`catalog-detail-cert-fields bgs-cert${isBgsBlackLabel ? ' black-label' : ''}`}>
                          <label htmlFor="catalog-detail-bgs-cert" className="catalog-detail-label">BGS Cert #</label>
                          <input
                            id="catalog-detail-bgs-cert"
                            type="text"
                            className="catalog-detail-cert-input bgs"
                            placeholder="e.g. 0012345678"
                            value={catalogDetailCertNumber}
                            onChange={(event) => setCatalogDetailCertNumber(event.target.value)}
                            maxLength={12}
                          />
                          <a
                            href={bgsCertLookupUrl}
                            className="catalog-detail-tag-search-link"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Search Beckett Cert Lookup
                          </a>
                        </div>
                      ) : null}

                      {/* ── CGC Certification Fields ──────────────────────── */}
                      {isCgcActive ? (
                        <div className="catalog-detail-cert-fields">
                          <label htmlFor="catalog-detail-cgc-cert" className="catalog-detail-label">CGC Cert #</label>
                          <input
                            id="catalog-detail-cgc-cert"
                            type="text"
                            className="catalog-detail-cert-input"
                            placeholder="e.g. 1401025001"
                            value={catalogDetailCertNumber}
                            onChange={(event) => setCatalogDetailCertNumber(event.target.value)}
                            maxLength={24}
                          />
                          <a
                            href={cgcCertLookupUrl}
                            className="catalog-detail-tag-search-link"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Search CGC Cert Lookup
                          </a>
                        </div>
                      ) : null}

                      {/* ── TAG Certification Fields ──────────────────────── */}
                      {isTAGActive ? (
                        <div className="catalog-detail-cert-fields tag-cert">
                          <label htmlFor="catalog-detail-tag-cert" className="catalog-detail-label">TAG Cert #</label>
                          <input
                            id="catalog-detail-tag-cert"
                            type="text"
                            className="catalog-detail-cert-input tag"
                            placeholder=""
                            value={catalogDetailCertNumber}
                            onChange={(event) => setCatalogDetailCertNumber(event.target.value)}
                            maxLength={18}
                          />
                          <a
                            href={tagPopReportSearchUrl}
                            className="catalog-detail-tag-search-link"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Search TAG Pop Report
                          </a>
                        </div>
                      ) : null}

                      {/* ── View Historical Data ──────────────────────────── */}
                      {typeof selectedCatalogItemMetadata.history_url === 'string' && selectedCatalogItemMetadata.history_url.trim() ? (
                        <a
                          href={selectedCatalogItemMetadata.history_url.trim()}
                          className="catalog-detail-history-btn"
                          target="_blank"
                          rel="noreferrer"
                        >
                          View Historical Data
                        </a>
                      ) : null}
                    </aside>
                  </div>
                    </section>

                    {/* ── Description band ── */}
                    <section className="catalog-detail-description-band">
                      <p>{selectedCatalogItem._details?.description || selectedCatalogItem.description || 'N/A'}</p>
                    </section>

                    <style>{`
                      .catalog-detail-empty-state {
                        min-height: 150px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        padding: 24px;
                        border: 1px dashed rgba(11,42,99,.18);
                        border-radius: 10px;
                        background: rgba(255,255,255,.38);
                      }
                      .catalog-detail-empty-state strong { margin-bottom: 6px; }
                      .catalog-detail-empty-state p { margin: 0; opacity: .62; max-width: 360px; }
                    `}</style>
                    <section className="catalog-detail-grid">
                  <article className="catalog-card catalog-detail-section">
                    <h3>Available Listings on CollectorsHub</h3>
                    {listings.length > 0 ? (
                      <>
                        {listings.slice(0, 2).map((listing, index) => (
                          <div className="catalog-detail-list-row" role="button" tabIndex={0} key={listing.id || listing.listing_id || `listing-${index}`}>
                            <div className="catalog-detail-seller-col">
                              <strong>
                                {listing.seller_name || 'Seller'}
                                {isListingCertVerified(listing) ? <span className="catalog-verified-badge">Verified</span> : null}
                              </strong>
                              {[
                                Number.isFinite(Number(listing.seller_rating)) ? `Rating ${Number(listing.seller_rating).toFixed(1)}` : '',
                                listing.sales_count ? `${listing.sales_count} sales` : '',
                                listing.shipping_speed || '',
                              ].filter(Boolean).length > 0 && (
                                <p>{[
                                  Number.isFinite(Number(listing.seller_rating)) ? `Rating ${Number(listing.seller_rating).toFixed(1)}` : '',
                                  listing.sales_count ? `${listing.sales_count} sales` : '',
                                  listing.shipping_speed || '',
                                ].filter(Boolean).join(' | ')}</p>
                              )}
                              {getListingCertNumber(listing) && (
                                <p className="catalog-detail-listing-condition">
                                  Cert #{getListingCertNumber(listing)}{isListingCertVerified(listing) ? ' • Verified Card' : ''}
                                </p>
                              )}
                              {listing.condition && <p className="catalog-detail-listing-condition">{listing.condition}</p>}
                            </div>
                            {Number.isFinite(Number(listing.price)) && <strong>{formatUsd(listing.price)}</strong>}
                          </div>
                        ))}
                        {listings.length > 2 && (
                          <button type="button" className="catalog-detail-viewall-btn">
                            View All {listings.length} Listings
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="catalog-detail-empty-state">
                        <strong>No listings currently available</strong>
                        <p>There are no active CollectorsHub listings for this item right now.</p>
                      </div>
                    )}
                  </article>

                  <article className="catalog-card catalog-detail-section">
                    <h3>Local Availability</h3>
                    {localAvailability.length > 0 ? (
                      <>
                        {localAvailability.map((availability, index) => (
                          <div
                            className={`catalog-detail-availability-card ${index === 0 ? 'alert' : 'store'}`}
                            key={availability.id || `availability-${index}`}
                          >
                            <strong>{availability.title || availability.name || 'Local availability'}</strong>
                            {(availability.detail || availability.message) && <p>{availability.detail || availability.message}</p>}
                            {(availability.stock_note || availability.distance) && <p>{availability.stock_note || availability.distance}</p>}
                          </div>
                        ))}
                        {typeof selectedCatalogItemMetadata.map_url === 'string' && selectedCatalogItemMetadata.map_url.trim() && (
                          <a href={selectedCatalogItemMetadata.map_url.trim()} className="catalog-detail-map-link" target="_blank" rel="noreferrer">
                            View on a Map
                          </a>
                        )}
                      </>
                    ) : (
                      <div className="catalog-detail-empty-state">
                        <strong>No local availability found</strong>
                        <p>No nearby stores or local sellers currently have this item listed.</p>
                      </div>
                    )}
                  </article>
                  </section>

                  

                    {marketplaceCompletionMatches.length > 0 && ownershipCount === 0 ? (
                      <section className="catalog-card catalog-detail-section">
                    <h3>Needed For</h3>
                    <div className="collection-needed-list">
                      {marketplaceCompletionMatches.map((goal) => {
                        const nextPercent = goal.totalItems > 0 ? Math.min(((goal.ownedCount + 1) / goal.totalItems) * 100, 100) : goal.completionPercent
                        return (
                          <div key={`needed-goal-${goal.id}`} className="collection-needed-item">
                            <strong>{goal.title}</strong>
                            <p>
                              This purchase would increase completion from {goal.completionPercent.toFixed(1)}% to {nextPercent.toFixed(1)}%.
                            </p>
                          </div>
                        )
                      })}
                    </div>
                      </section>
                    ) : null}

                    

                    {/* Item-to-item relationships now live under the universal
                        "Related Items" tab (Includes / Included In). */}

                    {/* ── Item images ── */}
                    {(catalogItemImages.length > 0 || isPlatformAdmin) && (
                      <section className="catalog-card catalog-detail-section catalog-detail-images-section" style={{ display: "none" }}>
                    <div className="catalog-detail-images-header">
                      <h3>Item Images</h3>
                      {isPlatformAdmin && !isCatalogItemEditMode && (
                        <label className="catalog-detail-add-photo-btn">
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            disabled={isUploadingCatalogItemImage}
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              const usedPositions = new Set(catalogItemImages.map(i => i.position))
                              const nextPosition = [0, 1, 2, 3, 4].find(p => !usedPositions.has(p)) ?? catalogItemImages.length
                              handleUploadCatalogItemImage(file, nextPosition)
                              e.target.value = ''
                            }}
                          />
                          {isUploadingCatalogItemImage ? 'Uploading…' : '+ Add Photo'}
                        </label>
                      )}
                    </div>
                    {catalogItemImages.length > 0 && (
                      <div className="catalog-detail-images-row">
                        {catalogItemImages.map((img) => {
                          const urlData = img.image_path.startsWith('http')
                            ? { publicUrl: img.image_path }
                            : supabase.storage.from('item-images').getPublicUrl(img.image_path).data
                          return (
                            <img
                              key={img.item_image_id}
                              src={urlData.publicUrl}
                              alt={img.position === 0 ? 'Front' : img.position === 1 ? 'Back' : `Image ${img.position + 1}`}
                              className="catalog-detail-item-image catalog-zoomable"
                              onClick={() => openLightbox(urlData.publicUrl)}
                            />
                          )
                        })}
                      </div>
                    )}
                      </section>
                    )}

                    {/* ── Full card information ── */}
                    {selectedCatalogItem._details && (
                      <section className="catalog-card catalog-detail-section catalog-detail-card-info">
                    <h3>Full Information</h3>
                    <div className="catalog-detail-card-info-grid">
                      {(() => {
                        const d = selectedCatalogItem._details
                        const goTo = (filters) => {
                          setCatalogCategory('all'); setCatalogSubcategory(''); setCatalogFranchise('all')
                          setCatalogBrandId(''); setCatalogSetId(''); setCatalogSubsetId('')
                          setCatalogPrintTypeId(''); setCatalogCardTypeIds([]); setCatalogTeamId('')
                          setCatalogSubjectId(''); setCatalogSubjectSearch(''); setCatalogMinYear(''); setCatalogMaxYear('')
                          filters()
                          setCurrentScreen('catalog')
                        }
                        const rows = [
                          { label: 'Category',      value: d.category,            onClick: d.category ? () => goTo(() => setCatalogCategory(d.category)) : null },
                          { label: 'Subcategory',   value: d.subcategory,         onClick: d.subcategory ? () => goTo(() => { setCatalogCategory(d.category || 'all'); setCatalogSubcategory(d.subcategory) }) : null },
                          { label: 'Franchise',     value: d.franchise,           onClick: d.franchise ? () => goTo(() => { setCatalogCategory(d.category || 'all'); setCatalogSubcategory(d.subcategory || ''); setCatalogFranchise(d.franchise_id || d.franchise || 'all') }) : null },
                          { label: 'Brand',         value: d.brand,               onClick: d.brand_id ? () => goTo(() => { setCatalogCategory(d.category || 'all'); setCatalogSubcategory(d.subcategory || ''); setCatalogFranchise(d.franchise_id || d.franchise || 'all'); setCatalogBrandId(d.brand_id) }) : null },
                          { label: 'Collectible Set', value: d.collectible_set,   onClick: d.collectible_set_id ? () => goTo(() => { setCatalogCategory(d.category || 'all'); setCatalogSubcategory(d.subcategory || ''); setCatalogFranchise(d.franchise_id || d.franchise || 'all'); setCatalogBrandId(d.brand_id || ''); setCatalogSetId(d.collectible_set_id) }) : null },
                          { label: 'Release Year',  value: d.release_year ?? 'N/A', onClick: d.release_year ? () => goTo(() => { setCatalogMinYear(String(d.release_year)); setCatalogMaxYear(String(d.release_year)) }) : null },
                          { label: 'Subset',        value: d.subcollectible_set,  onClick: d.subcollectble_set_id ? () => goTo(() => { setCatalogCategory(d.category || 'all'); setCatalogSubcategory(d.subcategory || ''); setCatalogFranchise(d.franchise_id || d.franchise || 'all'); setCatalogBrandId(d.brand_id || ''); setCatalogSetId(d.collectible_set_id || ''); setCatalogSubsetId(d.subcollectble_set_id) }) : null },
                          { label: 'Print Type',    value: d.print_type,          onClick: d.print_type_id ? () => goTo(() => { setCatalogCategory(d.category || 'all'); setCatalogSubcategory(d.subcategory || ''); setCatalogFranchise(d.franchise_id || d.franchise || 'all'); setCatalogBrandId(d.brand_id || ''); setCatalogSetId(d.collectible_set_id || ''); setCatalogSubsetId(d.subcollectble_set_id || ''); setCatalogPrintTypeId(d.print_type_id) }) : null },
                          { label: 'Subject',       value: d.subject,             onClick: null, subjects: catalogDetailSubjects },
                          { label: 'Subject Type',  value: d.subject_type,        onClick: null },
                          { label: 'Species',       value: d.species,             onClick: null },
                          ...(catalogDetailTeams.length ? [{ label: 'Team(s)', value: catalogDetailTeams.join(', '), onClick: null }] : []),
                          ...(catalogDetailCardTypes.length ? [{ label: 'Card Treatment', value: catalogDetailCardTypes.join(', '), onClick: null }] : []),
                          ...(catalogDetailRarityId ? [
                            { label: 'Rarity', value: catalogRarities.find(r => r.id === catalogDetailRarityId)?.name ?? 'N/A', onClick: null },
                          ] : []),
                          ...(catalogItemIsMtg ? [
                            { label: 'Type', value: catalogMtgCardTypes.find(t => t.id === catalogDetailMtgCardTypeId)?.name ?? 'N/A', onClick: null },
                          ] : []),
                          { label: 'Card Number',   value: d.card_number,         onClick: null },
                          { label: 'Print Count',   value: d.print_count ?? 'N/A', onClick: null },
                          ...(d.category === 'Building Blocks' ? (() => {
                            const lego = catalogDetailLego || {}
                            const pc  = lego.piece_count ?? d.piece_count
                            const bl  = lego.bricklink_id ?? d.bricklink_id
                            const rb  = lego.rebrickable_fig_id ?? d.rebrickable_fig_id
                            const upc = lego.upc ?? d.upc
                            const retail = lego.retail_price
                            return [
                              lego.lego_set_number && { label: 'Set Number',    value: lego.lego_set_number, onClick: null },
                              lego.minifig_code    && { label: 'Minifig Code',   value: lego.minifig_code,    onClick: null },
                              (retail != null && retail !== '') && { label: 'Retail Price', value: formatUsd(Number(retail)), onClick: null },
                              (pc != null && pc !== '') && { label: 'Piece Count', value: pc,     onClick: null },
                              bl  && { label: 'BrickLink ID',   value: bl,  onClick: null },
                              rb  && { label: 'Rebrickable ID', value: rb,  onClick: null },
                              upc && { label: 'UPC',            value: upc, onClick: null },
                            ].filter(Boolean)
                          })() : [
                            ...(d.bricklink_id?.toLowerCase().startsWith('col') ? [
                              { label: 'BrickLink ID',   value: d.bricklink_id ?? 'N/A',       onClick: null },
                              { label: 'Rebrickable ID', value: d.rebrickable_fig_id ?? 'N/A', onClick: null },
                            ] : []),
                          ]),
                        ].filter(Boolean)
                        const hasValue = (value) => {
                          if (value === null || value === undefined) return false
                          if (Array.isArray(value)) return value.length > 0
                          if (typeof value === 'object') return Object.keys(value).length > 0
                          const text = String(value).trim()
                          return text !== '' && text.toUpperCase() !== 'N/A'
                        }

                        // Full Information is comprehensive: show every useful populated
                        // field returned for this item. Curated rows above preserve readable
                        // labels, resolved relationships and catalogue navigation.
                        const existingLabels = new Set(rows.map(row => row.label))
                        const internalFields = new Set([
                          'item_id', 'category_id', 'subcategory_id', 'franchise_id',
                          'brand_id', 'collectible_set_id', 'subcollectble_set_id',
                          'print_type_id', 'subject_id', 'created_at', 'updated_at',
                          'created_by', 'updated_by', 'metadata',
                          'description', 'front_image_path', 'image_path',
                          'category_id', 'subcategory_id', 'franchise_id', 'brand_id',
                          'collectible_set_id', 'subcollectble_set_id', 'subject_id',
                          'print_type_id', 'rarity_id', 'mtg_card_type_id',
                          'subset_id', 'series_id', 'name', 'upc', 'catalog_code'
                        ])
                        const friendlyLabel = (key) => {
                          if (key === 'lego_set_number') return 'ID Number'
                          return key
                          .replace(/^_+/, '')
                          .replace(/_id$/, ' ID')
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, char => char.toUpperCase())
                        }

                        const extraRows = Object.entries(catalogRawItemRow || {})
                          .filter(([key, value]) => {
                            if (internalFields.has(key) || key.startsWith('_')) return false
                            if (!hasValue(value)) return false
                            const label = friendlyLabel(key)
                            return !existingLabels.has(label)
                          })
                          .map(([key, value]) => ({
                            label: friendlyLabel(key),
                            value: Array.isArray(value)
                              ? value.map(v => typeof v === 'object' ? (v.name || v.title || JSON.stringify(v)) : v).join(', ')
                              : typeof value === 'object'
                                ? (value.name || value.title || JSON.stringify(value))
                                : value,
                            onClick: null,
                          }))

                        // Keep the readable/resolved fields first, then append every other
                        // populated field known for the item.
                        const visibleRows = [...rows, ...extraRows]
                          .filter(row => hasValue(row.value) || (row.subjects && row.subjects.length > 0))
                        return visibleRows.map(({ label, value, onClick, subjects }) => (
                          <div key={label} className="catalog-detail-info-cell">
                            <span className="catalog-detail-info-label">{label}</span>
                            {subjects && subjects.length > 0 ? (
                              <div className="catalog-detail-subject-links">
                                {subjects.map(s => (
                                  <button key={s.id} type="button" className="catalog-detail-info-value catalog-detail-meta-link" onClick={() => goTo(() => { setCatalogSubjectId(s.id); setCatalogSubjectSearch(s.name) })}>{s.name.toUpperCase()}</button>
                                ))}
                              </div>
                            ) : onClick ? (
                              <button type="button" className="catalog-detail-info-value catalog-detail-meta-link" onClick={onClick}>{value ?? 'N/A'}</button>
                            ) : (
                              <span className="catalog-detail-info-value">{value ?? 'N/A'}</span>
                            )}
                          </div>
                        ))
                      })()}
                    </div>
                      </section>
                    )}

                    <div className="catalog-detail-cartbar">
                      <button type="button" className="catalog-detail-cartbtn">Add to Cart</button>
                    </div>
                  </>
                ) : catalogDetailViewTab === 'insights' ? (
                  <div className="catalog-detail-insights-tab" role="tabpanel" aria-label="Item insights">
                    <style>{`
                      .collector-plus-insights { padding: 18px; }
                      .collector-plus-insights-head {
                        display: flex; align-items: flex-start; justify-content: space-between;
                        gap: 16px; margin-bottom: 16px;
                      }
                      .collector-plus-insights-head h3 { margin: 0 0 4px; }
                      .collector-plus-insights-head p { margin: 0; opacity: .68; }
                      .collector-plus-badge {
                        flex: 0 0 auto; padding: 6px 11px; border-radius: 999px;
                        background: #0b2a63; color: #fff; font-size: 11px;
                        font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
                      }
                      .collector-plus-insights-grid {
                        display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;
                      }
                      .collector-plus-insight-card {
                        min-height: 126px; padding: 16px; border: 1px solid rgba(29,78,216,.16);
                        border-radius: 12px; background: rgba(255,255,255,.68);
                      }
                      .collector-plus-insight-card.locked { opacity: .76; }
                      .collector-plus-insight-title {
                        display: flex; align-items: center; justify-content: space-between; gap: 10px;
                      }
                      .collector-plus-insight-card p { margin: 8px 0 14px; opacity: .7; line-height: 1.45; }
                      .collector-plus-insight-value { font-weight: 750; color: #0b2a63; }
                      .collector-plus-lock {
                        padding: 3px 7px; border-radius: 999px; background: rgba(11,42,99,.09);
                        font-size: 10px; font-weight: 800; text-transform: uppercase;
                      }
                      .collector-plus-insight-locked-value { font-size: 12px; font-weight: 700; opacity: .55; }
                      .collector-plus-upgrade {
                        margin-top: 14px; padding: 14px 16px; border-radius: 12px;
                        background: rgba(11,42,99,.06); display: flex; align-items: center;
                        justify-content: space-between; gap: 16px;
                      }
                      .collector-plus-upgrade div { display: flex; flex-direction: column; gap: 3px; }
                      .collector-plus-upgrade span { opacity: .7; font-size: 12px; }
                      @media (max-width: 700px) {
                        .collector-plus-insights-grid { grid-template-columns: 1fr; }
                        .collector-plus-upgrade { align-items: flex-start; flex-direction: column; }
                      }
                    `}</style>

                    <section className="catalog-card catalog-detail-section">
                  <h3>Collector Insights</h3>
                  <div className="catalog-detail-community-grid" aria-label="Collector insights">
                    <div className="catalog-detail-community-item">
                      <strong>For Sale</strong>
                      <p>{catalogDetailStats ? catalogDetailStats.available_count : '—'}</p>
                    </div>
                    <div className="catalog-detail-community-item">
                      <strong>Wanted</strong>
                      <p>{catalogDetailStats ? catalogDetailStats.wanted_count : '—'}</p>
                    </div>
                    <div className="catalog-detail-community-item">
                      <strong>You Own</strong>
                      <p>{ownershipCount > 0 ? ownershipCount : 'None'}</p>
                    </div>
                    <div className="catalog-detail-community-item">
                      <strong>Owned</strong>
                      <p>{catalogDetailStats?.community_owned != null ? catalogDetailStats.community_owned : '—'}</p>
                    </div>
                  </div>
                    </section>
                    {(() => {
                      // Admins receive Collector+ access automatically. Add the user's
                      // subscription/profile flag here as the paid membership model is wired in.
                      const hasCollectorPlus = Boolean(
                        isPlatformAdmin ||
                        userProfile?.collector_plus ||
                        userProfile?.is_collector_plus ||
                        userProfile?.subscription_tier === 'collector_plus' ||
                        userProfile?.plan === 'collector_plus'
                      )

                      const premiumInsights = [
                        {
                          title: 'Market Trends',
                          description: 'See how this item’s market value is moving over time.',
                          value: selectedCatalogItem?.market_price
                            ? `$${Number(selectedCatalogItem.market_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : 'Not enough market data yet',
                        },
                        {
                          title: 'Price History',
                          description: 'Track historical pricing and sales activity for this item.',
                          value: 'Price history will appear as sales data is collected.',
                        },
                        {
                          title: 'Demand Score',
                          description: 'Compare collector demand using wishlist, ownership and marketplace activity.',
                          value: `${Number(insights?.wanted || 0).toLocaleString()} wanted · ${Number(insights?.owned || 0).toLocaleString()} owned`,
                        },
                        {
                          title: 'Completion Statistics',
                          description: 'See how this item contributes to collector completion across its catalogue hierarchy.',
                          value: 'Completion analytics will appear as collection data grows.',
                        },
                      ]

                      return (
                        <section className="catalog-card catalog-detail-section collector-plus-insights">
                          <div className="collector-plus-insights-head">
                            <div>
                              <h3>Advanced Insights</h3>
                              <p>Deeper market and collector intelligence for this item.</p>
                            </div>
                            <span className="collector-plus-badge">Collector+</span>
                          </div>

                          <div className="collector-plus-insights-grid">
                            {premiumInsights.map((item) => (
                              <article
                                key={item.title}
                                className={`collector-plus-insight-card ${hasCollectorPlus ? 'unlocked' : 'locked'}`}
                              >
                                <div className="collector-plus-insight-title">
                                  <strong>{item.title}</strong>
                                  {!hasCollectorPlus && <span className="collector-plus-lock">Locked</span>}
                                </div>
                                <p>{item.description}</p>
                                {hasCollectorPlus ? (
                                  <div className="collector-plus-insight-value">{item.value}</div>
                                ) : (
                                  <div className="collector-plus-insight-locked-value">Collector+ insight</div>
                                )}
                              </article>
                            ))}
                          </div>

                          {!hasCollectorPlus && (
                            <div className="collector-plus-upgrade">
                              <div>
                                <strong>Unlock Advanced Insights</strong>
                                <span>Get deeper market, demand and completion analytics with Collector+.</span>
                              </div>
                              <button type="button" className="catalog-action-pill">
                                Explore Collector+
                              </button>
                            </div>
                          )}
                        </section>
                      )
                    })()}
                  </div>
                ) : catalogDetailViewTab === 'reviews' ? (
                  <section className="catalog-card catalog-detail-section catalog-detail-reviews-section" role="tabpanel" aria-label="Item reviews">
                    <div className="catalog-detail-reviews-header">
                      <h3>Collector Reviews</h3>
                      <p>
                        {catalogDetailAverageRating == null
                          ? `No ratings yet • ${catalogDetailReviews.length} review${catalogDetailReviews.length === 1 ? '' : 's'}`
                          : `${catalogDetailAverageRating.toFixed(1)}/5 avg • ${catalogDetailReviews.length} review${catalogDetailReviews.length === 1 ? '' : 's'}`}
                      </p>
                    </div>
                    {catalogDetailReviews.length === 0 ? (
                      <p className="catalog-detail-listing-condition">No reviews have been added for this item yet.</p>
                    ) : (
                      <div className="catalog-detail-reviews-list">
                        {catalogDetailReviews.map((review) => (
                          <article key={review.id} className="catalog-detail-review-card">
                            <div className="catalog-detail-review-topline">
                              <strong>{review.author}</strong>
                              <span>
                                {review.rating == null ? 'Unrated' : `${review.rating.toFixed(1)}/5`}
                                {review.dateLabel ? ` • ${review.dateLabel}` : ''}
                              </span>
                            </div>
                            {review.title ? <p className="catalog-detail-review-title">{review.title}</p> : null}
                            <p>{review.body || 'No written comments.'}</p>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                ) : catalogDetailViewTab === 'related' ? (
                  <section className="catalog-card catalog-detail-section related-items-panel" role="tabpanel" aria-label="Related items">
                    {(() => {
                      const hasAny = catalogDetailIncludes.length > 0 || catalogDetailIncludedIn.length > 0
                      const RelCard = ({ item, mode }) => (
                        <div className="related-card">
                          <button type="button" className="related-card-main" onClick={() => openCatalogItemById(item.item_id)}>
                            <div className="related-card-thumb">
                              {item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" /> : <div className="related-card-thumb-missing">No image</div>}
                            </div>
                            <div className="related-card-body">
                              <span className="related-card-name">{item.name}{item.quantity > 1 ? <span className="related-card-qty"> ×{item.quantity}</span> : null}</span>
                              {item.description ? <span className="related-card-desc">{item.description}</span> : null}
                              <span className="related-card-meta">
                                {item.itemType ? <span className="related-card-type">{item.itemType}</span> : null}
                                {item.idNumber ? <span className="related-card-id">{item.idNumber}</span> : null}
                              </span>
                            </div>
                          </button>
                          {isPlatformAdmin && mode === 'child' && (
                            <label className="related-card-qtyedit" title="Copies in this item" onClick={(e) => e.stopPropagation()}>
                              ×<input type="number" min="1" defaultValue={item.quantity} disabled={relBusy}
                                onClick={(e) => e.stopPropagation()}
                                onBlur={(e) => { const v = Math.max(1, parseInt(e.target.value, 10) || 1); if (v !== item.quantity) handleRelSetQuantity(item.item_id, v) }} />
                            </label>
                          )}
                          {isPlatformAdmin && (
                            <button type="button" className="related-card-remove" disabled={relBusy}
                              onClick={() => handleRemoveRelated(item.item_id, mode)} title="Remove relationship">✕</button>
                          )}
                        </div>
                      )
                      return (
                        <>
                          <div className="related-items-head">
                            <h3>Related Items</h3>
                            {isPlatformAdmin && (
                              <div className="related-items-actions">
                                <button type="button" className="catalog-action-pill" onClick={() => { setRelAddMode(relAddMode === 'child' ? null : 'child'); setRelSearch(''); setRelSearchResults([]) }}>+ Add Included Item</button>
                                <button type="button" className="catalog-action-pill" onClick={() => { setRelAddMode(relAddMode === 'parent' ? null : 'parent'); setRelSearch(''); setRelSearchResults([]) }}>+ Add Parent Item</button>
                              </div>
                            )}
                          </div>
                          {relError ? <p className="catalog-admin-form-error">{relError}</p> : null}

                          {isPlatformAdmin && relAddMode && (
                            <div className="related-add-box">
                              <p className="catalog-admin-hint">
                                {relAddMode === 'child'
                                  ? 'Search for an item this one includes (current item → includes → selected).'
                                  : 'Search for a parent item that includes this one (selected → includes → current).'}
                              </p>
                              <div className="related-add-controls">
                                <input type="text" autoFocus placeholder="Search name, description, ID, barcode…" value={relSearch} onChange={(e) => setRelSearch(e.target.value)} />
                                {relAddMode === 'child' && (
                                  <label className="related-add-qty">Qty
                                    <input type="number" min="1" value={relAddQty} onChange={(e) => setRelAddQty(e.target.value)} />
                                  </label>
                                )}
                              </div>
                              {relSearchResults.length > 0 && (
                                <div className="related-search-results">
                                  {relSearchResults.map((r) => (
                                    <button key={r.item_id} type="button" className="related-search-result" disabled={relBusy}
                                      onClick={() => handleAddRelatedItem(r.item_id, relAddMode)}>
                                      <span className="related-search-name">{r.name}</span>
                                      <span className="related-search-ctx">{[r.itemType, r.idNumber, r.franchise].filter(Boolean).join(' · ')}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {!hasAny ? (
                            <p className="related-empty">No related items have been linked yet.</p>
                          ) : (
                            <>
                              {catalogDetailIncludes.length > 0 && (
                                <div className="related-section">
                                  <h4>Includes ({catalogDetailIncludes.length})</h4>
                                  <div className="related-grid">
                                    {catalogDetailIncludes.map((it) => <RelCard key={it.item_id} item={it} mode="child" />)}
                                  </div>
                                </div>
                              )}
                              {catalogDetailIncludedIn.length > 0 && (
                                <div className="related-section">
                                  <h4>Included In ({catalogDetailIncludedIn.length})</h4>
                                  <div className="related-grid">
                                    {catalogDetailIncludedIn.map((it) => <RelCard key={it.item_id} item={it} mode="parent" />)}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )
                    })()}
                  </section>
                ) : isPlatformAdmin ? (
                  <section className="catalog-card catalog-detail-section manage-images-panel" role="tabpanel" aria-label="Manage images">
                    <div className="manage-images-head">
                      <h3>Images</h3>
                      <span className="manage-images-admin-badge">Admin only</span>
                    </div>
                    {imageQueueActive && (
                      <div className="image-queue-bar">
                        <div className="image-queue-progress">
                          <strong>Image Queue</strong>
                          <span>Item {imageQueuePos + 1} of {imageQueueItems.length}</span>
                          <span className="image-queue-name">{selectedCatalogItem?.name || ''}</span>
                        </div>
                        <div className="image-queue-controls">
                          <button type="button" className="catalog-admin-inline-cancel" onClick={() => exitImageQueue(false)}>Exit Queue</button>
                          <button type="button" className="catalog-action-pill" disabled={manageImagesBusy} onClick={advanceImageQueue}>Skip →</button>
                          <button type="button" className="catalog-detail-btn catalog-detail-btn-collect" disabled={manageImagesBusy} onClick={advanceImageQueue}>
                            {imageQueuePos + 1 >= imageQueueItems.length ? 'Finish' : (catalogItemImages.length ? 'Save & Next →' : 'Next →')}
                          </button>
                        </div>
                      </div>
                    )}
                    {manageImagesError ? <p className="catalog-admin-form-error">{manageImagesError}</p> : null}
                    {manageImagesNotice ? <p className="auth-banner">{manageImagesNotice}</p> : null}

                    {/* ── 1. Current images ─────────────────────────────────── */}
                    <div className="manage-images-section">
                      <h4>Current Images ({catalogItemImages.length})</h4>
                      {catalogItemImages.length === 0 ? (
                        <p className="manage-images-empty">No images yet. This item is eligible for automatic image discovery.</p>
                      ) : (
                        <div className="manage-images-grid">
                          {[...catalogItemImages].sort((a, b) => a.position - b.position).map((img, idx, arr) => {
                            const url = miResolveUrl(img.image_path)
                            const isPrimary = img.position === 0 || img.is_primary
                            const editing = manageImagesEditSourceId === img.item_image_id
                            return (
                              <div key={img.item_image_id} className={`manage-images-card ${isPrimary ? 'is-primary' : ''}`}>
                                <div className="manage-images-thumb" onClick={() => url && openLightbox(url)} title="View full image">
                                  {url ? <img src={url} alt={`Image ${img.position + 1}`} loading="lazy" /> : <div className="manage-images-thumb-missing">No preview</div>}
                                  {isPrimary && <span className="manage-images-primary-tag">Primary</span>}
                                </div>
                                <div className="manage-images-meta">
                                  <span className="manage-images-order">#{img.position + 1}</span>
                                  {img.is_verified ? <span className="manage-images-verified">✓ Verified</span> : <span className="manage-images-unverified">Unverified</span>}
                                </div>
                                {img.source_name || img.source_url ? (
                                  <p className="manage-images-source">{img.source_name || 'Source'}{img.source_url ? <> · <a href={img.source_url} target="_blank" rel="noreferrer">link</a></> : null}</p>
                                ) : <p className="manage-images-source manage-images-source-none">No source recorded</p>}
                                {editing ? (
                                  <div className="manage-images-source-edit">
                                    <input type="text" placeholder="Source name (e.g. Rebrickable)" value={manageImagesSourceDraft.source_name} onChange={e => setManageImagesSourceDraft(d => ({ ...d, source_name: e.target.value }))} />
                                    <input type="text" placeholder="Source URL" value={manageImagesSourceDraft.source_url} onChange={e => setManageImagesSourceDraft(d => ({ ...d, source_url: e.target.value }))} />
                                    <label className="manage-images-checkbox"><input type="checkbox" checked={manageImagesSourceDraft.is_verified} onChange={e => setManageImagesSourceDraft(d => ({ ...d, is_verified: e.target.checked }))} /> Verified</label>
                                    <div className="manage-images-actions">
                                      <button type="button" className="catalog-detail-btn catalog-detail-btn-collect" disabled={manageImagesBusy} onClick={() => handleMiSaveSource(img)}>Save</button>
                                      <button type="button" className="catalog-admin-inline-cancel" onClick={() => setManageImagesEditSourceId(null)}>Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="manage-images-actions">
                                    {!isPrimary && <button type="button" disabled={manageImagesBusy} onClick={() => handleMiSetPrimary(img)}>Set Primary</button>}
                                    <button type="button" disabled={manageImagesBusy || idx === 0} onClick={() => handleMiReorder(img, 'up')} title="Move up">↑</button>
                                    <button type="button" disabled={manageImagesBusy || idx === arr.length - 1} onClick={() => handleMiReorder(img, 'down')} title="Move down">↓</button>
                                    <button type="button" disabled={manageImagesBusy} onClick={() => { setManageImagesEditSourceId(img.item_image_id); setManageImagesSourceDraft({ source_url: img.source_url || '', source_name: img.source_name || '', is_verified: !!img.is_verified }) }}>Edit Source</button>
                                    <button type="button" className="manage-images-danger" disabled={manageImagesBusy} onClick={() => handleMiRemove(img)}>Remove</button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* ── 2. Image candidates ───────────────────────────────── */}
                    <div className="manage-images-section">
                      <div className="manage-images-section-head">
                        <h4>Image Candidates ({manageImagesCandidates.filter(c => c.status === 'pending').length} pending)</h4>
                        <button type="button" className="catalog-detail-btn" disabled={manageImagesBusy} onClick={handleMiFindImages}>Find Images</button>
                      </div>
                      {manageImagesJobs[0] ? (
                        <p className="manage-images-jobline">Last search: <strong>{manageImagesJobs[0].status.replace(/_/g, ' ')}</strong>{manageImagesJobs[0].candidates_found ? ` · ${manageImagesJobs[0].candidates_found} found` : ''}{manageImagesJobs[0].error_message ? ` · ${manageImagesJobs[0].error_message}` : ''}</p>
                      ) : null}
                      {manageImagesCandidates.length === 0 ? (
                        <p className="manage-images-empty">No candidates yet. Use “Find Images” to search Google for this item’s images.</p>
                      ) : (
                        <div className="manage-images-candidates-grid">
                          {manageImagesCandidates.map(cand => (
                            <div key={cand.id} className={`manage-images-candidate status-${cand.status}`}>
                              <div className="manage-images-thumb" onClick={() => cand.image_url && openLightbox(cand.image_url)}>
                                {cand.image_url ? <img src={cand.thumb_url || cand.image_url} alt="Candidate" loading="lazy" /> : <div className="manage-images-thumb-missing">No preview</div>}
                                <span className={`manage-images-status-tag status-${cand.status}`}>{cand.status}</span>
                              </div>
                              <div className="manage-images-candidate-body">
                                <p className="manage-images-source">{cand.source_name || 'Unknown source'}{cand.source_url ? <> · <a href={cand.source_url} target="_blank" rel="noreferrer">source</a></> : null}</p>
                                <p className="manage-images-score">Score: {Number(cand.match_score || 0)}</p>
                                {Array.isArray(cand.match_reasons) && cand.match_reasons.length ? (
                                  <ul className="manage-images-reasons">{cand.match_reasons.map((r, i) => <li key={i}>{r.field || r.reason || JSON.stringify(r)}{r.points ? ` (+${r.points})` : ''}</li>)}</ul>
                                ) : null}
                              </div>
                              {cand.status === 'pending' ? (
                                <div className="manage-images-actions">
                                  <button type="button" disabled={manageImagesBusy} onClick={() => handleMiApproveCandidate(cand, 'primary')}>Approve as Primary</button>
                                  <button type="button" disabled={manageImagesBusy} onClick={() => handleMiApproveCandidate(cand, 'gallery')}>Add to Gallery</button>
                                  <button type="button" className="manage-images-danger" disabled={manageImagesBusy} onClick={() => handleMiRejectCandidate(cand)}>Reject</button>
                                </div>
                              ) : (
                                <p className="manage-images-candidate-resolved">{cand.status === 'approved' ? 'Approved — added to catalogue' : 'Rejected — will not be suggested again'}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ── 3. Manual image management ────────────────────────── */}
                    <div className="manage-images-section">
                      <h4>Add an Image</h4>
                      <div className="manage-images-manual">
                        <div className="manage-images-manual-upload">
                          <label className="catalog-detail-btn catalog-detail-btn-collect manage-images-upload-btn">
                            {manageImagesBusy ? 'Working…' : 'Upload from device'}
                            <input type="file" accept="image/*" style={{ display: 'none' }} disabled={manageImagesBusy} onChange={e => { if (e.target.files?.[0]) handleMiUpload(e.target.files[0], catalogItemImages.length === 0); e.target.value = '' }} />
                          </label>
                          <span className="catalog-admin-hint">Uploads go to the existing <code>item-images</code> bucket. First image becomes primary automatically.</span>
                        </div>
                        <div className="manage-images-manual-url">
                          <input type="text" placeholder="External image URL" value={manageImagesUrlDraft.image_url} onChange={e => setManageImagesUrlDraft(d => ({ ...d, image_url: e.target.value }))} />
                          <input type="text" placeholder="Source name (optional)" value={manageImagesUrlDraft.source_name} onChange={e => setManageImagesUrlDraft(d => ({ ...d, source_name: e.target.value }))} />
                          <input type="text" placeholder="Source URL (optional)" value={manageImagesUrlDraft.source_url} onChange={e => setManageImagesUrlDraft(d => ({ ...d, source_url: e.target.value }))} />
                          <label className="manage-images-checkbox"><input type="checkbox" checked={manageImagesUrlDraft.asPrimary} onChange={e => setManageImagesUrlDraft(d => ({ ...d, asPrimary: e.target.checked }))} /> Set as primary</label>
                          <button type="button" className="catalog-detail-btn" disabled={manageImagesBusy} onClick={handleMiAddByUrl}>Add by URL</button>
                        </div>
                      </div>
                    </div>
                  </section>
                ) : (
                  <section className="catalog-card catalog-detail-section" role="tabpanel">
                    <p className="manage-images-empty">This tab is not available.</p>
                  </section>
                )}
              </>
            ) : (
              <div className="catalog-card catalog-loading-panel">Item not found.</div>
            )}
          </section>
  )
}
