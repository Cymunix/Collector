import React from 'react'

export default function ProfilePage({ scope }) {
  const {
    PROFILE_ACHIEVEMENTS,
    catalogCategories,
    currentUser,
    email,
    friendSearchLoading,
    friendSearchQuery,
    friendSearchResults,
    handleAcceptFriendRequest,
    handleDeclineFriendRequest,
    handleFriendSearch,
    handleOpenProfileItem,
    handleRemoveFriend,
    handleSendFriendRequest,
    isFriendSearchOpen,
    openAuth,
    profile,
    profileFriendRequests,
    profileFriends,
    profileIsLoading,
    profileMostValuable,
    profileRecentItems,
    profileSentToIds,
    profileStats,
    setFriendSearchQuery,
    setFriendSearchResults,
    setIsFriendSearchOpen
  } = scope
  return (
          <section className="profile-screen" aria-label="My Profile">
            {!currentUser || !profile ? (
              <div className="profile-empty-state">
                <p className="subtitle">Sign in to view your profile.</p>
                <button type="button" className="auth-submit" onClick={() => openAuth('signin')}>Log in</button>
              </div>
            ) : (
              <div className="profile-layout">
                {/* Hero banner */}
                <div className="profile-hero-banner" />

                {/* Identity card — overlaps banner */}
                <div className="profile-identity-card">
                  <div className="profile-avatar-outer">
                    {profile.avatar_url
                      ? <img src={profile.avatar_url} alt="avatar" className="profile-avatar" />
                      : <div className="profile-avatar profile-avatar--placeholder">{(profile.display_name || currentUser.email || '?')[0].toUpperCase()}</div>
                    }
                  </div>
                  <div className="profile-identity-body">
                    <div>
                      <h1 className="profile-username">{profile.display_name || currentUser.email?.split('@')[0] || 'Collector'}</h1>
                    </div>
                    <span className="profile-tier-pill">{profile.subscription_tier ? profile.subscription_tier.replace(/_/g, ' ') : 'Free Collector'}</span>
                  </div>
                </div>

                {profileIsLoading ? (
                  <div className="profile-loading">Loading stats…</div>
                ) : (
                  <>
                    {/* Stat cards row */}
                    {(() => {
                      const unlockedCount = profileStats ? PROFILE_ACHIEVEMENTS.filter(a => a.check(profileStats)).length : 0
                      return (
                        <div className="profile-stats-row">
                          {[
                            { value: profileStats?.totalItems?.toLocaleString() ?? '—', label: 'Total Copies' },
                            { value: profileStats?.uniqueItems?.toLocaleString() ?? '—', label: 'Unique Items' },
                            { value: profileStats?.totalValue != null ? `$${profileStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—', label: 'Est. Value' },
                            { value: `${unlockedCount} / ${PROFILE_ACHIEVEMENTS.length}`, label: 'Achievements' },
                          ].map(({ value, label }) => (
                            <div key={label} className="profile-stat-card">
                              <span className="profile-stat-number">{value}</span>
                              <span className="profile-stat-label">{label}</span>
                            </div>
                          ))}
                        </div>
                      )
                    })()}

                    {/* Friends */}
                    <div className="profile-panel">
                      <div className="profile-panel-header">
                        <h2 className="profile-panel-title">Friends{profileFriends.length > 0 ? ` (${profileFriends.length})` : ''}</h2>
                        <button
                          type="button"
                          className="profile-friend-find-btn"
                          onClick={() => { setIsFriendSearchOpen(s => !s); setFriendSearchQuery(''); setFriendSearchResults([]) }}
                        >
                          {isFriendSearchOpen ? 'Cancel' : 'Find Friends'}
                        </button>
                      </div>

                      {/* Incoming requests */}
                      {profileFriendRequests.length > 0 && (
                        <div className="profile-friend-requests">
                          <p className="profile-friend-requests-label">{profileFriendRequests.length} pending {profileFriendRequests.length === 1 ? 'request' : 'requests'}</p>
                          {profileFriendRequests.map(req => (
                            <div key={req.friendshipId} className="profile-friend-request-row">
                              <div className="profile-friend-avatar profile-friend-avatar--sm">
                                {req.avatar_url ? <img src={req.avatar_url} alt="" /> : <span>{(req.display_name || '?')[0].toUpperCase()}</span>}
                              </div>
                              <span className="profile-friend-name">{req.display_name || 'Unknown'}</span>
                              <button type="button" className="profile-friend-action-btn profile-friend-action-btn--accept" onClick={() => handleAcceptFriendRequest(req)}>Accept</button>
                              <button type="button" className="profile-friend-action-btn profile-friend-action-btn--decline" onClick={() => handleDeclineFriendRequest(req.friendshipId)}>Decline</button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Find Friends search */}
                      {isFriendSearchOpen && (
                        <div className="profile-friend-search">
                          <input
                            type="text"
                            className="profile-friend-search-input"
                            placeholder="Search by display name…"
                            value={friendSearchQuery}
                            onChange={e => handleFriendSearch(e.target.value)}
                            autoFocus
                          />
                          {friendSearchLoading && <p className="profile-friend-search-hint">Searching…</p>}
                          {!friendSearchLoading && friendSearchQuery && friendSearchResults.length === 0 && (
                            <p className="profile-friend-search-hint">No users found.</p>
                          )}
                          {friendSearchResults.map(user => {
                            const alreadyFriend = profileFriends.some(f => f.userId === user.id)
                            const sent = profileSentToIds.has(user.id) || user._sent
                            const incoming = profileFriendRequests.some(r => r.userId === user.id)
                            return (
                              <div key={user.id} className="profile-friend-result-row">
                                <div className="profile-friend-avatar profile-friend-avatar--sm">
                                  {user.avatar_url ? <img src={user.avatar_url} alt="" /> : <span>{(user.display_name || '?')[0].toUpperCase()}</span>}
                                </div>
                                <span className="profile-friend-name">{user.display_name || 'Unknown'}</span>
                                {alreadyFriend ? (
                                  <span className="profile-friend-status">Friends</span>
                                ) : incoming ? (
                                  <span className="profile-friend-status">Requested you</span>
                                ) : sent ? (
                                  <span className="profile-friend-status">Request sent</span>
                                ) : (
                                  <button type="button" className="profile-friend-action-btn profile-friend-action-btn--add" onClick={() => handleSendFriendRequest(user.id)}>Add Friend</button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Friends grid */}
                      {profileFriends.length > 0 ? (
                        <div className="profile-friends-grid">
                          {profileFriends.map(friend => (
                            <div key={friend.friendshipId} className="profile-friend-card">
                              <div className="profile-friend-avatar">
                                {friend.avatar_url ? <img src={friend.avatar_url} alt="" /> : <span>{(friend.display_name || '?')[0].toUpperCase()}</span>}
                              </div>
                              <p className="profile-friend-card-name">{friend.display_name || 'Unknown'}</p>
                              <button type="button" className="profile-friend-remove-btn" title="Remove friend" onClick={() => handleRemoveFriend(friend.friendshipId, friend.userId)}>✕</button>
                            </div>
                          ))}
                        </div>
                      ) : !isFriendSearchOpen && profileFriendRequests.length === 0 && (
                        <p className="profile-friend-empty">No friends yet. Click Find Friends to connect with other collectors.</p>
                      )}
                    </div>

                    {/* Recently added */}
                    {profileRecentItems.length > 0 && (
                      <div className="profile-panel">
                        <h2 className="profile-panel-title">Recently Added</h2>
                        <div className="profile-recent-grid">
                          {profileRecentItems.map((item, i) => {
                            const imgUrl = item.front_image_path
                              ? (item.front_image_path.startsWith('http')
                                  ? item.front_image_path
                                  : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/item-images/${item.front_image_path}`)
                              : null
                            const label = [item.subject, item.print_type, item.card_number ? `#${item.card_number}` : null].filter(Boolean).join(' — ') || item.collectible_set || 'Item'
                            return (
                              <button key={`${item.item_id}-${i}`} type="button" className="profile-recent-card profile-recent-card--btn" onClick={() => handleOpenProfileItem(item)}>
                                <div className="profile-recent-img-wrap">
                                  {imgUrl
                                    ? <img src={imgUrl} alt={label} className="profile-recent-img" />
                                    : <div className="profile-recent-img-placeholder" />
                                  }
                                </div>
                                <p className="profile-recent-label">{label}</p>
                                {item.created_at && <p className="profile-recent-date">{new Date(item.created_at).toLocaleDateString()}</p>}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Most Valuable */}
                    {profileMostValuable.length > 0 && (
                      <div className="profile-panel">
                        <h2 className="profile-panel-title">Most Valuable</h2>
                        <div className="profile-recent-grid">
                          {profileMostValuable.map((item, i) => {
                            const imgUrl = item.front_image_path
                              ? (item.front_image_path.startsWith('http')
                                  ? item.front_image_path
                                  : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/item-images/${item.front_image_path}`)
                              : null
                            const label = [item.subject, item.print_type, item.card_number ? `#${item.card_number}` : null].filter(Boolean).join(' — ') || item.collectible_set || 'Item'
                            return (
                              <button key={`mv-${item.item_id}-${i}`} type="button" className="profile-recent-card profile-recent-card--btn" onClick={() => handleOpenProfileItem(item)}>
                                <div className="profile-recent-img-wrap">
                                  {imgUrl
                                    ? <img src={imgUrl} alt={label} className="profile-recent-img" />
                                    : <div className="profile-recent-img-placeholder" />
                                  }
                                </div>
                                <p className="profile-recent-label">{label}</p>
                                <p className="profile-recent-date profile-recent-value">${item.purchase_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Category breakdown */}
                    {profileStats?.categoryBreakdown?.length > 0 && (
                      <div className="profile-panel">
                        <h2 className="profile-panel-title">Collection by Category</h2>
                        <div className="profile-category-list">
                          {profileStats.categoryBreakdown.map(([catId, count]) => {
                            const catName = catalogCategories.find(c => c.id === catId)?.name || 'Unknown'
                            const pct = Math.round((count / (profileStats.uniqueItems || 1)) * 100)
                            return (
                              <div key={catId} className="profile-category-row">
                                <span className="profile-category-name">{catName}</span>
                                <div className="profile-category-track">
                                  <div className="profile-category-fill" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="profile-category-count">{count.toLocaleString()}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Achievements */}
                    {(() => {
                      const groups = [...new Set(PROFILE_ACHIEVEMENTS.map(a => a.group))]
                      const totalUnlocked = profileStats ? PROFILE_ACHIEVEMENTS.filter(a => a.check(profileStats)).length : 0
                      return (
                        <div className="profile-panel">
                          <div className="profile-panel-header">
                            <h2 className="profile-panel-title">Achievements</h2>
                            <span className="profile-achievements-count">{totalUnlocked} / {PROFILE_ACHIEVEMENTS.length} unlocked</span>
                          </div>
                          {groups.map(group => {
                            const list = PROFILE_ACHIEVEMENTS.filter(a => a.group === group)
                            const groupUnlocked = profileStats ? list.filter(a => a.check(profileStats)).length : 0
                            return (
                              <div key={group} className="profile-ach-group">
                                <div className="profile-ach-group-header">
                                  <span className="profile-ach-group-name">{group}</span>
                                  <span className="profile-ach-group-count">{groupUnlocked}/{list.length}</span>
                                </div>
                                <div className="profile-ach-grid">
                                  {list.map(ach => {
                                    const unlocked = profileStats ? ach.check(profileStats) : false
                                    return (
                                      <div
                                        key={ach.id}
                                        className={`profile-ach-card profile-ach-card--${ach.rarity}${unlocked ? ' profile-ach-card--on' : ''}`}
                                        title={ach.desc}
                                      >
                                        <div className="profile-ach-icon">{unlocked ? ach.icon : '🔒'}</div>
                                        <div className="profile-ach-name">{ach.name}</div>
                                        <div className="profile-ach-desc">{ach.desc}</div>
                                        {unlocked && <div className={`profile-ach-rarity profile-ach-rarity--${ach.rarity}`}>{ach.rarity}</div>}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </>
                )}
              </div>
            )}
          </section>
  )
}
