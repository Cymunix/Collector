import { useEffect, useRef, useState } from 'react'
import './App.css'
import { supabase } from './lib/supabaseClient'
import Admin from './lib/Admin'
import SubscriptionCard from './components/SubscriptionCard'
import EmployeeCard from './components/EmployeeCard'
import AddEmployeeModal from './components/AddEmployeeModal'
import LocationCard from './components/LocationCard'
import AddLocationModal from './components/AddLocationModal'
import QRCode from 'qrcode'
import StorePOSDashboard from './components/StorePOSDashboard'
import CatalogAdminPanel from './components/CatalogAdminPanel'

const DEFAULT_HOME_SECTIONS = ['Events Near You', 'Trending Items', 'Sales Near You']

const COLLECTOR_PLUS_HOME_SECTION_OPTIONS = [
  'Events Near You',
  'Trending Items',
  'Sales Near You',
  'Collection Value Trends',
  'Your Trending Items',
  'Wishlist Alerts',
  'Portfolio Insights',
  'Recommended For You',
  'Recent Collection Activity',
]

const EVENT_ORGANIZER_HOME_SECTION_OPTIONS = ['Upcoming Events', 'Event Registrations', 'Event Analytics']

const EMPLOYEE_ROLE_OPTIONS = ['Owner', 'Manager', 'Cashier', 'Inventory Staff', 'Custom']
const INTERNAL_EMPLOYEE_EMAIL_DOMAIN = 'gmail.com'

const LANGUAGE_OPTIONS = [
  { value: 'English', code: 'EN' },
  { value: 'French', code: 'FR' },
  { value: 'Spanish', code: 'ES' },
]

const DELIVERY_RECENTS_STORAGE_KEY = 'collectorshub-delivery-recent-v1'
const MAX_ACCEPTED_GEO_ACCURACY_METERS = 2500
const NOMINATIM_SEARCH_LIMIT = 5
const LOCATION_AUTOCOMPLETE_MIN_CHARS = 2
const LOCATION_AUTOCOMPLETE_FETCH_LIMIT = 20
const LOCATION_AUTOCOMPLETE_DISPLAY_LIMIT = 6
const LOCATION_AUTOCOMPLETE_DEBOUNCE_MS = 300
const LOCATION_COUNTRY_CODES = 'ca,us'
const CATALOG_PAGE_SIZE = 25
const COLLECTION_OVERVIEW_PAGE_SIZE = 25
const DEFAULT_USER_COLLECTION_NAME = 'My Collection'
const COLLECTION_ACQUISITION_TYPES = [
  { value: 'direct', label: 'Direct purchase' },
  { value: 'gift', label: 'Gift' },
  { value: 'box_set', label: 'Part of box set' },
]
const COLLECTION_ACQUISITION_TYPE_LABELS = COLLECTION_ACQUISITION_TYPES.reduce((accumulator, option) => {
  accumulator[option.value] = option.label
  return accumulator
}, {})
const ALLOWED_SETTLEMENT_TYPES = new Set([
  'city',
  'town',
  'village',
  'hamlet',
  'municipality',
  'borough',
  'administrative',
])
const CATALOG_CATEGORY_OPTIONS = [
  'Trading Cards',
  'Sports Cards',
  'Comics',
  'Music',
  'Movies',
  'Building Blocks',
  'Video Games',
]
const CATALOG_SUBCATEGORY_OPTIONS = {
  'Trading Cards': ['Pokemon', 'Yu-Gi-Oh!', 'Magic: The Gathering', 'One Piece', 'Digimon'],
  'Sports Cards': ['Hockey', 'Basketball', 'Baseball', 'Football', 'Soccer', 'UFC'],
  Comics: ['Marvel', 'DC', 'Manga', 'Indie'],
  Music: ['Vinyl', 'CDs', 'Cassette Tapes'],
  Movies: ['Blu-ray', 'DVD', 'VHS', 'Steelbooks'],
  'Building Blocks': ['LEGO', 'Mega Construx', 'Minifigures'],
  'Video Games': ['PlayStation', 'Xbox', 'Nintendo', 'PC', 'Retro'],
}
const CARD_CONDITION_CATEGORIES = new Set(['Trading Cards', 'Sports Cards'])

// ─── Grading Company Registry ────────────────────────────────────────────────
const GRADING_COMPANIES = [
  {
    id: 'PSA',
    name: 'Professional Sports Authenticator',
    shortName: 'PSA',
    primaryColor: '#c8102e',
    secondaryColor: '#ffffff',
    accentColor: '#8b0000',
  },
  {
    id: 'BGS',
    name: 'Beckett Grading Services',
    shortName: 'BGS',
    primaryColor: '#002d62',
    secondaryColor: '#c8a951',
    accentColor: '#c8a951',
  },
  {
    id: 'CGC',
    name: 'Certified Guaranty Company',
    shortName: 'CGC',
    primaryColor: '#1a5c9a',
    secondaryColor: '#e8c84f',
    accentColor: '#e8c84f',
  },
  {
    id: 'TAG',
    name: 'TAG Grading',
    shortName: 'TAG',
    primaryColor: '#1a1a1a',
    secondaryColor: '#d4af37',
    accentColor: '#d4af37',
  },
]

// ─── Grading Scales by Company ────────────────────────────────────────────────
const GRADING_SCALES = {
  PSA: [
    { value: '10',       label: 'PSA 10 GEM-MT',          shortLabel: 'GEM-MT',   prestigeScore: 100, description: 'Virtually perfect in every way. Sharp corners, crisp focus, full original gloss. No print spots or stains.' },
    { value: '9',        label: 'PSA 9 MINT',             shortLabel: 'MINT',     prestigeScore: 92,  description: 'Only one of the following defects allowed: a slight wax stain on reverse, one fuzzy corner, or slight off-white cardboard.' },
    { value: '8.5',      label: 'PSA 8.5 NM-MT+',        shortLabel: 'NM-MT+',   prestigeScore: 87,  description: 'Half-grade between NM-MT and MINT.' },
    { value: '8',        label: 'PSA 8 NM-MT',            shortLabel: 'NM-MT',    prestigeScore: 83,  description: 'One corner with slight fuzziness allowed. Focus may be slightly off-center. Gloss may be slightly lacking.' },
    { value: '7.5',      label: 'PSA 7.5 NM+',           shortLabel: 'NM+',      prestigeScore: 77,  description: 'Half-grade between NM and NM-MT.' },
    { value: '7',        label: 'PSA 7 NM',               shortLabel: 'NM',       prestigeScore: 72,  description: 'Some rounding of corners allowed. Slight scuffing or light scratches visible only under close inspection.' },
    { value: '6.5',      label: 'PSA 6.5 EX-MT+',        shortLabel: 'EX-MT+',   prestigeScore: 66,  description: 'Half-grade between EX-MT and NM.' },
    { value: '6',        label: 'PSA 6 EX-MT',            shortLabel: 'EX-MT',    prestigeScore: 61,  description: 'Corners have slight fuzziness and some evidence of slight damage on edges. Gloss lost on a few spots.' },
    { value: '5.5',      label: 'PSA 5.5 EX+',           shortLabel: 'EX+',      prestigeScore: 55,  description: 'Half-grade between EX and EX-MT.' },
    { value: '5',        label: 'PSA 5 EX',               shortLabel: 'EX',       prestigeScore: 50,  description: 'Surface has moderate loss of original gloss. Corners well rounded. May have some light surface wear.' },
    { value: '4.5',      label: 'PSA 4.5 VG-EX+',        shortLabel: 'VG-EX+',   prestigeScore: 44,  description: 'Half-grade between VG-EX and EX.' },
    { value: '4',        label: 'PSA 4 VG-EX',            shortLabel: 'VG-EX',    prestigeScore: 39,  description: 'Corners have moderate wear. Surface has moderate loss of original gloss.' },
    { value: '3.5',      label: 'PSA 3.5 VG+',           shortLabel: 'VG+',      prestigeScore: 33,  description: 'Half-grade between VG and VG-EX.' },
    { value: '3',        label: 'PSA 3 VG',               shortLabel: 'VG',       prestigeScore: 28,  description: 'Rounded corners, some scratches visible. Gloss largely absent from the surface.' },
    { value: '2.5',      label: 'PSA 2.5 GOOD+',         shortLabel: 'GOOD+',    prestigeScore: 22,  description: 'Half-grade between GOOD and VG.' },
    { value: '2',        label: 'PSA 2 GOOD',             shortLabel: 'GOOD',     prestigeScore: 17,  description: 'Heavily worn. May have creases, scuffs, or tape marks visible from both sides.' },
    { value: '1.5',      label: 'PSA 1.5 FR',             shortLabel: 'FR',       prestigeScore: 11,  description: 'Card is heavily damaged but still largely intact. Major defects present throughout.' },
    { value: '1',        label: 'PSA 1 PR',               shortLabel: 'PR',       prestigeScore: 6,   description: 'Badly damaged card. Barely identifiable as a card. Heavy creases, stains, tears, tape marks.' },
    { value: 'AUTH',     label: 'PSA AUTHENTIC',          shortLabel: 'AUTH',     prestigeScore: 3,   description: 'Confirmed authentic but has been altered in some way that prevents numerical grading.' },
    { value: 'ALT-AUTH', label: 'PSA ALTERED AUTHENTIC',  shortLabel: 'ALT-AUTH', prestigeScore: 1,   description: 'Card has been altered. Authenticity confirmed but condition has been manipulated.' },
  ],
  BGS: [
    { value: 'BL',   label: 'BGS 10 BLACK LABEL', shortLabel: 'BLACK LABEL', prestigeScore: 100, description: 'The highest honour in Beckett grading — all four sub-grades must be a perfect 10. Extremely rare.' },
    { value: '10',   label: 'BGS 10 PRISTINE',    shortLabel: 'PRISTINE',    prestigeScore: 97,  description: 'All four sub-grades are 10 or one subgrade is 9.5. Near-perfect card with flawless surface, centering, corners, and edges.' },
    { value: '9.5',  label: 'BGS 9.5 GEM MINT',   shortLabel: 'GEM MINT',    prestigeScore: 92,  description: 'Gem Mint — near-perfect with exceptional eye appeal. Only minor printing imperfections allowed.' },
    { value: '9',    label: 'BGS 9 MINT',          shortLabel: 'MINT',        prestigeScore: 85,  description: 'Mint condition with only minor imperfections visible under close inspection.' },
    { value: '8.5',  label: 'BGS 8.5 NM-MT+',     shortLabel: 'NM-MT+',      prestigeScore: 80,  description: 'Half-grade between NM-MT and Mint.' },
    { value: '8',    label: 'BGS 8 NM-MT',         shortLabel: 'NM-MT',       prestigeScore: 75,  description: 'Near Mint to Mint — one minor defect allowed.' },
    { value: '7.5',  label: 'BGS 7.5 NM+',         shortLabel: 'NM+',         prestigeScore: 70,  description: 'Half-grade between NM and NM-MT.' },
    { value: '7',    label: 'BGS 7 NM',             shortLabel: 'NM',          prestigeScore: 65,  description: 'Near Mint — slightly rounded corners or minor surface imperfections.' },
    { value: '6.5',  label: 'BGS 6.5 EX-MT+',      shortLabel: 'EX-MT+',      prestigeScore: 59,  description: 'Half-grade between EX-MT and NM.' },
    { value: '6',    label: 'BGS 6 EX-MT',          shortLabel: 'EX-MT',       prestigeScore: 53,  description: 'Excellent to Mint — moderate wear with minor surface loss.' },
    { value: '5.5',  label: 'BGS 5.5 EX+',          shortLabel: 'EX+',         prestigeScore: 47,  description: 'Half-grade between EX and EX-MT.' },
    { value: '5',    label: 'BGS 5 EX',              shortLabel: 'EX',          prestigeScore: 41,  description: 'Excellent — moderate loss of original gloss, well-rounded corners.' },
    { value: '4.5',  label: 'BGS 4.5 VG-EX+',       shortLabel: 'VG-EX+',      prestigeScore: 36,  description: 'Half-grade between VG-EX and EX.' },
    { value: '4',    label: 'BGS 4 VG-EX',           shortLabel: 'VG-EX',       prestigeScore: 31,  description: 'Very Good to Excellent — moderate wear on corners and surface.' },
    { value: '3.5',  label: 'BGS 3.5 VG+',           shortLabel: 'VG+',         prestigeScore: 26,  description: 'Half-grade between VG and VG-EX.' },
    { value: '3',    label: 'BGS 3 VG',               shortLabel: 'VG',          prestigeScore: 21,  description: 'Very Good — rounded corners, scratches, largely absent gloss.' },
    { value: '2.5',  label: 'BGS 2.5 GOOD+',         shortLabel: 'GOOD+',       prestigeScore: 17,  description: 'Half-grade between GOOD and VG.' },
    { value: '2',    label: 'BGS 2 GOOD',             shortLabel: 'GOOD',        prestigeScore: 13,  description: 'Good — heavily worn. May have creases, scuffs, or tape marks.' },
    { value: '1.5',  label: 'BGS 1.5 FAIR',           shortLabel: 'FAIR',        prestigeScore: 8,   description: 'Fair — heavily damaged but intact. Major defects present throughout.' },
    { value: '1',    label: 'BGS 1 POOR',              shortLabel: 'POOR',        prestigeScore: 4,   description: 'Poor — badly damaged, barely identifiable as a card.' },
    { value: 'AUTH', label: 'BGS AUTHENTIC',           shortLabel: 'AUTH',        prestigeScore: 3,   description: 'Confirmed authentic but altered in a way preventing numerical grading.' },
    { value: 'ALT',  label: 'BGS ALTERED',             shortLabel: 'ALTERED',     prestigeScore: 1,   description: 'Card has been intentionally altered. Authenticity confirmed but manipulated.' },
  ],
  CGC: [
    { value: '10',  label: 'CGC 10 Pristine',   shortLabel: 'PRISTINE',  prestigeScore: 100, description: 'A virtually perfect card.' },
    { value: '9.5', label: 'CGC 9.5 Gem Mint',  shortLabel: 'GEM MINT',  prestigeScore: 92,  description: 'Nearly perfect; extremely minor printing defects allowed.' },
    { value: '9',   label: 'CGC 9 Mint',         shortLabel: 'MINT',      prestigeScore: 83,  description: 'Very well preserved with only minor imperfections.' },
    { value: '8.5', label: 'CGC 8.5 NM-MT',      shortLabel: 'NM-MT',     prestigeScore: 75,  description: 'Near Mint to Mint condition.' },
    { value: '8',   label: 'CGC 8 NM',           shortLabel: 'NM',        prestigeScore: 67,  description: 'Near Mint condition.' },
    { value: '7',   label: 'CGC 7 Fine/NM',      shortLabel: 'FN/NM',     prestigeScore: 58,  description: 'Fine to Near Mint.' },
    { value: '6',   label: 'CGC 6 Fine',          shortLabel: 'FINE',      prestigeScore: 50,  description: 'Fine condition.' },
    { value: '5',   label: 'CGC 5 Very Fine',     shortLabel: 'VF',        prestigeScore: 42,  description: 'Very Fine condition.' },
    { value: '4',   label: 'CGC 4 Very Good',     shortLabel: 'VG',        prestigeScore: 33,  description: 'Very Good condition.' },
    { value: '3',   label: 'CGC 3 Good',          shortLabel: 'GOOD',      prestigeScore: 25,  description: 'Good condition.' },
    { value: '2',   label: 'CGC 2 Fair',          shortLabel: 'FAIR',      prestigeScore: 17,  description: 'Fair condition — heavy wear.' },
    { value: '1.5', label: 'CGC 1.5 Fair/Poor',   shortLabel: 'FR/PR',     prestigeScore: 11,  description: 'Fair to Poor.' },
    { value: '1',   label: 'CGC 1 Poor',          shortLabel: 'POOR',      prestigeScore: 6,   description: 'Poor condition.' },
  ],
  TAG: [
    { value: '10',  label: 'TAG 10 PRISTINE',    shortLabel: 'PRISTINE',  scoreRange: '990–1000', scoreDisplay: '1000', precisionScore: 1000, prestigeScore: 100, description: 'Virtually flawless. Exceptional scan consistency and top-tier score bands.' },
    { value: '10g', label: 'TAG 10 GEM MINT',    shortLabel: 'GEM MINT',   scoreRange: '950–989',  scoreDisplay: '987',  precisionScore: 987,  prestigeScore: 97,  description: 'Gem Mint with elite eye appeal and minimal detectable variance.' },
    { value: '9',   label: 'TAG 9 MINT',         shortLabel: 'MINT',       scoreRange: '900–949',  scoreDisplay: '945',  precisionScore: 945,  prestigeScore: 90,  description: 'Mint with strong overall presentation and limited edge variance.' },
    { value: '8.5', label: 'TAG 8.5 NM MT+',     shortLabel: 'NM MT+',     scoreRange: '850–899',  scoreDisplay: '889',  precisionScore: 889,  prestigeScore: 84,  description: 'Near Mint to Mint Plus.' },
    { value: '8',   label: 'TAG 8 NM MT',        shortLabel: 'NM MT',      scoreRange: '800–849',  scoreDisplay: '843',  precisionScore: 843,  prestigeScore: 78,  description: 'Near Mint to Mint.' },
    { value: '7.5', label: 'TAG 7.5 NM+',        shortLabel: 'NM+',        scoreRange: '750–799',  scoreDisplay: '795',  precisionScore: 795,  prestigeScore: 72,  description: 'Near Mint Plus.' },
    { value: '7',   label: 'TAG 7 NM',           shortLabel: 'NM',         scoreRange: '700–749',  scoreDisplay: '748',  precisionScore: 748,  prestigeScore: 66,  description: 'Near Mint.' },
    { value: '6.5', label: 'TAG 6.5 EX MT+',     shortLabel: 'EX MT+',     scoreRange: '650–699',  scoreDisplay: '698',  precisionScore: 698,  prestigeScore: 60,  description: 'Excellent to Mint Plus.' },
    { value: '6',   label: 'TAG 6 EX MT',        shortLabel: 'EX MT',      scoreRange: '600–649',  scoreDisplay: '649',  precisionScore: 649,  prestigeScore: 54,  description: 'Excellent to Mint.' },
    { value: '5.5', label: 'TAG 5.5 EX+',        shortLabel: 'EX+',        scoreRange: '550–599',  scoreDisplay: '597',  precisionScore: 597,  prestigeScore: 48,  description: 'Excellent Plus.' },
    { value: '5',   label: 'TAG 5 EX',           shortLabel: 'EX',         scoreRange: '500–549',  scoreDisplay: '548',  precisionScore: 548,  prestigeScore: 42,  description: 'Excellent.' },
    { value: '4.5', label: 'TAG 4.5 VG EX+',     shortLabel: 'VG EX+',     scoreRange: '450–499',  scoreDisplay: '495',  precisionScore: 495,  prestigeScore: 36,  description: 'Very Good to Excellent Plus.' },
    { value: '4',   label: 'TAG 4 VG EX',        shortLabel: 'VG EX',      scoreRange: '400–449',  scoreDisplay: '448',  precisionScore: 448,  prestigeScore: 30,  description: 'Very Good to Excellent.' },
    { value: '3.5', label: 'TAG 3.5 VG+',        shortLabel: 'VG+',        scoreRange: '350–399',  scoreDisplay: '395',  precisionScore: 395,  prestigeScore: 24,  description: 'Very Good Plus.' },
    { value: '3',   label: 'TAG 3 VG',           shortLabel: 'VG',         scoreRange: '300–349',  scoreDisplay: '348',  precisionScore: 348,  prestigeScore: 18,  description: 'Very Good.' },
    { value: '2.5', label: 'TAG 2.5 GOOD+',      shortLabel: 'GOOD+',      scoreRange: '250–299',  scoreDisplay: '295',  precisionScore: 295,  prestigeScore: 12,  description: 'Good Plus.' },
    { value: '2',   label: 'TAG 2 GOOD',         shortLabel: 'GOOD',       scoreRange: '200–249',  scoreDisplay: '248',  precisionScore: 248,  prestigeScore: 10,  description: 'Good.' },
    { value: '1.5', label: 'TAG 1.5 FAIR',       shortLabel: 'FAIR',       scoreRange: '150–199',  scoreDisplay: '198',  precisionScore: 198,  prestigeScore: 6,   description: 'Fair.' },
    { value: '1',   label: 'TAG 1 POOR',         shortLabel: 'POOR',       scoreRange: '100–149',  scoreDisplay: '148',  precisionScore: 148,  prestigeScore: 3,   description: 'Poor.' },
  ],
}

// Ungraded condition scale — only used when NOT using a grading company
const CARD_CONDITION_SCALE = [
  '10 Pristine',
  '9.5 Gem Mint',
  '9 Mint',
  '8 Near Mint/Mint',
  '7 Near Mint',
  '6 Excellent Mint',
  '5 Excellent',
  '4 Very Good/Excellent',
  '3 Very Good',
  '2 Good',
  '1 Poor',
]

const GRADING_COMPANY_OPTIONS = GRADING_COMPANIES.map((c) => c.shortName)

const BGS_SUBGRADE_OPTIONS = ['10', '9.5', '9', '8.5', '8', '7.5', '7', '6.5', '6', '5.5', '5', '4.5', '4', '3.5', '3', '2.5', '2', '1.5', '1']
const BGS_SUBGRADE_FIELDS = [
  { key: 'centering', label: 'Centering' },
  { key: 'corners',   label: 'Corners'   },
  { key: 'edges',     label: 'Edges'     },
  { key: 'surface',   label: 'Surface'   },
]
const DEFAULT_BGS_SUBGRADES = { centering: '', corners: '', edges: '', surface: '' }

const getGradingCompany = (shortName) => GRADING_COMPANIES.find((c) => c.id === shortName) || null

const getGradePrestigeScore = (companyId, gradeValue) => {
  const scale = GRADING_SCALES[companyId] || []
  const grade = scale.find((g) => g.value === gradeValue)
  return grade ? grade.prestigeScore : 0
}

const getTAGGradeByScore = (scoreInput) => {
  const score = Number(scoreInput)
  if (!Number.isFinite(score)) {
    return null
  }

  return (GRADING_SCALES.TAG || []).find((grade) => {
    const [minText, maxText] = (grade.scoreRange || '').split('–')
    const min = Number(minText)
    const max = Number(maxText)
    return Number.isFinite(min) && Number.isFinite(max) && score >= min && score <= max
  }) || null
}

const normalizeCertificateNumber = (value) => (value || '').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '')

const normalizeTagCert = (value) => normalizeCertificateNumber(value)

const tagCertsLikelyMatch = (leftValue, rightValue) => {
  const left = normalizeTagCert(leftValue)
  const right = normalizeTagCert(rightValue)
  return Boolean(left && right && left === right)
}

const normalizeGradingCompany = (value) => {
  const normalized = (value || '').toString().trim().toUpperCase()
  if (!normalized) {
    return ''
  }

  if (['PSA', 'PROFESSIONAL SPORTS AUTHENTICATOR'].includes(normalized)) {
    return 'PSA'
  }
  if (['BGS', 'BECKETT', 'BECKETT GRADING SERVICES'].includes(normalized)) {
    return 'BGS'
  }
  if (['CGC', 'CERTIFIED GUARANTY COMPANY'].includes(normalized)) {
    return 'CGC'
  }
  if (['TAG', 'TAG GRADING'].includes(normalized)) {
    return 'TAG'
  }

  return normalized
}

const normalizeNullableNonNegativeNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numericValue = Number(value)
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null
}

const normalizeNullablePositiveInteger = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue < 1) {
    return null
  }

  return Math.floor(numericValue)
}

const CATALOG_MINIFIG_CATEGORIES = new Set(['Building Blocks'])

const CATALOG_DYNAMIC_FIELD_DEFINITIONS = {
  'Trading Cards': [
    { key: 'set', label: 'Set', type: 'text' },
    { key: 'card_number', label: 'Card Number', type: 'text' },
    { key: 'rarity', label: 'Rarity', type: 'text' },
    { key: 'first_edition', label: 'First Edition', type: 'boolean' },
    { key: 'language', label: 'Language', type: 'text' },
    { key: 'hp', label: 'HP', type: 'number' },
    { key: 'card_type', label: 'Type', type: 'text' },
    { key: 'evolution', label: 'Evolution', type: 'text' },
    // Illustrator is handled via the people credits section
  ],
  'Sports Cards': [
    { key: 'athlete', label: 'Athlete', type: 'text' },
    { key: 'team', label: 'Team', type: 'text' },
    { key: 'season', label: 'Season', type: 'text' },
    { key: 'rookie_card', label: 'Rookie Card', type: 'boolean' },
    { key: 'autograph', label: 'Autograph', type: 'boolean' },
    { key: 'patch_relic', label: 'Patch / Relic', type: 'boolean' },
    { key: 'language', label: 'Language', type: 'text' },
  ],
  Comics: [
    { key: 'issue_number', label: 'Issue Number', type: 'text' },
    { key: 'volume', label: 'Volume', type: 'text' },
    { key: 'publisher', label: 'Publisher', type: 'text' },
    { key: 'variant_cover', label: 'Variant Cover', type: 'boolean' },
    { key: 'ratio_variant', label: 'Ratio Variant', type: 'text' },
    // Writer, Artist, Cover Artist handled via people credits section
  ],
  'Video Games': [
    { key: 'platform', label: 'Platform', type: 'text' },
    { key: 'publisher', label: 'Publisher', type: 'text' },
    { key: 'developer', label: 'Developer', type: 'text' },
    { key: 'region', label: 'Region', type: 'text' },
    { key: 'physical_digital', label: 'Physical/Digital', type: 'text' },
    { key: 'edition', label: 'Edition', type: 'text' },
    { key: 'steelbook', label: 'Steelbook', type: 'boolean' },
    { key: 'cartridge_disc', label: 'Cartridge/Disc', type: 'text' },
    { key: 'condition', label: 'Condition', type: 'text' },
  ],
  Music: [
    { key: 'format', label: 'Format', type: 'text' },
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'catalogue_number', label: 'Catalogue Number', type: 'text' },
    { key: 'pressing', label: 'Pressing', type: 'text' },
    { key: 'colour_variant', label: 'Colour Variant', type: 'text' },
    { key: 'rpm', label: 'RPM', type: 'number' },
    { key: 'limited_edition', label: 'Limited Edition', type: 'boolean' },
    // Artist handled via people credits section
  ],
  Movies: [
    { key: 'format', label: 'Format', type: 'text' },
    { key: 'studio', label: 'Studio', type: 'text' },
    { key: 'region_code', label: 'Region Code', type: 'text' },
    { key: 'steelbook', label: 'Steelbook', type: 'boolean' },
    { key: 'slipcover', label: 'Slipcover', type: 'boolean' },
    { key: 'edition', label: 'Edition', type: 'text' },
    { key: 'runtime_minutes', label: 'Runtime (minutes)', type: 'number' },
    // Director(s) and Actor(s) handled via people credits section
  ],
  'Building Blocks': [
    { key: 'set_number', label: 'Set Number', type: 'text' },
    { key: 'piece_count', label: 'Piece Count', type: 'number' },
    { key: 'retired', label: 'Retired', type: 'boolean' },
    { key: 'theme', label: 'Theme', type: 'text' },
    { key: 'sealed_open', label: 'Sealed/Open', type: 'text' },
    // Brand handled via brand selector; minifigures via minifig section
  ],
}

const CATALOG_PEOPLE_ROLES_BY_CATEGORY = {
  'Trading Cards': ['Artist', 'Illustrator', 'Writer'],
  'Sports Cards': ['Photographer', 'Artist'],
  Comics: ['Writer', 'Penciler', 'Inker', 'Colorist', 'Letterer', 'Cover Artist', 'Editor'],
  Music: ['Performer', 'Writer', 'Producer', 'Composer'],
  Movies: ['Director', 'Actor', 'Producer', 'Writer'],
  'Building Blocks': ['Designer', 'Builder', 'Minifigure Designer'],
  'Video Games': ['Developer', 'Publisher', 'Designer', 'Artist'],
}

const buildCatalogDynamicDefaults = (categoryName) => {
  const definitions = CATALOG_DYNAMIC_FIELD_DEFINITIONS[categoryName] || []
  return definitions.reduce((accumulator, field) => {
    accumulator[field.key] = field.type === 'boolean' ? false : ''
    return accumulator
  }, {})
}

const buildCatalogVariantRow = () => ({
  name: '',
  sku: '',
  identifier: '',
  condition: '',
})

const buildCatalogPeopleRow = (role = '') => ({ name: '', role, notes: '' })

const buildCatalogMinifigRow = () => ({ name: '', quantity: '1', identifier: '', theme: '' })

const buildDefaultCatalogPeopleRows = (categoryName) => {
  const roles = CATALOG_PEOPLE_ROLES_BY_CATEGORY[categoryName] || []
  return roles.length > 0 ? [buildCatalogPeopleRow(roles[0])] : []
}

const formatStoreDeliveryLocation = (location) => {
  const name = (location.location_name || '').trim()
  const city = (location.city || '').trim()
  const province = (location.province || '').trim()
  const postalCode = (location.postal_code || '').trim()
  const geoSuffix = [city, province || postalCode].filter(Boolean).join(', ')

  if (name && geoSuffix) {
    return `${name} - ${geoSuffix}`
  }

  if (name) {
    return name
  }

  return [city, province, postalCode].filter(Boolean).join(' ').trim()
}

const buildSearchAreaLabel = (address, fallback) => {
  if (!address) {
    return fallback
  }

  const locality =
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.municipality ||
    address.county ||
    ''
  const region = address.state || address.province || ''
  const country = (address.country_code || '').toUpperCase()
  const compact = [locality, region].filter(Boolean).join(', ')

  if (compact) {
    return country ? `${compact} (${country})` : compact
  }

  return fallback
}

const scoreSearchAreaResult = (result, normalizedQuery) => {
  const address = result?.address || {}
  const displayName = (result?.display_name || '').toLowerCase()
  const className = (result?.class || '').toLowerCase()
  const typeName = (result?.type || '').toLowerCase()
  const locality =
    (address.city || address.town || address.village || address.hamlet || address.municipality || '').toLowerCase()
  const state = (address.state || address.province || '').toLowerCase()
  const countryCode = (address.country_code || '').toLowerCase()

  let score = 0

  if (locality && locality === normalizedQuery) {
    score += 150
  } else if (locality && locality.startsWith(normalizedQuery)) {
    score += 110
  } else if (displayName.startsWith(normalizedQuery)) {
    score += 80
  } else if (displayName.includes(normalizedQuery)) {
    score += 60
  }

  if (countryCode === 'ca' || countryCode === 'us') {
    score += 25
  }

  if (normalizedQuery === 'halifax' && state.includes('nova scotia')) {
    score += 250
  }

  if (typeName === 'city' || typeName === 'administrative') {
    score += 20
  }

  if (className === 'boundary' || className === 'place') {
    score += 10
  }

  return score
}

const isSupportedSettlementResult = (result) => {
  const address = result?.address || {}
  const countryCode = (address.country_code || '').toLowerCase()
  const typeName = (result?.type || '').toLowerCase()
  const className = (result?.class || '').toLowerCase()
  const addresstype = (result?.addresstype || '').toLowerCase()
  const hasLocality = Boolean(
    address.city || address.town || address.village || address.hamlet || address.municipality,
  )

  if (countryCode !== 'ca' && countryCode !== 'us') {
    return false
  }

  if (!hasLocality) {
    return false
  }

  const isSettlementType = ALLOWED_SETTLEMENT_TYPES.has(typeName)
  const isPlaceClass = className === 'place'
  const isAdministrativeBoundary = className === 'boundary' && addresstype === 'city'

  return isSettlementType || isPlaceClass || isAdministrativeBoundary
}

const mapSearchResultToAreaContext = (result, fallbackLabel) => {
  const lat = Number(result?.lat)
  const lon = Number(result?.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null
  }

  const boundingBoxValues = Array.isArray(result?.boundingbox)
    ? result.boundingbox.map((value) => Number(value))
    : []

  const hasBoundingBox =
    boundingBoxValues.length === 4 && boundingBoxValues.every((value) => Number.isFinite(value))

  return {
    label: buildSearchAreaLabel(result?.address, result?.display_name || fallbackLabel || ''),
    latitude: lat,
    longitude: lon,
    boundingBox: hasBoundingBox
      ? {
          south: boundingBoxValues[0],
          north: boundingBoxValues[1],
          west: boundingBoxValues[2],
          east: boundingBoxValues[3],
        }
      : null,
    source: 'geocoded',
  }
}

const resolveSearchArea = async (rawQuery) => {
  const normalizedQuery = (rawQuery || '').trim().toLowerCase()
  if (!normalizedQuery) {
    return null
  }

  const candidateQueries =
    normalizedQuery === 'halifax'
      ? ['Halifax, Nova Scotia, Canada', 'Halifax, NS, Canada', 'Halifax, Canada']
      : [rawQuery]

  for (const query of candidateQueries) {
    const requestUrl =
      `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=${LOCATION_COUNTRY_CODES}&limit=${NOMINATIM_SEARCH_LIMIT}&q=${encodeURIComponent(query)}`
    const response = await fetch(requestUrl)
    if (!response.ok) {
      continue
    }

    const payload = await response.json()
    if (!Array.isArray(payload) || payload.length === 0) {
      continue
    }

    const rankedResults = payload
      .filter((result) => isSupportedSettlementResult(result))
      .map((result) => ({ result, score: scoreSearchAreaResult(result, normalizedQuery) }))
      .sort((left, right) => right.score - left.score)

    const bestResult = rankedResults[0]?.result
    if (!bestResult) {
      continue
    }

    const resolvedArea = mapSearchResultToAreaContext(bestResult, query)
    if (resolvedArea) {
      return resolvedArea
    }
  }

  return null
}

const UI_COPY = {
  English: {
    deliveringTo: 'Search Area',
    setLocation: 'Set Location',
    useCurrentLocation: 'Use Current Location',
    detectingLocation: 'Detecting current location...',
    resolvingArea: 'Confirming search area...',
    locationDetectFailed: 'Could not detect your location right now.',
    locationLowAccuracy: 'Detected location was too broad. Try again or enter your location manually.',
    locationResolveFailed: 'Could not confirm that area. Try a more specific place name.',
    areaAutocompleteLoading: 'Finding matching areas...',
    areaAutocompleteNoMatch: 'No matching areas found yet.',
    addLocationPlaceholder: 'Add city or town',
    addLocationAction: 'Add',
    noKnownLocations: 'No known locations yet. Add one or use current location.',
    searchPlaceholder: 'Search for Collectables...',
    manageSubscription: 'Manage Subscription',
    myProfile: 'My Profile',
    myListings: 'My Listings',
    settings: 'Settings',
    logOut: 'Log out',
    storePosLogin: 'Store POS Login',
    startCollecting: 'Start Collecting',
    cart: 'Cart',
    myCollection: 'My Collection',
    catalog: 'Catalog',
    stores: 'Stores',
    wishlist: 'Wishlist',
    sales: 'Sales',
    events: 'Events',
    tagline: 'Track, Value, and Trade Your Collectibles',
    greetingMorning: 'Good Morning',
    greetingAfternoon: 'Good Afternoon',
    greetingEvening: 'Good Evening',
    languageSelectorAria: 'Language selector',
    catalogPageTitle: 'Catalog',
    catalogPageSubtitle: 'Browse items across all categories. Use the left filters to narrow results.',
    filtersLabel: 'Filters',
    clearAction: 'Clear',
    loadingFilters: 'Loading filters...',
    categoryLabel: 'Category',
    subcategoryLabel: 'Subcategory',
    selectCategoryFirst: 'Select category first',
    franchiseLabel: 'Franchise',
    minYearLabel: 'Min Year',
    maxYearLabel: 'Max Year',
    sortLabel: 'Sort',
    sortNewestYear: 'Newest (year)',
    suggestItemAction: 'Suggest Item',
    mySuggestionsAction: 'My Suggestions',
    refreshAction: 'Refresh',
    contextTitle: 'Context',
    contextHint: 'Pick a franchise to see details, counts, and description.',
    loadingCatalog: 'Loading catalogue...',
    adminCreateItem: 'Admin: Create Item',
    itemNameLabel: 'Item name',
    releaseYearLabel: 'Release year',
    descriptionLabel: 'Description',
    itemImageJpegLabel: 'Item JPEG',
    identifierLabel: 'Barcode / Identifier',
    statusLabel: 'Status',
    statusDraft: 'Draft',
    statusPublished: 'Published',
    dynamicFieldsLabel: 'Category Details',
    variantsLabel: 'Variants',
    addVariantAction: '+ Add Variant',
    variantNameLabel: 'Variant name',
    variantSkuLabel: 'Variant SKU',
    variantIdentifierLabel: 'Variant Identifier',
    variantConditionLabel: 'Variant Condition',
    removeVariantAction: 'Remove Variant',
    jpegOnlyError: 'Please upload a JPEG file (.jpg or .jpeg).',
    createItemAction: 'Create Item',
    addItemAction: 'Add Item',
    creatingItemAction: 'Creating...',
    selectCategoryFirstAdmin: 'Select category first',
    selectSubcategoryFirstAdmin: 'Select subcategory first',
    selectFranchiseFirstAdmin: 'Select franchise first',
    adminItemCreated: 'Catalog item created.',
    adminItemCreatedVariantWarning: 'Catalog item created, but variants could not be saved.',
    adminItemCreatedPeopleWarning: 'Catalog item created, but credits could not be saved.',
    adminItemCreatedMinifigWarning: 'Catalog item created, but minifigures could not be saved.',
    adminItemCreateFailed: 'Could not create catalog item right now.',
    brandLabel: 'Brand',
    noBrandOption: '— No brand —',
    newBrandNamePlaceholder: 'New brand name…',
    createBrandInlineAction: '＋ Create new brand',
    newFranchiseNamePlaceholder: 'New franchise name…',
    createFranchiseInlineAction: '＋ Create new franchise',
    saveAction: 'Save',
    cancelAction: 'Cancel',
    peopleCreditsLabel: 'Credits',
    personNamePlaceholder: 'Name…',
    addPersonAction: '＋ Add person',
    removePersonAction: 'Remove person',
    minifigsLabel: 'Minifigures',
    minifigNamePlaceholder: 'Minifig name…',
    minifigIdentifierPlaceholder: 'ID e.g. sw0001',
    addMinifigAction: '＋ Add minifig',
    removeMinifigAction: 'Remove minifig',
  },
  French: {
    deliveringTo: 'Zone de recherche',
    setLocation: 'Definir la localisation',
    useCurrentLocation: 'Utiliser la localisation actuelle',
    detectingLocation: 'Detection de la localisation en cours...',
    resolvingArea: 'Confirmation de la zone de recherche...',
    locationDetectFailed: 'Impossible de detecter votre localisation pour le moment.',
    locationLowAccuracy: 'La localisation detectee est trop imprecise. Reessayez ou saisissez-la manuellement.',
    locationResolveFailed: 'Impossible de confirmer cette zone. Essayez un lieu plus precis.',
    areaAutocompleteLoading: 'Recherche de zones correspondantes...',
    areaAutocompleteNoMatch: 'Aucune zone correspondante pour le moment.',
    addLocationPlaceholder: 'Ajouter une ville',
    addLocationAction: 'Ajouter',
    noKnownLocations: 'Aucune localisation connue. Ajoutez-en une ou utilisez la localisation actuelle.',
    searchPlaceholder: 'Rechercher des objets de collection...',
    manageSubscription: "Gerer l'abonnement",
    myProfile: 'Mon profil',
    myListings: 'Mes annonces',
    settings: 'Parametres',
    logOut: 'Se deconnecter',
    storePosLogin: 'Connexion PDV magasin',
    startCollecting: 'Commencer la collection',
    cart: 'Panier',
    myCollection: 'Ma collection',
    catalog: 'Catalogue',
    stores: 'Magasins',
    wishlist: 'Liste de souhaits',
    sales: 'Ventes',
    events: 'Evenements',
    tagline: 'Suivez, evaluez et echangez vos objets de collection',
    greetingMorning: 'Bonjour',
    greetingAfternoon: 'Bon apres-midi',
    greetingEvening: 'Bonsoir',
    languageSelectorAria: 'Selection de langue',
    catalogPageTitle: 'Catalogue',
    catalogPageSubtitle: 'Parcourez les articles de toutes les categories. Utilisez les filtres a gauche pour affiner les resultats.',
    filtersLabel: 'Filtres',
    clearAction: 'Effacer',
    loadingFilters: 'Chargement des filtres...',
    categoryLabel: 'Categorie',
    subcategoryLabel: 'Sous-categorie',
    selectCategoryFirst: 'Selectionnez d abord une categorie',
    franchiseLabel: 'Franchise',
    minYearLabel: 'Annee min',
    maxYearLabel: 'Annee max',
    sortLabel: 'Trier',
    sortNewestYear: 'Plus recent (annee)',
    suggestItemAction: 'Suggerez un article',
    mySuggestionsAction: 'Mes suggestions',
    refreshAction: 'Actualiser',
    contextTitle: 'Contexte',
    contextHint: 'Choisissez une franchise pour voir les details, les comptes et la description.',
    loadingCatalog: 'Chargement du catalogue...',
    adminCreateItem: 'Admin : Creer un article',
    itemNameLabel: 'Nom de l article',
    releaseYearLabel: 'Annee de sortie',
    descriptionLabel: 'Description',
    itemImageJpegLabel: 'JPEG de l article',
    identifierLabel: 'Code-barres / Identifiant',
    statusLabel: 'Statut',
    statusDraft: 'Brouillon',
    statusPublished: 'Publie',
    dynamicFieldsLabel: 'Details de categorie',
    variantsLabel: 'Variantes',
    addVariantAction: '+ Ajouter une variante',
    variantNameLabel: 'Nom de la variante',
    variantSkuLabel: 'SKU de variante',
    variantIdentifierLabel: 'Identifiant de variante',
    variantConditionLabel: 'Etat de la variante',
    removeVariantAction: 'Retirer la variante',
    jpegOnlyError: 'Veuillez televerser un fichier JPEG (.jpg ou .jpeg).',
    createItemAction: 'Creer l article',
    addItemAction: 'Ajouter un article',
    creatingItemAction: 'Creation...',
    selectCategoryFirstAdmin: 'Selectionnez d abord une categorie',
    selectSubcategoryFirstAdmin: 'Selectionnez d abord une sous-categorie',
    selectFranchiseFirstAdmin: 'Selectionnez d abord une franchise',
    adminItemCreated: 'Article du catalogue cree.',
    adminItemCreatedVariantWarning: 'Article cree, mais les variantes n ont pas pu etre enregistrees.',
    adminItemCreatedPeopleWarning: 'Article cree, mais les credits n ont pas pu etre enregistres.',
    adminItemCreatedMinifigWarning: 'Article cree, mais les figurines n ont pas pu etre enregistrees.',
    adminItemCreateFailed: 'Impossible de creer l article du catalogue pour le moment.',
    brandLabel: 'Marque',
    noBrandOption: '— Sans marque —',
    newBrandNamePlaceholder: 'Nom de la nouvelle marque…',
    createBrandInlineAction: '＋ Creer une marque',
    newFranchiseNamePlaceholder: 'Nom de la nouvelle franchise…',
    createFranchiseInlineAction: '＋ Creer une franchise',
    saveAction: 'Sauvegarder',
    cancelAction: 'Annuler',
    peopleCreditsLabel: 'Credits',
    personNamePlaceholder: 'Nom…',
    addPersonAction: '＋ Ajouter une personne',
    removePersonAction: 'Supprimer la personne',
    minifigsLabel: 'Figurines',
    minifigNamePlaceholder: 'Nom de la figurine…',
    minifigIdentifierPlaceholder: 'ID ex. sw0001',
    addMinifigAction: '＋ Ajouter une figurine',
    removeMinifigAction: 'Supprimer la figurine',
  },
  Spanish: {
    deliveringTo: 'Area de busqueda',
    setLocation: 'Definir ubicacion',
    useCurrentLocation: 'Usar ubicacion actual',
    detectingLocation: 'Detectando ubicacion actual...',
    resolvingArea: 'Confirmando area de busqueda...',
    locationDetectFailed: 'No se pudo detectar tu ubicacion en este momento.',
    locationLowAccuracy: 'La ubicacion detectada es demasiado imprecisa. Intenta de nuevo o ingresala manualmente.',
    locationResolveFailed: 'No se pudo confirmar esa area. Intenta con un lugar mas especifico.',
    areaAutocompleteLoading: 'Buscando areas coincidentes...',
    areaAutocompleteNoMatch: 'Aun no hay areas coincidentes.',
    addLocationPlaceholder: 'Agregar ciudad o pueblo',
    addLocationAction: 'Agregar',
    noKnownLocations: 'Aun no hay ubicaciones conocidas. Agrega una o usa ubicacion actual.',
    searchPlaceholder: 'Buscar coleccionables...',
    manageSubscription: 'Gestionar suscripcion',
    myProfile: 'Mi perfil',
    myListings: 'Mis publicaciones',
    settings: 'Configuracion',
    logOut: 'Cerrar sesion',
    storePosLogin: 'Inicio POS de tienda',
    startCollecting: 'Comenzar a coleccionar',
    cart: 'Carrito',
    myCollection: 'Mi coleccion',
    catalog: 'Catalogo',
    stores: 'Tiendas',
    wishlist: 'Lista de deseos',
    sales: 'Ventas',
    events: 'Eventos',
    tagline: 'Sigue, valora e intercambia tus coleccionables',
    greetingMorning: 'Buenos dias',
    greetingAfternoon: 'Buenas tardes',
    greetingEvening: 'Buenas noches',
    languageSelectorAria: 'Selector de idioma',
    catalogPageTitle: 'Catalogo',
    catalogPageSubtitle: 'Explora articulos de todas las categorias. Usa los filtros de la izquierda para reducir resultados.',
    filtersLabel: 'Filtros',
    clearAction: 'Limpiar',
    loadingFilters: 'Cargando filtros...',
    categoryLabel: 'Categoria',
    subcategoryLabel: 'Subcategoria',
    selectCategoryFirst: 'Selecciona primero una categoria',
    franchiseLabel: 'Franquicia',
    minYearLabel: 'Ano min',
    maxYearLabel: 'Ano max',
    sortLabel: 'Ordenar',
    sortNewestYear: 'Mas reciente (ano)',
    suggestItemAction: 'Sugerir articulo',
    mySuggestionsAction: 'Mis sugerencias',
    refreshAction: 'Actualizar',
    contextTitle: 'Contexto',
    contextHint: 'Elige una franquicia para ver detalles, conteos y descripcion.',
    loadingCatalog: 'Cargando catalogo...',
    adminCreateItem: 'Admin: Crear articulo',
    itemNameLabel: 'Nombre del articulo',
    releaseYearLabel: 'Ano de lanzamiento',
    descriptionLabel: 'Descripcion',
    itemImageJpegLabel: 'JPEG del articulo',
    identifierLabel: 'Codigo de barras / Identificador',
    statusLabel: 'Estado',
    statusDraft: 'Borrador',
    statusPublished: 'Publicado',
    dynamicFieldsLabel: 'Detalles de categoria',
    variantsLabel: 'Variantes',
    addVariantAction: '+ Agregar variante',
    variantNameLabel: 'Nombre de variante',
    variantSkuLabel: 'SKU de variante',
    variantIdentifierLabel: 'Identificador de variante',
    variantConditionLabel: 'Condicion de variante',
    removeVariantAction: 'Quitar variante',
    jpegOnlyError: 'Sube un archivo JPEG (.jpg o .jpeg).',
    createItemAction: 'Crear articulo',
    addItemAction: 'Agregar articulo',
    creatingItemAction: 'Creando...',
    selectCategoryFirstAdmin: 'Selecciona primero una categoria',
    selectSubcategoryFirstAdmin: 'Selecciona primero una subcategoria',
    selectFranchiseFirstAdmin: 'Selecciona primero una franquicia',
    adminItemCreated: 'Articulo del catalogo creado.',
    adminItemCreatedVariantWarning: 'Articulo creado, pero no se pudieron guardar las variantes.',
    adminItemCreatedPeopleWarning: 'Articulo creado, pero no se pudieron guardar los creditos.',
    adminItemCreatedMinifigWarning: 'Articulo creado, pero no se pudieron guardar las minifiguras.',
    adminItemCreateFailed: 'No se pudo crear el articulo del catalogo en este momento.',
    brandLabel: 'Marca',
    noBrandOption: '— Sin marca —',
    newBrandNamePlaceholder: 'Nombre de la nueva marca…',
    createBrandInlineAction: '＋ Crear nueva marca',
    newFranchiseNamePlaceholder: 'Nombre de la nueva franquicia…',
    createFranchiseInlineAction: '＋ Crear nueva franquicia',
    saveAction: 'Guardar',
    cancelAction: 'Cancelar',
    peopleCreditsLabel: 'Creditos',
    personNamePlaceholder: 'Nombre…',
    addPersonAction: '＋ Agregar persona',
    removePersonAction: 'Eliminar persona',
    minifigsLabel: 'Minifiguras',
    minifigNamePlaceholder: 'Nombre de la minifigura…',
    minifigIdentifierPlaceholder: 'ID ej. sw0001',
    addMinifigAction: '＋ Agregar minifigura',
    removeMinifigAction: 'Eliminar minifigura',
  },
}

const TEXT_TRANSLATIONS = {
  'Events Near You': { French: 'Evenements pres de vous', Spanish: 'Eventos cerca de ti' },
  'Trending Items': { French: 'Articles tendance', Spanish: 'Articulos en tendencia' },
  'Sales Near You': { French: 'Ventes pres de vous', Spanish: 'Ventas cerca de ti' },
  'Collection Value Trends': { French: 'Tendances de valeur de collection', Spanish: 'Tendencias del valor de coleccion' },
  'Your Trending Items': { French: 'Vos articles tendance', Spanish: 'Tus articulos en tendencia' },
  'Wishlist Alerts': { French: 'Alertes de liste de souhaits', Spanish: 'Alertas de lista de deseos' },
  'Portfolio Insights': { French: 'Apercus du portfolio', Spanish: 'Perspectivas del portafolio' },
  'Recommended For You': { French: 'Recommande pour vous', Spanish: 'Recomendado para ti' },
  'Recent Collection Activity': { French: 'Activite recente de collection', Spanish: 'Actividad reciente de coleccion' },
  'Upcoming Events': { French: 'Evenements a venir', Spanish: 'Proximos eventos' },
  'Event Registrations': { French: 'Inscriptions aux evenements', Spanish: 'Registros de eventos' },
  'Event Analytics': { French: 'Analyses des evenements', Spanish: 'Analitica de eventos' },
  'View all': { French: 'Voir tout', Spanish: 'Ver todo' },
  'No purchases yet': { French: 'Aucun achat pour le moment', Spanish: 'Aun no hay compras' },
  'Subscription Plans': { French: "Forfaits d'abonnement", Spanish: 'Planes de suscripcion' },
  'Choose the right tier for your collecting journey.': {
    French: 'Choisissez le niveau adapte a votre parcours de collection.',
    Spanish: 'Elige el nivel adecuado para tu experiencia de coleccionismo.',
  },
  Settings: { French: 'Parametres', Spanish: 'Configuracion' },
  'Manage your profile, account, and subscription controls.': {
    French: 'Gerez votre profil, votre compte et vos controles d abonnement.',
    Spanish: 'Gestiona tu perfil, cuenta y controles de suscripcion.',
  },
  'Loading plans...': { French: 'Chargement des forfaits...', Spanish: 'Cargando planes...' },
  'Your Cart': { French: 'Votre panier', Spanish: 'Tu carrito' },
  'Review your selected subscription items before checkout.': {
    French: 'Verifiez les articles d abonnement selectionnes avant le paiement.',
    Spanish: 'Revisa tus articulos de suscripcion seleccionados antes de pagar.',
  },
  'Your cart is empty.': { French: 'Votre panier est vide.', Spanish: 'Tu carrito esta vacio.' },
  'Browse Plans': { French: 'Voir les forfaits', Spanish: 'Ver planes' },
  Remove: { French: 'Retirer', Spanish: 'Quitar' },
  Items: { French: 'Articles', Spanish: 'Articulos' },
  Subtotal: { French: 'Sous-total', Spanish: 'Subtotal' },
  Total: { French: 'Total', Spanish: 'Total' },
  'Keep Shopping': { French: 'Continuer vos achats', Spanish: 'Seguir comprando' },
  Checkout: { French: 'Paiement', Spanish: 'Pagar' },
  'Processing...': { French: 'Traitement...', Spanish: 'Procesando...' },
  'Create your account': { French: 'Creez votre compte', Spanish: 'Crea tu cuenta' },
  'Welcome back': { French: 'Bon retour', Spanish: 'Bienvenido de nuevo' },
  'Start building your collection profile in minutes.': {
    French: 'Commencez votre profil de collection en quelques minutes.',
    Spanish: 'Comienza tu perfil de coleccion en minutos.',
  },
  'Log in with Store Code, Username, and PIN.': {
    French: 'Connectez-vous avec code magasin, nom d utilisateur et PIN.',
    Spanish: 'Inicia sesion con codigo de tienda, usuario y PIN.',
  },
  'Log in to access your collection dashboard.': {
    French: 'Connectez-vous pour acceder a votre tableau de bord.',
    Spanish: 'Inicia sesion para acceder a tu panel de coleccion.',
  },
  'Store Code': { French: 'Code magasin', Spanish: 'Codigo de tienda' },
  Username: { French: "Nom d'utilisateur", Spanish: 'Nombre de usuario' },
  PIN: { French: 'PIN', Spanish: 'PIN' },
  Email: { French: 'Courriel', Spanish: 'Correo' },
  Password: { French: 'Mot de passe', Spanish: 'Contrasena' },
  'Please wait...': { French: 'Veuillez patienter...', Spanish: 'Por favor espera...' },
  'Access Store': { French: 'Acceder au magasin', Spanish: 'Acceder a tienda' },
  'Create account': { French: 'Creer un compte', Spanish: 'Crear cuenta' },
  'Log in': { French: 'Connexion', Spanish: 'Iniciar sesion' },
  'Already have an account? Log in': {
    French: 'Vous avez deja un compte ? Connectez-vous',
    Spanish: 'Ya tienes una cuenta? Inicia sesion',
  },
  'Store employee? Use POS login': {
    French: 'Employe magasin ? Utilisez la connexion PDV',
    Spanish: 'Empleado de tienda? Usa inicio POS',
  },
  'Use account email login': { French: 'Utiliser la connexion par courriel', Spanish: 'Usar inicio con correo' },
  'Create owner account': { French: 'Creer un compte proprietaire', Spanish: 'Crear cuenta de propietario' },
  'New here? Create account': { French: 'Nouveau ici ? Creez un compte', Spanish: 'Nuevo aqui? Crea una cuenta' },
  'Current locations': { French: 'Emplacements actuels', Spanish: 'Ubicaciones actuales' },
  '+ Add Location': { French: '+ Ajouter un emplacement', Spanish: '+ Agregar ubicacion' },
  'Loading locations...': { French: 'Chargement des emplacements...', Spanish: 'Cargando ubicaciones...' },
  'No locations yet. Add your first location to get started.': {
    French: 'Aucun emplacement pour le moment. Ajoutez le premier pour commencer.',
    Spanish: 'Aun no hay ubicaciones. Agrega la primera para comenzar.',
  },
  Employees: { French: 'Employes', Spanish: 'Empleados' },
  'Current employees': { French: 'Employes actuels', Spanish: 'Empleados actuales' },
  '+ Add Employee': { French: '+ Ajouter un employe', Spanish: '+ Agregar empleado' },
  'Employee Created Successfully': { French: 'Employe cree avec succes', Spanish: 'Empleado creado correctamente' },
  'Store Code:': { French: 'Code magasin :', Spanish: 'Codigo de tienda:' },
  'Copy Login Info': { French: 'Copier les infos de connexion', Spanish: 'Copiar datos de acceso' },
  'Loading employees...': { French: 'Chargement des employes...', Spanish: 'Cargando empleados...' },
  'No employees yet. Add your first employee to get started.': {
    French: 'Aucun employe pour le moment. Ajoutez le premier pour commencer.',
    Spanish: 'Aun no hay empleados. Agrega el primero para comenzar.',
  },
  Integrations: { French: 'Integrations', Spanish: 'Integraciones' },
  invited: { French: 'invite', Spanish: 'invitado' },
  active: { French: 'actif', Spanish: 'activo' },
  inactive: { French: 'inactif', Spanish: 'inactivo' },
  'All Locations': { French: 'Tous les emplacements', Spanish: 'Todas las ubicaciones' },
  'Not generated': { French: 'Non genere', Spanish: 'No generado' },
  'None assigned': { French: 'Aucune attribution', Spanish: 'Sin asignacion' },
  'Edit Permissions': { French: 'Modifier les permissions', Spanish: 'Editar permisos' },
  Activate: { French: 'Activer', Spanish: 'Activar' },
  Deactivate: { French: 'Desactiver', Spanish: 'Desactivar' },
  Cancel: { French: 'Annuler', Spanish: 'Cancelar' },
  Save: { French: 'Enregistrer', Spanish: 'Guardar' },
  'View Employees': { French: 'Voir les employes', Spanish: 'Ver empleados' },
  'Location Name': { French: "Nom de l'emplacement", Spanish: 'Nombre de la ubicacion' },
  'Street Address': { French: 'Adresse', Spanish: 'Direccion' },
  City: { French: 'Ville', Spanish: 'Ciudad' },
  'Province/State': { French: 'Province/Etat', Spanish: 'Provincia/Estado' },
  'Postal Code': { French: 'Code postal', Spanish: 'Codigo postal' },
  'Phone Number': { French: 'Numero de telephone', Spanish: 'Numero de telefono' },
  'Assigned Manager': { French: 'Gestionnaire assigne', Spanish: 'Gerente asignado' },
  Unassigned: { French: 'Non assigne', Spanish: 'Sin asignar' },
  Edit: { French: 'Modifier', Spanish: 'Editar' },
  'Address not set': { French: 'Adresse non definie', Spanish: 'Direccion no definida' },
  Profile: { French: 'Profil', Spanish: 'Perfil' },
  Account: { French: 'Compte', Spanish: 'Cuenta' },
  Subscription: { French: 'Abonnement', Spanish: 'Suscripcion' },
  Privacy: { French: 'Confidentialite', Spanish: 'Privacidad' },
  Notifications: { French: 'Notifications', Spanish: 'Notificaciones' },
  Security: { French: 'Securite', Spanish: 'Seguridad' },
  'Home Screen': { French: "Ecran d'accueil", Spanish: 'Pantalla de inicio' },
  Store: { French: 'Magasin', Spanish: 'Tienda' },
  Locations: { French: 'Emplacements', Spanish: 'Ubicaciones' },
  Permissions: { French: 'Permissions', Spanish: 'Permisos' },
  'Save Permissions': { French: 'Enregistrer les permissions', Spanish: 'Guardar permisos' },
  'Location access': { French: "Acces a l'emplacement", Spanish: 'Acceso de ubicacion' },
  'Add Employee': { French: 'Ajouter un employe', Spanish: 'Agregar empleado' },
  'Create a linked employee account using Store Code, Username, and PIN.': {
    French: 'Creez un compte employe lie avec code magasin, nom d utilisateur et PIN.',
    Spanish: 'Crea una cuenta de empleado vinculada con codigo de tienda, usuario y PIN.',
  },
  'First Name': { French: 'Prenom', Spanish: 'Nombre' },
  'Last Name': { French: 'Nom', Spanish: 'Apellido' },
  Role: { French: 'Role', Spanish: 'Rol' },
  Owner: { French: 'Proprietaire', Spanish: 'Propietario' },
  Manager: { French: 'Gestionnaire', Spanish: 'Gerente' },
  Cashier: { French: 'Caissier', Spanish: 'Cajero' },
  'Inventory Staff': { French: 'Personnel inventaire', Spanish: 'Personal de inventario' },
  Custom: { French: 'Personnalise', Spanish: 'Personalizado' },
  'Creating...': { French: 'Creation...', Spanish: 'Creando...' },
  'Create Employee': { French: "Creer l'employe", Spanish: 'Crear empleado' },
  'Close add employee': { French: "Fermer l'ajout d'employe", Spanish: 'Cerrar agregar empleado' },
  'Add Location': { French: 'Ajouter un emplacement', Spanish: 'Agregar ubicacion' },
  'Create a new store location for your business.': {
    French: 'Creez un nouvel emplacement pour votre entreprise.',
    Spanish: 'Crea una nueva ubicacion de tienda para tu negocio.',
  },
  'Manager (optional)': { French: 'Gestionnaire (optionnel)', Spanish: 'Gerente (opcional)' },
  'Create Location': { French: "Creer l'emplacement", Spanish: 'Crear ubicacion' },
  'Close add location': { French: "Fermer l'ajout d'emplacement", Spanish: 'Cerrar agregar ubicacion' },
  'Assigned manager': { French: 'Gestionnaire assigne', Spanish: 'Gerente asignado' },
  'Employee count': { French: "Nombre d'employes", Spanish: 'Cantidad de empleados' },
  'Sign in to view your settings.': {
    French: 'Connectez-vous pour voir vos parametres.',
    Spanish: 'Inicia sesion para ver tu configuracion.',
  },
}

const translateText = (text, language) => {
  if (!text || typeof text !== 'string') {
    return text
  }

  const normalizedLanguage = normalizeLanguage(language)
  if (normalizedLanguage === 'English') {
    return text
  }

  const translationSet = TEXT_TRANSLATIONS[text]
  if (!translationSet) {
    return text
  }

  return translationSet[normalizedLanguage] || text
}

const normalizeLanguage = (value) => {
  const normalized = (value || '').trim().toLowerCase()

  if (!normalized) {
    return 'English'
  }

  if (normalized === 'french' || normalized === 'fr' || normalized.startsWith('fr-')) {
    return 'French'
  }

  if (
    normalized === 'spanish' ||
    normalized === 'spainish' ||
    normalized === 'es' ||
    normalized.startsWith('es-')
  ) {
    return 'Spanish'
  }

  return 'English'
}

const EMPLOYEE_PERMISSION_OPTIONS = [
  { key: 'pos_access', label: 'POS access' },
  { key: 'inventory_management', label: 'Inventory management' },
  { key: 'event_management', label: 'Event management' },
  { key: 'listings_management', label: 'Listings management' },
  { key: 'employee_management', label: 'Employee management' },
  { key: 'billing_access', label: 'Billing access' },
  { key: 'subscription_management', label: 'Subscription management' },
  { key: 'store_settings', label: 'Store settings' },
]

const DEFAULT_LOCATION_NAME = 'Main Location'

const normalizeLocationIds = (value) => {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(new Set(value.filter(Boolean)))
}

const DEFAULT_EMPLOYEE_PERMISSIONS = EMPLOYEE_PERMISSION_OPTIONS.reduce((accumulator, option) => {
  accumulator[option.key] = false
  return accumulator
}, {})

const ROLE_PERMISSION_DEFAULTS = {
  Owner: EMPLOYEE_PERMISSION_OPTIONS.reduce((accumulator, option) => {
    accumulator[option.key] = true
    return accumulator
  }, {}),
  Manager: {
    pos_access: true,
    inventory_management: true,
    event_management: true,
    listings_management: true,
    employee_management: true,
    billing_access: false,
    subscription_management: false,
    store_settings: true,
  },
  Cashier: {
    pos_access: true,
    inventory_management: false,
    event_management: false,
    listings_management: false,
    employee_management: false,
    billing_access: false,
    subscription_management: false,
    store_settings: false,
  },
  'Inventory Staff': {
    pos_access: false,
    inventory_management: true,
    event_management: false,
    listings_management: true,
    employee_management: false,
    billing_access: false,
    subscription_management: false,
    store_settings: false,
  },
  Custom: DEFAULT_EMPLOYEE_PERMISSIONS,
}

const normalizeEmployeePermissions = (permissions) => {
  const merged = {
    ...DEFAULT_EMPLOYEE_PERMISSIONS,
    ...(permissions || {}),
  }

  return EMPLOYEE_PERMISSION_OPTIONS.reduce((accumulator, option) => {
    accumulator[option.key] = Boolean(merged[option.key])
    return accumulator
  }, {})
}

const getRoleDefaultPermissions = (role) => normalizeEmployeePermissions(ROLE_PERMISSION_DEFAULTS[role] || {})

const normalizeEmployeeRoleForAuth = (roleLabel) => {
  if (!roleLabel) {
    return 'cashier'
  }

  const normalized = roleLabel.toLowerCase().trim()
  if (normalized === 'inventory staff') {
    return 'inventory'
  }

  return normalized.replace(/\s+/g, '_')
}

const resolveEmployeeAuthEmailDomain = (ownerEmail) => {
  const normalizedOwnerEmail = (ownerEmail || '').trim().toLowerCase()
  const domainPart = normalizedOwnerEmail.split('@')[1] || ''

  if (domainPart && domainPart.includes('.')) {
    return domainPart
  }

  return INTERNAL_EMPLOYEE_EMAIL_DOMAIN
}

const HOME_SECTION_LIBRARY = {
  'Events Near You': { action: 'View all', variant: 'wide', cards: 6, showMessage: false },
  'Trending Items': { action: null, variant: 'compact', cards: 8, showMessage: true },
  'Sales Near You': { action: 'View all', variant: 'wide', cards: 6, showMessage: false },
  'Collection Value Trends': { action: 'View all', variant: 'wide', cards: 6, showMessage: false },
  'Your Trending Items': { action: null, variant: 'compact', cards: 8, showMessage: true },
  'Wishlist Alerts': { action: 'View all', variant: 'compact', cards: 8, showMessage: true },
  'Portfolio Insights': { action: 'View all', variant: 'wide', cards: 6, showMessage: false },
  'Recommended For You': { action: null, variant: 'compact', cards: 8, showMessage: true },
  'Recent Collection Activity': { action: 'View all', variant: 'wide', cards: 6, showMessage: false },
}

const buildHomeColumns = (selectedSections, allowedOptions) => {
  const uniqueSections = []
  selectedSections.forEach((section) => {
    if (HOME_SECTION_LIBRARY[section] && !uniqueSections.includes(section)) {
      uniqueSections.push(section)
    }
  })

  allowedOptions.forEach((section) => {
    if (uniqueSections.length >= 3) {
      return
    }

    if (!uniqueSections.includes(section)) {
      uniqueSections.push(section)
    }
  })

  return uniqueSections.slice(0, 3).map((sectionTitle) => ({
    title: sectionTitle,
    ...HOME_SECTION_LIBRARY[sectionTitle],
  }))
}

const buildStorageLocationPathById = (locations) => {
  const byId = (locations || []).reduce((accumulator, location) => {
    if (location?.id) {
      accumulator[location.id] = location
    }
    return accumulator
  }, {})

  const cache = {}
  const resolvePath = (locationId, trail = new Set()) => {
    if (!locationId || !byId[locationId]) {
      return ''
    }

    if (cache[locationId]) {
      return cache[locationId]
    }

    if (trail.has(locationId)) {
      return byId[locationId].name || ''
    }

    const nextTrail = new Set(trail)
    nextTrail.add(locationId)

    const current = byId[locationId]
    const parentPath = current.parent_location_id ? resolvePath(current.parent_location_id, nextTrail) : ''
    const currentName = current.name || 'Unnamed Location'
    const fullPath = parentPath ? `${parentPath} -> ${currentName}` : currentName
    cache[locationId] = fullPath
    return fullPath
  }

  return Object.keys(byId).reduce((accumulator, locationId) => {
    accumulator[locationId] = resolvePath(locationId)
    return accumulator
  }, {})
}

const toFiniteNumber = (value, fallback = 0) => {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

const formatPercentValue = (value) => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    return 'N/A'
  }

  const sign = numericValue > 0 ? '+' : ''
  return `${sign}${numericValue.toFixed(1)}%`
}

const getMonthBucketLabel = (isoValue) => {
  if (!isoValue) {
    return 'Unknown'
  }

  const date = new Date(isoValue)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
  })
}

const BASE_TIER_ORDER = ['free_collector', 'collector_plus', 'event_organizer', 'store', 'store_pro']
const INDIVIDUAL_TIERS = new Set(['free_collector', 'collector_plus'])
const BUSINESS_TIERS = new Set(['store', 'store_pro'])

const tierLabels = {
  free_collector: 'Free Collector',
  collector_plus: 'Collector+',
  store: 'Store',
  store_pro: 'Store+',
  event_organizer: 'Event Organizer',
}

const BUSINESS_HOUR_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const BUSINESS_HOUR_OPTIONS = [
  '',
  'Closed',
  '06:00 AM',
  '07:00 AM',
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
  '09:00 PM',
  '10:00 PM',
]

const SETTINGS_STORAGE_KEY = 'collectorshub-settings-v1'

const buildEmptyBusinessHours = () =>
  BUSINESS_HOUR_DAYS.reduce((accumulator, day) => {
    accumulator[day] = { open: '', close: '' }
    return accumulator
  }, {})

const profileSelectFields =
  'display_name, avatar_url, subscription_tier, has_event_organizer, billing_cycle, subscription_started_at, subscription_current_period_end, cancel_at_period_end, scheduled_downgrade_tier, cancel_event_addon_at_period_end'

const addOneMonthIso = (isoValue) => {
  const baseDate = isoValue ? new Date(isoValue) : new Date()
  const nextDate = new Date(baseDate)
  nextDate.setMonth(nextDate.getMonth() + 1)
  return nextDate.toISOString()
}

const formatDate = (isoValue) => {
  if (!isoValue) {
    return 'N/A'
  }

  return new Date(isoValue).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const isBusinessTier = (tier) => BUSINESS_TIERS.has(tier)
const isIndividualTier = (tier) => INDIVIDUAL_TIERS.has(tier)

const isPaidProfile = (profile) => {
  if (!profile) {
    return false
  }

  return profile.subscription_tier !== 'free_collector' || Boolean(profile.has_event_organizer)
}

const getPlanDisplayLabel = (profile) => {
  if (!profile?.subscription_tier) {
    return 'Free Collector'
  }

  const baseLabel = tierLabels[profile.subscription_tier] || 'Free Collector'
  const hasAddon = Boolean(profile.has_event_organizer)

  if (isIndividualTier(profile.subscription_tier) && hasAddon) {
    return `${baseLabel} + Event Organizer`
  }

  if (isBusinessTier(profile.subscription_tier)) {
    return `${baseLabel} (Includes Event Organizer)`
  }

  return baseLabel
}

function App() {
  const [posSession, setPosSession] = useState(null)
  const [currentScreen, setCurrentScreen] = useState('home')
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetPasswordValue, setResetPasswordValue] = useState('')
  const [resetPasswordConfirmValue, setResetPasswordConfirmValue] = useState('')
  const [posStoreCode, setPosStoreCode] = useState('')
  const [posUsername, setPosUsername] = useState('')
  const [posPin, setPosPin] = useState('')
  const [settingsPendingEmail, setSettingsPendingEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [downgradeModalType, setDowngradeModalType] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [subscriptionPlans, setSubscriptionPlans] = useState([])
  const [isPlansLoading, setIsPlansLoading] = useState(false)
  const [plansError, setPlansError] = useState('')
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false)
  const [supportRequest, setSupportRequest] = useState(null)
  const [supportMessageText, setSupportMessageText] = useState('')
  const [isStoreUpgradeModalOpen, setIsStoreUpgradeModalOpen] = useState(false)
  const [storeBusinessName, setStoreBusinessName] = useState('')
  const [storeBusinessType, setStoreBusinessType] = useState('')
  const [storePhoneNumber, setStorePhoneNumber] = useState('')
  const [storeBusinessHoursByDay, setStoreBusinessHoursByDay] = useState(buildEmptyBusinessHours)
  const [storeRegistrationNumber, setStoreRegistrationNumber] = useState('')
  const [storeCertificateDetails, setStoreCertificateDetails] = useState('')
  const [storeCertificateScanFile, setStoreCertificateScanFile] = useState(null)
  const [storeProofOfAddressFile, setStoreProofOfAddressFile] = useState(null)
  const [storeAdditionalInfo, setStoreAdditionalInfo] = useState('')
  const [isSubmittingStoreUpgrade, setIsSubmittingStoreUpgrade] = useState(false)
  const [storeUpgradeError, setStoreUpgradeError] = useState('')
  const [storePlusLocations, setStorePlusLocations] = useState('')
  const [storePlusEmployeeCount, setStorePlusEmployeeCount] = useState('')
  const [storePlusAdditionalInfo, setStorePlusAdditionalInfo] = useState('')
  const [supportFormError, setSupportFormError] = useState('')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false)
  const [recentDeliveryLocations, setRecentDeliveryLocations] = useState([])
  const [customDeliveryLocationInput, setCustomDeliveryLocationInput] = useState('')
  const [locationAutocompleteOptions, setLocationAutocompleteOptions] = useState([])
  const [isLocationAutocompleteLoading, setIsLocationAutocompleteLoading] = useState(false)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [isResolvingSearchArea, setIsResolvingSearchArea] = useState(false)
  const [locationDetectError, setLocationDetectError] = useState('')
  const [searchAreaContext, setSearchAreaContext] = useState(null)
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile')
  const [settingsProfilePhoto, setSettingsProfilePhoto] = useState('')
  const [settingsProfilePhotoFile, setSettingsProfilePhotoFile] = useState(null)
  const [settingsUsername, setSettingsUsername] = useState('')
  const [settingsDisplayName, setSettingsDisplayName] = useState('')
  const [settingsBio, setSettingsBio] = useState('')
  const [settingsLocation, setSettingsLocation] = useState('')
  const [settingsMailingAddress, setSettingsMailingAddress] = useState('')
  const [settingsFavouriteCategories, setSettingsFavouriteCategories] = useState('')
  const [settingsProfileBanner, setSettingsProfileBanner] = useState('')
  const [settingsProfileBannerFile, setSettingsProfileBannerFile] = useState(null)
  const [settingsPublicProfileUrl, setSettingsPublicProfileUrl] = useState('')
  const [settingsAvatarUrl, setSettingsAvatarUrl] = useState('')
  const [settingsLanguage, setSettingsLanguage] = useState('English')
  const [settingsTimezone, setSettingsTimezone] = useState('America/Halifax')
  const [privacyPublicProfile, setPrivacyPublicProfile] = useState(true)
  const [privacyShowCollectionValue, setPrivacyShowCollectionValue] = useState(true)
  const [privacyShowWishlist, setPrivacyShowWishlist] = useState(true)
  const [privacyAllowFollowers, setPrivacyAllowFollowers] = useState(true)
  const [privacyShowOnlineStatus, setPrivacyShowOnlineStatus] = useState(true)
  const [notificationsDealAlerts, setNotificationsDealAlerts] = useState(true)
  const [settingsCollectionAnalytics, setSettingsCollectionAnalytics] = useState(true)
  const [settingsGradingRecommendations, setSettingsGradingRecommendations] = useState(true)
  const [settingsUnlimitedCollectionFolders, setSettingsUnlimitedCollectionFolders] = useState(true)
  const [settingsPortfolioInsights, setSettingsPortfolioInsights] = useState(true)
  const [notificationsWishlistAlerts, setNotificationsWishlistAlerts] = useState(true)
  const [notificationsStorePromotions, setNotificationsStorePromotions] = useState(true)
  const [notificationsEventReminders, setNotificationsEventReminders] = useState(true)
  const [notificationsEmail, setNotificationsEmail] = useState(true)
  const [notificationsPush, setNotificationsPush] = useState(true)
  const [settingsStoreLogo, setSettingsStoreLogo] = useState('')
  const [settingsStoreLogoFile, setSettingsStoreLogoFile] = useState(null)
  const [settingsStoreBanner, setSettingsStoreBanner] = useState('')
  const [settingsStoreBannerFile, setSettingsStoreBannerFile] = useState(null)
  const [settingsStoreHours, setSettingsStoreHours] = useState('')
  const [settingsStoreAddress, setSettingsStoreAddress] = useState('')
  const [settingsStoreName, setSettingsStoreName] = useState('')
  const [settingsStoreDescription, setSettingsStoreDescription] = useState('')
  const [settingsStoreVisibility, setSettingsStoreVisibility] = useState('Public')
  const [settingsInventoryAutoPublish, setSettingsInventoryAutoPublish] = useState(false)
  const [settingsInventoryAllowPurchaseRequests, setSettingsInventoryAllowPurchaseRequests] = useState(false)
  const [settingsInventoryEnableMarketplaceListings, setSettingsInventoryEnableMarketplaceListings] = useState(false)
  const [settingsInventoryEnableEventCreation, setSettingsInventoryEnableEventCreation] = useState(false)
  const [settingsInventoryTrackByLocation, setSettingsInventoryTrackByLocation] = useState(false)
  const [settingsPosConnections, setSettingsPosConnections] = useState('')
  const [settingsApiKeys, setSettingsApiKeys] = useState('')
  const [settingsWebhookSettings, setSettingsWebhookSettings] = useState('')
  const [settingsConnectedApps, setSettingsConnectedApps] = useState('')
  const [storeEmployees, setStoreEmployees] = useState([])
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(false)
  const [employeesError, setEmployeesError] = useState('')
  const [currentStore, setCurrentStore] = useState(null)
  const [employeeAuthContext, setEmployeeAuthContext] = useState(null)
  const [createdEmployeeLoginInfo, setCreatedEmployeeLoginInfo] = useState(null)
  const [storeLocations, setStoreLocations] = useState([])
  const [isLocationsLoading, setIsLocationsLoading] = useState(false)
  const [locationsError, setLocationsError] = useState('')
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false)
  const [newLocationName, setNewLocationName] = useState('')
  const [newLocationStreetAddress, setNewLocationStreetAddress] = useState('')
  const [newLocationCity, setNewLocationCity] = useState('')
  const [newLocationProvince, setNewLocationProvince] = useState('')
  const [newLocationPostalCode, setNewLocationPostalCode] = useState('')
  const [newLocationPhoneNumber, setNewLocationPhoneNumber] = useState('')
  const [newLocationManagerEmployeeId, setNewLocationManagerEmployeeId] = useState('')
  const [isCreatingLocation, setIsCreatingLocation] = useState(false)
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false)
  const [newEmployeeFirstName, setNewEmployeeFirstName] = useState('')
  const [newEmployeeLastName, setNewEmployeeLastName] = useState('')
  const [newEmployeePin, setNewEmployeePin] = useState('')
  const [newEmployeeRole, setNewEmployeeRole] = useState('Cashier')
  const [newEmployeeAllLocations, setNewEmployeeAllLocations] = useState(true)
  const [newEmployeeLocationIds, setNewEmployeeLocationIds] = useState([])
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false)
  const [editingEmployeeId, setEditingEmployeeId] = useState('')
  const [editingEmployeePermissions, setEditingEmployeePermissions] = useState(DEFAULT_EMPLOYEE_PERMISSIONS)
  const [editingEmployeeAllLocations, setEditingEmployeeAllLocations] = useState(true)
  const [editingEmployeeLocationIds, setEditingEmployeeLocationIds] = useState([])
  const [settingsHomeSectionOne, setSettingsHomeSectionOne] = useState(DEFAULT_HOME_SECTIONS[0])
  const [settingsHomeSectionTwo, setSettingsHomeSectionTwo] = useState(DEFAULT_HOME_SECTIONS[1])
  const [settingsHomeSectionThree, setSettingsHomeSectionThree] = useState(DEFAULT_HOME_SECTIONS[2])
  const [settingsHomeShowGreeting, setSettingsHomeShowGreeting] = useState(true)
  const [settingsHomeShowEmptyStateHints, setSettingsHomeShowEmptyStateHints] = useState(true)
  const [settingsError, setSettingsError] = useState('')
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [magicImportFile, setMagicImportFile] = useState(null)
  const [magicImportError, setMagicImportError] = useState('')
  const [magicImportSummary, setMagicImportSummary] = useState('')
  const [magicImportProgress, setMagicImportProgress] = useState({ processed: 0, total: 0 })
  const [isImportingMagic, setIsImportingMagic] = useState(false)
  const [catalogSortKey, setCatalogSortKey] = useState('newest_year')
  const [catalogCategory, setCatalogCategory] = useState('all')
  const [catalogSubcategory, setCatalogSubcategory] = useState('')
  const [catalogFranchise, setCatalogFranchise] = useState('all')
  const [catalogMinYear, setCatalogMinYear] = useState('')
  const [catalogMaxYear, setCatalogMaxYear] = useState('')
  const [siteSearchQuery, setSiteSearchQuery] = useState('')
  const [catalogItems, setCatalogItems] = useState([])
  const [catalogCategories, setCatalogCategories] = useState([])
  const [catalogSubcategories, setCatalogSubcategories] = useState([])
  const [catalogFranchises, setCatalogFranchises] = useState([])
  const [catalogFranchiseBrands, setCatalogFranchiseBrands] = useState([])
  const [catalogBrands, setCatalogBrands] = useState([])
  const [isCatalogLoading, setIsCatalogLoading] = useState(false)
  const [catalogLoadError, setCatalogLoadError] = useState('')
  const [catalogReloadToken, setCatalogReloadToken] = useState(0)
  const [catalogPage, setCatalogPage] = useState(1)
  const [catalogTotalItemCount, setCatalogTotalItemCount] = useState(0)
  const [selectedCatalogItem, setSelectedCatalogItem] = useState(null)
  const [catalogDetailIsGraded, setCatalogDetailIsGraded] = useState(false)
  const [catalogDetailGradingCompany, setCatalogDetailGradingCompany] = useState('')
  const [catalogDetailSelectedGrade, setCatalogDetailSelectedGrade] = useState('')
  const [catalogDetailSelectedCondition, setCatalogDetailSelectedCondition] = useState('')
  const [catalogDetailCertNumber, setCatalogDetailCertNumber] = useState('')
  const [catalogDetailTagScore, setCatalogDetailTagScore] = useState('')
  const [catalogDetailTagDigReport, setCatalogDetailTagDigReport] = useState('')
  const [catalogDetailTagScoreRank, setCatalogDetailTagScoreRank] = useState('')
  const [catalogDetailTagPopulation, setCatalogDetailTagPopulation] = useState('')
  const [catalogDetailTagVerifiedSlab, setCatalogDetailTagVerifiedSlab] = useState('')
  const [isCatalogDetailTagLookupLoading, setIsCatalogDetailTagLookupLoading] = useState(false)
  const [catalogDetailTagLookupError, setCatalogDetailTagLookupError] = useState('')
  const [catalogDetailBgsSubgrades, setCatalogDetailBgsSubgrades] = useState(DEFAULT_BGS_SUBGRADES)
  const [ownedCatalogItemCounts, setOwnedCatalogItemCounts] = useState({})
  const [ownedCatalogItemCerts, setOwnedCatalogItemCerts] = useState({})
  const [ownedCatalogItemPurchases, setOwnedCatalogItemPurchases] = useState({})
  const [collectionItems, setCollectionItems] = useState([])
  const [collectionInventoryRows, setCollectionInventoryRows] = useState([])
  const [isCollectionLoading, setIsCollectionLoading] = useState(false)
  const [collectionLoadError, setCollectionLoadError] = useState('')
  const [customCollections, setCustomCollections] = useState([])
  const [storageLocations, setStorageLocations] = useState([])
  const [collectionItemAssignments, setCollectionItemAssignments] = useState([])
  const [inventoryItemLocationAssignments, setInventoryItemLocationAssignments] = useState([])
  const [collectionReloadToken, setCollectionReloadToken] = useState(0)
  const [collectionViewTab, setCollectionViewTab] = useState('overview')
  const [collectionOverviewPage, setCollectionOverviewPage] = useState(1)
  const [selectedCollectionItemDetailsId, setSelectedCollectionItemDetailsId] = useState('')
  const [selectedCollectionCopyIndex, setSelectedCollectionCopyIndex] = useState(0)
  const [collectionCopySalePriceInput, setCollectionCopySalePriceInput] = useState('')
  const [collectionItemDetailActionError, setCollectionItemDetailActionError] = useState('')
  const [collectionItemDetailActionMessage, setCollectionItemDetailActionMessage] = useState('')
  const [isUploadingCollectionCopyImage, setIsUploadingCollectionCopyImage] = useState(false)
  const [isListingCollectionCopyForSale, setIsListingCollectionCopyForSale] = useState(false)
  const [collectibleSets, setCollectibleSets] = useState([])
  const [collectibleSetEntries, setCollectibleSetEntries] = useState([])
  const [selectedCompletionSetId, setSelectedCompletionSetId] = useState('')
  const [trackedCollectionGoals, setTrackedCollectionGoals] = useState([])
  const [goalReloadToken, setGoalReloadToken] = useState(0)
  const [activeCollectionFilter, setActiveCollectionFilter] = useState('all')
  const [activeStorageFilter, setActiveStorageFilter] = useState('')
  const [collectionSearchQuery, setCollectionSearchQuery] = useState('')
  const [newCustomCollectionName, setNewCustomCollectionName] = useState('')
  const [newStorageLocationName, setNewStorageLocationName] = useState('')
  const [newStorageParentLocationId, setNewStorageParentLocationId] = useState('')
  const [isCreatingCustomCollection, setIsCreatingCustomCollection] = useState(false)
  const [isCreatingStorageLocation, setIsCreatingStorageLocation] = useState(false)
  const [isSavingCollectionOrganization, setIsSavingCollectionOrganization] = useState(false)
  const [isAddToCollectionModalOpen, setIsAddToCollectionModalOpen] = useState(false)
  const [collectionAcquisitionType, setCollectionAcquisitionType] = useState('direct')
  const [collectionPurchasePriceInput, setCollectionPurchasePriceInput] = useState('')
  const [collectionBoxSetTotalInput, setCollectionBoxSetTotalInput] = useState('')
  const [collectionBoxSetItemCountInput, setCollectionBoxSetItemCountInput] = useState('')
  const [collectionPurchaseError, setCollectionPurchaseError] = useState('')
  const [isSavingCollectionItem, setIsSavingCollectionItem] = useState(false)
  const [catalogAdminCategories, setCatalogAdminCategories] = useState([])
  const [catalogAdminSubcategories, setCatalogAdminSubcategories] = useState([])
  const [catalogAdminFranchises, setCatalogAdminFranchises] = useState([])
  const [catalogAdminCategoryId, setCatalogAdminCategoryId] = useState('')
  const [catalogAdminSubcategoryId, setCatalogAdminSubcategoryId] = useState('')
  const [catalogAdminFranchiseId, setCatalogAdminFranchiseId] = useState('')
  const [catalogAdminItemName, setCatalogAdminItemName] = useState('')
  const [catalogAdminItemYear, setCatalogAdminItemYear] = useState('')
  const [catalogAdminItemDescription, setCatalogAdminItemDescription] = useState('')
  const [catalogAdminItemIdentifier, setCatalogAdminItemIdentifier] = useState('')
  const [catalogAdminStatus, setCatalogAdminStatus] = useState('draft')
  const [catalogAdminDynamicFields, setCatalogAdminDynamicFields] = useState({})
  const [catalogAdminVariants, setCatalogAdminVariants] = useState([buildCatalogVariantRow()])
  const [catalogAdminItemImageFile, setCatalogAdminItemImageFile] = useState(null)
  const [catalogAdminBrands, setCatalogAdminBrands] = useState([])
  const [catalogAdminBrandId, setCatalogAdminBrandId] = useState('')
  const [catalogAdminNewBrandName, setCatalogAdminNewBrandName] = useState('')
  const [catalogAdminIsCreatingBrand, setCatalogAdminIsCreatingBrand] = useState(false)
  const [catalogAdminIsSavingBrand, setCatalogAdminIsSavingBrand] = useState(false)
  const [catalogAdminNewFranchiseName, setCatalogAdminNewFranchiseName] = useState('')
  const [catalogAdminIsCreatingFranchise, setCatalogAdminIsCreatingFranchise] = useState(false)
  const [catalogAdminIsSavingFranchise, setCatalogAdminIsSavingFranchise] = useState(false)
  const [catalogAdminPeopleRows, setCatalogAdminPeopleRows] = useState([])
  const [catalogAdminMinifigRows, setCatalogAdminMinifigRows] = useState([])
  const [catalogAdminExistingPeople, setCatalogAdminExistingPeople] = useState([])
  const [catalogAdminExistingMinifigs, setCatalogAdminExistingMinifigs] = useState([])
  const [catalogAdminFormError, setCatalogAdminFormError] = useState('')
  const [isCreatingCatalogItem, setIsCreatingCatalogItem] = useState(false)
  const [isCatalogItemModalOpen, setIsCatalogItemModalOpen] = useState(false)
  const [isCatalogAdminPanelOpen, setIsCatalogAdminPanelOpen] = useState(false)
  const [catalogAdminNewSubcategoryName, setCatalogAdminNewSubcategoryName] = useState('')
  const [catalogAdminIsCreatingSubcategory, setCatalogAdminIsCreatingSubcategory] = useState(false)
  const [catalogAdminIsSavingSubcategory, setCatalogAdminIsSavingSubcategory] = useState(false)
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false)
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false)
  const [twoFactorQrSvg, setTwoFactorQrSvg] = useState('')
  const [twoFactorQrDataUrl, setTwoFactorQrDataUrl] = useState('')
  const [twoFactorSecret, setTwoFactorSecret] = useState('')
  const [twoFactorFactorId, setTwoFactorFactorId] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorError, setTwoFactorError] = useState('')
  const [isTwoFactorLoading, setIsTwoFactorLoading] = useState(false)
  const userMenuRef = useRef(null)
  const languageMenuRef = useRef(null)
  const locationMenuRef = useRef(null)
  const defaultCollectionIdRef = useRef('')
  const isAutoSyncingCompletionGoalsRef = useRef(false)

  const tierLabel = profile?.subscription_tier
    ? tierLabels[profile.subscription_tier] ?? 'Unknown Tier'
    : null
  const avatarFallback = (profile?.display_name || currentUser?.email || '?')
    .trim()
    .charAt(0)
    .toUpperCase()
  const avatarImage = profile?.avatar_url || null
  const topbarUserName =
    settingsUsername.trim() ||
    profile?.display_name ||
    currentUser?.email ||
    'Account'
  const greetingHour = new Date().getHours()
  const activeLanguage = normalizeLanguage(settingsLanguage)
  const localizedCopy = UI_COPY[activeLanguage] || UI_COPY.English
  const t = (key) => localizedCopy[key] || UI_COPY.English[key] || key
  const tx = (text) => translateText(text, activeLanguage)
  const greetingKey = greetingHour < 12 ? 'greetingMorning' : greetingHour < 18 ? 'greetingAfternoon' : 'greetingEvening'
  const timeGreeting = t(greetingKey)
  const hasEventOrganizerHomeOptions =
    isIndividualTier(profile?.subscription_tier) && Boolean(profile?.has_event_organizer)
  const employeePermissions = employeeAuthContext?.permissions || {}
  const admin = new Admin(profile, employeePermissions)
  const isPlatformAdmin = admin.isPlatformAdmin()
  const hasStoreProAccess = profile?.subscription_tier === 'store_pro' || isPlatformAdmin
  const canAccessHomeScreenTab =
    profile?.subscription_tier === 'collector_plus' ||
    (profile?.subscription_tier === 'free_collector' && hasEventOrganizerHomeOptions) ||
    isPlatformAdmin
  const isStoreOwnerTier = admin.isStoreOwnerTier()
  const canAccessStoreTab = admin.canAccessStoreTab()
  const canAccessLocationsTab = admin.canAccessLocationsTab()
  const canAccessEmployeesTab = admin.canAccessEmployeesTab()
  const canAccessIntegrationsTab = admin.canAccessIntegrationsTab()
  const isCollectorPlusMember = profile?.subscription_tier === 'collector_plus'
  const locationsById = storeLocations.reduce((accumulator, location) => {
    accumulator[location.id] = location
    return accumulator
  }, {})
  const locationOptions = storeLocations
    .filter((location) => location.status !== 'inactive')
    .map((location) => ({ id: location.id, name: location.location_name }))
  const storeDeliveryOptions = storeLocations
    .filter((location) => location.status !== 'inactive')
    .map((location) => formatStoreDeliveryLocation(location))
    .filter(Boolean)
  const deliveryLocationOptions = Array.from(
    new Set([
      ...storeDeliveryOptions,
      ...recentDeliveryLocations,
      (searchAreaContext?.label || '').trim(),
      settingsLocation.trim(),
    ]),
  ).filter(Boolean)
  const resolvedSearchAreaLabel = (searchAreaContext?.label || '').trim()
  const manualSearchAreaLabel = settingsLocation.trim()
  const selectedDeliveryLocation =
    (manualSearchAreaLabel && manualSearchAreaLabel !== resolvedSearchAreaLabel
      ? manualSearchAreaLabel
      : resolvedSearchAreaLabel) ||
    manualSearchAreaLabel ||
    deliveryLocationOptions[0] ||
    t('setLocation')
  const managerOptions = storeEmployees
    .filter((employee) => {
      const normalizedRole = (employee.role || '').toLowerCase()
      return employee.status !== 'inactive' && (normalizedRole === 'owner' || normalizedRole === 'manager')
    })
    .map((employee) => {
      const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim()
      return {
        id: employee.id,
        name: fullName || employee.username || 'Employee',
      }
    })
  const homeSectionOptions = Array.from(
    new Set([
      ...(profile?.subscription_tier === 'collector_plus' ? COLLECTOR_PLUS_HOME_SECTION_OPTIONS : DEFAULT_HOME_SECTIONS),
      ...(hasEventOrganizerHomeOptions ? EVENT_ORGANIZER_HOME_SECTION_OPTIONS : []),
    ]),
  )
  const catalogCategoryById = catalogCategories.reduce((lookup, category) => {
    lookup[category.id] = category.name
    return lookup
  }, {})
  const catalogSubcategoryById = catalogSubcategories.reduce((lookup, subcategory) => {
    lookup[subcategory.id] = subcategory.name
    return lookup
  }, {})
  const catalogFranchiseById = catalogFranchises.reduce((lookup, franchise) => {
    lookup[franchise.id] = franchise.name
    return lookup
  }, {})
  const catalogSetById = catalogFranchises.reduce((lookup, setRecord) => {
    lookup[setRecord.id] = setRecord
    return lookup
  }, {})
  const catalogFranchiseBrandById = catalogFranchiseBrands.reduce((lookup, franchiseBrand) => {
    lookup[franchiseBrand.id] = franchiseBrand.name
    return lookup
  }, {})
  const catalogBrandById = catalogBrands.reduce((lookup, brand) => {
    lookup[brand.id] = brand.name
    return lookup
  }, {})
  const catalogCategoryOptions = catalogCategories.map((category) => category.name)
  const selectedCatalogCategoryRecord =
    catalogCategory === 'all' ? null : catalogCategories.find((category) => category.name === catalogCategory) || null
  const catalogSubcategoryOptions = catalogSubcategories
    .filter((subcategory) => {
      if (!selectedCatalogCategoryRecord) {
        return false
      }
      return subcategory.category_id === selectedCatalogCategoryRecord.id
    })
    .map((subcategory) => subcategory.name)
  const selectedCatalogSubcategoryRecord =
    !catalogSubcategory || !selectedCatalogCategoryRecord
      ? null
      : catalogSubcategories.find(
          (subcategory) =>
            subcategory.name === catalogSubcategory && subcategory.category_id === selectedCatalogCategoryRecord.id,
        ) || null
  const catalogSetRowsForFilters = catalogFranchises
    .filter((setRecord) => {
      if (selectedCatalogSubcategoryRecord) {
        return setRecord.subcategory_id === selectedCatalogSubcategoryRecord.id
      }
      if (selectedCatalogCategoryRecord) {
        return setRecord.category_id === selectedCatalogCategoryRecord.id
      }
      return true
    })
  const catalogFranchiseOptions = Array.from(
    new Set(
      catalogSetRowsForFilters
        .map((setRecord) => {
          if (!setRecord.franchise_id) {
            return ''
          }
          return catalogFranchiseBrandById[setRecord.franchise_id] || ''
        })
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right))
  const selectedCatalogFranchiseRecord =
    catalogFranchise === 'all'
      ? null
      : catalogFranchiseBrands.find((franchiseBrand) => franchiseBrand.name === catalogFranchise) || null
  const selectedCatalogFranchiseSetIds = selectedCatalogFranchiseRecord
    ? catalogSetRowsForFilters
        .filter((setRecord) => setRecord.franchise_id === selectedCatalogFranchiseRecord.id)
        .map((setRecord) => setRecord.id)
    : []
  const filteredCatalogItems = catalogItems
  const catalogTotalPages = Math.max(1, Math.ceil(catalogTotalItemCount / CATALOG_PAGE_SIZE))
  const paginatedCatalogItems = catalogItems
  const selectedCatalogItemMetadata =
    selectedCatalogItem?.metadata && typeof selectedCatalogItem.metadata === 'object' ? selectedCatalogItem.metadata : {}
  const formatUsd = (value) => {
    const amount = Number(value)
    if (!Number.isFinite(amount)) {
      return 'N/A'
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'CAD',
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 2,
    }).format(amount)
  }
  const marketPrice = formatUsd(selectedCatalogItemMetadata.market_price)
  const marketTrendPercent = Number(selectedCatalogItemMetadata.market_trend_percent)
  const marketTrendLabel = Number.isFinite(marketTrendPercent)
    ? `${marketTrendPercent >= 0 ? '+' : ''}${marketTrendPercent.toFixed(1)}%`
    : 'N/A'
  const metric30Day = formatUsd(selectedCatalogItemMetadata.market_30_day_avg)
  const metricAllTimeHigh = formatUsd(selectedCatalogItemMetadata.market_all_time_high)
  const metricLowListing = formatUsd(selectedCatalogItemMetadata.market_low_listing)
  const isCardConditionCategory = CARD_CONDITION_CATEGORIES.has(selectedCatalogItem?.categoryName || '')
  const activeGradingCompany = getGradingCompany(catalogDetailGradingCompany)
  const activeGradeScale = catalogDetailIsGraded && catalogDetailGradingCompany
    ? (GRADING_SCALES[catalogDetailGradingCompany] || [])
    : []
  const activeGradeEntry = activeGradeScale.find((g) => g.value === catalogDetailSelectedGrade) || null
  const isPsaActive = catalogDetailIsGraded && catalogDetailGradingCompany === 'PSA'
  const psaPrestigeScore = isPsaActive ? getGradePrestigeScore('PSA', catalogDetailSelectedGrade) : 0
  const isBgsActive = catalogDetailIsGraded && catalogDetailGradingCompany === 'BGS'
  const bgsAllSubgradesAreTen = isBgsActive && BGS_SUBGRADE_FIELDS.every(
    (f) => catalogDetailBgsSubgrades[f.key] === '10'
  )
  const bgsAllSubgradesSet = isBgsActive && BGS_SUBGRADE_FIELDS.every(
    (f) => catalogDetailBgsSubgrades[f.key] !== ''
  )
  // Auto-promote to BLACK LABEL when all 4 subgrades are 10 and the base grade is 10/BL
  const effectiveBgsGrade = isBgsActive && bgsAllSubgradesSet && bgsAllSubgradesAreTen
    ? 'BL'
    : catalogDetailSelectedGrade
  const effectiveBgsGradeEntry = isBgsActive
    ? (GRADING_SCALES.BGS.find((g) => g.value === effectiveBgsGrade) || activeGradeEntry)
    : null
  const isBgsBlackLabel = isBgsActive && effectiveBgsGrade === 'BL'
  const bgsPrestigeScore = isBgsActive ? getGradePrestigeScore('BGS', effectiveBgsGrade) : 0
  const isCgcActive = catalogDetailIsGraded && catalogDetailGradingCompany === 'CGC'
  const isTAGActive = catalogDetailIsGraded && catalogDetailGradingCompany === 'TAG'
  const tagResolvedScore =
    typeof catalogDetailTagScore === 'string' && catalogDetailTagScore.trim()
      ? catalogDetailTagScore.trim()
      : Number.isFinite(Number(catalogDetailTagScore))
        ? String(catalogDetailTagScore)
        : ''
  const tagScoreEntry = isTAGActive && tagResolvedScore ? getTAGGradeByScore(tagResolvedScore) : null
  const tagDisplayedShortLabel = tagScoreEntry?.shortLabel || activeGradeEntry?.shortLabel || ''
  const storedTagCertNumber =
    typeof selectedCatalogItemMetadata.cert_number === 'string' && selectedCatalogItemMetadata.cert_number.trim()
      ? normalizeTagCert(selectedCatalogItemMetadata.cert_number)
      : ''
  const enteredTagCertNumber =
    typeof catalogDetailCertNumber === 'string' && catalogDetailCertNumber.trim()
      ? normalizeTagCert(catalogDetailCertNumber)
      : ''
  const hasEnteredTagCertNumber = isTAGActive && enteredTagCertNumber.length > 0
  const tagCertMatchesSelectedCard =
    hasEnteredTagCertNumber && storedTagCertNumber && tagCertsLikelyMatch(enteredTagCertNumber, storedTagCertNumber)
  const effectiveTagVerifiedSlab =
    isTAGActive
      ? hasEnteredTagCertNumber
        ? catalogDetailTagVerifiedSlab || (tagCertMatchesSelectedCard ? 'Yes' : 'No')
        : catalogDetailTagVerifiedSlab || 'N/A'
      : catalogDetailTagVerifiedSlab || 'N/A'
  const shouldShowVerifiedTagDig = isTAGActive && hasEnteredTagCertNumber && effectiveTagVerifiedSlab === 'Yes'
  const tagPopReportSearchUrl = enteredTagCertNumber
    ? `https://my.taggrading.com/pop-report?keyword=${encodeURIComponent(enteredTagCertNumber)}`
    : 'https://my.taggrading.com/pop-report'
  const psaCertLookupUrl = catalogDetailCertNumber.trim()
    ? `https://www.psacard.com/cert/${encodeURIComponent(catalogDetailCertNumber.trim())}`
    : 'https://www.psacard.com/cert'
  const bgsCertLookupUrl = catalogDetailCertNumber.trim()
    ? `https://www.beckett.com/grading/card-lookup?item_type=BGS&item_id=${encodeURIComponent(catalogDetailCertNumber.trim())}`
    : 'https://www.beckett.com/grading/card-lookup'
  const cgcCertLookupUrl = catalogDetailCertNumber.trim()
    ? `https://www.cgccards.com/certlookup/${encodeURIComponent(catalogDetailCertNumber.trim())}/`
    : 'https://www.cgccards.com/certlookup/'
  const isSlabActive = isPsaActive || isBgsActive || isCgcActive || isTAGActive
  const conditionOptions = Array.isArray(selectedCatalogItemMetadata.conditions)
    ? selectedCatalogItemMetadata.conditions.filter((item) => typeof item === 'string' && item.trim())
    : isCardConditionCategory
      ? CARD_CONDITION_SCALE
      : []
  const selectedCondition =
    typeof catalogDetailSelectedCondition === 'string' && catalogDetailSelectedCondition.trim()
      ? catalogDetailSelectedCondition
      : typeof selectedCatalogItemMetadata.condition === 'string' && selectedCatalogItemMetadata.condition.trim()
        ? selectedCatalogItemMetadata.condition
        : ''
  const listings = Array.isArray(selectedCatalogItemMetadata.listings)
    ? selectedCatalogItemMetadata.listings.filter((item) => item && typeof item === 'object')
    : []
  const ownedCertEntries = selectedCatalogItem?.id && Array.isArray(ownedCatalogItemCerts[selectedCatalogItem.id])
    ? ownedCatalogItemCerts[selectedCatalogItem.id]
    : []
  const normalizedOwnedCertSet = new Set(
    ownedCertEntries
      .map((entry) => normalizeCertificateNumber(entry?.certNumber || entry?.normalizedCertNumber || ''))
      .filter(Boolean),
  )
  const getListingCertNumber = (listing) => {
    if (!listing || typeof listing !== 'object') {
      return ''
    }

    const raw =
      listing.cert_number ||
      listing.certNumber ||
      listing.certificate_number ||
      listing.certificateNumber ||
      listing.serial ||
      ''

    return typeof raw === 'string' ? raw.trim() : String(raw || '').trim()
  }
  const isListingCertVerified = (listing) => {
    if (!listing || typeof listing !== 'object') {
      return false
    }

    if (Boolean(listing.verified)) {
      return true
    }

    const certNumber = getListingCertNumber(listing)
    if (!certNumber) {
      return false
    }

    return normalizedOwnedCertSet.has(normalizeCertificateNumber(certNumber))
  }
  const certSalesHistory = Array.isArray(selectedCatalogItemMetadata.sales_history)
    ? selectedCatalogItemMetadata.sales_history.filter((entry) => {
        if (!entry || typeof entry !== 'object') {
          return false
        }

        const certNumber =
          entry.cert_number || entry.certNumber || entry.certificate_number || entry.certificateNumber || entry.serial || ''
        return normalizedOwnedCertSet.has(normalizeCertificateNumber(certNumber))
      })
    : []
  const localAvailability = Array.isArray(selectedCatalogItemMetadata.local_availability)
    ? selectedCatalogItemMetadata.local_availability.filter((item) => item && typeof item === 'object')
    : []
  const insights =
    selectedCatalogItemMetadata.collector_insights && typeof selectedCatalogItemMetadata.collector_insights === 'object'
      ? selectedCatalogItemMetadata.collector_insights
      : {}
  const ownershipCountFromStore = selectedCatalogItem?.id ? Number(ownedCatalogItemCounts[selectedCatalogItem.id]) : NaN
  const ownershipCount =
    Number.isFinite(ownershipCountFromStore)
      ? ownershipCountFromStore
      : Number.isFinite(Number(selectedCatalogItemMetadata.ownership_count))
      ? Number(selectedCatalogItemMetadata.ownership_count)
      : 0
  const selectedCatalogAdminCategory =
    catalogAdminCategories.find((category) => category.id === catalogAdminCategoryId) || null
  const selectedCatalogAdminCategoryName = selectedCatalogAdminCategory?.name || ''
  const catalogAdminConditionOptions = CARD_CONDITION_CATEGORIES.has(selectedCatalogAdminCategoryName)
    ? CARD_CONDITION_SCALE
    : []
  const catalogAdminDynamicFieldDefinitions = CATALOG_DYNAMIC_FIELD_DEFINITIONS[selectedCatalogAdminCategoryName] || []
  const catalogAdminPeopleRoles = CATALOG_PEOPLE_ROLES_BY_CATEGORY[selectedCatalogAdminCategoryName] || []
  const catalogAdminShowPeople = catalogAdminPeopleRoles.length > 0
  const catalogAdminShowMinifigs = CATALOG_MINIFIG_CATEGORIES.has(selectedCatalogAdminCategoryName)
  const editableHomeColumns = buildHomeColumns([
    settingsHomeSectionOne,
    settingsHomeSectionTwo,
    settingsHomeSectionThree,
  ], homeSectionOptions)
  const homeColumns = canAccessHomeScreenTab
    ? editableHomeColumns
    : buildHomeColumns(DEFAULT_HOME_SECTIONS, DEFAULT_HOME_SECTIONS)
  const homeSectionOneOptions = homeSectionOptions.filter(
    (sectionName) =>
      sectionName === settingsHomeSectionOne ||
      (sectionName !== settingsHomeSectionTwo && sectionName !== settingsHomeSectionThree),
  )
  const homeSectionTwoOptions = homeSectionOptions.filter(
    (sectionName) =>
      sectionName === settingsHomeSectionTwo ||
      (sectionName !== settingsHomeSectionOne && sectionName !== settingsHomeSectionThree),
  )
  const homeSectionThreeOptions = homeSectionOptions.filter(
    (sectionName) =>
      sectionName === settingsHomeSectionThree ||
      (sectionName !== settingsHomeSectionOne && sectionName !== settingsHomeSectionTwo),
  )
  const homeHeading =
    currentUser && (!canAccessHomeScreenTab || settingsHomeShowGreeting)
      ? `${timeGreeting}, ${topbarUserName}`
      : 'CollectorsHub'
  const settingsTabs = [
    { key: 'profile', label: 'Profile', visible: true },
    { key: 'account', label: 'Account', visible: true },
    { key: 'subscription', label: 'Subscription', visible: true },
    { key: 'privacy', label: 'Privacy', visible: true },
    { key: 'notifications', label: 'Notifications', visible: true },
    { key: 'security', label: 'Security', visible: true },
    { key: 'home_screen', label: 'Home Screen', visible: canAccessHomeScreenTab },
    { key: 'store', label: 'Store', visible: canAccessStoreTab },
    { key: 'locations', label: 'Locations', visible: canAccessLocationsTab },
    { key: 'employees', label: 'Employees', visible: canAccessEmployeesTab },
    { key: 'integrations', label: 'Integrations', visible: canAccessIntegrationsTab },
    { key: 'imports', label: 'Imports', visible: isPlatformAdmin },
  ].filter((tab) => tab.visible)

  const reconcileScheduledChanges = async (rawProfile) => {
    if (!currentUser) {
      return rawProfile
    }

    const periodEnd = rawProfile.subscription_current_period_end
      ? new Date(rawProfile.subscription_current_period_end)
      : null

    if (!periodEnd || Number.isNaN(periodEnd.getTime()) || periodEnd.getTime() > Date.now()) {
      return rawProfile
    }

    const updatePayload = {}
    let nextProfile = rawProfile

    if (rawProfile.cancel_at_period_end && rawProfile.scheduled_downgrade_tier) {
      updatePayload.subscription_tier = rawProfile.scheduled_downgrade_tier
      updatePayload.cancel_at_period_end = false
      updatePayload.scheduled_downgrade_tier = null
      nextProfile = {
        ...nextProfile,
        subscription_tier: rawProfile.scheduled_downgrade_tier,
        cancel_at_period_end: false,
        scheduled_downgrade_tier: null,
      }
    }

    if (rawProfile.cancel_event_addon_at_period_end && rawProfile.has_event_organizer) {
      updatePayload.has_event_organizer = false
      updatePayload.cancel_event_addon_at_period_end = false
      nextProfile = {
        ...nextProfile,
        has_event_organizer: false,
        cancel_event_addon_at_period_end: false,
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return rawProfile
    }

    const isTargetPaid = nextProfile.subscription_tier !== 'free_collector' || Boolean(nextProfile.has_event_organizer)
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updatePayload,
        subscription_started_at: isTargetPaid ? new Date().toISOString() : null,
        subscription_current_period_end: isTargetPaid ? addOneMonthIso() : null,
      })
      .eq('id', currentUser.id)
      .select(profileSelectFields)
      .single()

    if (error) {
      return rawProfile
    }

    if (rawProfile.cancel_at_period_end && rawProfile.scheduled_downgrade_tier && rawProfile.cancel_event_addon_at_period_end) {
      setAuthMessage('Your scheduled subscription changes were applied after your billing period ended.')
    } else if (rawProfile.cancel_at_period_end && rawProfile.scheduled_downgrade_tier) {
      setAuthMessage(`Your subscription changed to ${tierLabels[rawProfile.scheduled_downgrade_tier] || 'Free Collector'} after your billing period ended.`)
    } else if (rawProfile.cancel_event_addon_at_period_end) {
      setAuthMessage('Your Event Organizer add-on ended after your billing period ended.')
    }

    return data
  }

  useEffect(() => {
    let isMounted = true

    const openResetPasswordMode = () => {
      setAuthMode('reset_password')
      setAuthError('')
      setAuthMessage('Set your new password below.')
      setResetPasswordValue('')
      setResetPasswordConfirmValue('')
      setIsAuthOpen(true)
    }

    const clearRecoveryParamsFromUrl = () => {
      if (typeof window === 'undefined') {
        return
      }

      const currentUrl = new URL(window.location.href)
      const paramsToRemove = ['token_hash', 'type', 'code', 'error', 'error_description']
      paramsToRemove.forEach((key) => currentUrl.searchParams.delete(key))
      currentUrl.hash = ''
      window.history.replaceState(null, '', `${currentUrl.pathname}${currentUrl.search}`)
    }

    const consumeRecoveryLinkFromUrl = async () => {
      if (typeof window === 'undefined') {
        return false
      }

      const currentUrl = new URL(window.location.href)
      const hashParams = new URLSearchParams(currentUrl.hash.startsWith('#') ? currentUrl.hash.slice(1) : currentUrl.hash)
      const hashType = hashParams.get('type')
      if (hashType === 'recovery') {
        openResetPasswordMode()
        return true
      }

      const typeParam = currentUrl.searchParams.get('type')
      const tokenHash = currentUrl.searchParams.get('token_hash')
      const code = currentUrl.searchParams.get('code')

      if (typeParam === 'recovery' && tokenHash) {
        const { data, error } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token_hash: tokenHash,
        })

        if (error) {
          setAuthError(error.message || 'Recovery link is invalid or expired.')
          return true
        }

        if (!isMounted) {
          return true
        }

        setCurrentUser(data?.user || data?.session?.user || null)
        openResetPasswordMode()
        clearRecoveryParamsFromUrl()
        return true
      }

      if (typeParam === 'recovery' && code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          setAuthError(error.message || 'Recovery link is invalid or expired.')
          return true
        }

        if (!isMounted) {
          return true
        }

        setCurrentUser(data?.session?.user || null)
        openResetPasswordMode()
        clearRecoveryParamsFromUrl()
        return true
      }

      return false
    }

    const syncSession = async () => {
      await consumeRecoveryLinkFromUrl()

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      if (error) {
        setAuthError(error.message)
        return
      }

      setCurrentUser(session?.user ?? null)
    }

    syncSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null)

      if (event === 'PASSWORD_RECOVERY') {
        openResetPasswordMode()
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) {
        setProfile(null)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(profileSelectFields)
        .eq('id', currentUser.id)
        .maybeSingle()

      if (error) {
        setAuthMessage('Logged in, but profile could not be loaded yet.')
        return
      }

      if (!data) {
        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: currentUser.id,
              email: currentUser.email,
              subscription_tier: 'free_collector',
              has_event_organizer: false,
              billing_cycle: 'monthly',
              cancel_at_period_end: false,
              cancel_event_addon_at_period_end: false,
            },
            { onConflict: 'id' },
          )
          .select(profileSelectFields)
          .single()

        if (insertError) {
          setAuthMessage('Logged in. Profile setup is still pending.')
          return
        }

        setProfile(inserted)
        return
      }

      const normalized = { ...data }
      const correction = {}

      if (normalized.subscription_tier === 'event_organizer') {
        normalized.subscription_tier = 'free_collector'
        normalized.has_event_organizer = true
        correction.subscription_tier = 'free_collector'
        correction.has_event_organizer = true
      }

      if (isBusinessTier(normalized.subscription_tier) && !normalized.has_event_organizer) {
        normalized.has_event_organizer = true
        correction.has_event_organizer = true
      }

      if (!normalized.has_event_organizer && normalized.cancel_event_addon_at_period_end) {
        normalized.cancel_event_addon_at_period_end = false
        correction.cancel_event_addon_at_period_end = false
      }

      const isPaid = isPaidProfile(normalized)
      if (isPaid) {
        if (!normalized.subscription_started_at) {
          const startedAt = new Date().toISOString()
          normalized.subscription_started_at = startedAt
          correction.subscription_started_at = startedAt
        }

        if (!normalized.subscription_current_period_end) {
          const periodEnd = addOneMonthIso(normalized.subscription_started_at)
          normalized.subscription_current_period_end = periodEnd
          correction.subscription_current_period_end = periodEnd
        }
      } else {
        if (normalized.subscription_started_at) {
          normalized.subscription_started_at = null
          correction.subscription_started_at = null
        }

        if (normalized.subscription_current_period_end) {
          normalized.subscription_current_period_end = null
          correction.subscription_current_period_end = null
        }
      }

      if (!normalized.billing_cycle) {
        normalized.billing_cycle = 'monthly'
        correction.billing_cycle = 'monthly'
      }

      if (Object.keys(correction).length === 0) {
        const reconciledProfile = await reconcileScheduledChanges(normalized)
        setProfile(reconciledProfile)
        return
      }

      const { data: correctedData, error: correctionError } = await supabase
        .from('profiles')
        .update(correction)
        .eq('id', currentUser.id)
        .select(profileSelectFields)
        .single()

      if (correctionError) {
        setProfile(normalized)
        return
      }

      const reconciledProfile = await reconcileScheduledChanges(correctedData)
      setProfile(reconciledProfile)
    }

    loadProfile()
  }, [currentUser])

  useEffect(() => {
    const loadPlans = async () => {
      if (currentScreen !== 'plans') {
        return
      }

      setIsPlansLoading(true)
      setPlansError('')

      const { data, error } = await supabase
        .from('subscription_plans')
        .select('tier, display_name, monthly_price_cents, description, features, audience')
        .eq('is_public', true)

      if (error) {
        setPlansError('Could not load subscription plans right now.')
        setIsPlansLoading(false)
        return
      }

      const plansByTier = new Map((data || []).map((plan) => [plan.tier, plan]))
      const orderedPlans = BASE_TIER_ORDER.map((tier) => plansByTier.get(tier)).filter(Boolean)

      setSubscriptionPlans(orderedPlans)
      setIsPlansLoading(false)
    }

    loadPlans()
  }, [currentScreen])

  useEffect(() => {
    const loadCatalogScreenData = async () => {
      if (currentScreen !== 'catalog') {
        return
      }

      setIsCatalogLoading(true)
      setCatalogLoadError('')

      const [categoriesResult, subcategoriesResult, franchisesResult, franchiseBrandsResult, brandsResult] = await Promise.all([
        supabase.from('catalog_categories').select('id, name').eq('is_active', true).order('sort_order').order('name'),
        supabase.from('catalog_subcategories').select('id, name, category_id').eq('is_active', true).order('sort_order').order('name'),
        supabase.from('collectible_sets').select('id, set_name, category_id, subcategory_id, franchise_id').eq('is_active', true).order('sort_order').order('set_name'),
        supabase.from('catalog_franchise_brands').select('id, name').eq('is_active', true).order('sort_order').order('name'),
        supabase.from('catalog_brands').select('id, name').eq('is_active', true).order('name'),
      ])

      const firstError =
        categoriesResult.error ||
        subcategoriesResult.error ||
        franchisesResult.error ||
        franchiseBrandsResult.error ||
        brandsResult.error

      if (firstError) {
        setCatalogLoadError(firstError.message || 'Could not load catalog items.')
        setCatalogCategories([])
        setCatalogSubcategories([])
        setCatalogFranchises([])
        setCatalogFranchiseBrands([])
        setCatalogBrands([])
        setIsCatalogLoading(false)
        return
      }

      setCatalogCategories(categoriesResult.data || [])
      setCatalogSubcategories(subcategoriesResult.data || [])
      setCatalogFranchises(
        Array.isArray(franchisesResult.data)
          ? franchisesResult.data.map((setRecord) => ({
              id: setRecord.id,
              name: setRecord.set_name || '',
              category_id: setRecord.category_id,
              subcategory_id: setRecord.subcategory_id,
              franchise_id: setRecord.franchise_id || null,
            }))
          : [],
      )
      setCatalogFranchiseBrands(franchiseBrandsResult.data || [])
      setCatalogBrands(brandsResult.data || [])
      setIsCatalogLoading(false)
    }

    loadCatalogScreenData()
  }, [catalogReloadToken, currentScreen])

  useEffect(() => {
    const loadCatalogItems = async () => {
      if (currentScreen !== 'catalog') {
        return
      }

      setIsCatalogLoading(true)
      setCatalogLoadError('')

      const queryText = siteSearchQuery.trim()
      const queryStart = (catalogPage - 1) * CATALOG_PAGE_SIZE
      const queryEnd = queryStart + CATALOG_PAGE_SIZE - 1

      let itemsQuery = supabase
        .from('catalog_items')
        .select(
          'id, name, description, release_year, category_id, subcategory_id, collectible_set_id, brand_id, metadata, dynamic_fields',
          { count: 'exact' },
        )
        .eq('is_active', true)

      if (selectedCatalogCategoryRecord) {
        itemsQuery = itemsQuery.eq('category_id', selectedCatalogCategoryRecord.id)
      }

      if (selectedCatalogSubcategoryRecord) {
        itemsQuery = itemsQuery.eq('subcategory_id', selectedCatalogSubcategoryRecord.id)
      }

      if (selectedCatalogFranchiseRecord) {
        if (selectedCatalogFranchiseSetIds.length === 0) {
          setCatalogItems([])
          setCatalogTotalItemCount(0)
          setIsCatalogLoading(false)
          return
        }

        itemsQuery = itemsQuery.in('collectible_set_id', selectedCatalogFranchiseSetIds)
      }

      if (catalogMinYear && Number.isFinite(Number(catalogMinYear))) {
        itemsQuery = itemsQuery.gte('release_year', Number(catalogMinYear))
      }

      if (catalogMaxYear && Number.isFinite(Number(catalogMaxYear))) {
        itemsQuery = itemsQuery.lte('release_year', Number(catalogMaxYear))
      }

      if (queryText) {
        const escapedSearchText = queryText.replace(/[%_]/g, '').trim()
        if (escapedSearchText.length > 1) {
          // Only search if at least 2 chars, and only by name for performance
          itemsQuery = itemsQuery.ilike('name', `%${escapedSearchText}%`)
        }
      }

      if (catalogSortKey === 'newest_year') {
        itemsQuery = itemsQuery.order('release_year', { ascending: false, nullsFirst: false }).order('name', { ascending: true })
      } else {
        itemsQuery = itemsQuery.order('name', { ascending: true })
      }

      let itemsResult
      try {
        itemsResult = await itemsQuery.range(queryStart, queryEnd)
      } catch (err) {
        setCatalogLoadError('Catalog query timed out or failed. Try reducing filters or search terms.')
        setCatalogItems([])
        setCatalogTotalItemCount(0)
        setIsCatalogLoading(false)
        return
      }

      if (itemsResult.error) {
        setCatalogLoadError(itemsResult.error.message || 'Could not load catalog items.')
        setCatalogItems([])
        setCatalogTotalItemCount(0)
        setIsCatalogLoading(false)
        return
      }

      setCatalogItems(itemsResult.data || [])
      setCatalogTotalItemCount(Number(itemsResult.count) || 0)
      setIsCatalogLoading(false)
    }

    loadCatalogItems()
  }, [
    catalogCategory,
    catalogFranchise,
    catalogMaxYear,
    catalogMinYear,
    catalogPage,
    catalogReloadToken,
    catalogSortKey,
    catalogSubcategory,
    currentScreen,
    selectedCatalogCategoryRecord,
    selectedCatalogFranchiseRecord,
    selectedCatalogSubcategoryRecord,
    siteSearchQuery,
  ])

  useEffect(() => {
    if (catalogCategory !== 'all' && !catalogCategoryOptions.includes(catalogCategory)) {
      setCatalogCategory('all')
      setCatalogSubcategory('')
      setCatalogFranchise('all')
      return
    }

    if (catalogSubcategory && !catalogSubcategoryOptions.includes(catalogSubcategory)) {
      setCatalogSubcategory('')
      setCatalogFranchise('all')
      return
    }

    if (catalogFranchise !== 'all' && !catalogFranchiseOptions.includes(catalogFranchise)) {
      setCatalogFranchise('all')
    }
  }, [catalogCategory, catalogCategoryOptions, catalogFranchise, catalogFranchiseOptions, catalogSubcategory, catalogSubcategoryOptions])

  useEffect(() => {
    setCatalogPage(1)
  }, [catalogCategory, catalogSubcategory, catalogFranchise, catalogMinYear, catalogMaxYear, catalogSortKey])

  useEffect(() => {
    if (catalogPage > catalogTotalPages) {
      setCatalogPage(catalogTotalPages)
    }
  }, [catalogPage, catalogTotalPages])

  useEffect(() => {
    const enteredTagCertNumber = normalizeTagCert(catalogDetailCertNumber)
    if (!isTAGActive || !enteredTagCertNumber) {
      setIsCatalogDetailTagLookupLoading(false)
      setCatalogDetailTagLookupError('')
      return
    }

    let isCancelled = false
    const lookupTimer = setTimeout(async () => {
      setIsCatalogDetailTagLookupLoading(true)
      setCatalogDetailTagLookupError('')

      const hydrateTagFromLocalMetadata = () => {
        const metadata = selectedCatalogItem?.metadata && typeof selectedCatalogItem.metadata === 'object'
          ? selectedCatalogItem.metadata
          : {}
        const localCert = normalizeTagCert(metadata.cert_number)
        if (!localCert || !tagCertsLikelyMatch(enteredTagCertNumber, localCert)) {
          return false
        }

        const localScore =
          typeof metadata.tag_score === 'string' && metadata.tag_score.trim()
            ? metadata.tag_score.trim()
            : Number.isFinite(Number(metadata.tag_score))
              ? String(metadata.tag_score)
              : ''
        const localGrade = localScore ? getTAGGradeByScore(localScore) : null

        if (localScore) {
          setCatalogDetailTagScore(localScore)
        }
        if (typeof metadata.tag_population === 'string' && metadata.tag_population.trim()) {
          setCatalogDetailTagPopulation(metadata.tag_population.trim())
        }
        if (typeof metadata.tag_score_rank === 'string' && metadata.tag_score_rank.trim()) {
          setCatalogDetailTagScoreRank(metadata.tag_score_rank.trim())
        }
        if (typeof metadata.tag_dig_report === 'string' && metadata.tag_dig_report.trim()) {
          setCatalogDetailTagDigReport(metadata.tag_dig_report.trim())
        }

        setCatalogDetailTagVerifiedSlab('Yes')
        if (localGrade) {
          setCatalogDetailSelectedGrade(localGrade.value)
        }
        return true
      }

      const runLookup = async (cert) => {
        const response = await fetch(`https://api.taggrading.com/pops?page=1&limit=50&keyword=${encodeURIComponent(cert)}`)
        if (!response.ok) {
          throw new Error(`TAG lookup failed with status ${response.status}`)
        }
        const payload = await response.json()
        return resolveTagLookupResult(payload, cert)
      }

      try {
        let lookup = await runLookup(enteredTagCertNumber)

        // Common confusion: certs can start with a letter that resembles a number.
        if (!lookup && enteredTagCertNumber.length > 1 && enteredTagCertNumber.startsWith('1')) {
          lookup = await runLookup(`H${enteredTagCertNumber.slice(1)}`)
        }

        if (isCancelled) {
          return
        }

        if (!lookup) {
          const hydratedFromLocal = hydrateTagFromLocalMetadata()
          if (hydratedFromLocal) {
            setCatalogDetailTagLookupError('TAG live lookup unavailable. Using local cert data.')
            setIsCatalogDetailTagLookupLoading(false)
            return
          }

          setCatalogDetailTagVerifiedSlab('No')
          setCatalogDetailTagLookupError('No TAG result found for this cert.')
          setIsCatalogDetailTagLookupLoading(false)
          return
        }

        const resolvedScore = lookup.score || ''
        const resolvedGrade = resolvedScore ? getTAGGradeByScore(resolvedScore) : null

        if (resolvedScore) {
          setCatalogDetailTagScore(resolvedScore)
        }
        if (lookup.population) {
          setCatalogDetailTagPopulation(lookup.population)
        }
        if (lookup.rank) {
          setCatalogDetailTagScoreRank(lookup.rank)
        }
        if (lookup.digReport) {
          setCatalogDetailTagDigReport(lookup.digReport)
        }

        setCatalogDetailTagVerifiedSlab('Yes')
        if (resolvedGrade) {
          setCatalogDetailSelectedGrade(resolvedGrade.value)
        }

        setCatalogDetailTagLookupError('')
        setIsCatalogDetailTagLookupLoading(false)
      } catch (error) {
        if (isCancelled) {
          return
        }
        const hydratedFromLocal = hydrateTagFromLocalMetadata()
        if (hydratedFromLocal) {
          setCatalogDetailTagLookupError('Could not reach TAG lookup right now. Using local cert data.')
          setIsCatalogDetailTagLookupLoading(false)
          return
        }

        setCatalogDetailTagVerifiedSlab('No')
        setCatalogDetailTagLookupError('Could not reach TAG lookup right now.')
        setIsCatalogDetailTagLookupLoading(false)
      }
    }, 450)

    return () => {
      isCancelled = true
      clearTimeout(lookupTimer)
    }
  }, [catalogDetailCertNumber, isTAGActive, selectedCatalogItem])

  useEffect(() => {
    const loadCatalogAdminCategories = async () => {
      if (currentScreen !== 'catalog' || !isPlatformAdmin) {
        setCatalogAdminCategories([])
        setCatalogAdminSubcategories([])
        setCatalogAdminFranchises([])
        setCatalogAdminCategoryId('')
        setCatalogAdminSubcategoryId('')
        setCatalogAdminFranchiseId('')
        setCatalogAdminDynamicFields({})
        setCatalogAdminVariants([buildCatalogVariantRow()])
        return
      }

      const { data, error } = await supabase
        .from('catalog_categories')
        .select('id, name')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        setCatalogAdminFormError(error.message || 'Could not load catalog categories.')
        return
      }

      setCatalogAdminCategories(data || [])
      if (!data?.some((category) => category.id === catalogAdminCategoryId)) {
        setCatalogAdminCategoryId('')
        setCatalogAdminSubcategoryId('')
        setCatalogAdminFranchiseId('')
        setCatalogAdminDynamicFields({})
      }
    }

    loadCatalogAdminCategories()
  }, [catalogAdminCategoryId, currentScreen, isPlatformAdmin])

  useEffect(() => {
    setCatalogAdminDynamicFields(buildCatalogDynamicDefaults(selectedCatalogAdminCategoryName))
    setCatalogAdminPeopleRows(buildDefaultCatalogPeopleRows(selectedCatalogAdminCategoryName))
    setCatalogAdminMinifigRows(CATALOG_MINIFIG_CATEGORIES.has(selectedCatalogAdminCategoryName) ? [buildCatalogMinifigRow()] : [])
  }, [selectedCatalogAdminCategoryName])

  useEffect(() => {
    const loadCatalogAdminBrands = async () => {
      if (currentScreen !== 'catalog' || !isPlatformAdmin) {
        setCatalogAdminBrands([])
        return
      }

      const { data } = await supabase
        .from('catalog_brands')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true })

      setCatalogAdminBrands(data || [])
    }

    loadCatalogAdminBrands()
  }, [currentScreen, isPlatformAdmin])

  useEffect(() => {
    const loadExistingPeopleAndMinifigs = async () => {
      if (!isPlatformAdmin) return

      const [peopleResult, minifigResult] = await Promise.all([
        supabase.from('catalog_people').select('id, name').eq('is_active', true).order('name'),
        supabase.from('catalog_minifigures').select('id, name').eq('is_active', true).order('name'),
      ])

      setCatalogAdminExistingPeople(peopleResult.data || [])
      setCatalogAdminExistingMinifigs(minifigResult.data || [])
    }

    loadExistingPeopleAndMinifigs()
  }, [isPlatformAdmin])

  useEffect(() => {
    const loadCatalogAdminSubcategories = async () => {
      if (!isPlatformAdmin || currentScreen !== 'catalog' || !catalogAdminCategoryId) {
        setCatalogAdminSubcategories([])
        setCatalogAdminSubcategoryId('')
        setCatalogAdminFranchises([])
        setCatalogAdminFranchiseId('')
        return
      }

      const { data, error } = await supabase
        .from('catalog_subcategories')
        .select('id, name')
        .eq('category_id', catalogAdminCategoryId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        setCatalogAdminFormError(error.message || 'Could not load catalog subcategories.')
        return
      }

      setCatalogAdminSubcategories(data || [])
      if (!data?.some((subcategory) => subcategory.id === catalogAdminSubcategoryId)) {
        setCatalogAdminSubcategoryId('')
        setCatalogAdminFranchiseId('')
      }
    }

    loadCatalogAdminSubcategories()
  }, [catalogAdminCategoryId, catalogAdminSubcategoryId, currentScreen, isPlatformAdmin])

  useEffect(() => {
    const loadCatalogAdminFranchises = async () => {
      if (!isPlatformAdmin || currentScreen !== 'catalog' || !catalogAdminSubcategoryId) {
        setCatalogAdminFranchises([])
        setCatalogAdminFranchiseId('')
        return
      }

      const { data, error } = await supabase
        .from('collectible_sets')
        .select('id, set_name')
        .eq('subcategory_id', catalogAdminSubcategoryId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('set_name', { ascending: true })

      if (error) {
        setCatalogAdminFormError(error.message || 'Could not load catalog franchises.')
        return
      }

      const normalizedSets = Array.isArray(data)
        ? data.map((setRecord) => ({ id: setRecord.id, name: setRecord.set_name || '' }))
        : []
      setCatalogAdminFranchises(normalizedSets)
      if (!normalizedSets.some((franchise) => franchise.id === catalogAdminFranchiseId)) {
        setCatalogAdminFranchiseId('')
      }
    }

    loadCatalogAdminFranchises()
  }, [catalogAdminSubcategoryId, currentScreen, isPlatformAdmin])

  useEffect(() => {
    if (!authMessage) {
      return
    }

    const timeoutId = setTimeout(() => {
      setAuthMessage('')
    }, 4500)

    return () => clearTimeout(timeoutId)
  }, [authMessage])

  useEffect(() => {
    try {
      const savedSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (!savedSettings) {
        return
      }

      const parsed = JSON.parse(savedSettings)
      setSettingsProfilePhoto(parsed.profilePhoto || '')
      setSettingsUsername(parsed.username || '')
      setSettingsBio(parsed.bio || '')
      setSettingsLocation(parsed.location || '')
      setSearchAreaContext(parsed.searchAreaContext || null)
      setSettingsMailingAddress(parsed.mailingAddress || '')
      setSettingsFavouriteCategories(parsed.favouriteCategories || '')
      setSettingsProfileBanner(parsed.profileBanner || '')
      setSettingsPublicProfileUrl(parsed.publicProfileUrl || '')
      setSettingsLanguage(normalizeLanguage(parsed.language))
      setSettingsTimezone(parsed.timezone || 'America/Halifax')
      setPrivacyPublicProfile(parsed.privacyPublicProfile ?? true)
      setPrivacyShowCollectionValue(parsed.privacyShowCollectionValue ?? true)
      setPrivacyShowWishlist(parsed.privacyShowWishlist ?? true)
      setPrivacyAllowFollowers(parsed.privacyAllowFollowers ?? true)
      setPrivacyShowOnlineStatus(parsed.privacyShowOnlineStatus ?? true)
      setNotificationsDealAlerts(parsed.notificationsDealAlerts ?? true)
      setSettingsCollectionAnalytics(parsed.settingsCollectionAnalytics ?? true)
      setSettingsGradingRecommendations(parsed.settingsGradingRecommendations ?? true)
      setSettingsUnlimitedCollectionFolders(parsed.settingsUnlimitedCollectionFolders ?? true)
      setSettingsPortfolioInsights(parsed.settingsPortfolioInsights ?? true)
      setNotificationsWishlistAlerts(parsed.notificationsWishlistAlerts ?? true)
      setNotificationsStorePromotions(parsed.notificationsStorePromotions ?? true)
      setNotificationsEventReminders(parsed.notificationsEventReminders ?? true)
      setNotificationsEmail(parsed.notificationsEmail ?? true)
      setNotificationsPush(parsed.notificationsPush ?? true)
      setSettingsStoreLogo(parsed.storeLogo || '')
      setSettingsStoreBanner(parsed.storeBanner || '')
      setSettingsStoreHours(parsed.storeHours || '')
      setSettingsStoreAddress(parsed.storeAddress || '')
      setSettingsStoreName(parsed.storeName || '')
      setSettingsStoreDescription(parsed.storeDescription || '')
      setSettingsStoreVisibility(parsed.storeVisibility || 'Public')
      setSettingsInventoryAutoPublish(parsed.inventoryAutoPublish ?? false)
      setSettingsInventoryAllowPurchaseRequests(parsed.inventoryAllowPurchaseRequests ?? false)
      setSettingsInventoryEnableMarketplaceListings(parsed.inventoryEnableMarketplaceListings ?? false)
      setSettingsInventoryEnableEventCreation(parsed.inventoryEnableEventCreation ?? false)
      setSettingsInventoryTrackByLocation(parsed.inventoryTrackByLocation ?? false)
      setSettingsPosConnections(parsed.posConnections || '')
      setSettingsApiKeys(parsed.apiKeys || '')
      setSettingsWebhookSettings(parsed.webhookSettings || '')
      setSettingsConnectedApps(parsed.connectedApps || '')
      setSettingsHomeSectionOne(parsed.homeSectionOne || parsed.homeDefaultPanel || DEFAULT_HOME_SECTIONS[0])
      setSettingsHomeSectionTwo(parsed.homeSectionTwo || DEFAULT_HOME_SECTIONS[1])
      setSettingsHomeSectionThree(parsed.homeSectionThree || DEFAULT_HOME_SECTIONS[2])
      setSettingsHomeShowGreeting(parsed.homeShowGreeting ?? true)
      setSettingsHomeShowEmptyStateHints(parsed.homeShowEmptyStateHints ?? true)
    } catch {
      // Ignore invalid persisted settings and continue with defaults.
    }
  }, [])

  useEffect(() => {
    if (!currentUser?.id) {
      defaultCollectionIdRef.current = ''
      setOwnedCatalogItemCounts({})
      setOwnedCatalogItemCerts({})
      setOwnedCatalogItemPurchases({})
      return
    }

    let isCancelled = false

    const loadOwnedCatalogItems = async () => {
      const { data, error } = await supabase
        .from('owned_copies')
        .select('catalog_item_id, condition, grading_company, grade, cert_number, cert_number_normalized, acquisition_type, purchase_price, box_set_total_price, box_set_item_count, sale_price, metadata, created_at, visibility:sale_status')
        .eq('user_id', currentUser.id)
        .neq('sale_status', 'sold')
        .neq('sale_status', 'archived')

      if (isCancelled) {
        return
      }

      if (error || !Array.isArray(data)) {
        setOwnedCatalogItemCounts({})
        setOwnedCatalogItemCerts({})
        setOwnedCatalogItemPurchases({})
        return
      }

      const nextCounts = {}
      const nextCerts = {}
      const nextPurchases = {}

      data.forEach((item) => {
        const itemId = typeof item?.catalog_item_id === 'string' ? item.catalog_item_id : ''
        if (!itemId) {
          return
        }

        const quantity = Number(item?.quantity)
        const normalizedQuantity = Number.isFinite(quantity) && quantity >= 1 ? Math.floor(quantity) : 1
        nextCounts[itemId] = Number(nextCounts[itemId] || 0) + normalizedQuantity

        const normalizedCertNumber = normalizeCertificateNumber(item?.cert_number_normalized || item?.cert_number)
        if (normalizedCertNumber) {
          const existingCerts = Array.isArray(nextCerts[itemId]) ? nextCerts[itemId] : []
          existingCerts.push({
            certNumber: typeof item?.cert_number === 'string' && item.cert_number.trim()
              ? item.cert_number.trim()
              : normalizedCertNumber,
            normalizedCertNumber,
            gradingCompany: typeof item?.grading_company === 'string' ? item.grading_company : '',
            grade: typeof item?.grade === 'string' ? item.grade : '',
            verified: item?.is_verified !== false,
            addedAt: typeof item?.created_at === 'string' ? item.created_at : '',
          })
          nextCerts[itemId] = existingCerts
        }

        const purchasePrice = Number(item?.purchase_price)
        if (Number.isFinite(purchasePrice) && purchasePrice >= 0) {
          const existingPurchases = Array.isArray(nextPurchases[itemId]) ? nextPurchases[itemId] : []
          for (let index = 0; index < normalizedQuantity; index += 1) {
            existingPurchases.push({
              acquisitionType: typeof item?.acquisition_type === 'string' ? item.acquisition_type : 'direct',
              unitPrice: purchasePrice,
              boxSetTotalPrice: Number.isFinite(Number(item?.box_set_total_price)) ? Number(item.box_set_total_price) : null,
              boxSetItemCount: Number.isFinite(Number(item?.box_set_item_count)) ? Number(item.box_set_item_count) : null,
              purchasedFrom: '',
              certNumber: typeof item?.cert_number === 'string' ? item.cert_number : '',
              gradingCompany: typeof item?.grading_company === 'string' ? item.grading_company : '',
              grade: typeof item?.grade === 'string' ? item.grade : '',
              createdAt: typeof item?.created_at === 'string' ? item.created_at : '',
            })
          }
          nextPurchases[itemId] = existingPurchases
        }
      })

      setOwnedCatalogItemCounts(nextCounts)
      setOwnedCatalogItemCerts(nextCerts)
      setOwnedCatalogItemPurchases(nextPurchases)
    }

    loadOwnedCatalogItems()

    return () => {
      isCancelled = true
    }
  }, [currentUser?.id])

  useEffect(() => {
    if (currentScreen !== 'collection' && currentScreen !== 'collection_item') {
      return
    }

    if (!currentUser?.id) {
      setCollectionItems([])
      setCollectionInventoryRows([])
      setCustomCollections([])
      setStorageLocations([])
      setCollectionItemAssignments([])
      setInventoryItemLocationAssignments([])
      setCollectionLoadError('')
      setIsCollectionLoading(false)
      return
    }

    let isCancelled = false

    const loadCollectionItems = async () => {
      setIsCollectionLoading(true)
      setCollectionLoadError('')

      const [
        collectionRowsResult,
        customCollectionsResult,
        storageLocationsResult,
        collectionItemAssignmentsResult,
        inventoryItemLocationAssignmentsResult,
      ] = await Promise.all([
        supabase
          .from('owned_copies')
        .select('id, catalog_item_id, condition, grading_company, grade, cert_number, cert_number_normalized, acquisition_type, purchase_price, box_set_total_price, box_set_item_count, sale_price, front_image_url, back_image_url, notes, metadata, created_at, visibility:sale_status')
          .eq('user_id', currentUser.id)
          .neq('sale_status', 'sold')
          .neq('sale_status', 'archived')
          .order('created_at', { ascending: false }),
        supabase
          .from('collections')
          .select('id, name, description, is_public, created_at, updated_at')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('storage_locations')
          .select('id, parent_location_id, name, description, created_at, updated_at')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('collection_items')
          .select('id, collection_id, owned_copy_id, inventory_item_id, created_at'),
        supabase
          .from('inventory_item_locations')
          .select('id, owned_copy_id, inventory_item_id, storage_location_id, created_at'),
      ])

      const collectionRows = collectionRowsResult.data
      const collectionRowsError = collectionRowsResult.error
      const customCollectionsRows = Array.isArray(customCollectionsResult.data) ? customCollectionsResult.data : []
      const storageLocationRows = Array.isArray(storageLocationsResult.data) ? storageLocationsResult.data : []
      const collectionItemAssignmentRows = Array.isArray(collectionItemAssignmentsResult.data)
        ? collectionItemAssignmentsResult.data
        : []
      const inventoryItemLocationAssignmentRows = Array.isArray(inventoryItemLocationAssignmentsResult.data)
        ? inventoryItemLocationAssignmentsResult.data
        : []

      if (isCancelled) {
        return
      }

      if (collectionRowsError || !Array.isArray(collectionRows)) {
        setCollectionItems([])
        setCustomCollections(customCollectionsRows)
        setStorageLocations(storageLocationRows)
        setCollectionItemAssignments(collectionItemAssignmentRows)
        setInventoryItemLocationAssignments(inventoryItemLocationAssignmentRows)
        setCollectionLoadError(collectionRowsError?.message || 'Could not load your collection right now.')
        setIsCollectionLoading(false)
        return
      }

      const catalogItemIds = Array.from(
        new Set(
          collectionRows
            .map((row) => (typeof row?.catalog_item_id === 'string' ? row.catalog_item_id : ''))
            .filter(Boolean),
        ),
      )

      let catalogItemsById = {}
      if (catalogItemIds.length > 0) {
        const { data: catalogRows, error: catalogRowsError } = await supabase
          .from('catalog_items')
          .select('id, name, release_year, category_id, subcategory_id, collectible_set_id, metadata, dynamic_fields')
          .in('id', catalogItemIds)

        if (!catalogRowsError && Array.isArray(catalogRows)) {
          catalogItemsById = catalogRows.reduce((accumulator, row) => {
            if (row?.id) {
              accumulator[row.id] = row
            }
            return accumulator
          }, {})
        }
      }

      const [categoriesResult, subcategoriesResult] = await Promise.all([
        supabase.from('catalog_categories').select('id, name').eq('is_active', true),
        supabase.from('catalog_subcategories').select('id, name').eq('is_active', true),
      ])

      const categoryNameById = Array.isArray(categoriesResult.data)
        ? categoriesResult.data.reduce((accumulator, row) => {
            if (row?.id) {
              accumulator[row.id] = row.name || ''
            }
            return accumulator
          }, {})
        : {}

      const subcategoryNameById = Array.isArray(subcategoriesResult.data)
        ? subcategoriesResult.data.reduce((accumulator, row) => {
            if (row?.id) {
              accumulator[row.id] = row.name || ''
            }
            return accumulator
          }, {})
        : {}

      const customCollectionNameById = customCollectionsRows.reduce((accumulator, collectionRow) => {
        if (collectionRow?.id) {
          accumulator[collectionRow.id] = collectionRow.name || 'Unnamed Collection'
        }
        return accumulator
      }, {})

      const locationPathById = buildStorageLocationPathById(storageLocationRows)
      const collectionIdsByInventoryItemId = {}
      collectionItemAssignmentRows.forEach((row) => {
        const inventoryItemId = typeof row?.owned_copy_id === 'string'
          ? row.owned_copy_id
          : typeof row?.inventory_item_id === 'string'
            ? row.inventory_item_id
            : ''
        const collectionId = typeof row?.collection_id === 'string' ? row.collection_id : ''
        if (!inventoryItemId || !collectionId) {
          return
        }

        if (!collectionIdsByInventoryItemId[inventoryItemId]) {
          collectionIdsByInventoryItemId[inventoryItemId] = new Set()
        }
        collectionIdsByInventoryItemId[inventoryItemId].add(collectionId)
      })

      const locationIdsByInventoryItemId = {}
      inventoryItemLocationAssignmentRows.forEach((row) => {
        const inventoryItemId = typeof row?.owned_copy_id === 'string'
          ? row.owned_copy_id
          : typeof row?.inventory_item_id === 'string'
            ? row.inventory_item_id
            : ''
        const locationId = typeof row?.storage_location_id === 'string' ? row.storage_location_id : ''
        if (!inventoryItemId || !locationId) {
          return
        }

        if (!locationIdsByInventoryItemId[inventoryItemId]) {
          locationIdsByInventoryItemId[inventoryItemId] = new Set()
        }
        locationIdsByInventoryItemId[inventoryItemId].add(locationId)
      })

      const enrichedInventoryRows = []

      const aggregatedByCatalogItem = new Map()
      collectionRows.forEach((row) => {
        const catalogItemId = typeof row?.catalog_item_id === 'string' ? row.catalog_item_id : ''
        if (!catalogItemId) {
          return
        }

        const resolvedCatalogItem = catalogItemsById[catalogItemId] || null
        const resolvedMetadata = resolvedCatalogItem?.metadata && typeof resolvedCatalogItem.metadata === 'object'
          ? resolvedCatalogItem.metadata
          : {}
        const resolvedDynamicFields = resolvedCatalogItem?.dynamic_fields && typeof resolvedCatalogItem.dynamic_fields === 'object'
          ? resolvedCatalogItem.dynamic_fields
          : {}

        if (!aggregatedByCatalogItem.has(catalogItemId)) {
          aggregatedByCatalogItem.set(catalogItemId, {
            id: catalogItemId,
            catalogItem: resolvedCatalogItem,
            name: resolvedCatalogItem?.name || 'Unknown Item',
            releaseYear: resolvedCatalogItem?.release_year || null,
            imageUrl: resolvedMetadata.image_url || resolvedDynamicFields.image_url || '',
            totalQuantity: 0,
            totalInvested: 0,
            pricedCopies: 0,
            gradedCopies: 0,
            certCount: 0,
            latestAddedAt: '',
            acquisitionTypes: {},
            inventoryItemIds: [],
            collectionIds: new Set(),
            locationIds: new Set(),
            categoryName: '',
            subcategoryName: '',
            setName: '',
            currentMarketValue: 0,
            profitLoss: 0,
            marketUnitPrice: 0,
          })
        }

        const aggregate = aggregatedByCatalogItem.get(catalogItemId)
        const inventoryItemId = typeof row?.id === 'string' ? row.id : ''
        const quantity = Number(row?.quantity)
        const normalizedQuantity = Number.isFinite(quantity) && quantity >= 1 ? Math.floor(quantity) : 1
        const purchasePrice = Number(row?.purchase_price)
        const certNumber = normalizeCertificateNumber(row?.cert_number_normalized || row?.cert_number)
        const acquisitionType = typeof row?.acquisition_type === 'string' ? row.acquisition_type : 'direct'
        const marketUnitPrice = toFiniteNumber(resolvedMetadata.market_price, 0)
        const investedValue = Number.isFinite(purchasePrice) && purchasePrice >= 0 ? purchasePrice * normalizedQuantity : 0
        const currentMarketValue = marketUnitPrice > 0 ? marketUnitPrice * normalizedQuantity : 0
        const collectionNamesForRow = inventoryItemId && collectionIdsByInventoryItemId[inventoryItemId]
          ? Array.from(collectionIdsByInventoryItemId[inventoryItemId]).map((collectionId) => customCollectionNameById[collectionId]).filter(Boolean)
          : []
        const locationPathsForRow = inventoryItemId && locationIdsByInventoryItemId[inventoryItemId]
          ? Array.from(locationIdsByInventoryItemId[inventoryItemId]).map((locationId) => locationPathById[locationId]).filter(Boolean)
          : []

        enrichedInventoryRows.push({
          id: inventoryItemId,
          catalogItemId,
          name: resolvedCatalogItem?.name || 'Unknown Item',
          quantity: normalizedQuantity,
          condition: typeof row?.condition === 'string' ? row.condition : '',
          gradingCompany: typeof row?.grading_company === 'string' ? row.grading_company : '',
          grade: typeof row?.grade === 'string' ? row.grade : '',
          certNumber: typeof row?.cert_number === 'string' ? row.cert_number : '',
          acquisitionType,
          purchasePrice: Number.isFinite(purchasePrice) ? purchasePrice : null,
          boxSetTotalPrice: Number.isFinite(Number(row?.box_set_total_price)) ? Number(row.box_set_total_price) : null,
          boxSetItemCount: Number.isFinite(Number(row?.box_set_item_count)) ? Number(row.box_set_item_count) : null,
          visibility: typeof row?.visibility === 'string' ? row.visibility : 'private',
          salePrice: Number.isFinite(Number(row?.sale_price)) ? Number(row.sale_price) : null,
          frontImageUrl: typeof row?.front_image_url === 'string' ? row.front_image_url : '',
          backImageUrl: typeof row?.back_image_url === 'string' ? row.back_image_url : '',
          notes: typeof row?.notes === 'string' ? row.notes : '',
          metadata: row?.metadata && typeof row.metadata === 'object' ? row.metadata : {},
          investedValue,
          currentMarketValue,
          profitLoss: currentMarketValue - investedValue,
          categoryName: categoryNameById[resolvedCatalogItem?.category_id] || '',
          subcategoryName: subcategoryNameById[resolvedCatalogItem?.subcategory_id] || '',
          setName: resolvedMetadata.set || resolvedDynamicFields.set || resolvedDynamicFields.series || '',
          createdAt: typeof row?.created_at === 'string' ? row.created_at : '',
          monthBucket: getMonthBucketLabel(row?.created_at),
          collectionNames: collectionNamesForRow,
          locationPaths: locationPathsForRow,
        })

        aggregate.totalQuantity += normalizedQuantity
        aggregate.currentMarketValue += currentMarketValue
        aggregate.profitLoss += currentMarketValue - investedValue
        if (marketUnitPrice > 0) {
          aggregate.marketUnitPrice = marketUnitPrice
        }

        if (Number.isFinite(purchasePrice) && purchasePrice >= 0) {
          aggregate.totalInvested += purchasePrice * normalizedQuantity
          aggregate.pricedCopies += normalizedQuantity
        }

        if (certNumber) {
          aggregate.certCount += 1
        }

        if (typeof row?.grading_company === 'string' && row.grading_company.trim()) {
          aggregate.gradedCopies += normalizedQuantity
        }

        aggregate.acquisitionTypes[acquisitionType] = Number(aggregate.acquisitionTypes[acquisitionType] || 0) + normalizedQuantity

        if (inventoryItemId) {
          aggregate.inventoryItemIds.push(inventoryItemId)

          const assignedCollectionIds = collectionIdsByInventoryItemId[inventoryItemId]
          if (assignedCollectionIds) {
            assignedCollectionIds.forEach((collectionId) => {
              aggregate.collectionIds.add(collectionId)
            })
          }

          const assignedLocationIds = locationIdsByInventoryItemId[inventoryItemId]
          if (assignedLocationIds) {
            assignedLocationIds.forEach((locationId) => {
              aggregate.locationIds.add(locationId)
            })
          }
        }

        aggregate.categoryName = categoryNameById[resolvedCatalogItem?.category_id] || aggregate.categoryName || ''
        aggregate.subcategoryName = subcategoryNameById[resolvedCatalogItem?.subcategory_id] || aggregate.subcategoryName || ''
        aggregate.setName =
          resolvedMetadata.set ||
          resolvedDynamicFields.set ||
          resolvedDynamicFields.series ||
          aggregate.setName ||
          ''

        const createdAt = typeof row?.created_at === 'string' ? row.created_at : ''
        if (!aggregate.latestAddedAt || (createdAt && createdAt > aggregate.latestAddedAt)) {
          aggregate.latestAddedAt = createdAt
        }
      })

      const aggregatedCollectionItems = Array.from(aggregatedByCatalogItem.values()).sort((left, right) => {
        if (right.totalQuantity !== left.totalQuantity) {
          return right.totalQuantity - left.totalQuantity
        }
        return (left.name || '').localeCompare(right.name || '')
      }).map((item) => {
        const collectionNames = Array.from(item.collectionIds)
          .map((collectionId) => customCollectionNameById[collectionId])
          .filter(Boolean)
          .sort((left, right) => left.localeCompare(right))

        const locationPaths = Array.from(item.locationIds)
          .map((locationId) => locationPathById[locationId] || '')
          .filter(Boolean)
          .sort((left, right) => left.localeCompare(right))

        return {
          ...item,
          collectionIds: Array.from(item.collectionIds),
          locationIds: Array.from(item.locationIds),
          collectionNames,
          locationPaths,
          primaryLocationPath: locationPaths[0] || '',
        }
      })

      setCollectionItems(aggregatedCollectionItems)
      setCollectionInventoryRows(enrichedInventoryRows)
      setCustomCollections(customCollectionsRows)
      setStorageLocations(storageLocationRows)
      setCollectionItemAssignments(collectionItemAssignmentRows)
      setInventoryItemLocationAssignments(inventoryItemLocationAssignmentRows)
      setCollectionLoadError('')
      setIsCollectionLoading(false)
    }

    loadCollectionItems()

    return () => {
      isCancelled = true
    }
  }, [collectionReloadToken, currentScreen, currentUser?.id])

  useEffect(() => {
    if (!currentUser?.id) {
      setCollectibleSets([])
      setCollectibleSetEntries([])
      setTrackedCollectionGoals([])
      setSelectedCompletionSetId('')
      return
    }

    let isCancelled = false

    const loadCompletionData = async () => {
      const [collectibleSetsResult, collectibleSetEntriesResult, trackedGoalsResult] = await Promise.all([
        supabase
          .from('collectible_sets')
          .select('id, category_name, subcategory_name, franchise_name, set_name, total_items, total_estimated_value, breakdown, metadata')
          .eq('is_active', true)
          .order('category_name', { ascending: true })
          .order('set_name', { ascending: true }),
        supabase
          .from('collectible_set_entries')
          .select('id, collectible_set_id, catalog_item_id, item_key, item_name, rarity, estimated_market_price, metadata')
          .order('item_key', { ascending: true }),
        supabase
          .from('user_collection_goals')
          .select('id, collection_id, collectible_set_id, title, notes, is_active, created_at')
          .eq('user_id', currentUser.id)
          .eq('goal_type', 'set_completion')
          .not('collectible_set_id', 'is', null)
          .eq('is_active', true)
          .order('created_at', { ascending: true }),
      ])

      if (isCancelled) {
        return
      }

      setCollectibleSets(Array.isArray(collectibleSetsResult.data) ? collectibleSetsResult.data : [])
      setCollectibleSetEntries(Array.isArray(collectibleSetEntriesResult.data) ? collectibleSetEntriesResult.data : [])
      setTrackedCollectionGoals(Array.isArray(trackedGoalsResult.data) ? trackedGoalsResult.data : [])
    }

    loadCompletionData()

    return () => {
      isCancelled = true
    }
  }, [currentUser?.id, goalReloadToken])

  useEffect(() => {
    if (activeCollectionFilter === 'all') {
      return
    }

    const exists = customCollections.some((collection) => collection.id === activeCollectionFilter)
    if (!exists) {
      setActiveCollectionFilter('all')
    }
  }, [activeCollectionFilter, customCollections])

  useEffect(() => {
    if (!activeStorageFilter) {
      return
    }

    const exists = storageLocations.some((location) => location.id === activeStorageFilter)
    if (!exists) {
      setActiveStorageFilter('')
    }
  }, [activeStorageFilter, storageLocations])

  useEffect(() => {
    try {
      const savedRecents = window.localStorage.getItem(DELIVERY_RECENTS_STORAGE_KEY)
      if (!savedRecents) {
        return
      }

      const parsedRecents = JSON.parse(savedRecents)
      if (Array.isArray(parsedRecents)) {
        setRecentDeliveryLocations(parsedRecents.filter((value) => typeof value === 'string' && value.trim()).slice(0, 6))
      }
    } catch {
      // Ignore invalid recent locations and continue with empty defaults.
    }
  }, [])

  useEffect(() => {
    if (!isLocationMenuOpen) {
      setLocationAutocompleteOptions([])
      setIsLocationAutocompleteLoading(false)
      return
    }

    const searchText = customDeliveryLocationInput.trim()
    if (searchText.length < LOCATION_AUTOCOMPLETE_MIN_CHARS) {
      setLocationAutocompleteOptions([])
      setIsLocationAutocompleteLoading(false)
      return
    }

    let isCancelled = false

    const timeoutId = setTimeout(async () => {
      setIsLocationAutocompleteLoading(true)

      try {
        const requestUrl =
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=${LOCATION_COUNTRY_CODES}&dedupe=1&limit=${LOCATION_AUTOCOMPLETE_FETCH_LIMIT}&q=${encodeURIComponent(searchText)}`
        const response = await fetch(requestUrl)
        if (!response.ok) {
          if (!isCancelled) {
            setLocationAutocompleteOptions([])
          }
          return
        }

        const payload = await response.json()
        if (!Array.isArray(payload)) {
          if (!isCancelled) {
            setLocationAutocompleteOptions([])
          }
          return
        }

        const normalizedQuery = searchText.toLowerCase()
        const rankedSuggestions = payload
          .filter((result) => isSupportedSettlementResult(result))
          .map((result) => ({
            result,
            score: scoreSearchAreaResult(result, normalizedQuery),
          }))
          .sort((left, right) => right.score - left.score)
          .map(({ result }) => mapSearchResultToAreaContext(result, searchText))
          .filter(Boolean)

        const dedupedSuggestions = []
        const seenLabels = new Set()
        rankedSuggestions.forEach((item) => {
          if (!item?.label || seenLabels.has(item.label)) {
            return
          }

          seenLabels.add(item.label)
          dedupedSuggestions.push(item)
        })

        if (!isCancelled) {
          setLocationAutocompleteOptions(dedupedSuggestions.slice(0, LOCATION_AUTOCOMPLETE_DISPLAY_LIMIT))
        }
      } catch {
        if (!isCancelled) {
          setLocationAutocompleteOptions([])
        }
      } finally {
        if (!isCancelled) {
          setIsLocationAutocompleteLoading(false)
        }
      }
    }, LOCATION_AUTOCOMPLETE_DEBOUNCE_MS)

    return () => {
      isCancelled = true
      clearTimeout(timeoutId)
    }
  }, [customDeliveryLocationInput, isLocationMenuOpen])

  useEffect(() => {
    const derivedUsername = currentUser?.email?.split('@')[0] || ''
    setSettingsProfilePhoto(profile?.avatar_url || '')
    setSettingsProfilePhotoFile(null)
    setSettingsDisplayName(profile?.display_name || '')
    setSettingsAvatarUrl(profile?.avatar_url || '')
    setSettingsUsername((currentValue) => currentValue || derivedUsername)
    setSettingsError('')
  }, [currentUser?.email, profile?.display_name, profile?.avatar_url])

  useEffect(() => {
    setSettingsPendingEmail(currentUser?.email || '')
  }, [currentUser?.email])

  useEffect(() => {
    if (!canAccessHomeScreenTab) {
      return
    }

    const normalizedSections = buildHomeColumns(
      [settingsHomeSectionOne, settingsHomeSectionTwo, settingsHomeSectionThree],
      homeSectionOptions,
    ).map((column) => column.title)

    if (
      normalizedSections[0] !== settingsHomeSectionOne ||
      normalizedSections[1] !== settingsHomeSectionTwo ||
      normalizedSections[2] !== settingsHomeSectionThree
    ) {
      setSettingsHomeSectionOne(normalizedSections[0])
      setSettingsHomeSectionTwo(normalizedSections[1])
      setSettingsHomeSectionThree(normalizedSections[2])
    }
  }, [
    canAccessHomeScreenTab,
    homeSectionOptions,
    settingsHomeSectionOne,
    settingsHomeSectionTwo,
    settingsHomeSectionThree,
  ])

  useEffect(() => {
    if (activeSettingsTab === 'home_screen' && !canAccessHomeScreenTab) {
      setActiveSettingsTab('profile')
      return
    }

    if (activeSettingsTab === 'store' && !canAccessStoreTab) {
      setActiveSettingsTab('profile')
      return
    }

    if (activeSettingsTab === 'locations' && !canAccessLocationsTab) {
      setActiveSettingsTab('profile')
      return
    }

    if (activeSettingsTab === 'employees' && !canAccessEmployeesTab) {
      setActiveSettingsTab('profile')
      return
    }

    if (activeSettingsTab === 'integrations' && !canAccessIntegrationsTab) {
      setActiveSettingsTab('profile')
      return
    }

    if (activeSettingsTab === 'imports' && !isPlatformAdmin) {
      setActiveSettingsTab('profile')
    }
  }, [activeSettingsTab, canAccessEmployeesTab, canAccessHomeScreenTab, canAccessIntegrationsTab, canAccessLocationsTab, canAccessStoreTab, isPlatformAdmin])

  useEffect(() => {
    const loadOrCreateStore = async () => {
      if (!currentUser?.id || !isStoreOwnerTier) {
        setCurrentStore(null)
        return
      }

      const { data: existingStore, error: readStoreError } = await supabase
        .from('stores')
        .select('id, store_code, store_name, subscription_type, owner_user_id, created_at')
        .eq('owner_user_id', currentUser.id)
        .maybeSingle()

      if (!readStoreError && existingStore) {
        setCurrentStore(existingStore)
        return
      }

      const defaultStoreName = settingsStoreName.trim() || profile?.display_name || 'CollectorsHub Store'
      const { data: insertedStore, error: insertStoreError } = await supabase
        .from('stores')
        .insert({
          owner_user_id: currentUser.id,
          store_name: defaultStoreName,
          subscription_type: hasStoreProAccess ? 'store_plus' : 'store',
        })
        .select('id, store_code, store_name, subscription_type, owner_user_id, created_at')
        .single()

      if (insertStoreError) {
        return
      }

      setCurrentStore(insertedStore)
    }

    loadOrCreateStore()
  }, [currentUser?.id, isStoreOwnerTier, profile?.display_name, profile?.subscription_tier, settingsStoreName])

  useEffect(() => {
    const loadEmployeeAuthContext = async () => {
      if (!currentUser?.id) {
        setEmployeeAuthContext(null)
        return
      }

      const { data, error } = await supabase
        .from('store_employees')
        .select('id, store_id, role, permissions, action_permissions, all_locations, stores(store_code, store_name)')
        .eq('auth_user_id', currentUser.id)
        .eq('status', 'active')
        .maybeSingle()

      if (error || !data) {
        setEmployeeAuthContext(null)
        return
      }

      setEmployeeAuthContext({
        employee_id: data.id,
        store_id: data.store_id,
        role: data.role,
        permissions: data.action_permissions || data.permissions || {},
        all_locations: Boolean(data.all_locations),
        store_code: data.stores?.store_code || '',
        store_name: data.stores?.store_name || '',
      })
    }

    loadEmployeeAuthContext()
  }, [currentUser?.id])

  useEffect(() => {
    const loadStoreLocations = async () => {
      const resolvedStoreId = currentStore?.id || employeeAuthContext?.store_id || null
      if (!currentUser?.id || !canAccessStoreTab || !resolvedStoreId) {
        setStoreLocations([])
        setLocationsError('')
        return
      }

      setIsLocationsLoading(true)
      setLocationsError('')

      const { data, error } = await supabase
        .from('store_locations')
        .select('id, location_name, street_address, city, province, postal_code, phone_number, manager_employee_id, status, created_at')
        .eq('store_id', resolvedStoreId)
        .order('created_at', { ascending: true })

      if (error) {
        setLocationsError(error.message || 'Could not load locations right now.')
        setIsLocationsLoading(false)
        return
      }

      const locations = data || []
      if (isStoreOwnerTier && profile?.subscription_tier === 'store' && locations.length === 0) {
        const { data: insertedLocation, error: insertedLocationError } = await supabase
          .from('store_locations')
          .insert({
            store_owner_id: currentUser.id,
            store_id: resolvedStoreId,
            location_name: settingsStoreName.trim() || DEFAULT_LOCATION_NAME,
            street_address: settingsStoreAddress.trim() || null,
            city: null,
            province: null,
            postal_code: null,
            phone_number: null,
            status: 'active',
          })
          .select('id, location_name, street_address, city, province, postal_code, phone_number, manager_employee_id, status, created_at')
          .single()

        if (!insertedLocationError && insertedLocation) {
          setStoreLocations([insertedLocation])
          setIsLocationsLoading(false)
          return
        }
      }

      setStoreLocations(locations)
      setIsLocationsLoading(false)
    }

    loadStoreLocations()
  }, [canAccessStoreTab, currentUser?.id, currentStore?.id, employeeAuthContext?.store_id, isStoreOwnerTier, profile?.subscription_tier, settingsStoreAddress, settingsStoreName])

  useEffect(() => {
    const loadStoreSettings = async () => {
      const resolvedStoreId = currentStore?.id || employeeAuthContext?.store_id || null
      if (!currentUser?.id || !canAccessStoreTab || !resolvedStoreId) {
        return
      }

      const { data, error } = await supabase
        .from('store_settings')
        .select(
          'store_logo_url, store_banner_url, store_name, store_description, store_address, business_hours, store_visibility, auto_publish_inventory, allow_purchase_requests, enable_marketplace_listings, enable_event_creation, track_inventory_by_location',
        )
        .eq('store_id', resolvedStoreId)
        .maybeSingle()

      if (error || !data) {
        return
      }

      setSettingsStoreLogo(data.store_logo_url || '')
      setSettingsStoreBanner(data.store_banner_url || '')
      setSettingsStoreName(data.store_name || '')
      setSettingsStoreDescription(data.store_description || '')
      setSettingsStoreAddress(data.store_address || '')
      setSettingsStoreHours(data.business_hours || '')
      setSettingsStoreVisibility(data.store_visibility || 'Public')
      setSettingsInventoryAutoPublish(Boolean(data.auto_publish_inventory))
      setSettingsInventoryAllowPurchaseRequests(Boolean(data.allow_purchase_requests))
      setSettingsInventoryEnableMarketplaceListings(Boolean(data.enable_marketplace_listings))
      setSettingsInventoryEnableEventCreation(Boolean(data.enable_event_creation))
      setSettingsInventoryTrackByLocation(Boolean(data.track_inventory_by_location))
    }

    loadStoreSettings()
  }, [canAccessStoreTab, currentUser?.id, currentStore?.id, employeeAuthContext?.store_id])

  useEffect(() => {
    const loadStoreEmployees = async () => {
      const resolvedStoreId = currentStore?.id || employeeAuthContext?.store_id || null
      if (!currentUser?.id || !canAccessEmployeesTab || !resolvedStoreId) {
        setStoreEmployees([])
        setEmployeesError('')
        return
      }

      setIsEmployeesLoading(true)
      setEmployeesError('')

      const { data, error } = await supabase
        .from('store_employees')
        .select('id, first_name, last_name, username, role, status, permissions, action_permissions, all_locations, created_at, store_employee_locations(location_id)')
        .eq('store_id', resolvedStoreId)
        .order('created_at', { ascending: false })

      if (error) {
        setEmployeesError(error.message || 'Could not load employees right now.')
        setIsEmployeesLoading(false)
        return
      }

      setStoreEmployees((data || []).map((employee) => ({
        ...employee,
        permissions: normalizeEmployeePermissions(employee.action_permissions || employee.permissions),
        all_locations: Boolean(employee.all_locations),
        location_ids: normalizeLocationIds((employee.store_employee_locations || []).map((entry) => entry.location_id)),
      })))
      setIsEmployeesLoading(false)
    }

    loadStoreEmployees()
  }, [canAccessEmployeesTab, currentUser?.id, currentStore?.id, employeeAuthContext?.store_id])

  useEffect(() => {
    const refreshTwoFactorStatus = async () => {
      if (!currentUser || !supabase.auth?.mfa?.listFactors) {
        setIsTwoFactorEnabled(false)
        return
      }

      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) {
        setIsTwoFactorEnabled(false)
        return
      }

      const hasVerifiedTotp = (data?.totp || []).some((factor) => factor.status === 'verified')
      setIsTwoFactorEnabled(hasVerifiedTotp)
    }

    refreshTwoFactorStatus()
  }, [currentUser])

  useEffect(() => {
    if (!isUserMenuOpen && !isLanguageMenuOpen && !isLocationMenuOpen) {
      return
    }

    const handleOutsideClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }

      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setIsLanguageMenuOpen(false)
      }

      if (locationMenuRef.current && !locationMenuRef.current.contains(event.target)) {
        setIsLocationMenuOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false)
        setIsLanguageMenuOpen(false)
        setIsLocationMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isUserMenuOpen, isLanguageMenuOpen, isLocationMenuOpen])

  const openAuth = (mode) => {
    setAuthMode(mode)
    setAuthError('')
    setAuthMessage('')
    setResetPasswordValue('')
    setResetPasswordConfirmValue('')
    if (mode === 'pos') {
      setPosStoreCode('')
      setPosUsername('')
      setPosPin('')
    }
    setIsAuthOpen(true)
  }

  const closeAuth = () => {
    setIsAuthOpen(false)
    setPassword('')
    setResetPasswordValue('')
    setResetPasswordConfirmValue('')
    setPosStoreCode('')
    setPosUsername('')
    setPosPin('')
    setAuthError('')
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setAuthError('')
    setAuthMessage('')

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) {
          throw error
        }

        setAuthMessage('Account created. Check your email if confirmation is required.')
        setPassword('')
      } else if (authMode === 'pos') {
        const normalizedStoreCode = posStoreCode.trim()
        const normalizedUsername = posUsername.trim()
        const normalizedPin = posPin.trim()

        if (!normalizedStoreCode || !normalizedUsername || !normalizedPin) {
          throw new Error('Store Code, Username, and PIN are required.')
        }

        // Test store bypass
        if (normalizedStoreCode === '0000' && normalizedUsername === 'TestStoreUser' && normalizedPin === 'Password') {
          setPosSession({ storeName: 'CollectorsHub', storeMode: 'Store OS + marketplace', badge: 'DEMO', username: 'TestStoreUser', storeCode: '0000' })
          closeAuth()
        } else {
          const { data: verifyRows, error: verifyError } = await supabase.rpc('verify_store_employee_pin', {
            p_store_code: normalizedStoreCode,
            p_username: normalizedUsername,
            p_pin: normalizedPin,
          })

          if (verifyError) {
            throw verifyError
          }

          const verified = Array.isArray(verifyRows) ? verifyRows[0] : verifyRows
          if (!verified?.internal_email) {
            throw new Error('Invalid Store Code, Username, or PIN.')
          }

          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: verified.internal_email,
            password: normalizedPin,
          })

          if (loginError) {
            throw loginError
          }

          await supabase.rpc('log_store_employee_action', {
            p_store_id: verified.store_id,
            p_employee_id: verified.employee_id,
            p_action: 'employee_login',
            p_metadata: { login_method: 'store_code_username_pin', username: normalizedUsername },
          })

          setPosSession({ storeName: verified.store_name || 'Store', storeMode: 'Store OS + marketplace', badge: 'LIVE', username: normalizedUsername, storeCode: normalizedStoreCode })
          closeAuth()
        }
      } else if (authMode === 'reset_password') {
        const nextPassword = resetPasswordValue.trim()
        const confirmPassword = resetPasswordConfirmValue.trim()

        if (!nextPassword || !confirmPassword) {
          throw new Error('Enter and confirm your new password.')
        }

        if (nextPassword.length < 6) {
          throw new Error('Password must be at least 6 characters long.')
        }

        if (nextPassword !== confirmPassword) {
          throw new Error('Passwords do not match.')
        }

        const { error } = await supabase.auth.updateUser({ password: nextPassword })
        if (error) {
          throw error
        }

        setAuthMessage('Password updated successfully. You can now log in with your new password.')
        setAuthMode('signin')
        setPassword('')
        setResetPasswordValue('')
        setResetPasswordConfirmValue('')

        if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search)
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          throw error
        }

        setAuthMessage('Logged in successfully.')
        closeAuth()
      }
    } catch (error) {
      setAuthError(error.message || 'Authentication failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotPassword = async () => {
    if (authMode !== 'signin') {
      return
    }

    const normalizedEmail = email.trim()
    if (!normalizedEmail) {
      setAuthError('Enter your email address first to reset your password.')
      setAuthMessage('')
      return
    }

    setIsSubmitting(true)
    setAuthError('')
    setAuthMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/`,
      })

      if (error) {
        throw error
      }

      setAuthMessage('Password reset link sent. Check your email inbox.')
    } catch (error) {
      setAuthError(error.message || 'Could not send password reset email right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    setAuthError('')
    setIsUserMenuOpen(false)
    setCurrentScreen('home')
    setCartItems([])
    const { error } = await supabase.auth.signOut()
    if (error) {
      setAuthError(error.message)
      return
    }

    setAuthMessage('You have logged out.')
  }

  const handleProtectedNavClick = (event) => {
    if (currentUser) {
      return
    }

    event.preventDefault()
    setAuthMessage('Please log in to access that section.')
    openAuth('signin')
  }

  const handleOpenCatalog = (event) => {
    event.preventDefault()
    setCurrentScreen('catalog')
    setSelectedCatalogItem(null)
    setIsUserMenuOpen(false)
    setIsLanguageMenuOpen(false)
    setIsLocationMenuOpen(false)
  }

  const handleSiteSearchSubmit = () => {
    if (!siteSearchQuery.trim()) {
      return
    }

    setCatalogCategory('all')
    setCatalogSubcategory('')
    setCatalogFranchise('all')
    setCatalogMinYear('')
    setCatalogMaxYear('')
    setCatalogPage(1)
    setSelectedCatalogItem(null)
    setCurrentScreen('catalog')
    setIsUserMenuOpen(false)
    setIsLanguageMenuOpen(false)
    setIsLocationMenuOpen(false)
  }

  const handleSiteSearchChange = (nextValue) => {
    setSiteSearchQuery(nextValue)
    setCatalogPage(1)

    if (!nextValue.trim()) {
      return
    }

    setCatalogCategory('all')
    setCatalogSubcategory('')
    setCatalogFranchise('all')
    setCatalogMinYear('')
    setCatalogMaxYear('')
    setSelectedCatalogItem(null)
    setCurrentScreen('catalog')
  }

  const handleOpenCatalogItem = (item) => {
    const categoryName = catalogCategoryById[item.category_id] || 'Uncategorized'
    const subcategoryName = catalogSubcategoryById[item.subcategory_id] || 'Uncategorized'
    const setRecord = catalogSetById[item.collectible_set_id] || null
    const franchiseName = setRecord?.name || catalogFranchiseById[item.collectible_set_id] || 'Unassigned set'
    const franchiseBrandName = setRecord?.franchise_id ? catalogFranchiseBrandById[setRecord.franchise_id] || '' : ''
    const brandName = item.brand_id ? catalogBrandById[item.brand_id] || 'Unknown brand' : ''
    const imageUrl = item?.metadata?.image_url || item?.dynamic_fields?.image_url || ''
    const setName =
      (typeof item?.metadata?.set === 'string' && item.metadata.set.trim()) ||
      (typeof item?.dynamic_fields?.set === 'string' && item.dynamic_fields.set.trim()) ||
      (typeof item?.dynamic_fields?.series === 'string' && item.dynamic_fields.series.trim()) ||
      ''
    const isGradedFromItem =
      typeof item?.metadata?.is_graded === 'boolean'
        ? item.metadata.is_graded
        : typeof item?.dynamic_fields?.is_graded === 'boolean'
          ? item.dynamic_fields.is_graded
          : false
    const gradingCompanyFromItem =
      typeof item?.metadata?.grading_company === 'string' && item.metadata.grading_company.trim()
        ? item.metadata.grading_company.trim()
        : typeof item?.dynamic_fields?.grading_company === 'string' && item.dynamic_fields.grading_company.trim()
          ? item.dynamic_fields.grading_company.trim()
          : ''
    const tagScoreFromItem =
      typeof item?.metadata?.tag_score === 'string' && item.metadata.tag_score.trim()
        ? item.metadata.tag_score.trim()
        : Number.isFinite(Number(item?.metadata?.tag_score))
          ? String(item.metadata.tag_score)
          : typeof item?.dynamic_fields?.tag_score === 'string' && item.dynamic_fields.tag_score.trim()
            ? item.dynamic_fields.tag_score.trim()
            : Number.isFinite(Number(item?.dynamic_fields?.tag_score))
              ? String(item.dynamic_fields.tag_score)
              : ''
    const conditionOptionsFromItem = Array.isArray(item?.metadata?.conditions)
      ? item.metadata.conditions.filter((condition) => typeof condition === 'string' && condition.trim())
      : CARD_CONDITION_CATEGORIES.has(categoryName)
        ? CARD_CONDITION_SCALE
        : []
    const conditionFromItem =
      typeof item?.metadata?.condition === 'string' && item.metadata.condition.trim()
        ? item.metadata.condition.trim()
        : typeof item?.dynamic_fields?.condition === 'string' && item.dynamic_fields.condition.trim()
          ? item.dynamic_fields.condition.trim()
          : conditionOptionsFromItem[0] || ''

    setSelectedCatalogItem({
      ...item,
      categoryName,
      subcategoryName,
      franchiseName,
      franchiseBrandName,
      brandName,
      setName,
      imageUrl,
    })
    setCatalogDetailIsGraded(isGradedFromItem)
    setCatalogDetailSelectedCondition(conditionFromItem)
    const normalizedCompany = normalizeGradingCompany(gradingCompanyFromItem)
    setCatalogDetailGradingCompany(normalizedCompany)
    const gradeFromItem =
      typeof item?.metadata?.grade === 'string' && item.metadata.grade.trim()
        ? item.metadata.grade.trim()
        : typeof item?.dynamic_fields?.grade === 'string' && item.dynamic_fields.grade.trim()
          ? item.dynamic_fields.grade.trim()
          : ''
    const companyScale = GRADING_SCALES[normalizedCompany] || []
    setCatalogDetailSelectedGrade(
      companyScale.some((g) => g.value === gradeFromItem) ? gradeFromItem : ''
    )
    setCatalogDetailCertNumber(
      typeof item?.metadata?.cert_number === 'string' ? item.metadata.cert_number.trim() : ''
    )
    setCatalogDetailTagScore(tagScoreFromItem)
    setCatalogDetailTagDigReport(
      typeof item?.metadata?.tag_dig_report === 'string' ? item.metadata.tag_dig_report.trim() : ''
    )
    setCatalogDetailTagScoreRank(
      typeof item?.metadata?.tag_score_rank === 'string' ? item.metadata.tag_score_rank.trim() : ''
    )
    setCatalogDetailTagPopulation(
      typeof item?.metadata?.tag_population === 'string' ? item.metadata.tag_population.trim() : ''
    )
    setCatalogDetailTagVerifiedSlab(
      typeof item?.metadata?.tag_verified_slab === 'string' ? item.metadata.tag_verified_slab.trim() : ''
    )
    setCatalogDetailTagLookupError('')
    setIsCatalogDetailTagLookupLoading(false)
    if (normalizedCompany === 'TAG') {
      const resolvedTagScore = tagScoreFromItem || ''
      const resolvedTagGrade = resolvedTagScore ? getTAGGradeByScore(resolvedTagScore) : null
      setCatalogDetailTagScore(resolvedTagScore)
      setCatalogDetailSelectedGrade(
        resolvedTagGrade
          ? resolvedTagGrade.value
          : companyScale.some((g) => g.value === gradeFromItem)
          ? gradeFromItem
          : ''
      )
    }
    const subgradesFromItem = item?.metadata?.bgs_subgrades || item?.dynamic_fields?.bgs_subgrades
    setCatalogDetailBgsSubgrades(
      subgradesFromItem && typeof subgradesFromItem === 'object'
        ? {
            centering: subgradesFromItem.centering ?? '',
            corners:   subgradesFromItem.corners   ?? '',
            edges:     subgradesFromItem.edges     ?? '',
            surface:   subgradesFromItem.surface   ?? '',
          }
        : { ...DEFAULT_BGS_SUBGRADES }
    )
    setCurrentScreen('catalog_item')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetAddToCollectionForm = () => {
    setCollectionAcquisitionType('direct')
    setCollectionPurchasePriceInput('')
    setCollectionBoxSetTotalInput('')
    setCollectionBoxSetItemCountInput('')
    setCollectionPurchaseError('')
  }

  const handleOpenAddToCollectionModal = () => {
    resetAddToCollectionForm()
    setIsAddToCollectionModalOpen(true)
  }

  const getOrCreateDefaultCollectionId = async (userId) => {
    if (!userId) {
      throw new Error('You must be signed in to add items to your collection.')
    }

    if (defaultCollectionIdRef.current) {
      return defaultCollectionIdRef.current
    }

    const { data: existingDefaultCollection, error: existingDefaultCollectionError } = await supabase
      .from('collections')
      .select('id')
      .eq('user_id', userId)
      .eq('name', DEFAULT_USER_COLLECTION_NAME)
      .limit(1)
      .maybeSingle()

    if (existingDefaultCollectionError) {
      throw new Error(existingDefaultCollectionError.message || 'Could not load your default collection.')
    }

    if (existingDefaultCollection?.id) {
      defaultCollectionIdRef.current = existingDefaultCollection.id
      return existingDefaultCollection.id
    }

    const { data: insertedCollection, error: insertedCollectionError } = await supabase
      .from('collections')
      .upsert(
        {
          user_id: userId,
          name: DEFAULT_USER_COLLECTION_NAME,
        },
        { onConflict: 'user_id,name' },
      )
      .select('id')
      .single()

    if (insertedCollectionError) {
      throw new Error(insertedCollectionError.message || 'Could not create your default collection.')
    }

    defaultCollectionIdRef.current = insertedCollection.id
    return insertedCollection.id
  }

  const handleAddSelectedCatalogItemToCollection = async (purchaseDetails = null) => {
    if (!selectedCatalogItem?.id || !currentUser?.id) {
      return false
    }

    const normalizedCertNumber = normalizeCertificateNumber(catalogDetailCertNumber)
    const shouldTrackCert = catalogDetailIsGraded && Boolean(normalizedCertNumber)

    const purchasePrice = normalizeNullableNonNegativeNumber(purchaseDetails?.unitPrice)
    const boxSetTotalPrice = normalizeNullableNonNegativeNumber(purchaseDetails?.boxSetTotalPrice)
    const boxSetItemCount = normalizeNullablePositiveInteger(purchaseDetails?.boxSetItemCount)
    const copyCondition = catalogDetailIsGraded && isCardConditionCategory
      ? null
      : selectedCondition || null
    const collectionId = await getOrCreateDefaultCollectionId(currentUser.id)
    const baseItemPayload = {
      collection_id: collectionId,
      user_id: currentUser.id,
      catalog_item_id: selectedCatalogItem.id,
      condition: copyCondition,
      grading_company: catalogDetailIsGraded ? catalogDetailGradingCompany || null : null,
      grade: catalogDetailIsGraded ? catalogDetailSelectedGrade || null : null,
      cert_number: shouldTrackCert ? (catalogDetailCertNumber.trim() || normalizedCertNumber) : null,
      acquisition_type: purchaseDetails?.acquisitionType || 'direct',
      purchase_price: purchasePrice,
      box_set_total_price: boxSetTotalPrice,
      box_set_item_count: boxSetItemCount,
      purchase_date: new Date().toISOString().slice(0, 10),
      metadata: {
        source: 'catalog_add_modal',
      },
    }

    const { error: insertOwnedCopyError } = await supabase
      .from('owned_copies')
      .insert(baseItemPayload)

    if (insertOwnedCopyError) {
      throw new Error(insertOwnedCopyError.message || 'Could not save this copy to your collection.')
    }

    setOwnedCatalogItemCounts((currentCounts) => {
      const currentCount = Number(currentCounts[selectedCatalogItem.id])
      return {
        ...currentCounts,
        [selectedCatalogItem.id]: Number.isFinite(currentCount) ? currentCount + 1 : 1,
      }
    })

    if (shouldTrackCert) {
      setOwnedCatalogItemCerts((currentCerts) => {
        const currentEntries = Array.isArray(currentCerts[selectedCatalogItem.id])
          ? currentCerts[selectedCatalogItem.id]
          : []

        if (currentEntries.some((entry) => normalizeCertificateNumber(entry?.normalizedCertNumber || entry?.certNumber) === normalizedCertNumber)) {
          return currentCerts
        }

        return {
          ...currentCerts,
          [selectedCatalogItem.id]: [
            ...currentEntries,
            {
              certNumber: catalogDetailCertNumber.trim() || normalizedCertNumber,
              normalizedCertNumber,
              gradingCompany: catalogDetailGradingCompany || '',
              grade: catalogDetailSelectedGrade || '',
              verified: true,
              addedAt: new Date().toISOString(),
              purchasePrice: purchaseDetails && Number.isFinite(Number(purchaseDetails.unitPrice)) ? Number(purchaseDetails.unitPrice) : null,
              acquisitionType: purchaseDetails?.acquisitionType || '',
            },
          ],
        }
      })
    }

    if (purchaseDetails && Number.isFinite(Number(purchaseDetails.unitPrice)) && Number(purchaseDetails.unitPrice) >= 0) {
      setOwnedCatalogItemPurchases((currentPurchases) => {
        const currentEntries = Array.isArray(currentPurchases[selectedCatalogItem.id])
          ? currentPurchases[selectedCatalogItem.id]
          : []

        return {
          ...currentPurchases,
          [selectedCatalogItem.id]: [
            ...currentEntries,
            {
              acquisitionType: purchaseDetails.acquisitionType,
              unitPrice: Number(purchaseDetails.unitPrice),
              boxSetTotalPrice: normalizeNullableNonNegativeNumber(purchaseDetails.boxSetTotalPrice),
              boxSetItemCount: normalizeNullablePositiveInteger(purchaseDetails.boxSetItemCount),
              purchasedFrom: purchaseDetails.purchasedFrom || '',
              certNumber: catalogDetailCertNumber.trim(),
              gradingCompany: catalogDetailGradingCompany || '',
              grade: catalogDetailSelectedGrade || '',
              createdAt: new Date().toISOString(),
            },
          ],
        }
      })
    }

    return true
  }

  const handleConfirmAddToCollection = async () => {
    if (!selectedCatalogItem || isSavingCollectionItem) {
      return
    }

    let unitPrice = null
    let boxSetTotalPrice = null
    let boxSetItemCount = null

    if (collectionAcquisitionType === 'gift') {
      unitPrice = 0
    } else if (collectionAcquisitionType === 'box_set') {
      const total = Number(collectionBoxSetTotalInput)
      const count = Number(collectionBoxSetItemCountInput)
      if (!Number.isFinite(total) || total < 0) {
        setCollectionPurchaseError('Enter a valid box set total price.')
        return
      }
      if (!Number.isFinite(count) || count <= 0) {
        setCollectionPurchaseError('Enter how many cards were in the box set.')
        return
      }
      unitPrice = total / count
      boxSetTotalPrice = total
      boxSetItemCount = count
    } else {
      const typedPrice = Number(collectionPurchasePriceInput)
      if (!Number.isFinite(typedPrice) || typedPrice < 0) {
        setCollectionPurchaseError('Enter a valid purchase price.')
        return
      }
      unitPrice = typedPrice
    }

    setCollectionPurchaseError('')
    setIsSavingCollectionItem(true)

    try {
      const didSave = await handleAddSelectedCatalogItemToCollection({
        acquisitionType: collectionAcquisitionType,
        unitPrice,
        boxSetTotalPrice,
        boxSetItemCount,
        purchasedFrom: '',
      })

      if (!didSave) {
        setCollectionPurchaseError('Could not add this item right now. Please try again.')
        return
      }

      setIsAddToCollectionModalOpen(false)
      resetAddToCollectionForm()
    } catch (error) {
      setCollectionPurchaseError(error?.message || 'Could not save this item to your collection right now.')
    } finally {
      setIsSavingCollectionItem(false)
    }
  }

  const handleOpenCollectionHome = (event) => {
    if (!currentUser) {
      handleProtectedNavClick(event)
      return
    }

    event.preventDefault()
    setCurrentScreen('collection')
    setIsUserMenuOpen(false)
  }

  const handleOpenCollectionItemDetails = (item) => {
    if (!item?.id) {
      return
    }

    setSelectedCollectionItemDetailsId(item.id)
    setSelectedCollectionCopyIndex(0)
    setCollectionCopySalePriceInput('')
    setCollectionItemDetailActionError('')
    setCollectionItemDetailActionMessage('')
    setCurrentScreen('collection_item')
  }

  const handleBackToCollection = () => {
    setCurrentScreen('collection')
  }

  const handleUploadCollectionCopyImage = async (event, photoSide = 'front') => {
    const file = event?.target?.files?.[0]
    if (event?.target) {
      event.target.value = ''
    }

    if (!file || !currentUser?.id || !selectedCollectionCopyRow?.id) {
      return
    }

    if (!file.type?.startsWith('image/')) {
      setCollectionItemDetailActionError('Please choose an image file.')
      setCollectionItemDetailActionMessage('')
      return
    }

    setIsUploadingCollectionCopyImage(true)
    setCollectionItemDetailActionError('')
    setCollectionItemDetailActionMessage('')

    try {
      const normalizedPhotoSide = photoSide === 'back' ? 'back' : 'front'
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${Date.now()}-${selectedCollectionCopyRow.id}-${normalizedPhotoSide}.${extension}`
      const filePath = `${currentUser.id}/collection-cards/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profile-media')
        .upload(filePath, file, { upsert: false, contentType: file.type || undefined })

      if (uploadError) {
        throw uploadError
      }

      const { data: publicUrlData } = supabase.storage.from('profile-media').getPublicUrl(filePath)
      const imageUrl = publicUrlData?.publicUrl || ''

      if (!imageUrl) {
        throw new Error('Could not resolve uploaded image URL.')
      }

      const imageColumn = normalizedPhotoSide === 'back' ? 'back_image_url' : 'front_image_url'

      const { error: updateError } = await supabase
        .from('owned_copies')
        .update({ [imageColumn]: imageUrl })
        .eq('id', selectedCollectionCopyRow.id)
        .eq('user_id', currentUser.id)

      if (updateError) {
        throw updateError
      }

      setCollectionItemDetailActionMessage(`${normalizedPhotoSide === 'back' ? 'Back' : 'Front'} photo uploaded.`)
      setCollectionReloadToken((currentToken) => currentToken + 1)
    } catch (error) {
      setCollectionItemDetailActionError(error?.message || 'Could not upload card photo right now.')
    } finally {
      setIsUploadingCollectionCopyImage(false)
    }
  }

  const handleListSelectedCollectionCopyForSale = async () => {
    if (!currentUser?.id || !selectedCollectionCopyRow?.id || isListingCollectionCopyForSale) {
      return
    }

    if (!canListSelectedCollectionCopy) {
      setCollectionItemDetailActionError('Complete the listing requirements before listing this copy for sale.')
      setCollectionItemDetailActionMessage('')
      return
    }

    const typedPrice = Number(collectionCopySalePriceInput)
    if (!Number.isFinite(typedPrice) || typedPrice < 0) {
      setCollectionItemDetailActionError('Enter a valid sale price.')
      setCollectionItemDetailActionMessage('')
      return
    }

    setIsListingCollectionCopyForSale(true)
    setCollectionItemDetailActionError('')
    setCollectionItemDetailActionMessage('')

    try {
      const nextMetadata = {
        ...(selectedCollectionCopyMetadata || {}),
        listed_for_sale: true,
        listed_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('owned_copies')
        .update({
          sale_status: 'listed',
          sale_price: typedPrice,
          metadata: nextMetadata,
        })
        .eq('id', selectedCollectionCopyRow.id)
        .eq('user_id', currentUser.id)

      if (error) {
        throw error
      }

      setCollectionItemDetailActionMessage('Copy listed for sale.')
      setCollectionReloadToken((currentToken) => currentToken + 1)
    } catch (error) {
      setCollectionItemDetailActionError(error?.message || 'Could not list this copy for sale right now.')
    } finally {
      setIsListingCollectionCopyForSale(false)
    }
  }

  const handleSetCatalogAdminDynamicField = (fieldKey, nextValue) => {
    setCatalogAdminDynamicFields((currentFields) => ({
      ...currentFields,
      [fieldKey]: nextValue,
    }))
    setCatalogAdminFormError('')
  }

  const handleAddCatalogVariant = () => {
    setCatalogAdminVariants((currentVariants) => [...currentVariants, buildCatalogVariantRow()])
  }

  const handleRemoveCatalogVariant = (variantIndex) => {
    setCatalogAdminVariants((currentVariants) => {
      if (currentVariants.length <= 1) {
        return [buildCatalogVariantRow()]
      }

      return currentVariants.filter((_, index) => index !== variantIndex)
    })
  }

  const handleSetCatalogVariantField = (variantIndex, fieldName, value) => {
    setCatalogAdminVariants((currentVariants) =>
      currentVariants.map((variant, index) =>
        index === variantIndex
          ? { ...variant, [fieldName]: value }
          : variant,
      ),
    )
    setCatalogAdminFormError('')
  }

  const handleAddCatalogPeopleRow = () => {
    const defaultRole = catalogAdminPeopleRoles[0] || ''
    setCatalogAdminPeopleRows((rows) => [...rows, buildCatalogPeopleRow(defaultRole)])
  }

  const handleRemoveCatalogPeopleRow = (index) => {
    setCatalogAdminPeopleRows((rows) => rows.filter((_, i) => i !== index))
  }

  const handleSetCatalogPeopleRowField = (index, field, value) => {
    setCatalogAdminPeopleRows((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    )
  }

  const handleAddCatalogMinifigRow = () => {
    setCatalogAdminMinifigRows((rows) => [...rows, buildCatalogMinifigRow()])
  }

  const handleRemoveCatalogMinifigRow = (index) => {
    setCatalogAdminMinifigRows((rows) => rows.filter((_, i) => i !== index))
  }

  const handleSetCatalogMinifigRowField = (index, field, value) => {
    setCatalogAdminMinifigRows((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    )
  }

  const handleCreateCatalogSubcategory = async () => {
    const name = catalogAdminNewSubcategoryName.trim()
    if (!name || !catalogAdminCategoryId) return
    setCatalogAdminIsSavingSubcategory(true)
    setCatalogAdminFormError('')
    const { data, error } = await supabase
      .from('catalog_subcategories')
      .insert({ name, category_id: catalogAdminCategoryId, is_active: true })
      .select('id')
      .single()
    if (error) {
      setCatalogAdminFormError(error.message || 'Could not create subcategory.')
      setCatalogAdminIsSavingSubcategory(false)
      return
    }
    const newSub = { id: data.id, name, category_id: catalogAdminCategoryId }
    setCatalogAdminSubcategories(prev => [...prev, newSub].sort((a, b) => a.name.localeCompare(b.name)))
    setCatalogAdminSubcategoryId(data.id)
    setCatalogAdminNewSubcategoryName('')
    setCatalogAdminIsCreatingSubcategory(false)
    setCatalogAdminIsSavingSubcategory(false)
  }

  const handleCreateCatalogFranchise = async () => {
    const name = catalogAdminNewFranchiseName.trim()
    if (!name || !catalogAdminCategoryId || !catalogAdminSubcategoryId) return

    setCatalogAdminIsSavingFranchise(true)
    setCatalogAdminFormError('')

    const { data: newId, error } = await supabase.rpc('upsert_catalog_collectible_set', {
      p_category_id: catalogAdminCategoryId,
      p_subcategory_id: catalogAdminSubcategoryId,
      p_set_name: name,
      p_franchise_id: null,
    })

    if (error) {
      setCatalogAdminFormError(error.message || 'Could not create franchise.')
      setCatalogAdminIsSavingFranchise(false)
      return
    }

    const newFranchise = { id: newId, name }
    setCatalogAdminFranchises((current) => {
      const exists = current.some((f) => f.id === newId)
      return exists
        ? current.map((f) => (f.id === newId ? newFranchise : f))
        : [...current, newFranchise].sort((a, b) => a.name.localeCompare(b.name))
    })
    setCatalogAdminFranchiseId(newId)
    setCatalogAdminNewFranchiseName('')
    setCatalogAdminIsCreatingFranchise(false)
    setCatalogAdminIsSavingFranchise(false)
  }

  const handleCreateCatalogBrand = async () => {
    const name = catalogAdminNewBrandName.trim()
    if (!name) return

    setCatalogAdminIsSavingBrand(true)
    setCatalogAdminFormError('')

    const { data: newId, error } = await supabase.rpc('upsert_catalog_brand', {
      p_name: name,
    })

    if (error) {
      setCatalogAdminFormError(error.message || 'Could not create brand.')
      setCatalogAdminIsSavingBrand(false)
      return
    }

    const newBrand = { id: newId, name }
    setCatalogAdminBrands((current) => {
      const exists = current.some((b) => b.id === newId)
      return exists
        ? current.map((b) => (b.id === newId ? newBrand : b))
        : [...current, newBrand].sort((a, b) => a.name.localeCompare(b.name))
    })
    setCatalogAdminBrandId(newId)
    setCatalogAdminNewBrandName('')
    setCatalogAdminIsCreatingBrand(false)
    setCatalogAdminIsSavingBrand(false)
  }

  const handleCreateCatalogItemInApp = async (event) => {
    event.preventDefault()

    if (!isPlatformAdmin) {
      setCatalogAdminFormError(t('adminItemCreateFailed'))
      return
    }

    if (!catalogAdminCategoryId || !catalogAdminSubcategoryId || !catalogAdminFranchiseId) {
      setCatalogAdminFormError(t('selectFranchiseFirstAdmin'))
      return
    }

    const normalizedName = catalogAdminItemName.trim()
    if (!normalizedName) {
      setCatalogAdminFormError(t('itemNameLabel'))
      return
    }

    if (catalogAdminItemImageFile && !['image/jpeg', 'image/jpg'].includes((catalogAdminItemImageFile.type || '').toLowerCase())) {
      setCatalogAdminFormError(t('jpegOnlyError'))
      return
    }

    setCatalogAdminFormError('')
    setIsCreatingCatalogItem(true)

    const releaseYear = catalogAdminItemYear.trim() ? Number(catalogAdminItemYear.trim()) : null
    let uploadedItemImageUrl = null

    try {
      if (catalogAdminItemImageFile) {
        uploadedItemImageUrl = await uploadSettingsImage(catalogAdminItemImageFile, 'catalog-item')
      }
    } catch (error) {
      setCatalogAdminFormError(error.message || t('adminItemCreateFailed'))
      setIsCreatingCatalogItem(false)
      return
    }

    const itemMetadata = uploadedItemImageUrl
      ? { image_url: uploadedItemImageUrl }
      : {}

    const normalizedVariants = catalogAdminVariants
      .map((variant) => ({
        name: (variant.name || '').trim(),
        sku: (variant.sku || '').trim(),
        identifier: (variant.identifier || '').trim(),
        condition: (variant.condition || '').trim(),
      }))
      .filter((variant) => variant.name || variant.sku || variant.identifier || variant.condition)

    itemMetadata.identifier = catalogAdminItemIdentifier.trim() || null
    itemMetadata.status = catalogAdminStatus
    itemMetadata.dynamic_fields = catalogAdminDynamicFields
    itemMetadata.variants = normalizedVariants

    const { data: createdItem, error } = await supabase.rpc('create_catalog_item_direct', {
      p_category_id: catalogAdminCategoryId,
      p_subcategory_id: catalogAdminSubcategoryId,
      p_collectible_set_id: catalogAdminFranchiseId,
      p_item_name: normalizedName,
      p_release_year: Number.isFinite(releaseYear) ? releaseYear : null,
      p_description: catalogAdminItemDescription.trim() || null,
      p_brand_id: catalogAdminBrandId || null,
      p_metadata: itemMetadata,
    })

    if (error) {
      setCatalogAdminFormError(error.message || t('adminItemCreateFailed'))
      setIsCreatingCatalogItem(false)
      return
    }

    const createdItemId = Array.isArray(createdItem) ? createdItem[0]?.id : createdItem?.id
    let variantSaveFailed = false
    let peopleSaveFailed = false
    let minifigSaveFailed = false

    if (createdItemId && normalizedVariants.length > 0) {
      const { error: variantsError } = await supabase.rpc('replace_catalog_item_variants', {
        p_item_id: createdItemId,
        p_variants: normalizedVariants,
      })
      if (variantsError) variantSaveFailed = true
    }

    // Save people credits
    const normalizedPeopleByPerson = {}
    for (const row of catalogAdminPeopleRows) {
      const name = (row.name || '').trim()
      if (!name) continue
      if (!normalizedPeopleByPerson[name]) normalizedPeopleByPerson[name] = { name, roles: [], notes: row.notes || '' }
      if (row.role) normalizedPeopleByPerson[name].roles.push(row.role)
    }
    const normalizedPeople = Object.values(normalizedPeopleByPerson)
    if (createdItemId && normalizedPeople.length > 0) {
      const { error: peopleError } = await supabase.rpc('replace_catalog_item_people', {
        p_item_id: createdItemId,
        p_people: normalizedPeople,
      })
      if (peopleError) peopleSaveFailed = true
    }

    // Save minifigures (Building Blocks only)
    const normalizedMinifigs = catalogAdminMinifigRows
      .map((row) => ({
        name: (row.name || '').trim(),
        quantity: Number(row.quantity) > 0 ? Number(row.quantity) : 1,
        identifier: (row.identifier || '').trim() || null,
        theme: (row.theme || '').trim() || null,
      }))
      .filter((row) => row.name)
    if (createdItemId && normalizedMinifigs.length > 0) {
      const { error: minifigError } = await supabase.rpc('replace_catalog_item_minifigures', {
        p_item_id: createdItemId,
        p_minifigures: normalizedMinifigs,
      })
      if (minifigError) minifigSaveFailed = true
    }

    setCatalogAdminItemName('')
    setCatalogAdminItemYear('')
    setCatalogAdminItemDescription('')
    setCatalogAdminItemIdentifier('')
    setCatalogAdminStatus('draft')
    setCatalogAdminDynamicFields(buildCatalogDynamicDefaults(selectedCatalogAdminCategoryName))
    setCatalogAdminVariants([buildCatalogVariantRow()])
    setCatalogAdminItemImageFile(null)
    setCatalogAdminBrandId('')
    setCatalogAdminNewBrandName('')
    setCatalogAdminIsCreatingBrand(false)
    setCatalogAdminNewFranchiseName('')
    setCatalogAdminIsCreatingFranchise(false)
    setCatalogAdminPeopleRows(buildDefaultCatalogPeopleRows(selectedCatalogAdminCategoryName))
    setCatalogAdminMinifigRows(CATALOG_MINIFIG_CATEGORIES.has(selectedCatalogAdminCategoryName) ? [buildCatalogMinifigRow()] : [])
    setIsCatalogItemModalOpen(false)
    setCatalogReloadToken((currentToken) => currentToken + 1)

    const warnings = [
      variantSaveFailed && t('adminItemCreatedVariantWarning'),
      peopleSaveFailed && t('adminItemCreatedPeopleWarning'),
      minifigSaveFailed && t('adminItemCreatedMinifigWarning'),
    ].filter(Boolean)
    setAuthMessage(warnings.length > 0 ? warnings.join(' ') : t('adminItemCreated'))
    setIsCreatingCatalogItem(false)
  }

  const handleMenuAction = (label) => {
    if (label === 'Settings') {
      setCurrentScreen('settings')
      setSettingsError('')
      setIsUserMenuOpen(false)
      return
    }

    setAuthMessage(`${label} is coming soon.`)
    setIsUserMenuOpen(false)
  }

  const handleOpenSettings = () => {
    setCurrentScreen('settings')
    setSettingsError('')
    setActiveSettingsTab('profile')
    setIsUserMenuOpen(false)
  }

  const addPlanToCart = (plan) => {
    setCartItems((currentItems) => {
      if (currentItems.some((item) => item.tier === plan.tier)) {
        return currentItems
      }

      const hasCollectorPlusSelected =
        plan.tier === 'collector_plus' || currentItems.some((item) => item.tier === 'collector_plus')
      const effectivePriceCents =
        plan.tier === 'event_organizer' && hasCollectorPlusSelected ? 1000 : plan.monthly_price_cents

      return [
        ...currentItems,
        {
          tier: plan.tier,
          display_name: plan.display_name,
          monthly_price_cents: effectivePriceCents,
        },
      ].map((item) =>
        item.tier === 'event_organizer' && hasCollectorPlusSelected
          ? { ...item, monthly_price_cents: 1000 }
          : item,
      )
    })

    setAuthMessage(`${plan.display_name} added to cart.`)
  }

  const removePlanFromCart = (tier) => {
    setCartItems((currentItems) => currentItems.filter((item) => item.tier !== tier))
  }

  const handleOpenCart = () => {
    setCurrentScreen('cart')
    setIsUserMenuOpen(false)
  }

  const handleCloseCart = () => {
    setCurrentScreen('plans')
  }

  const persistSettingsLocally = (overrides = {}) => {
    const payload = {
      profilePhoto: settingsProfilePhoto,
      username: settingsUsername,
      bio: settingsBio,
      location: settingsLocation,
      searchAreaContext,
      mailingAddress: settingsMailingAddress,
      favouriteCategories: settingsFavouriteCategories,
      profileBanner: settingsProfileBanner,
      publicProfileUrl: settingsPublicProfileUrl,
      language: settingsLanguage,
      timezone: settingsTimezone,
      privacyPublicProfile,
      privacyShowCollectionValue,
      privacyShowWishlist,
      privacyAllowFollowers,
      privacyShowOnlineStatus,
      notificationsDealAlerts,
      settingsCollectionAnalytics,
      settingsGradingRecommendations,
      settingsUnlimitedCollectionFolders,
      settingsPortfolioInsights,
      notificationsWishlistAlerts,
      notificationsStorePromotions,
      notificationsEventReminders,
      notificationsEmail,
      notificationsPush,
      storeLogo: settingsStoreLogo,
      storeBanner: settingsStoreBanner,
      storeName: settingsStoreName,
      storeDescription: settingsStoreDescription,
      storeHours: settingsStoreHours,
      storeAddress: settingsStoreAddress,
      storeVisibility: settingsStoreVisibility,
      inventoryAutoPublish: settingsInventoryAutoPublish,
      inventoryAllowPurchaseRequests: settingsInventoryAllowPurchaseRequests,
      inventoryEnableMarketplaceListings: settingsInventoryEnableMarketplaceListings,
      inventoryEnableEventCreation: settingsInventoryEnableEventCreation,
      inventoryTrackByLocation: settingsInventoryTrackByLocation,
      posConnections: settingsPosConnections,
      apiKeys: settingsApiKeys,
      webhookSettings: settingsWebhookSettings,
      connectedApps: settingsConnectedApps,
      homeSectionOne: settingsHomeSectionOne,
      homeSectionTwo: settingsHomeSectionTwo,
      homeSectionThree: settingsHomeSectionThree,
      homeShowGreeting: settingsHomeShowGreeting,
      homeShowEmptyStateHints: settingsHomeShowEmptyStateHints,
      ...overrides,
    }

    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Ignore storage errors and continue.
    }
  }

  const handleLanguageChange = (nextLanguage) => {
    const normalizedLanguage = normalizeLanguage(nextLanguage)
    setSettingsLanguage(normalizedLanguage)
    setIsLanguageMenuOpen(false)
    persistSettingsLocally({ language: normalizedLanguage })
  }

  const pushRecentDeliveryLocation = (locationLabel) => {
    const normalizedLocation = (locationLabel || '').trim()
    if (!normalizedLocation) {
      return
    }

    setRecentDeliveryLocations((currentRecents) => {
      const nextRecents = [normalizedLocation, ...currentRecents.filter((value) => value !== normalizedLocation)].slice(0, 6)

      try {
        window.localStorage.setItem(DELIVERY_RECENTS_STORAGE_KEY, JSON.stringify(nextRecents))
      } catch {
        // Ignore storage errors and continue.
      }

      return nextRecents
    })
  }

  const applySearchAreaSelection = (locationLabel, resolvedContext = null) => {
    const normalizedLocation = (locationLabel || '').trim()
    if (!normalizedLocation) {
      return
    }

    setSettingsLocation(normalizedLocation)
    setSearchAreaContext(resolvedContext)
    setIsLocationMenuOpen(false)
    setCustomDeliveryLocationInput('')
    setLocationAutocompleteOptions([])
    pushRecentDeliveryLocation(normalizedLocation)
    persistSettingsLocally({
      location: normalizedLocation,
      searchAreaContext: resolvedContext,
    })
  }

  const handleSelectAutocompleteArea = (areaOption) => {
    if (!areaOption?.label) {
      return
    }

    applySearchAreaSelection(areaOption.label, areaOption)
    setLocationDetectError('')
  }

  const detectCurrentDeliveryLocation = async () => {
    if (!navigator.geolocation) {
      setLocationDetectError(t('locationDetectFailed'))
      return
    }

    setIsDetectingLocation(true)
    setLocationDetectError('')

    const getPosition = () =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        })
      })

    try {
      const position = await getPosition()
      const latitude = position?.coords?.latitude
      const longitude = position?.coords?.longitude
      const accuracyMeters = position?.coords?.accuracy

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error('invalid_coords')
      }

      if (Number.isFinite(accuracyMeters) && accuracyMeters > MAX_ACCEPTED_GEO_ACCURACY_METERS) {
        setLocationDetectError(t('locationLowAccuracy'))
        return
      }

      let resolvedLocation = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        )
        if (response.ok) {
          const data = await response.json()
          const city = data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.hamlet || ''
          const province = data?.address?.state || data?.address?.province || ''
          const postalCode = data?.address?.postcode || ''
          const fallbackLabel = data?.display_name || ''

          const prettyLabel = [city, province || postalCode].filter(Boolean).join(', ')
          resolvedLocation = prettyLabel || fallbackLabel || resolvedLocation
        }
      } catch {
        // Fall back to coordinate-based label when reverse geocoding fails.
      }

      const resolvedContext = {
        label: resolvedLocation,
        latitude,
        longitude,
        boundingBox: null,
        source: 'device',
      }

      applySearchAreaSelection(resolvedLocation, resolvedContext)
    } catch {
      setLocationDetectError(t('locationDetectFailed'))
    } finally {
      setIsDetectingLocation(false)
    }
  }

  const handleDeliveryLocationChange = async (nextLocation) => {
    const normalizedLocation = (nextLocation || '').trim()
    if (!normalizedLocation) {
      return
    }

    setIsResolvingSearchArea(true)
    setLocationDetectError('')

    try {
      const resolvedArea = await resolveSearchArea(normalizedLocation)
      if (resolvedArea) {
        applySearchAreaSelection(resolvedArea.label, resolvedArea)
        return
      }

      applySearchAreaSelection(normalizedLocation, null)
      setLocationDetectError(t('locationResolveFailed'))
    } catch {
      applySearchAreaSelection(normalizedLocation, null)
      setLocationDetectError(t('locationResolveFailed'))
    } finally {
      setIsResolvingSearchArea(false)
    }
  }

  const handleAddCustomDeliveryLocation = async () => {
    const normalizedLocation = customDeliveryLocationInput.trim()
    if (!normalizedLocation) {
      return
    }

    await handleDeliveryLocationChange(normalizedLocation)
  }

  const uploadSettingsImage = async (file, label) => {
    if (!currentUser || !file) {
      return null
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const fileName = `${Date.now()}-${label}.${extension}`
    const filePath = `${currentUser.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('profile-media')
      .upload(filePath, file, { upsert: false, contentType: file.type || undefined })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage.from('profile-media').getPublicUrl(filePath)
    return data?.publicUrl || null
  }

  const handleSaveProfileSettings = async (event) => {
    event.preventDefault()

    if (!currentUser || !profile) {
      setSettingsError('You must be signed in to update your settings.')
      return
    }

    setIsSavingSettings(true)
    setSettingsError('')

    let resolvedAvatarUrl = settingsAvatarUrl.trim() || null
    let resolvedProfileBanner = settingsProfileBanner

    try {
      if (settingsProfilePhotoFile) {
        const uploadedPhotoUrl = await uploadSettingsImage(settingsProfilePhotoFile, 'profile-photo')
        if (uploadedPhotoUrl) {
          resolvedAvatarUrl = uploadedPhotoUrl
        }
      }

      if (settingsProfileBannerFile) {
        const uploadedBannerUrl = await uploadSettingsImage(settingsProfileBannerFile, 'profile-banner')
        if (uploadedBannerUrl) {
          resolvedProfileBanner = uploadedBannerUrl
        }
      }
    } catch (error) {
      setSettingsError(error.message || 'Could not upload one or more profile images right now.')
      setIsSavingSettings(false)
      return
    }

    const updatePayload = {
      display_name: settingsDisplayName.trim() || null,
      avatar_url: resolvedAvatarUrl,
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', currentUser.id)
      .select(profileSelectFields)
      .single()

    if (error) {
      setSettingsError(error.message || 'Could not save your settings right now.')
      setIsSavingSettings(false)
      return
    }

    setProfile(data)
    setSettingsAvatarUrl(resolvedAvatarUrl || '')
    setSettingsProfilePhoto(resolvedAvatarUrl || '')
    setSettingsProfileBanner(resolvedProfileBanner || '')
    setSettingsProfilePhotoFile(null)
    setSettingsProfileBannerFile(null)
    persistSettingsLocally({
      profilePhoto: resolvedAvatarUrl || '',
      profileBanner: resolvedProfileBanner || '',
    })
    setAuthMessage('Profile settings updated successfully.')
    setIsSavingSettings(false)
  }

  const handleSaveLocalSettings = (event, message) => {
    event.preventDefault()
    setSettingsError('')
    persistSettingsLocally()
    setAuthMessage(message)
  }

  const readMagicImportFileText = async (file) => {
    if (!file) {
      throw new Error('Please choose a file first.')
    }

    try {
      if (file.name.toLowerCase().endsWith('.gz')) {
        if (typeof DecompressionStream === 'undefined') {
          throw new Error('Gzip imports are not supported in this browser. Use a .json file or CLI importer.')
        }

        const stream = file.stream().pipeThrough(new DecompressionStream('gzip'))
        return await new Response(stream).text()
      }

      return await file.text()
    } catch (_primaryError) {
      // Fallback path for browsers/filesystems where File.text() intermittently fails.
      try {
        const bytes = await file.arrayBuffer()
        if (file.name.toLowerCase().endsWith('.gz')) {
          if (typeof DecompressionStream === 'undefined') {
            throw new Error('Gzip imports are not supported in this browser. Use a .json file or CLI importer.')
          }
          const fallbackStream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
          return await new Response(fallbackStream).text()
        }
        return new TextDecoder('utf-8').decode(bytes)
      } catch (fallbackError) {
        const message = String(fallbackError?.message || '').toLowerCase()
        if (message.includes('could not be read') || message.includes('notreadable') || message.includes('permission')) {
          throw new Error(
            'The selected file could not be read due to OS/browser permissions. Move it to a local folder (for example Downloads), re-select it, or use the CLI importer.',
          )
        }
        throw fallbackError
      }
    }
  }

  const normalizeMagicImportRow = (rawRow, fallbackEncoding) => {
    if (!rawRow || typeof rawRow !== 'object') {
      return null
    }

    const rowId = String(rawRow.id || '').trim()
    if (!rowId) {
      return null
    }

    const uriValue =
      String(rawRow.uri || rawRow.scryfall_uri || '').trim() ||
      `https://api.scryfall.com/cards/${rowId}`

    return {
      id: rowId,
      category: String(rawRow.category || 'Trading Cards').trim() || 'Trading Cards',
      subcategory: String(rawRow.subcategory || 'Magic: The Gathering').trim() || 'Magic: The Gathering',
      franchise:
        String(rawRow.franchise || rawRow.set_name || rawRow.set || 'Magic: The Gathering').trim() ||
        'Magic: The Gathering',
      brand: String(rawRow.brand || 'Wizards of the Coast').trim() || 'Wizards of the Coast',
      uri: uriValue,
      type: String(rawRow.type || rawRow.type_line || rawRow.layout || 'card').trim() || 'card',
      name: String(rawRow.name || 'Unknown').trim() || 'Unknown',
      description: (rawRow.description || rawRow.oracle_text || null),
      download_uri: (rawRow.download_uri || rawRow.image_uris?.normal || rawRow.image_uris?.large || null),
      updated_at: rawRow.updated_at || rawRow.released_at || null,
      size: Number.isFinite(Number(rawRow.size)) ? Number(rawRow.size) : null,
      content_type: (rawRow.content_type || rawRow.contentType || 'application/json'),
      content_encoding: (rawRow.content_encoding || rawRow.contentEncoding || fallbackEncoding || null),
    }
  }

  const handleImportMagicCards = async (event) => {
    event.preventDefault()

    if (!currentUser || !isPlatformAdmin) {
      setMagicImportError('Only platform admins can import Magic data.')
      return
    }

    if (!magicImportFile) {
      setMagicImportError('Select a .json or .gz file to import.')
      return
    }

    setMagicImportError('')
    setMagicImportSummary('')
    setMagicImportProgress({ processed: 0, total: 0 })
    setIsImportingMagic(true)

    try {
      const rawText = await readMagicImportFileText(magicImportFile)
      const parsed = JSON.parse(rawText)
      const rows = Array.isArray(parsed)
        ? parsed
        : (Array.isArray(parsed?.data) ? parsed.data : [parsed])

      const fallbackEncoding = magicImportFile.name.toLowerCase().endsWith('.gz') ? 'gzip' : null
      const normalizedRows = []
      let skippedRows = 0

      for (const row of rows) {
        const normalized = normalizeMagicImportRow(row, fallbackEncoding)
        if (normalized) {
          normalizedRows.push(normalized)
        } else {
          skippedRows += 1
        }
      }

      if (normalizedRows.length === 0) {
        throw new Error('No importable rows found. Ensure the file includes objects with an id field.')
      }

      const batchSize = 500
      for (let index = 0; index < normalizedRows.length; index += batchSize) {
        const batch = normalizedRows.slice(index, index + batchSize)

        const { error } = await supabase
          .from('magic_cards')
          .upsert(batch, { onConflict: 'id' })

        if (error) {
          throw error
        }

        setMagicImportProgress({
          processed: Math.min(index + batch.length, normalizedRows.length),
          total: normalizedRows.length,
        })
      }

      setMagicImportSummary(
        `Import complete. Upserted ${normalizedRows.length} rows${skippedRows > 0 ? `, skipped ${skippedRows}` : ''}.`,
      )
      setAuthMessage('Magic card import completed.')
    } catch (error) {
      setMagicImportError(error.message || 'Could not import Magic data right now.')
      setMagicImportSummary('')
    } finally {
      setIsImportingMagic(false)
    }
  }

  const ensureCurrentStore = async () => {
    if (!currentUser?.id || !isStoreOwnerTier) {
      return null
    }

    if (currentStore?.id) {
      return currentStore
    }

    const { data: existingStore, error: readStoreError } = await supabase
      .from('stores')
      .select('id, store_code, store_name, subscription_type, owner_user_id, created_at')
      .eq('owner_user_id', currentUser.id)
      .maybeSingle()

    if (!readStoreError && existingStore) {
      setCurrentStore(existingStore)
      return existingStore
    }

    const defaultStoreName = settingsStoreName.trim() || profile?.display_name || 'CollectorsHub Store'
    const { data: insertedStore, error: insertStoreError } = await supabase
      .from('stores')
      .insert({
        owner_user_id: currentUser.id,
        store_name: defaultStoreName,
        subscription_type: hasStoreProAccess ? 'store_plus' : 'store',
      })
      .select('id, store_code, store_name, subscription_type, owner_user_id, created_at')
      .single()

    if (insertStoreError || !insertedStore) {
      return null
    }

    setCurrentStore(insertedStore)
    return insertedStore
  }

  const handleSaveStoreSettings = async (event) => {
    event.preventDefault()

    const resolvedStoreId = currentStore?.id || null
    if (!currentUser?.id || !canAccessStoreTab || !resolvedStoreId) {
      setSettingsError('You must be a Store account to update store settings.')
      return
    }

    setSettingsError('')
    setIsSavingSettings(true)

    let resolvedStoreLogo = settingsStoreLogo
    let resolvedStoreBanner = settingsStoreBanner

    try {
      if (settingsStoreLogoFile) {
        const uploadedLogoUrl = await uploadSettingsImage(settingsStoreLogoFile, 'store-logo')
        if (uploadedLogoUrl) {
          resolvedStoreLogo = uploadedLogoUrl
        }
      }

      if (settingsStoreBannerFile) {
        const uploadedBannerUrl = await uploadSettingsImage(settingsStoreBannerFile, 'store-banner')
        if (uploadedBannerUrl) {
          resolvedStoreBanner = uploadedBannerUrl
        }
      }
    } catch (error) {
      setSettingsError(error.message || 'Could not upload one or more store images right now.')
      setIsSavingSettings(false)
      return
    }

    setSettingsStoreLogo(resolvedStoreLogo || '')
    setSettingsStoreBanner(resolvedStoreBanner || '')
    setSettingsStoreLogoFile(null)
    setSettingsStoreBannerFile(null)

    const { error: saveStoreSettingsError } = await supabase
      .from('store_settings')
      .upsert(
        {
          store_id: resolvedStoreId,
          store_owner_id: currentUser.id,
          store_logo_url: resolvedStoreLogo || null,
          store_banner_url: resolvedStoreBanner || null,
          store_name: settingsStoreName.trim() || null,
          store_description: settingsStoreDescription.trim() || null,
          store_address: settingsStoreAddress.trim() || null,
          business_hours: settingsStoreHours.trim() || null,
          store_visibility: settingsStoreVisibility,
          auto_publish_inventory: settingsInventoryAutoPublish,
          allow_purchase_requests: settingsInventoryAllowPurchaseRequests,
          enable_marketplace_listings: settingsInventoryEnableMarketplaceListings,
          enable_event_creation: settingsInventoryEnableEventCreation,
          track_inventory_by_location: settingsInventoryTrackByLocation,
        },
        { onConflict: 'store_id' },
      )

    if (saveStoreSettingsError) {
      setSettingsError(saveStoreSettingsError.message || 'Could not save store settings right now.')
      setIsSavingSettings(false)
      return
    }

    const { data: updatedStore, error: saveStoreError } = await supabase
      .from('stores')
      .update({
        store_name: settingsStoreName.trim() || 'CollectorsHub Store',
        subscription_type: hasStoreProAccess ? 'store_plus' : 'store',
      })
      .eq('id', resolvedStoreId)
      .select('id, store_code, store_name, subscription_type, owner_user_id, created_at')
      .maybeSingle()

    if (saveStoreError) {
      setSettingsError(saveStoreError.message || 'Store settings saved, but store profile sync failed.')
      setIsSavingSettings(false)
      return
    }

    if (updatedStore) {
      setCurrentStore(updatedStore)
    }

    persistSettingsLocally({
      storeLogo: resolvedStoreLogo || '',
      storeBanner: resolvedStoreBanner || '',
      storeName: settingsStoreName,
      storeDescription: settingsStoreDescription,
      storeHours: settingsStoreHours,
      storeAddress: settingsStoreAddress,
      storeVisibility: settingsStoreVisibility,
      inventoryAutoPublish: settingsInventoryAutoPublish,
      inventoryAllowPurchaseRequests: settingsInventoryAllowPurchaseRequests,
      inventoryEnableMarketplaceListings: settingsInventoryEnableMarketplaceListings,
      inventoryEnableEventCreation: settingsInventoryEnableEventCreation,
      inventoryTrackByLocation: settingsInventoryTrackByLocation,
    })
    setAuthMessage('Store settings saved.')
    setIsSavingSettings(false)
  }

  const handleOpenAddEmployeeModal = () => {
    setEmployeesError('')
    setNewEmployeeFirstName('')
    setNewEmployeeLastName('')
    setNewEmployeePin('')
    setNewEmployeeRole('Cashier')
    setNewEmployeeAllLocations(true)
    setNewEmployeeLocationIds([])
    setIsAddEmployeeModalOpen(true)
  }

  const handleCloseAddEmployeeModal = () => {
    if (isCreatingEmployee) {
      return
    }

    setIsAddEmployeeModalOpen(false)
  }

  const handleCreateEmployee = async (event) => {
    event.preventDefault()

    if (!currentUser?.id || !canAccessEmployeesTab) {
      setEmployeesError('Only Store accounts can create employee accounts.')
      return
    }

    const resolvedStore = await ensureCurrentStore()
    if (!resolvedStore?.id) {
      setEmployeesError('Store profile is still initializing. Save Store settings once, then try again.')
      return
    }

    const normalizedFirstName = newEmployeeFirstName.trim()
    const normalizedLastName = newEmployeeLastName.trim()
    const normalizedPin = newEmployeePin.trim()
    const normalizedLocationIds = normalizeLocationIds(newEmployeeLocationIds)

    if (!normalizedFirstName || !normalizedLastName || !normalizedPin) {
      setEmployeesError('First name, last name, and PIN are required.')
      return
    }

    if (normalizedPin.length < 4) {
      setEmployeesError('PIN must be at least 4 characters.')
      return
    }

    if (!newEmployeeAllLocations && normalizedLocationIds.length === 0) {
      setEmployeesError('Select at least one location or choose All Locations.')
      return
    }

    setIsCreatingEmployee(true)
    setEmployeesError('')

    const { data: ownerSessionData } = await supabase.auth.getSession()
    const ownerSession = ownerSessionData?.session || null
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined

    const { data: generatedUsername, error: generatedUsernameError } = await supabase.rpc(
      'generate_store_employee_username',
      {
        p_store_id: resolvedStore.id,
        p_first_name: normalizedFirstName,
        p_last_name: normalizedLastName,
      },
    )

    if (generatedUsernameError || !generatedUsername) {
      setEmployeesError(generatedUsernameError?.message || 'Could not generate employee username right now.')
      setIsCreatingEmployee(false)
      return
    }

    const normalizedUsername = generatedUsername
    const authEmailDomain = resolveEmployeeAuthEmailDomain(currentUser?.email)
    const internalEmail = `${normalizedUsername.toLowerCase()}+chstore@${authEmailDomain}`

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: internalEmail,
      password: normalizedPin,
      options: {
        ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
        data: {
          first_name: normalizedFirstName,
          last_name: normalizedLastName,
          role: normalizeEmployeeRoleForAuth(newEmployeeRole),
          username: normalizedUsername,
          store_id: resolvedStore.id,
          invited_by_store_owner_id: currentUser.id,
        },
      },
    })

    if (ownerSession?.access_token && ownerSession?.refresh_token) {
      await supabase.auth.setSession({
        access_token: ownerSession.access_token,
        refresh_token: ownerSession.refresh_token,
      })
    }

    if (signUpError || !signUpData?.user?.id) {
      const rawMessage = signUpError?.message || ''
      const normalizedMessage = rawMessage.toLowerCase()
      if (normalizedMessage.includes('rate limit') || normalizedMessage.includes('email rate limit')) {
        setEmployeesError(
          'Supabase email rate limit reached for account creation. Wait a few minutes and try again, or disable email confirmations in Supabase Auth settings for internal employee accounts.',
        )
      } else {
        setEmployeesError(rawMessage || 'Could not create the employee account.')
      }
      setIsCreatingEmployee(false)
      return
    }

    const rolePermissions = getRoleDefaultPermissions(newEmployeeRole)
    const { data: insertedEmployee, error: insertEmployeeError } = await supabase
      .from('store_employees')
      .insert({
        store_id: resolvedStore.id,
        store_owner_id: currentUser.id,
        employee_user_id: signUpData.user.id,
        auth_user_id: signUpData.user.id,
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
        email: internalEmail,
        internal_email: internalEmail,
        username: normalizedUsername,
        role: normalizeEmployeeRoleForAuth(newEmployeeRole),
        status: 'active',
        permissions: rolePermissions,
        action_permissions: rolePermissions,
        all_locations: newEmployeeAllLocations,
      })
      .select('id, first_name, last_name, username, role, status, permissions, action_permissions, all_locations, created_at')
      .single()

    if (insertEmployeeError) {
      setEmployeesError(insertEmployeeError.message || 'Employee account was created but could not be linked to the store.')
      setIsCreatingEmployee(false)
      return
    }

    const { error: pinHashError } = await supabase.rpc('set_store_employee_pin', {
      p_employee_id: insertedEmployee.id,
      p_pin: normalizedPin,
    })

    if (pinHashError) {
      setEmployeesError(pinHashError.message || 'Employee created but PIN setup failed.')
      setIsCreatingEmployee(false)
      return
    }

    if (!newEmployeeAllLocations && normalizedLocationIds.length > 0) {
      const { error: linkLocationsError } = await supabase
        .from('store_employee_locations')
        .insert(
          normalizedLocationIds.map((locationId) => ({
            store_id: resolvedStore.id,
            store_owner_id: currentUser.id,
            employee_id: insertedEmployee.id,
            location_id: locationId,
          })),
        )

      if (linkLocationsError) {
        setEmployeesError(linkLocationsError.message || 'Employee created but location assignments failed.')
      }
    }

    setStoreEmployees((currentEmployees) => [
      {
        ...insertedEmployee,
        permissions: normalizeEmployeePermissions(insertedEmployee.action_permissions || insertedEmployee.permissions),
        all_locations: newEmployeeAllLocations,
        location_ids: normalizedLocationIds,
      },
      ...currentEmployees,
    ])

    setCreatedEmployeeLoginInfo({
      storeCode: resolvedStore.store_code,
      username: normalizedUsername,
    })

    await supabase.rpc('log_store_employee_action', {
      p_store_id: resolvedStore.id,
      p_employee_id: insertedEmployee.id,
      p_action: 'employee_created',
      p_metadata: {
        username: normalizedUsername,
        role: normalizeEmployeeRoleForAuth(newEmployeeRole),
      },
    })

    setIsAddEmployeeModalOpen(false)
    setAuthMessage(`Employee created successfully. Store Code: ${resolvedStore.store_code} Username: ${normalizedUsername}`)
    setIsCreatingEmployee(false)
  }

  const handleEditEmployeePermissions = (employee) => {
    setEditingEmployeeId(employee.id)
    setEditingEmployeePermissions(normalizeEmployeePermissions(employee.permissions))
    setEditingEmployeeAllLocations(Boolean(employee.all_locations))
    setEditingEmployeeLocationIds(normalizeLocationIds(employee.location_ids))
    setEmployeesError('')
  }

  const handleCancelEmployeePermissions = () => {
    setEditingEmployeeId('')
    setEditingEmployeePermissions(DEFAULT_EMPLOYEE_PERMISSIONS)
    setEditingEmployeeAllLocations(true)
    setEditingEmployeeLocationIds([])
  }

  const handleToggleEmployeePermission = (permissionKey) => {
    setEditingEmployeePermissions((currentPermissions) => ({
      ...currentPermissions,
      [permissionKey]: !currentPermissions[permissionKey],
    }))
  }

  const handleSetEditingEmployeeAllLocations = (nextValue) => {
    setEditingEmployeeAllLocations(nextValue)
    if (nextValue) {
      setEditingEmployeeLocationIds([])
    }
  }

  const handleSetNewEmployeeAllLocations = (nextValue) => {
    setNewEmployeeAllLocations(nextValue)
    if (nextValue) {
      setNewEmployeeLocationIds([])
    }
  }

  const handleToggleEditingEmployeeLocation = (locationId) => {
    setEditingEmployeeLocationIds((currentLocationIds) =>
      currentLocationIds.includes(locationId)
        ? currentLocationIds.filter((id) => id !== locationId)
        : [...currentLocationIds, locationId],
    )
  }

  const handleToggleNewEmployeeLocation = (locationId) => {
    setNewEmployeeLocationIds((currentLocationIds) =>
      currentLocationIds.includes(locationId)
        ? currentLocationIds.filter((id) => id !== locationId)
        : [...currentLocationIds, locationId],
    )
  }

  const handleCopyEmployeeLoginInfo = async () => {
    if (!createdEmployeeLoginInfo) {
      return
    }

    const payload = `Store Code: ${createdEmployeeLoginInfo.storeCode}\nUsername: ${createdEmployeeLoginInfo.username}`
    try {
      await navigator.clipboard.writeText(payload)
      setAuthMessage('Employee login info copied.')
    } catch {
      setAuthMessage(payload)
    }
  }

  const handleSaveEmployeePermissions = async (employeeId) => {
    setEmployeesError('')
    const resolvedStoreId = currentStore?.id || employeeAuthContext?.store_id || null
    if (!resolvedStoreId) {
      setEmployeesError('Store context is unavailable for this employee update.')
      return
    }

    const normalizedPermissions = normalizeEmployeePermissions(editingEmployeePermissions)
    const normalizedLocationIds = normalizeLocationIds(editingEmployeeLocationIds)

    if (!editingEmployeeAllLocations && normalizedLocationIds.length === 0) {
      setEmployeesError('Select at least one location or enable All Locations.')
      return
    }

    const { error } = await supabase
      .from('store_employees')
      .update({
        permissions: normalizedPermissions,
        action_permissions: normalizedPermissions,
        all_locations: editingEmployeeAllLocations,
      })
      .eq('id', employeeId)
      .eq('store_id', resolvedStoreId)

    if (error) {
      setEmployeesError(error.message || 'Could not save employee permissions right now.')
      return
    }

    const { error: deleteLinksError } = await supabase
      .from('store_employee_locations')
      .delete()
      .eq('employee_id', employeeId)
      .eq('store_id', resolvedStoreId)

    if (deleteLinksError) {
      setEmployeesError(deleteLinksError.message || 'Could not update employee location access right now.')
      return
    }

    if (!editingEmployeeAllLocations && normalizedLocationIds.length > 0) {
      const { error: insertLinksError } = await supabase
        .from('store_employee_locations')
        .insert(
          normalizedLocationIds.map((locationId) => ({
            store_id: resolvedStoreId,
            store_owner_id: currentUser.id,
            employee_id: employeeId,
            location_id: locationId,
          })),
        )

      if (insertLinksError) {
        setEmployeesError(insertLinksError.message || 'Could not save employee location access right now.')
        return
      }
    }

    setStoreEmployees((currentEmployees) =>
      currentEmployees.map((employee) =>
        employee.id === employeeId
          ? {
            ...employee,
            permissions: normalizedPermissions,
            all_locations: editingEmployeeAllLocations,
            location_ids: normalizedLocationIds,
          }
          : employee,
      ),
    )
    setEditingEmployeeId('')

    await supabase.rpc('log_store_employee_action', {
      p_store_id: resolvedStoreId,
      p_employee_id: employeeId,
      p_action: 'employee_permissions_updated',
      p_metadata: {
        all_locations: editingEmployeeAllLocations,
      },
    })

    setAuthMessage('Employee permissions updated.')
  }

  const handleDeactivateEmployee = async (employeeId, currentStatus) => {
    setEmployeesError('')
    const resolvedStoreId = currentStore?.id || employeeAuthContext?.store_id || null
    if (!resolvedStoreId) {
      setEmployeesError('Store context is unavailable for this employee update.')
      return
    }

    const nextStatus = currentStatus === 'inactive' ? 'active' : 'inactive'
    const { error } = await supabase
      .from('store_employees')
      .update({ status: nextStatus })
      .eq('id', employeeId)
      .eq('store_id', resolvedStoreId)

    if (error) {
      setEmployeesError(error.message || 'Could not update employee status right now.')
      return
    }

    setStoreEmployees((currentEmployees) =>
      currentEmployees.map((employee) =>
        employee.id === employeeId
          ? { ...employee, status: nextStatus }
          : employee,
      ),
    )

    await supabase.rpc('log_store_employee_action', {
      p_store_id: resolvedStoreId,
      p_employee_id: employeeId,
      p_action: nextStatus === 'inactive' ? 'employee_deactivated' : 'employee_activated',
      p_metadata: {},
    })

    setAuthMessage(nextStatus === 'inactive' ? 'Employee deactivated.' : 'Employee reactivated.')
  }

  const handleRemoveEmployee = async (employeeId) => {
    setEmployeesError('')
    const resolvedStoreId = currentStore?.id || employeeAuthContext?.store_id || null
    if (!resolvedStoreId) {
      setEmployeesError('Store context is unavailable for this employee update.')
      return
    }

    const { error } = await supabase
      .from('store_employees')
      .delete()
      .eq('id', employeeId)
      .eq('store_id', resolvedStoreId)

    if (error) {
      setEmployeesError(error.message || 'Could not remove employee right now.')
      return
    }

    setStoreEmployees((currentEmployees) => currentEmployees.filter((employee) => employee.id !== employeeId))
    if (editingEmployeeId === employeeId) {
      handleCancelEmployeePermissions()
    }

    await supabase.rpc('log_store_employee_action', {
      p_store_id: resolvedStoreId,
      p_employee_id: employeeId,
      p_action: 'employee_removed',
      p_metadata: {},
    })

    setAuthMessage('Employee removed from store.')
  }

  const handleOpenAddLocationModal = () => {
    setLocationsError('')
    setNewLocationName('')
    setNewLocationStreetAddress('')
    setNewLocationCity('')
    setNewLocationProvince('')
    setNewLocationPostalCode('')
    setNewLocationPhoneNumber('')
    setNewLocationManagerEmployeeId('')
    setIsAddLocationModalOpen(true)
  }

  const handleCloseAddLocationModal = () => {
    if (isCreatingLocation) {
      return
    }

    setIsAddLocationModalOpen(false)
  }

  const handleCreateLocation = async (event) => {
    event.preventDefault()

    const resolvedStoreId = currentStore?.id || null
    if (!currentUser?.id || !canAccessStoreTab || !resolvedStoreId || !isStoreOwnerTier) {
      setLocationsError('Only Store accounts can create locations.')
      return
    }

    const normalizedLocationName = newLocationName.trim()
    if (!normalizedLocationName) {
      setLocationsError('Location name is required.')
      return
    }

    if (!hasStoreProAccess && storeLocations.length >= 1) {
      setLocationsError('Store accounts are limited to one location.')
      return
    }

    setIsCreatingLocation(true)
    setLocationsError('')

    const { data, error } = await supabase
      .from('store_locations')
      .insert({
        store_id: resolvedStoreId,
        store_owner_id: currentUser.id,
        location_name: normalizedLocationName,
        street_address: newLocationStreetAddress.trim() || null,
        city: newLocationCity.trim() || null,
        province: newLocationProvince.trim() || null,
        postal_code: newLocationPostalCode.trim() || null,
        phone_number: newLocationPhoneNumber.trim() || null,
        manager_employee_id: newLocationManagerEmployeeId || null,
        status: 'active',
      })
      .select('id, location_name, street_address, city, province, postal_code, phone_number, manager_employee_id, status, created_at')
      .single()

    if (error) {
      setLocationsError(error.message || 'Could not create location right now.')
      setIsCreatingLocation(false)
      return
    }

    setStoreLocations((currentLocations) => [...currentLocations, data])
    setIsAddLocationModalOpen(false)
    setAuthMessage('Location created successfully.')
    setIsCreatingLocation(false)
  }

  const handleSaveLocation = async (locationId, updates) => {
    setLocationsError('')
    const resolvedStoreId = currentStore?.id || null
    if (!resolvedStoreId || !isStoreOwnerTier) {
      setLocationsError('Only Store owners can update locations.')
      return false
    }

    const payload = {
      location_name: updates.location_name.trim() || DEFAULT_LOCATION_NAME,
      street_address: updates.street_address.trim() || null,
      city: updates.city.trim() || null,
      province: updates.province.trim() || null,
      postal_code: updates.postal_code.trim() || null,
      phone_number: updates.phone_number.trim() || null,
      manager_employee_id: updates.manager_employee_id || null,
    }

    const { error } = await supabase
      .from('store_locations')
      .update(payload)
      .eq('id', locationId)
      .eq('store_id', resolvedStoreId)

    if (error) {
      setLocationsError(error.message || 'Could not update location right now.')
      return false
    }

    setStoreLocations((currentLocations) =>
      currentLocations.map((location) =>
        location.id === locationId
          ? { ...location, ...payload }
          : location,
      ),
    )
    setAuthMessage('Location updated.')
    return true
  }

  const handleDeactivateLocation = async (locationId, currentStatus) => {
    setLocationsError('')
    const resolvedStoreId = currentStore?.id || null
    if (!resolvedStoreId || !isStoreOwnerTier) {
      setLocationsError('Only Store owners can update location status.')
      return
    }

    const nextStatus = currentStatus === 'inactive' ? 'active' : 'inactive'

    const { error } = await supabase
      .from('store_locations')
      .update({ status: nextStatus })
      .eq('id', locationId)
      .eq('store_id', resolvedStoreId)

    if (error) {
      setLocationsError(error.message || 'Could not update location status right now.')
      return
    }

    setStoreLocations((currentLocations) =>
      currentLocations.map((location) =>
        location.id === locationId
          ? { ...location, status: nextStatus }
          : location,
      ),
    )
    setAuthMessage(nextStatus === 'inactive' ? 'Location deactivated.' : 'Location activated.')
  }

  const handleChangePassword = async () => {
    if (!currentUser?.email) {
      setSettingsError('No account email found for password reset.')
      return
    }

    setIsSavingSettings(true)
    setSettingsError('')

    const { error } = await supabase.auth.resetPasswordForEmail(currentUser.email)
    if (error) {
      setSettingsError(error.message || 'Could not send a password reset email right now.')
      setIsSavingSettings(false)
      return
    }

    setAuthMessage('Password reset email sent. Check your inbox to continue.')
    setIsSavingSettings(false)
  }

  const handleChangeEmail = async () => {
    if (!currentUser?.email) {
      setSettingsError('No account email found for email change.')
      return
    }

    const normalizedEmail = settingsPendingEmail.trim().toLowerCase()
    if (!normalizedEmail) {
      setSettingsError('Enter a new email address to continue.')
      return
    }

    if (normalizedEmail === currentUser.email.toLowerCase()) {
      setSettingsError('That is already your current email address.')
      return
    }

    setIsSavingSettings(true)
    setSettingsError('')

    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined
    const { error } = await supabase.auth.updateUser(
      { email: normalizedEmail },
      redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    )

    if (error) {
      setSettingsError(error.message || 'Could not start email change right now.')
      setIsSavingSettings(false)
      return
    }

    setAuthMessage('Email change started. Check your inbox for the confirmation link.')
    setIsSavingSettings(false)
  }

  const closeTwoFactorModal = () => {
    setIsTwoFactorModalOpen(false)
    setTwoFactorCode('')
    setTwoFactorError('')
    setTwoFactorQrSvg('')
    setTwoFactorQrDataUrl('')
  }

  const parseQrSvg = (value) => {
    if (!value) {
      return ''
    }

    const normalized = value.trim()

    if (!normalized) {
      return ''
    }

    if (normalized.startsWith('<svg')) {
      return normalized
    }

    if (normalized.startsWith('<?xml')) {
      const svgIndex = normalized.indexOf('<svg')
      if (svgIndex >= 0) {
        return normalized.slice(svgIndex)
      }
    }

    const utf8Prefix = 'data:image/svg+xml;utf8,'
    if (normalized.startsWith(utf8Prefix)) {
      return decodeURIComponent(normalized.slice(utf8Prefix.length))
    }

    const plainSvgPrefix = 'data:image/svg+xml,'
    if (normalized.startsWith(plainSvgPrefix)) {
      return decodeURIComponent(normalized.slice(plainSvgPrefix.length))
    }

    const charsetSvgPrefix = 'data:image/svg+xml;charset=utf-8,'
    if (normalized.startsWith(charsetSvgPrefix)) {
      return decodeURIComponent(normalized.slice(charsetSvgPrefix.length))
    }

    const base64Prefix = 'data:image/svg+xml;base64,'
    if (normalized.startsWith(base64Prefix)) {
      try {
        return atob(normalized.slice(base64Prefix.length))
      } catch {
        return ''
      }
    }

    return ''
  }

  const buildTotpUri = (secret) => {
    if (!secret) {
      return ''
    }

    const issuer = 'CollectorsHub'
    const accountLabel = currentUser?.email || 'user'
    return `otpauth://totp/${encodeURIComponent(`${issuer}:${accountLabel}`)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}`
  }

  const handleOpenTwoFactorSetup = async () => {
    if (!currentUser) {
      setSettingsError('You must be signed in to configure two-factor authentication.')
      return
    }

    if (!supabase.auth?.mfa?.enroll || !supabase.auth?.mfa?.listFactors) {
      setSettingsError('Two-factor authentication is not available in the current environment.')
      return
    }

    setIsTwoFactorLoading(true)
    setTwoFactorError('')
    setSettingsError('')

    const friendlyName = 'CollectorsHub Authenticator'

    const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors()
    if (factorsError) {
      setSettingsError(factorsError.message || 'Could not load existing two-factor settings right now.')
      setIsTwoFactorLoading(false)
      return
    }

    const totpFactors = factorsData?.totp || []
    const hasVerifiedTotp = totpFactors.some((factor) => factor.status === 'verified')
    if (hasVerifiedTotp) {
      setIsTwoFactorEnabled(true)
      setAuthMessage('Two-factor authentication is already enabled on your account.')
      setIsTwoFactorLoading(false)
      return
    }

    const staleFactors = totpFactors.filter(
      (factor) => factor.status !== 'verified' && factor.friendly_name === friendlyName,
    )

    if (staleFactors.length > 0) {
      if (!supabase.auth?.mfa?.unenroll) {
        setSettingsError('Found an incomplete two-factor setup but cannot reset it in this environment.')
        setIsTwoFactorLoading(false)
        return
      }

      for (const factor of staleFactors) {
        const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
        if (unenrollError) {
          setSettingsError(unenrollError.message || 'Could not reset your previous two-factor setup. Try again.')
          setIsTwoFactorLoading(false)
          return
        }
      }
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName,
    })

    if (error) {
      setSettingsError(error.message || 'Could not start two-factor setup right now.')
      setIsTwoFactorLoading(false)
      return
    }

    setTwoFactorQrSvg('')
    setTwoFactorQrDataUrl('')

    const qrMarkup = parseQrSvg(data?.totp?.qr_code || '')
    const secret = data?.totp?.secret || ''
    setTwoFactorSecret(secret)

    if (qrMarkup) {
      setTwoFactorQrSvg(qrMarkup)
    } else {
      const uriCandidate =
        data?.totp?.uri ||
        (typeof data?.totp?.qr_code === 'string' && data.totp.qr_code.startsWith('otpauth://') ? data.totp.qr_code : '') ||
        buildTotpUri(secret)

      if (uriCandidate) {
        try {
          const generatedDataUrl = await QRCode.toDataURL(uriCandidate, {
            width: 220,
            margin: 1,
            errorCorrectionLevel: 'M',
          })
          setTwoFactorQrDataUrl(generatedDataUrl)
        } catch {
          setTwoFactorQrDataUrl('')
        }
      }
    }

    setTwoFactorFactorId(data?.id || '')
    setTwoFactorCode('')
    setIsTwoFactorModalOpen(true)
    setIsTwoFactorLoading(false)
  }

  const handleVerifyTwoFactorSetup = async () => {
    if (!twoFactorFactorId || !twoFactorCode.trim()) {
      setTwoFactorError('Enter the 6-digit code from your authenticator app.')
      return
    }

    if (!supabase.auth?.mfa?.challenge || !supabase.auth?.mfa?.verify) {
      setTwoFactorError('Two-factor verification is not available in the current environment.')
      return
    }

    setIsTwoFactorLoading(true)
    setTwoFactorError('')

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: twoFactorFactorId,
    })

    if (challengeError) {
      setTwoFactorError(challengeError.message || 'Could not challenge the authenticator factor.')
      setIsTwoFactorLoading(false)
      return
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: twoFactorFactorId,
      challengeId: challengeData?.id,
      code: twoFactorCode.trim(),
    })

    if (verifyError) {
      setTwoFactorError(verifyError.message || 'Verification failed. Check your code and try again.')
      setIsTwoFactorLoading(false)
      return
    }

    setIsTwoFactorEnabled(true)
    closeTwoFactorModal()
    setAuthMessage('Two-factor authentication is now enabled on your account.')
    setIsTwoFactorLoading(false)
  }

  const handleCheckoutCart = async () => {
    if (!profile || cartItems.length === 0) {
      return
    }

    const hasCollectorPlus = cartItems.some((item) => item.tier === 'collector_plus')
    const hasEventOrganizer = cartItems.some((item) => item.tier === 'event_organizer')
    const targetTier = hasCollectorPlus ? 'collector_plus' : 'free_collector'
    const successMessage = hasCollectorPlus && hasEventOrganizer
      ? 'Checkout complete. Collector+ and Event Organizer are now active.'
      : hasCollectorPlus
        ? 'Checkout complete. Collector+ is now active.'
        : 'Checkout complete. Event Organizer is now active.'

    const updatedProfile = await applySubscriptionChange(targetTier, hasEventOrganizer, successMessage)
    if (!updatedProfile) {
      return
    }

    await recordPurchase({
      items: cartItems,
      subtotalCents: cartSubtotalCents,
      taxCents: cartTaxCents,
      totalCents: cartTotalCents,
      targetTier,
      targetHasEventOrganizer: hasEventOrganizer,
    })

    setCartItems([])
    setCurrentScreen('plans')
  }

  const openSupportRequest = (requestType) => {
    const defaults = {
      contact_store_plus_upgrade:
        'Hi CollectorsHub Support,\n\nPlease help me upgrade my account from Store to Store+.\n\nThanks,',
      contact_store_downgrade:
        'Hi CollectorsHub Support,\n\nI need help reviewing downgrade options for my Store account.\n\nThanks,',
    }

    setSupportRequest(requestType)
    setSupportMessageText(defaults[requestType] || 'Hi CollectorsHub Support,')
    setStorePlusLocations('')
    setStorePlusEmployeeCount('')
    setStorePlusAdditionalInfo('')
    setSupportFormError('')
  }

  const closeSupportRequest = () => {
    setSupportRequest(null)
    setSupportFormError('')
  }

  const openStoreUpgradeModal = () => {
    setIsStoreUpgradeModalOpen(true)
    setStoreBusinessName('')
    setStoreBusinessType('')
    setStorePhoneNumber('')
    setStoreBusinessHoursByDay(buildEmptyBusinessHours())
    setStoreRegistrationNumber('')
    setStoreCertificateDetails('')
    setStoreCertificateScanFile(null)
    setStoreProofOfAddressFile(null)
    setStoreAdditionalInfo('')
    setIsSubmittingStoreUpgrade(false)
    setStoreUpgradeError('')
  }

  const closeStoreUpgradeModal = () => {
    setIsStoreUpgradeModalOpen(false)
    setIsSubmittingStoreUpgrade(false)
    setStoreUpgradeError('')
  }

  const openDowngradeModal = (type) => {
    setDowngradeModalType(type)
  }

  const closeDowngradeModal = () => {
    setDowngradeModalType(null)
  }

  const uploadSupportDocument = async (file, label) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const fileName = `${Date.now()}-${label}.${extension}`
    const filePath = `${currentUser.id}/${fileName}`

    const { error } = await supabase.storage
      .from('support-documents')
      .upload(filePath, file, { upsert: false, contentType: file.type || undefined })

    if (error) {
      throw error
    }

    return filePath
  }

  const updateStoreBusinessHours = (day, field, value) => {
    setStoreBusinessHoursByDay((current) => {
      const nextDayState = {
        ...current[day],
        [field]: value,
      }

      if (field === 'open' && value === 'Closed') {
        nextDayState.close = ''
      }

      return {
        ...current,
        [day]: nextDayState,
      }
    })
  }

  const hasValidBusinessHours = () => {
    if (storeBusinessType === 'online') {
      return true
    }

    return BUSINESS_HOUR_DAYS.every((day) => {
      const dayHours = storeBusinessHoursByDay[day]
      if (!dayHours || !dayHours.open) {
        return false
      }

      if (dayHours.open === 'Closed') {
        return true
      }

      return Boolean(dayHours.close)
    })
  }

  const formatBusinessHoursForSubmission = () => {
    if (storeBusinessType === 'online') {
      return 'Online-only business (hours not required)'
    }

    return BUSINESS_HOUR_DAYS.map((day) => {
      const dayHours = storeBusinessHoursByDay[day]
      if (dayHours.open === 'Closed') {
        return `${day}: Closed`
      }

      return `${day}: ${dayHours.open} - ${dayHours.close}`
    }).join('; ')
  }

  const handleSubmitStoreUpgradeRequest = async () => {
    if (!currentUser) {
      setStoreUpgradeError('You must be signed in to submit this request.')
      return
    }

    if (
      !storeBusinessName ||
      !storeBusinessType ||
      !storePhoneNumber ||
      !storeRegistrationNumber ||
      !storeCertificateDetails ||
      !storeCertificateScanFile ||
      !storeProofOfAddressFile
    ) {
      setStoreUpgradeError(
        'Please fill all required fields, including phone number, business hours, certificate details, certificate scan, and proof of address.',
      )
      return
    }

    if (!hasValidBusinessHours()) {
      setStoreUpgradeError('Please select business hours for each day (or choose Online store type).')
      return
    }

    setStoreUpgradeError('')
    setIsSubmittingStoreUpgrade(true)

    try {
      const certificateScanPath = await uploadSupportDocument(storeCertificateScanFile, 'business-certificate')
      const proofOfAddressPath = await uploadSupportDocument(storeProofOfAddressFile, 'proof-of-address')

      const businessHoursSummary = formatBusinessHoursForSubmission()
      const message = `Store Upgrade Request\n\nBusiness name: ${storeBusinessName}\nStore type: ${storeBusinessType}\nPhone number: ${storePhoneNumber}\nBusiness hours: ${businessHoursSummary}\nRegistration number: ${storeRegistrationNumber}\nBusiness certifications: ${storeCertificateDetails}\nAdditional information: ${storeAdditionalInfo || 'N/A'}\n\n---\nAccount Email: ${currentUser?.email || 'Unknown'}\nCurrent Plan: ${getPlanDisplayLabel(profile)}`

      const { error } = await supabase.from('support_requests').insert({
        user_id: currentUser.id,
        user_email: currentUser.email || null,
        request_type: 'store_upgrade_verification',
        subject: 'CollectorsHub Support Request: Store upgrade verification',
        message,
        current_plan: getPlanDisplayLabel(profile),
        business_name: storeBusinessName,
        business_type: storeBusinessType,
        phone_number: storePhoneNumber,
        business_hours: businessHoursSummary,
        registration_number: storeRegistrationNumber,
        certificate_details: storeCertificateDetails,
        certificate_scan_path: certificateScanPath,
        proof_of_address_path: proofOfAddressPath,
        additional_info: storeAdditionalInfo || null,
      })

      if (error) {
        setStoreUpgradeError('Could not submit your store request right now. Please try again.')
        setIsSubmittingStoreUpgrade(false)
        return
      }

      setIsStoreUpgradeModalOpen(false)
      setAuthMessage('Store upgrade request submitted. Our team will review your business details and follow up.')
    } catch (_uploadError) {
      setStoreUpgradeError('Could not upload your documents right now. Please try again.')
    }

    setIsSubmittingStoreUpgrade(false)
  }

  const handleSendSupportEmail = async () => {
    if (!supportRequest) {
      return
    }

    const currentPlanName = getPlanDisplayLabel(profile)
    const reasonLabel =
      supportRequest === 'contact_store_plus_upgrade' ? 'Store to Store+ upgrade' : 'Store downgrade request'

    if (supportRequest === 'contact_store_plus_upgrade') {
      if (!storePlusLocations || !storePlusEmployeeCount) {
        setSupportFormError('Please select both Locations and Employee count before requesting the upgrade.')
        return
      }
    }

    const bodyText =
      supportRequest === 'contact_store_plus_upgrade'
        ? `Upgrade to Store+\nCustom solutions for larger retailers\n\nLocations: ${storePlusLocations}\nEmployee count: ${storePlusEmployeeCount}\nAdditional information: ${storePlusAdditionalInfo || 'N/A'}\n\n---\nAccount Email: ${currentUser?.email || 'Unknown'}\nCurrent Plan: ${currentPlanName}\nRequest Type: ${reasonLabel}`
        : `${supportMessageText}\n\n---\nAccount Email: ${currentUser?.email || 'Unknown'}\nCurrent Plan: ${currentPlanName}\nRequest Type: ${reasonLabel}`

    const { error } = await supabase.from('support_requests').insert({
      user_id: currentUser?.id || null,
      user_email: currentUser?.email || null,
      request_type: supportRequest,
      subject: `CollectorsHub Support Request: ${reasonLabel}`,
      message: bodyText,
      current_plan: currentPlanName,
      locations: supportRequest === 'contact_store_plus_upgrade' ? storePlusLocations : null,
      employee_count: supportRequest === 'contact_store_plus_upgrade' ? storePlusEmployeeCount : null,
      additional_info: supportRequest === 'contact_store_plus_upgrade' ? storePlusAdditionalInfo || null : null,
    })

    if (error) {
      setSupportFormError('Could not submit your request right now. Please try again.')
      return
    }

    setSupportRequest(null)
    setAuthMessage('Support request submitted. Our team will contact you shortly.')
  }

  const recordPurchase = async ({ items, subtotalCents, taxCents, totalCents, targetTier, targetHasEventOrganizer }) => {
    if (!currentUser) {
      return
    }

    const { error } = await supabase.from('subscription_purchases').insert({
      user_id: currentUser.id,
      user_email: currentUser.email || null,
      subtotal_cents: subtotalCents,
      tax_cents: taxCents,
      total_cents: totalCents,
      currency: 'CAD',
      status: 'completed',
      resulting_subscription_tier: targetTier,
      resulting_has_event_organizer: targetHasEventOrganizer,
      line_items: items.map((item) => ({
        tier: item.tier,
        display_name: item.display_name,
        monthly_price_cents: item.monthly_price_cents || 0,
      })),
    })

    if (error) {
      setAuthMessage('Purchase completed, but compliance logging could not be saved.')
    }
  }

  const handleResubscribe = async (resubscribeTarget) => {
    if (!currentUser || !profile) {
      return
    }

    setIsUpdatingPlan(true)

    const updatePayload =
      resubscribeTarget === 'collector_plus'
        ? {
            cancel_at_period_end: false,
            scheduled_downgrade_tier: null,
          }
        : {
            cancel_event_addon_at_period_end: false,
          }

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', currentUser.id)
      .select(profileSelectFields)
      .single()

    if (error) {
      setAuthError(error.message || 'Could not restore subscription renewal right now.')
      setIsUpdatingPlan(false)
      return
    }

    setProfile(data)
    setAuthMessage(
      resubscribeTarget === 'collector_plus'
        ? 'Resubscribed successfully. Collector+ will renew as normal.'
        : 'Resubscribed successfully. Event Organizer will renew as normal.',
    )
    setIsUpdatingPlan(false)
  }

  const handleScheduleCollectorDowngrade = async () => {
    if (!currentUser || !profile) {
      return
    }

    setIsUpdatingPlan(true)
    const periodEnd = profile.subscription_current_period_end || addOneMonthIso(profile.subscription_started_at)

    const { data, error } = await supabase
      .from('profiles')
      .update({
        cancel_at_period_end: true,
        scheduled_downgrade_tier: 'free_collector',
        subscription_current_period_end: periodEnd,
      })
      .eq('id', currentUser.id)
      .select(profileSelectFields)
      .single()

    if (error) {
      setAuthError(error.message || 'Could not schedule your downgrade right now.')
      setIsUpdatingPlan(false)
      return
    }

    setProfile(data)
    setIsUpdatingPlan(false)
    setDowngradeModalType(null)
    setAuthMessage(`Downgrade scheduled. Collector+ will end on ${formatDate(periodEnd)} and your account will move to Free Collector.`)
  }

  const handleScheduleEventAddonRemoval = async () => {
    if (!currentUser || !profile) {
      return
    }

    setIsUpdatingPlan(true)
    const periodEnd = profile.subscription_current_period_end || addOneMonthIso(profile.subscription_started_at)

    const { data, error } = await supabase
      .from('profiles')
      .update({
        cancel_event_addon_at_period_end: true,
        subscription_current_period_end: periodEnd,
      })
      .eq('id', currentUser.id)
      .select(profileSelectFields)
      .single()

    if (error) {
      setAuthError(error.message || 'Could not schedule your add-on removal right now.')
      setIsUpdatingPlan(false)
      return
    }

    setProfile(data)
    setIsUpdatingPlan(false)
    setDowngradeModalType(null)
    setAuthMessage(`Event Organizer will stay active until ${formatDate(periodEnd)} and will then be removed.`)
  }

  const applySubscriptionChange = async (targetTier, targetHasEventOrganizer, successMessage) => {
    if (!currentUser || !profile) {
      return null
    }

    setIsUpdatingPlan(true)

    const isTargetPaid = targetTier !== 'free_collector' || Boolean(targetHasEventOrganizer)
    const updatePayload = {
      subscription_tier: targetTier,
      has_event_organizer: targetHasEventOrganizer,
      billing_cycle: 'monthly',
      cancel_at_period_end: false,
      scheduled_downgrade_tier: null,
      cancel_event_addon_at_period_end: false,
      subscription_started_at: isTargetPaid ? profile.subscription_started_at || new Date().toISOString() : null,
      subscription_current_period_end: isTargetPaid
        ? profile.subscription_current_period_end || addOneMonthIso(profile.subscription_started_at)
        : null,
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', currentUser.id)
      .select(profileSelectFields)
      .single()

    if (error) {
      setAuthError(error.message || 'Could not update your subscription right now.')
      setIsUpdatingPlan(false)
      return null
    }

    setProfile(data)
    setAuthMessage(successMessage)
    setIsUpdatingPlan(false)
    return data
  }

  const getPlanActionMeta = (plan) => {
    const currentTier = profile?.subscription_tier || 'free_collector'
    const hasEventAddon = Boolean(profile?.has_event_organizer)
    const isInCart = cartItems.some((item) => item.tier === plan.tier)

    if (plan.tier === 'event_organizer') {
      if (isBusinessTier(currentTier)) {
        return {
          label: 'Included in Store',
          disabled: true,
          intent: 'included',
          hint: 'Business plans include Event Organizer automatically.',
        }
      }

      if (hasEventAddon) {
        if (profile?.cancel_event_addon_at_period_end) {
          return {
            label: 'Resubscribe',
            disabled: false,
            intent: 'resubscribe_event_addon',
          }
        }

        return {
          label: 'Remove Add-on',
          disabled: false,
          intent: 'remove_event_addon',
        }
      }

      if (currentTier === 'free_collector') {
        return {
          label: isInCart ? 'In Cart' : 'Add to Cart',
          disabled: isInCart,
          intent: 'cart_event_addon',
        }
      }

      return {
        label: 'Add Event Organizer',
        disabled: false,
        intent: 'add_event_addon',
      }
    }

    if (plan.tier === currentTier) {
      if (plan.tier === 'collector_plus' && profile?.cancel_at_period_end) {
        return {
          label: 'Resubscribe',
          disabled: false,
          intent: 'resubscribe_collector_plus',
        }
      }

      return {
        label: 'Current Plan',
        disabled: true,
        intent: 'current',
      }
    }

    if (plan.tier === 'store_pro') {
      if (currentTier === 'store') {
        return {
          label: 'Contact Support',
          disabled: false,
          intent: 'contact_store_plus_upgrade',
          hint: 'Store+ upgrades are handled by our support team.',
        }
      }

      return {
        label: 'Contact Support',
        disabled: false,
        intent: 'contact_store_downgrade',
      }
    }

    if (isBusinessTier(currentTier)) {
      if (currentTier === 'store' && plan.tier === 'store_pro') {
        return { label: 'Upgrade to Store+', disabled: false, intent: 'upgrade_store_plus' }
      }

      if (currentTier === 'store_pro' && plan.tier === 'store') {
        return {
          label: 'Contact Support',
          disabled: false,
          intent: 'contact_store_downgrade',
          hint: 'Downgrading Store accounts is support-assisted.',
        }
      }

      if (isIndividualTier(plan.tier)) {
        return {
          label: 'Contact Support',
          disabled: false,
          intent: 'contact_store_downgrade',
          hint: 'Store plans cannot be combined with collector plans.',
        }
      }

      return { label: 'Contact Support', disabled: false, intent: 'contact_store_downgrade' }
    }

    if (isIndividualTier(currentTier)) {
      if (plan.tier === 'collector_plus') {
        if (currentTier === 'free_collector') {
          return {
            label: isInCart ? 'In Cart' : 'Add to Cart',
            disabled: isInCart,
            intent: 'cart_collector_plus',
          }
        }

        return { label: 'Upgrade to Collector+', disabled: false, intent: 'upgrade_collector_plus' }
      }

      if (plan.tier === 'free_collector') {
        return { label: 'Downgrade', disabled: false, intent: 'downgrade_to_free' }
      }

      if (plan.tier === 'store') {
        return { label: 'Upgrade to Store', disabled: false, intent: 'upgrade_to_store' }
      }

      if (plan.tier === 'store_pro') {
        return {
          label: 'Upgrade to Store First',
          disabled: true,
          intent: 'store_plus_blocked',
          hint: 'Upgrade to Store before moving to Store+.',
        }
      }
    }

    return { label: `Choose ${plan.display_name}`, disabled: false, intent: 'choose' }
  }

  const handlePlanAction = async (plan, intent) => {
    if (!profile) {
      return
    }

    if (intent === 'cart_collector_plus' || intent === 'cart_event_addon') {
      addPlanToCart(plan)
      return
    }

    if (intent === 'add_event_addon') {
      await applySubscriptionChange(
        profile.subscription_tier,
        true,
        'Event Organizer add-on enabled. You can now create and manage events.',
      )
      return
    }

    if (intent === 'remove_event_addon') {
      openDowngradeModal('event_addon')
      return
    }

    if (intent === 'upgrade_collector_plus') {
      await applySubscriptionChange('collector_plus', Boolean(profile.has_event_organizer), 'Collector+ is now active.')
      return
    }

    if (intent === 'downgrade_to_free') {
      if (profile.subscription_tier === 'collector_plus') {
        openDowngradeModal('collector_plus')
        return
      }

      await applySubscriptionChange('free_collector', Boolean(profile.has_event_organizer), 'You are now on Free Collector.')
      return
    }

    if (intent === 'upgrade_to_store') {
      openStoreUpgradeModal()
      return
    }

    if (intent === 'upgrade_store_plus') {
      await applySubscriptionChange('store_pro', true, 'Store+ is now active.')
      return
    }

    if (intent === 'contact_store_downgrade') {
      openSupportRequest('contact_store_downgrade')
      return
    }

    if (intent === 'contact_store_plus_upgrade') {
      openSupportRequest('contact_store_plus_upgrade')
      return
    }

    if (intent === 'resubscribe_collector_plus') {
      await handleResubscribe('collector_plus')
      return
    }

    if (intent === 'resubscribe_event_addon') {
      await handleResubscribe('event_addon')
      return
    }

    if (intent === 'choose') {
      handleMenuAction(`Choose ${plan.display_name}`)
    }
  }

  const handleOpenPlans = () => {
    setCurrentScreen('plans')
    setIsUserMenuOpen(false)
    setIsLanguageMenuOpen(false)
    setIsLocationMenuOpen(false)
  }

  const handleGoHome = () => {
    setCurrentScreen('home')
    setIsUserMenuOpen(false)
    setIsLanguageMenuOpen(false)
    setIsLocationMenuOpen(false)
  }

  const formatPlanPrice = (priceCents) => {
    if (priceCents === null || priceCents === undefined) {
      return 'Contact Sales'
    }

    if (priceCents === 0) {
      return 'Free'
    }

    const dollars = priceCents / 100
    const formatted = Number.isInteger(dollars) ? dollars.toString() : dollars.toFixed(2)
    return `$${formatted}/month`
  }

  const handleCreateCustomCollection = async () => {
    if (!currentUser?.id || !newCustomCollectionName.trim() || isCreatingCustomCollection) {
      return
    }

    setIsCreatingCustomCollection(true)
    try {
      const { error } = await supabase
        .from('collections')
        .insert({
          user_id: currentUser.id,
          name: newCustomCollectionName.trim(),
          is_public: false,
        })

      if (error) {
        setCollectionLoadError(error.message || 'Could not create collection right now.')
        return
      }

      setNewCustomCollectionName('')
      setCollectionLoadError('')
      setCollectionReloadToken((currentToken) => currentToken + 1)
    } finally {
      setIsCreatingCustomCollection(false)
    }
  }

  const handleCreateStorageLocation = async () => {
    if (!currentUser?.id || !newStorageLocationName.trim() || isCreatingStorageLocation) {
      return
    }

    setIsCreatingStorageLocation(true)
    try {
      const { error } = await supabase
        .from('storage_locations')
        .insert({
          user_id: currentUser.id,
          name: newStorageLocationName.trim(),
          parent_location_id: newStorageParentLocationId || null,
        })

      if (error) {
        setCollectionLoadError(error.message || 'Could not create storage location right now.')
        return
      }

      setNewStorageLocationName('')
      setCollectionLoadError('')
      setCollectionReloadToken((currentToken) => currentToken + 1)
    } finally {
      setIsCreatingStorageLocation(false)
    }
  }

  const handleRenameActiveCollection = async () => {
    if (!currentUser?.id || activeCollectionFilter === 'all') {
      return
    }

    const currentCollection = customCollections.find((collection) => collection.id === activeCollectionFilter)
    if (!currentCollection) {
      return
    }

    const nextName = window.prompt('Rename collection', currentCollection.name || '')
    if (!nextName || !nextName.trim() || nextName.trim() === currentCollection.name) {
      return
    }

    const { error } = await supabase
      .from('collections')
      .update({ name: nextName.trim() })
      .eq('id', currentCollection.id)

    if (error) {
      setCollectionLoadError(error.message || 'Could not rename collection right now.')
      return
    }

    setCollectionLoadError('')
    setCollectionReloadToken((currentToken) => currentToken + 1)
  }

  const handleDeleteActiveCollection = async () => {
    if (!currentUser?.id || activeCollectionFilter === 'all') {
      return
    }

    const currentCollection = customCollections.find((collection) => collection.id === activeCollectionFilter)
    if (!currentCollection) {
      return
    }

    const confirmed = window.confirm(`Delete collection "${currentCollection.name}"?`)
    if (!confirmed) {
      return
    }

    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', currentCollection.id)

    if (error) {
      setCollectionLoadError(error.message || 'Could not delete collection right now.')
      return
    }

    setActiveCollectionFilter('all')
    setCollectionLoadError('')
    setCollectionReloadToken((currentToken) => currentToken + 1)
  }

  const handleRenameActiveStorageLocation = async () => {
    if (!currentUser?.id || !activeStorageFilter) {
      return
    }

    const currentLocation = storageLocations.find((location) => location.id === activeStorageFilter)
    if (!currentLocation) {
      return
    }

    const nextName = window.prompt('Rename storage location', currentLocation.name || '')
    if (!nextName || !nextName.trim() || nextName.trim() === currentLocation.name) {
      return
    }

    const { error } = await supabase
      .from('storage_locations')
      .update({ name: nextName.trim() })
      .eq('id', currentLocation.id)

    if (error) {
      setCollectionLoadError(error.message || 'Could not rename storage location right now.')
      return
    }

    setCollectionLoadError('')
    setCollectionReloadToken((currentToken) => currentToken + 1)
  }

  const handleDeleteActiveStorageLocation = async () => {
    if (!currentUser?.id || !activeStorageFilter) {
      return
    }

    const currentLocation = storageLocations.find((location) => location.id === activeStorageFilter)
    if (!currentLocation) {
      return
    }

    const confirmed = window.confirm(`Delete storage location "${currentLocation.name}"?`)
    if (!confirmed) {
      return
    }

    const { error } = await supabase
      .from('storage_locations')
      .delete()
      .eq('id', currentLocation.id)

    if (error) {
      setCollectionLoadError(error.message || 'Could not delete storage location right now.')
      return
    }

    setActiveStorageFilter('')
    setCollectionLoadError('')
    setCollectionReloadToken((currentToken) => currentToken + 1)
  }

  const handleMoveActiveStorageLocation = async (nextParentLocationId) => {
    if (!currentUser?.id || !activeStorageFilter) {
      return
    }

    if (nextParentLocationId === activeStorageFilter) {
      setCollectionLoadError('A location cannot be its own parent.')
      return
    }

    const { error } = await supabase
      .from('storage_locations')
      .update({ parent_location_id: nextParentLocationId || null })
      .eq('id', activeStorageFilter)

    if (error) {
      setCollectionLoadError(error.message || 'Could not move storage location right now.')
      return
    }

    setCollectionLoadError('')
    setCollectionReloadToken((currentToken) => currentToken + 1)
  }

  const handleToggleCollectionMembership = async (item, targetCollectionId) => {
    const inventoryItemIds = Array.isArray(item?.inventoryItemIds) ? item.inventoryItemIds.filter(Boolean) : []
    if (!currentUser?.id || !targetCollectionId || inventoryItemIds.length === 0 || isSavingCollectionOrganization) {
      return
    }

    setIsSavingCollectionOrganization(true)
    try {
      const isInCollection = Array.isArray(item?.collectionIds) && item.collectionIds.includes(targetCollectionId)
      if (isInCollection) {
        const { error } = await supabase
          .from('collection_items')
          .delete()
          .eq('collection_id', targetCollectionId)
          .in('owned_copy_id', inventoryItemIds)

        if (error) {
          setCollectionLoadError(error.message || 'Could not remove item from collection right now.')
          return
        }
      } else {
        const payload = inventoryItemIds.map((inventoryItemId) => ({
          collection_id: targetCollectionId,
          owned_copy_id: inventoryItemId,
        }))

        const { error } = await supabase
          .from('collection_items')
          .upsert(payload, { onConflict: 'collection_id,owned_copy_id', ignoreDuplicates: true })

        if (error) {
          setCollectionLoadError(error.message || 'Could not add item to collection right now.')
          return
        }
      }

      setCollectionLoadError('')
      setCollectionReloadToken((currentToken) => currentToken + 1)
    } finally {
      setIsSavingCollectionOrganization(false)
    }
  }

  const handleAssignStorageLocationToItem = async (item, targetLocationId) => {
    const inventoryItemIds = Array.isArray(item?.inventoryItemIds) ? item.inventoryItemIds.filter(Boolean) : []
    if (!currentUser?.id || inventoryItemIds.length === 0 || isSavingCollectionOrganization) {
      return
    }

    setIsSavingCollectionOrganization(true)
    try {
      const { error: deleteError } = await supabase
        .from('inventory_item_locations')
        .delete()
        .in('owned_copy_id', inventoryItemIds)

      if (deleteError) {
        setCollectionLoadError(deleteError.message || 'Could not update storage location right now.')
        return
      }

      if (targetLocationId) {
        const payload = inventoryItemIds.map((inventoryItemId) => ({
          owned_copy_id: inventoryItemId,
          storage_location_id: targetLocationId,
        }))

        const { error: insertError } = await supabase
          .from('inventory_item_locations')
          .upsert(payload, { onConflict: 'owned_copy_id,storage_location_id', ignoreDuplicates: true })

        if (insertError) {
          setCollectionLoadError(insertError.message || 'Could not update storage location right now.')
          return
        }
      }

      setCollectionLoadError('')
      setCollectionReloadToken((currentToken) => currentToken + 1)
    } finally {
      setIsSavingCollectionOrganization(false)
    }
  }

  const storageLocationPathById = buildStorageLocationPathById(storageLocations)
  const normalizedCollectionSearch = collectionSearchQuery.trim().toLowerCase()
  const filteredCollectionItems = collectionItems.filter((item) => {
    if (activeCollectionFilter !== 'all') {
      if (!Array.isArray(item.collectionIds) || !item.collectionIds.includes(activeCollectionFilter)) {
        return false
      }
    }

    if (activeStorageFilter) {
      if (!Array.isArray(item.locationIds) || !item.locationIds.includes(activeStorageFilter)) {
        return false
      }
    }

    if (!normalizedCollectionSearch) {
      return true
    }

    const searchText = [
      item.name,
      item.setName,
      item.categoryName,
      item.subcategoryName,
      ...(Array.isArray(item.collectionNames) ? item.collectionNames : []),
      ...(Array.isArray(item.locationPaths) ? item.locationPaths : []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return searchText.includes(normalizedCollectionSearch)
  })

  const filteredCollectionItemIds = new Set(filteredCollectionItems.map((item) => item.id))
  const filteredInventoryRows = collectionInventoryRows.filter((row) => filteredCollectionItemIds.has(row.catalogItemId))
  const collectionOverviewTotalPages = Math.max(1, Math.ceil(filteredCollectionItems.length / COLLECTION_OVERVIEW_PAGE_SIZE))
  const collectionOverviewPageStart = (collectionOverviewPage - 1) * COLLECTION_OVERVIEW_PAGE_SIZE
  const paginatedCollectionItems = filteredCollectionItems.slice(
    collectionOverviewPageStart,
    collectionOverviewPageStart + COLLECTION_OVERVIEW_PAGE_SIZE,
  )
  const selectedCollectionItemDetails = collectionItems.find((item) => item.id === selectedCollectionItemDetailsId) || null
  const selectedCollectionItemCopyRows = selectedCollectionItemDetails
    ? collectionInventoryRows
        .filter((row) => row.catalogItemId === selectedCollectionItemDetails.id)
        .sort((left, right) => (right.createdAt || '').localeCompare(left.createdAt || ''))
    : []
  const boundedSelectedCollectionCopyIndex =
    selectedCollectionItemCopyRows.length > 0
      ? Math.min(Math.max(selectedCollectionCopyIndex, 0), selectedCollectionItemCopyRows.length - 1)
      : 0
  const selectedCollectionCopyRow = selectedCollectionItemCopyRows[boundedSelectedCollectionCopyIndex] || null
  const selectedCollectionCopyMetadata =
    selectedCollectionCopyRow?.metadata && typeof selectedCollectionCopyRow.metadata === 'object'
      ? selectedCollectionCopyRow.metadata
      : {}
  const selectedCollectionCopyFrontImageUrl =
    (typeof selectedCollectionCopyRow?.frontImageUrl === 'string' && selectedCollectionCopyRow.frontImageUrl.trim()) ||
    (typeof selectedCollectionCopyMetadata.front_image_url === 'string' && selectedCollectionCopyMetadata.front_image_url.trim()) ||
    (typeof selectedCollectionCopyMetadata.user_image_url === 'string' && selectedCollectionCopyMetadata.user_image_url.trim()) ||
    ''
  const selectedCollectionCopyBackImageUrl =
    (typeof selectedCollectionCopyRow?.backImageUrl === 'string' && selectedCollectionCopyRow.backImageUrl.trim()) ||
    (typeof selectedCollectionCopyMetadata.back_image_url === 'string' && selectedCollectionCopyMetadata.back_image_url.trim()) ||
    ''
  const selectedCollectionCopyImageUrl =
    selectedCollectionCopyFrontImageUrl ||
    (typeof selectedCollectionCopyMetadata.image_url === 'string' && selectedCollectionCopyMetadata.image_url.trim()) ||
    selectedCollectionItemDetails?.imageUrl ||
    ''
  const selectedCollectionCopyCondition =
    selectedCollectionCopyRow?.condition ||
    (selectedCollectionCopyRow?.gradingCompany
      ? `${selectedCollectionCopyRow.gradingCompany}${selectedCollectionCopyRow.grade ? ` ${selectedCollectionCopyRow.grade}` : ''}`
      : '')
  const selectedCollectionCopyCollection = Array.isArray(selectedCollectionCopyRow?.collectionNames) && selectedCollectionCopyRow.collectionNames.length > 0
    ? selectedCollectionCopyRow.collectionNames.join(', ')
    : 'Personal Collection'
  const selectedCollectionCopyLocation = Array.isArray(selectedCollectionCopyRow?.locationPaths) && selectedCollectionCopyRow.locationPaths.length > 0
    ? selectedCollectionCopyRow.locationPaths.join(', ')
    : 'Location Not Set'
  const selectedCollectionCopyAcquiredLabel = selectedCollectionCopyRow?.createdAt
    ? new Date(selectedCollectionCopyRow.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Acquired Date Not Set'
  const selectedCollectionCopyIsListed = selectedCollectionCopyRow?.visibility === 'listed'
  const selectedCollectionCopyListingPrice = selectedCollectionCopyIsListed && Number.isFinite(Number(selectedCollectionCopyRow?.salePrice))
    ? Number(selectedCollectionCopyRow.salePrice)
    : null
  const selectedCollectionCopyProfitLoss = Number(selectedCollectionCopyRow?.currentMarketValue || 0) - Number(selectedCollectionCopyRow?.purchasePrice || 0)
  const selectedCollectionCopyProfitLossPercent =
    Number(selectedCollectionCopyRow?.purchasePrice) > 0 && Number(selectedCollectionCopyRow?.currentMarketValue) > 0
      ? (selectedCollectionCopyProfitLoss / Number(selectedCollectionCopyRow.purchasePrice)) * 100
      : null
  const selectedCollectionCopyHasMarketValue = Number(selectedCollectionCopyRow?.currentMarketValue) > 0
  const listingRequirementItems = [
    { label: 'Condition', complete: Boolean(selectedCollectionCopyCondition) },
    { label: 'Front Photo', complete: Boolean(selectedCollectionCopyFrontImageUrl) },
    { label: 'Back Photo', complete: Boolean(selectedCollectionCopyBackImageUrl) },
  ]
  const canListSelectedCollectionCopy = listingRequirementItems.every((item) => item.complete)

  useEffect(() => {
    if (selectedCollectionItemCopyRows.length === 0) {
      setSelectedCollectionCopyIndex(0)
      setCollectionCopySalePriceInput('')
      return
    }

    if (selectedCollectionCopyIndex >= selectedCollectionItemCopyRows.length) {
      setSelectedCollectionCopyIndex(0)
      return
    }

    const currentSalePrice = selectedCollectionCopyRow?.salePrice
    setCollectionCopySalePriceInput(
      Number.isFinite(Number(currentSalePrice)) ? String(Number(currentSalePrice)) : '',
    )
  }, [selectedCollectionItemCopyRows, selectedCollectionCopyIndex, selectedCollectionCopyRow?.salePrice])

  const collectibleSetById = collectibleSets.reduce((accumulator, item) => {
    if (item?.id) {
      accumulator[item.id] = item
    }
    return accumulator
  }, {})
  const overallCollectionValue = filteredCollectionItems.reduce((total, item) => total + Number(item.currentMarketValue || 0), 0)
  const overallTotalInvested = filteredCollectionItems.reduce((total, item) => total + Number(item.totalInvested || 0), 0)
  const overallProfitLoss = overallCollectionValue - overallTotalInvested
  const overallRoi = overallTotalInvested > 0 ? (overallProfitLoss / overallTotalInvested) * 100 : null
  const mostValuableItem = filteredCollectionItems.reduce((currentBest, item) => {
    if (!currentBest || Number(item.currentMarketValue || 0) > Number(currentBest.currentMarketValue || 0)) {
      return item
    }
    return currentBest
  }, null)
  const largestGainItem = filteredCollectionItems.reduce((currentBest, item) => {
    if (!currentBest || Number(item.profitLoss || 0) > Number(currentBest.profitLoss || 0)) {
      return item
    }
    return currentBest
  }, null)
  const largestLossItem = filteredCollectionItems.reduce((currentWorst, item) => {
    if (!currentWorst || Number(item.profitLoss || 0) < Number(currentWorst.profitLoss || 0)) {
      return item
    }
    return currentWorst
  }, null)
  const allocationByCategory = Object.values(
    filteredCollectionItems.reduce((accumulator, item) => {
      const categoryName = item.categoryName || 'Uncategorized'
      if (!accumulator[categoryName]) {
        accumulator[categoryName] = {
          categoryName,
          currentMarketValue: 0,
          totalInvested: 0,
          itemCount: 0,
        }
      }

      accumulator[categoryName].currentMarketValue += Number(item.currentMarketValue || 0)
      accumulator[categoryName].totalInvested += Number(item.totalInvested || 0)
      accumulator[categoryName].itemCount += Number(item.totalQuantity || 0)
      return accumulator
    }, {}),
  )
    .map((entry) => ({
      ...entry,
      allocationPercent: overallCollectionValue > 0 ? (entry.currentMarketValue / overallCollectionValue) * 100 : 0,
      roi: entry.totalInvested > 0 ? ((entry.currentMarketValue - entry.totalInvested) / entry.totalInvested) * 100 : null,
    }))
    .sort((left, right) => right.currentMarketValue - left.currentMarketValue)
  const monthlyAnalytics = Object.values(
    filteredInventoryRows.reduce((accumulator, row) => {
      const bucket = row.monthBucket || 'Unknown'
      if (!accumulator[bucket]) {
        accumulator[bucket] = {
          label: bucket,
          investedValue: 0,
          currentMarketValue: 0,
          itemCount: 0,
        }
      }

      accumulator[bucket].investedValue += Number(row.investedValue || 0)
      accumulator[bucket].currentMarketValue += Number(row.currentMarketValue || 0)
      accumulator[bucket].itemCount += Number(row.quantity || 0)
      return accumulator
    }, {}),
  ).sort((left, right) => left.label.localeCompare(right.label))
  const customCollectionPerformance = customCollections.map((collection) => {
    const matchingItems = filteredCollectionItems.filter((item) => Array.isArray(item.collectionIds) && item.collectionIds.includes(collection.id))
    const currentMarketValue = matchingItems.reduce((total, item) => total + Number(item.currentMarketValue || 0), 0)
    const totalInvested = matchingItems.reduce((total, item) => total + Number(item.totalInvested || 0), 0)
    const trackedGoalsForCollection = trackedCollectionGoals.filter((goal) => goal.collection_id === collection.id)
    const collectionGoalProgress = trackedGoalsForCollection.length > 0
      ? trackedGoalsForCollection.reduce((total, goal) => {
          const targetSet = collectibleSetById[goal.collectible_set_id]
          if (!targetSet) {
            return total
          }

          const normalizedSetName = (targetSet.set_name || '').trim().toLowerCase()
          const normalizedCategoryName = (targetSet.category_name || '').trim().toLowerCase()

          const matchingCount = matchingItems.filter(
            (item) =>
              (item.categoryName || '').trim().toLowerCase() === normalizedCategoryName &&
              (item.setName || '').trim().toLowerCase() === normalizedSetName,
          ).length
          return total + (targetSet.total_items > 0 ? (matchingCount / targetSet.total_items) * 100 : 0)
        }, 0) / trackedGoalsForCollection.length
      : null

    return {
      id: collection.id,
      name: collection.name,
      itemCount: matchingItems.reduce((total, item) => total + Number(item.totalQuantity || 0), 0),
      currentMarketValue,
      totalInvested,
      roi: totalInvested > 0 ? ((currentMarketValue - totalInvested) / totalInvested) * 100 : null,
      completionPercent: collectionGoalProgress,
    }
  })
  const ownedItemsByCatalogId = collectionItems.reduce((accumulator, item) => {
    if (item?.id) {
      accumulator[item.id] = item
    }
    return accumulator
  }, {})
  const ownedCatalogItemIds = new Set(Object.keys(ownedItemsByCatalogId))
  const collectibleSetEntriesBySetId = collectibleSetEntries.reduce((accumulator, entry) => {
    if (!entry?.collectible_set_id) {
      return accumulator
    }
    if (!accumulator[entry.collectible_set_id]) {
      accumulator[entry.collectible_set_id] = []
    }
    accumulator[entry.collectible_set_id].push(entry)
    return accumulator
  }, {})
  const startedSetCards = collectibleSets
    .map((setRecord) => {
      const setEntries = collectibleSetEntriesBySetId[setRecord.id] || []
      const normalizedSetName = (setRecord.set_name || '').trim().toLowerCase()
      const normalizedCategoryName = (setRecord.category_name || '').trim().toLowerCase()
      const fallbackOwnedItems = collectionItems.filter(
        (item) =>
          (item.setName || '').trim().toLowerCase() === normalizedSetName &&
          (item.categoryName || '').trim().toLowerCase() === normalizedCategoryName,
      )
      const totalItems = setEntries.length > 0 ? setEntries.length : Number(setRecord.total_items || 0)
      const ownedEntries = setEntries.filter(
        (entry) => entry?.catalog_item_id && ownedCatalogItemIds.has(entry.catalog_item_id),
      )
      const ownedCount = ownedEntries.length > 0 ? ownedEntries.length : fallbackOwnedItems.length

      if (ownedCount <= 0) {
        return null
      }

      const ownedValue = ownedEntries.length > 0
        ? ownedEntries.reduce((total, entry) => {
            const ownedItem = ownedItemsByCatalogId[entry.catalog_item_id]
            return total + Number(ownedItem?.currentMarketValue || 0)
          }, 0)
        : fallbackOwnedItems.reduce((total, ownedItem) => total + Number(ownedItem?.currentMarketValue || 0), 0)
      const completionPercent = totalItems > 0 ? (ownedCount / totalItems) * 100 : 0
      const missingCount = totalItems > 0 ? Math.max(totalItems - ownedCount, 0) : 0
      const estimatedRemainingCost = Number.isFinite(Number(setRecord.total_estimated_value))
        ? Math.max(Number(setRecord.total_estimated_value) - ownedValue, 0)
        : null

      return {
        id: setRecord.id,
        title: setRecord.set_name || 'Set',
        categoryName: setRecord.category_name || '',
        setName: setRecord.set_name || '',
        ownedCount,
        totalItems,
        completionPercent,
        missingCount,
        ownedValue,
        estimatedRemainingCost,
        breakdown: setRecord.breakdown && typeof setRecord.breakdown === 'object' ? setRecord.breakdown : {},
      }
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (right.completionPercent !== left.completionPercent) {
        return right.completionPercent - left.completionPercent
      }
      return (left.title || '').localeCompare(right.title || '')
    })
  const selectedCompletionSet = startedSetCards.find((setCard) => setCard.id === selectedCompletionSetId) || null
  const selectedCompletionSetEntries = selectedCompletionSet
    ? (() => {
        const setEntries = collectibleSetEntriesBySetId[selectedCompletionSet.id] || []
        if (setEntries.length > 0) {
          return setEntries.map((entry) => {
            const ownedItem = entry?.catalog_item_id ? ownedItemsByCatalogId[entry.catalog_item_id] : null
            return {
              id: entry.id,
              itemName: entry.item_name || ownedItem?.name || entry.item_key || 'Unknown item',
              itemKey: entry.item_key || '',
              rarity: entry.rarity || '',
              isOwned: Boolean(ownedItem),
              quantity: Number(ownedItem?.totalQuantity || 0),
              marketValue: Number(ownedItem?.currentMarketValue || 0),
              estimatedPrice: Number(entry?.estimated_market_price || 0),
            }
          })
        }

        const normalizedSetName = (selectedCompletionSet.setName || '').trim().toLowerCase()
        const normalizedCategoryName = (selectedCompletionSet.categoryName || '').trim().toLowerCase()
        return collectionItems
          .filter(
            (item) =>
              (item.setName || '').trim().toLowerCase() === normalizedSetName &&
              (item.categoryName || '').trim().toLowerCase() === normalizedCategoryName,
          )
          .map((item) => ({
            id: `owned-${selectedCompletionSet.id}-${item.id}`,
            itemName: item.name || 'Owned item',
            itemKey: item.id,
            rarity: '',
            isOwned: true,
            quantity: Number(item.totalQuantity || 0),
            marketValue: Number(item.currentMarketValue || 0),
            estimatedPrice: 0,
          }))
      })()
    : []
  const startedSetIdsKey = startedSetCards
    .map((setCard) => setCard.id)
    .sort()
    .join('|')
  const trackedGoalSetIdsKey = trackedCollectionGoals
    .map((goal) => goal.collectible_set_id)
    .filter(Boolean)
    .sort()
    .join('|')

  useEffect(() => {
    if (!currentUser?.id || !startedSetIdsKey || isAutoSyncingCompletionGoalsRef.current) {
      return
    }

    const existingGoalSetIds = new Set(
      trackedCollectionGoals
        .map((goal) => goal.collectible_set_id)
        .filter(Boolean),
    )
    const setsToTrack = startedSetCards.filter((setCard) => !existingGoalSetIds.has(setCard.id))
    if (setsToTrack.length === 0) {
      return
    }

    let isCancelled = false
    const syncStartedSetsAsGoals = async () => {
      isAutoSyncingCompletionGoalsRef.current = true
      try {
        const goalRows = setsToTrack.map((setCard) => ({
          user_id: currentUser.id,
          goal_type: 'set_completion',
          title: setCard.setName || 'Tracked Set',
          collectible_set_id: setCard.id,
          category_name: setCard.categoryName || null,
          set_name: setCard.setName || null,
          is_active: true,
        }))

        const { error } = await supabase
          .from('user_collection_goals')
          .insert(goalRows)

        if (!isCancelled && !error) {
          setGoalReloadToken((currentToken) => currentToken + 1)
        }
      } finally {
        isAutoSyncingCompletionGoalsRef.current = false
      }
    }

    syncStartedSetsAsGoals()

    return () => {
      isCancelled = true
    }
  }, [currentUser?.id, startedSetCards, startedSetIdsKey, trackedCollectionGoals, trackedGoalSetIdsKey])

  const marketplaceCompletionMatches = selectedCatalogItem
    ? startedSetCards.filter(
        (setCard) =>
          setCard.categoryName === (selectedCatalogItem.categoryName || '') &&
          setCard.setName === ((selectedCatalogItem?.metadata?.set || selectedCatalogItem?.dynamic_fields?.set || selectedCatalogItem?.dynamic_fields?.series || '').trim()),
      )
    : []

  useEffect(() => {
    if (startedSetCards.length === 0) {
      if (selectedCompletionSetId) {
        setSelectedCompletionSetId('')
      }
      return
    }

    const selectedStillExists = startedSetCards.some((setCard) => setCard.id === selectedCompletionSetId)
    if (!selectedStillExists) {
      setSelectedCompletionSetId(startedSetCards[0].id)
    }
  }, [selectedCompletionSetId, startedSetCards])

  useEffect(() => {
    setCollectionOverviewPage(1)
  }, [activeCollectionFilter, activeStorageFilter, collectionSearchQuery])

  useEffect(() => {
    if (collectionOverviewPage > collectionOverviewTotalPages) {
      setCollectionOverviewPage(collectionOverviewTotalPages)
    }
  }, [collectionOverviewPage, collectionOverviewTotalPages])

  useEffect(() => {
    if (!selectedCollectionItemDetailsId) {
      return
    }

    const selectedStillVisible = filteredCollectionItems.some((item) => item.id === selectedCollectionItemDetailsId)
    if (!selectedStillVisible) {
      setSelectedCollectionItemDetailsId('')
    }
  }, [filteredCollectionItems, selectedCollectionItemDetailsId])

  const renewalStatus = profile?.cancel_at_period_end || profile?.cancel_event_addon_at_period_end
    ? 'Changes scheduled for period end'
    : 'Auto-renew enabled'
  const isCollectorDowngradeModal = downgradeModalType === 'collector_plus'
  const isEventAddonDowngradeModal = downgradeModalType === 'event_addon'
  const cartSubtotalCents = cartItems.reduce((total, item) => total + (item.monthly_price_cents || 0), 0)
  const cartTaxCents = Math.round(cartSubtotalCents * 0.14)
  const cartTotalCents = cartSubtotalCents + cartTaxCents
  const collectionSummary = filteredCollectionItems.reduce(
    (accumulator, item) => {
      accumulator.uniqueItems += 1
      accumulator.totalCopies += Number(item.totalQuantity || 0)
      accumulator.totalInvested += Number(item.totalInvested || 0)
      accumulator.totalValue += Number(item.currentMarketValue || 0)
      accumulator.gradedCopies += Number(item.gradedCopies || 0)
      return accumulator
    },
    {
      uniqueItems: 0,
      totalCopies: 0,
      totalInvested: 0,
      totalValue: 0,
      gradedCopies: 0,
    },
  )

  if (posSession) {
    return <StorePOSDashboard session={posSession} onLogout={() => setPosSession(null)} />
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <button type="button" className="brand brand-button" onClick={handleGoHome}>
          <span className="brand-mark">CH</span>
          <span className="brand-name">CollectorsHub</span>
        </button>
        <div className="user-menu location-switch" ref={locationMenuRef}>
          <button
            className="delivery-pill location-trigger"
            type="button"
            aria-haspopup="menu"
            aria-expanded={isLocationMenuOpen}
            onClick={() => {
              setIsLocationMenuOpen((currentState) => !currentState)
              setIsLanguageMenuOpen(false)
              setIsUserMenuOpen(false)
            }}
          >
            {t('deliveringTo')}: {selectedDeliveryLocation}
            <span className={`menu-chevron ${isLocationMenuOpen ? 'open' : ''}`}>&#9662;</span>
          </button>

          {isLocationMenuOpen && (
            <div className="user-dropdown location-dropdown" role="menu">
              <button
                type="button"
                className="user-menu-item location-option"
                onClick={detectCurrentDeliveryLocation}
                disabled={isDetectingLocation || isResolvingSearchArea}
              >
                {isDetectingLocation
                  ? t('detectingLocation')
                  : isResolvingSearchArea
                    ? t('resolvingArea')
                    : t('useCurrentLocation')}
              </button>

              <div className="location-entry-row">
                <input
                  type="text"
                  className="location-entry-input"
                  value={customDeliveryLocationInput}
                  onChange={(event) => setCustomDeliveryLocationInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleAddCustomDeliveryLocation()
                    }
                  }}
                  placeholder={t('addLocationPlaceholder')}
                />
                <button
                  type="button"
                  className="auth-submit location-entry-add"
                  onClick={handleAddCustomDeliveryLocation}
                  disabled={isDetectingLocation || isResolvingSearchArea}
                >
                  {t('addLocationAction')}
                </button>
              </div>

              {isLocationAutocompleteLoading && (
                <p className="location-menu-empty">{t('areaAutocompleteLoading')}</p>
              )}

              {!isLocationAutocompleteLoading &&
                customDeliveryLocationInput.trim().length >= LOCATION_AUTOCOMPLETE_MIN_CHARS &&
                locationAutocompleteOptions.length === 0 && (
                <p className="location-menu-empty">{t('areaAutocompleteNoMatch')}</p>
              )}

              {locationAutocompleteOptions.length > 0 && (
                <div className="location-autocomplete-list">
                  {locationAutocompleteOptions.map((option) => (
                    <button
                      key={`${option.label}-${option.latitude}-${option.longitude}`}
                      type="button"
                      className="user-menu-item location-option location-autocomplete-option"
                      onClick={() => handleSelectAutocompleteArea(option)}
                      disabled={isDetectingLocation || isResolvingSearchArea}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}

              {isResolvingSearchArea && <p className="location-menu-empty">{t('resolvingArea')}</p>}

              {locationDetectError && <p className="location-menu-error">{locationDetectError}</p>}

              {deliveryLocationOptions.length === 0 && (
                <p className="location-menu-empty">{t('noKnownLocations')}</p>
              )}

              {deliveryLocationOptions.map((locationName) => (
                <button
                  key={locationName}
                  type="button"
                  className={`user-menu-item location-option ${selectedDeliveryLocation === locationName ? 'active' : ''}`}
                  onClick={() => handleDeliveryLocationChange(locationName)}
                  disabled={isDetectingLocation || isResolvingSearchArea}
                >
                  {locationName}
                </button>
              ))}
            </div>
          )}
        </div>
        <label className="search-wrap" htmlFor="site-search">
          <span className="search-icon">&#9675;</span>
          <input
            id="site-search"
            type="search"
            placeholder={t('searchPlaceholder')}
            value={siteSearchQuery}
            onChange={(event) => handleSiteSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleSiteSearchSubmit()
              }
            }}
          />
        </label>
        <div className="top-actions">
          <div className="user-menu language-switch" ref={languageMenuRef}>
            <button
              type="button"
              className="small-action language-trigger"
              aria-haspopup="menu"
              aria-expanded={isLanguageMenuOpen}
              aria-label={t('languageSelectorAria')}
              onClick={() => {
                setIsLanguageMenuOpen((currentState) => !currentState)
                setIsUserMenuOpen(false)
                setIsLocationMenuOpen(false)
              }}
            >
              {LANGUAGE_OPTIONS.find((option) => option.value === activeLanguage)?.code || 'EN'} - {activeLanguage}
              <span className={`menu-chevron ${isLanguageMenuOpen ? 'open' : ''}`}>&#9662;</span>
            </button>

            {isLanguageMenuOpen && (
              <div className="user-dropdown language-dropdown" role="menu">
                {LANGUAGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`user-menu-item language-option ${activeLanguage === option.value ? 'active' : ''}`}
                    onClick={() => handleLanguageChange(option.value)}
                  >
                    {option.code} - {option.value}
                  </button>
                ))}
              </div>
            )}
          </div>
          {currentUser ? (
            <div className="user-menu" ref={userMenuRef}>
              <button
                type="button"
                className="user-pill user-menu-trigger"
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                onClick={() => {
                  setIsUserMenuOpen((currentState) => !currentState)
                  setIsLanguageMenuOpen(false)
                  setIsLocationMenuOpen(false)
                }}
              >
                <span className="user-avatar" aria-hidden="true">
                  {avatarImage ? (
                    <img src={avatarImage} alt="" />
                  ) : (
                    <span>{avatarFallback}</span>
                  )}
                </span>
                <span className="user-email">{topbarUserName}</span>
                <span className={`menu-chevron ${isUserMenuOpen ? 'open' : ''}`}>&#9662;</span>
              </button>

              {isUserMenuOpen && (
                <div className="user-dropdown" role="menu">
                  <button type="button" className="user-tier-row tier-action" onClick={handleOpenPlans}>
                    &#11088; {getPlanDisplayLabel(profile) || tierLabel || 'Free Collector'}
                  </button>
                  <button type="button" className="user-menu-item upgrade" onClick={handleOpenPlans}>
                    {t('manageSubscription')}
                  </button>
                  <button
                    type="button"
                    className="user-menu-item"
                    onClick={() => handleMenuAction(t('myProfile'))}
                  >
                    {t('myProfile')}
                  </button>
                  <button
                    type="button"
                    className="user-menu-item"
                    onClick={() => handleMenuAction(t('myListings'))}
                  >
                    {t('myListings')}
                  </button>
                  <button
                    type="button"
                    className="user-menu-item"
                    onClick={handleOpenSettings}
                  >
                    {t('settings')}
                  </button>
                  <div className="menu-divider" />
                  <button type="button" className="user-menu-item logout" onClick={handleSignOut}>
                    {t('logOut')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button type="button" className="small-action" onClick={() => openAuth('pos')}>
                {t('storePosLogin')}
              </button>
              <button type="button" className="login-btn" onClick={() => openAuth('signin')}>
                {t('startCollecting')}
              </button>
            </>
          )}
          <button type="button" className="small-action" onClick={handleOpenCart}>
            {t('cart')}{cartItems.length ? ` (${cartItems.length})` : ''}
          </button>
        </div>
      </header>

      <nav className="main-nav">
        <a
          href="#"
          className={currentScreen === 'collection' || currentScreen === 'collection_item' || (!currentUser && currentScreen === 'home') ? 'active' : ''}
          onClick={handleOpenCollectionHome}
        >
          {t('myCollection')}
        </a>
        <a href="#" className={currentScreen === 'catalog' || currentScreen === 'catalog_item' ? 'active' : ''} onClick={handleOpenCatalog}>
          {t('catalog')}
        </a>
        <a
          href="#"
          onClick={(event) => {
            event.preventDefault()
            setAuthMessage(`${t('stores')} is coming soon.`)
          }}
        >
          {t('stores')}
        </a>
        <a href="#" onClick={handleProtectedNavClick}>
          {t('wishlist')}
        </a>
        <a
          href="#"
          onClick={(event) => {
            event.preventDefault()
            setAuthMessage(`${t('sales')} is coming soon.`)
          }}
        >
          {t('sales')}
        </a>
        <a
          href="#"
          onClick={(event) => {
            event.preventDefault()
            setAuthMessage(`${t('events')} is coming soon.`)
          }}
        >
          {t('events')}
        </a>
      </nav>

      <main className="home-content">
        {currentScreen === 'home' ? (
          <>
            <h1>{homeHeading}</h1>
            <p className="subtitle">
              {currentUser
                ? ''
                : t('tagline')}
            </p>
            {authMessage && <p className="auth-banner">{authMessage}</p>}

            <section className="panel-grid" aria-label="Homepage content sections">
              {homeColumns.map((column) => (
                <article key={column.title} className="panel-column">
                  <header className="column-head">
                    <h2>{tx(column.title)}</h2>
                    {column.action && (
                      <a href="#" className="column-link">
                        {tx(column.action)}
                      </a>
                    )}
                  </header>
                  <div className={`cards cards-${column.variant}`}>
                    {Array.from({ length: column.cards }).map((_, index) => (
                      <div key={`${column.title}-${index}`} className="card-placeholder">
                        {settingsHomeShowEmptyStateHints && column.showMessage && <span>{tx('No purchases yet')}</span>}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </section>
          </>
        ) : currentScreen === 'collection' ? (
          <section className="collection-screen" aria-label="My collection">
            <div className="catalog-head">
              <div>
                <h1>{t('myCollection')}</h1>
                <p className="subtitle catalog-subtitle">Organize by custom collections and physical storage locations.</p>
              </div>
              <div className="catalog-actions">
                <button type="button" className="catalog-action-pill" onClick={handleOpenCatalog}>
                  Browse Catalog
                </button>
              </div>
            </div>

            {!currentUser ? (
              <div className="settings-empty-state">
                <p className="subtitle">Log in to view and manage your collection.</p>
                <button type="button" className="auth-submit" onClick={() => openAuth('signin')}>
                  Log in
                </button>
              </div>
            ) : (
              <div className="collection-layout">
                <aside className="catalog-card collection-sidebar" aria-label="Collections and storage">
                  <div className="collection-sidebar-section">
                    <p className="collection-sidebar-title">{t('myCollection')}</p>
                    <button
                      type="button"
                      className={`collection-sidebar-link ${activeCollectionFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setActiveCollectionFilter('all')}
                    >
                      All Items
                    </button>
                    {customCollections.map((collection) => (
                      <button
                        key={collection.id}
                        type="button"
                        className={`collection-sidebar-link ${activeCollectionFilter === collection.id ? 'active' : ''}`}
                        onClick={() => setActiveCollectionFilter(collection.id)}
                      >
                        {collection.name}
                      </button>
                    ))}

                    <div className="collection-inline-create">
                      <input
                        type="text"
                        value={newCustomCollectionName}
                        onChange={(event) => setNewCustomCollectionName(event.target.value)}
                        placeholder="Create Collection"
                      />
                      <button type="button" className="catalog-action-pill" onClick={handleCreateCustomCollection} disabled={isCreatingCustomCollection}>
                        +
                      </button>
                    </div>

                    {activeCollectionFilter !== 'all' && (
                      <div className="collection-inline-actions">
                        <button type="button" className="catalog-action-pill" onClick={handleRenameActiveCollection}>Rename</button>
                        <button type="button" className="catalog-action-pill" onClick={handleDeleteActiveCollection}>Delete</button>
                      </div>
                    )}
                  </div>

                  <div className="collection-sidebar-section">
                    <p className="collection-sidebar-title">Storage</p>
                    {storageLocations.map((location) => {
                      const locationPath = storageLocationPathById[location.id] || location.name
                      const depth = locationPath ? Math.max(0, locationPath.split(' -> ').length - 1) : 0
                      return (
                        <button
                          key={location.id}
                          type="button"
                          className={`collection-sidebar-link ${activeStorageFilter === location.id ? 'active' : ''}`}
                          style={{ paddingLeft: `${12 + depth * 14}px` }}
                          onClick={() => setActiveStorageFilter((currentValue) => (currentValue === location.id ? '' : location.id))}
                        >
                          {location.name}
                        </button>
                      )
                    })}

                    <div className="collection-inline-create">
                      <input
                        type="text"
                        value={newStorageLocationName}
                        onChange={(event) => setNewStorageLocationName(event.target.value)}
                        placeholder="Create Location"
                      />
                      <button type="button" className="catalog-action-pill" onClick={handleCreateStorageLocation} disabled={isCreatingStorageLocation}>
                        +
                      </button>
                    </div>

                    <select
                      value={newStorageParentLocationId}
                      onChange={(event) => setNewStorageParentLocationId(event.target.value)}
                    >
                      <option value="">Top Level</option>
                      {storageLocations.map((location) => (
                        <option key={`storage-parent-${location.id}`} value={location.id}>
                          {storageLocationPathById[location.id] || location.name}
                        </option>
                      ))}
                    </select>

                    {activeStorageFilter && (
                      <>
                        <select
                          value=""
                          onChange={(event) => handleMoveActiveStorageLocation(event.target.value)}
                        >
                          <option value="">Move Location To...</option>
                          <option value="">Top Level</option>
                          {storageLocations
                            .filter((location) => location.id !== activeStorageFilter)
                            .map((location) => (
                              <option key={`move-storage-${location.id}`} value={location.id}>
                                {storageLocationPathById[location.id] || location.name}
                              </option>
                            ))}
                        </select>
                        <div className="collection-inline-actions">
                          <button type="button" className="catalog-action-pill" onClick={handleRenameActiveStorageLocation}>Rename</button>
                          <button type="button" className="catalog-action-pill" onClick={handleDeleteActiveStorageLocation}>Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                </aside>

                <div className="collection-main-pane">
                  <div className="collection-topbar">
                    <input
                      type="search"
                      value={collectionSearchQuery}
                      onChange={(event) => setCollectionSearchQuery(event.target.value)}
                      placeholder="Search by item, collection, location, set, or category"
                    />
                    <div className="collection-tab-row" role="tablist" aria-label="Collection views">
                      <button
                        type="button"
                        className={`collection-tab-button ${collectionViewTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setCollectionViewTab('overview')}
                      >
                        Overview
                      </button>
                      <button
                        type="button"
                        className={`collection-tab-button ${collectionViewTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setCollectionViewTab('analytics')}
                      >
                        Analytics
                      </button>
                      <button
                        type="button"
                        className={`collection-tab-button ${collectionViewTab === 'completion' ? 'active' : ''}`}
                        onClick={() => setCollectionViewTab('completion')}
                      >
                        Completion
                      </button>
                    </div>
                  </div>

                  {isCollectionLoading ? (
                    <div className="catalog-card catalog-loading-panel">Loading your collection...</div>
                  ) : collectionLoadError ? (
                    <div className="catalog-card catalog-loading-panel">{collectionLoadError}</div>
                  ) : filteredCollectionItems.length === 0 ? (
                    <div className="catalog-card catalog-loading-panel">No matching items. Add cards from the catalog or adjust your filters.</div>
                  ) : collectionViewTab === 'analytics' ? (
                    <div className="collection-analytics-stack">
                      <section className="collection-summary-grid" aria-label="Portfolio summary">
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">Collection Value</p>
                          <strong>{formatUsd(overallCollectionValue)}</strong>
                        </article>
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">Total Invested</p>
                          <strong>{formatUsd(overallTotalInvested)}</strong>
                        </article>
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">Profit / Loss</p>
                          <strong className={overallProfitLoss >= 0 ? 'collection-positive' : 'collection-negative'}>{formatUsd(overallProfitLoss)}</strong>
                        </article>
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">ROI</p>
                          <strong className={overallRoi >= 0 ? 'collection-positive' : 'collection-negative'}>{formatPercentValue(overallRoi)}</strong>
                        </article>
                      </section>

                      <section className="collection-analytics-grid">
                        <article className="catalog-card collection-analytics-card">
                          <h3>Portfolio Allocation</h3>
                          <div className="collection-allocation-list">
                            {allocationByCategory.map((entry) => (
                              <div key={`allocation-${entry.categoryName}`} className="collection-allocation-row">
                                <div className="collection-allocation-row-head">
                                  <strong>{entry.categoryName}</strong>
                                  <span>{entry.allocationPercent.toFixed(1)}%</span>
                                </div>
                                <div className="collection-allocation-bar-track">
                                  <div className="collection-allocation-bar-fill" style={{ width: `${entry.allocationPercent}%` }} />
                                </div>
                                <p>{formatUsd(entry.currentMarketValue)} value | ROI {formatPercentValue(entry.roi)}</p>
                              </div>
                            ))}
                          </div>
                        </article>

                        <article className="catalog-card collection-analytics-card">
                          <h3>Collection Insights</h3>
                          <div className="collection-insight-list">
                            <div className="collection-insight-item">
                              <span>Most Valuable Item</span>
                              <strong>{mostValuableItem ? `${mostValuableItem.name} · ${formatUsd(mostValuableItem.currentMarketValue)}` : 'N/A'}</strong>
                            </div>
                            <div className="collection-insight-item">
                              <span>Largest Gain</span>
                              <strong>{largestGainItem ? `${largestGainItem.name} · ${formatUsd(largestGainItem.profitLoss)}` : 'N/A'}</strong>
                            </div>
                            <div className="collection-insight-item">
                              <span>Largest Loss</span>
                              <strong>{largestLossItem ? `${largestLossItem.name} · ${formatUsd(largestLossItem.profitLoss)}` : 'N/A'}</strong>
                            </div>
                          </div>
                        </article>
                      </section>

                      <section className="collection-analytics-grid">
                        <article className="catalog-card collection-analytics-card">
                          <h3>Monthly Spending</h3>
                          <div className="collection-metrics-list">
                            {monthlyAnalytics.length === 0 ? (
                              <p className="collection-muted">No monthly purchase data yet.</p>
                            ) : (
                              monthlyAnalytics.slice(-6).map((entry) => (
                                <div key={`monthly-spending-${entry.label}`} className="collection-metric-row">
                                  <strong>{entry.label}</strong>
                                  <span>{formatUsd(entry.investedValue)}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </article>

                        <article className="catalog-card collection-analytics-card">
                          <h3>Monthly Value Growth</h3>
                          <div className="collection-metrics-list">
                            {monthlyAnalytics.length === 0 ? (
                              <p className="collection-muted">No monthly value data yet.</p>
                            ) : (
                              monthlyAnalytics.slice(-6).map((entry) => (
                                <div key={`monthly-value-${entry.label}`} className="collection-metric-row">
                                  <strong>{entry.label}</strong>
                                  <span>{formatUsd(entry.currentMarketValue)}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </article>
                      </section>

                      <article className="catalog-card collection-analytics-card">
                        <h3>Custom Collection Performance</h3>
                        <div className="collection-performance-list">
                          {customCollectionPerformance.length === 0 ? (
                            <p className="collection-muted">Create custom collections to compare value, ROI, and goal progress.</p>
                          ) : (
                            customCollectionPerformance.map((entry) => (
                              <div key={`collection-performance-${entry.id}`} className="collection-performance-row">
                                <div>
                                  <strong>{entry.name}</strong>
                                  <p>{entry.itemCount} items</p>
                                </div>
                                <div>
                                  <span>{formatUsd(entry.currentMarketValue)}</span>
                                  <p>Invested {formatUsd(entry.totalInvested)}</p>
                                </div>
                                <div>
                                  <span>ROI {formatPercentValue(entry.roi)}</span>
                                  <p>Completion {entry.completionPercent == null ? 'N/A' : `${entry.completionPercent.toFixed(1)}%`}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </article>
                    </div>
                  ) : collectionViewTab === 'completion' ? (
                    <div className="collection-completion-stack">
                      <article className="catalog-card collection-analytics-card">
                        <h3>Sets You Started</h3>
                        <p className="collection-muted">Completion is automatic from your inventory. Click a set to see what you own and what is missing.</p>
                      </article>

                      <section className="collection-goal-grid" aria-label="Started sets">
                        {startedSetCards.length === 0 ? (
                          <article className="catalog-card catalog-loading-panel">
                            No started sets found yet. Add items to your collection to see set progress.
                          </article>
                        ) : (
                          startedSetCards.map((setCard) => (
                            <article
                              key={`started-set-${setCard.id}`}
                              className="catalog-card collection-goal-card"
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedCompletionSetId(setCard.id)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault()
                                  setSelectedCompletionSetId(setCard.id)
                                }
                              }}
                            >
                              <div className="collection-goal-card-head">
                                <div>
                                  <h3>{setCard.title}</h3>
                                  <p>{setCard.categoryName}</p>
                                </div>
                                <button type="button" className="catalog-action-pill" onClick={() => setSelectedCompletionSetId(setCard.id)}>
                                  View Set
                                </button>
                              </div>
                              <div className="collection-goal-progress-row">
                                <strong>{setCard.ownedCount} / {setCard.totalItems}</strong>
                                <span>{setCard.completionPercent.toFixed(1)}% Complete</span>
                              </div>
                              <div className="collection-allocation-bar-track">
                                <div className="collection-allocation-bar-fill" style={{ width: `${Math.min(setCard.completionPercent, 100)}%` }} />
                              </div>
                              <div className="collection-goal-metrics">
                                <span>Missing: {setCard.missingCount}</span>
                                <span>Owned Value: {formatUsd(setCard.ownedValue)}</span>
                                <span>Estimated Completion Cost: {setCard.estimatedRemainingCost == null ? 'N/A' : formatUsd(setCard.estimatedRemainingCost)}</span>
                              </div>
                              {Object.keys(setCard.breakdown || {}).length > 0 ? (
                                <div className="collection-goal-breakdown">
                                  {Object.entries(setCard.breakdown).map(([label, value]) => (
                                    <span key={`goal-breakdown-${setCard.id}-${label}`}>{label}: {value}</span>
                                  ))}
                                </div>
                              ) : null}
                            </article>
                          ))
                        )}
                      </section>

                      {selectedCompletionSet ? (
                        <article className="catalog-card collection-analytics-card">
                          <h3>{selectedCompletionSet.title}</h3>
                          <p className="collection-muted">
                            {selectedCompletionSet.ownedCount} owned | {selectedCompletionSet.missingCount} missing | {selectedCompletionSet.completionPercent.toFixed(1)}% complete
                          </p>
                          {selectedCompletionSetEntries.length === 0 ? (
                            <p className="collection-muted">No set-entry registry rows yet for this set.</p>
                          ) : (
                            <div className="collection-metrics-list">
                              {selectedCompletionSetEntries.map((entry) => (
                                <div key={`completion-entry-${entry.id}`} className="collection-metric-row">
                                  <div>
                                    <strong>{entry.itemName}</strong>
                                    <p>
                                      {entry.itemKey || 'No item key'}
                                      {entry.rarity ? ` | ${entry.rarity}` : ''}
                                    </p>
                                  </div>
                                  <div>
                                    <span>{entry.isOwned ? `Owned x${entry.quantity}` : 'Missing'}</span>
                                    <p>
                                      {entry.isOwned
                                        ? formatUsd(entry.marketValue)
                                        : entry.estimatedPrice > 0
                                          ? `Est. ${formatUsd(entry.estimatedPrice)}`
                                          : 'No estimate'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </article>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <section className="collection-summary-grid" aria-label="Collection summary">
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">Unique Items</p>
                          <strong>{collectionSummary.uniqueItems}</strong>
                        </article>
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">Total Copies</p>
                          <strong>{collectionSummary.totalCopies}</strong>
                        </article>
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">Graded Copies</p>
                          <strong>{collectionSummary.gradedCopies}</strong>
                        </article>
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">Total Invested</p>
                          <strong>{formatUsd(collectionSummary.totalInvested)}</strong>
                        </article>
                        <article className="catalog-card collection-summary-card">
                          <p className="collection-summary-label">Collection Value</p>
                          <strong>{formatUsd(collectionSummary.totalValue)}</strong>
                        </article>
                      </section>

                      <section className="collection-list" aria-label="Collection items">
                        {paginatedCollectionItems.map((item) => {
                          const averageCost = item.pricedCopies > 0 ? item.totalInvested / item.pricedCopies : null
                          const primaryAcquisitionType = Object.entries(item.acquisitionTypes || {}).sort((left, right) => right[1] - left[1])[0]?.[0] || ''
                          const primaryLocationId = Array.isArray(item.locationIds) && item.locationIds.length > 0 ? item.locationIds[0] : ''

                          return (
                            <article key={`collection-item-${item.id}`} className="catalog-card collection-item-row">
                              {item.imageUrl ? (
                                <img className="collection-item-image" src={item.imageUrl} alt={item.name} loading="lazy" />
                              ) : (
                                <div className="collection-item-image collection-item-image-placeholder">No image</div>
                              )}

                              <div className="collection-item-body">
                                <h3>{item.name}</h3>
                                <p className="collection-item-meta">
                                  {item.releaseYear ? `${item.releaseYear}` : 'Year N/A'}
                                  {primaryAcquisitionType
                                    ? ` | ${COLLECTION_ACQUISITION_TYPE_LABELS[primaryAcquisitionType] || primaryAcquisitionType}`
                                    : ''}
                                  {item.setName ? ` | ${item.setName}` : ''}
                                  {item.categoryName ? ` | ${item.categoryName}` : ''}
                                </p>
                                <div className="collection-item-stats">
                                  <span>Qty: {item.totalQuantity}</span>
                                  <span>Certs: {item.certCount}</span>
                                  <span>Avg Cost: {averageCost == null ? 'N/A' : formatUsd(averageCost)}</span>
                                  <span>Invested: {formatUsd(item.totalInvested)}</span>
                                </div>
                                <p className="collection-item-organization-row">
                                  Collection(s): {item.collectionNames.length > 0 ? item.collectionNames.join(', ') : 'Unassigned'}
                                </p>
                                <p className="collection-item-organization-row">
                                  Location: {item.primaryLocationPath || 'Unassigned'}
                                </p>
                              </div>

                              <div className="collection-item-actions">
                                <select
                                  value={primaryLocationId}
                                  onChange={(event) => handleAssignStorageLocationToItem(item, event.target.value)}
                                  disabled={isSavingCollectionOrganization}
                                >
                                  <option value="">Set Location</option>
                                  {storageLocations.map((location) => (
                                    <option key={`item-location-${item.id}-${location.id}`} value={location.id}>
                                      {storageLocationPathById[location.id] || location.name}
                                    </option>
                                  ))}
                                </select>

                                {customCollections.map((collection) => {
                                  const isAssigned = Array.isArray(item.collectionIds) && item.collectionIds.includes(collection.id)
                                  return (
                                    <button
                                      key={`item-collection-${item.id}-${collection.id}`}
                                      type="button"
                                      className={`catalog-action-pill ${isAssigned ? 'active' : ''}`}
                                      onClick={() => handleToggleCollectionMembership(item, collection.id)}
                                      disabled={isSavingCollectionOrganization}
                                    >
                                      {isAssigned ? '✓ ' : ''}{collection.name}
                                    </button>
                                  )
                                })}

                                <button
                                  type="button"
                                  className="catalog-action-pill"
                                  onClick={() => handleOpenCollectionItemDetails(item)}
                                >
                                  View Details
                                </button>

                                <button
                                  type="button"
                                  className="catalog-action-pill"
                                  onClick={() => {
                                    if (item.catalogItem) {
                                      handleOpenCatalogItem(item.catalogItem)
                                    }
                                  }}
                                  disabled={!item.catalogItem}
                                >
                                  View Catalog Card
                                </button>
                              </div>
                            </article>
                          )
                        })}
                      </section>

                      {collectionOverviewTotalPages > 1 ? (
                        <div className="catalog-pagination" aria-label="Collection overview pagination">
                          <button
                            type="button"
                            className="catalog-pagination-btn"
                            onClick={() => setCollectionOverviewPage((currentPage) => Math.max(1, currentPage - 1))}
                            disabled={collectionOverviewPage <= 1}
                          >
                            Previous
                          </button>
                          <span className="catalog-pagination-page">Page {collectionOverviewPage} / {collectionOverviewTotalPages}</span>
                          <button
                            type="button"
                            className="catalog-pagination-btn"
                            onClick={() => setCollectionOverviewPage((currentPage) => Math.min(collectionOverviewTotalPages, currentPage + 1))}
                            disabled={collectionOverviewPage >= collectionOverviewTotalPages}
                          >
                            Next
                          </button>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            )}
          </section>
        ) : currentScreen === 'collection_item' ? (
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
                          <section className="owned-copy-hero-card">
                            <div>
                              <p className="owned-copy-eyebrow">Condition</p>
                              <h2>{selectedCollectionCopyCondition || 'Condition Not Set'}</h2>
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
        ) : currentScreen === 'catalog' ? (
          <section className="catalog-screen" aria-label="Catalog">
            <div className="catalog-head">
              <div>
                <h1>{t('catalogPageTitle')}</h1>
                <p className="subtitle catalog-subtitle">{t('catalogPageSubtitle')}</p>
              </div>

              <div className="catalog-actions">
                <label className="catalog-sort-wrap" htmlFor="catalog-sort-select">
                  <span>{t('sortLabel')}</span>
                  <select
                    id="catalog-sort-select"
                    value={catalogSortKey}
                    onChange={(event) => setCatalogSortKey(event.target.value)}
                  >
                    <option value="newest_year">{t('sortNewestYear')}</option>
                  </select>
                </label>

                <button type="button" className="catalog-action-pill">
                  {t('suggestItemAction')}
                </button>
                {isPlatformAdmin && (
                  <>
                    <button
                      type="button"
                      className="catalog-action-pill"
                      onClick={() => {
                        setCatalogAdminFormError('')
                        setCatalogAdminItemName('')
                        setCatalogAdminItemYear('')
                        setCatalogAdminItemDescription('')
                        setCatalogAdminItemIdentifier('')
                        setCatalogAdminStatus('draft')
                        setCatalogAdminItemImageFile(null)
                        setCatalogAdminDynamicFields(buildCatalogDynamicDefaults(selectedCatalogAdminCategoryName))
                        setCatalogAdminVariants([buildCatalogVariantRow()])
                        setIsCatalogItemModalOpen(true)
                      }}
                    >
                      {t('addItemAction')}
                    </button>
                    <button
                      type="button"
                      className="catalog-action-pill"
                      onClick={() => setIsCatalogAdminPanelOpen(true)}
                    >
                      Manage Catalog
                    </button>
                  </>
                )}
                <button type="button" className="catalog-action-pill">
                  {t('mySuggestionsAction')}
                </button>
                <button
                  type="button"
                  className="catalog-action-pill"
                  onClick={() => {
                    setCatalogPage(1)
                    setCatalogReloadToken((currentToken) => currentToken + 1)
                  }}
                >
                  {t('refreshAction')}
                </button>
              </div>
            </div>

            <div className="catalog-layout">
              <aside className="catalog-card catalog-filters" aria-label="Catalog filters">
                <div className="catalog-card-head">
                  <h2>{t('filtersLabel')}</h2>
                  <button
                    type="button"
                    className="catalog-clear-btn"
                    onClick={() => {
                      setCatalogCategory('all')
                      setCatalogSubcategory('')
                      setCatalogFranchise('all')
                      setCatalogMinYear('')
                      setCatalogMaxYear('')
                    }}
                  >
                    {t('clearAction')}
                  </button>
                </div>

                <label htmlFor="catalog-category">{t('categoryLabel')}</label>
                <select
                  id="catalog-category"
                  value={catalogCategory}
                  onChange={(event) => {
                    setCatalogCategory(event.target.value)
                    setCatalogSubcategory('')
                    setCatalogFranchise('all')
                  }}
                >
                  <option value="all">All</option>
                  {catalogCategoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <label htmlFor="catalog-subcategory">{t('subcategoryLabel')}</label>
                <select
                  id="catalog-subcategory"
                  value={catalogSubcategory}
                  onChange={(event) => {
                    setCatalogSubcategory(event.target.value)
                    setCatalogFranchise('all')
                  }}
                  disabled={catalogCategory === 'all'}
                >
                  <option value="">{t('selectCategoryFirst')}</option>
                  {catalogSubcategoryOptions.map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>

                <label htmlFor="catalog-franchise">{t('franchiseLabel')}</label>
                <select id="catalog-franchise" value={catalogFranchise} onChange={(event) => setCatalogFranchise(event.target.value)}>
                  <option value="all">All</option>
                  {catalogFranchiseOptions.map((franchise) => (
                    <option key={franchise} value={franchise}>
                      {franchise}
                    </option>
                  ))}
                </select>

                <div className="catalog-year-grid">
                  <label htmlFor="catalog-min-year">
                    {t('minYearLabel')}
                    <input
                      id="catalog-min-year"
                      type="number"
                      min="1900"
                      max="2100"
                      placeholder="e.g. 1990"
                      value={catalogMinYear}
                      onChange={(event) => setCatalogMinYear(event.target.value)}
                    />
                  </label>

                  <label htmlFor="catalog-max-year">
                    {t('maxYearLabel')}
                    <input
                      id="catalog-max-year"
                      type="number"
                      min="1900"
                      max="2100"
                      placeholder="e.g. 2025"
                      value={catalogMaxYear}
                      onChange={(event) => setCatalogMaxYear(event.target.value)}
                    />
                  </label>
                </div>
              </aside>

              <div className="catalog-main-pane">
                {isCatalogLoading ? (
                  <div className="catalog-card catalog-loading-panel">{t('loadingCatalog')}</div>
                ) : catalogLoadError ? (
                  <div className="catalog-card catalog-loading-panel">{catalogLoadError}</div>
                ) : filteredCatalogItems.length === 0 ? (
                  <div className="catalog-card catalog-loading-panel">No catalog items found.</div>
                ) : (
                  <div>
                    <div className="catalog-results-grid">
                      {paginatedCatalogItems.map((item) => {
                        const categoryName = catalogCategoryById[item.category_id] || 'Uncategorized'
                        const subcategoryName = catalogSubcategoryById[item.subcategory_id] || 'Uncategorized'
                        const setRecord = catalogSetById[item.collectible_set_id] || null
                        const franchiseName = setRecord?.name || catalogFranchiseById[item.collectible_set_id] || 'Unassigned set'
                        const franchiseBrandName = setRecord?.franchise_id ? catalogFranchiseBrandById[setRecord.franchise_id] || '' : ''
                        const brandName = item.brand_id ? catalogBrandById[item.brand_id] || 'Unknown brand' : ''
                        const imageUrl = item?.metadata?.image_url || item?.dynamic_fields?.image_url || ''

                        return (
                          <article
                            key={item.id}
                            className="catalog-card catalog-item-card"
                            role="button"
                            tabIndex={0}
                            onClick={() => handleOpenCatalogItem(item)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                handleOpenCatalogItem(item)
                              }
                            }}
                          >
                            {imageUrl ? (
                              <img className="catalog-item-image" src={imageUrl} alt={item.name || 'Catalog item'} loading="lazy" />
                            ) : (
                              <div className="catalog-item-image catalog-item-image-placeholder">No image</div>
                            )}
                            <div className="catalog-item-content">
                              <h3>{item.name || 'Untitled item'}</h3>
                              <p className="catalog-item-meta">{franchiseName}</p>
                              {franchiseBrandName ? <p className="catalog-item-brand">Franchise: {franchiseBrandName}</p> : null}
                              {brandName ? <p className="catalog-item-brand">Brand: {brandName}</p> : null}
                              {item.release_year ? <p className="catalog-item-year">{item.release_year}</p> : null}
                            </div>
                          </article>
                        )
                      })}
                    </div>
                    <div className="catalog-pagination" aria-label="Catalog pagination">
                      <button
                        type="button"
                        className="catalog-pagination-btn"
                        onClick={() => setCatalogPage((currentPage) => Math.max(1, currentPage - 1))}
                        disabled={catalogPage <= 1}
                      >
                        Previous
                      </button>
                      <span className="catalog-pagination-page">Page {catalogPage} / {catalogTotalPages}</span>
                      <button
                        type="button"
                        className="catalog-pagination-btn"
                        onClick={() => setCatalogPage((currentPage) => Math.min(catalogTotalPages, currentPage + 1))}
                        disabled={catalogPage >= catalogTotalPages}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <aside className="catalog-card catalog-context" aria-label="Catalog context">
                <h2>{t('contextTitle')}</h2>
                <p>{t('contextHint')}</p>
              </aside>
            </div>

            <button type="button" className="catalog-floating-toggle" aria-label={t('filtersLabel')}>
              &#9783;
            </button>

            {isCatalogAdminPanelOpen && isPlatformAdmin && (
              <CatalogAdminPanel
                categories={catalogAdminCategories}
                onClose={() => setIsCatalogAdminPanelOpen(false)}
              />
            )}

            {isCatalogItemModalOpen && isPlatformAdmin && (
              <div className="auth-overlay" onClick={() => setIsCatalogItemModalOpen(false)}>
                <section className="auth-modal catalog-item-modal" onClick={(event) => event.stopPropagation()}>
                  <button type="button" className="close-auth" onClick={() => setIsCatalogItemModalOpen(false)}>
                    &#10005;
                  </button>
                  <h3>{t('adminCreateItem')}</h3>
                  <form className="catalog-admin-form" onSubmit={handleCreateCatalogItemInApp}>
                    <label htmlFor="catalog-admin-category">{t('categoryLabel')}</label>
                    <select
                      id="catalog-admin-category"
                      value={catalogAdminCategoryId}
                      onChange={(event) => {
                        const nextCategoryId = event.target.value
                        const nextCategoryName =
                          catalogAdminCategories.find((category) => category.id === nextCategoryId)?.name || ''
                        setCatalogAdminCategoryId(nextCategoryId)
                        setCatalogAdminSubcategoryId('')
                        setCatalogAdminFranchiseId('')
                        setCatalogAdminDynamicFields(buildCatalogDynamicDefaults(nextCategoryName))
                        setCatalogAdminVariants([buildCatalogVariantRow()])
                        setCatalogAdminFormError('')
                      }}
                    >
                      <option value="">{t('selectCategoryFirstAdmin')}</option>
                      {catalogAdminCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="catalog-admin-subcategory">{t('subcategoryLabel')}</label>
                    <select
                      id="catalog-admin-subcategory"
                      value={catalogAdminSubcategoryId}
                      onChange={(event) => {
                        setCatalogAdminSubcategoryId(event.target.value)
                        setCatalogAdminFranchiseId('')
                        setCatalogAdminFormError('')
                      }}
                      disabled={!catalogAdminCategoryId}
                    >
                      <option value="">{t('selectSubcategoryFirstAdmin')}</option>
                      {catalogAdminSubcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>

                    {catalogAdminCategoryId && (
                      <div className="catalog-admin-inline-create">
                        {catalogAdminIsCreatingSubcategory ? (
                          <>
                            <input
                              type="text"
                              className="catalog-admin-inline-input"
                              placeholder="New subcategory name"
                              value={catalogAdminNewSubcategoryName}
                              onChange={(e) => setCatalogAdminNewSubcategoryName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); handleCreateCatalogSubcategory() }
                                if (e.key === 'Escape') { setCatalogAdminIsCreatingSubcategory(false); setCatalogAdminNewSubcategoryName('') }
                              }}
                              autoFocus
                            />
                            <button type="button" className="catalog-admin-inline-save" disabled={!catalogAdminNewSubcategoryName.trim() || catalogAdminIsSavingSubcategory} onClick={handleCreateCatalogSubcategory}>
                              {catalogAdminIsSavingSubcategory ? '…' : 'Save'}
                            </button>
                            <button type="button" className="catalog-admin-inline-cancel" onClick={() => { setCatalogAdminIsCreatingSubcategory(false); setCatalogAdminNewSubcategoryName('') }}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button type="button" className="catalog-admin-inline-toggle" onClick={() => setCatalogAdminIsCreatingSubcategory(true)}>
                            + New subcategory
                          </button>
                        )}
                      </div>
                    )}

                    <label htmlFor="catalog-admin-franchise">{t('franchiseLabel')}</label>
                    <select
                      id="catalog-admin-franchise"
                      value={catalogAdminFranchiseId}
                      onChange={(event) => {
                        setCatalogAdminFranchiseId(event.target.value)
                        setCatalogAdminFormError('')
                      }}
                      disabled={!catalogAdminSubcategoryId}
                    >
                      <option value="">{t('selectFranchiseFirstAdmin')}</option>
                      {catalogAdminFranchises.map((franchise) => (
                        <option key={franchise.id} value={franchise.id}>
                          {franchise.name}
                        </option>
                      ))}
                    </select>

                    {catalogAdminSubcategoryId && (
                      <div className="catalog-admin-inline-create">
                        {catalogAdminIsCreatingFranchise ? (
                          <>
                            <input
                              type="text"
                              className="catalog-admin-inline-input"
                              placeholder={t('newFranchiseNamePlaceholder')}
                              value={catalogAdminNewFranchiseName}
                              onChange={(e) => setCatalogAdminNewFranchiseName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); handleCreateCatalogFranchise() }
                                if (e.key === 'Escape') { setCatalogAdminIsCreatingFranchise(false); setCatalogAdminNewFranchiseName('') }
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              className="catalog-admin-inline-save"
                              disabled={!catalogAdminNewFranchiseName.trim() || catalogAdminIsSavingFranchise}
                              onClick={handleCreateCatalogFranchise}
                            >
                              {catalogAdminIsSavingFranchise ? '…' : t('saveAction')}
                            </button>
                            <button
                              type="button"
                              className="catalog-admin-inline-cancel"
                              onClick={() => { setCatalogAdminIsCreatingFranchise(false); setCatalogAdminNewFranchiseName('') }}
                            >
                              {t('cancelAction')}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="catalog-admin-inline-toggle"
                            onClick={() => setCatalogAdminIsCreatingFranchise(true)}
                          >
                            {t('createFranchiseInlineAction')}
                          </button>
                        )}
                      </div>
                    )}

                    <label htmlFor="catalog-admin-brand">{t('brandLabel')}</label>
                    <select
                      id="catalog-admin-brand"
                      value={catalogAdminBrandId}
                      onChange={(event) => {
                        setCatalogAdminBrandId(event.target.value)
                        setCatalogAdminFormError('')
                      }}
                    >
                      <option value="">{t('noBrandOption')}</option>
                      {catalogAdminBrands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>

                    <div className="catalog-admin-inline-create">
                      {catalogAdminIsCreatingBrand ? (
                        <>
                          <input
                            type="text"
                            className="catalog-admin-inline-input"
                            placeholder={t('newBrandNamePlaceholder')}
                            value={catalogAdminNewBrandName}
                            onChange={(e) => setCatalogAdminNewBrandName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); handleCreateCatalogBrand() }
                              if (e.key === 'Escape') { setCatalogAdminIsCreatingBrand(false); setCatalogAdminNewBrandName('') }
                            }}
                            autoFocus
                          />
                          <button
                            type="button"
                            className="catalog-admin-inline-save"
                            disabled={!catalogAdminNewBrandName.trim() || catalogAdminIsSavingBrand}
                            onClick={handleCreateCatalogBrand}
                          >
                            {catalogAdminIsSavingBrand ? '…' : t('saveAction')}
                          </button>
                          <button
                            type="button"
                            className="catalog-admin-inline-cancel"
                            onClick={() => { setCatalogAdminIsCreatingBrand(false); setCatalogAdminNewBrandName('') }}
                          >
                            {t('cancelAction')}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="catalog-admin-inline-toggle"
                          onClick={() => setCatalogAdminIsCreatingBrand(true)}
                        >
                          {t('createBrandInlineAction')}
                        </button>
                      )}
                    </div>
                    <input
                      id="catalog-admin-item-name"
                      type="text"
                      value={catalogAdminItemName}
                      onChange={(event) => {
                        setCatalogAdminItemName(event.target.value)
                        setCatalogAdminFormError('')
                      }}
                      placeholder={t('itemNameLabel')}
                    />

                    <label htmlFor="catalog-admin-item-year">{t('releaseYearLabel')}</label>
                    <input
                      id="catalog-admin-item-year"
                      type="number"
                      min="1800"
                      max="2200"
                      value={catalogAdminItemYear}
                      onChange={(event) => {
                        setCatalogAdminItemYear(event.target.value)
                        setCatalogAdminFormError('')
                      }}
                      placeholder="e.g. 2024"
                    />

                    <label htmlFor="catalog-admin-item-description">{t('descriptionLabel')}</label>
                    <textarea
                      id="catalog-admin-item-description"
                      rows={3}
                      value={catalogAdminItemDescription}
                      onChange={(event) => {
                        setCatalogAdminItemDescription(event.target.value)
                        setCatalogAdminFormError('')
                      }}
                      placeholder={t('descriptionLabel')}
                    />

                    <label htmlFor="catalog-admin-item-identifier">{t('identifierLabel')}</label>
                    <input
                      id="catalog-admin-item-identifier"
                      type="text"
                      value={catalogAdminItemIdentifier}
                      onChange={(event) => {
                        setCatalogAdminItemIdentifier(event.target.value)
                        setCatalogAdminFormError('')
                      }}
                      placeholder={t('identifierLabel')}
                    />

                    <label htmlFor="catalog-admin-status">{t('statusLabel')}</label>
                    <select
                      id="catalog-admin-status"
                      value={catalogAdminStatus}
                      onChange={(event) => {
                        setCatalogAdminStatus(event.target.value)
                        setCatalogAdminFormError('')
                      }}
                    >
                      <option value="draft">{t('statusDraft')}</option>
                      <option value="published">{t('statusPublished')}</option>
                    </select>

                    {catalogAdminDynamicFieldDefinitions.length > 0 && (
                      <>
                        <p className="catalog-admin-section-title">{t('dynamicFieldsLabel')}</p>
                        <div className="catalog-admin-dynamic-grid">
                          {catalogAdminDynamicFieldDefinitions.map((field) => {
                            if (field.type === 'boolean') {
                              return (
                                <label key={field.key} className="catalog-admin-checkbox-row">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(catalogAdminDynamicFields[field.key])}
                                    onChange={(event) =>
                                      handleSetCatalogAdminDynamicField(field.key, event.target.checked)
                                    }
                                  />
                                  <span>{field.label}</span>
                                </label>
                              )
                            }

                            return (
                              <label key={field.key} htmlFor={`catalog-admin-dynamic-${field.key}`}>
                                {field.label}
                                <input
                                  id={`catalog-admin-dynamic-${field.key}`}
                                  type={field.type === 'number' ? 'number' : 'text'}
                                  value={catalogAdminDynamicFields[field.key] ?? ''}
                                  onChange={(event) =>
                                    handleSetCatalogAdminDynamicField(field.key, event.target.value)
                                  }
                                />
                              </label>
                            )
                          })}
                        </div>
                      </>
                    )}

                    {catalogAdminShowPeople && (
                      <>
                        <p className="catalog-admin-section-title">{t('peopleCreditsLabel')}</p>
                        <datalist id="catalog-admin-people-datalist">
                          {catalogAdminExistingPeople.map((person) => (
                            <option key={person.id} value={person.name} />
                          ))}
                        </datalist>
                        <div className="catalog-admin-people-rows">
                          {catalogAdminPeopleRows.map((row, index) => (
                            <div key={`people-row-${index}`} className="catalog-admin-people-row">
                              <input
                                type="text"
                                list="catalog-admin-people-datalist"
                                placeholder={t('personNamePlaceholder')}
                                value={row.name}
                                onChange={(e) => handleSetCatalogPeopleRowField(index, 'name', e.target.value)}
                              />
                              <select
                                value={row.role}
                                onChange={(e) => handleSetCatalogPeopleRowField(index, 'role', e.target.value)}
                              >
                                {catalogAdminPeopleRoles.map((role) => (
                                  <option key={role} value={role}>{role}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="catalog-variant-remove"
                                onClick={() => handleRemoveCatalogPeopleRow(index)}
                                aria-label={t('removePersonAction')}
                              >
                                {t('removeVariantAction')}
                              </button>
                            </div>
                          ))}
                          <button type="button" className="catalog-variant-add" onClick={handleAddCatalogPeopleRow}>
                            {t('addPersonAction')}
                          </button>
                        </div>
                      </>
                    )}

                    {catalogAdminShowMinifigs && (
                      <>
                        <p className="catalog-admin-section-title">{t('minifigsLabel')}</p>
                        <datalist id="catalog-admin-minifig-datalist">
                          {catalogAdminExistingMinifigs.map((fig) => (
                            <option key={fig.id} value={fig.name} />
                          ))}
                        </datalist>
                        <div className="catalog-admin-people-rows">
                          {catalogAdminMinifigRows.map((row, index) => (
                            <div key={`minifig-row-${index}`} className="catalog-admin-minifig-row">
                              <input
                                type="text"
                                list="catalog-admin-minifig-datalist"
                                placeholder={t('minifigNamePlaceholder')}
                                value={row.name}
                                onChange={(e) => handleSetCatalogMinifigRowField(index, 'name', e.target.value)}
                              />
                              <input
                                type="number"
                                min="1"
                                placeholder="Qty"
                                value={row.quantity}
                                onChange={(e) => handleSetCatalogMinifigRowField(index, 'quantity', e.target.value)}
                                style={{ width: '64px' }}
                              />
                              <input
                                type="text"
                                placeholder={t('minifigIdentifierPlaceholder')}
                                value={row.identifier}
                                onChange={(e) => handleSetCatalogMinifigRowField(index, 'identifier', e.target.value)}
                              />
                              <button
                                type="button"
                                className="catalog-variant-remove"
                                onClick={() => handleRemoveCatalogMinifigRow(index)}
                                aria-label={t('removeMinifigAction')}
                              >
                                {t('removeVariantAction')}
                              </button>
                            </div>
                          ))}
                          <button type="button" className="catalog-variant-add" onClick={handleAddCatalogMinifigRow}>
                            {t('addMinifigAction')}
                          </button>
                        </div>
                      </>
                    )}

                    <p className="catalog-admin-section-title">{t('variantsLabel')}</p>
                    <div className="catalog-admin-variants">
                      {catalogAdminVariants.map((variant, index) => (
                        <div key={`catalog-admin-variant-${index}`} className="catalog-admin-variant-row">
                          <input
                            type="text"
                            value={variant.name}
                            onChange={(event) => handleSetCatalogVariantField(index, 'name', event.target.value)}
                            placeholder={t('variantNameLabel')}
                          />
                          <input
                            type="text"
                            value={variant.sku}
                            onChange={(event) => handleSetCatalogVariantField(index, 'sku', event.target.value)}
                            placeholder={t('variantSkuLabel')}
                          />
                          <input
                            type="text"
                            value={variant.identifier}
                            onChange={(event) => handleSetCatalogVariantField(index, 'identifier', event.target.value)}
                            placeholder={t('variantIdentifierLabel')}
                          />
                          {catalogAdminConditionOptions.length > 0 ? (
                            <select
                              value={variant.condition}
                              onChange={(event) => handleSetCatalogVariantField(index, 'condition', event.target.value)}
                            >
                              <option value="">{t('variantConditionLabel')}</option>
                              {catalogAdminConditionOptions.map((conditionOption) => (
                                <option key={conditionOption} value={conditionOption}>
                                  {conditionOption}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={variant.condition}
                              onChange={(event) => handleSetCatalogVariantField(index, 'condition', event.target.value)}
                              placeholder={t('variantConditionLabel')}
                            />
                          )}
                          <button
                            type="button"
                            className="catalog-variant-remove"
                            onClick={() => handleRemoveCatalogVariant(index)}
                          >
                            {t('removeVariantAction')}
                          </button>
                        </div>
                      ))}
                      <button type="button" className="catalog-variant-add" onClick={handleAddCatalogVariant}>
                        {t('addVariantAction')}
                      </button>
                    </div>

                    <label htmlFor="catalog-admin-item-image">{t('itemImageJpegLabel')}</label>
                    <input
                      id="catalog-admin-item-image"
                      type="file"
                      accept=".jpg,.jpeg,image/jpeg"
                      onChange={(event) => {
                        const selectedFile = event.target.files?.[0] || null
                        setCatalogAdminItemImageFile(selectedFile)
                        setCatalogAdminFormError('')
                      }}
                    />
                    {catalogAdminItemImageFile && (
                      <p className="catalog-admin-file-name">{catalogAdminItemImageFile.name}</p>
                    )}

                    {catalogAdminFormError && <p className="catalog-admin-error">{catalogAdminFormError}</p>}

                    <button type="submit" className="catalog-action-pill catalog-admin-submit" disabled={isCreatingCatalogItem}>
                      {isCreatingCatalogItem ? t('creatingItemAction') : t('createItemAction')}
                    </button>
                  </form>
                </section>
              </div>
            )}
          </section>
        ) : currentScreen === 'plans' ? (
          <section className="plans-screen" aria-label="Subscription plans">
            <h1>{tx('Subscription Plans')}</h1>
            <p className="subtitle">{tx('Choose the right tier for your collecting journey.')}</p>

            {profile && (
              <section className="mx-auto mb-4 grid max-w-[1420px] grid-cols-1 gap-2 rounded-xl border border-[#cfdcf1] bg-white/75 p-3 text-left shadow-[0_6px_18px_rgba(18,32,61,0.08)] sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <p className="m-0 text-[0.73rem] font-bold uppercase tracking-[0.05em] text-[#5f7088]">Current plan</p>
                  <p className="m-0 mt-1 text-sm font-extrabold text-[#12315b]">{getPlanDisplayLabel(profile)}</p>
                </div>
                <div>
                  <p className="m-0 text-[0.73rem] font-bold uppercase tracking-[0.05em] text-[#5f7088]">Started date</p>
                  <p className="m-0 mt-1 text-sm font-bold text-[#23416d]">{formatDate(profile.subscription_started_at)}</p>
                </div>
                <div>
                  <p className="m-0 text-[0.73rem] font-bold uppercase tracking-[0.05em] text-[#5f7088]">Next billing date</p>
                  <p className="m-0 mt-1 text-sm font-bold text-[#23416d]">{formatDate(profile.subscription_current_period_end)}</p>
                </div>
                <div>
                  <p className="m-0 text-[0.73rem] font-bold uppercase tracking-[0.05em] text-[#5f7088]">Billing cycle</p>
                  <p className="m-0 mt-1 text-sm font-bold text-[#23416d]">{profile.billing_cycle || 'monthly'}</p>
                </div>
                <div>
                  <p className="m-0 text-[0.73rem] font-bold uppercase tracking-[0.05em] text-[#5f7088]">Renewal status</p>
                  <p className="m-0 mt-1 text-sm font-bold text-[#23416d]">{renewalStatus}</p>
                </div>
              </section>
            )}

            {authMessage && <p className="auth-banner">{authMessage}</p>}
            {isPlansLoading && <p className="auth-banner">{tx('Loading plans...')}</p>}
            {plansError && <p className="auth-error inline-error">{plansError}</p>}

            {!isPlansLoading && !plansError && (
              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {subscriptionPlans.map((plan) => {
                  const isCurrentTier =
                    profile?.subscription_tier === plan.tier ||
                    (plan.tier === 'event_organizer' && Boolean(profile?.has_event_organizer))
                  const actionMeta = getPlanActionMeta(plan)
                  const hasCollectorPlusInCart = cartItems.some((item) => item.tier === 'collector_plus')
                  const effectivePriceCents =
                    plan.tier === 'event_organizer' && (profile?.subscription_tier === 'collector_plus' || hasCollectorPlusInCart)
                      ? 1000
                      : plan.monthly_price_cents
                  return (
                    <SubscriptionCard
                      key={plan.tier}
                      plan={{
                        ...plan,
                        monthly_price_cents: effectivePriceCents,
                      }}
                      isCurrentTier={isCurrentTier}
                      actionLabel={actionMeta.label}
                      actionDisabled={actionMeta.disabled || isUpdatingPlan}
                      statusBadge={actionMeta.statusBadge}
                      statusBadgeTone={actionMeta.statusBadgeTone}
                      actionHint={actionMeta.hint}
                      onChoose={() => handlePlanAction(plan, actionMeta.intent)}
                      formatPlanPrice={formatPlanPrice}
                    />
                  )
                })}
              </div>
            )}
          </section>
        ) : currentScreen === 'catalog_item' ? (
          <section className="catalog-detail-screen" aria-label="Catalog item detail">
            <div className="catalog-detail-head">
              <button
                type="button"
                className="catalog-action-pill"
                onClick={() => {
                  setCurrentScreen('catalog')
                }}
              >
                Back to Catalog
              </button>
            </div>

            {selectedCatalogItem ? (
              <>
                <header className="catalog-detail-title-row">
                  <div className="catalog-detail-title-block">
                    <h1 className="catalog-detail-title">{selectedCatalogItem.name || 'N/A'}</h1>
                    <p className="catalog-detail-subtitle">
                      <span className="catalog-detail-label">Set Number:</span>{' '}
                      {selectedCatalogItem.identifier || selectedCatalogItem?.dynamic_fields?.set_number || 'N/A'}
                      {' | '}
                      <span className="catalog-detail-label">Release Year:</span> {selectedCatalogItem.release_year || 'N/A'}
                    </p>
                    <p className="catalog-detail-subtitle">
                      <span className="catalog-detail-label">Theme:</span>{' '}
                      {selectedCatalogItem.subcategoryName || selectedCatalogItem.categoryName || 'N/A'}
                      {' | '}
                      <span className="catalog-detail-label">Sub Theme:</span> {selectedCatalogItem.franchiseName || 'N/A'}
                      {selectedCatalogItem.franchiseBrandName ? (
                        <>
                          {' | '}
                          <span className="catalog-detail-label">Franchise:</span> {selectedCatalogItem.franchiseBrandName}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="catalog-detail-actions">
                    <button
                      type="button"
                      className="catalog-detail-btn catalog-detail-btn-collect"
                      onClick={handleOpenAddToCollectionModal}
                    >
                      Add to My Collection
                    </button>
                    <button type="button" className="catalog-detail-btn catalog-detail-btn-wishlist">Add to My Wishlist</button>
                    <a href="#" className="catalog-detail-owned-link" onClick={(event) => event.preventDefault()}>
                      You own {ownershipCount} of these items
                    </a>
                  </div>
                </header>

                <section className="catalog-detail-market-card">
                  <div className={`catalog-detail-market-image-wrap${isPsaActive ? ' psa-slab-wrap' : ''}${isBgsActive ? ` bgs-slab-wrap${isBgsBlackLabel ? ' bgs-black-label-wrap' : ''}` : ''}${isCgcActive ? ' cgc-slab-wrap' : ''}${isTAGActive ? ' tag-slab-wrap' : ''}`}>
                    <div className={`catalog-detail-image-frame${isPsaActive ? ' psa-slab-frame' : ''}${isBgsActive ? ` bgs-slab-frame${isBgsBlackLabel ? ' bgs-black-label-frame' : ''}` : ''}${isCgcActive ? ' cgc-slab-frame' : ''}${isTAGActive ? ' tag-slab-frame' : ''}`}>
                    {selectedCatalogItem.imageUrl ? (
                      <img
                        src={selectedCatalogItem.imageUrl}
                        alt={selectedCatalogItem.name || 'Catalog item'}
                        className="catalog-detail-market-image"
                      />
                    ) : (
                      <div className="catalog-detail-market-image catalog-item-image-placeholder">N/A</div>
                    )}
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
                    <p className="catalog-detail-image-caption">{selectedCatalogItemMetadata.image_caption || 'N/A'}</p>
                  </div>
                  <div className="catalog-detail-market-panel">
                    <div className="catalog-detail-market-panel-main">
                      <h2>Market Data & Pricing</h2>
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
                      {isCardConditionCategory ? null : (
                        <>
                          <label htmlFor="catalog-detail-condition" className="catalog-detail-label">Market Variant</label>
                          <select
                            id="catalog-detail-condition"
                            value={selectedCondition || conditionOptions[0] || ''}
                            onChange={(event) => setCatalogDetailSelectedCondition(event.target.value)}
                          >
                            {(conditionOptions.length > 0 ? conditionOptions : []).map((condition) => (
                              <option key={condition} value={condition}>{condition}</option>
                            ))}
                          </select>
                        </>
                      )}

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

                <section className="catalog-detail-grid">
                  <article className="catalog-card catalog-detail-section">
                    <h3>Available Listings on CollectorsHub</h3>
                    <div className="catalog-detail-list-row" role="button" tabIndex={0}>
                      <div className="catalog-detail-seller-col">
                        <strong>
                          {(listings[0]?.seller_name || 'N/A')}
                          {isListingCertVerified(listings[0]) ? <span className="catalog-verified-badge">Verified</span> : null}
                        </strong>
                        <p>
                          {[
                            Number.isFinite(Number(listings[0]?.seller_rating)) ? `Rating ${Number(listings[0]?.seller_rating).toFixed(1)}` : '',
                            listings[0]?.sales_count ? `${listings[0]?.sales_count} sales` : '',
                            listings[0]?.shipping_speed || '',
                          ].filter(Boolean).join(' | ') || 'N/A'}
                        </p>
                        <p className="catalog-detail-listing-condition">
                          {getListingCertNumber(listings[0])
                            ? `Cert #${getListingCertNumber(listings[0])}${isListingCertVerified(listings[0]) ? ' • Verified Card' : ''}`
                            : 'Cert # N/A'}
                        </p>
                        <p className="catalog-detail-listing-condition">{listings[0]?.condition || 'N/A'}</p>
                      </div>
                      <strong>{formatUsd(listings[0]?.price)}</strong>
                    </div>
                    <div className="catalog-detail-list-row" role="button" tabIndex={0}>
                      <div className="catalog-detail-seller-col">
                        <strong>
                          {(listings[1]?.seller_name || 'N/A')}
                          {isListingCertVerified(listings[1]) ? <span className="catalog-verified-badge">Verified</span> : null}
                        </strong>
                        <p>
                          {[
                            Number.isFinite(Number(listings[1]?.seller_rating)) ? `Rating ${Number(listings[1]?.seller_rating).toFixed(1)}` : '',
                            listings[1]?.sales_count ? `${listings[1]?.sales_count} sales` : '',
                            listings[1]?.shipping_speed || '',
                          ].filter(Boolean).join(' | ') || 'N/A'}
                        </p>
                        <p className="catalog-detail-listing-condition">
                          {getListingCertNumber(listings[1])
                            ? `Cert #${getListingCertNumber(listings[1])}${isListingCertVerified(listings[1]) ? ' • Verified Card' : ''}`
                            : 'Cert # N/A'}
                        </p>
                        <p className="catalog-detail-listing-condition">{listings[1]?.condition || 'N/A'}</p>
                      </div>
                      <strong>{formatUsd(listings[1]?.price)}</strong>
                    </div>
                    <button type="button" className="catalog-detail-viewall-btn">
                      View All {Number.isFinite(Number(selectedCatalogItemMetadata.listings_total)) ? Number(selectedCatalogItemMetadata.listings_total) : 'N/A'} Listings
                    </button>
                  </article>
                  <article className="catalog-card catalog-detail-section">
                    <h3>Local Availability</h3>
                    <div className="catalog-detail-availability-card alert">
                      <strong>{localAvailability[0]?.title || localAvailability[0]?.name || 'N/A'}</strong>
                      <p>{localAvailability[0]?.detail || localAvailability[0]?.message || 'N/A'}</p>
                      <p>{localAvailability[0]?.stock_note || localAvailability[0]?.distance || 'N/A'}</p>
                    </div>
                    <div className="catalog-detail-availability-card store">
                      <strong>{localAvailability[1]?.title || localAvailability[1]?.name || 'N/A'}</strong>
                      <p>{localAvailability[1]?.detail || localAvailability[1]?.message || 'N/A'}</p>
                    </div>
                    
                    {typeof selectedCatalogItemMetadata.map_url === 'string' && selectedCatalogItemMetadata.map_url.trim() ? (
                      <a href={selectedCatalogItemMetadata.map_url.trim()} className="catalog-detail-map-link" target="_blank" rel="noreferrer">
                        View on a Map
                      </a>
                    ) : (
                      <span className="catalog-detail-map-link">N/A</span>
                    )}
                  </article>
                </section>

                <section className="catalog-card catalog-detail-section">
                  <h3>Collector Insights</h3>
                  <div className="catalog-detail-community-grid" aria-label="Collector insights">
                    <div className="catalog-detail-community-item">
                      <strong>Recent Sales (7d)</strong>
                      <p>{insights.recent_sales || 'N/A'}</p>
                    </div>
                    <div className="catalog-detail-community-item">
                      <strong>Ownership Stats</strong>
                      <p>{insights.ownership_stats || 'N/A'}</p>
                    </div>
                    <div className="catalog-detail-community-item">
                      <strong>Watchlist Trend</strong>
                      <p>{insights.watchlist_trend || 'N/A'}</p>
                    </div>
                    <div className="catalog-detail-community-item">
                      <strong>Recent Activity</strong>
                      <p>{insights.recent_activity || 'N/A'}</p>
                    </div>
                  </div>
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

                <section className="catalog-card catalog-detail-section">
                  <h3>Tracked Certificate Sales History</h3>
                  {ownedCertEntries.length === 0 ? (
                    <p className="catalog-detail-listing-condition">Add this graded card with a cert number to start tracking cert-level sales history.</p>
                  ) : certSalesHistory.length === 0 ? (
                    <p className="catalog-detail-listing-condition">No cert-level sales history found yet for your tracked certificates.</p>
                  ) : (
                    certSalesHistory.slice(0, 5).map((sale, index) => {
                      const saleCert = sale.cert_number || sale.certNumber || sale.certificate_number || sale.certificateNumber || sale.serial || 'N/A'
                      const saleDate = sale.sold_at || sale.soldAt || sale.date || sale.sale_date || 'N/A'
                      const salePrice = sale.price ?? sale.sale_price ?? sale.amount

                      return (
                        <div key={`cert-sale-${index}`} className="catalog-detail-list-row" role="button" tabIndex={0}>
                          <div className="catalog-detail-seller-col">
                            <strong>Cert #{saleCert || 'N/A'}</strong>
                            <p>{saleDate || 'N/A'}</p>
                          </div>
                          <strong>{salePrice == null ? 'N/A' : formatUsd(salePrice)}</strong>
                        </div>
                      )
                    })
                  )}
                </section>

                <div className="catalog-detail-cartbar">
                  <button type="button" className="catalog-detail-cartbtn">Add to Cart</button>
                </div>
              </>
            ) : (
              <div className="catalog-card catalog-loading-panel">Item not found.</div>
            )}
          </section>
        ) : currentScreen === 'settings' ? (
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
        ) : (
          <section className="plans-screen" aria-label="Shopping cart">
            <h1>{tx('Your Cart')}</h1>
            <p className="subtitle">{tx('Review your selected subscription items before checkout.')}</p>

            {authMessage && <p className="auth-banner">{authMessage}</p>}

            {cartItems.length === 0 ? (
              <div className="cart-page-empty">
                <p className="subtitle">{tx('Your cart is empty.')}</p>
                <button type="button" className="back-home-btn" onClick={() => setCurrentScreen('plans')}>
                  {tx('Browse Plans')}
                </button>
              </div>
            ) : (
              <div className="cart-page-layout">
                <div className="cart-list" role="list">
                  {cartItems.map((item) => (
                    <div key={item.tier} className="cart-item" role="listitem">
                      <div>
                        <p className="cart-item-name">{item.display_name}</p>
                        <p className="cart-item-price">{formatPlanPrice(item.monthly_price_cents)}</p>
                      </div>
                      <button
                        type="button"
                        className="cart-remove-btn"
                        onClick={() => removePlanFromCart(item.tier)}
                      >
                        {tx('Remove')}
                      </button>
                    </div>
                  ))}
                </div>

                <aside className="cart-summary cart-page-summary">
                  <div className="cart-summary-row">
                    <span>{tx('Items')}</span>
                    <span>{cartItems.length}</span>
                  </div>
                  <div className="cart-summary-row">
                    <span>{tx('Subtotal')}</span>
                    <span>{formatPlanPrice(cartSubtotalCents)}</span>
                  </div>
                  <div className="cart-summary-row">
                    <span>Tax (14%)</span>
                    <span>{formatPlanPrice(cartTaxCents)}</span>
                  </div>
                  <div className="cart-summary-row cart-summary-total">
                    <span>{tx('Total')}</span>
                    <span>{formatPlanPrice(cartTotalCents)}</span>
                  </div>

                  <div className="cart-page-actions">
                    <button type="button" className="switch-auth support-cancel" onClick={() => setCurrentScreen('plans')}>
                      {tx('Keep Shopping')}
                    </button>
                    <button
                      type="button"
                      className="auth-submit support-submit"
                      onClick={handleCheckoutCart}
                      disabled={isUpdatingPlan}
                    >
                      {isUpdatingPlan ? tx('Processing...') : tx('Checkout')}
                    </button>
                  </div>
                </aside>
              </div>
            )}
          </section>
        )}
      </main>

      {isAuthOpen && (
        <div className="auth-overlay" onClick={closeAuth}>
          <section className="auth-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="close-auth" onClick={closeAuth}>
              &#10005;
            </button>
            <h3>
              {authMode === 'signup'
                ? tx('Create your account')
                : authMode === 'reset_password'
                  ? 'Reset your password'
                : authMode === 'pos'
                  ? t('storePosLogin')
                  : tx('Welcome back')}
            </h3>
            <p>
              {authMode === 'signup'
                ? tx('Start building your collection profile in minutes.')
                : authMode === 'reset_password'
                  ? 'Enter your new password to finish account recovery.'
                : authMode === 'pos'
                  ? tx('Log in with Store Code, Username, and PIN.')
                  : tx('Log in to access your collection dashboard.')}
            </p>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === 'pos' ? (
                <>
                  <label htmlFor="auth-store-code">{tx('Store Code')}</label>
                  <input
                    id="auth-store-code"
                    type="text"
                    value={posStoreCode}
                    onChange={(event) => setPosStoreCode(event.target.value)}
                    required
                  />

                  <label htmlFor="auth-username">{tx('Username')}</label>
                  <input
                    id="auth-username"
                    type="text"
                    value={posUsername}
                    onChange={(event) => setPosUsername(event.target.value)}
                    required
                  />

                  <label htmlFor="auth-pin">{tx('PIN')}</label>
                  <input
                    id="auth-pin"
                    type="password"
                    value={posPin}
                    onChange={(event) => setPosPin(event.target.value)}
                    minLength={4}
                    required
                  />
                </>
              ) : authMode === 'reset_password' ? (
                <>
                  <label htmlFor="auth-reset-password">New Password</label>
                  <input
                    id="auth-reset-password"
                    type="password"
                    value={resetPasswordValue}
                    onChange={(event) => setResetPasswordValue(event.target.value)}
                    minLength={6}
                    required
                  />

                  <label htmlFor="auth-reset-password-confirm">Confirm New Password</label>
                  <input
                    id="auth-reset-password-confirm"
                    type="password"
                    value={resetPasswordConfirmValue}
                    onChange={(event) => setResetPasswordConfirmValue(event.target.value)}
                    minLength={6}
                    required
                  />
                </>
              ) : (
                <>
                  <label htmlFor="auth-email">{tx('Email')}</label>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />

                  <label htmlFor="auth-password">{tx('Password')}</label>
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={6}
                    required
                  />
                  {authMode === 'signin' ? (
                    <button
                      type="button"
                      className="switch-auth"
                      onClick={handleForgotPassword}
                      disabled={isSubmitting}
                    >
                      Forgot password?
                    </button>
                  ) : null}
                </>
              )}

              {authMessage && <p className="auth-banner">{authMessage}</p>}
              {authError && <p className="auth-error">{authError}</p>}

              <button type="submit" className="auth-submit" disabled={isSubmitting}>
                {isSubmitting
                  ? tx('Please wait...')
                  : authMode === 'reset_password'
                    ? 'Update password'
                  : authMode === 'pos'
                    ? tx('Access Store')
                  : authMode === 'signup'
                    ? tx('Create account')
                    : tx('Log in')}
              </button>
            </form>

            {authMode === 'signup' ? (
              <>
                <button type="button" className="switch-auth" onClick={() => setAuthMode('signin')}>
                  {tx('Already have an account? Log in')}
                </button>
                <button type="button" className="switch-auth" onClick={() => setAuthMode('pos')}>
                  {tx('Store employee? Use POS login')}
                </button>
              </>
            ) : authMode === 'pos' ? (
              <>
                <button type="button" className="switch-auth" onClick={() => setAuthMode('signin')}>
                  {tx('Use account email login')}
                </button>
                <button type="button" className="switch-auth" onClick={() => setAuthMode('signup')}>
                  {tx('Create owner account')}
                </button>
              </>
            ) : authMode === 'reset_password' ? (
              <button type="button" className="switch-auth" onClick={() => setAuthMode('signin')}>
                Back to log in
              </button>
            ) : (
              <>
                <button type="button" className="switch-auth" onClick={() => setAuthMode('signup')}>
                  {tx('New here? Create account')}
                </button>
                <button type="button" className="switch-auth" onClick={() => setAuthMode('pos')}>
                  {tx('Store employee? Use POS login')}
                </button>
              </>
            )}
          </section>
        </div>
      )}

      {isAddToCollectionModalOpen && selectedCatalogItem ? (
        <div className="auth-overlay" onClick={() => {
          if (!isSavingCollectionItem) {
            setIsAddToCollectionModalOpen(false)
          }
        }}>
          <section className="auth-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="close-auth"
              disabled={isSavingCollectionItem}
              onClick={() => {
                setIsAddToCollectionModalOpen(false)
                resetAddToCollectionForm()
              }}
            >
              &#10005;
            </button>
            <h3>Add to Collection</h3>
            <p>Track how this item was acquired and what it cost.</p>

            <form
              className="auth-form"
              onSubmit={(event) => {
                event.preventDefault()
                handleConfirmAddToCollection()
              }}
            >
              <label htmlFor="collection-acquisition-type">Acquisition Type</label>
              <select
                id="collection-acquisition-type"
                value={collectionAcquisitionType}
                onChange={(event) => {
                  setCollectionAcquisitionType(event.target.value)
                  setCollectionPurchaseError('')
                }}
              >
                {COLLECTION_ACQUISITION_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              {collectionAcquisitionType === 'direct' ? (
                <>
                  <label htmlFor="collection-purchase-price">Purchase Price (CAD)</label>
                  <input
                    id="collection-purchase-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={collectionPurchasePriceInput}
                    onChange={(event) => setCollectionPurchasePriceInput(event.target.value)}
                    placeholder="e.g. 129.99"
                    required
                  />
                </>
              ) : null}

              {collectionAcquisitionType === 'gift' ? (
                <p className="auth-banner">Gift selected. Purchase price will be recorded as $0.00.</p>
              ) : null}

              {collectionAcquisitionType === 'box_set' ? (
                <>
                  <label htmlFor="collection-box-total">Box Set Total Price (CAD)</label>
                  <input
                    id="collection-box-total"
                    type="number"
                    min="0"
                    step="0.01"
                    value={collectionBoxSetTotalInput}
                    onChange={(event) => setCollectionBoxSetTotalInput(event.target.value)}
                    placeholder="e.g. 240"
                    required
                  />

                  <label htmlFor="collection-box-count">Number of Cards in Box Set</label>
                  <input
                    id="collection-box-count"
                    type="number"
                    min="1"
                    step="1"
                    value={collectionBoxSetItemCountInput}
                    onChange={(event) => setCollectionBoxSetItemCountInput(event.target.value)}
                    placeholder="e.g. 24"
                    required
                  />

                  {Number.isFinite(Number(collectionBoxSetTotalInput)) && Number(collectionBoxSetItemCountInput) > 0 ? (
                    <p className="auth-banner">
                      Per-item price: {formatUsd(Number(collectionBoxSetTotalInput) / Number(collectionBoxSetItemCountInput))}
                    </p>
                  ) : null}
                </>
              ) : null}

              {collectionPurchaseError ? <p className="auth-error">{collectionPurchaseError}</p> : null}

              <button type="submit" className="auth-submit" disabled={isSavingCollectionItem}>
                {isSavingCollectionItem ? 'Saving...' : 'Add to Collection'}
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {downgradeModalType && (
        <div className="auth-overlay" onClick={closeDowngradeModal}>
          <section className="auth-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="close-auth" onClick={closeDowngradeModal}>
              &#10005;
            </button>
            <h3>{isCollectorDowngradeModal ? 'Downgrade to Free Collector' : 'Remove Event Organizer'}</h3>
            <p>
              {isCollectorDowngradeModal
                ? 'Your Collector+ plan will stay active until the end of your current billing period, then your account will move to Free Collector.'
                : 'Your Event Organizer add-on will stay active until the end of your current billing period, then it will be removed automatically.'}
            </p>
            <ul className="m-0 mb-4 list-disc pl-5 text-sm leading-snug text-[#2b4468]">
              <li>
                {isCollectorDowngradeModal ? 'Collector+' : 'Event Organizer'} benefits stay active until {formatDate(profile?.subscription_current_period_end)}.
              </li>
              <li>{isCollectorDowngradeModal ? 'Your renewal will be cancelled.' : 'The add-on renewal will be cancelled.'}</li>
              <li>You can resubscribe before the end date if you change your mind.</li>
            </ul>
            <div className="support-actions">
              <button type="button" className="switch-auth support-cancel" onClick={closeDowngradeModal}>
                {isCollectorDowngradeModal ? 'Keep Collector+' : 'Keep Event Organizer'}
              </button>
              <button
                type="button"
                className="auth-submit support-submit"
                onClick={isCollectorDowngradeModal ? handleScheduleCollectorDowngrade : handleScheduleEventAddonRemoval}
                disabled={isUpdatingPlan}
              >
                {isUpdatingPlan ? 'Scheduling...' : isCollectorDowngradeModal ? 'Schedule Downgrade' : 'Schedule Removal'}
              </button>
            </div>
          </section>
        </div>
      )}

      {isTwoFactorModalOpen && (
        <div className="auth-overlay" onClick={closeTwoFactorModal}>
          <section className="auth-modal auth-modal-wide twofactor-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="close-auth" onClick={closeTwoFactorModal}>
              &#10005;
            </button>
            <h3>Set Up Two-Factor Authentication</h3>
            <p>
              Scan this code with your authenticator app, then enter the 6-digit code to finish setup.
            </p>

            <div className="twofactor-setup-grid">
              <div className="twofactor-qr-wrap" aria-label="Authenticator QR code">
                {twoFactorQrSvg ? (
                  <div className="twofactor-qr" dangerouslySetInnerHTML={{ __html: twoFactorQrSvg }} />
                ) : twoFactorQrDataUrl ? (
                  <div className="twofactor-qr">
                    <img src={twoFactorQrDataUrl} alt="Authenticator QR code" className="twofactor-qr-image" />
                  </div>
                ) : (
                  <p className="settings-subsection-note">QR code unavailable. Use the manual key below.</p>
                )}
              </div>

              <div className="twofactor-secret-wrap">
                <p className="settings-subsection-title">Manual setup key</p>
                <code className="twofactor-secret">{twoFactorSecret || 'Unavailable'}</code>

                <label htmlFor="twofactor-code">Verification code</label>
                <input
                  id="twofactor-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                />

                {twoFactorError && <p className="auth-error">{twoFactorError}</p>}

                <div className="settings-form-actions">
                  <button type="button" className="switch-auth support-cancel" onClick={closeTwoFactorModal}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="auth-submit support-submit"
                    onClick={handleVerifyTwoFactorSetup}
                    disabled={isTwoFactorLoading || twoFactorCode.length !== 6}
                  >
                    {isTwoFactorLoading ? 'Verifying...' : 'Verify & Enable'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {supportRequest && (
        <div className="auth-overlay" onClick={closeSupportRequest}>
          <section
            className={`auth-modal ${supportRequest === 'contact_store_plus_upgrade' ? 'auth-modal-wide' : ''}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="close-auth" onClick={closeSupportRequest}>
              &#10005;
            </button>

            {supportRequest === 'contact_store_plus_upgrade' ? (
              <div className="auth-form support-upgrade-form">
                <h3>Upgrade to Store+</h3>
                <p className="support-upgrade-subtitle">
                  Custom solutions for larger retailers
                </p>
                <hr className="support-divider" />

                <fieldset className="support-group">
                  <legend className="support-legend">Locations</legend>
                  <div className="support-options support-options-locations">
                    {['1', '2-5', '6-20', '20+'].map((value) => (
                      <label key={value} className="support-choice">
                        <input
                          className="support-radio"
                          type="radio"
                          name="store-plus-locations"
                          value={value}
                          checked={storePlusLocations === value}
                          onChange={(event) => setStorePlusLocations(event.target.value)}
                        />
                        {value}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="support-group">
                  <legend className="support-legend">Employee count</legend>
                  <div className="support-options support-options-employees">
                    {['1-5', '6-15', '16-50', '51-100', '100+'].map((value) => (
                      <label key={value} className="support-choice">
                        <input
                          className="support-radio"
                          type="radio"
                          name="store-plus-employees"
                          value={value}
                          checked={storePlusEmployeeCount === value}
                          onChange={(event) => setStorePlusEmployeeCount(event.target.value)}
                        />
                        {value}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label htmlFor="store-plus-additional" className="support-legend">
                  Additional information (optional)
                </label>
                <textarea
                  className="support-notes"
                  id="store-plus-additional"
                  value={storePlusAdditionalInfo}
                  onChange={(event) => setStorePlusAdditionalInfo(event.target.value)}
                  rows={3}
                />

                {supportFormError && <p className="auth-error">{supportFormError}</p>}

                <div className="support-actions">
                  <button type="button" className="switch-auth support-cancel" onClick={closeSupportRequest}>
                    Cancel
                  </button>
                  <button type="button" className="auth-submit support-submit" onClick={handleSendSupportEmail}>
                    Request Upgrade
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3>Contact Support</h3>
                <p>
                  Downgrading a Store account may affect inventory, active listings and business data. Send this email to review your options.
                </p>

                <div className="auth-form">
                  <label htmlFor="support-email-to">To</label>
                  <input id="support-email-to" type="text" value="collectorhub.support@gmail.com" readOnly />

                  <label htmlFor="support-message">Message</label>
                  <textarea
                    id="support-message"
                    value={supportMessageText}
                    onChange={(event) => setSupportMessageText(event.target.value)}
                    rows={7}
                  />

                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button type="button" className="switch-auth" onClick={closeSupportRequest}>
                      Cancel
                    </button>
                    <button type="button" className="auth-submit" onClick={handleSendSupportEmail}>
                      Send Email
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {isStoreUpgradeModalOpen && (
        <div className="auth-overlay" onClick={closeStoreUpgradeModal}>
          <section className="auth-modal auth-modal-wide" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="close-auth" onClick={closeStoreUpgradeModal}>
              &#10005;
            </button>

            <div className="auth-form support-upgrade-form">
              <h3>Become a Store</h3>
              <p className="support-upgrade-subtitle">Tell us about your business so we can verify your store account.</p>
              <hr className="support-divider" />

              <label htmlFor="store-business-name">Business name</label>
              <input
                id="store-business-name"
                type="text"
                value={storeBusinessName}
                onChange={(event) => setStoreBusinessName(event.target.value)}
                placeholder="Acme Collectibles Ltd"
              />

              <label htmlFor="store-business-type">Store type</label>
              <select
                id="store-business-type"
                value={storeBusinessType}
                onChange={(event) => setStoreBusinessType(event.target.value)}
              >
                <option value="">Select one</option>
                <option value="pawn">Pawn</option>
                <option value="collectable">Collectable</option>
                <option value="online">Online</option>
              </select>

              <label htmlFor="store-phone-number">Phone number</label>
              <input
                id="store-phone-number"
                type="tel"
                value={storePhoneNumber}
                onChange={(event) => setStorePhoneNumber(event.target.value)}
                placeholder="(123) 456-7890"
              />

              {storeBusinessType !== 'online' && (
                <div>
                  <label className="support-legend" htmlFor="store-hours-monday-open">
                    Business hours
                  </label>
                  <div className="store-hours-grid">
                    {BUSINESS_HOUR_DAYS.map((day) => {
                      const dayHours = storeBusinessHoursByDay[day]
                      const isClosed = dayHours.open === 'Closed'
                      return (
                        <div key={day} className="store-hours-row">
                          <span className="store-hours-day">{day}</span>
                          <select
                            id={`store-hours-${day.toLowerCase()}-open`}
                            value={dayHours.open}
                            onChange={(event) => updateStoreBusinessHours(day, 'open', event.target.value)}
                          >
                            {BUSINESS_HOUR_OPTIONS.map((optionValue) => (
                              <option key={`${day}-open-${optionValue || 'select'}`} value={optionValue}>
                                {optionValue || 'Open'}
                              </option>
                            ))}
                          </select>
                          <select
                            value={dayHours.close}
                            onChange={(event) => updateStoreBusinessHours(day, 'close', event.target.value)}
                            disabled={!dayHours.open || isClosed}
                          >
                            <option value="">Close</option>
                            {BUSINESS_HOUR_OPTIONS.filter(
                              (optionValue) => optionValue && optionValue !== 'Closed',
                            ).map((optionValue) => (
                              <option key={`${day}-close-${optionValue}`} value={optionValue}>
                                {optionValue}
                              </option>
                            ))}
                          </select>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <label htmlFor="store-registration-number">Business registration number</label>
              <input
                id="store-registration-number"
                type="text"
                value={storeRegistrationNumber}
                onChange={(event) => setStoreRegistrationNumber(event.target.value)}
                placeholder="BN / Registration #"
              />

              <label htmlFor="store-certificates">Business certificates and licensing details</label>
              <textarea
                id="store-certificates"
                value={storeCertificateDetails}
                onChange={(event) => setStoreCertificateDetails(event.target.value)}
                rows={3}
                placeholder="Enter certificate names, IDs, issuing authority, and links if available"
              />

              <label htmlFor="store-certificate-scan">Business certificate scan (JPEG)</label>
              <input
                id="store-certificate-scan"
                type="file"
                accept=".jpg,.jpeg,image/jpeg"
                onChange={(event) => setStoreCertificateScanFile(event.target.files?.[0] || null)}
              />

              <label htmlFor="store-proof-address">Proof of address (power bill, JPEG/PDF)</label>
              <input
                id="store-proof-address"
                type="file"
                accept=".jpg,.jpeg,.pdf,image/jpeg,application/pdf"
                onChange={(event) => setStoreProofOfAddressFile(event.target.files?.[0] || null)}
              />

              <label htmlFor="store-additional-info">Additional information (optional)</label>
              <textarea
                id="store-additional-info"
                value={storeAdditionalInfo}
                onChange={(event) => setStoreAdditionalInfo(event.target.value)}
                rows={2}
              />

              {storeUpgradeError && <p className="auth-error">{storeUpgradeError}</p>}

              <div className="support-actions">
                <button type="button" className="switch-auth support-cancel" onClick={closeStoreUpgradeModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="auth-submit support-submit"
                  onClick={handleSubmitStoreUpgradeRequest}
                  disabled={isSubmittingStoreUpgrade}
                >
                  {isSubmittingStoreUpgrade ? 'Submitting...' : 'Submit for Review'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
