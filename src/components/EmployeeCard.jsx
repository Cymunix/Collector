const formatEmployeeName = (employee) => {
  const first = employee.first_name || ''
  const last = employee.last_name || ''
  const fullName = `${first} ${last}`.trim()
  return fullName || employee.email || 'Employee'
}

function EmployeeCard({
  employee,
  permissionOptions,
  locationOptions,
  translate,
  isEditingPermissions,
  editingPermissions,
  editingAllLocations,
  editingLocationIds,
  onEditPermissions,
  onTogglePermission,
  onToggleAllLocations,
  onToggleLocationAccess,
  onSavePermissions,
  onCancelPermissions,
  onDeactivate,
  onRemove,
}) {
  const tx = typeof translate === 'function' ? translate : (value) => value

  return (
    <article className="employee-card">
      <div className="employee-card-head">
        <div>
          <p className="employee-name">{formatEmployeeName(employee)}</p>
          <p className="employee-meta">{tx(employee.role)}</p>
          <p className="employee-meta">{tx('Username')}: {employee.username || tx('Not generated')}</p>
          <p className="employee-meta">
            {tx('Location access')}: {(employee.location_names || []).join(', ') || tx('None assigned')}
          </p>
        </div>
        <span className={`employee-status employee-status-${employee.status || 'invited'}`}>
          {tx(employee.status || 'invited')}
        </span>
      </div>

      <div className="employee-actions">
        <button type="button" className="auth-submit" onClick={onEditPermissions}>
          {tx('Edit Permissions')}
        </button>
        <button type="button" className="back-home-btn" onClick={onDeactivate}>
          {employee.status === 'inactive' ? tx('Activate') : tx('Deactivate')}
        </button>
        <button type="button" className="back-home-btn" onClick={onRemove}>
          {tx('Remove')}
        </button>
      </div>

      {isEditingPermissions && (
        <div className="employee-permissions-editor">
          <p className="settings-subsection-title">{tx('Permissions')}</p>
          <div className="employee-permissions-grid">
            {permissionOptions.map((option) => (
              <label key={option.key} className="settings-checkbox-row">
                <input
                  type="checkbox"
                  checked={Boolean(editingPermissions[option.key])}
                  onChange={() => onTogglePermission(option.key)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          <p className="settings-subsection-title">{tx('Location access')}</p>
          <div className="employee-permissions-grid">
            <label className="settings-checkbox-row">
              <input
                type="checkbox"
                checked={editingAllLocations}
                onChange={(event) => onToggleAllLocations(event.target.checked)}
              />
              <span>{tx('All Locations')}</span>
            </label>

            {!editingAllLocations && locationOptions.map((locationOption) => (
              <label key={locationOption.id} className="settings-checkbox-row">
                <input
                  type="checkbox"
                  checked={editingLocationIds.includes(locationOption.id)}
                  onChange={() => onToggleLocationAccess(locationOption.id)}
                />
                <span>{locationOption.name}</span>
              </label>
            ))}
          </div>

          <div className="settings-form-actions">
            <button type="button" className="auth-submit" onClick={onSavePermissions}>
              {tx('Save Permissions')}
            </button>
            <button type="button" className="back-home-btn" onClick={onCancelPermissions}>
              {tx('Cancel')}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

export default EmployeeCard
