import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/common/PageHeader'
import type { DonationFormData, FoodCategory, StorageCondition, Unit } from '../types'
import styles from './DonateFoodPage.module.css'

const FOOD_CATEGORIES: FoodCategory[] = [
  'Prepared Meals',
  'Fresh Produce',
  'Bakery & Bread',
  'Dairy & Eggs',
  'Canned & Packaged',
  'Beverages',
  'Frozen',
  'Other',
]

const STORAGE_CONDITIONS: StorageCondition[] = [
  'Room Temperature',
  'Refrigerated',
  'Frozen',
  'Keep Cool',
]

const UNITS: Unit[] = ['kg', 'lbs', 'portions', 'litres', 'items', 'boxes']

const emptyForm: DonationFormData = {
  foodName: '',
  category: '',
  quantity: '',
  unit: '',
  estimatedServings: '',
  preparationDate: '',
  availabilityUntil: '',
  storageCondition: '',
  location: '',
  additionalInfo: '',
}

export default function DonateFoodPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<DonationFormData>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof DonationFormData, string>>>({})

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof DonationFormData]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof DonationFormData, string>> = {}
    if (!form.foodName.trim()) newErrors.foodName = 'Food name is required.'
    if (!form.category) newErrors.category = 'Please select a category.'
    if (!form.quantity.trim()) newErrors.quantity = 'Quantity is required.'
    if (!form.unit) newErrors.unit = 'Please select a unit.'
    if (!form.estimatedServings.trim()) newErrors.estimatedServings = 'Estimated servings required.'
    if (!form.preparationDate) newErrors.preparationDate = 'Preparation date/time is required.'
    if (!form.availabilityUntil) newErrors.availabilityUntil = 'Availability time is required.'
    if (!form.storageCondition) newErrors.storageCondition = 'Please select a storage condition.'
    if (!form.location.trim()) newErrors.location = 'Location/area is required.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) {
      // Store form data in session for the analysis page to use
      sessionStorage.setItem('donationForm', JSON.stringify(form))
      navigate('/analysis')
    }
  }

  return (
    <div className="page-content">
      <div className="container">
        <PageHeader
          title="Donate Surplus Food"
          subtitle="Enter details about the surplus food you have available. The more information you provide, the better the AI can identify suitable community matches."
        />

        <div className="notice notice-warning mb-6">
          <span>⚠</span>
          <span>
            <strong>Food safety reminder:</strong> All redistribution decisions must be verified by a
            responsible person and follow applicable food safety requirements. The AI provides
            decision support only.
          </span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.formLayout}>
            {/* Left column */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionHeading}>Food Information</h2>

              <div className="form-group">
                <label htmlFor="foodName">Food name *</label>
                <input
                  type="text"
                  id="foodName"
                  name="foodName"
                  value={form.foodName}
                  onChange={handleChange}
                  placeholder="e.g. Vegetable Curry & Rice"
                  className={errors.foodName ? styles.inputError : ''}
                />
                {errors.foodName && <span className={styles.errorMsg}>{errors.foodName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="category">Food category *</label>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className={errors.category ? styles.inputError : ''}
                >
                  <option value="">Select a category…</option>
                  {FOOD_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.category && <span className={styles.errorMsg}>{errors.category}</span>}
              </div>

              <div className={styles.row}>
                <div className="form-group">
                  <label htmlFor="quantity">Quantity *</label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    placeholder="e.g. 25"
                    min="0"
                    className={errors.quantity ? styles.inputError : ''}
                  />
                  {errors.quantity && <span className={styles.errorMsg}>{errors.quantity}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="unit">Unit *</label>
                  <select
                    id="unit"
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    className={errors.unit ? styles.inputError : ''}
                  >
                    <option value="">Unit…</option>
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  {errors.unit && <span className={styles.errorMsg}>{errors.unit}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="estimatedServings">Estimated servings *</label>
                <input
                  type="number"
                  id="estimatedServings"
                  name="estimatedServings"
                  value={form.estimatedServings}
                  onChange={handleChange}
                  placeholder="e.g. 25"
                  min="0"
                  className={errors.estimatedServings ? styles.inputError : ''}
                />
                <span className="form-hint">Number of individual portions this food can provide.</span>
                {errors.estimatedServings && (
                  <span className={styles.errorMsg}>{errors.estimatedServings}</span>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionHeading}>Availability & Storage</h2>

              <div className="form-group">
                <label htmlFor="preparationDate">Preparation / packaging date & time *</label>
                <input
                  type="datetime-local"
                  id="preparationDate"
                  name="preparationDate"
                  value={form.preparationDate}
                  onChange={handleChange}
                  className={errors.preparationDate ? styles.inputError : ''}
                />
                {errors.preparationDate && (
                  <span className={styles.errorMsg}>{errors.preparationDate}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="availabilityUntil">Available until *</label>
                <input
                  type="datetime-local"
                  id="availabilityUntil"
                  name="availabilityUntil"
                  value={form.availabilityUntil}
                  onChange={handleChange}
                  className={errors.availabilityUntil ? styles.inputError : ''}
                />
                <span className="form-hint">When must the food be collected by?</span>
                {errors.availabilityUntil && (
                  <span className={styles.errorMsg}>{errors.availabilityUntil}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="storageCondition">Storage condition *</label>
                <select
                  id="storageCondition"
                  name="storageCondition"
                  value={form.storageCondition}
                  onChange={handleChange}
                  className={errors.storageCondition ? styles.inputError : ''}
                >
                  <option value="">Select storage condition…</option>
                  {STORAGE_CONDITIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.storageCondition && (
                  <span className={styles.errorMsg}>{errors.storageCondition}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="location">Location / area *</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Central District, North Quarter"
                  className={errors.location ? styles.inputError : ''}
                />
                <span className="form-hint">
                  General area only — no precise address required at this stage.
                </span>
                {errors.location && <span className={styles.errorMsg}>{errors.location}</span>}
              </div>
            </div>
          </div>

          {/* Additional info — full width */}
          <div className={`form-group ${styles.fullWidth}`}>
            <label htmlFor="additionalInfo">Additional information</label>
            <textarea
              id="additionalInfo"
              name="additionalInfo"
              value={form.additionalInfo}
              onChange={handleChange}
              placeholder="Allergen information, dietary suitability, packaging notes, collection instructions…"
              rows={4}
            />
            <span className="form-hint">
              Include allergen details, dietary suitability (vegetarian, halal, etc.), or any
              handling notes.
            </span>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className="btn btn-primary btn-lg">
              Analyse with AI
            </button>
            <span className={styles.formNote}>
              Review food information before submitting. The AI will generate advisory recommendations only.
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}
