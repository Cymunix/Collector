class Admin {
  constructor(profile, employeePermissions = {}) {
    this.profile = profile || null
    this.employeePermissions = employeePermissions || {}
  }

  isPlatformAdmin() {
    return this.profile?.subscription_tier === 'platform_admin'
  }

  isStoreOwnerTier() {
    if (this.isPlatformAdmin()) {
      return true
    }

    const tier = this.profile?.subscription_tier
    return tier === 'store' || tier === 'store_pro'
  }

  canAccessStoreTab() {
    return this.isStoreOwnerTier() || Boolean(this.employeePermissions.store_settings)
  }

  canAccessLocationsTab() {
    return this.isPlatformAdmin() || this.profile?.subscription_tier === 'store_pro'
  }

  canAccessEmployeesTab() {
    return this.canAccessStoreTab() && (this.isStoreOwnerTier() || Boolean(this.employeePermissions.employee_management))
  }

  canAccessIntegrationsTab() {
    return this.isPlatformAdmin() || this.profile?.subscription_tier === 'store_pro' || Boolean(this.employeePermissions.billing_access)
  }

  canManageCatalogFranchises() {
    return this.isStoreOwnerTier() || Boolean(this.employeePermissions.store_settings)
  }
}

export default Admin
