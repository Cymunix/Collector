import React from 'react'

export default function CollectionItemPage({ scope }) {
  const {
    COLLECTION_ACQUISITION_TYPE_LABELS,
    admin,
    boundedSelectedCollectionCopyIndex,
    canListSelectedCollectionCopy,
    catalogRarities,
    collectionCopySalePriceInput,
    collectionItemDetailActionError,
    collectionItemDetailActionMessage,
    currentUser,
    formatUsd,
    handleBackToCollection,
    handleListSelectedCollectionCopyForSale,
    handleUpdateCollectionCopyCondition,
    handleUploadCollectionCopyImage,
    isListingCollectionCopyForSale,
    isSavingCopyCondition,
    isUploadingCollectionCopyImage,
    listingRequirementItems,
    openAuth,
    selectedCollectionCopyAcquiredLabel,
    selectedCollectionCopyBackImageUrl,
    selectedCollectionCopyCollection,
    selectedCollectionCopyCondition,
    selectedCollectionCopyFrontImageUrl,
    selectedCollectionCopyHasMarketValue,
    selectedCollectionCopyImageUrl,
    selectedCollectionCopyIsListed,
    selectedCollectionCopyListingPrice,
    selectedCollectionCopyLocation,
    selectedCollectionCopyProfitLoss,
    selectedCollectionCopyProfitLossPercent,
    selectedCollectionCopyRow,
    selectedCollectionItemCopyRows,
    selectedCollectionItemDetails,
    selectedCopyConditionOptions,
    sellConnectedMinifigs,
    sellMinifigInclusion,
    setCollectionCopySalePriceInput,
    setSelectedCollectionCopyIndex,
    setSellMinifigInclusion
  } = scope
  return (
          <section className="collection-screen" aria-label="Collection item details">
            <div className="catalog-head">
              <div>
                <h1>{selectedCollectionItemDetails?.name || 'Collection Item'}</h1>
                <p className="subtitle catalog-subtitle">Copy-level details for your owned card(s).</p>
              </div>
              <div className="catalog-actions">
                <button type="button" className="catalog-action-pill" onClick={handleBackToCollection}>
                  Back to My Collection
                </button>
              </div>
            </div>

            {!currentUser ? (
              <div className="settings-empty-state">
                <p className="subtitle">Log in to view your collection details.</p>
                <button type="button" className="auth-submit" onClick={() => openAuth('signin')}>
                  Log in
                </button>
              </div>
            ) : !selectedCollectionItemDetails ? (
              <div className="catalog-card catalog-loading-panel">
                Could not find that item in your collection.
              </div>
            ) : (
              <div className="collection-main-pane">
                <article className="catalog-card collection-analytics-card owned-copy-detail">
                  <div className="owned-copy-detail-head">
                    <div>
                      <p className="owned-copy-eyebrow">Owned Asset</p>
                      <h3>{selectedCollectionItemDetails.name}</h3>
                      <p className="collection-muted">
                        {selectedCollectionItemCopyRows.length} owned cop{selectedCollectionItemCopyRows.length === 1 ? 'y' : 'ies'} | Total Qty {selectedCollectionItemDetails.totalQuantity}
                      </p>
                    </div>
                    <div className="owned-copy-tabs" aria-label="Owned copy detail sections">
                      {['Overview', 'Photos', 'History', 'Market', 'Collection', 'Listing'].map((tabLabel, tabIndex) => (
                        <button key={tabLabel} type="button" className={`owned-copy-tab${tabIndex === 0 ? ' active' : ''}`}>
                          {tabLabel}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedCollectionItemCopyRows.length === 0 || !selectedCollectionCopyRow ? (
                    <p className="collection-muted">No copy-level rows found for this item.</p>
                  ) : (
                    <>
                      {selectedCollectionItemCopyRows.length > 1 ? (
                        <section className="owned-copy-selector" aria-label="Owned copies">
                          <div className="owned-copy-section-head">
                            <span>Owned Copies</span>
                          </div>
                          <div className="owned-copy-selector-grid">
                            {selectedCollectionItemCopyRows.map((copyRow, copyIndex) => {
                              const copyMetadata = copyRow?.metadata && typeof copyRow.metadata === 'object' ? copyRow.metadata : {}
                              const copyCondition = copyRow?.condition || (copyRow?.gradingCompany ? `${copyRow.gradingCompany}${copyRow.grade ? ` ${copyRow.grade}` : ''}` : 'Condition Not Set')
                              const copyLocation = Array.isArray(copyRow?.locationPaths) && copyRow.locationPaths.length > 0 ? copyRow.locationPaths[0] : 'Location Not Set'
                              const copyHasFrontPhoto = Boolean(copyRow?.frontImageUrl || copyMetadata.front_image_url || copyMetadata.user_image_url)
                              const copyHasBackPhoto = Boolean(copyRow?.backImageUrl || copyMetadata.back_image_url)

                              return (
                                <button
                                  key={copyRow.id || `copy-${copyIndex}`}
                                  type="button"
                                  className={`owned-copy-select-card${copyIndex === boundedSelectedCollectionCopyIndex ? ' active' : ''}`}
                                  onClick={() => setSelectedCollectionCopyIndex(copyIndex)}
                                >
                                  <strong>Copy #{copyIndex + 1}</strong>
                                  <span>{copyCondition}</span>
                                  <small>{copyLocation}</small>
                                  <em>{copyHasFrontPhoto && copyHasBackPhoto ? 'Photos Ready' : 'Photos Needed'}</em>
                                </button>
                              )
                            })}
                          </div>
                        </section>
                      ) : null}

                      <div className="owned-copy-asset-layout">
                        <aside className="owned-copy-photo-card">
                          <div className="catalog-detail-image-frame">
                            {selectedCollectionCopyImageUrl ? (
                              <img
                                src={selectedCollectionCopyImageUrl}
                                alt={selectedCollectionItemDetails.name || 'Collection copy'}
                                className="catalog-detail-market-image"
                              />
                            ) : (
                              <div className="catalog-detail-market-image catalog-item-image-placeholder">Front photo missing</div>
                            )}
                          </div>
                          <p className="catalog-detail-image-caption">
                            Copy {boundedSelectedCollectionCopyIndex + 1} of {selectedCollectionItemCopyRows.length}
                          </p>
                        </aside>

                        <div className="owned-copy-detail-stack">
                          {selectedCollectionItemDetails.rarity_id && (
                            <section className="owned-copy-hero-card" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: '10px 16px' }}>
                              <p className="owned-copy-eyebrow" style={{ margin: 0 }}>Rarity</p>
                              <strong style={{ fontSize: '1rem' }}>{catalogRarities.find(r => r.id === selectedCollectionItemDetails.rarity_id)?.name ?? 'Unknown'}</strong>
                            </section>
                          )}
                          <section className="owned-copy-hero-card">
                            <div>
                              <p className="owned-copy-eyebrow">Condition</p>
                              <h2>{selectedCollectionCopyCondition || 'Condition Not Set'}</h2>
                              {selectedCopyConditionOptions.length > 0 && (
                                <select
                                  className="collection-filter-select"
                                  style={{ marginTop: 6, maxWidth: 260 }}
                                  value={selectedCollectionCopyRow.condition || ''}
                                  disabled={isSavingCopyCondition}
                                  onChange={(event) => handleUpdateCollectionCopyCondition(event.target.value)}
                                >
                                  <option value="">— Set condition —</option>
                                  {selectedCopyConditionOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                              )}
                              <p className="collection-muted">
                                {selectedCollectionCopyRow.certNumber ? `Cert #${selectedCollectionCopyRow.certNumber}` : 'Uncertified copy'}
                                {selectedCollectionCopyRow.acquisitionType
                                  ? ` | ${COLLECTION_ACQUISITION_TYPE_LABELS[selectedCollectionCopyRow.acquisitionType] || selectedCollectionCopyRow.acquisitionType}`
                                  : ''}
                              </p>
                            </div>
                            <div className={`owned-copy-status-pill${selectedCollectionCopyIsListed ? ' listed' : ''}`}>
                              {selectedCollectionCopyIsListed ? 'Listed For Sale' : 'Not Listed'}
                            </div>
                          </section>

                          <section className="owned-copy-summary-grid">
                            <div className="owned-copy-summary-card highlight">
                              <span>Purchase Price</span>
                              <strong>{selectedCollectionCopyRow.purchasePrice == null ? 'Not Recorded' : `${formatUsd(selectedCollectionCopyRow.purchasePrice)} CAD`}</strong>
                            </div>
                            <div className="owned-copy-summary-card highlight">
                              <span>Current Market Value</span>
                              <strong>{selectedCollectionCopyHasMarketValue ? `${formatUsd(selectedCollectionCopyRow.currentMarketValue)} CAD` : 'Market Data Not Available Yet'}</strong>
                            </div>
                            <div className="owned-copy-summary-card highlight">
                              <span>Profit / Loss</span>
                              <strong className={selectedCollectionCopyProfitLoss >= 0 ? 'collection-positive' : 'collection-negative'}>
                                {selectedCollectionCopyHasMarketValue && selectedCollectionCopyRow.purchasePrice != null
                                  ? `${selectedCollectionCopyProfitLoss >= 0 ? '+' : ''}${formatUsd(selectedCollectionCopyProfitLoss)}${selectedCollectionCopyProfitLossPercent == null ? '' : ` (${selectedCollectionCopyProfitLossPercent >= 0 ? '+' : ''}${selectedCollectionCopyProfitLossPercent.toFixed(0)}%)`}`
                                  : 'Market Data Not Available Yet'}
                              </strong>
                            </div>
                          </section>

                          <section className="owned-copy-info-grid">
                            <div className="owned-copy-info-card">
                              <span>Collection</span>
                              <strong>{selectedCollectionCopyCollection}</strong>
                            </div>
                            <div className="owned-copy-info-card">
                              <span>Location</span>
                              <strong>{selectedCollectionCopyLocation}</strong>
                            </div>
                            <div className="owned-copy-info-card">
                              <span>Acquired</span>
                              <strong>{selectedCollectionCopyAcquiredLabel}</strong>
                            </div>
                            <div className="owned-copy-info-card">
                              <span>Listing Status</span>
                              <strong>
                                {selectedCollectionCopyIsListed
                                  ? `Listed For Sale${selectedCollectionCopyListingPrice == null ? '' : ` | ${formatUsd(selectedCollectionCopyListingPrice)} CAD`}`
                                  : 'Not Listed'}
                              </strong>
                            </div>
                          </section>
                        </div>
                      </div>

                      <div className="owned-copy-management-grid">
                        <section className="owned-copy-panel">
                          <div className="owned-copy-section-head">
                            <span>Photos</span>
                          </div>
                          <div className="owned-copy-photo-grid">
                            <div className="owned-copy-photo-upload">
                              <div>
                                <strong>Front Photo</strong>
                                <p className={selectedCollectionCopyFrontImageUrl ? 'requirement-complete' : 'requirement-missing'}>
                                  {selectedCollectionCopyFrontImageUrl ? '✓ Front Photo Uploaded' : '✗ Front Photo Missing'}
                                </p>
                              </div>
                              <label className="catalog-action-pill" htmlFor="collection-copy-front-image-upload">
                                {isUploadingCollectionCopyImage ? 'Uploading...' : 'Upload Front'}
                              </label>
                              <input
                                id="collection-copy-front-image-upload"
                                type="file"
                                accept="image/*"
                                onChange={(event) => handleUploadCollectionCopyImage(event, 'front')}
                                disabled={isUploadingCollectionCopyImage}
                                style={{ display: 'none' }}
                              />
                            </div>
                            <div className="owned-copy-photo-upload">
                              <div>
                                <strong>Back Photo</strong>
                                <p className={selectedCollectionCopyBackImageUrl ? 'requirement-complete' : 'requirement-missing'}>
                                  {selectedCollectionCopyBackImageUrl ? '✓ Back Photo Uploaded' : '✗ Back Photo Missing'}
                                </p>
                              </div>
                              <label className="catalog-action-pill" htmlFor="collection-copy-back-image-upload">
                                {isUploadingCollectionCopyImage ? 'Uploading...' : 'Upload Back'}
                              </label>
                              <input
                                id="collection-copy-back-image-upload"
                                type="file"
                                accept="image/*"
                                onChange={(event) => handleUploadCollectionCopyImage(event, 'back')}
                                disabled={isUploadingCollectionCopyImage}
                                style={{ display: 'none' }}
                              />
                            </div>
                          </div>
                        </section>

                        <section className="owned-copy-panel">
                          <div className="owned-copy-section-head">
                            <span>Listing</span>
                          </div>
                          <label className="catalog-detail-label" htmlFor="collection-copy-sale-price">Pricing (CAD)</label>
                          <input
                            id="collection-copy-sale-price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={collectionCopySalePriceInput}
                            onChange={(event) => setCollectionCopySalePriceInput(event.target.value)}
                            placeholder="0.00"
                          />

                          {!canListSelectedCollectionCopy ? (
                            <div className="owned-copy-requirements">
                              <strong>Requirements Remaining</strong>
                              {listingRequirementItems.map((requirement) => (
                                <p key={requirement.label} className={requirement.complete ? 'requirement-complete' : 'requirement-missing'}>
                                  {requirement.complete ? '✓' : '✗'} {requirement.label}
                                </p>
                              ))}
                            </div>
                          ) : null}

                          {sellConnectedMinifigs.length > 0 ? (
                            <div className="collection-minifig-checklist">
                              <label>Include minifigs you own with this set?</label>
                              <div className="collection-minifig-rows">
                                {sellConnectedMinifigs.map(m => (
                                  <label key={m.ownedCopyId} className="collection-minifig-check">
                                    <input
                                      type="checkbox"
                                      checked={sellMinifigInclusion[m.ownedCopyId] ?? true}
                                      onChange={e => setSellMinifigInclusion(prev => ({ ...prev, [m.ownedCopyId]: e.target.checked }))}
                                    />
                                    <span>{m.name}{m.condition ? ` · ${m.condition}` : ''}</span>
                                  </label>
                                ))}
                              </div>
                              <p className="catalog-admin-hint" style={{ marginTop: 4 }}>Only minifigs connected to this set that you own are shown.</p>
                            </div>
                          ) : null}

                          <button
                            type="button"
                            className="catalog-action-pill owned-copy-list-button"
                            onClick={handleListSelectedCollectionCopyForSale}
                            disabled={isListingCollectionCopyForSale || !canListSelectedCollectionCopy}
                          >
                            {isListingCollectionCopyForSale
                              ? 'Listing...'
                              : canListSelectedCollectionCopy
                                ? 'List This Copy For Sale'
                                : 'Complete Listing Requirements'}
                          </button>
                        </section>
                      </div>

                      {collectionItemDetailActionError ? <p className="auth-error inline-error">{collectionItemDetailActionError}</p> : null}
                      {collectionItemDetailActionMessage ? <p className="auth-banner">{collectionItemDetailActionMessage}</p> : null}
                    </>
                  )}
                </article>
              </div>
            )}
          </section>
  )
}
