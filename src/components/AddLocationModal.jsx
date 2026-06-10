function AddLocationModal({
  isOpen,
  locationName,
  streetAddress,
  city,
  province,
  postalCode,
  phoneNumber,
  managerEmployeeId,
  managerOptions,
  isSubmitting,
  errorMessage,
  translate,
  onClose,
  onSubmit,
  onLocationNameChange,
  onStreetAddressChange,
  onCityChange,
  onProvinceChange,
  onPostalCodeChange,
  onPhoneNumberChange,
  onManagerEmployeeIdChange,
}) {
  if (!isOpen) {
    return null
  }

  const tx = typeof translate === 'function' ? translate : (value) => value

  return (
    <div className="auth-overlay" role="presentation">
      <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="add-location-title">
        <button type="button" className="close-auth" aria-label={tx('Close add location')} onClick={onClose}>
          x
        </button>
        <h3 id="add-location-title">{tx('Add Location')}</h3>
        <p>{tx('Create a new store location for your business.')}</p>

        {errorMessage && <p className="auth-error">{errorMessage}</p>}

        <form className="auth-form" onSubmit={onSubmit}>
          <label htmlFor="location-name">{tx('Location Name')}</label>
          <input id="location-name" type="text" value={locationName} onChange={(event) => onLocationNameChange(event.target.value)} required />

          <label htmlFor="location-street-address">{tx('Street Address')}</label>
          <input id="location-street-address" type="text" value={streetAddress} onChange={(event) => onStreetAddressChange(event.target.value)} />

          <label htmlFor="location-city">{tx('City')}</label>
          <input id="location-city" type="text" value={city} onChange={(event) => onCityChange(event.target.value)} />

          <label htmlFor="location-province">{tx('Province/State')}</label>
          <input id="location-province" type="text" value={province} onChange={(event) => onProvinceChange(event.target.value)} />

          <label htmlFor="location-postal-code">{tx('Postal Code')}</label>
          <input id="location-postal-code" type="text" value={postalCode} onChange={(event) => onPostalCodeChange(event.target.value)} />

          <label htmlFor="location-phone">{tx('Phone Number')}</label>
          <input id="location-phone" type="text" value={phoneNumber} onChange={(event) => onPhoneNumberChange(event.target.value)} />

          <label htmlFor="location-manager">{tx('Manager (optional)')}</label>
          <select id="location-manager" value={managerEmployeeId} onChange={(event) => onManagerEmployeeIdChange(event.target.value)}>
            <option value="">{tx('Unassigned')}</option>
            {managerOptions.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
          </select>

          <div className="settings-form-actions">
            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? tx('Creating...') : tx('Create Location')}
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

export default AddLocationModal
