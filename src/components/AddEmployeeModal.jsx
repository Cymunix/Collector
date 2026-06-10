function AddEmployeeModal({
  isOpen,
  firstName,
  lastName,
  role,
  pin,
  roleOptions,
  locationOptions,
  allLocations,
  selectedLocationIds,
  isSubmitting,
  errorMessage,
  translate,
  onClose,
  onSubmit,
  onFirstNameChange,
  onLastNameChange,
  onRoleChange,
  onPinChange,
  onAllLocationsChange,
  onToggleLocation,
}) {
  if (!isOpen) {
    return null
  }

  const tx = typeof translate === 'function' ? translate : (value) => value

  return (
    <div className="auth-overlay" role="presentation">
      <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="add-employee-title">
        <button type="button" className="close-auth" aria-label={tx('Close add employee')} onClick={onClose}>
          x
        </button>
        <h3 id="add-employee-title">{tx('Add Employee')}</h3>
        <p>{tx('Create a linked employee account using Store Code, Username, and PIN.')}</p>

        {errorMessage && <p className="auth-error">{errorMessage}</p>}

        <form className="auth-form" onSubmit={onSubmit}>
          <label htmlFor="employee-first-name">{tx('First Name')}</label>
          <input
            id="employee-first-name"
            type="text"
            value={firstName}
            onChange={(event) => onFirstNameChange(event.target.value)}
            required
          />

          <label htmlFor="employee-last-name">{tx('Last Name')}</label>
          <input
            id="employee-last-name"
            type="text"
            value={lastName}
            onChange={(event) => onLastNameChange(event.target.value)}
            required
          />

          <label htmlFor="employee-pin">{tx('PIN')}</label>
          <input
            id="employee-pin"
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(event) => onPinChange(event.target.value)}
            minLength={4}
            required
          />

          <label htmlFor="employee-role">{tx('Role')}</label>
          <select
            id="employee-role"
            value={role}
            onChange={(event) => onRoleChange(event.target.value)}
          >
            {roleOptions.map((roleOption) => (
              <option key={roleOption} value={roleOption}>
                {tx(roleOption)}
              </option>
            ))}
          </select>

          {locationOptions.length > 0 && (
            <>
              <p className="settings-subsection-title">{tx('Location access')}</p>
              <label className="settings-checkbox-row">
                <input
                  type="checkbox"
                  checked={allLocations}
                  onChange={(event) => onAllLocationsChange(event.target.checked)}
                />
                <span>{tx('All Locations')}</span>
              </label>

              {!allLocations && locationOptions.map((locationOption) => (
                <label key={locationOption.id} className="settings-checkbox-row">
                  <input
                    type="checkbox"
                    checked={selectedLocationIds.includes(locationOption.id)}
                    onChange={() => onToggleLocation(locationOption.id)}
                  />
                  <span>{locationOption.name}</span>
                </label>
              ))}
            </>
          )}

          <div className="settings-form-actions">
            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? tx('Creating...') : tx('Create Employee')}
            </button>
            <button type="button" className="switch-auth" onClick={onClose} disabled={isSubmitting}>
              {tx('Cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddEmployeeModal
