import React from 'react'

export default function SettingsPage({ scope }) {
  const {
    AddEmployeeModal,
    AddLocationModal,
    EMPLOYEE_PERMISSION_OPTIONS,
    EMPLOYEE_ROLE_OPTIONS,
    EmployeeCard,
    LANGUAGE_OPTIONS,
    LocationCard,
    activeSettingsTab,
    authMessage,
    canAccessEmployeesTab,
    canAccessHomeScreenTab,
    canAccessIntegrationsTab,
    canAccessLocationsTab,
    canAccessStoreTab,
    createdEmployeeLoginInfo,
    currentUser,
    editingEmployeeAllLocations,
    editingEmployeeId,
    editingEmployeeLocationIds,
    editingEmployeePermissions,
    email,
    employeesError,
    formatDate,
    getPlanDisplayLabel,
    handleCancelEmployeePermissions,
    handleChangeEmail,
    handleChangePassword,
    handleCloseAddEmployeeModal,
    handleCloseAddLocationModal,
    handleCopyEmployeeLoginInfo,
    handleCreateEmployee,
    handleCreateLocation,
    handleDeactivateEmployee,
    handleDeactivateLocation,
    handleEditEmployeePermissions,
    handleImportMagicCards,
    handleLanguageChange,
    handleOpenAddEmployeeModal,
    handleOpenAddLocationModal,
    handleOpenPlans,
    handleOpenTwoFactorSetup,
    handleRemoveEmployee,
    handleSaveEmployeePermissions,
    handleSaveLocalSettings,
    handleSaveLocation,
    handleSaveProfileSettings,
    handleSaveStoreSettings,
    handleSetEditingEmployeeAllLocations,
    handleSetNewEmployeeAllLocations,
    handleToggleEditingEmployeeLocation,
    handleToggleEmployeePermission,
    handleToggleNewEmployeeLocation,
    hasStoreProAccess,
    homeSectionOneOptions,
    homeSectionThreeOptions,
    homeSectionTwoOptions,
    insights,
    isAddEmployeeModalOpen,
    isAddLocationModalOpen,
    isBusinessTier,
    isCollectorPlusMember,
    isCreatingEmployee,
    isCreatingLocation,
    isEmployeesLoading,
    isImportingMagic,
    isLocationsLoading,
    isPlatformAdmin,
    isSavingSettings,
    isSubmitting,
    isTwoFactorEnabled,
    isTwoFactorLoading,
    listings,
    locationOptions,
    locationsById,
    locationsError,
    magicImportError,
    magicImportFile,
    magicImportProgress,
    magicImportSummary,
    managerOptions,
    newEmployeeAllLocations,
    newEmployeeFirstName,
    newEmployeeLastName,
    newEmployeeLocationIds,
    newEmployeePin,
    newEmployeeRole,
    newLocationCity,
    newLocationManagerEmployeeId,
    newLocationName,
    newLocationPhoneNumber,
    newLocationPostalCode,
    newLocationProvince,
    newLocationStreetAddress,
    normalizeLanguage,
    notificationsDealAlerts,
    notificationsEmail,
    notificationsEventReminders,
    notificationsPush,
    notificationsStorePromotions,
    notificationsWishlistAlerts,
    openAuth,
    privacyAllowFollowers,
    privacyPublicProfile,
    privacyShowCollectionValue,
    privacyShowOnlineStatus,
    privacyShowWishlist,
    profile,
    renewalStatus,
    setActiveSettingsTab,
    setMagicImportError,
    setMagicImportFile,
    setMagicImportProgress,
    setMagicImportSummary,
    setNewEmployeeFirstName,
    setNewEmployeeLastName,
    setNewEmployeePin,
    setNewEmployeeRole,
    setNewLocationCity,
    setNewLocationManagerEmployeeId,
    setNewLocationName,
    setNewLocationPhoneNumber,
    setNewLocationPostalCode,
    setNewLocationProvince,
    setNewLocationStreetAddress,
    setNotificationsDealAlerts,
    setNotificationsEmail,
    setNotificationsEventReminders,
    setNotificationsPush,
    setNotificationsStorePromotions,
    setNotificationsWishlistAlerts,
    setPrivacyAllowFollowers,
    setPrivacyPublicProfile,
    setPrivacyShowCollectionValue,
    setPrivacyShowOnlineStatus,
    setPrivacyShowWishlist,
    setSearchAreaContext,
    setSettingsApiKeys,
    setSettingsBio,
    setSettingsCollectionAnalytics,
    setSettingsConnectedApps,
    setSettingsDisplayName,
    setSettingsFavouriteCategories,
    setSettingsGradingRecommendations,
    setSettingsHomeSectionOne,
    setSettingsHomeSectionThree,
    setSettingsHomeSectionTwo,
    setSettingsHomeShowEmptyStateHints,
    setSettingsHomeShowGreeting,
    setSettingsInventoryAllowPurchaseRequests,
    setSettingsInventoryAutoPublish,
    setSettingsInventoryEnableEventCreation,
    setSettingsInventoryEnableMarketplaceListings,
    setSettingsInventoryTrackByLocation,
    setSettingsLocation,
    setSettingsMailingAddress,
    setSettingsPendingEmail,
    setSettingsPortfolioInsights,
    setSettingsPosConnections,
    setSettingsProfileBannerFile,
    setSettingsProfilePhotoFile,
    setSettingsPublicProfileUrl,
    setSettingsStoreAddress,
    setSettingsStoreBannerFile,
    setSettingsStoreDescription,
    setSettingsStoreHours,
    setSettingsStoreLogoFile,
    setSettingsStoreName,
    setSettingsStoreVisibility,
    setSettingsTimezone,
    setSettingsUnlimitedCollectionFolders,
    setSettingsUsername,
    setSettingsWebhookSettings,
    settingsApiKeys,
    settingsBio,
    settingsCollectionAnalytics,
    settingsConnectedApps,
    settingsDisplayName,
    settingsError,
    settingsFavouriteCategories,
    settingsGradingRecommendations,
    settingsHomeSectionOne,
    settingsHomeSectionThree,
    settingsHomeSectionTwo,
    settingsHomeShowEmptyStateHints,
    settingsHomeShowGreeting,
    settingsInventoryAllowPurchaseRequests,
    settingsInventoryAutoPublish,
    settingsInventoryEnableEventCreation,
    settingsInventoryEnableMarketplaceListings,
    settingsInventoryTrackByLocation,
    settingsLanguage,
    settingsLocation,
    settingsMailingAddress,
    settingsPendingEmail,
    settingsPortfolioInsights,
    settingsPosConnections,
    settingsProfileBanner,
    settingsProfilePhoto,
    settingsPublicProfileUrl,
    settingsStoreAddress,
    settingsStoreBanner,
    settingsStoreDescription,
    settingsStoreHours,
    settingsStoreLogo,
    settingsStoreName,
    settingsStoreVisibility,
    settingsTabs,
    settingsTimezone,
    settingsUnlimitedCollectionFolders,
    settingsUsername,
    settingsWebhookSettings,
    storeEmployees,
    storeLocations,
    tx
  } = scope
  return (
          <section className="settings-screen" aria-label="Account settings">
            <div className="settings-header">
              <div>
                <h1>{tx('Settings')}</h1>
                <p className="subtitle">{tx('Manage your profile, account, and subscription controls.')}</p>
              </div>
            </div>

            {authMessage && <p className="auth-banner">{authMessage}</p>}
            {settingsError && <p className="auth-error inline-error">{settingsError}</p>}

            {!currentUser || !profile ? (
              <div className="settings-empty-state">
                <p className="subtitle">{tx('Sign in to view your settings.')}</p>
                <button type="button" className="auth-submit" onClick={() => openAuth('signin')}>
                  {tx('Log in')}
                </button>
              </div>
            ) : (
              <div className="settings-stack">
                <div className="settings-tabs-grid" role="tablist" aria-label="Settings tabs">
                  {settingsTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`settings-tab-button ${activeSettingsTab === tab.key ? 'active' : ''}`}
                      onClick={() => setActiveSettingsTab(tab.key)}
                      role="tab"
                      aria-selected={activeSettingsTab === tab.key}
                    >
                      {tx(tab.label)}
                    </button>
                  ))}
                </div>

                {activeSettingsTab === 'profile' && (
                  <section className="settings-card settings-panel" role="tabpanel" aria-label="Profile settings">
                    <p className="settings-eyebrow">Profile</p>
                    <h2>Profile Settings</h2>

                    <form className="auth-form settings-form" onSubmit={handleSaveProfileSettings}>
                      <label htmlFor="settings-profile-photo">Profile photo</label>
                      <input
                        id="settings-profile-photo"
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const selectedFile = event.target.files?.[0] || null
                          setSettingsProfilePhotoFile(selectedFile)
                        }}
                      />
                      {settingsProfilePhoto && (
                        <p className="settings-file-note">Current uploaded photo saved.</p>
                      )}

                      <label htmlFor="settings-username">Username</label>
                      <input
                        id="settings-username"
                        type="text"
                        value={settingsUsername}
                        onChange={(event) => setSettingsUsername(event.target.value)}
                        placeholder="collectorname"
                      />

                      <label htmlFor="settings-display-name">Display name</label>
                      <input
                        id="settings-display-name"
                        type="text"
                        value={settingsDisplayName}
                        onChange={(event) => setSettingsDisplayName(event.target.value)}
                        placeholder="How your name appears"
                      />

                      <label htmlFor="settings-bio">Bio</label>
                      <textarea
                        id="settings-bio"
                        value={settingsBio}
                        onChange={(event) => setSettingsBio(event.target.value)}
                        rows={3}
                        placeholder="Tell collectors about your niche and interests"
                      />

                      <label htmlFor="settings-favourite-categories">Favourite categories</label>
                      <input
                        id="settings-favourite-categories"
                        type="text"
                        value={settingsFavouriteCategories}
                        onChange={(event) => setSettingsFavouriteCategories(event.target.value)}
                        placeholder="Cards, Comics, Vinyl"
                      />

                      <label htmlFor="settings-profile-banner">Profile banner</label>
                      <input
                        id="settings-profile-banner"
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const selectedFile = event.target.files?.[0] || null
                          setSettingsProfileBannerFile(selectedFile)
                        }}
                      />
                      {settingsProfileBanner && (
                        <p className="settings-file-note">Current uploaded banner saved.</p>
                      )}

                      <label htmlFor="settings-public-profile-url">Public profile URL</label>
                      <input
                        id="settings-public-profile-url"
                        type="text"
                        value={settingsPublicProfileUrl}
                        onChange={(event) => setSettingsPublicProfileUrl(event.target.value)}
                        placeholder="collectorshub.com/u/collectorname"
                      />

                      <p className="settings-subsection-title">Collector+ profile settings</p>
                      {isCollectorPlusMember ? (
                        <label className="settings-checkbox-row">
                          <input
                            type="checkbox"
                            checked={settingsUnlimitedCollectionFolders}
                            onChange={(event) => setSettingsUnlimitedCollectionFolders(event.target.checked)}
                          />
                          <span>Unlimited collection folders</span>
                        </label>
                      ) : (
                        <p className="settings-subsection-note">
                          Collector+ only: Unlimited collection folders.
                        </p>
                      )}

                      <div className="settings-form-actions">
                        <button type="submit" className="auth-submit support-submit" disabled={isSavingSettings}>
                          {isSavingSettings ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </form>
                  </section>
                )}

                {activeSettingsTab === 'account' && (
                  <section className="settings-card settings-panel" role="tabpanel" aria-label="Account details">
                    <p className="settings-eyebrow">Account</p>
                    <h2>Account Details</h2>

                    <form className="auth-form settings-form" onSubmit={(event) => handleSaveLocalSettings(event, 'Account details saved.') }>
                      <label htmlFor="settings-account-email">Email</label>
                      <input id="settings-account-email" type="email" value={currentUser.email || ''} disabled />

                      <label htmlFor="settings-account-type">Account type</label>
                      <input
                        id="settings-account-type"
                        type="text"
                        value={isBusinessTier(profile.subscription_tier) ? 'Business account' : 'Collector account'}
                        disabled
                      />

                      <label htmlFor="settings-account-created">Account created date</label>
                      <input
                        id="settings-account-created"
                        type="text"
                        value={formatDate(currentUser.created_at)}
                        disabled
                      />

                      <label htmlFor="settings-account-location">Location</label>
                      <input
                        id="settings-account-location"
                        type="text"
                        value={settingsLocation}
                        onChange={(event) => {
                          setSettingsLocation(event.target.value)
                          setSearchAreaContext(null)
                        }}
                        placeholder="City, Province"
                      />

                      <label htmlFor="settings-account-mailing-address">Mailing address</label>
                      <textarea
                        id="settings-account-mailing-address"
                        rows={2}
                        value={settingsMailingAddress}
                        onChange={(event) => setSettingsMailingAddress(event.target.value)}
                        placeholder="Street, unit, city, province/state, postal code"
                      />

                      <label htmlFor="settings-language">Language</label>
                      <select
                        id="settings-language"
                        value={normalizeLanguage(settingsLanguage)}
                        onChange={(event) => handleLanguageChange(event.target.value)}
                      >
                        {LANGUAGE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.value}
                          </option>
                        ))}
                      </select>

                      <label htmlFor="settings-timezone">Time zone</label>
                      <input
                        id="settings-timezone"
                        type="text"
                        value={settingsTimezone}
                        onChange={(event) => setSettingsTimezone(event.target.value)}
                      />

                      <div className="settings-form-actions">
                        <button type="submit" className="auth-submit support-submit">Save</button>
                      </div>
                    </form>
                  </section>
                )}

                {activeSettingsTab === 'subscription' && (
                  <section className="settings-card settings-panel" role="tabpanel" aria-label="Subscription">
                    <p className="settings-eyebrow">Subscription</p>
                    <h2>Subscription</h2>

                    <div className="settings-detail-list">
                      <div className="settings-detail-row">
                        <span>Current plan</span>
                        <strong>{getPlanDisplayLabel(profile)}</strong>
                      </div>
                      <div className="settings-detail-row">
                        <span>Started date</span>
                        <strong>{formatDate(profile.subscription_started_at)}</strong>
                      </div>
                      <div className="settings-detail-row">
                        <span>Next billing</span>
                        <strong>{formatDate(profile.subscription_current_period_end)}</strong>
                      </div>
                      <div className="settings-detail-row">
                        <span>Billing cycle</span>
                        <strong>{profile.billing_cycle || 'monthly'}</strong>
                      </div>
                      <div className="settings-detail-row">
                        <span>Renewal status</span>
                        <strong>{renewalStatus}</strong>
                      </div>
                    </div>

                    <div className="settings-form-actions">
                      <button type="button" className="auth-submit support-submit" onClick={handleOpenPlans}>
                        Manage Subscription
                      </button>
                    </div>
                  </section>
                )}

                {activeSettingsTab === 'privacy' && (
                  <section className="settings-card settings-panel" role="tabpanel" aria-label="Privacy settings">
                    <p className="settings-eyebrow">Privacy</p>
                    <h2>Privacy Settings</h2>

                    <form className="auth-form settings-form" onSubmit={(event) => handleSaveLocalSettings(event, 'Privacy settings saved.') }>
                      <label className="settings-checkbox-row">
                        <input type="checkbox" checked={privacyPublicProfile} onChange={(event) => setPrivacyPublicProfile(event.target.checked)} />
                        <span>Public profile</span>
                      </label>
                      <label className="settings-checkbox-row">
                        <input type="checkbox" checked={privacyShowCollectionValue} onChange={(event) => setPrivacyShowCollectionValue(event.target.checked)} />
                        <span>Show collection value</span>
                      </label>
                      <label className="settings-checkbox-row">
                        <input type="checkbox" checked={privacyShowWishlist} onChange={(event) => setPrivacyShowWishlist(event.target.checked)} />
                        <span>Show wishlist</span>
                      </label>
                      <label className="settings-checkbox-row">
                        <input type="checkbox" checked={privacyAllowFollowers} onChange={(event) => setPrivacyAllowFollowers(event.target.checked)} />
                        <span>Allow followers</span>
                      </label>
                      <label className="settings-checkbox-row">
                        <input type="checkbox" checked={privacyShowOnlineStatus} onChange={(event) => setPrivacyShowOnlineStatus(event.target.checked)} />
                        <span>Show online status</span>
                      </label>

                      <div className="settings-form-actions">
                        <button type="submit" className="auth-submit support-submit">Save</button>
                      </div>
                    </form>
                  </section>
                )}

                {activeSettingsTab === 'notifications' && (
                  <section className="settings-card settings-panel" role="tabpanel" aria-label="Notifications settings">
                    <p className="settings-eyebrow">Notifications</p>
                    <h2>Notifications</h2>

                    <form className="auth-form settings-form" onSubmit={(event) => handleSaveLocalSettings(event, 'Notification settings saved.') }>
                      {isCollectorPlusMember ? (
                        <>
                          <p className="settings-subsection-title">Collector+ settings</p>
                          <label className="settings-checkbox-row">
                            <input type="checkbox" checked={notificationsDealAlerts} onChange={(event) => setNotificationsDealAlerts(event.target.checked)} />
                            <span>Deal alerts</span>
                          </label>
                          <label className="settings-checkbox-row">
                            <input
                              type="checkbox"
                              checked={settingsCollectionAnalytics}
                              onChange={(event) => setSettingsCollectionAnalytics(event.target.checked)}
                            />
                            <span>Collection analytics</span>
                          </label>
                          <label className="settings-checkbox-row">
                            <input
                              type="checkbox"
                              checked={settingsGradingRecommendations}
                              onChange={(event) => setSettingsGradingRecommendations(event.target.checked)}
                            />
                            <span>Grading recommendations</span>
                          </label>
                          <label className="settings-checkbox-row">
                            <input
                              type="checkbox"
                              checked={settingsPortfolioInsights}
                              onChange={(event) => setSettingsPortfolioInsights(event.target.checked)}
                            />
                            <span>Portfolio insights</span>
                          </label>
                        </>
                      ) : (
                        <p className="settings-subsection-note">
                          Collector+ only: Deal alerts, Collection analytics, Grading recommendations, and Portfolio insights.
                        </p>
                      )}

                      <p className="settings-subsection-title">General notifications</p>
                      <label className="settings-checkbox-row">
                        <input type="checkbox" checked={notificationsWishlistAlerts} onChange={(event) => setNotificationsWishlistAlerts(event.target.checked)} />
                        <span>Wishlist alerts</span>
                      </label>
                      <label className="settings-checkbox-row">
                        <input type="checkbox" checked={notificationsStorePromotions} onChange={(event) => setNotificationsStorePromotions(event.target.checked)} />
                        <span>Store promotions</span>
                      </label>
                      <label className="settings-checkbox-row">
                        <input type="checkbox" checked={notificationsEventReminders} onChange={(event) => setNotificationsEventReminders(event.target.checked)} />
                        <span>Event reminders</span>
                      </label>
                      <label className="settings-checkbox-row">
                        <input type="checkbox" checked={notificationsEmail} onChange={(event) => setNotificationsEmail(event.target.checked)} />
                        <span>Email notifications</span>
                      </label>
                      <label className="settings-checkbox-row">
                        <input type="checkbox" checked={notificationsPush} onChange={(event) => setNotificationsPush(event.target.checked)} />
                        <span>Push notifications</span>
                      </label>

                      <div className="settings-form-actions">
                        <button type="submit" className="auth-submit support-submit">Save</button>
                      </div>
                    </form>
                  </section>
                )}

                {activeSettingsTab === 'security' && (
                  <section className="settings-card settings-panel" role="tabpanel" aria-label="Security settings">
                    <p className="settings-eyebrow">Security</p>
                    <h2>Security</h2>

                    <div className="settings-detail-list">
                      <div className="settings-detail-row">
                        <span>Current email</span>
                        <strong>{currentUser?.email || 'Not available'}</strong>
                      </div>
                      <div className="settings-detail-row">
                        <span>Password</span>
                        <strong>Managed through email reset</strong>
                      </div>
                      <div className="settings-detail-row">
                        <span>Two-factor authentication</span>
                        <strong>{isTwoFactorEnabled ? 'Enabled' : 'Not enabled'}</strong>
                      </div>
                      <div className="settings-detail-row">
                        <span>Active sessions</span>
                        <strong>1 current session</strong>
                      </div>
                      <div className="settings-detail-row">
                        <span>Recent account activity</span>
                        <strong>Latest sign-in available in account logs</strong>
                      </div>
                    </div>

                    <div className="settings-form">
                      <label htmlFor="settings-change-email">New email address</label>
                      <input
                        id="settings-change-email"
                        type="email"
                        value={settingsPendingEmail}
                        onChange={(event) => setSettingsPendingEmail(event.target.value)}
                        placeholder="name@example.com"
                      />
                    </div>

                    <div className="settings-form-actions">
                      <button type="button" className="auth-submit" onClick={handleChangeEmail} disabled={isSavingSettings}>
                        {isSavingSettings ? 'Updating...' : 'Change Email'}
                      </button>
                      <button type="button" className="auth-submit" onClick={handleChangePassword} disabled={isSavingSettings}>
                        {isSavingSettings ? 'Sending...' : 'Change Password'}
                      </button>
                      <button
                        type="button"
                        className="back-home-btn settings-secondary-action"
                        onClick={handleOpenTwoFactorSetup}
                        disabled={isTwoFactorLoading || isTwoFactorEnabled}
                      >
                        {isTwoFactorEnabled ? '2FA Enabled' : isTwoFactorLoading ? 'Starting...' : 'Enable 2FA'}
                      </button>
                    </div>
                  </section>
                )}

                {activeSettingsTab === 'home_screen' && canAccessHomeScreenTab && (
                  <section className="settings-card settings-panel" role="tabpanel" aria-label="Home screen settings">
                    <p className="settings-eyebrow">Home Screen</p>
                    <h2>Home Screen</h2>

                    <form className="auth-form settings-form" onSubmit={(event) => handleSaveLocalSettings(event, 'Home screen settings saved.') }>
                      <label htmlFor="settings-home-section-1">Home section 1</label>
                      <select
                        id="settings-home-section-1"
                        value={settingsHomeSectionOne}
                        onChange={(event) => setSettingsHomeSectionOne(event.target.value)}
                      >
                        {homeSectionOneOptions.map((sectionName) => (
                          <option key={`home-section-one-${sectionName}`} value={sectionName}>
                            {sectionName}
                          </option>
                        ))}
                      </select>

                      <label htmlFor="settings-home-section-2">Home section 2</label>
                      <select
                        id="settings-home-section-2"
                        value={settingsHomeSectionTwo}
                        onChange={(event) => setSettingsHomeSectionTwo(event.target.value)}
                      >
                        {homeSectionTwoOptions.map((sectionName) => (
                          <option key={`home-section-two-${sectionName}`} value={sectionName}>
                            {sectionName}
                          </option>
                        ))}
                      </select>

                      <label htmlFor="settings-home-section-3">Home section 3</label>
                      <select
                        id="settings-home-section-3"
                        value={settingsHomeSectionThree}
                        onChange={(event) => setSettingsHomeSectionThree(event.target.value)}
                      >
                        {homeSectionThreeOptions.map((sectionName) => (
                          <option key={`home-section-three-${sectionName}`} value={sectionName}>
                            {sectionName}
                          </option>
                        ))}
                      </select>

                      <label className="settings-checkbox-row">
                        <input
                          type="checkbox"
                          checked={settingsHomeShowGreeting}
                          onChange={(event) => setSettingsHomeShowGreeting(event.target.checked)}
                        />
                        <span>Show personalized greeting on Home</span>
                      </label>

                      <label className="settings-checkbox-row">
                        <input
                          type="checkbox"
                          checked={settingsHomeShowEmptyStateHints}
                          onChange={(event) => setSettingsHomeShowEmptyStateHints(event.target.checked)}
                        />
                        <span>Show empty-state helper text in Home cards</span>
                      </label>

                      <div className="settings-form-actions">
                        <button type="submit" className="auth-submit support-submit">Save</button>
                      </div>
                    </form>
                  </section>
                )}

                {activeSettingsTab === 'store' && canAccessStoreTab && (
                  <section className="settings-card settings-panel" role="tabpanel" aria-label="Store settings">
                    <p className="settings-eyebrow">Store</p>
                    <h2>Store Settings</h2>

                    <form className="auth-form settings-form" onSubmit={handleSaveStoreSettings}>
                      <label htmlFor="settings-store-logo">Store logo</label>
                      <input
                        id="settings-store-logo"
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const selectedFile = event.target.files?.[0] || null
                          setSettingsStoreLogoFile(selectedFile)
                        }}
                      />
                      {settingsStoreLogo && <p className="settings-file-note">Current uploaded store logo saved.</p>}

                      <label htmlFor="settings-store-banner">Store banner</label>
                      <input
                        id="settings-store-banner"
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const selectedFile = event.target.files?.[0] || null
                          setSettingsStoreBannerFile(selectedFile)
                        }}
                      />
                      {settingsStoreBanner && <p className="settings-file-note">Current uploaded store banner saved.</p>}

                      <label htmlFor="settings-store-name">Store name</label>
                      <input
                        id="settings-store-name"
                        type="text"
                        value={settingsStoreName}
                        onChange={(event) => setSettingsStoreName(event.target.value)}
                        placeholder="Collector's Corner"
                      />

                      <label htmlFor="settings-store-description">Store description</label>
                      <textarea
                        id="settings-store-description"
                        rows={3}
                        value={settingsStoreDescription}
                        onChange={(event) => setSettingsStoreDescription(event.target.value)}
                        placeholder="Describe your store and specialties"
                      />

                      <label htmlFor="settings-store-address">Store address</label>
                      <input
                        id="settings-store-address"
                        type="text"
                        value={settingsStoreAddress}
                        onChange={(event) => setSettingsStoreAddress(event.target.value)}
                        placeholder="Street, City, Province, Postal Code"
                      />

                      <label htmlFor="settings-store-hours">Business hours</label>
                      <textarea
                        id="settings-store-hours"
                        rows={3}
                        value={settingsStoreHours}
                        onChange={(event) => setSettingsStoreHours(event.target.value)}
                        placeholder="Mon-Fri 9:00 AM - 5:00 PM"
                      />

                      <p className="settings-subsection-title">Inventory settings</p>
                      <label className="settings-checkbox-row">
                        <input
                          type="checkbox"
                          checked={settingsInventoryAutoPublish}
                          onChange={(event) => setSettingsInventoryAutoPublish(event.target.checked)}
                        />
                        <span>Automatically publish new inventory</span>
                      </label>
                      <label className="settings-checkbox-row">
                        <input
                          type="checkbox"
                          checked={settingsInventoryAllowPurchaseRequests}
                          onChange={(event) => setSettingsInventoryAllowPurchaseRequests(event.target.checked)}
                        />
                        <span>Allow collection purchase requests</span>
                      </label>
                      <label className="settings-checkbox-row">
                        <input
                          type="checkbox"
                          checked={settingsInventoryEnableMarketplaceListings}
                          onChange={(event) => setSettingsInventoryEnableMarketplaceListings(event.target.checked)}
                        />
                        <span>Enable marketplace listings</span>
                      </label>
                      <label className="settings-checkbox-row">
                        <input
                          type="checkbox"
                          checked={settingsInventoryEnableEventCreation}
                          onChange={(event) => setSettingsInventoryEnableEventCreation(event.target.checked)}
                        />
                        <span>Enable event creation</span>
                      </label>
                      {hasStoreProAccess && (
                        <label className="settings-checkbox-row">
                          <input
                            type="checkbox"
                            checked={settingsInventoryTrackByLocation}
                            onChange={(event) => setSettingsInventoryTrackByLocation(event.target.checked)}
                          />
                          <span>Track inventory quantities by location</span>
                        </label>
                      )}

                      <label htmlFor="settings-store-visibility">Store visibility</label>
                      <select
                        id="settings-store-visibility"
                        value={settingsStoreVisibility}
                        onChange={(event) => setSettingsStoreVisibility(event.target.value)}
                      >
                        <option value="Public">Public</option>
                        <option value="Private">Private</option>
                        <option value="Hidden">Hidden</option>
                      </select>

                      <div className="settings-form-actions">
                        <button type="submit" className="auth-submit support-submit" disabled={isSavingSettings}>
                          {isSavingSettings ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </section>
                )}

                {activeSettingsTab === 'locations' && canAccessLocationsTab && (
                  <section className="settings-card settings-panel" role="tabpanel" aria-label="Locations settings">
                    <p className="settings-eyebrow">{tx('Locations')}</p>
                    <h2>{tx('Locations')}</h2>

                    <div className="settings-detail-list">
                      <div className="settings-detail-row">
                        <span>{tx('Current locations')}</span>
                        <strong>{storeLocations.length}</strong>
                      </div>
                    </div>

                    <div className="settings-form-actions">
                      <button type="button" className="auth-submit" onClick={handleOpenAddLocationModal}>
                        {tx('+ Add Location')}
                      </button>
                    </div>

                    {isLocationsLoading && <p className="settings-subsection-note">{tx('Loading locations...')}</p>}
                    {!isLocationsLoading && locationsError && <p className="auth-error inline-error">{locationsError}</p>}
                    {!isLocationsLoading && !locationsError && storeLocations.length === 0 && (
                      <p className="settings-subsection-note">{tx('No locations yet. Add your first location to get started.')}</p>
                    )}

                    {!isLocationsLoading && storeLocations.length > 0 && (
                      <div className="location-list">
                        {storeLocations.map((location) => (
                          <LocationCard
                            key={location.id}
                            location={location}
                            managerOptions={managerOptions}
                            employeeCount={storeEmployees.filter((employee) => employee.all_locations || employee.location_ids?.includes(location.id)).length}
                            onSave={handleSaveLocation}
                            onViewEmployees={() => setActiveSettingsTab('employees')}
                            onDeactivate={() => handleDeactivateLocation(location.id, location.status)}
                            translate={tx}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {activeSettingsTab === 'employees' && canAccessEmployeesTab && (
                  <section className="settings-card settings-panel" role="tabpanel" aria-label="Employees settings">
                    <p className="settings-eyebrow">{tx('Employees')}</p>
                    <h2>{tx('Employees')}</h2>

                    <div className="settings-detail-list">
                      <div className="settings-detail-row">
                        <span>{tx('Current employees')}</span>
                        <strong>{storeEmployees.length}</strong>
                      </div>
                    </div>

                    <div className="settings-form-actions">
                      <button type="button" className="auth-submit" onClick={handleOpenAddEmployeeModal}>
                        {tx('+ Add Employee')}
                      </button>
                    </div>

                    {createdEmployeeLoginInfo && (
                      <div className="settings-subsection-note" role="status" aria-live="polite">
                        <p className="m-0">{tx('Employee Created Successfully')}</p>
                        <p className="m-0">{tx('Store Code:')} {createdEmployeeLoginInfo.storeCode}</p>
                        <p className="m-0">{tx('Username')}: {createdEmployeeLoginInfo.username}</p>
                        <button type="button" className="auth-submit" onClick={handleCopyEmployeeLoginInfo}>
                          {tx('Copy Login Info')}
                        </button>
                      </div>
                    )}

                    {isEmployeesLoading && <p className="settings-subsection-note">{tx('Loading employees...')}</p>}
                    {!isEmployeesLoading && employeesError && <p className="auth-error inline-error">{employeesError}</p>}
                    {!isEmployeesLoading && !employeesError && storeEmployees.length === 0 && (
                      <p className="settings-subsection-note">{tx('No employees yet. Add your first employee to get started.')}</p>
                    )}

                    {!isEmployeesLoading && storeEmployees.length > 0 && (
                      <div className="employee-list">
                        {storeEmployees.map((employee) => (
                          <EmployeeCard
                            key={employee.id}
                            employee={{
                              ...employee,
                              location_names: employee.all_locations
                                ? ['All Locations']
                                : (employee.location_ids || [])
                                  .map((locationId) => locationsById[locationId]?.location_name)
                                  .filter(Boolean),
                            }}
                            permissionOptions={EMPLOYEE_PERMISSION_OPTIONS}
                            locationOptions={locationOptions}
                            isEditingPermissions={editingEmployeeId === employee.id}
                            editingPermissions={editingEmployeePermissions}
                            editingAllLocations={editingEmployeeAllLocations}
                            editingLocationIds={editingEmployeeLocationIds}
                            onEditPermissions={() => handleEditEmployeePermissions(employee)}
                            onTogglePermission={handleToggleEmployeePermission}
                            onToggleAllLocations={handleSetEditingEmployeeAllLocations}
                            onToggleLocationAccess={handleToggleEditingEmployeeLocation}
                            onSavePermissions={() => handleSaveEmployeePermissions(employee.id)}
                            onCancelPermissions={handleCancelEmployeePermissions}
                            onDeactivate={() => handleDeactivateEmployee(employee.id, employee.status)}
                            onRemove={() => handleRemoveEmployee(employee.id)}
                            translate={tx}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {activeSettingsTab === 'integrations' && canAccessIntegrationsTab && (
                  <section className="settings-card settings-panel" role="tabpanel" aria-label="Integrations settings">
                    <p className="settings-eyebrow">Integrations</p>
                    <h2>Integrations</h2>

                    <form className="auth-form settings-form" onSubmit={(event) => handleSaveLocalSettings(event, 'Integration settings saved.') }>
                      <label htmlFor="settings-pos-connections">POS connections</label>
                      <textarea
                        id="settings-pos-connections"
                        rows={2}
                        value={settingsPosConnections}
                        onChange={(event) => setSettingsPosConnections(event.target.value)}
                        placeholder="Square, Lightspeed, Shopify POS"
                      />

                      <label htmlFor="settings-api-keys">API keys</label>
                      <textarea
                        id="settings-api-keys"
                        rows={2}
                        value={settingsApiKeys}
                        onChange={(event) => setSettingsApiKeys(event.target.value)}
                        placeholder="Store and manage integration keys"
                      />

                      <label htmlFor="settings-webhook-settings">Webhook settings</label>
                      <textarea
                        id="settings-webhook-settings"
                        rows={2}
                        value={settingsWebhookSettings}
                        onChange={(event) => setSettingsWebhookSettings(event.target.value)}
                        placeholder="Webhook URLs and event subscriptions"
                      />

                      <label htmlFor="settings-connected-apps">Connected apps</label>
                      <textarea
                        id="settings-connected-apps"
                        rows={2}
                        value={settingsConnectedApps}
                        onChange={(event) => setSettingsConnectedApps(event.target.value)}
                        placeholder="Connected third-party apps"
                      />

                      <div className="settings-form-actions">
                        <button type="submit" className="auth-submit support-submit">Manage Integrations</button>
                      </div>
                    </form>
                  </section>
                )}

                {activeSettingsTab === 'imports' && isPlatformAdmin && (
                  <section className="settings-card settings-panel" role="tabpanel" aria-label="Data import settings">
                    <p className="settings-eyebrow">Imports</p>
                    <h2>Magic Data Import</h2>

                    <form className="auth-form settings-form" onSubmit={handleImportMagicCards}>
                      <label htmlFor="settings-magic-import-file">Scryfall file (.json or .gz)</label>
                      <input
                        id="settings-magic-import-file"
                        type="file"
                        accept=".json,.gz,application/json,application/gzip"
                        onChange={(event) => {
                          setMagicImportFile(event.target.files?.[0] || null)
                          setMagicImportError('')
                          setMagicImportSummary('')
                          setMagicImportProgress({ processed: 0, total: 0 })
                        }}
                      />

                      {magicImportFile && (
                        <p className="settings-file-note">
                          Selected: {magicImportFile.name}
                        </p>
                      )}

                      {magicImportProgress.total > 0 && (
                        <p className="settings-subsection-note">
                          Progress: {magicImportProgress.processed.toLocaleString()} / {magicImportProgress.total.toLocaleString()}
                        </p>
                      )}

                      {magicImportSummary && (
                        <p className="settings-subsection-note" role="status" aria-live="polite">
                          {magicImportSummary}
                        </p>
                      )}

                      {magicImportError && <p className="auth-error inline-error">{magicImportError}</p>}

                      <p className="settings-file-note">
                        This uploads rows into the magic_cards table. For very large files, prefer the CLI importer.
                      </p>

                      <div className="settings-form-actions">
                        <button type="submit" className="auth-submit support-submit" disabled={isImportingMagic || !magicImportFile}>
                          {isImportingMagic ? 'Importing...' : 'Import Magic File'}
                        </button>
                      </div>
                    </form>
                  </section>
                )}

                <AddEmployeeModal
                  isOpen={isAddEmployeeModalOpen}
                  firstName={newEmployeeFirstName}
                  lastName={newEmployeeLastName}
                  pin={newEmployeePin}
                  role={newEmployeeRole}
                  roleOptions={EMPLOYEE_ROLE_OPTIONS}
                  locationOptions={locationOptions}
                  allLocations={newEmployeeAllLocations}
                  selectedLocationIds={newEmployeeLocationIds}
                  isSubmitting={isCreatingEmployee}
                  errorMessage={employeesError}
                  onClose={handleCloseAddEmployeeModal}
                  onSubmit={handleCreateEmployee}
                  onFirstNameChange={setNewEmployeeFirstName}
                  onLastNameChange={setNewEmployeeLastName}
                  onPinChange={setNewEmployeePin}
                  onRoleChange={setNewEmployeeRole}
                  onAllLocationsChange={handleSetNewEmployeeAllLocations}
                  onToggleLocation={handleToggleNewEmployeeLocation}
                  translate={tx}
                />

                <AddLocationModal
                  isOpen={isAddLocationModalOpen}
                  locationName={newLocationName}
                  streetAddress={newLocationStreetAddress}
                  city={newLocationCity}
                  province={newLocationProvince}
                  postalCode={newLocationPostalCode}
                  phoneNumber={newLocationPhoneNumber}
                  managerEmployeeId={newLocationManagerEmployeeId}
                  managerOptions={managerOptions}
                  isSubmitting={isCreatingLocation}
                  errorMessage={locationsError}
                  onClose={handleCloseAddLocationModal}
                  onSubmit={handleCreateLocation}
                  onLocationNameChange={setNewLocationName}
                  onStreetAddressChange={setNewLocationStreetAddress}
                  onCityChange={setNewLocationCity}
                  onProvinceChange={setNewLocationProvince}
                  onPostalCodeChange={setNewLocationPostalCode}
                  onPhoneNumberChange={setNewLocationPhoneNumber}
                  onManagerEmployeeIdChange={setNewLocationManagerEmployeeId}
                  translate={tx}
                />
              </div>
            )}
          </section>
  )
}
