import { useEffect, useState } from 'react'

const buildLocationAddress = (location) => {
  const parts = [
    location.street_address,
    location.city,
    location.province,
    location.postal_code,
  ].filter(Boolean)

  return parts.join(', ') || 'Address not set'
}

function LocationCard({
  location,
  managerOptions,
  employeeCount,
  onSave,
  onViewEmployees,
  onDeactivate,
  translate,
}) {
  const tx = typeof translate === 'function' ? translate : (value) => value
  const [isEditing, setIsEditing] = useState(false)
  const [locationName, setLocationName] = useState(location.location_name || '')
  const [streetAddress, setStreetAddress] = useState(location.street_address || '')
  const [city, setCity] = useState(location.city || '')
  const [province, setProvince] = useState(location.province || '')
  const [postalCode, setPostalCode] = useState(location.postal_code || '')
  const [phoneNumber, setPhoneNumber] = useState(location.phone_number || '')
  const [managerEmployeeId, setManagerEmployeeId] = useState(location.manager_employee_id || '')

  useEffect(() => {
    setLocationName(location.location_name || '')
    setStreetAddress(location.street_address || '')
    setCity(location.city || '')
    setProvince(location.province || '')
    setPostalCode(location.postal_code || '')
    setPhoneNumber(location.phone_number || '')
    setManagerEmployeeId(location.manager_employee_id || '')
  }, [location])

  const assignedManager = managerOptions.find((manager) => manager.id === location.manager_employee_id)

  const handleSave = async () => {
    const didSave = await onSave(location.id, {
      location_name: locationName,
      street_address: streetAddress,
      city,
      province,
      postal_code: postalCode,
      phone_number: phoneNumber,
      manager_employee_id: managerEmployeeId,
    })

    if (didSave) {
      setIsEditing(false)
    }
  }

  return (
    <article className="location-card">
      <div className="location-card-head">
        <div>
          <p className="employee-name">{location.location_name}</p>
          <p className="employee-meta">{tx(buildLocationAddress(location))}</p>
          <p className="employee-meta">{tx('Assigned manager')}: {assignedManager?.name || tx('Unassigned')}</p>
          <p className="employee-meta">{tx('Employee count')}: {employeeCount}</p>
        </div>
        <span className={`employee-status employee-status-${location.status || 'active'}`}>
          {tx(location.status || 'active')}
        </span>
      </div>

      {isEditing && (
        <div className="employee-permissions-editor">
          <div className="employee-permissions-grid">
            <label>
              <span>{tx('Location Name')}</span>
              <input type="text" value={locationName} onChange={(event) => setLocationName(event.target.value)} />
            </label>
            <label>
              <span>{tx('Street Address')}</span>
              <input type="text" value={streetAddress} onChange={(event) => setStreetAddress(event.target.value)} />
            </label>
            <label>
              <span>{tx('City')}</span>
              <input type="text" value={city} onChange={(event) => setCity(event.target.value)} />
            </label>
            <label>
              <span>{tx('Province/State')}</span>
              <input type="text" value={province} onChange={(event) => setProvince(event.target.value)} />
            </label>
            <label>
              <span>{tx('Postal Code')}</span>
              <input type="text" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} />
            </label>
            <label>
              <span>{tx('Phone Number')}</span>
              <input type="text" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
            </label>
            <label>
              <span>{tx('Assigned Manager')}</span>
              <select value={managerEmployeeId} onChange={(event) => setManagerEmployeeId(event.target.value)}>
                <option value="">{tx('Unassigned')}</option>
                {managerOptions.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      <div className="employee-actions">
        {!isEditing ? (
          <button type="button" className="auth-submit" onClick={() => setIsEditing(true)}>
            {tx('Edit')}
          </button>
        ) : (
          <button type="button" className="auth-submit" onClick={handleSave}>
            {tx('Save')}
          </button>
        )}
        <button type="button" className="back-home-btn" onClick={onViewEmployees}>
          {tx('View Employees')}
        </button>
        {!isEditing ? (
          <button type="button" className="back-home-btn" onClick={onDeactivate}>
            {location.status === 'inactive' ? tx('Activate') : tx('Deactivate')}
          </button>
        ) : (
          <button type="button" className="back-home-btn" onClick={() => setIsEditing(false)}>
            {tx('Cancel')}
          </button>
        )}
      </div>
    </article>
  )
}

export default LocationCard
