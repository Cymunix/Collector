import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
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
import CompletionPage from './pages/CompletionPage'
import HomePage from './pages/HomePage'
import CollectionPage from './pages/CollectionPage'
import CollectionItemPage from './pages/CollectionItemPage'
import WishlistPage from './pages/WishlistPage'
import CatalogPage from './pages/CatalogPage'
import PlansPage from './pages/PlansPage'
import CatalogItemPage from './pages/CatalogItemPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import CartPage from './pages/CartPage'

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

const PROFILE_ACHIEVEMENTS = [
  // §1 Collection Milestones — total copies
  { id: 'first_step',       icon: '🎯', name: 'First Step',           desc: 'Add your first item',               rarity: 'common',    group: 'Collection', check: s => s.totalItems >= 1 },
  { id: 'getting_started',  icon: '📦', name: 'Getting Started',      desc: 'Collect 10 items',                  rarity: 'common',    group: 'Collection', check: s => s.totalItems >= 10 },
  { id: 'dedicated',        icon: '🏆', name: 'Dedicated Collector',  desc: 'Collect 50 items',                  rarity: 'uncommon',  group: 'Collection', check: s => s.totalItems >= 50 },
  { id: 'century_club',     icon: '⭐', name: 'Century Club',          desc: 'Collect 100 items',                 rarity: 'uncommon',  group: 'Collection', check: s => s.totalItems >= 100 },
  { id: 'serious',          icon: '💎', name: 'Serious Collector',    desc: 'Collect 500 items',                 rarity: 'rare',      group: 'Collection', check: s => s.totalItems >= 500 },
  { id: 'master_collector', icon: '👑', name: 'Master Collector',     desc: 'Collect 1,000 items',               rarity: 'epic',      group: 'Collection', check: s => s.totalItems >= 1000 },
  { id: 'hoarder',          icon: '🐉', name: 'Hoarder',              desc: 'Collect 5,000 items',               rarity: 'legendary', group: 'Collection', check: s => s.totalItems >= 5000 },
  // §2 Unique Items
  { id: 'variety_pack',     icon: '🃏', name: 'Variety Pack',         desc: '10 unique items',                   rarity: 'common',    group: 'Collection', check: s => s.uniqueItems >= 10 },
  { id: 'collectors_eye',   icon: '🎨', name: "Collector's Eye",      desc: '50 unique items',                   rarity: 'uncommon',  group: 'Collection', check: s => s.uniqueItems >= 50 },
  { id: 'deep_diver',       icon: '🔭', name: 'Deep Diver',           desc: '250 unique items',                  rarity: 'uncommon',  group: 'Collection', check: s => s.uniqueItems >= 250 },
  { id: 'connoisseur',      icon: '🏛️', name: 'Connoisseur',          desc: '1,000 unique items',                rarity: 'epic',      group: 'Collection', check: s => s.uniqueItems >= 1000 },
  // §3 Collection Value
  { id: 'first_invest',     icon: '💰', name: 'First Investment',     desc: 'Collection valued at $100+',        rarity: 'common',    group: 'Value',      check: s => s.totalValue >= 100 },
  { id: 'big_spender',      icon: '💵', name: 'Big Spender',          desc: 'Collection valued at $500+',        rarity: 'uncommon',  group: 'Value',      check: s => s.totalValue >= 500 },
  { id: 'high_roller',      icon: '🏦', name: 'High Roller',          desc: 'Collection valued at $1,000+',      rarity: 'uncommon',  group: 'Value',      check: s => s.totalValue >= 1000 },
  { id: 'whale',            icon: '💸', name: 'Whale',                desc: 'Collection valued at $5,000+',      rarity: 'rare',      group: 'Value',      check: s => s.totalValue >= 5000 },
  { id: 'vault_keeper',     icon: '🏰', name: 'Vault Keeper',         desc: 'Collection valued at $25,000+',     rarity: 'legendary', group: 'Value',      check: s => s.totalValue >= 25000 },
  // §4 Grading
  { id: 'grade_conscious',  icon: '🔬', name: 'Grade Conscious',      desc: '1+ graded item',                    rarity: 'common',    group: 'Grading',    check: s => s.gradedCount >= 1 },
  { id: 'grading_pro',      icon: '🏅', name: 'Grading Pro',          desc: '10+ graded items',                  rarity: 'uncommon',  group: 'Grading',    check: s => s.gradedCount >= 10 },
  { id: 'grade_master',     icon: '🎖️', name: 'Grade Master',         desc: '50+ graded items',                  rarity: 'rare',      group: 'Grading',    check: s => s.gradedCount >= 50 },
  { id: 'gem_mint',         icon: '💍', name: 'Gem Mint',             desc: 'Own a PSA 10 / top-grade item',     rarity: 'epic',      group: 'Grading',    check: s => s.gemMintCount >= 1 },
  // §5 Category Breadth
  { id: 'branching_out',    icon: '🌐', name: 'Branching Out',        desc: 'Items in 2+ categories',            rarity: 'common',    group: 'Diversity',  check: s => s.categoryCount >= 2 },
  { id: 'well_rounded',     icon: '🌍', name: 'Well Rounded',         desc: 'Items in 4+ categories',            rarity: 'uncommon',  group: 'Diversity',  check: s => s.categoryCount >= 4 },
  { id: 'everything',       icon: '🗺️', name: 'Everything Collector', desc: 'Items in 6+ categories',            rarity: 'rare',      group: 'Diversity',  check: s => s.categoryCount >= 6 },
  // §6 Set Completion
  { id: 'set_builder',      icon: '🧱', name: 'Set Builder',          desc: '25% of any base set',               rarity: 'common',    group: 'Sets',       check: s => s.maxSetPct >= 25 },
  { id: 'halfway_there',    icon: '🎪', name: 'Halfway There',        desc: '50% of any base set',               rarity: 'uncommon',  group: 'Sets',       check: s => s.maxSetPct >= 50 },
  { id: 'almost_home',      icon: '🏁', name: 'Almost Home',          desc: '75% of any base set',               rarity: 'rare',      group: 'Sets',       check: s => s.maxSetPct >= 75 },
  { id: 'set_complete',     icon: '✅', name: 'Set Complete',          desc: 'Complete 100% of any base set',     rarity: 'epic',      group: 'Sets',       check: s => s.maxSetPct >= 100 },
  // §7 Rainbow / Parallels
  { id: 'color_started',    icon: '🌈', name: 'Color Started',        desc: '3+ parallels of one card',          rarity: 'common',    group: 'Rainbow',    check: s => s.maxParallels >= 3 },
  { id: 'rainbow_chaser',   icon: '🌠', name: 'Rainbow Chaser',       desc: '7+ parallels of one card',          rarity: 'rare',      group: 'Rainbow',    check: s => s.maxParallels >= 7 },
  { id: 'full_rainbow',     icon: '🔮', name: 'Full Rainbow',         desc: 'Every parallel of one card',        rarity: 'legendary', group: 'Rainbow',    check: s => s.fullRainbow >= 1 },
  // §8 Chase / Scarcity
  { id: 'numbered',         icon: '🔢', name: 'Numbered',             desc: 'Own a serial-numbered card',        rarity: 'common',    group: 'Chase',      check: s => s.numberedCount >= 1 },
  { id: 'low_pop',          icon: '🦄', name: 'Low Pop',              desc: 'Own a card /25 or scarcer',         rarity: 'rare',      group: 'Chase',      check: s => s.lowPopCount >= 1 },
  { id: 'one_of_one',       icon: '🥇', name: 'One of One',           desc: 'Own a 1-of-1',                      rarity: 'legendary', group: 'Chase',      check: s => s.oneOfOneCount >= 1 },
  // §9 Rookies
  { id: 'rookie_hound',     icon: '🐶', name: 'Rookie Hound',         desc: 'Own 10 rookies',                    rarity: 'common',    group: 'Rookies',    check: s => s.rookieCount >= 10 },
  { id: 'class_of',         icon: '🎓', name: 'Class Of',             desc: 'Own 50 rookies',                    rarity: 'uncommon',  group: 'Rookies',    check: s => s.rookieCount >= 50 },
  // §10 Depth in One Set
  { id: 'getting_deep',     icon: '📚', name: 'Getting Deep',         desc: '25 cards from a single set',        rarity: 'common',    group: 'Sets',       check: s => s.maxSetDepth >= 25 },
  { id: 'set_specialist',   icon: '🔍', name: 'Set Specialist',       desc: '100 cards from a single set',       rarity: 'rare',      group: 'Sets',       check: s => s.maxSetDepth >= 100 },
  // §11 Wishlist
  { id: 'making_a_list',    icon: '📋', name: 'Making a List',        desc: 'Add your first want',               rarity: 'common',    group: 'Wishlist',   check: s => s.wishlistCount >= 1 },
  { id: 'want_it_all',      icon: '🛒', name: 'Want It All',          desc: 'Want-list of 50 items',             rarity: 'uncommon',  group: 'Wishlist',   check: s => s.wishlistCount >= 50 },
]

const CATEGORY_LABEL_OVERRIDES = {
  Music: {
    subcategory: 'Format',
    franchise: 'Franchise',
    brand: 'Record Label',
    collectibleSet: 'Album',
    subset: 'Variant',
    productLine: 'Product Line',
    property: 'Property',
    subject: 'Artist(s)',
    hideFranchise: true,
  },
  'Building Blocks': {
    subcategory: 'Subcategory',
    franchise: 'Theme',
    brand: 'Item Type',
    collectibleSet: 'Packaging',
    subset: 'Subtheme',
    productLine: 'Product Line',
    property: 'Property',
    subject: 'Subject(s)',
  },
  Toys: {
    subcategory: 'Brand/Manufacturer',
    franchise: 'Franchise',
    brand: 'Item Type',
    collectibleSet: 'Packaging',
    subset: 'Subfranchise',
    productLine: 'Product Line',
    property: 'Property',
    subject: 'Subject(s)',
  },
}
const DEFAULT_CATEGORY_LABELS = {
  subcategory: 'Subcategory',
  franchise: 'Franchise',
  brand: 'Brand',
  collectibleSet: 'Collectible Set',
  subset: 'Subset',
  productLine: 'Product Line',
  property: 'Property',
  subject: 'Subject(s)',
}
function getCategoryLabels(categoryName) {
  return CATEGORY_LABEL_OVERRIDES[categoryName] || DEFAULT_CATEGORY_LABELS
}

// ─── Central Bulk-Import column → catalogue-field mapping ─────────────────────
// One source of truth for how spreadsheet headers map to catalogue fields, so the
// importer never re-interprets a column with legacy logic. `band` groups fields
// for the review UI: taxonomy (the catalogue tree), universal (metadata every
// item has), attribute (category/item-type specific). `categories`/`itemTypes`
// gate when an attribute is relevant. Header matching is normalized
// (lowercase, spaces→_, parens stripped) and each header maps to exactly one
// field — no column is read into two fields.
const BULK_FIELD_MAP = {
  // ── Catalogue taxonomy ──
  category:        { aliases: ['category', 'categories'], band: 'taxonomy', label: 'Category' },
  subcategory:     { aliases: ['subcategory', 'subcategories', 'sub_category'], band: 'taxonomy', label: 'Subcategory' },
  franchise:       { aliases: ['franchise', 'franchises', 'franchise_name'], band: 'taxonomy', label: 'Franchise' },
  subfranchise:    { aliases: ['subfranchise', 'subfranchises', 'subtheme', 'sub_theme', 'subset', 'subset_name'], band: 'taxonomy', label: 'Subfranchise' },
  property:        { aliases: ['property', 'properties'], band: 'taxonomy', label: 'Property' },
  product_line:    { aliases: ['product_line', 'product_lines', 'productline'], band: 'taxonomy', label: 'Product Line' },
  manufacturer:    { aliases: ['manufacturer', 'brand/manufacturer', 'brand_manufacturer', 'brandmanufacturer', 'maker'], band: 'taxonomy', label: 'Brand/Manufacturer' },
  item_type:       { aliases: ['item_type', 'item_types', 'itemtype', 'brand', 'brand_name'], band: 'taxonomy', label: 'Item Type' },
  series:          { aliases: ['series', 'series_name'], band: 'taxonomy', label: 'Series' },
  item_name:       { aliases: ['item', 'items', 'item_name', 'title'], band: 'taxonomy', label: 'Item' },
  // ── Universal metadata ──
  subject:         { aliases: ['subject', 'subjects', 'subject_name', 'character', 'minifig_name', 'fig_name'], band: 'universal', label: 'Subject(s)' },
  description:     { aliases: ['description', 'desc', 'notes'], band: 'universal', label: 'Description' },
  id_number:       { aliases: ['id_number', 'idnumber', 'id_no', 'reference'], band: 'universal', label: 'ID Number' },
  release_year:    { aliases: ['release_year', 'year'], band: 'universal', label: 'Release Year' },
  availability:    { aliases: ['availability', 'available'], band: 'universal', label: 'Availability' },
  barcode:         { aliases: ['barcode', 'barcodes', 'upc', 'ean', 'barcode/upc', 'upc/barcode'], band: 'universal', label: 'Barcode' },
  includes:        { aliases: ['includes', 'contains'], band: 'universal', label: 'Includes' },
  included_in:     { aliases: ['included_in', 'parent_set', 'parent_set_number', 'parent_set_bricklink_id'], band: 'universal', label: 'Included In' },
  image_url:       { aliases: ['image_url', 'img_url', 'image', 'photo_url', 'photo'], band: 'universal', label: 'Image URL' },
  // ── Building Blocks attributes ──
  lego_set_number: { aliases: ['lego_set_number', 'set_number', 'set_num', 'lego_number', 'set_id'], band: 'attribute', categories: ['Building Blocks'], label: 'Set Number' },
  piece_count:     { aliases: ['piece_count', 'pieces', 'parts', 'num_parts'], band: 'attribute', categories: ['Building Blocks', 'Toys'], label: 'Piece Count' },
  bricklink_id:    { aliases: ['bricklink_id', 'bricklink', 'bl_id', 'catalog_code'], band: 'attribute', categories: ['Building Blocks'], label: 'BrickLink ID' },
  rebrickable_id:  { aliases: ['rebrickable_fig_id', 'rebrickable_id', 'rebrickable', 'rb_id', 'fig_num'], band: 'attribute', categories: ['Building Blocks'], label: 'Rebrickable ID' },
  retail_price:    { aliases: ['retail_price', 'msrp', 'rrp', 'retail', 'price'], band: 'attribute', categories: ['Building Blocks', 'Toys'], label: 'Retail Price' },
  minifig_code:    { aliases: ['minifig_code', 'internal_code'], band: 'attribute', categories: ['Building Blocks'], itemTypes: ['minifigure', 'minifig', 'minifigs'], label: 'Minifig Code' },
  species:         { aliases: ['species', 'species_name', 'race'], band: 'attribute', categories: ['Building Blocks'], itemTypes: ['minifigure', 'minifig', 'minifigs'], label: 'Species' },
  // ── Trading / Sports card attributes ──
  card_number:     { aliases: ['card_number', 'card_num'], band: 'attribute', categories: ['Trading Cards', 'Sports Cards'], label: 'Card Number' },
  print_count:     { aliases: ['print_count', 'print_run'], band: 'attribute', categories: ['Trading Cards', 'Sports Cards'], label: 'Print Count' },
  print_type:      { aliases: ['print_type', 'print_type_name', 'variant'], band: 'attribute', categories: ['Trading Cards', 'Sports Cards'], label: 'Print Type' },
  rarity:          { aliases: ['rarity', 'rarity_name'], band: 'attribute', categories: ['Trading Cards', 'Sports Cards'], label: 'Rarity' },
  card_treatments: { aliases: ['card_treatments', 'card_treatment', 'treatments', 'treatment'], band: 'attribute', categories: ['Trading Cards', 'Sports Cards'], label: 'Card Treatments' },
  team:            { aliases: ['team', 'teams', 'faction', 'factions', 'affiliation', 'team_affiliation'], band: 'attribute', categories: ['Sports Cards', 'Trading Cards'], label: 'Team / Affiliation' },
}
const BULK_HEADER_NORMALIZE = (h) => (h || '').toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')
const BULK_ALIAS_TO_FIELD = (() => {
  const m = {}
  for (const [field, def] of Object.entries(BULK_FIELD_MAP)) for (const a of def.aliases) if (!(a in m)) m[a] = field
  return m
})()
// NOTE: image-discovery query generation and candidate scoring now live
// server-side in the `discover-catalog-images` edge function (the authoritative,
// secure home — it holds the Google secrets and reads the DB directly). The former
// client-side buildImageSearchMetadata/scoreImageCandidate helpers were removed so
// there is a single source of truth.

const MTG_CARD_TREATMENT_NAMES  = new Set(['Foil', 'Etched', 'Borderless', 'Extended Art', 'Showcase', 'Retro', 'Textless'])
const SPORTS_CARD_TYPE_NAMES    = new Set(['Foil', 'Patch', 'Rookie', 'Signature'])

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

// LEGO condition scales — sets and minifigs split first on sealed vs opened.
const LEGO_SET_CONDITION_SCALE = [
  'New / Sealed (MISB)',
  'New / Opened',
  'Used / Complete',
  'Used / Incomplete',
]
const LEGO_MINIFIG_CONDITION_SCALE = [
  'New / Sealed (MISB)',
  'New',
  'Used / Complete',
  'Used / Incomplete',
]
// Sub-grade for a sealed set's box (value is mostly box condition since contents are hidden).
const LEGO_SET_BOX_GRADES = ['Mint box', 'Minor shelf wear', 'Creased / damaged box']
// Presence sub-condition for orthogonal parts (instructions, box).
const LEGO_PRESENCE_OPTIONS = ['Present — mint', 'Present — worn', 'Missing']

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
// LEGO (subcategory) items may only be branded one of these three.
const LEGO_BRAND_NAMES = ['Sets', 'Minifigs', 'Miscellaneous']

const LEGO_HONORIFICS = [
  'Grand Admiral', 'Grand Moff', 'Grand Master', 'Fleet Admiral', 'High Admiral',
  'Admiral', 'General', 'Captain', 'Commander', 'Lieutenant Colonel', 'Lieutenant',
  'Sergeant Major', 'Sergeant', 'Major', 'Colonel', 'Corporal', 'Private',
  'Emperor', 'Empress', 'Darth', 'Sith Lord',
  'Count', 'King', 'Queen', 'Prince', 'Princess',
  'Master', 'Jedi Master', 'Jedi Knight', 'Jedi',
  'Lord', 'Lady', 'Doctor', 'Director',
].sort((a, b) => b.length - a.length)

function deriveMinifigShorthand(name) {
  if (!name) return ''
  const alias = name.match(/\(([^)]+)\)/)
  let s = alias ? alias[1] : name
  for (const h of LEGO_HONORIFICS) {
    if (new RegExp(`^${h}\\s+`, 'i').test(s)) { s = s.replace(new RegExp(`^${h}\\s+`, 'i'), ''); break }
  }
  return s.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'UNKN'
}

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
  const [currentScreen, setCurrentScreen] = useState(() => {
    // On back/forward navigation the browser restores history.state before React mounts
    const fromHistory = window.history.state?.screen
    if (fromHistory) return fromHistory === 'catalog_item' ? 'catalog' : fromHistory
    try {
      const saved = sessionStorage.getItem('ch_screen')
      if (saved === 'catalog_item') return 'catalog'
      if (saved) return saved
    } catch (_) {}
    return 'home'
  })
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
  const [catalogFranchiseSearch, setCatalogFranchiseSearch] = useState('')
  const [catalogPendingFranchiseSubcategory, setCatalogPendingFranchiseSubcategory] = useState('')
  const [catalogMinYear, setCatalogMinYear] = useState('')
  const [catalogMaxYear, setCatalogMaxYear] = useState('')
  const [siteSearchQuery, setSiteSearchQuery] = useState('')
  const [catalogItems, setCatalogItems] = useState([])
  const [catalogCategories, setCatalogCategories] = useState([])
  const [catalogSubcategories, setCatalogSubcategories] = useState([])
  const [catalogFranchises, setCatalogFranchises] = useState([])
  const [catalogFranchiseBrands, setCatalogFranchiseBrands] = useState([])
  const [catalogFranchiseLinkedBrands, setCatalogFranchiseLinkedBrands] = useState([])
  const [catalogBrands, setCatalogBrands] = useState([])
  const [catalogBrandId, setCatalogBrandId] = useState('')
  const [catalogTeamId, setCatalogTeamId] = useState('')
  const [catalogSetId, setCatalogSetId] = useState('')
  const [catalogSubsetId, setCatalogSubsetId] = useState('')
  // Faceted (LEGO) filters: Subtheme (subsets) → Product Line (product_lines).
  const [catalogSubthemeId, setCatalogSubthemeId] = useState('')
  const [catalogSubthemeOptions, setCatalogSubthemeOptions] = useState([])
  const [catalogProductLineId, setCatalogProductLineId] = useState('')
  const [catalogProductLineOptions, setCatalogProductLineOptions] = useState([])
  const [catalogSeriesId, setCatalogSeriesId] = useState('')
  const [catalogSeriesOptions, setCatalogSeriesOptions] = useState([])
  const [catalogPrintTypeId, setCatalogPrintTypeId] = useState('')
  const [catalogCardTypeIds, setCatalogCardTypeIds] = useState([])
  const [catalogSubjectId, setCatalogSubjectId] = useState('')
  const [catalogSubjectSearch, setCatalogSubjectSearch] = useState('')
  const [catalogSubjectResults, setCatalogSubjectResults] = useState([])
  const [catalogSubjectSearching, setCatalogSubjectSearching] = useState(false)
  const [catalogAlbumSearch, setCatalogAlbumSearch] = useState('')
  const [catalogAlbumResults, setCatalogAlbumResults] = useState([])
  const [catalogAlbumSearching, setCatalogAlbumSearching] = useState(false)
  const [musicFranchiseId, setMusicFranchiseId] = useState('')
  const [musicBrandIds, setMusicBrandIds] = useState(new Set())
  const [catalogAllCardTypes, setCatalogAllCardTypes] = useState([])
  const [catalogTeams, setCatalogTeams] = useState([])
  const [catalogSets, setCatalogSets] = useState([])
  const [catalogSubsets, setCatalogSubsets] = useState([])
  const [catalogPrintTypes, setCatalogPrintTypes] = useState([])
  const [catalogCategoryIdsWithItems, setCatalogCategoryIdsWithItems] = useState([])
  const [catalogSubcategoryIdsWithItems, setCatalogSubcategoryIdsWithItems] = useState([])
  const [isCatalogLoading, setIsCatalogLoading] = useState(false)
  const [catalogLoadError, setCatalogLoadError] = useState('')
  const [catalogReloadToken, setCatalogReloadToken] = useState(0)
  const [catalogPage, setCatalogPage] = useState(1)
  const [catalogPageInput, setCatalogPageInput] = useState('1')
  const [catalogViewMode, setCatalogViewMode] = useState('grid')
  const [isCatalogBulkEditMode, setIsCatalogBulkEditMode] = useState(false)
  const [catalogBulkSelectedIds, setCatalogBulkSelectedIds] = useState(new Set())
  const [catalogBulkEditValues, setCatalogBulkEditValues] = useState({
    brand_id: '',
    collectible_set_id: '',
  })
  const [catalogBulkBrandOptions, setCatalogBulkBrandOptions] = useState([])
  const [catalogBulkSetOptions, setCatalogBulkSetOptions] = useState([])
  const [isApplyingCatalogBulkEdit, setIsApplyingCatalogBulkEdit] = useState(false)
  const [catalogBulkEditError, setCatalogBulkEditError] = useState('')
  const [catalogBulkEditMessage, setCatalogBulkEditMessage] = useState('')
  const [catalogSetNavItems, setCatalogSetNavItems] = useState([])
  const [catalogSetNavIndex, setCatalogSetNavIndex] = useState(-1)
  const [catalogTotalItemCount, setCatalogTotalItemCount] = useState(0)
  const [selectedCatalogItem, setSelectedCatalogItem] = useState(null)
  const [catalogRawItemRow, setCatalogRawItemRow] = useState(null)
  const [catalogDetailViewTab, setCatalogDetailViewTab] = useState('overview')
  const [catalogPricingSource, setCatalogPricingSource] = useState('combined')
  const [catalogItemImages, setCatalogItemImages] = useState([])
  const [lightbox, setLightbox] = useState(null)   // { images: [url], index } — full-size image overlay
  const [catalogDetailSubjects, setCatalogDetailSubjects] = useState([])
  const [catalogDetailTeams, setCatalogDetailTeams] = useState([])
  const [catalogDetailCardTypes, setCatalogDetailCardTypes] = useState([])
  const [catalogDetailLego, setCatalogDetailLego] = useState(null)
  const [isCatalogItemEditMode, setIsCatalogItemEditMode] = useState(false)
  const [catalogItemEditValues, setCatalogItemEditValues] = useState({})
  const [catalogItemEditLookups, setCatalogItemEditLookups] = useState({ subjects: [], sets: [], subsets: [], teams: [], printTypes: [], cardTypes: [], franchises: [], brands: [], subthemes: [], productLines: [], series: [] })
  const [catalogItemEditTeamIds, setCatalogItemEditTeamIds] = useState([])
  const [catalogItemEditCardTypeIds, setCatalogItemEditCardTypeIds] = useState([])
  const [catalogItemEditSubjectIds, setCatalogItemEditSubjectIds] = useState([])
  const [catalogItemEditSubjectSearch, setCatalogItemEditSubjectSearch] = useState('')
  const [catalogItemEditSubjectResults, setCatalogItemEditSubjectResults] = useState([])
  const [catalogItemEditSubjectIsSearching, setCatalogItemEditSubjectIsSearching] = useState(false)
  const [catalogMarketVariants, setCatalogMarketVariants] = useState([])
  const [catalogItemConditionId, setCatalogItemConditionId] = useState('')
  const [isSavingCatalogItem, setIsSavingCatalogItem] = useState(false)
  const [catalogItemEditError, setCatalogItemEditError] = useState('')
  const [catalogItemImagesReloadToken, setCatalogItemImagesReloadToken] = useState(0)
  // ── Images (admin-only) ──
  const [manageImagesCandidates, setManageImagesCandidates] = useState([])
  const [manageImagesJobs, setManageImagesJobs] = useState([])
  const [manageImagesBusy, setManageImagesBusy] = useState(false)
  const [manageImagesError, setManageImagesError] = useState('')
  const [manageImagesNotice, setManageImagesNotice] = useState('')
  const [manageImagesEditSourceId, setManageImagesEditSourceId] = useState(null)
  const [manageImagesSourceDraft, setManageImagesSourceDraft] = useState({ source_url: '', source_name: '', is_verified: false })
  const [manageImagesUrlDraft, setManageImagesUrlDraft] = useState({ image_url: '', source_url: '', source_name: '', asPrimary: false })
  // ── Image Queue (admin fast-path for imaging items with no images) ──
  const [imageQueueActive, setImageQueueActive] = useState(false)
  const [imageQueueItems, setImageQueueItems] = useState([])   // normalized item objects, snapshot at launch
  const [imageQueuePos, setImageQueuePos] = useState(0)
  const [imageQueueLoading, setImageQueueLoading] = useState(false)
  const [imageQueueCount, setImageQueueCount] = useState(null) // badge: # of zero-image items
  const [bulkImportMode, setBulkImportMode] = useState(false)
  const [bulkImportRows, setBulkImportRows] = useState([])
  const [bulkImportSheetSummary, setBulkImportSheetSummary] = useState(null) // multi-sheet workbook report
  const [bulkImportIdx, setBulkImportIdx] = useState(0)
  const [bulkImportSubjectSearch, setBulkImportSubjectSearch] = useState('')
  const [bulkImportSubjectResults, setBulkImportSubjectResults] = useState([])
  const [bulkImportTeamSearch, setBulkImportTeamSearch] = useState('')
  const [bulkImportSpeciesList, setBulkImportSpeciesList] = useState([])
  const [bulkImportIsSaving, setBulkImportIsSaving] = useState(false)
  const [bulkImportSaveError, setBulkImportSaveError] = useState('')
  const [bulkImportSaveProgress, setBulkImportSaveProgress] = useState(0)
  const [bulkImportNewPrintTypeName, setBulkImportNewPrintTypeName] = useState('')
  const [bulkImportCreatingPrintType, setBulkImportCreatingPrintType] = useState(false)
  const [bulkPhotoMode, setBulkPhotoMode] = useState(false)
  const [bulkPhotoPosition, setBulkPhotoPosition] = useState(0)
  const [bulkPhotoRows, setBulkPhotoRows] = useState([])
  const [bulkPhotoIdx, setBulkPhotoIdx] = useState(0)
  const [bulkPhotoIsSaving, setBulkPhotoIsSaving] = useState(false)
  const [bulkPhotoSaveError, setBulkPhotoSaveError] = useState('')
  const [bulkPhotoSaveProgress, setBulkPhotoSaveProgress] = useState(0)
  const [bulkPhotoPhase, setBulkPhotoPhase] = useState(null)
  const [bulkPhotoPrintTypeId, setBulkPhotoPrintTypeId] = useState('')
  const [profileStats, setProfileStats] = useState(null)
  const [profileRecentItems, setProfileRecentItems] = useState([])
  const [profileMostValuable, setProfileMostValuable] = useState([])
  const [catalogItemOrigin, setCatalogItemOrigin] = useState('catalog')
  const [quickAddMode, setQuickAddMode] = useState('')
  const [quickAddPrice, setQuickAddPrice] = useState('')
  const [profileFriends, setProfileFriends] = useState([])
  const [profileFriendRequests, setProfileFriendRequests] = useState([])
  const [profileSentToIds, setProfileSentToIds] = useState(new Set())
  const [friendSearchQuery, setFriendSearchQuery] = useState('')
  const [friendSearchResults, setFriendSearchResults] = useState([])
  const [friendSearchLoading, setFriendSearchLoading] = useState(false)
  const [isFriendSearchOpen, setIsFriendSearchOpen] = useState(false)
  const [profileIsLoading, setProfileIsLoading] = useState(false)
  const [bulkPhotoAnalyzing, setBulkPhotoAnalyzing] = useState(false)
  const [bulkPhotoAnalyzeProgress, setBulkPhotoAnalyzeProgress] = useState({ done: 0, total: 0 })
  const [bulkPhotoSubsetItems, setBulkPhotoSubsetItems] = useState([])
  const [bulkPhotoManualSearch, setBulkPhotoManualSearch] = useState('')
  const [bulkPhotoManualResults, setBulkPhotoManualResults] = useState([])
  const [isUploadingCatalogItemImage, setIsUploadingCatalogItemImage] = useState(false)
  const [catalogDetailIsGraded, setCatalogDetailIsGraded] = useState(false)
  const [catalogDetailGradingCompany, setCatalogDetailGradingCompany] = useState('')
  const [catalogDetailSelectedGrade, setCatalogDetailSelectedGrade] = useState('')
  const [catalogDetailSelectedCondition, setCatalogDetailSelectedCondition] = useState('')
  // LEGO condition sub-fields (sealed box grade, completeness %, orthogonal flags).
  // Stored on the owned copy under metadata.lego.
  const [catalogDetailLegoCond, setCatalogDetailLegoCond] = useState({})
  // Minifigs connected to the currently-viewed set (via set_minifigs).
  const [catalogDetailSetMinifigs, setCatalogDetailSetMinifigs] = useState([])
  // Universal Related Items (catalog_item_relationships). Includes = children this
  // item contains; IncludedIn = parents that contain this item (derived, not stored).
  const [catalogDetailIncludes, setCatalogDetailIncludes] = useState([])
  const [catalogDetailIncludedIn, setCatalogDetailIncludedIn] = useState([])
  // Admin relationship editor (Related Items tab).
  const [relAddMode, setRelAddMode] = useState(null) // 'child' | 'parent' | null
  const [relSearch, setRelSearch] = useState('')
  const [relSearchResults, setRelSearchResults] = useState([])
  const [relBusy, setRelBusy] = useState(false)
  const [relError, setRelError] = useState('')
  const [relAddQty, setRelAddQty] = useState('1')
  // Admin set↔minifig link editor.
  const [linkSearch, setLinkSearch] = useState('')
  const [linkResults, setLinkResults] = useState([])
  const [linkQty, setLinkQty] = useState('1')
  const [isSavingLink, setIsSavingLink] = useState(false)
  // Sets that include the currently-viewed minifig (via set_minifigs).
  const [catalogDetailParentSets, setCatalogDetailParentSets] = useState([])
  // Per-minifig "included?" state for the add-to-collection modal (item_id → bool).
  const [collectionMinifigInclusion, setCollectionMinifigInclusion] = useState({})
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
  const [wishlistItemIds, setWishlistItemIds] = useState(new Set())
  const [wishlistItems, setWishlistItems] = useState([])
  const [isWishlistLoading, setIsWishlistLoading] = useState(false)
  const [wishlistLoadError, setWishlistLoadError] = useState('')
  const [wishlistSearchQuery, setWishlistSearchQuery] = useState('')
  const [wishlistPage, setWishlistPage] = useState(1)
  const [wishlistReloadToken, setWishlistReloadToken] = useState(0)
  const [wishlistRemoveConfirmId, setWishlistRemoveConfirmId] = useState('')
  const [wishlistViewTab, setWishlistViewTab] = useState('overview')
  const [wishlistCategoryFilter, setWishlistCategoryFilter] = useState('all')
  const [catalogListStats, setCatalogListStats] = useState({})
  const [catalogItemNumbers, setCatalogItemNumbers] = useState({}) // item_id → set number / minifig code
  const [catalogThemeStats, setCatalogThemeStats] = useState(null)
  const [catalogListPricing, setCatalogListPricing] = useState({})
  const [catalogDetailStats, setCatalogDetailStats] = useState(null)
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
  const [collectionOverviewPageInput, setCollectionOverviewPageInput] = useState('1')
  const [selectedCollectionItemDetailsId, setSelectedCollectionItemDetailsId] = useState('')
  const [selectedCollectionCopyIndex, setSelectedCollectionCopyIndex] = useState(0)
  const [collectionCopySalePriceInput, setCollectionCopySalePriceInput] = useState('')
  const [isSavingCopyCondition, setIsSavingCopyCondition] = useState(false)
  // Sell flow: connected minifigs the user owns for the set copy being listed.
  const [sellConnectedMinifigs, setSellConnectedMinifigs] = useState([])
  const [sellMinifigInclusion, setSellMinifigInclusion] = useState({})
  const [collectionItemDetailActionError, setCollectionItemDetailActionError] = useState('')
  const [collectionItemDetailActionMessage, setCollectionItemDetailActionMessage] = useState('')
  const [removeConfirmItemId, setRemoveConfirmItemId] = useState('')
  const [isUploadingCollectionCopyImage, setIsUploadingCollectionCopyImage] = useState(false)
  const [isListingCollectionCopyForSale, setIsListingCollectionCopyForSale] = useState(false)
  const [collectibleSets, setCollectibleSets] = useState([])
  const [collectibleSetEntries, setCollectibleSetEntries] = useState([])
  const [selectedCompletionSetId, setSelectedCompletionSetId] = useState('')
  const [completionNavSubset, setCompletionNavSubset] = useState('')
  const [completionSetAllItems, setCompletionSetAllItems] = useState([])
  // LEGO completion: every LEGO set (item, brand "Sets") + its minifigs (set_minifigs).
  const [completionLegoSets, setCompletionLegoSets] = useState([])
  const [completionSheetPopup, setCompletionSheetPopup] = useState(null)
  const [completionNavCategory, setCompletionNavCategory] = useState('')
  const [completionNavSubcategory, setCompletionNavSubcategory] = useState('')
  const [completionNavFranchise, setCompletionNavFranchise] = useState('')
  const [completionNavBrand, setCompletionNavBrand] = useState('')
  // LEGO faceted drill below the item type: Subtheme (subset) → Product Line.
  const [completionNavSubtheme, setCompletionNavSubtheme] = useState('')
  const [completionNavProductLine, setCompletionNavProductLine] = useState('')
  const [trackedCollectionGoals, setTrackedCollectionGoals] = useState([])
  const [goalReloadToken, setGoalReloadToken] = useState(0)
  const [activeCollectionFilter, setActiveCollectionFilter] = useState('all')
  const [activeStorageFilter, setActiveStorageFilter] = useState('')
  const [collectionSearchQuery, setCollectionSearchQuery] = useState('')
  // Collection findability: schema-based filters + sort.
  const [collectionFilterSubtheme, setCollectionFilterSubtheme] = useState('')
  const [collectionFilterFaction, setCollectionFilterFaction] = useState('')
  const [collectionFilterSpecies, setCollectionFilterSpecies] = useState('')
  const [collectionFilterCondition, setCollectionFilterCondition] = useState('')
  const [collectionSortKey, setCollectionSortKey] = useState('recent')
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
  const [catalogAdminItemDescription, setCatalogAdminItemDescription] = useState('')
  const [catalogAdminCardNumber, setCatalogAdminCardNumber] = useState('')
  const [catalogAdminPrintCount, setCatalogAdminPrintCount] = useState('')
  const [catalogAdminRealFranchiseId, setCatalogAdminRealFranchiseId] = useState('')
  const [catalogAdminSubjectIds, setCatalogAdminSubjectIds] = useState([])
  const [catalogAdminSubjectSearch, setCatalogAdminSubjectSearch] = useState('')
  const [catalogAdminSubjectResults, setCatalogAdminSubjectResults] = useState([])
  const [catalogAdminSubjectIsSearching, setCatalogAdminSubjectIsSearching] = useState(false)
  const [catalogAdminTeamIds, setCatalogAdminTeamIds] = useState([])
  const [catalogAdminPrintTypeId, setCatalogAdminPrintTypeId] = useState('')
  const [catalogAdminCardTypeIds, setCatalogAdminCardTypeIds] = useState([])
  const [catalogAdminSubsetId, setCatalogAdminSubsetId] = useState('')
  const [catalogAdminRealFranchises, setCatalogAdminRealFranchises] = useState([])
  const [catalogAdminSubjects, setCatalogAdminSubjects] = useState([])
  const [catalogAdminTeams, setCatalogAdminTeams] = useState([])
  const [catalogAdminPrintTypes, setCatalogAdminPrintTypes] = useState([])
  const [catalogAdminCardTypes, setCatalogAdminCardTypes] = useState([])
  const [catalogMtgCardTypes, setCatalogMtgCardTypes] = useState([])
  const [catalogRarities, setCatalogRarities] = useState([])
  const [catalogRarityId, setCatalogRarityId] = useState('')
  const [catalogAdminMtgCardTypeId, setCatalogAdminMtgCardTypeId] = useState('')
  const [catalogAdminRarityId, setCatalogAdminRarityId] = useState('')
  const [catalogItemEditMtgCardTypeId, setCatalogItemEditMtgCardTypeId] = useState('')
  const [catalogItemEditRarityId, setCatalogItemEditRarityId] = useState('')
  const [catalogDetailMtgCardTypeId, setCatalogDetailMtgCardTypeId] = useState('')
  const [catalogDetailRarityId, setCatalogDetailRarityId] = useState('')
  const [catalogAdminSpecies, setCatalogAdminSpecies] = useState([])
  const [catalogAdminSubsets, setCatalogAdminSubsets] = useState([])
  const [catalogAdminBricklinkId, setCatalogAdminBricklinkId] = useState('')
  const [catalogAdminRebrickableId, setCatalogAdminRebrickableId] = useState('')
  const [catalogAdminReleaseYear, setCatalogAdminReleaseYear] = useState('')
  const [catalogAdminUpc, setCatalogAdminUpc] = useState('')
  const [catalogAdminPieceCount, setCatalogAdminPieceCount] = useState('')
  const [catalogAdminLegoSetNumber, setCatalogAdminLegoSetNumber] = useState('')
  const [catalogAdminRetailPrice, setCatalogAdminRetailPrice] = useState('')
  // Faceted classification (LEGO): Subtheme (subset) → Product Line (multi); Packaging.
  const [catalogAdminSubsetSel, setCatalogAdminSubsetSel] = useState('')
  const [catalogAdminSubsetsList, setCatalogAdminSubsetsList] = useState([])
  const [catalogAdminProductLineIds, setCatalogAdminProductLineIds] = useState([])
  const [catalogAdminProductLinesList, setCatalogAdminProductLinesList] = useState([])
  const [catalogAdminPackagingId, setCatalogAdminPackagingId] = useState('')
  const [catalogAdminPackagingList, setCatalogAdminPackagingList] = useState([])
  // Series (facet) — branded manufacturer/publisher grouping, scoped to Subcategory.
  const [catalogAdminSeriesId, setCatalogAdminSeriesId] = useState('')
  const [catalogAdminSeriesList, setCatalogAdminSeriesList] = useState([])
  const [catalogAdminDynamicFields, setCatalogAdminDynamicFields] = useState({})
  const [catalogAdminVariants, setCatalogAdminVariants] = useState([buildCatalogVariantRow()])
  const [catalogAdminFrontImageFile, setCatalogAdminFrontImageFile] = useState(null)
  const [catalogAdminBackImageFile, setCatalogAdminBackImageFile] = useState(null)
  const [catalogAdminBrands, setCatalogAdminBrands] = useState([])
  const [catalogAdminBrandId, setCatalogAdminBrandId] = useState('')
  const [legoPropertyRegistry, setLegoPropertyRegistry] = useState([])
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
  const [catalogAdminInlineCreate, setCatalogAdminInlineCreate] = useState({ field: '', value: '', subjectType: 'player', speciesId: '', error: '' })
  const [isSavingCatalogAdminInline, setIsSavingCatalogAdminInline] = useState(false)
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
  const catalogLookupRef = useRef({ subjectMap: {}, setMap: {}, printTypeMap: {} })
  const completionDetailRef = useRef(null)
  const catalogEditInitialRef = useRef(false)
  const catalogLastFranchiseRef = useRef('')
  const catalogLastSetIdRef = useRef('')
  const catalogLastSubsetIdRef = useRef('')

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
  const hasCollectorPlusAccess = isCollectorPlusMember || isPlatformAdmin
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
  const catalogSetById = catalogSets.reduce((lookup, setRecord) => {
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
  const catalogCategoryOptions = catalogCategories
    .filter((category) => catalogCategoryIdsWithItems.includes(category.id))
    .map((category) => category.name)
  const selectedCatalogCategoryRecord =
    catalogCategory === 'all' ? null : catalogCategories.find((category) => category.name === catalogCategory) || null
  const catalogSubcategoryOptions = catalogSubcategories
    .filter((subcategory) => {
      if (!selectedCatalogCategoryRecord) {
        return false
      }
      return subcategory.category_id === selectedCatalogCategoryRecord.id
        && catalogSubcategoryIdsWithItems.includes(subcategory.id)
    })
    .map((subcategory) => subcategory.name)
  const selectedCatalogSubcategoryRecord =
    !catalogSubcategory || !selectedCatalogCategoryRecord
      ? null
      : catalogSubcategories.find(
          (subcategory) =>
            subcategory.name === catalogSubcategory && subcategory.category_id === selectedCatalogCategoryRecord.id,
        ) || null
  const catalogFranchiseOptions = [...catalogFranchiseBrands]
    .sort((left, right) => left.name.localeCompare(right.name))
  const selectedCatalogFranchiseRecord =
    catalogFranchise === 'all'
      ? null
      : catalogFranchiseBrands.find((franchiseBrand) => franchiseBrand.id === catalogFranchise)
        || catalogFranchiseBrands.find((franchiseBrand) => franchiseBrand.name === catalogFranchise)
        || null
  const filteredCatalogItems = catalogItems
  const catalogTotalPages = Math.max(1, Math.ceil(catalogTotalItemCount / CATALOG_PAGE_SIZE))
  const paginatedCatalogItems = catalogItems
  const paginatedCatalogItemIds = paginatedCatalogItems.map((item) => item.id).filter(Boolean)
  const selectedCatalogVisibleCount = paginatedCatalogItemIds.filter((itemId) => catalogBulkSelectedIds.has(itemId)).length
  const allVisibleCatalogItemsSelected = paginatedCatalogItemIds.length > 0 && selectedCatalogVisibleCount === paginatedCatalogItemIds.length
  const selectedCatalogBulkItems = catalogItems.filter((item) => catalogBulkSelectedIds.has(item.id))
  const selectedCatalogBulkFranchiseIds = [...new Set(selectedCatalogBulkItems.map((item) => item.franchise_id).filter(Boolean))]
  const selectedCatalogBulkFranchiseId = selectedCatalogBulkFranchiseIds.length === 1 ? selectedCatalogBulkFranchiseIds[0] : ''
  const catalogSearchText = siteSearchQuery.trim()
  const catalogSidebarLabels = getCategoryLabels(catalogCategory === 'all' ? '' : catalogCategory)
  const catalogActiveContextRows = [
    catalogSearchText ? { label: 'Search', value: catalogSearchText } : null,
    selectedCatalogCategoryRecord ? { label: 'Category', value: selectedCatalogCategoryRecord.name } : null,
    selectedCatalogSubcategoryRecord ? { label: 'Subcategory', value: selectedCatalogSubcategoryRecord.name } : null,
    selectedCatalogFranchiseRecord ? { label: 'Franchise', value: selectedCatalogFranchiseRecord.name } : null,
    catalogBrandId ? { label: 'Brand', value: catalogBrandById[catalogBrandId] || 'Selected brand' } : null,
    catalogTeamId ? { label: 'Team', value: catalogTeams.find((team) => team.id === catalogTeamId)?.name || 'Selected team' } : null,
    catalogSetId ? { label: 'Collectible Set', value: catalogSets.find((setRow) => setRow.id === catalogSetId)?.name || 'Selected set' } : null,
    catalogSubsetId ? { label: 'Subcollectible Set', value: catalogSubsets.find((subset) => subset.id === catalogSubsetId)?.name || 'Selected subset' } : null,
    catalogSubthemeId ? { label: catalogSidebarLabels.subset, value: catalogSubthemeOptions.find((s) => s.id === catalogSubthemeId)?.name || 'Selected subtheme' } : null,
    catalogProductLineId ? { label: catalogSidebarLabels.productLine, value: catalogProductLineOptions.find((p) => p.id === catalogProductLineId)?.name || 'Selected product line' } : null,
    catalogPrintTypeId ? {
      label: 'Print Type',
      value: catalogPrintTypeId === '__none__'
        ? 'No print type'
        : (catalogPrintTypes.find((printType) => printType.id === catalogPrintTypeId)?.name || 'Selected print type'),
    } : null,
    catalogSubjectId ? { label: catalogSidebarLabels.subject, value: catalogSubjectSearch || 'Selected subject' } : null,
    catalogMinYear ? { label: 'Min Year', value: catalogMinYear } : null,
    catalogMaxYear ? { label: 'Max Year', value: catalogMaxYear } : null,
  ].filter(Boolean)
  const hasCatalogActiveContext = catalogActiveContextRows.length > 0
  const catalogContextThemeText = (() => {
    const rawDescription = (selectedCatalogFranchiseRecord?.description || '').trim()
    if (rawDescription) {
      const firstSentence = rawDescription.split(/(?<=[.!?])\s+/)[0] || rawDescription
      return firstSentence.length > 220 ? `${firstSentence.slice(0, 217)}...` : firstSentence
    }

    const scopeName =
      selectedCatalogFranchiseRecord?.name ||
      selectedCatalogSubcategoryRecord?.name ||
      selectedCatalogCategoryRecord?.name ||
      ''
    if (!scopeName) return ''
    return `This catalog view is focused on ${scopeName}.`
  })()
  const catalogThemeImageUrl = (() => {
    const logo = selectedCatalogFranchiseRecord?.logo_url
    if (logo) return logo
    const p = catalogThemeStats?.image_path
    if (!p) return ''
    return p.startsWith('http') ? p : supabase.storage.from('item-images').getPublicUrl(p).data?.publicUrl
  })()
  const catalogThemeShortDesc = (() => {
    const raw = (selectedCatalogFranchiseRecord?.description || '').trim()
    if (!raw) return ''
    return raw.length > 240 ? `${raw.slice(0, 237)}...` : raw
  })()
  const themeStatName = (obj) => (obj && obj.name)
    ? (obj.count != null ? `${obj.name} (${obj.count})` : obj.name)
    : '—'
  const themeStatPct = (v) => (v != null && v !== '') ? `${v}%` : '—'
  const selectedCatalogItemMetadata =
    selectedCatalogItem?.metadata && typeof selectedCatalogItem.metadata === 'object' ? selectedCatalogItem.metadata : {}
  const selectedCatalogItemCategoryLabels = getCategoryLabels(
    selectedCatalogItem?._details?.category ||
    catalogCategories.find(c => c.id === selectedCatalogItem?.category_id)?.name ||
    ''
  )
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
  // LEGO condition context: a Building Blocks item is either a set or a minifig.
  const isLegoConditionCategory = (selectedCatalogItem?.categoryName || '') === 'Building Blocks'
  const isLegoMinifig = isLegoConditionCategory && (
    ['Minifigs', 'Minifigures'].includes(selectedCatalogItem?._details?.brand || '') ||
    (!!catalogDetailLego?.rebrickable_fig_id && !catalogDetailLego?.lego_set_number)
  )
  const isLegoSet = isLegoConditionCategory && !isLegoMinifig
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
      : isLegoSet
        ? LEGO_SET_CONDITION_SCALE
        : isLegoMinifig
          ? LEGO_MINIFIG_CONDITION_SCALE
          : catalogMarketVariants.map(v => v.name)
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
  const catalogDetailReviews = (
    Array.isArray(selectedCatalogItemMetadata.reviews)
      ? selectedCatalogItemMetadata.reviews
      : Array.isArray(selectedCatalogItemMetadata.review_list)
        ? selectedCatalogItemMetadata.review_list
        : []
  )
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry, index) => {
      const ratingCandidate = Number(
        entry.rating ??
        entry.score ??
        entry.stars ??
        entry.review_rating ??
        NaN,
      )
      const normalizedRating = Number.isFinite(ratingCandidate)
        ? Math.max(1, Math.min(5, ratingCandidate))
        : null
      const reviewDateRaw =
        entry.created_at ||
        entry.createdAt ||
        entry.reviewed_at ||
        entry.reviewedAt ||
        entry.date ||
        ''
      const reviewDate = reviewDateRaw ? new Date(reviewDateRaw) : null
      const reviewDateLabel = reviewDate && !Number.isNaN(reviewDate.getTime())
        ? reviewDate.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
        : ''

      return {
        id: entry.id || entry.review_id || entry.reviewId || `review-${index}`,
        author:
          entry.author ||
          entry.author_name ||
          entry.authorName ||
          entry.user_name ||
          entry.username ||
          'Collector',
        title: entry.title || entry.headline || entry.summary || '',
        body: entry.body || entry.comment || entry.review || entry.text || '',
        rating: normalizedRating,
        dateLabel: reviewDateLabel,
      }
    })
  const catalogDetailAverageRating = catalogDetailReviews.length > 0
    ? catalogDetailReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / catalogDetailReviews.length
    : null
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
  const selectedCatalogAdminSubcategoryObj = catalogAdminSubcategories.find(s => s.id === catalogAdminSubcategoryId)
  const catalogAdminIsMtg = selectedCatalogAdminSubcategoryObj?.name === 'Magic: The Gathering'
  const catalogItemIsMtg = selectedCatalogItem?.subcategoryName === 'Magic: The Gathering' || selectedCatalogItem?._details?.subcategory === 'Magic: The Gathering'
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

      if (typeParam === 'email_change' && tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          type: 'email_change',
          token_hash: tokenHash,
        })

        if (error) {
          setAuthError(error.message || 'Email confirmation link is invalid or expired.')
          return true
        }

        if (!isMounted) {
          return true
        }

        clearRecoveryParamsFromUrl()
        setAuthMessage('Email address confirmed successfully.')
        return true
      }

      if (typeParam === 'signup' && tokenHash) {
        const { data, error } = await supabase.auth.verifyOtp({
          type: 'signup',
          token_hash: tokenHash,
        })

        if (error) {
          setAuthError(error.message || 'Email confirmation link is invalid or expired.')
          return true
        }

        if (!isMounted) {
          return true
        }

        setCurrentUser(data?.user || data?.session?.user || null)
        clearRecoveryParamsFromUrl()
        setAuthMessage('Email confirmed. You are now signed in.')
        return true
      }

      if (code && typeParam && typeParam !== 'recovery') {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          setAuthError(error.message || 'Confirmation link is invalid or expired.')
          return true
        }

        if (!isMounted) {
          return true
        }

        setCurrentUser(data?.session?.user || null)
        clearRecoveryParamsFromUrl()
        setAuthMessage(
          typeParam === 'email_change'
            ? 'Email address updated successfully.'
            : 'Email confirmed. You are now signed in.'
        )
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
    try { sessionStorage.setItem('ch_screen', currentScreen) } catch (_) {}
    if (window.history.state?.screen !== currentScreen) {
      if (window.history.state == null) {
        // Replace the initial page-load entry so back button leaves the site, not a stateless entry
        window.history.replaceState({ screen: currentScreen }, '')
      } else {
        window.history.pushState({ screen: currentScreen }, '')
      }
    }
  }, [currentScreen])

  useEffect(() => {
    const onPop = (event) => {
      const screen = event.state?.screen
      if (!screen) return
      setCurrentScreen(screen === 'catalog_item' ? 'catalog' : screen)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Effect A: stable lookups — categories, subcategories, brands, card types
  useEffect(() => {
    if (currentScreen !== 'catalog' && currentScreen !== 'collection' && currentScreen !== 'collection_item') return
    Promise.all([
      supabase.from('categories').select('category_id, name').order('name'),
      supabase.from('subcategories').select('subcategory_id, name, category_id').order('name'),
      supabase.from('brands').select('brand_id, name').order('name'),
      supabase.from('card_types').select('card_type_id, name').order('name'),
      supabase.from('mtg_card_types').select('mtg_card_type_id, name').order('sort_order'),
      supabase.from('rarities').select('rarity_id, name').order('sort_order'),
    ]).then(([cats, subs, brands, cts, mtgTypes, rarityList]) => {
      if (cats.error) console.error('catalog categories load error:', cats.error)
      setCatalogCategories((cats.data || []).map(r => ({ id: r.category_id, name: r.name })))
      setCatalogSubcategories((subs.data || []).map(r => ({ id: r.subcategory_id, name: r.name, category_id: r.category_id })))
      setCatalogBrands((brands.data || []).map(r => ({ id: r.brand_id, name: r.name })))
      setCatalogAllCardTypes((cts.data || []).map(r => ({ id: r.card_type_id, name: r.name })))
      setCatalogMtgCardTypes((mtgTypes.data || []).map(r => ({ id: r.mtg_card_type_id, name: r.name })))
      setCatalogRarities((rarityList.data || []).map(r => ({ id: r.rarity_id, name: r.name })))
    })
  }, [currentScreen, catalogReloadToken])

  useEffect(() => {
    if (currentScreen !== 'catalog') return
    supabase
      .from('items')
      .select('category_id')
      .not('category_id', 'is', null)
      .limit(7000)
      .then(({ data }) => {
        setCatalogCategoryIdsWithItems([
          ...new Set((data || []).map((row) => row.category_id).filter(Boolean)),
        ])
      })
  }, [currentScreen, catalogReloadToken])

  useEffect(() => {
    if (currentScreen !== 'catalog') return
    const categoryId = selectedCatalogCategoryRecord?.id || ''
    if (!categoryId) {
      setCatalogSubcategoryIdsWithItems([])
      return
    }
    supabase
      .from('items')
      .select('subcategory_id')
      .eq('category_id', categoryId)
      .not('subcategory_id', 'is', null)
      .limit(7000)
      .then(({ data }) => {
        setCatalogSubcategoryIdsWithItems([
          ...new Set((data || []).map((row) => row.subcategory_id).filter(Boolean)),
        ])
      })
  }, [currentScreen, selectedCatalogCategoryRecord])

  // Effect B: global franchise options from actual items.
  useEffect(() => {
    if (currentScreen !== 'catalog') return
    const setCatalogFranchiseOptionsFromRows = (rows) => {
      const byName = new Map()
      for (const row of rows || []) {
        if (!row?.franchise_id || !row?.name) continue
        if (!byName.has(row.name)) {
          byName.set(row.name, {
            id: row.franchise_id,
            name: row.name,
            description: row.description || '',
            logo_url: row.logo_url || '',
          })
        }
      }
      setCatalogFranchiseBrands([...byName.values()])
    }
    const loadCatalogFranchiseOptions = (ids) => {
      supabase.from('franchises').select('franchise_id, name, description, logo_url').in('franchise_id', ids).order('name')
        .then(({ data, error }) => {
          if (!error) {
            setCatalogFranchiseOptionsFromRows(data)
            return
          }
          supabase.from('franchises').select('franchise_id, name').in('franchise_id', ids).order('name')
            .then(({ data: fallbackData }) => {
              setCatalogFranchiseOptionsFromRows(fallbackData)
            })
        })
    }
    supabase.from('items').select('franchise_id').not('franchise_id', 'is', null)
      .then(({ data: itemRows }) => {
        const ids = [...new Set((itemRows || []).map((row) => row.franchise_id).filter(Boolean))]
        if (!ids.length) { setCatalogFranchiseBrands([]); return }
        loadCatalogFranchiseOptions(ids)
      })
  }, [currentScreen, catalogReloadToken])

  // Effect C: team + set cascade from franchise (set also depends on brand)
  useEffect(() => {
    if (currentScreen !== 'catalog') return
    const franchiseId = selectedCatalogFranchiseRecord?.id || ''
    const franchiseChanged = franchiseId !== catalogLastFranchiseRef.current
    catalogLastFranchiseRef.current = franchiseId
    if (!franchiseId) {
      setCatalogTeams([])
      setCatalogSets([])
      setCatalogSubsets([])
      setCatalogPrintTypes([])
      setCatalogFranchiseLinkedBrands([])
      return
    }
    if (franchiseChanged) {
      setCatalogTeamId('')
      setCatalogSetId('')
      setCatalogSubsetId('')
      setCatalogPrintTypeId('')
      setCatalogBrandId('')
    }
    setCatalogTeams([])
    setCatalogSets([])

    ;(async () => {
      let teamItemsQuery = supabase
        .from('items')
        .select('item_id')
        .eq('franchise_id', franchiseId)
      if (selectedCatalogCategoryRecord?.id) {
        teamItemsQuery = teamItemsQuery.eq('category_id', selectedCatalogCategoryRecord.id)
      }
      if (selectedCatalogSubcategoryRecord?.id) {
        teamItemsQuery = teamItemsQuery.eq('subcategory_id', selectedCatalogSubcategoryRecord.id)
      }
      if (catalogBrandId) {
        teamItemsQuery = teamItemsQuery.eq('brand_id', catalogBrandId)
      }

      const { data: scopedItemRows } = await teamItemsQuery.limit(6000)
      const scopedItemIds = [...new Set((scopedItemRows || []).map((row) => row.item_id).filter(Boolean))]
      if (!scopedItemIds.length) {
        setCatalogTeams([])
      } else {
        const { data: itemTeamRows } = await supabase
          .from('item_teams')
          .select('team_id')
          .in('item_id', scopedItemIds)
          .limit(7000)
        const teamIds = [...new Set((itemTeamRows || []).map((row) => row.team_id).filter(Boolean))]
        if (!teamIds.length) {
          setCatalogTeams([])
        } else {
          const { data: teamRows } = await supabase
            .from('teams')
            .select('team_id, name')
            .in('team_id', teamIds)
            .order('name')
          setCatalogTeams((teamRows || []).map((row) => ({ id: row.team_id, name: row.name })))
        }
      }
    })()

    if (franchiseId) {
      let brandQuery = supabase
        .from('items')
        .select('brand_id')
        .eq('franchise_id', franchiseId)
        .not('brand_id', 'is', null)

      if (selectedCatalogCategoryRecord?.id) {
        brandQuery = brandQuery.eq('category_id', selectedCatalogCategoryRecord.id)
      }
      if (selectedCatalogSubcategoryRecord?.id) {
        brandQuery = brandQuery.eq('subcategory_id', selectedCatalogSubcategoryRecord.id)
      }

      brandQuery.then(({ data }) => {
        const ids = new Set((data || []).map((row) => row.brand_id).filter(Boolean))
        setCatalogFranchiseLinkedBrands(catalogBrands.filter((brand) => ids.has(brand.id)))
      })
    } else {
      const brandCatId = selectedCatalogCategoryRecord?.id || null
      const brandSubId = selectedCatalogSubcategoryRecord?.id || null
      if (brandCatId) {
        let bq = supabase.from('items').select('brand_id').not('brand_id', 'is', null).eq('category_id', brandCatId)
        if (brandSubId) {
          bq = bq.eq('subcategory_id', brandSubId)
        }
        bq.then(({ data }) => {
          const ids = new Set((data || []).map(r => r.brand_id))
          setCatalogFranchiseLinkedBrands(catalogBrands.filter(b => ids.has(b.id)))
        })
      } else {
        setCatalogFranchiseLinkedBrands([])
      }
    }

    let setItemsQuery = supabase
      .from('items')
      .select('collectible_set_id')
      .eq('franchise_id', franchiseId)
      .not('collectible_set_id', 'is', null)
    if (selectedCatalogCategoryRecord?.id) {
      setItemsQuery = setItemsQuery.eq('category_id', selectedCatalogCategoryRecord.id)
    }
    if (selectedCatalogSubcategoryRecord?.id) {
      setItemsQuery = setItemsQuery.eq('subcategory_id', selectedCatalogSubcategoryRecord.id)
    }
    if (catalogBrandId) {
      setItemsQuery = setItemsQuery.eq('brand_id', catalogBrandId)
    }

    setItemsQuery.limit(7000).then(async ({ data: setItemRows }) => {
      const setIds = [...new Set((setItemRows || []).map((row) => row.collectible_set_id).filter(Boolean))]
      if (!setIds.length) {
        setCatalogSets([])
        return
      }
      const { data: setRows } = await supabase
        .from('collectible_sets')
        .select('collectible_set_id, name')
        .in('collectible_set_id', setIds)
        .order('name')
      setCatalogSets((setRows || []).map((row) => ({ id: row.collectible_set_id, name: row.name })))
    })
  }, [currentScreen, selectedCatalogFranchiseRecord, selectedCatalogCategoryRecord, selectedCatalogSubcategoryRecord, catalogBrandId, catalogBrands])

  // Effect D: subcollectible set cascade from collectible set
  useEffect(() => {
    if (currentScreen !== 'catalog') return
    const setChanged = catalogSetId !== catalogLastSetIdRef.current
    catalogLastSetIdRef.current = catalogSetId
    if (!catalogSetId) {
      setCatalogSubsets([])
      if (setChanged) { setCatalogSubsetId(''); setCatalogPrintTypes([]); setCatalogPrintTypeId('') }
      return
    }
    if (setChanged) { setCatalogSubsetId(''); setCatalogPrintTypeId('') }
    supabase
      .from('items')
      .select('subcollectble_set_id')
      .eq('collectible_set_id', catalogSetId)
      .not('subcollectble_set_id', 'is', null)
      .limit(7000)
      .then(async ({ data: subsetItemRows }) => {
        const subsetIds = [...new Set((subsetItemRows || []).map((row) => row.subcollectble_set_id).filter(Boolean))]
        if (!subsetIds.length) {
          setCatalogSubsets([])
          return
        }
        const { data: subsetRows } = await supabase
          .from('subcollectible_sets')
          .select('subcollectble_set_id, name')
          .in('subcollectble_set_id', subsetIds)
          .order('name')
        setCatalogSubsets((subsetRows || []).map((row) => ({ id: row.subcollectble_set_id, name: row.name })))
      })
  }, [currentScreen, catalogSetId])

  // Effect E: print type cascade from subcollectible set
  useEffect(() => {
    if (currentScreen !== 'catalog') return
    const subsetChanged = catalogSubsetId !== catalogLastSubsetIdRef.current
    catalogLastSubsetIdRef.current = catalogSubsetId
    if (!catalogSubsetId) {
      setCatalogPrintTypes([])
      if (subsetChanged) setCatalogPrintTypeId('')
      return
    }
    if (subsetChanged) setCatalogPrintTypeId('')
    supabase
      .from('items')
      .select('print_type_id')
      .eq('subcollectble_set_id', catalogSubsetId)
      .not('print_type_id', 'is', null)
      .limit(7000)
      .then(async ({ data: printTypeItemRows }) => {
        const printTypeIds = [...new Set((printTypeItemRows || []).map((row) => row.print_type_id).filter(Boolean))]
        if (!printTypeIds.length) {
          setCatalogPrintTypes([])
          return
        }
        const { data: printTypeRows } = await supabase
          .from('print_types')
          .select('print_type_id, name')
          .in('print_type_id', printTypeIds)
          .order('name')
        setCatalogPrintTypes((printTypeRows || []).map((row) => ({ id: row.print_type_id, name: row.name })))
      })
  }, [currentScreen, catalogSubsetId])

  // Faceted filter: Subtheme options for the selected Theme (franchise). Only show
  // subthemes actually USED by items in this Theme — deriving from items.subset_id
  // rather than every subset tied to the franchise keeps empty / artefact subsets
  // (e.g. leftover "Key Chain" rows that are really Series) out of the filter.
  useEffect(() => {
    if (currentScreen !== 'catalog') return
    const franchiseId = selectedCatalogFranchiseRecord?.id || ''
    if (!franchiseId) { setCatalogSubthemeOptions([]); setCatalogSubthemeId(prev => prev ? '' : prev); return }
    let cancelled = false
    ;(async () => {
      const { data: itemRows } = await supabase
        .from('items').select('subset_id').eq('franchise_id', franchiseId).not('subset_id', 'is', null)
      const subsetIds = [...new Set((itemRows || []).map(r => r.subset_id))]
      let list = []
      if (subsetIds.length) {
        const { data } = await supabase.from('subsets').select('subset_id, name').in('subset_id', subsetIds).order('name')
        list = (data || []).map(r => ({ id: r.subset_id, name: r.name }))
      }
      if (cancelled) return
      setCatalogSubthemeOptions(list)
      setCatalogSubthemeId(prev => list.some(s => s.id === prev) ? prev : '')
    })()
    return () => { cancelled = true }
  }, [currentScreen, selectedCatalogFranchiseRecord?.id])

  // Faceted filter: Product Line options for the selected Theme (franchise) — the
  // "pick a Franchise first" flow. Product Line is subcategory-owned but franchise-
  // associated; show only lines actually used by items in the selected franchise.
  useEffect(() => {
    if (currentScreen !== 'catalog') return
    const franchiseId = selectedCatalogFranchiseRecord?.id || ''
    if (!franchiseId) { setCatalogProductLineOptions([]); setCatalogProductLineId(prev => prev ? '' : prev); return }
    let cancelled = false
    ;(async () => {
      const { data: itemRows } = await supabase.from('items').select('item_id').eq('franchise_id', franchiseId)
      const itemIds = (itemRows || []).map(r => r.item_id)
      let list = []
      if (itemIds.length) {
        const { data: iplRows } = await supabase.from('item_product_lines').select('product_line_id').in('item_id', itemIds)
        const plIds = [...new Set((iplRows || []).map(r => r.product_line_id))]
        if (plIds.length) {
          const { data } = await supabase.from('product_lines').select('product_line_id, name').in('product_line_id', plIds).order('name')
          list = (data || []).map(r => ({ id: r.product_line_id, name: r.name }))
        }
      }
      if (cancelled) return
      setCatalogProductLineOptions(list)
      setCatalogProductLineId(prev => list.some(p => p.id === prev) ? prev : '')
    })()
    return () => { cancelled = true }
  }, [currentScreen, selectedCatalogFranchiseRecord?.id])

  // Faceted filter: Series options. When a Theme (franchise) is selected, show only
  // the Series actually used by items in that Theme (series link to items, not
  // directly to franchises, so derive them from items.franchise_id → series_id).
  // Otherwise fall back to every Series for the selected Subcategory (manufacturer).
  useEffect(() => {
    if (currentScreen !== 'catalog') return
    const subcatId = selectedCatalogSubcategoryRecord?.id || ''
    const franchiseId = selectedCatalogFranchiseRecord?.id || ''
    if (!subcatId) { setCatalogSeriesOptions([]); setCatalogSeriesId(prev => prev ? '' : prev); return }
    let cancelled = false
    ;(async () => {
      let list = []
      if (franchiseId) {
        const { data: itemRows } = await supabase
          .from('items').select('series_id').eq('franchise_id', franchiseId).not('series_id', 'is', null)
        const seriesIds = [...new Set((itemRows || []).map(r => r.series_id))]
        if (seriesIds.length) {
          const { data } = await supabase.from('series').select('series_id, name').in('series_id', seriesIds).order('name')
          list = (data || []).map(r => ({ id: r.series_id, name: r.name }))
        }
      } else {
        const { data } = await supabase.from('series').select('series_id, name').eq('subcategory_id', subcatId).order('name')
        list = (data || []).map(r => ({ id: r.series_id, name: r.name }))
      }
      if (cancelled) return
      setCatalogSeriesOptions(list)
      setCatalogSeriesId(prev => list.some(s => s.id === prev) ? prev : '')
    })()
    return () => { cancelled = true }
  }, [currentScreen, selectedCatalogSubcategoryRecord?.id, selectedCatalogFranchiseRecord?.id])

  // Effect F: subject typeahead search (category-scoped when a category is selected)
  useEffect(() => {
    if (currentScreen !== 'catalog') return
    const q = catalogSubjectSearch.trim()
    if (catalogSubjectId || q.length < 2) { setCatalogSubjectResults([]); return }
    setCatalogSubjectSearching(true)
    const categoryId = selectedCatalogCategoryRecord?.id || null
    const timer = setTimeout(async () => {
      let rows = []
      if (categoryId) {
        // Two-step: get subject IDs in this category, then search by name
        const { data: itemRows } = await supabase
          .from('items').select('subject_id').eq('category_id', categoryId)
          .not('subject_id', 'is', null).limit(2000)
        const subjectIds = [...new Set((itemRows || []).map(r => r.subject_id))]
        if (!subjectIds.length) { setCatalogSubjectResults([]); setCatalogSubjectSearching(false); return }
        const { data } = await supabase.from('subjects').select('subject_id, subject_name')
          .in('subject_id', subjectIds).ilike('subject_name', `%${q}%`).order('subject_name').limit(50)
        rows = data || []
      } else {
        const { data } = await supabase.from('subjects').select('subject_id, subject_name')
          .ilike('subject_name', `%${q}%`).order('subject_name').limit(50)
        rows = data || []
      }
      const seen = new Set()
      const list = rows.filter(r => seen.has(r.subject_name.toLowerCase()) ? false : seen.add(r.subject_name.toLowerCase()))
        .map(r => ({ id: r.subject_id, name: r.subject_name }))
      // Auto-commit when the typed text exactly matches a subject, so typing a full
      // name applies the filter without needing to click the dropdown result.
      const exact = list.find(r => r.name.trim().toLowerCase() === q.toLowerCase())
      if (exact) {
        setCatalogSubjectId(exact.id)
        setCatalogSubjectSearch(exact.name)
        setCatalogSubjectResults([])
      } else {
        setCatalogSubjectResults(list)
      }
      setCatalogSubjectSearching(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [currentScreen, catalogSubjectSearch, catalogSubjectId, selectedCatalogCategoryRecord])

  useEffect(() => {
    if (!selectedCatalogFranchiseRecord?.name || catalogFranchise === 'all') return
    if (catalogFranchiseSearch !== selectedCatalogFranchiseRecord.name) {
      setCatalogFranchiseSearch(selectedCatalogFranchiseRecord.name)
    }
  }, [catalogFranchise, catalogFranchiseSearch, selectedCatalogFranchiseRecord])

  useEffect(() => {
    if (currentScreen !== 'catalog') return
    const franchiseId = selectedCatalogFranchiseRecord?.id || ''
    if (!franchiseId) {
      setCatalogPendingFranchiseSubcategory('')
      return
    }

    supabase
      .from('items')
      .select('category_id, subcategory_id')
      .eq('franchise_id', franchiseId)
      .then(({ data }) => {
        const rows = data || []
        const categoryIds = [...new Set(rows.map((row) => row.category_id).filter(Boolean))]
        const subcategoryIds = [...new Set(rows.map((row) => row.subcategory_id).filter(Boolean))]

        if (subcategoryIds.length === 1) {
          const subcategoryRecord = catalogSubcategories.find((subcategory) => subcategory.id === subcategoryIds[0])
          if (subcategoryRecord) {
            const categoryRecord = catalogCategories.find((category) => category.id === subcategoryRecord.category_id)
            if (categoryRecord?.name) {
              setCatalogCategory((prev) => (prev === categoryRecord.name ? prev : categoryRecord.name))
            }
            // Category options and validation settle first, then apply this subcategory.
            setCatalogPendingFranchiseSubcategory(subcategoryRecord.name)
          }
          return
        }

        setCatalogPendingFranchiseSubcategory('')
        // If this franchise spans multiple subcategories, avoid stale locked subcategory from a prior selection.
        setCatalogSubcategory('')

        if (categoryIds.length === 1) {
          const categoryRecord = catalogCategories.find((category) => category.id === categoryIds[0])
          if (categoryRecord?.name) {
            setCatalogCategory((prev) => (prev === categoryRecord.name ? prev : categoryRecord.name))
          }
        }
      })
  }, [currentScreen, selectedCatalogFranchiseRecord, catalogCategories, catalogSubcategories])

  useEffect(() => {
    if (!catalogPendingFranchiseSubcategory) return
    if (!catalogSubcategoryOptions.includes(catalogPendingFranchiseSubcategory)) return
    setCatalogSubcategory((prev) => (prev === catalogPendingFranchiseSubcategory ? prev : catalogPendingFranchiseSubcategory))
    setCatalogPendingFranchiseSubcategory('')
  }, [catalogPendingFranchiseSubcategory, catalogSubcategoryOptions])

  // Fetch Music franchise ID once so album typeahead can filter directly by franchise_id
  useEffect(() => {
    if (currentScreen !== 'catalog' || musicFranchiseId) return
    supabase.from('franchises').select('franchise_id').eq('name', 'Music').limit(1)
      .then(({ data }) => {
        const id = data?.[0]?.franchise_id
        if (!id) return
        setMusicFranchiseId(id)
        supabase.from('brand_franchise').select('brand_id').eq('franchise_id', id)
          .then(({ data: bf }) => setMusicBrandIds(new Set((bf || []).map(r => r.brand_id))))
      })
  }, [currentScreen, musicFranchiseId])

  // Effect G: album typeahead search (Music category only)
  useEffect(() => {
    if (currentScreen !== 'catalog' || catalogCategory !== 'Music') { setCatalogAlbumResults([]); return }
    const q = catalogAlbumSearch.trim()
    if (catalogSetId || q.length < 1) { setCatalogAlbumResults([]); return }
    if (!musicFranchiseId) return
    setCatalogAlbumSearching(true)
    const timer = setTimeout(() => {
      supabase.from('collectible_sets')
        .select('collectible_set_id, name')
        .eq('franchise_id', musicFranchiseId)
        .ilike('name', `%${q}%`)
        .order('name')
        .limit(15)
        .then(({ data }) => {
          setCatalogAlbumResults((data || []).map(r => ({ id: r.collectible_set_id, name: r.name })))
          setCatalogAlbumSearching(false)
        })
    }, 250)
    return () => clearTimeout(timer)
  }, [currentScreen, catalogCategory, catalogAlbumSearch, catalogSetId, musicFranchiseId])

  // Effect H: profile screen — load collection stats and recent items
  useEffect(() => {
    if (currentScreen !== 'profile' || !currentUser) return
    setProfileIsLoading(true)
    const uid = currentUser.id

    const loadProfileData = async () => {
      // 1. All owned copies (grading, value, count)
      const [allRes, recentRes, valuableRes] = await Promise.all([
        supabase.from('owned_copies')
          .select('catalog_item_id, purchase_price, grading_company, grade', { count: 'exact' })
          .eq('user_id', uid),
        supabase.from('owned_copies')
          .select('catalog_item_id, created_at')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(12),
        supabase.from('owned_copies')
          .select('catalog_item_id, purchase_price')
          .eq('user_id', uid)
          .not('purchase_price', 'is', null)
          .gt('purchase_price', 0)
          .order('purchase_price', { ascending: false })
          .limit(12),
      ])
      const allRows = allRes.data || []
      const totalItems = allRes.count ?? allRows.length
      const totalValue = allRows.reduce((s, r) => s + (Number(r.purchase_price) || 0), 0)
      const gradedCount = allRows.filter(r => r.grading_company).length
      const gemMintCount = allRows.filter(r => r.grade === '10' || (r.grade || '').toLowerCase().startsWith('gem')).length
      const uniqueItemIds = [...new Set(allRows.map(r => r.catalog_item_id))]

      // 2. Item details for all unique owned items (batched, for stats)
      let detailRows = []
      if (uniqueItemIds.length) {
        for (let i = 0; i < uniqueItemIds.length; i += 500) {
          const chunk = uniqueItemIds.slice(i, i + 500)
          const { data } = await supabase.from('item_details')
            .select('item_id, category_id, collectible_set_id, card_number, print_count')
            .in('item_id', chunk)
          detailRows.push(...(data || []))
        }
      }

      // Category breakdown
      const catCount = {}
      detailRows.forEach(r => { if (r.category_id) catCount[r.category_id] = (catCount[r.category_id] || 0) + 1 })
      const categoryBreakdown = Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 6)

      // Set depth: group by collectible_set_id → max count in any one set
      const setCountMap = {}
      detailRows.forEach(r => { if (r.collectible_set_id) setCountMap[r.collectible_set_id] = (setCountMap[r.collectible_set_id] || 0) + 1 })
      const setDepthValues = Object.values(setCountMap)
      const maxSetDepth = setDepthValues.length ? Math.max(...setDepthValues) : 0

      // Parallels: group by (set, card_number) → max variants of same position
      const posMap = {}
      detailRows.forEach(r => {
        if (!r.collectible_set_id || !r.card_number) return
        const key = `${r.collectible_set_id}::${r.card_number}`
        posMap[key] = (posMap[key] || 0) + 1
      })
      const posValues = Object.values(posMap)
      const maxParallels = posValues.length ? Math.max(...posValues) : 0

      // Serial-numbered (print_count on the catalog item)
      const numberedCount = detailRows.filter(r => r.print_count != null && r.print_count > 1).length
      const lowPopCount   = detailRows.filter(r => r.print_count != null && r.print_count <= 25).length
      const oneOfOneCount = detailRows.filter(r => r.print_count === 1).length

      // Set completion %: check top 5 sets by owned count against catalog total
      let maxSetPct = 0
      const topSets = Object.entries(setCountMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
      await Promise.all(topSets.map(async ([setId, ownedCount]) => {
        const { count: total } = await supabase.from('item_details')
          .select('item_id', { count: 'exact', head: true })
          .eq('collectible_set_id', setId)
        if (total > 0) {
          const pct = Math.min(100, Math.round((ownedCount / total) * 100))
          if (pct > maxSetPct) maxSetPct = pct
        }
      }))

      // Wishlist count
      const { count: wishlistCount } = await supabase.from('wishlist_items')
        .select('*', { count: 'exact', head: true }).eq('user_id', uid)

      // Rookie count: find Rookie card_type_ids then intersect with owned items
      let rookieCount = 0
      if (uniqueItemIds.length) {
        const { data: rookieTypes } = await supabase.from('card_types')
          .select('card_type_id').ilike('name', '%Rookie%')
        if (rookieTypes?.length) {
          const rtIds = rookieTypes.map(r => r.card_type_id)
          const rookieItemIds = new Set()
          for (let i = 0; i < uniqueItemIds.length; i += 500) {
            const chunk = uniqueItemIds.slice(i, i + 500)
            const { data: ict } = await supabase.from('item_card_types')
              .select('item_id').in('item_id', chunk).in('card_type_id', rtIds)
            ;(ict || []).forEach(r => rookieItemIds.add(r.item_id))
          }
          rookieCount = rookieItemIds.size
        }
      }

      // Recent + most valuable — fetch item_details for both in one pass
      const recentIds   = (recentRes.data || []).map(r => r.catalog_item_id)
      const valuableIds = (valuableRes.data || []).map(r => r.catalog_item_id)
      const allDisplayIds = [...new Set([...recentIds, ...valuableIds])]

      let recentDetails = []
      let valuableDetails = []
      if (allDisplayIds.length) {
        const { data: det } = await supabase.from('item_details')
          .select('item_id, subject, print_type, card_number, front_image_path, collectible_set, category_id, subcategory_id, collectible_set_id, brand_id, franchise_id, description, release_year')
          .in('item_id', allDisplayIds)
        const detById = Object.fromEntries((det || []).map(d => [d.item_id, d]))
        recentDetails = (recentRes.data || []).map(r => ({
          ...r, ...detById[r.catalog_item_id], item_id: r.catalog_item_id,
        }))
        valuableDetails = (valuableRes.data || []).map(r => ({
          ...r, ...detById[r.catalog_item_id], item_id: r.catalog_item_id,
        }))
      }

      setProfileStats({
        totalItems, totalValue, gradedCount, gemMintCount,
        uniqueItems: uniqueItemIds.length, categoryCount: categoryBreakdown.length, categoryBreakdown,
        maxSetDepth, maxParallels, numberedCount, lowPopCount, oneOfOneCount, maxSetPct,
        wishlistCount: wishlistCount || 0, rookieCount,
        fullRainbow: 0,
      })
      setProfileRecentItems(recentDetails)
      setProfileMostValuable(valuableDetails)

      // Friends
      const { data: myFriendships } = await supabase
        .from('friendships')
        .select('id, requester_id, addressee_id, status')
        .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`)
      if (myFriendships) {
        const accepted = myFriendships.filter(f => f.status === 'accepted')
        const incoming = myFriendships.filter(f => f.status === 'pending' && f.addressee_id === uid)
        const outgoing = new Set(myFriendships.filter(f => f.status === 'pending' && f.requester_id === uid).map(f => f.addressee_id))
        const friendIds = accepted.map(f => f.requester_id === uid ? f.addressee_id : f.requester_id)
        const allIds = [...new Set([...friendIds, ...incoming.map(f => f.requester_id)])]
        let profilesById = {}
        if (allIds.length) {
          const { data: fps } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', allIds)
          profilesById = Object.fromEntries((fps || []).map(p => [p.id, p]))
        }
        setProfileFriends(accepted.map(f => {
          const fid = f.requester_id === uid ? f.addressee_id : f.requester_id
          return { friendshipId: f.id, userId: fid, ...(profilesById[fid] || {}) }
        }))
        setProfileFriendRequests(incoming.map(f => ({ friendshipId: f.id, userId: f.requester_id, ...(profilesById[f.requester_id] || {}) })))
        setProfileSentToIds(outgoing)
      }

      setProfileIsLoading(false)
    }

    loadProfileData()
  }, [currentScreen, currentUser])

  useEffect(() => {
    const loadCatalogItems = async () => {
      if (currentScreen !== 'catalog') return

      setIsCatalogLoading(true)
      setCatalogLoadError('')

      const queryText = siteSearchQuery.trim()
      const queryStart = (catalogPage - 1) * CATALOG_PAGE_SIZE
      const queryEnd = queryStart + CATALOG_PAGE_SIZE - 1

      let itemsQuery = supabase
        .from('item_details')
        .select('*', { count: 'exact' })

      if (selectedCatalogCategoryRecord) {
        itemsQuery = itemsQuery.eq('category_id', selectedCatalogCategoryRecord.id)
      }
      if (selectedCatalogSubcategoryRecord) {
        itemsQuery = itemsQuery.eq('subcategory_id', selectedCatalogSubcategoryRecord.id)
      }
      if (selectedCatalogFranchiseRecord) {
        itemsQuery = itemsQuery.eq('franchise_id', selectedCatalogFranchiseRecord.id)
      }
      if (catalogBrandId) {
        itemsQuery = itemsQuery.eq('brand_id', catalogBrandId)
      }
      if (catalogSetId) {
        itemsQuery = itemsQuery.eq('collectible_set_id', catalogSetId)
      }
      if (catalogSubsetId) {
        itemsQuery = itemsQuery.eq('subcollectble_set_id', catalogSubsetId)
      }
      // Faceted: Subtheme (items.subset_id) — not exposed by item_details, so
      // pre-query matching item_ids and constrain the main query.
      if (catalogSubthemeId) {
        const { data: subRows } = await supabase.from('items').select('item_id').eq('subset_id', catalogSubthemeId)
        const subIds = (subRows || []).map(r => r.item_id)
        if (!subIds.length) { setCatalogItems([]); setCatalogTotalItemCount(0); setIsCatalogLoading(false); return }
        itemsQuery = itemsQuery.in('item_id', subIds)
      }
      // Faceted: Product Line (item_product_lines m2m).
      if (catalogProductLineId) {
        const { data: plRows } = await supabase.from('item_product_lines').select('item_id').eq('product_line_id', catalogProductLineId)
        const plIds = (plRows || []).map(r => r.item_id)
        if (!plIds.length) { setCatalogItems([]); setCatalogTotalItemCount(0); setIsCatalogLoading(false); return }
        itemsQuery = itemsQuery.in('item_id', plIds)
      }
      // Series facet (items.series_id) — not exposed by item_details, pre-query.
      if (catalogSeriesId) {
        const { data: seRows } = await supabase.from('items').select('item_id').eq('series_id', catalogSeriesId)
        const seIds = (seRows || []).map(r => r.item_id)
        if (!seIds.length) { setCatalogItems([]); setCatalogTotalItemCount(0); setIsCatalogLoading(false); return }
        itemsQuery = itemsQuery.in('item_id', seIds)
      }
      if (catalogPrintTypeId === '__none__') {
        itemsQuery = itemsQuery.is('print_type_id', null)
      } else if (catalogPrintTypeId) {
        itemsQuery = itemsQuery.eq('print_type_id', catalogPrintTypeId)
      }
      // M2M: subject — expand to all IDs with same name to handle duplicate subject rows
      if (catalogSubjectId) {
        const selectedName = catalogSubjectSearch.trim()
        let allSubjectIds = [catalogSubjectId]
        if (selectedName) {
          const { data: nameRows } = await supabase.from('subjects').select('subject_id').ilike('subject_name', selectedName)
          if (nameRows?.length) allSubjectIds = nameRows.map(r => r.subject_id)
        }
        const { data: subjectRows } = await supabase.from('item_subjects').select('item_id').in('subject_id', allSubjectIds)
        const subjectItemIds = (subjectRows || []).map(r => r.item_id)
        if (!subjectItemIds.length) {
          setCatalogItems([]); setCatalogTotalItemCount(0); setIsCatalogLoading(false); return
        }
        itemsQuery = itemsQuery.in('item_id', subjectItemIds)
      }
      // M2M: team — pre-query item_ids from item_teams
      if (catalogTeamId) {
        let teamRows = []
        let teamQueryError = null
        const teamFilterCandidates = [catalogTeamId]
        const numericTeamId = Number(catalogTeamId)
        if (!Number.isNaN(numericTeamId) && String(numericTeamId) === String(catalogTeamId)) {
          teamFilterCandidates.push(numericTeamId)
        }

        for (const candidate of teamFilterCandidates) {
          const { data, error } = await supabase
            .from('item_teams')
            .select('item_id')
            .eq('team_id', candidate)

          if (error) {
            teamQueryError = error
            continue
          }
          if ((data || []).length > 0) {
            teamRows = data
            teamQueryError = null
            break
          }
        }

        if (teamQueryError) {
          setCatalogLoadError(teamQueryError.message || 'Could not load team filter results.')
          setCatalogItems([])
          setCatalogTotalItemCount(0)
          setIsCatalogLoading(false)
          return
        }

        const teamItemIds = [...new Set((teamRows || []).map(r => r.item_id).filter(Boolean))]
        if (!teamItemIds.length) {
          setCatalogItems([]); setCatalogTotalItemCount(0); setIsCatalogLoading(false); return
        }
        itemsQuery = itemsQuery.in('item_id', teamItemIds)
      }
      // Card type filter — pre-query item_ids from item_card_types junction table
      if (catalogCardTypeIds.length > 0) {
        const { data: ctRows } = await supabase.from('item_card_types').select('item_id').in('card_type_id', catalogCardTypeIds)
        const ctItemIds = (ctRows || []).map(r => r.item_id)
        if (!ctItemIds.length) {
          setCatalogItems([]); setCatalogTotalItemCount(0); setIsCatalogLoading(false); return
        }
        itemsQuery = itemsQuery.in('item_id', ctItemIds)
      }
      // Rarity filter — pre-query item_ids from items table
      if (catalogRarityId) {
        const { data: rarityRows } = await supabase.from('items').select('item_id').eq('rarity_id', catalogRarityId)
        const rarityItemIds = (rarityRows || []).map(r => r.item_id)
        if (!rarityItemIds.length) {
          setCatalogItems([]); setCatalogTotalItemCount(0); setIsCatalogLoading(false); return
        }
        itemsQuery = itemsQuery.in('item_id', rarityItemIds)
      }
      if (queryText) {
        // Broad top-search. The item_details view is an expensive join, so an
        // ilike across its columns times out — instead match on cheap base tables
        // (subject names, set names, descriptions, and common code fields), collect item ids,
        // then filter the view by id (fast, index-backed).
        const escapedText = queryText.replace(/[%_]/g, '\\$&').replace(/[(),]/g, ' ')
        const like = `%${escapedText}%`
        const idSet = new Set()
        // 1. Subject names → item_subjects
        const { data: subjRows } = await supabase.from('subjects').select('subject_id').ilike('subject_name', like).limit(300)
        const subjIds = (subjRows || []).map(r => r.subject_id)
        if (subjIds.length) {
          const { data: isRows } = await supabase.from('item_subjects').select('item_id').in('subject_id', subjIds).limit(2000)
          for (const r of isRows || []) idSet.add(r.item_id)
        }
        // 2. Collectible-set (subtheme) names → items in those sets
        const { data: csRows } = await supabase.from('collectible_sets').select('collectible_set_id').ilike('name', like).limit(100)
        const csIds = (csRows || []).map(r => r.collectible_set_id)
        if (csIds.length) {
          const { data: itRows } = await supabase.from('items').select('item_id').in('collectible_set_id', csIds).limit(2000)
          for (const r of itRows || []) idSet.add(r.item_id)
        }
        // 3. Item description + code fields (set/minifig/searchable IDs)
        const { data: descRows } = await supabase
          .from('items')
          .select('item_id')
          .or(
            [
              `description.ilike.${like}`,
              `bricklink_id.ilike.${like}`,
              `lego_set_number.ilike.${like}`,
              `minifig_code.ilike.${like}`,
              `rebrickable_fig_id.ilike.${like}`,
              `upc.ilike.${like}`,
            ].join(',')
          )
          .limit(1000)
        for (const r of descRows || []) idSet.add(r.item_id)

        const ids = [...idSet]
        if (!ids.length) {
          setCatalogItems([]); setCatalogTotalItemCount(0); setIsCatalogLoading(false); return
        }
        // Cap the id list so the request URL stays within limits; broad terms show
        // the first slice (still paginated within it).
        itemsQuery = itemsQuery.in('item_id', ids.slice(0, 600))
      }
      if (catalogMinYear) {
        itemsQuery = itemsQuery.gte('release_year', parseInt(catalogMinYear, 10))
      }
      if (catalogMaxYear) {
        itemsQuery = itemsQuery.lte('release_year', parseInt(catalogMaxYear, 10))
      }

      if (catalogSortKey === 'newest_year') {
        itemsQuery = itemsQuery.order('release_year', { ascending: false, nullsFirst: false }).order('subject', { ascending: true })
      } else if (catalogSortKey === 'oldest_year') {
        itemsQuery = itemsQuery.order('release_year', { ascending: true, nullsFirst: false }).order('subject', { ascending: true })
      } else if (catalogSortKey === 'card_number_asc') {
        itemsQuery = itemsQuery.order('card_number_int', { ascending: true, nullsFirst: false })
      } else if (catalogSortKey === 'card_number_desc') {
        itemsQuery = itemsQuery.order('card_number_int', { ascending: false, nullsFirst: true })
      } else {
        itemsQuery = itemsQuery.order('subject', { ascending: true })
      }
      itemsQuery = itemsQuery.range(queryStart, queryEnd)

      let itemsResult
      try {
        itemsResult = await itemsQuery
      } catch (err) {
        setCatalogLoadError('Catalog query timed out or failed.')
        setCatalogItems([])
        setCatalogTotalItemCount(0)
        setIsCatalogLoading(false)
        return
      }

      if (itemsResult.error) {
        console.error('item_details query error:', itemsResult.error)
        setCatalogLoadError(itemsResult.error.message || 'Could not load catalog items.')
        setCatalogItems([])
        setCatalogTotalItemCount(0)
        setIsCatalogLoading(false)
        return
      }

      const na = (v) => (v && v !== 'N/A' ? v : '')
      const normalizeItem = (raw) => {
        const subjectName   = na(raw.subject)
        const setName       = na(raw.collectible_set)
        const printType     = na(raw.print_type)
        const franchiseName = na(raw.franchise)
        const brandName     = na(raw.brand)
        const cardNum       = raw.card_number && raw.card_number !== 'N/A' ? `#${raw.card_number}` : ''
        const nameParts     = [subjectName, printType, cardNum || null].filter(Boolean)
        return {
          id:                 raw.item_id,
          name:               nameParts.join(' — ') || raw.description || 'Unnamed Item',
          description:        raw.description || '',
          release_year:       raw.release_year,
          category_id:        raw.category_id,
          subcategory_id:     raw.subcategory_id,
          franchise_id:       raw.franchise_id,
          collectible_set_id: raw.collectible_set_id,
          brand_id:           raw.brand_id,
          card_number:        raw.card_number !== 'N/A' ? raw.card_number : null,
          print_count:        raw.print_count,
          metadata:           {},
          dynamic_fields:     {},
          _subject_name:      subjectName,
          _set_name:          setName,
          _print_type:        printType,
          _brand_name:        brandName,
          _franchise_name:    franchiseName,
          _details:           raw,
          front_image_path:   raw.front_image_path || null,
        }
      }
      setCatalogItems((itemsResult.data || []).map(normalizeItem))
      setCatalogTotalItemCount(Number(itemsResult.count) || 0)
      setIsCatalogLoading(false)
    }

    loadCatalogItems()
  }, [
    catalogBrandId,
    catalogCardTypeIds,
    catalogCategory,
    catalogFranchise,
    catalogMaxYear,
    catalogMinYear,
    catalogPage,
    catalogPrintTypeId,
    catalogReloadToken,
    catalogSetId,
    catalogSortKey,
    catalogSubcategory,
    catalogSubjectId,
    catalogSubsetId,
    catalogSubthemeId,
    catalogProductLineId,
    catalogSeriesId,
    catalogTeamId,
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
      setCatalogFranchiseSearch('')
      return
    }
    if (catalogSubcategory && !catalogSubcategoryOptions.includes(catalogSubcategory)) {
      setCatalogSubcategory('')
      return
    }
    if (catalogFranchise !== 'all' && !catalogFranchiseOptions.some((franchise) => franchise.id === catalogFranchise || franchise.name === catalogFranchise)) {
      setCatalogFranchise('all')
      setCatalogFranchiseSearch('')
    }
    if (catalogBrandId && !catalogFranchiseLinkedBrands.some((brand) => brand.id === catalogBrandId)) {
      setCatalogBrandId('')
    }
    if (catalogTeamId && !catalogTeams.some((team) => team.id === catalogTeamId)) {
      setCatalogTeamId('')
    }
    if (catalogSetId && !catalogSets.some((setRow) => setRow.id === catalogSetId)) {
      setCatalogSetId('')
    }
    if (catalogSubsetId && !catalogSubsets.some((subset) => subset.id === catalogSubsetId)) {
      setCatalogSubsetId('')
    }
    if (catalogPrintTypeId && catalogPrintTypeId !== '__none__' && !catalogPrintTypes.some((printType) => printType.id === catalogPrintTypeId)) {
      setCatalogPrintTypeId('')
    }
    if (catalogCardTypeIds.length > 0 && !CARD_CONDITION_CATEGORIES.has(catalogCategory)) {
      setCatalogCardTypeIds([])
    }
    if (catalogRarityId && catalogSubcategory !== 'Magic: The Gathering') {
      setCatalogRarityId('')
    }
  }, [
    catalogBrandId,
    catalogCardTypeIds,
    catalogCategory,
    catalogCategoryOptions,
    catalogFranchise,
    catalogFranchiseSearch,
    catalogFranchiseLinkedBrands,
    catalogFranchiseOptions,
    catalogPrintTypeId,
    catalogPrintTypes,
    catalogRarityId,
    catalogSetId,
    catalogSets,
    catalogSubcategory,
    catalogSubcategoryOptions,
    catalogSubsetId,
    catalogSubsets,
    catalogTeamId,
    catalogTeams,
  ])

  useEffect(() => {
    setCatalogPage(1)
  }, [
    catalogBrandId, catalogCardTypeIds, catalogCategory, catalogFranchise,
    catalogMaxYear, catalogMinYear, catalogPrintTypeId, catalogRarityId, catalogSetId,
    catalogSortKey, catalogSubcategory, catalogSubjectId, catalogSubsetId,
    catalogTeamId,
  ])

  useEffect(() => {
    if (currentScreen !== 'catalog_item' || !selectedCatalogItem?.id) {
      setCatalogItemImages([])
      setCatalogDetailSubjects([])
      setCatalogDetailTeams([])
      setCatalogDetailCardTypes([])
      setCatalogDetailMtgCardTypeId('')
      setCatalogDetailRarityId('')
      setCatalogDetailStats(null)
      setCatalogDetailLego(null)
      setCatalogDetailLegoCond({})
      setCatalogDetailSetMinifigs([])
      setCatalogDetailParentSets([])
      setLinkSearch(''); setLinkResults([]); setLinkQty('1')
      return
    }
    let cancelled = false
    const load = async () => {
      const itemBrandId = selectedCatalogItem._details?.brand_id
      const isMinifig =
        ['Minifigs', 'Minifigures'].includes(selectedCatalogItem._details?.brand) ||
        selectedCatalogItem._details?.bricklink_id?.toLowerCase().startsWith('col') ||
        Boolean(selectedCatalogItem._details?.rebrickable_fig_id)
      const [{ data: images, error: imgErr }, { data: subjects }, { data: variants }, { data: itemMeta }, { data: marketData }, { data: ownerCountData }, { data: itemTeamRows }, { data: itemCardTypeRows }] = await Promise.all([
        supabase.from('item_images').select('item_image_id, image_path, position').eq('item_id', selectedCatalogItem.id).order('position'),
        supabase.from('item_subjects').select('subject_id, subjects(subject_name, subject_type)').eq('item_id', selectedCatalogItem.id),
        isMinifig && itemBrandId
          ? supabase.from('market_variants').select('market_variant_id, name, sort_order').eq('brand_id', itemBrandId).order('sort_order')
          : Promise.resolve({ data: [] }),
        supabase.from('items').select('rarity_id, mtg_card_type_id, lego_set_number, minifig_code, piece_count, upc, bricklink_id, rebrickable_fig_id').eq('item_id', selectedCatalogItem.id).maybeSingle(),
        supabase.rpc('get_item_market_stats', { item_ids: [selectedCatalogItem.id] }),
        supabase.rpc('get_item_owner_count', { item_id: selectedCatalogItem.id }),
        supabase.from('item_teams').select('team_id, teams(name)').eq('item_id', selectedCatalogItem.id),
        supabase.from('item_card_types').select('card_type_id, card_types(name)').eq('item_id', selectedCatalogItem.id),
      ])
      if (imgErr) console.error('item_images load error:', imgErr)
      if (!cancelled) {
        setCatalogItemImages(images || [])
        setCatalogDetailSubjects((subjects || []).map(r => ({ id: r.subject_id, name: r.subjects?.subject_name || '', type: r.subjects?.subject_type || '' })))
        setCatalogDetailTeams((itemTeamRows || []).map(r => r.teams?.name).filter(Boolean))
        setCatalogDetailCardTypes((itemCardTypeRows || []).map(r => r.card_types?.name).filter(Boolean))
        setCatalogMarketVariants(variants || [])
        setCatalogItemConditionId('')
        setCatalogDetailMtgCardTypeId(itemMeta?.mtg_card_type_id || '')
        setCatalogDetailRarityId(itemMeta?.rarity_id || '')
        setCatalogDetailLego(itemMeta || null)
        const stats = Array.isArray(marketData) && marketData.length > 0 ? marketData[0] : null
        setCatalogDetailStats(stats ? { ...stats, community_owned: ownerCountData ?? null } : { community_owned: ownerCountData ?? null })
      }

      // Retail price — isolated query so a not-yet-applied migration (missing
      // column) can't break the other LEGO detail fields above.
      const { data: retailRow } = await supabase
        .from('items').select('retail_price').eq('item_id', selectedCatalogItem.id).maybeSingle()
      if (!cancelled && retailRow && retailRow.retail_price != null) {
        setCatalogDetailLego(prev => ({ ...(prev || {}), retail_price: retailRow.retail_price }))
      }

      // Minifigs connected to this set (empty for non-sets / minifigs).
      const { data: smRows } = await supabase
        .from('set_minifigs').select('minifig_item_id, quantity').eq('set_item_id', selectedCatalogItem.id)
      let setMinifigs = []
      if (smRows?.length) {
        const figIds = smRows.map(r => r.minifig_item_id)
        const { data: figItems } = await supabase
          .from('items').select('item_id, description, rebrickable_fig_id, minifig_code, subject_id, image_path').in('item_id', figIds)
        const subjIds = [...new Set((figItems || []).map(f => f.subject_id).filter(Boolean))]
        const { data: subs } = subjIds.length
          ? await supabase.from('subjects').select('subject_id, subject_name').in('subject_id', subjIds)
          : { data: [] }
        const subjName = Object.fromEntries((subs || []).map(s => [s.subject_id, s.subject_name]))
        const byId = Object.fromEntries((figItems || []).map(f => [f.item_id, f]))
        const qtyByFig = Object.fromEntries(smRows.map(r => [r.minifig_item_id, r.quantity]))
        setMinifigs = figIds.map(id => {
          const it = byId[id] || {}
          const subjectName = subjName[it.subject_id]
          // A set can contain multiple variants of the same character (e.g. two
          // "Geonosian" figs — one with wings, one without). Show the variant
          // description so they read as distinct, not duplicated.
          const variant = subjectName && it.description && it.description.trim().toLowerCase() !== subjectName.trim().toLowerCase()
            ? it.description.trim()
            : null
          return {
            item_id: id,
            quantity: qtyByFig[id] || 1,
            name: subjectName || it.description || 'Minifig',
            variant,
            // Prefer our internal minifig code; fall back to the Rebrickable fig-num.
            code: it.minifig_code || null,
            figNum: it.rebrickable_fig_id || null,
            image_path: it.image_path || null,
          }
        }).sort((a, b) => a.name.localeCompare(b.name))
      }
      if (!cancelled) setCatalogDetailSetMinifigs(setMinifigs)

      // Sets connected to this minifig (empty for non-minifigs / sets).
      let minifigParentSets = []
      if (isMinifig) {
        const { data: parentSetRows } = await supabase
          .from('set_minifigs')
          .select('set_item_id, quantity')
          .eq('minifig_item_id', selectedCatalogItem.id)

        if (parentSetRows?.length) {
          const uniqueSetIds = [...new Set(parentSetRows.map((row) => row.set_item_id).filter(Boolean))]
          const qtyBySetId = parentSetRows.reduce((lookup, row) => {
            const nextQty = Number(row.quantity)
            lookup[row.set_item_id] = (lookup[row.set_item_id] || 0) + (Number.isFinite(nextQty) ? nextQty : 1)
            return lookup
          }, {})
          const { data: parentSetDetails } = await supabase
            .from('item_details')
            .select('item_id, subject, description, release_year, franchise')
            .in('item_id', uniqueSetIds)

          const byId = Object.fromEntries((parentSetDetails || []).map((setItem) => [setItem.item_id, setItem]))
          minifigParentSets = uniqueSetIds
            .map((setId) => {
              const details = byId[setId] || {}
              // The set's name is its subject/description — NOT collectible_set, which
              // now means packaging (Box/Polybag/…).
              const setName =
                (typeof details.subject === 'string' && details.subject !== 'N/A' && details.subject.trim()) ||
                (typeof details.description === 'string' && details.description.trim()) ||
                'Set'
              return {
                item_id: setId,
                name: setName,
                franchise: details.franchise || '',
                release_year: details.release_year || null,
                quantity: qtyBySetId[setId] || 1,
              }
            })
            .sort((left, right) => left.name.localeCompare(right.name))
        }
      }
      if (!cancelled) setCatalogDetailParentSets(minifigParentSets)

      // Universal Related Items (catalog_item_relationships). "Includes" = children
      // of this item; "Included In" = parents (derived by querying where this item is
      // the child — never a stored reverse row). Guarded so a missing table (migration
      // not yet applied) yields empty lists, never an error. One batched query per
      // direction + one item_details + one items lookup — never per-related-item.
      let includes = [], includedIn = []
      const [{ data: childRows, error: cErr }, { data: parentRows, error: pErr }] = await Promise.all([
        supabase.from('catalog_item_relationships').select('child_item_id, quantity').eq('parent_item_id', selectedCatalogItem.id).eq('relationship_type', 'includes'),
        supabase.from('catalog_item_relationships').select('parent_item_id, quantity').eq('child_item_id', selectedCatalogItem.id).eq('relationship_type', 'includes'),
      ])
      if (!cErr && !pErr) {
        const childIds = [...new Set((childRows || []).map(r => r.child_item_id))]
        const parentIds = [...new Set((parentRows || []).map(r => r.parent_item_id))]
        const allIds = [...new Set([...childIds, ...parentIds])]
        if (allIds.length) {
          const [{ data: det }, { data: base }] = await Promise.all([
            supabase.from('item_details').select('item_id, subject, description, brand, front_image_path, print_type, release_year').in('item_id', allIds),
            supabase.from('items').select('item_id, name, minifig_code, upc, lego_set_number').in('item_id', allIds),
          ])
          const detById = Object.fromEntries((det || []).map(d => [d.item_id, d]))
          const baseById = Object.fromEntries((base || []).map(b => [b.item_id, b]))
          const qtyChild = Object.fromEntries((childRows || []).map(r => [r.child_item_id, r.quantity]))
          const qtyParent = Object.fromEntries((parentRows || []).map(r => [r.parent_item_id, r.quantity]))
          const na = (v) => (v && v !== 'N/A' ? v : '')
          const shape = (id, qty) => {
            const d = detById[id] || {}, b = baseById[id] || {}
            const fp = d.front_image_path
            const imageUrl = fp ? (fp.startsWith('http') ? fp : supabase.storage.from('item-images').getPublicUrl(fp).data?.publicUrl || '') : ''
            return {
              item_id: id,
              name: na(b.name) || na(d.subject) || na(d.description) || 'Item',
              description: na(d.print_type) || na(d.description) || '',
              itemType: na(d.brand),
              idNumber: na(b.lego_set_number) || na(b.minifig_code) || na(b.upc) || '',
              year: d.release_year || null,
              imageUrl,
              quantity: qty || 1,
            }
          }
          includes   = childIds.map(id => shape(id, qtyChild[id])).sort((a, b) => a.name.localeCompare(b.name))
          includedIn = parentIds.map(id => shape(id, qtyParent[id])).sort((a, b) => a.name.localeCompare(b.name))
        }
      }
      if (!cancelled) { setCatalogDetailIncludes(includes); setCatalogDetailIncludedIn(includedIn) }
    }
    load()
    return () => { cancelled = true }
  }, [currentScreen, selectedCatalogItem?.id, catalogItemImagesReloadToken])

  // ─── Related Items (universal relationships) admin CRUD ─────────────────────
  // Writes go to catalog_item_relationships (RLS enforces admin server-side). A
  // set↔minifig pair is also mirrored into legacy set_minifigs so LEGO completion
  // (which still reads that table) stays consistent.
  const mirrorSetMinifig = async (parentId, childId, action) => {
    const { data: c } = await supabase.from('items').select('minifig_code, rebrickable_fig_id').eq('item_id', childId).maybeSingle()
    if (!(c?.minifig_code || c?.rebrickable_fig_id)) return
    if (action === 'add') {
      await supabase.from('set_minifigs').upsert({ set_item_id: parentId, minifig_item_id: childId, quantity: 1 }, { onConflict: 'set_item_id,minifig_item_id', ignoreDuplicates: true })
    } else {
      await supabase.from('set_minifigs').delete().eq('set_item_id', parentId).eq('minifig_item_id', childId)
    }
  }
  // mode 'child' → current item INCLUDES target; mode 'parent' → target INCLUDES current.
  const handleAddRelatedItem = async (targetItemId, mode) => {
    if (!selectedCatalogItem?.id || !targetItemId) return
    if (targetItemId === selectedCatalogItem.id) { setRelError('An item cannot include itself.'); return }
    const qty = Math.max(1, parseInt(relAddQty, 10) || 1)
    setRelBusy(true); setRelError('')
    const parent = mode === 'child' ? selectedCatalogItem.id : targetItemId
    const child  = mode === 'child' ? targetItemId : selectedCatalogItem.id
    const { error } = await supabase.from('catalog_item_relationships').upsert(
      { parent_item_id: parent, child_item_id: child, relationship_type: 'includes', quantity: qty, created_by: profile?.id || null },
      { onConflict: 'parent_item_id,child_item_id,relationship_type' })
    if (error) { setRelError(error.message); setRelBusy(false); return }
    await mirrorSetMinifig(parent, child, 'add')
    if (qty > 1) await supabase.from('set_minifigs').update({ quantity: qty }).eq('set_item_id', parent).eq('minifig_item_id', child)
    setRelAddMode(null); setRelSearch(''); setRelSearchResults([]); setRelAddQty('1')
    setRelBusy(false); setCatalogItemImagesReloadToken(t => t + 1)
  }
  // Update how many copies of a child are in the current (parent) item.
  const handleRelSetQuantity = async (childItemId, rawQty) => {
    if (!selectedCatalogItem?.id) return
    const qty = Math.max(1, parseInt(rawQty, 10) || 1)
    setRelBusy(true); setRelError('')
    await supabase.from('catalog_item_relationships').update({ quantity: qty })
      .eq('parent_item_id', selectedCatalogItem.id).eq('child_item_id', childItemId).eq('relationship_type', 'includes')
    await supabase.from('set_minifigs').update({ quantity: qty }).eq('set_item_id', selectedCatalogItem.id).eq('minifig_item_id', childItemId)
    setRelBusy(false); setCatalogItemImagesReloadToken(t => t + 1)
  }
  const handleRemoveRelated = async (otherItemId, mode) => {
    if (!selectedCatalogItem?.id) return
    if (!window.confirm('Remove this relationship? This affects both items (Includes / Included In).')) return
    const parent = mode === 'child' ? selectedCatalogItem.id : otherItemId
    const child  = mode === 'child' ? otherItemId : selectedCatalogItem.id
    setRelBusy(true); setRelError('')
    const { error } = await supabase.from('catalog_item_relationships').delete()
      .eq('parent_item_id', parent).eq('child_item_id', child).eq('relationship_type', 'includes')
    if (error) { setRelError(error.message); setRelBusy(false); return }
    await mirrorSetMinifig(parent, child, 'remove')
    setRelBusy(false); setCatalogItemImagesReloadToken(t => t + 1)
  }

  // Server-side item search for the relationship selector (name/description/codes/
  // barcode + subject). Limited + debounced — never loads the whole catalogue.
  useEffect(() => {
    if (!relAddMode) { setRelSearchResults([]); return }
    const q = relSearch.trim()
    if (q.length < 2) { setRelSearchResults([]); return }
    let cancelled = false
    const timer = setTimeout(async () => {
      const like = `%${q}%`
      const na = (v) => (v && v !== 'N/A' ? v : '')
      const [{ data: idRows }, { data: subjRows }] = await Promise.all([
        supabase.from('items').select('item_id')
          .or([`name.ilike.${like}`, `description.ilike.${like}`, `lego_set_number.ilike.${like}`, `minifig_code.ilike.${like}`, `bricklink_id.ilike.${like}`, `upc.ilike.${like}`].join(','))
          .limit(25),
        supabase.from('item_details').select('item_id').ilike('subject', like).limit(25),
      ])
      const ids = [...new Set([...(idRows || []).map(r => r.item_id), ...(subjRows || []).map(r => r.item_id)])]
        .filter(id => id !== selectedCatalogItem?.id).slice(0, 25)
      if (!ids.length) { if (!cancelled) setRelSearchResults([]); return }
      const [{ data: det }, { data: base }] = await Promise.all([
        supabase.from('item_details').select('item_id, subject, description, brand, franchise').in('item_id', ids),
        supabase.from('items').select('item_id, name, minifig_code, upc, lego_set_number').in('item_id', ids),
      ])
      const detById = Object.fromEntries((det || []).map(d => [d.item_id, d]))
      const baseById = Object.fromEntries((base || []).map(b => [b.item_id, b]))
      const results = ids.map(id => {
        const d = detById[id] || {}, b = baseById[id] || {}
        return {
          item_id: id,
          name: na(b.name) || na(d.subject) || na(d.description) || 'Item',
          itemType: na(d.brand),
          franchise: na(d.franchise),
          idNumber: na(b.lego_set_number) || na(b.minifig_code) || na(b.upc) || '',
        }
      }).sort((a, b) => a.name.localeCompare(b.name))
      if (!cancelled) setRelSearchResults(results)
    }, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [relSearch, relAddMode, selectedCatalogItem?.id])

  // Lightbox keyboard: Escape closes, arrows flip through images.
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(null)
      else if (e.key === 'ArrowRight') setLightbox(lb => lb && lb.images.length > 1 ? { ...lb, index: (lb.index + 1) % lb.images.length } : lb)
      else if (e.key === 'ArrowLeft') setLightbox(lb => lb && lb.images.length > 1 ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : lb)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  // Open the lightbox on the clicked image, with all of the item's images loaded
  // so you can flip through them.
  const openLightbox = (clickedUrl) => {
    const urls = [...catalogItemImages]
      .sort((a, b) => a.position - b.position)
      .map(img => (img.image_path?.startsWith('http') ? img.image_path : supabase.storage.from('item-images').getPublicUrl(img.image_path).data?.publicUrl))
      .filter(Boolean)
    const list = urls.length ? urls : (clickedUrl ? [clickedUrl] : [])
    if (!list.length) return
    setLightbox({ images: list, index: Math.max(0, list.indexOf(clickedUrl)) })
  }

  useEffect(() => {
    // In the Image Queue, jump straight to Manage Images; otherwise default to Overview.
    setCatalogDetailViewTab(imageQueueActive ? 'manageImages' : 'overview')
  }, [selectedCatalogItem?.id])

  useEffect(() => {
    if (catalogPage > catalogTotalPages) {
      setCatalogPage(catalogTotalPages)
    }
  }, [catalogPage, catalogTotalPages])

  // Keep the "go to page" input in sync when the page changes via buttons/filters.
  useEffect(() => { setCatalogPageInput(String(catalogPage)) }, [catalogPage])

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

      const { data: rawData, error } = await supabase
        .from('categories')
        .select('category_id, name')
        .order('name', { ascending: true })

      const data = (rawData || []).map(r => ({ id: r.category_id, name: r.name }))

      if (error) {
        setCatalogAdminFormError(error.message || 'Could not load catalog categories.')
        return
      }

      setCatalogAdminCategories(data)
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
    if (CATALOG_MINIFIG_CATEGORIES.has(selectedCatalogAdminCategoryName)) {
      supabase.from('lego_property_registry').select('abbreviation, full_name, theme_abbreviation, status').order('abbreviation')
        .then(({ data }) => setLegoPropertyRegistry(data || []))
    } else {
      setLegoPropertyRegistry([])
    }
  }, [selectedCatalogAdminCategoryName])

  useEffect(() => {
    if (currentScreen !== 'catalog' || !isPlatformAdmin) { setCatalogAdminBrands([]); return }
    // LEGO items are branded only Sets / Minifigs / Miscellaneous — independent of
    // theme. Override the franchise-based brand list with this fixed set. Trigger on
    // the Building Blocks category so it works even for a brand-new franchise (which
    // has no brand_franchise links yet) or before the subcategory name resolves.
    const subName = (catalogAdminSubcategories.find(s => s.id === catalogAdminSubcategoryId)?.name || '').toLowerCase()
    if (selectedCatalogAdminCategoryName === 'Building Blocks' || subName === 'lego') {
      supabase.from('brands').select('brand_id, name').in('name', LEGO_BRAND_NAMES)
        .then(({ data }) => {
          const byName = {}
          for (const b of data || []) if (!byName[b.name]) byName[b.name] = b.brand_id  // dedupe by name
          const list = LEGO_BRAND_NAMES.filter(n => byName[n]).map(n => ({ id: byName[n], name: n }))
          setCatalogAdminBrands(list)
          setCatalogAdminBrandId(prev => list.some(b => b.id === prev) ? prev : '')
        })
      return
    }
    if (!catalogAdminRealFranchiseId) { setCatalogAdminBrands([]); setCatalogAdminBrandId(''); return }
    supabase.from('brand_franchise').select('brand_id').eq('franchise_id', catalogAdminRealFranchiseId)
      .then(({ data: bfRows }) => {
        const ids = (bfRows || []).map(r => r.brand_id)
        if (!ids.length) { setCatalogAdminBrands([]); setCatalogAdminBrandId(''); return }
        supabase.from('brands').select('brand_id, name').in('brand_id', ids).order('name')
          .then(({ data }) => {
            const list = (data || []).map(r => ({ id: r.brand_id, name: r.name }))
            setCatalogAdminBrands(list)
            setCatalogAdminBrandId(prev => list.some(b => b.id === prev) ? prev : '')
          })
      })
  }, [currentScreen, isPlatformAdmin, catalogAdminRealFranchiseId, catalogAdminSubcategoryId, catalogAdminSubcategories, selectedCatalogAdminCategoryName])

  // Faceted classification: Subtheme (subset) options depend on Theme (franchise).
  useEffect(() => {
    if (currentScreen !== 'catalog' || !isPlatformAdmin || !catalogAdminRealFranchiseId) { setCatalogAdminSubsetsList([]); return }
    supabase.from('subsets').select('subset_id, name').eq('franchise_id', catalogAdminRealFranchiseId).order('name')
      .then(({ data }) => setCatalogAdminSubsetsList((data || []).map(r => ({ id: r.subset_id, name: r.name }))))
  }, [currentScreen, isPlatformAdmin, catalogAdminRealFranchiseId])

  // Property options (properties table). Constrained by the selected Subfranchise
  // when one is chosen (e.g. Star Wars → "Fall of the Jedi" → only its properties);
  // otherwise every Property for the Theme/franchise. (List var name kept for churn.)
  useEffect(() => {
    if (currentScreen !== 'catalog' || !isPlatformAdmin || !catalogAdminRealFranchiseId) { setCatalogAdminProductLinesList([]); return }
    let q = supabase.from('properties').select('property_id, name').eq('franchise_id', catalogAdminRealFranchiseId).order('name')
    if (catalogAdminSubsetSel) q = q.eq('subset_id', catalogAdminSubsetSel)
    q.then(({ data, error }) => setCatalogAdminProductLinesList(error ? [] : (data || []).map(r => ({ id: r.property_id, name: r.name }))))
  }, [currentScreen, isPlatformAdmin, catalogAdminSubsetSel, catalogAdminRealFranchiseId])

  // Packaging (repurposed collectible_sets — global rows, no brand) — independent.
  useEffect(() => {
    if (currentScreen !== 'catalog' || !isPlatformAdmin) { setCatalogAdminPackagingList([]); return }
    supabase.from('collectible_sets').select('collectible_set_id, name').is('brand_id', null).order('name')
      .then(({ data }) => setCatalogAdminPackagingList((data || []).map(r => ({ id: r.collectible_set_id, name: r.name }))))
  }, [currentScreen, isPlatformAdmin])

  // Series (facet) — scoped to the selected Subcategory (manufacturer/publisher).
  useEffect(() => {
    if (currentScreen !== 'catalog' || !isPlatformAdmin || !catalogAdminSubcategoryId) { setCatalogAdminSeriesList([]); return }
    supabase.from('series').select('series_id, name').eq('subcategory_id', catalogAdminSubcategoryId).order('name')
      .then(({ data, error }) => setCatalogAdminSeriesList(error ? [] : (data || []).map(r => ({ id: r.series_id, name: r.name }))))
  }, [currentScreen, isPlatformAdmin, catalogAdminSubcategoryId])
  // Clear a stale Series pick when the Subcategory changes.
  useEffect(() => { setCatalogAdminSeriesId('') }, [catalogAdminSubcategoryId])

  useEffect(() => {
    if (currentScreen !== 'catalog' || !isPlatformAdmin) {
      setCatalogAdminCardTypes([])
      return
    }
    supabase.from('card_types').select('card_type_id, name').order('name')
      .then(({ data }) => setCatalogAdminCardTypes((data || []).map(r => ({ id: r.card_type_id, name: r.name }))))
  }, [currentScreen, isPlatformAdmin])

  useEffect(() => {
    if (!isPlatformAdmin) { setCatalogAdminRealFranchises([]); setCatalogAdminRealFranchiseId(prev => prev ? '' : prev); return }
    // Music: franchise is auto-resolved by category — subcategory doesn't gate it
    if (selectedCatalogAdminCategoryName === 'Music') { setCatalogAdminRealFranchises([]); return }
    if (!catalogAdminSubcategoryId) {
      setCatalogAdminRealFranchises([])
      setCatalogAdminRealFranchiseId(prev => prev ? '' : prev)
      return
    }
    // Theme options come from the franchise_subcategory links, but fall back to
    // franchises actually used by items in this subcategory — imported data (e.g.
    // Pharaoh's Quest) may have items without a franchise_subcategory link yet.
    Promise.all([
      supabase.from('franchise_subcategory').select('franchise_id').eq('subcategory_id', catalogAdminSubcategoryId),
      supabase.from('items').select('franchise_id').eq('subcategory_id', catalogAdminSubcategoryId).not('franchise_id', 'is', null),
    ])
      .then(([{ data: fsRows }, { data: itemFrRows }]) => {
        const ids = [...new Set([
          ...(fsRows || []).map(r => r.franchise_id),
          ...(itemFrRows || []).map(r => r.franchise_id),
        ].filter(Boolean))]
        if (!ids.length) { setCatalogAdminRealFranchises([]); setCatalogAdminRealFranchiseId(''); return }
        supabase.from('franchises').select('franchise_id, name').in('franchise_id', ids).order('name')
          .then(async ({ data }) => {
            const rows = (data || [])
            const allIds = [...new Set(rows.map((row) => row.franchise_id).filter(Boolean))]
            const itemCountById = {}
            const setCountById = {}

            if (allIds.length) {
              const [{ data: itemRows }, { data: setRows }] = await Promise.all([
                supabase
                  .from('items')
                  .select('franchise_id')
                  .eq('subcategory_id', catalogAdminSubcategoryId)
                  .in('franchise_id', allIds),
                supabase
                  .from('collectible_sets')
                  .select('franchise_id')
                  .in('franchise_id', allIds),
              ])

              for (const row of itemRows || []) {
                if (!row?.franchise_id) continue
                itemCountById[row.franchise_id] = (itemCountById[row.franchise_id] || 0) + 1
              }
              for (const row of setRows || []) {
                if (!row?.franchise_id) continue
                setCountById[row.franchise_id] = (setCountById[row.franchise_id] || 0) + 1
              }
            }

            const groupedByName = new Map()
            for (const row of rows) {
              const name = typeof row.name === 'string' ? row.name.trim() : ''
              if (!row.franchise_id || !name) continue
              const key = name.toLowerCase()
              if (!groupedByName.has(key)) groupedByName.set(key, [])
              groupedByName.get(key).push({ id: row.franchise_id, name })
            }

            const list = [...groupedByName.values()]
              .map((candidates) => (
                candidates.sort((left, right) => {
                  const itemDelta = (itemCountById[right.id] || 0) - (itemCountById[left.id] || 0)
                  if (itemDelta !== 0) return itemDelta
                  const setDelta = (setCountById[right.id] || 0) - (setCountById[left.id] || 0)
                  if (setDelta !== 0) return setDelta
                  return String(left.id).localeCompare(String(right.id))
                })[0]
              ))
              .sort((left, right) => left.name.localeCompare(right.name))

            setCatalogAdminRealFranchises(list)
            setCatalogAdminRealFranchiseId((prev) => {
              if (!prev) return ''
              if (list.some((franchise) => franchise.id === prev)) return prev
              const prevName = rows.find((row) => row.franchise_id === prev)?.name
              if (!prevName) return ''
              const match = list.find((franchise) => franchise.name.toLowerCase() === String(prevName).trim().toLowerCase())
              return match?.id || ''
            })
          })
      })
  }, [catalogAdminSubcategoryId, isPlatformAdmin, selectedCatalogAdminCategoryName])

  // Auto-resolve Music franchise when category is Music
  useEffect(() => {
    if (!isPlatformAdmin || selectedCatalogAdminCategoryName !== 'Music') return
    supabase.from('franchises').select('franchise_id').eq('name', 'Music').limit(1)
      .then(({ data }) => { if (data?.[0]?.franchise_id) setCatalogAdminRealFranchiseId(data[0].franchise_id) })
  }, [selectedCatalogAdminCategoryName, isPlatformAdmin])

  useEffect(() => {
    if (!isPlatformAdmin || !catalogAdminRealFranchiseId) { setCatalogAdminSubjects([]); return }
    supabase
      .from('subject_franchise')
      .select('subject_id')
      .eq('franchise_id', catalogAdminRealFranchiseId)
      .then(({ data: sfRows }) => {
        const ids = (sfRows || []).map(r => r.subject_id)
        if (ids.length === 0) { setCatalogAdminSubjects([]); return }
        supabase.from('subjects').select('subject_id, subject_name').in('subject_id', ids).order('subject_name')
          .then(({ data }) => setCatalogAdminSubjects((data || []).map(r => ({ id: r.subject_id, name: r.subject_name }))))
      })
  }, [catalogAdminRealFranchiseId, isPlatformAdmin])

  useEffect(() => {
    if (!isPlatformAdmin || !catalogAdminRealFranchiseId) { setCatalogAdminTeams([]); setCatalogAdminTeamIds(prev => prev.length ? [] : prev); return }
    supabase.from('teams').select('team_id, name').eq('franchise_id', catalogAdminRealFranchiseId).order('name')
      .then(({ data }) => setCatalogAdminTeams((data || []).map(r => ({ id: r.team_id, name: r.name }))))
  }, [catalogAdminRealFranchiseId, isPlatformAdmin])

  // Bulk import: load teams for the current row's franchise_name when no global franchise is selected
  useEffect(() => {
    if (!isPlatformAdmin || catalogAdminRealFranchiseId) return
    const franchiseName = bulkImportRows[bulkImportIdx]?.franchise_name?.trim()
    if (!franchiseName) { setCatalogAdminTeams([]); return }
    supabase.from('franchises').select('franchise_id').ilike('name', franchiseName).limit(1).maybeSingle()
      .then(({ data }) => {
        if (!data?.franchise_id) { setCatalogAdminTeams([]); return }
        supabase.from('teams').select('team_id, name').eq('franchise_id', data.franchise_id).order('name')
          .then(({ data: teams }) => setCatalogAdminTeams((teams || []).map(r => ({ id: r.team_id, name: r.name }))))
      })
  }, [bulkImportIdx, bulkImportRows, catalogAdminRealFranchiseId, isPlatformAdmin])

  // When teams load (after file is processed), back-fill team_ids on rows that have team_names
  useEffect(() => {
    if (!catalogAdminTeams.length || !bulkImportRows.length) return
    const teamByName = new Map(catalogAdminTeams.map(t => [t.name.toLowerCase(), t.id]))
    setBulkImportRows(rows => rows.map(r => {
      if (!r.team_names) return r
      const ids = r.team_names.split(/[,;]/).map(s => s.trim().toLowerCase()).filter(Boolean)
        .map(n => teamByName.get(n)).filter(Boolean)
      if (!ids.length) return r
      return { ...r, team_ids: [...new Set([...(r.team_ids || []), ...ids])] }
    }))
  }, [catalogAdminTeams])

  // Load species list for bulk import (species are global, not franchise-scoped —
  // matches the catalogAdminSpecies dropdown behavior above).
  useEffect(() => {
    if (!bulkImportRows.length) { setBulkImportSpeciesList([]); return }
    supabase.from('species').select('species_id, name').order('name')
      .then(({ data }) => setBulkImportSpeciesList((data || []).map(r => ({ id: r.species_id, name: r.name }))))
  }, [bulkImportRows.length])

  // When species load (after file is processed), back-fill species_id on rows that
  // carry a species_name from the CSV (case-insensitive match by name).
  useEffect(() => {
    if (!bulkImportSpeciesList.length || !bulkImportRows.length) return
    const speciesByName = new Map(bulkImportSpeciesList.map(s => [s.name.trim().toLowerCase(), s.id]))
    setBulkImportRows(rows => rows.map(r => {
      if (r.species_id || !r.species_name?.trim()) return r
      const id = speciesByName.get(r.species_name.trim().toLowerCase())
      return id ? { ...r, species_id: id } : r
    }))
  }, [bulkImportSpeciesList])

  // Faceted classification in bulk import — mirrors the Single Item cascade.
  // Resolve the current row's Theme into catalogAdminRealFranchiseId so the
  // Subtheme / Product Line / Team option lists load exactly like Single Item.
  const bulkCurrentRow = bulkImportRows[bulkImportIdx]
  useEffect(() => {
    if (!bulkImportMode) return
    const franchiseName = bulkCurrentRow?.franchise_name?.trim()
    if (!franchiseName) { setCatalogAdminRealFranchiseId(prev => prev ? '' : prev); return }
    let cancelled = false
    supabase.from('franchises').select('franchise_id').ilike('name', franchiseName).limit(1).maybeSingle()
      .then(({ data }) => { if (!cancelled) setCatalogAdminRealFranchiseId(data?.franchise_id || '') })
    return () => { cancelled = true }
  }, [bulkImportMode, bulkImportIdx, bulkCurrentRow?.franchise_name])

  // Subtheme options (catalogAdminSubsetsList) are scoped to the current row's
  // Theme via catalogAdminRealFranchiseId; match the row's CSV subtheme name.
  useEffect(() => {
    if (!bulkImportMode || !bulkCurrentRow) return
    if (bulkCurrentRow.subset_id || !bulkCurrentRow.subtheme_name?.trim() || !catalogAdminSubsetsList.length) return
    const id = catalogAdminSubsetsList.find(s => s.name.trim().toLowerCase() === bulkCurrentRow.subtheme_name.trim().toLowerCase())?.id
    if (id) updateBulkRow(bulkImportIdx, { subset_id: id })
  }, [catalogAdminSubsetsList, bulkImportIdx, bulkImportMode])

  // Keep the shared Product Line list (catalogAdminSubsetSel) pointed at the row.
  useEffect(() => {
    if (!bulkImportMode) return
    setCatalogAdminSubsetSel(bulkCurrentRow?.subset_id || '')
  }, [bulkImportMode, bulkImportIdx, bulkCurrentRow?.subset_id])

  // Match the row's CSV product_line names (semicolon-separated) to loaded ids.
  useEffect(() => {
    if (!bulkImportMode || !bulkCurrentRow?.product_line_names?.trim() || !catalogAdminProductLinesList.length) return
    const want = bulkCurrentRow.product_line_names.split(';').map(s => s.trim().toLowerCase()).filter(Boolean)
    const ids = catalogAdminProductLinesList.filter(p => want.includes(p.name.trim().toLowerCase())).map(p => p.id)
    const merged = [...new Set([...(bulkCurrentRow.product_line_ids || []), ...ids])]
    if (merged.length !== (bulkCurrentRow.product_line_ids || []).length) updateBulkRow(bulkImportIdx, { product_line_ids: merged })
  }, [catalogAdminProductLinesList, bulkImportIdx, bulkImportMode])

  useEffect(() => {
    const q = catalogAdminSubjectSearch.trim()
    if (q.length < 2) { setCatalogAdminSubjectResults([]); return }
    setCatalogAdminSubjectIsSearching(true)
    const timer = setTimeout(() => {
      supabase.from('subjects').select('subject_id, subject_name, subject_type').ilike('subject_name', `%${q}%`).order('subject_name').limit(10)
        .then(({ data }) => {
          const already = new Set(catalogAdminSubjectIds.map(s => s.id))
          setCatalogAdminSubjectResults((data || []).filter(r => !already.has(r.subject_id)).map(r => ({ id: r.subject_id, name: r.subject_name, type: r.subject_type })))
          setCatalogAdminSubjectIsSearching(false)
        })
    }, 250)
    return () => clearTimeout(timer)
  }, [catalogAdminSubjectSearch, catalogAdminSubjectIds])

  useEffect(() => {
    if (!isPlatformAdmin || currentScreen !== 'catalog') { setCatalogAdminSpecies([]); return }
    supabase.from('species').select('species_id, name').order('name')
      .then(({ data }) => setCatalogAdminSpecies((data || []).map(r => ({ id: r.species_id, name: r.name }))))
  }, [currentScreen, isPlatformAdmin])

  useEffect(() => {
    if (!isPlatformAdmin || !catalogAdminFranchiseId) { setCatalogAdminSubsets([]); setCatalogAdminSubsetId(''); return }
    supabase.from('subcollectible_sets').select('subcollectble_set_id, name').eq('collectible_set_id', catalogAdminFranchiseId).order('name')
      .then(({ data }) => setCatalogAdminSubsets((data || []).map(r => ({ id: r.subcollectble_set_id, name: r.name }))))
  }, [catalogAdminFranchiseId, isPlatformAdmin])

  useEffect(() => {
    if (!isPlatformAdmin || !catalogAdminSubsetId) { setCatalogAdminPrintTypes([]); setCatalogAdminPrintTypeId(''); return }
    supabase.from('print_types').select('print_type_id, name').eq('subcollectble_set_id', catalogAdminSubsetId).order('name')
      .then(({ data }) => setCatalogAdminPrintTypes((data || []).map(r => ({ id: r.print_type_id, name: r.name }))))
  }, [catalogAdminSubsetId, isPlatformAdmin])

  // Edit panel: subject search across ALL subjects
  useEffect(() => {
    if (!isCatalogItemEditMode) return
    const q = catalogItemEditSubjectSearch.trim()
    if (q.length < 2) { setCatalogItemEditSubjectResults([]); return }
    setCatalogItemEditSubjectIsSearching(true)
    const timer = setTimeout(() => {
      supabase.from('subjects').select('subject_id, subject_name, subject_type').ilike('subject_name', `%${q}%`).order('subject_name').limit(10)
        .then(({ data }) => {
          const already = new Set(catalogItemEditSubjectIds.map(s => s.id))
          setCatalogItemEditSubjectResults((data || []).filter(r => !already.has(r.subject_id)).map(r => ({ id: r.subject_id, name: r.subject_name, type: r.subject_type })))
          setCatalogItemEditSubjectIsSearching(false)
        })
    }, 250)
    return () => clearTimeout(timer)
  }, [isCatalogItemEditMode, catalogItemEditSubjectSearch, catalogItemEditSubjectIds])

  useEffect(() => {
    if (!bulkImportMode || !bulkImportRows.length) return
    const q = bulkImportSubjectSearch.trim()
    if (q.length < 2) { setBulkImportSubjectResults([]); return }
    const timer = setTimeout(() => {
      supabase.from('subjects').select('subject_id, subject_name, subject_type').ilike('subject_name', `%${q}%`).order('subject_name').limit(10)
        .then(({ data }) => {
          const cur = bulkImportRows[bulkImportIdx]
          const skip = cur?.subjectObj?.id
          setBulkImportSubjectResults((data || []).filter(r => r.subject_id !== skip).map(r => ({ id: r.subject_id, name: r.subject_name, type: r.subject_type })))
        })
    }, 250)
    return () => clearTimeout(timer)
  }, [bulkImportMode, bulkImportSubjectSearch, bulkImportIdx, bulkImportRows])

  useEffect(() => {
    if (!bulkPhotoMode || !bulkPhotoRows.length) return
    const q = bulkPhotoManualSearch.trim()
    if (q.length < 2) { setBulkPhotoManualResults([]); return }
    const timer = setTimeout(async () => {
      let query = supabase.from('item_details')
        .select('item_id, card_number, subject, print_type')
        .ilike('subject', `%${q}%`)
        .order('subject')
        .limit(30)
      if (catalogAdminFranchiseId) query = query.eq('collectible_set_id', catalogAdminFranchiseId)
      if (catalogAdminSubsetId) query = query.eq('subcollectble_set_id', catalogAdminSubsetId)
      if (bulkPhotoPrintTypeId === '__none__') query = query.is('print_type_id', null)
      else if (bulkPhotoPrintTypeId) query = query.eq('print_type_id', bulkPhotoPrintTypeId)
      const { data, error } = await query
      if (error) console.error('bulk photo search error:', error)
      setBulkPhotoManualResults(data || [])
    }, 250)
    return () => clearTimeout(timer)
  }, [bulkPhotoMode, bulkPhotoManualSearch, bulkPhotoRows.length, catalogAdminFranchiseId, catalogAdminSubsetId, bulkPhotoPrintTypeId])

  // Edit panel: franchise cascade from subcategory
  useEffect(() => {
    if (!isCatalogItemEditMode) return
    const isInitialLoad = catalogEditInitialRef.current
    const subcategoryId = catalogItemEditValues.subcategory_id
    const selectedSetId = catalogItemEditValues.collectible_set_id
    if (!subcategoryId) {
      setCatalogItemEditLookups(v => ({ ...v, franchises: [] }))
      if (!isInitialLoad) setCatalogItemEditValues(v => ({ ...v, franchise_id: '' }))
      return
    }
    const loadFranchises = async () => {
      const { data: fsRows } = await supabase
        .from('franchise_subcategory')
        .select('franchise_id')
        .eq('subcategory_id', subcategoryId)

      let ids = (fsRows || []).map(r => r.franchise_id).filter(Boolean)

      // If a set is already chosen, constrain franchise options to that set's franchise.
      if (selectedSetId) {
        const { data: setRow } = await supabase
          .from('collectible_sets')
          .select('franchise_id')
          .eq('collectible_set_id', selectedSetId)
          .maybeSingle()
        if (setRow?.franchise_id) {
          ids = ids.filter((id) => id === setRow.franchise_id)
        }
      }

      if (!ids.length) {
        setCatalogItemEditLookups(v => ({ ...v, franchises: [] }))
        if (!isInitialLoad) setCatalogItemEditValues(v => ({ ...v, franchise_id: '' }))
        return
      }

      const { data } = await supabase
        .from('franchises')
        .select('franchise_id, name')
        .in('franchise_id', ids)
        .order('name')
      const list = (data || []).map(r => ({ id: r.franchise_id, name: r.name }))
      setCatalogItemEditLookups(v => ({ ...v, franchises: list }))
      if (!isInitialLoad) {
        setCatalogItemEditValues(v => ({ ...v, franchise_id: list.some(f => f.id === v.franchise_id) ? v.franchise_id : '' }))
      }
    }

    loadFranchises()
  }, [isCatalogItemEditMode, catalogItemEditValues.subcategory_id, catalogItemEditValues.collectible_set_id])

  // Edit panel: cascade teams from franchise
  useEffect(() => {
    if (!isCatalogItemEditMode) return
    const isInitialLoad = catalogEditInitialRef.current
    const franchiseId = catalogItemEditValues.franchise_id
    if (!franchiseId) {
      setCatalogItemEditLookups(v => ({ ...v, teams: [] }))
      if (!isInitialLoad) setCatalogItemEditTeamIds([])
      return
    }
    supabase.from('teams').select('team_id, name').eq('franchise_id', franchiseId).order('name')
      .then(({ data }) => {
        const newTeams = (data || []).map(r => ({ id: r.team_id, name: r.name }))
        setCatalogItemEditLookups(v => ({ ...v, teams: newTeams }))
        if (!isInitialLoad) {
          setCatalogItemEditTeamIds(prev => prev.filter(id => newTeams.some(t => t.id === id)))
        }
      })
  }, [isCatalogItemEditMode, catalogItemEditValues.franchise_id])

  // Edit panel: cascade collectible sets from franchise + brand. For LEGO the
  // "collectible set" is global Packaging (brand_id null), not franchise-scoped.
  useEffect(() => {
    if (!isCatalogItemEditMode) return
    const isInitialLoad = catalogEditInitialRef.current
    const franchiseId = catalogItemEditValues.franchise_id
    const brandId = catalogItemEditValues.brand_id
    const catName = catalogCategories.find(c => c.id === catalogItemEditValues.category_id)?.name || ''
    const applyResult = (data) => {
      const newSets = (data || []).map(r => ({ id: r.collectible_set_id, name: r.name }))
      setCatalogItemEditLookups(v => ({ ...v, sets: newSets }))
      if (!isInitialLoad) {
        setCatalogItemEditValues(v => ({ ...v, collectible_set_id: newSets.some(s => s.id === v.collectible_set_id) ? v.collectible_set_id : '' }))
      }
    }
    if (catName === 'Building Blocks') {
      supabase.from('collectible_sets').select('collectible_set_id, name').is('brand_id', null).order('name').then(({ data }) => applyResult(data))
      return
    }
    if (!franchiseId && !brandId) {
      setCatalogItemEditLookups(v => ({ ...v, sets: [] }))
      if (!isInitialLoad) setCatalogItemEditValues(v => ({ ...v, collectible_set_id: '' }))
      return
    }
    let query = supabase.from('collectible_sets').select('collectible_set_id, name').order('name')
    if (franchiseId) query = query.eq('franchise_id', franchiseId)
    if (brandId) query = query.eq('brand_id', brandId)
    query.then(({ data }) => applyResult(data))
  }, [isCatalogItemEditMode, catalogItemEditValues.franchise_id, catalogItemEditValues.brand_id, catalogItemEditValues.category_id])

  // Edit panel: cascade subsets from collectible set
  useEffect(() => {
    if (!isCatalogItemEditMode) return
    const isInitialLoad = catalogEditInitialRef.current
    const setId = catalogItemEditValues.collectible_set_id
    if (!setId) {
      setCatalogItemEditLookups(v => ({ ...v, subsets: [] }))
      if (!isInitialLoad) setCatalogItemEditValues(v => ({ ...v, subcollectble_set_id: '' }))
      return
    }
    supabase.from('subcollectible_sets').select('subcollectble_set_id, name').eq('collectible_set_id', setId).order('name')
      .then(({ data }) => {
        const newSubsets = (data || []).map(r => ({ id: r.subcollectble_set_id, name: r.name }))
        setCatalogItemEditLookups(v => ({ ...v, subsets: newSubsets }))
        if (!isInitialLoad) {
          setCatalogItemEditValues(v => ({ ...v, subcollectble_set_id: newSubsets.some(s => s.id === v.subcollectble_set_id) ? v.subcollectble_set_id : '' }))
        }
      })
  }, [isCatalogItemEditMode, catalogItemEditValues.collectible_set_id])

  // Edit panel: cascade print types from subset
  useEffect(() => {
    if (!isCatalogItemEditMode) return
    const isInitialLoad = catalogEditInitialRef.current
    const subsetId = catalogItemEditValues.subcollectble_set_id
    if (!subsetId) {
      setCatalogItemEditLookups(v => ({ ...v, printTypes: [] }))
      if (!isInitialLoad) setCatalogItemEditValues(v => ({ ...v, print_type_id: '' }))
      return
    }
    supabase.from('print_types').select('print_type_id, name').eq('subcollectble_set_id', subsetId).order('name')
      .then(({ data }) => {
        const newTypes = (data || []).map(r => ({ id: r.print_type_id, name: r.name }))
        setCatalogItemEditLookups(v => ({ ...v, printTypes: newTypes }))
        if (!isInitialLoad) {
          setCatalogItemEditValues(v => ({ ...v, print_type_id: newTypes.some(t => t.id === v.print_type_id) ? v.print_type_id : '' }))
        }
      })
  }, [isCatalogItemEditMode, catalogItemEditValues.subcollectble_set_id])

  // Edit panel: Item Type (brand) scoped to the item's category/franchise —
  // Building Blocks is always Sets/Minifigs/Miscellaneous; else franchise-linked.
  useEffect(() => {
    if (!isCatalogItemEditMode) return
    const catName = catalogCategories.find(c => c.id === catalogItemEditValues.category_id)?.name || ''
    const franchiseId = catalogItemEditValues.franchise_id
    if (catName === 'Building Blocks') {
      supabase.from('brands').select('brand_id, name').in('name', LEGO_BRAND_NAMES)
        .then(({ data }) => {
          const byName = {}
          for (const b of (data || [])) if (!byName[b.name]) byName[b.name] = b.brand_id
          setCatalogItemEditLookups(v => ({ ...v, brands: LEGO_BRAND_NAMES.filter(n => byName[n]).map(n => ({ id: byName[n], name: n })) }))
        })
      return
    }
    if (!franchiseId) { setCatalogItemEditLookups(v => ({ ...v, brands: [] })); return }
    supabase.from('brand_franchise').select('brand_id').eq('franchise_id', franchiseId)
      .then(async ({ data: bf }) => {
        const ids = (bf || []).map(r => r.brand_id).filter(Boolean)
        if (!ids.length) { setCatalogItemEditLookups(v => ({ ...v, brands: [] })); return }
        const { data } = await supabase.from('brands').select('brand_id, name').in('brand_id', ids).order('name')
        setCatalogItemEditLookups(v => ({ ...v, brands: (data || []).map(r => ({ id: r.brand_id, name: r.name })) }))
      })
  }, [isCatalogItemEditMode, catalogItemEditValues.category_id, catalogItemEditValues.franchise_id])

  // Edit panel: Subtheme (subsets) cascade from Theme (franchise).
  useEffect(() => {
    if (!isCatalogItemEditMode) return
    const isInitialLoad = catalogEditInitialRef.current
    const franchiseId = catalogItemEditValues.franchise_id
    if (!franchiseId) {
      setCatalogItemEditLookups(v => ({ ...v, subthemes: [] }))
      if (!isInitialLoad) setCatalogItemEditValues(v => ({ ...v, subset_id: '' }))
      return
    }
    supabase.from('subsets').select('subset_id, name').eq('franchise_id', franchiseId).order('name')
      .then(({ data }) => {
        const list = (data || []).map(r => ({ id: r.subset_id, name: r.name }))
        setCatalogItemEditLookups(v => ({ ...v, subthemes: list }))
        if (!isInitialLoad) setCatalogItemEditValues(v => ({ ...v, subset_id: list.some(s => s.id === v.subset_id) ? v.subset_id : '' }))
      })
  }, [isCatalogItemEditMode, catalogItemEditValues.franchise_id])

  // Edit panel: Product Line cascade — under the Subtheme, or directly under the
  // Theme (franchise) when no Subtheme is set, since Subfranchise is optional.
  useEffect(() => {
    if (!isCatalogItemEditMode) return
    const isInitialLoad = catalogEditInitialRef.current
    const subsetId = catalogItemEditValues.subset_id
    const franchiseId = catalogItemEditValues.franchise_id
    const apply = ({ data, error }) => {
      const list = error ? [] : (data || []).map(r => ({ id: r.product_line_id, name: r.name }))
      setCatalogItemEditLookups(v => ({ ...v, productLines: list }))
      if (!isInitialLoad) setCatalogItemEditValues(v => ({ ...v, product_line_id: list.some(p => p.id === v.product_line_id) ? v.product_line_id : '' }))
    }
    let q = supabase.from('product_lines').select('product_line_id, name').order('name')
    if (subsetId) q = q.eq('subset_id', subsetId)
    else if (franchiseId) q = q.eq('franchise_id', franchiseId).is('subset_id', null)
    else {
      setCatalogItemEditLookups(v => ({ ...v, productLines: [] }))
      if (!isInitialLoad) setCatalogItemEditValues(v => ({ ...v, product_line_id: '' }))
      return
    }
    q.then(apply)
  }, [isCatalogItemEditMode, catalogItemEditValues.subset_id, catalogItemEditValues.franchise_id])

  // Edit panel: Series (facet) scoped to the item's Subcategory.
  useEffect(() => {
    if (!isCatalogItemEditMode) return
    const isInitialLoad = catalogEditInitialRef.current
    const subcategoryId = catalogItemEditValues.subcategory_id
    if (!subcategoryId) {
      setCatalogItemEditLookups(v => ({ ...v, series: [] }))
      if (!isInitialLoad) setCatalogItemEditValues(v => ({ ...v, series_id: '' }))
      return
    }
    supabase.from('series').select('series_id, name').eq('subcategory_id', subcategoryId).order('name')
      .then(({ data, error }) => {
        const list = error ? [] : (data || []).map(r => ({ id: r.series_id, name: r.name }))
        setCatalogItemEditLookups(v => ({ ...v, series: list }))
        if (!isInitialLoad) setCatalogItemEditValues(v => ({ ...v, series_id: list.some(s => s.id === v.series_id) ? v.series_id : '' }))
      })
  }, [isCatalogItemEditMode, catalogItemEditValues.subcategory_id])

  // Clear the initial-load guard after a tick so cascade effects all capture it before it's cleared
  useEffect(() => {
    if (!isCatalogItemEditMode) { catalogEditInitialRef.current = false; return }
    const timer = setTimeout(() => { catalogEditInitialRef.current = false }, 0)
    return () => clearTimeout(timer)
  }, [isCatalogItemEditMode])

  useEffect(() => {
    const loadExistingPeopleAndMinifigs = async () => {
      if (!isPlatformAdmin) return

      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('subject_id, subject_name, subject_type')
        .order('subject_name')

      setCatalogAdminExistingPeople((subjectsData || []).map(r => ({ id: r.subject_id, name: r.subject_name, type: r.subject_type })))
      setCatalogAdminExistingMinifigs([])
    }

    loadExistingPeopleAndMinifigs()
  }, [isPlatformAdmin])

  useEffect(() => {
    const loadCatalogAdminSubcategories = async () => {
      if (!isPlatformAdmin || currentScreen !== 'catalog' || !catalogAdminCategoryId) {
        setCatalogAdminSubcategories([])
        setCatalogAdminSubcategoryId('')
        return
      }

      const { data: rawSubs, error } = await supabase
        .from('subcategories')
        .select('subcategory_id, name')
        .eq('category_id', catalogAdminCategoryId)
        .order('name', { ascending: true })

      const data = (rawSubs || []).map(r => ({ id: r.subcategory_id, name: r.name }))

      if (error) {
        setCatalogAdminFormError(error.message || 'Could not load catalog subcategories.')
        return
      }

      setCatalogAdminSubcategories(data)
      if (!data?.some((subcategory) => subcategory.id === catalogAdminSubcategoryId)) {
        setCatalogAdminSubcategoryId('')
      }
    }

    loadCatalogAdminSubcategories()
  }, [catalogAdminCategoryId, catalogAdminSubcategoryId, currentScreen, isPlatformAdmin])

  useEffect(() => {
    if (!isPlatformAdmin || currentScreen !== 'catalog' || !catalogAdminRealFranchiseId || !catalogAdminBrandId) {
      setCatalogAdminFranchises([])
      setCatalogAdminFranchiseId('')
      return
    }
    supabase.from('collectible_sets').select('collectible_set_id, name')
      .eq('franchise_id', catalogAdminRealFranchiseId)
      .eq('brand_id', catalogAdminBrandId)
      .order('name')
      .then(({ data, error }) => {
        if (error) { setCatalogAdminFormError(error.message || 'Could not load sets.'); return }
        const list = (data || []).map(r => ({ id: r.collectible_set_id, name: r.name || '' }))
        setCatalogAdminFranchises(list)
        setCatalogAdminFranchiseId(prev => list.some(s => s.id === prev) ? prev : '')
      })
  }, [catalogAdminRealFranchiseId, catalogAdminBrandId, currentScreen, isPlatformAdmin])

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
      setWishlistItemIds(new Set())
      return
    }

    let isCancelled = false

    const loadOwnedCatalogItems = async () => {
      const { data, error } = await supabase
        .from('owned_copies')
        .select('catalog_item_id, condition, grading_company, grade, cert_number, cert_number_normalized, acquisition_type, purchase_price, box_set_total_price, box_set_item_count, sale_price, metadata, created_at, visibility:sale_status')
        .eq('user_id', currentUser.id)
        .or('sale_status.is.null,sale_status.not.in.(sold,archived)')

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
  }, [currentUser?.id, collectionReloadToken])

  useEffect(() => {
    if (!currentUser?.id) return
    let cancelled = false
    supabase
      .from('wishlist_items')
      .select('catalog_item_id')
      .eq('user_id', currentUser.id)
      .then(({ data }) => {
        if (cancelled) return
        setWishlistItemIds(new Set((data || []).map((r) => r.catalog_item_id)))
      })
    return () => { cancelled = true }
  }, [currentUser?.id])

  useEffect(() => {
    if (currentScreen !== 'wishlist' || !currentUser?.id) {
      setWishlistItems([])
      setWishlistLoadError('')
      return
    }
    let cancelled = false
    setIsWishlistLoading(true)
    setWishlistLoadError('')
    const load = async () => {
      const { data: wishRows, error: wishErr } = await supabase
        .from('wishlist_items')
        .select('catalog_item_id')
        .eq('user_id', currentUser.id)
      if (wishErr || !Array.isArray(wishRows)) {
        if (!cancelled) { setWishlistLoadError(wishErr?.message || 'Could not load wishlist.'); setIsWishlistLoading(false) }
        return
      }
      if (wishRows.length === 0) {
        if (!cancelled) { setWishlistItems([]); setWishlistItemIds(new Set()); setIsWishlistLoading(false) }
        return
      }
      const itemIds = wishRows.map(r => r.catalog_item_id)
      const [{ data: detailRows }, categoriesResult, subcategoriesResult, { data: priceRows }] = await Promise.all([
        supabase.from('item_details').select('item_id, subject, collectible_set, print_type, card_number, print_count, description, category_id, subcategory_id, collectible_set_id, franchise_id, brand_id, front_image_path, release_year').in('item_id', itemIds),
        supabase.from('categories').select('category_id, name'),
        supabase.from('subcategories').select('subcategory_id, name'),
        supabase.from('items').select('item_id, market_price').in('item_id', itemIds),
      ])
      const categoryNameById = Object.fromEntries((categoriesResult.data || []).map(r => [r.category_id, r.name]))
      const subcategoryNameById = Object.fromEntries((subcategoriesResult.data || []).map(r => [r.subcategory_id, r.name]))
      const marketPriceById = Object.fromEntries((priceRows || []).map(r => [r.item_id, r.market_price ?? null]))
      const detailsById = {}
      for (const row of (detailRows || [])) {
        if (!row?.item_id) continue
        const na = v => (v && v !== 'N/A' ? v : '')
        const subjectName = na(row.subject)
        const setName = na(row.collectible_set)
        const printType = na(row.print_type)
        const cardNum = row.card_number && row.card_number !== 'N/A' ? `#${row.card_number}` : ''
        const nameParts = [subjectName, printType, cardNum].filter(Boolean)
        const fp = row.front_image_path
        const imageUrl = fp ? (fp.startsWith('http') ? fp : supabase.storage.from('item-images').getPublicUrl(fp).data?.publicUrl || '') : ''
        detailsById[row.item_id] = {
          id: row.item_id,
          name: nameParts.join(' — ') || row.description || 'Unnamed Item',
          imageUrl,
          setName: setName || '',
          categoryName: categoryNameById[row.category_id] || '',
          subcategoryName: subcategoryNameById[row.subcategory_id] || '',
          releaseYear: row.release_year || null,
          category_id: row.category_id,
          subcategory_id: row.subcategory_id,
          collectible_set_id: row.collectible_set_id,
          franchise_id: row.franchise_id,
          brand_id: row.brand_id,
          _set_name: setName || '',
          _brand_name: '',
          metadata: { image_url: imageUrl, set: setName || '' },
          dynamic_fields: {},
          description: row.description || '',
          card_number: row.card_number || '',
          print_count: row.print_count || null,
          market_price: marketPriceById[row.item_id] ?? null,
        }
      }
      const items = wishRows
        .map(r => ({ ...detailsById[r.catalog_item_id] }))
        .filter(i => i.id)
      if (!cancelled) {
        setWishlistItems(items)
        setWishlistItemIds(new Set(items.map(i => i.id)))
        setIsWishlistLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [currentScreen, currentUser?.id, wishlistReloadToken])

  useEffect(() => {
    if (catalogViewMode !== 'list' || catalogItems.length === 0) {
      setCatalogListStats({})
      setCatalogListPricing({})
      return
    }
    let cancelled = false
    const ids = catalogItems.map((i) => i.id)
    supabase.rpc('get_item_market_stats', { item_ids: ids }).then(({ data }) => {
      if (cancelled || !Array.isArray(data)) return
      const map = {}
      data.forEach((row) => { map[row.catalog_item_id] = row })
      setCatalogListStats(map)
    })
    // Pricing (retail / market) isn't in item_details, so fetch it from items directly.
    supabase.from('items').select('item_id, retail_price, market_price').in('item_id', ids).then(({ data }) => {
      if (cancelled || !Array.isArray(data)) return
      const map = {}
      data.forEach((row) => { map[row.item_id] = { retail: row.retail_price, market: row.market_price } })
      setCatalogListPricing(map)
    })
    return () => { cancelled = true }
  }, [catalogItems, catalogViewMode])

  // Item numbers (set number / minifig code) aren't in item_details; fetch from
  // items so cards can show an identifier instead of "Unassigned set". Runs for
  // both grid and list views.
  useEffect(() => {
    if (catalogItems.length === 0) { setCatalogItemNumbers({}); return }
    let cancelled = false
    const ids = catalogItems.map((i) => i.id)
    supabase.from('items').select('item_id, lego_set_number, minifig_code, bricklink_id, upc').in('item_id', ids).then(({ data }) => {
      if (cancelled || !Array.isArray(data)) return
      const map = {}
      for (const r of data) map[r.item_id] = r.lego_set_number || r.minifig_code || r.bricklink_id || r.upc || ''
      setCatalogItemNumbers(map)
    })
    return () => { cancelled = true }
  }, [catalogItems])

  // Community/theme analytics for the Context panel (when a single theme is selected).
  const catalogThemeFranchiseId = selectedCatalogFranchiseRecord?.id || ''
  useEffect(() => {
    if (!catalogThemeFranchiseId) { setCatalogThemeStats(null); return }
    let cancelled = false
    supabase.rpc('get_theme_stats', { p_franchise_id: catalogThemeFranchiseId }).then(({ data, error }) => {
      if (cancelled) return
      setCatalogThemeStats(error ? null : (data || null))
    })
    return () => { cancelled = true }
  }, [catalogThemeFranchiseId])

  // Measure the stacked sticky bars (blue header → catalog head → quick-add) so
  // each one — and the pinned side panels — offsets correctly below the ones above.
  useEffect(() => {
    if (currentScreen !== 'catalog') return
    const root = document.documentElement
    const setVars = () => {
      const h = (sel) => { const el = document.querySelector(sel); return el ? el.offsetHeight : 0 }
      const topbarH    = h('.topbar')
      const stickyTopH = h('.catalog-sticky-top')
      root.style.setProperty('--sticky-topbar-h', `${Math.round(topbarH)}px`)
      root.style.setProperty('--sticky-cols-top', `${Math.round(topbarH + stickyTopH)}px`)
    }
    setVars()
    const ro = new ResizeObserver(setVars)
    for (const sel of ['.topbar', '.catalog-sticky-top']) { const el = document.querySelector(sel); if (el) ro.observe(el) }
    window.addEventListener('resize', setVars)
    return () => { ro.disconnect(); window.removeEventListener('resize', setVars) }
  }, [currentScreen, catalogViewMode, currentUser, quickAddMode])

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
          .or('sale_status.is.null,sale_status.not.in.(sold,archived)')
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
        const catalogItemIdChunks = []
        for (let index = 0; index < catalogItemIds.length; index += 150) {
          catalogItemIdChunks.push(catalogItemIds.slice(index, index + 150))
        }

        const catalogRowsByChunk = await Promise.all(catalogItemIdChunks.map((chunk) => (
          supabase
            .from('item_details')
            .select('*')
            .in('item_id', chunk)
        )))

        const normalizeDelimitedList = (value) => {
          if (Array.isArray(value)) {
            return value.map((entry) => (typeof entry === 'string' ? entry.trim() : '')).filter(Boolean)
          }
          if (typeof value === 'string') {
            return value.split(',').map((entry) => entry.trim()).filter((entry) => entry && entry.toUpperCase() !== 'N/A')
          }
          return []
        }

        const catalogRows = catalogRowsByChunk.flatMap((result) => (Array.isArray(result.data) ? result.data : []))
        const catalogRowsError = catalogRowsByChunk.find((result) => result.error)?.error || null

        if (!catalogRowsError && Array.isArray(catalogRows)) {
          catalogItemsById = catalogRows.reduce((accumulator, row) => {
            if (row?.item_id) {
              const na = (v) => (v && v !== 'N/A' ? v : '')
              const subjectName = na(row.subject)
              const setName     = na(row.collectible_set)
              const printType   = na(row.print_type)
              const description = na(row.description)
              const cardNum     = row.card_number && row.card_number !== 'N/A' ? `#${row.card_number}` : ''
              // The variant/description distinguishes otherwise identically-named
              // items (e.g. two "Princess Leia" figures). Cards already encode their
              // variant via print type + card number, so only append it when neither
              // is present — that's what was dropping Toy variants from the name.
              const hasCardVariant = Boolean(printType || cardNum)
              const variant     = !hasCardVariant && description && description.toLowerCase() !== subjectName.toLowerCase() ? description : ''
              const nameParts   = [subjectName, printType, cardNum, variant].filter(Boolean)
              const fp          = row.front_image_path
              const imageUrl    = fp
                ? fp.startsWith('http')
                  ? fp
                  : supabase.storage.from('item-images').getPublicUrl(fp).data?.publicUrl || ''
                : ''
              accumulator[row.item_id] = {
                id:                row.item_id,
                name:              nameParts.join(' — ') || description || 'Unnamed Item',
                description,
                // Was hard-coded null, so every collection card rendered "Year N/A".
                release_year:      row.release_year || null,
                category_id:       row.category_id,
                subcategory_id:    row.subcategory_id,
                collectible_set_id: row.collectible_set_id,
                rarity_id:         row.rarity_id || null,
                franchise:         na(row.franchise),
                brand:             na(row.brand),
                metadata:          { image_url: imageUrl, set: setName },
                dynamic_fields:    {},
                teams:             normalizeDelimitedList(row.teams),
                species:           typeof row.species === 'string' ? row.species : '',
              }
            }
            return accumulator
          }, {})
        }
      }

      const [categoriesResult, subcategoriesResult] = await Promise.all([
        supabase.from('categories').select('category_id, name'),
        supabase.from('subcategories').select('subcategory_id, name'),
      ])

      const categoryNameById = Array.isArray(categoriesResult.data)
        ? categoriesResult.data.reduce((accumulator, row) => {
            if (row?.category_id) {
              accumulator[row.category_id] = row.name || ''
            }
            return accumulator
          }, {})
        : {}

      const subcategoryNameById = Array.isArray(subcategoriesResult.data)
        ? subcategoriesResult.data.reduce((accumulator, row) => {
            if (row?.subcategory_id) {
              accumulator[row.subcategory_id] = row.name || ''
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
            franchiseName: resolvedCatalogItem?.franchise || '',
            brandName: resolvedCatalogItem?.brand || '',
            subtheme: resolvedCatalogItem?.collectible_set || '',
            teams: Array.isArray(resolvedCatalogItem?.teams)
              ? resolvedCatalogItem.teams
              : typeof resolvedCatalogItem?.teams === 'string'
                ? resolvedCatalogItem.teams.split(',').map((s) => s.trim()).filter((s) => s && s.toUpperCase() !== 'N/A')
                : [],
            species: resolvedCatalogItem?.species || '',
            conditions: new Set(),
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
          brandName: resolvedCatalogItem?.brand || '',
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
        if (typeof row?.condition === 'string' && row.condition.trim()) {
          aggregate.conditions.add(row.condition.trim())
        }

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
          conditions: Array.from(item.conditions),
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
      // The item counts drive every "X of Y" total. PostgREST caps a single
      // response at 1000 rows, so page through ALL items — otherwise the catalog
      // (9k+ items) is silently truncated and set/category totals come out wrong.
      const fetchAllItemsWithSet = async () => {
        const pageSize = 1000
        let fromIdx = 0
        const all = []
        for (;;) {
          const { data, error } = await supabase
            .from('items')
            .select('collectible_set_id, category_id, subcategory_id, franchise_id, brand_id')
            .not('collectible_set_id', 'is', null)
            .range(fromIdx, fromIdx + pageSize - 1)
          if (error || !data?.length) break
          all.push(...data)
          if (data.length < pageSize) break
          fromIdx += pageSize
        }
        return all
      }
      const [collectibleSetsResult, collectibleSetEntriesResult, trackedGoalsResult, itemRows, categoriesResult, subcategoriesResult, brandsResult, franchisesResult] = await Promise.all([
        supabase
          .from('collectible_sets')
          .select('collectible_set_id, name')
          .order('name', { ascending: true }),
        supabase
          .from('subcollectible_sets')
          .select('subcollectble_set_id, collectible_set_id, name')
          .order('name', { ascending: true }),
        supabase
          .from('user_collection_goals')
          .select('id, collection_id, collectible_set_id, title, notes, is_active, created_at')
          .eq('user_id', currentUser.id)
          .eq('goal_type', 'set_completion')
          .not('collectible_set_id', 'is', null)
          .eq('is_active', true)
          .order('created_at', { ascending: true }),
        fetchAllItemsWithSet(),
        supabase.from('categories').select('category_id, name'),
        supabase.from('subcategories').select('subcategory_id, name'),
        supabase.from('brands').select('brand_id, name'),
        supabase.from('franchises').select('franchise_id, name'),
      ])

      const itemCountBySetId = {}
      const setMetaById = {}
      for (const r of (itemRows || [])) {
        itemCountBySetId[r.collectible_set_id] = (itemCountBySetId[r.collectible_set_id] || 0) + 1
        if (!setMetaById[r.collectible_set_id]) {
          setMetaById[r.collectible_set_id] = { category_id: r.category_id, subcategory_id: r.subcategory_id, franchise_id: r.franchise_id, brand_id: r.brand_id }
        } else {
          const meta = setMetaById[r.collectible_set_id]
          if (!meta.franchise_id && r.franchise_id) meta.franchise_id = r.franchise_id
          if (!meta.category_id && r.category_id) meta.category_id = r.category_id
          if (!meta.subcategory_id && r.subcategory_id) meta.subcategory_id = r.subcategory_id
          if (!meta.brand_id && r.brand_id) meta.brand_id = r.brand_id
        }
      }
      const categoryById = (categoriesResult.data || []).reduce((acc, r) => { acc[r.category_id] = r.name; return acc }, {})
      const subcategoryById = (subcategoriesResult.data || []).reduce((acc, r) => { acc[r.subcategory_id] = r.name; return acc }, {})
      const brandById = (brandsResult.data || []).reduce((acc, r) => { acc[r.brand_id] = r.name; return acc }, {})
      const franchiseById = (franchisesResult.data || []).reduce((acc, r) => { acc[r.franchise_id] = r.name; return acc }, {})

      if (isCancelled) {
        return
      }

      setCollectibleSets(
        Array.isArray(collectibleSetsResult.data)
          ? collectibleSetsResult.data.map(r => {
              const meta = setMetaById[r.collectible_set_id] || {}
              return {
              id:               r.collectible_set_id,
              set_name:         r.name || '',
              brand_name:       brandById[meta.brand_id] || '',
              category_name:    categoryById[meta.category_id] || '',
              subcategory_name: subcategoryById[meta.subcategory_id] || '',
              franchise_name:   franchiseById[meta.franchise_id] || '',
              total_items:      itemCountBySetId[r.collectible_set_id] || 0,
              total_estimated_value: 0,
              breakdown: null,
              metadata:  {},
            }})
          : [],
      )
      setCollectibleSetEntries(
        Array.isArray(collectibleSetEntriesResult.data)
          ? collectibleSetEntriesResult.data.map(r => ({
              id:                  r.subcollectble_set_id,
              collectible_set_id:  r.collectible_set_id,
              catalog_item_id:     null,
              item_key:            r.name || '',
              item_name:           r.name || '',
              rarity:              null,
              estimated_market_price: null,
              metadata:            {},
            }))
          : [],
      )
      setTrackedCollectionGoals(Array.isArray(trackedGoalsResult.data) ? trackedGoalsResult.data : [])
    }

    loadCompletionData()

    return () => {
      isCancelled = true
    }
  }, [currentUser?.id, goalReloadToken])

  // Load every LEGO set (item with brand "Sets" under Building Blocks) plus the
  // minifigs linked to it via set_minifigs. Completion = minifigs owned / total.
  // Shows all themes/sets regardless of ownership.
  useEffect(() => {
    if (collectionViewTab !== 'completion') return
    let cancelled = false
    const loadAllPaged = async (build) => {
      const out = []
      for (let from = 0; ; from += 1000) {
        const { data, error } = await build().range(from, from + 999)
        if (error || !data?.length) break
        out.push(...data)
        if (data.length < 1000) break
      }
      return out
    }
    const load = async () => {
      const [{ data: bbCat }, { data: brandRows }] = await Promise.all([
        supabase.from('categories').select('category_id').ilike('name', 'Building Blocks').maybeSingle(),
        supabase.from('brands').select('brand_id, name').in('name', ['Sets', 'Minifigs', 'Miscellaneous']),
      ])
      if (!bbCat) { if (!cancelled) setCompletionLegoSets([]); return }
      const brandNameById = {}
      for (const b of (brandRows || [])) if (!brandNameById[b.brand_id]) brandNameById[b.brand_id] = b.name
      // All LEGO items with their facets: subtheme (subset_id) is single; product
      // lines are many-to-many (item_product_lines).
      const items = await loadAllPaged(() =>
        supabase.from('items').select('item_id, brand_id, franchise_id, subset_id').eq('category_id', bbCat.category_id))
      const itemBrand = (i) => brandNameById[i.brand_id] || ''
      const itemIdList = items.map(i => i.item_id)
      const chunkedIn = async (table, col, sel, ids) => {
        const out = []
        for (let i = 0; i < ids.length; i += 200) {
          const { data } = await supabase.from(table).select(sel).in(col, ids.slice(i, i + 200))
          if (data) out.push(...data)
        }
        return out
      }
      const franchiseIds = [...new Set(items.map(s => s.franchise_id).filter(Boolean))]
      const subsetIds = [...new Set(items.map(s => s.subset_id).filter(Boolean))]
      const [franchises, subsets, iplRows] = await Promise.all([
        franchiseIds.length ? chunkedIn('franchises', 'franchise_id', 'franchise_id, name', franchiseIds) : [],
        subsetIds.length ? chunkedIn('subsets', 'subset_id', 'subset_id, name', subsetIds) : [],
        itemIdList.length ? chunkedIn('item_product_lines', 'item_id', 'item_id, product_lines(name)', itemIdList) : [],
      ])
      const franchiseName = Object.fromEntries(franchises.map(f => [f.franchise_id, f.name]))
      const subsetName = Object.fromEntries(subsets.map(s => [s.subset_id, s.name]))
      const productLinesByItem = {}
      for (const r of iplRows) {
        const nm = r.product_lines?.name
        if (nm) (productLinesByItem[r.item_id] ||= []).push(nm)
      }
      const themeName = (fid) => (fid ? franchiseName[fid] : '') || 'Unknown Theme'
      // Leaf collection per (theme × item type × subtheme × product line). An item
      // with several product lines appears under each; with none, under '' (so the
      // orange cards land at whatever facet is deepest for that theme).
      const leaf = new Map()
      for (const it of items) {
        const theme = themeName(it.franchise_id)
        const brand = itemBrand(it)
        if (!brand) continue
        const subtheme = it.subset_id ? (subsetName[it.subset_id] || '') : ''
        const pls = (productLinesByItem[it.item_id] || [])
        const plKeys = pls.length ? pls : ['']
        for (const pl of plKeys) {
          const key = `${theme}|||${brand}|||${subtheme}|||${pl}`
          if (!leaf.has(key)) leaf.set(key, { theme, brand, subtheme, productLine: pl, itemIds: new Set() })
          leaf.get(key).itemIds.add(it.item_id)
        }
      }
      const cards = [...leaf.entries()].map(([key, g]) => ({
        id: key,
        title: g.productLine || g.subtheme || `All ${g.brand}`,
        franchiseName: g.theme,
        brandName: g.brand,
        subthemeName: g.subtheme,
        productLineName: g.productLine,
        itemIds: [...g.itemIds],
      }))
      if (!cancelled) setCompletionLegoSets(cards)
    }
    load()
    return () => { cancelled = true }
  }, [collectionViewTab, goalReloadToken])

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
          options: { emailRedirectTo: `${window.location.origin}/` },
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

  const handleSendFriendRequest = async (targetUserId) => {
    if (!currentUser?.id || !targetUserId) return
    const { data } = await supabase.from('friendships').insert({ requester_id: currentUser.id, addressee_id: targetUserId }).select('id').single()
    if (data) {
      setProfileSentToIds(prev => new Set([...prev, targetUserId]))
      setFriendSearchResults(prev => prev.map(u => u.id === targetUserId ? { ...u, _sent: true } : u))
    }
  }

  const handleAcceptFriendRequest = async (req) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', req.friendshipId)
    setProfileFriendRequests(prev => prev.filter(r => r.friendshipId !== req.friendshipId))
    setProfileFriends(prev => [...prev, { ...req }])
  }

  const handleDeclineFriendRequest = async (friendshipId) => {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    setProfileFriendRequests(prev => prev.filter(r => r.friendshipId !== friendshipId))
  }

  const handleRemoveFriend = async (friendshipId, userId) => {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    setProfileFriends(prev => prev.filter(f => f.friendshipId !== friendshipId))
    setProfileSentToIds(prev => { const next = new Set(prev); next.delete(userId); return next })
  }

  const handleFriendSearch = async (query) => {
    setFriendSearchQuery(query)
    if (!query.trim()) { setFriendSearchResults([]); return }
    setFriendSearchLoading(true)
    const { data } = await supabase.from('profiles').select('id, display_name, avatar_url').ilike('display_name', `%${query.trim()}%`).neq('id', currentUser.id).limit(10)
    setFriendSearchResults(data || [])
    setFriendSearchLoading(false)
  }

  const handleOpenProfileItem = async (item) => {
    let categoryName = catalogCategoryById[item.category_id] || ''
    let subcategoryName = catalogSubcategoryById[item.subcategory_id] || ''
    if (!categoryName && item.category_id) {
      const { data } = await supabase.from('categories').select('name').eq('category_id', item.category_id).maybeSingle()
      categoryName = data?.name || ''
    }
    if (!subcategoryName && item.subcategory_id) {
      const { data } = await supabase.from('subcategories').select('name').eq('subcategory_id', item.subcategory_id).maybeSingle()
      subcategoryName = data?.name || ''
    }
    setSelectedCatalogItem({
      ...item,
      id: item.item_id,
      categoryName,
      subcategoryName,
      brandName: '',
      franchiseName: '',
      setName: item.collectible_set || '',
      imageUrl: '',
    })
    setCatalogItemOrigin('profile')
    setCurrentScreen('catalog_item')
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    const categoryName     = catalogCategoryById[item.category_id] || 'Uncategorized'
    const subcategoryName  = catalogSubcategoryById[item.subcategory_id] || 'Uncategorized'
    const franchiseName    = item._set_name || 'Unassigned set'
    const franchiseBrandName = item._franchise_name || ''
    const brandName        = item._brand_name || (item.brand_id ? catalogBrandById[item.brand_id] || 'Unknown brand' : '')
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

    // Load set navigation context if the item belongs to a set
    const setId = item.collectible_set_id || item._details?.collectible_set_id || null
    if (setId) {
      setCatalogSetNavItems([])
      setCatalogSetNavIndex(-1)
      supabase
        .from('item_details')
        .select('item_id, subject, collectible_set, print_type, card_number, front_image_path, category_id, subcategory_id, franchise_id, brand_id, collectible_set_id, description, release_year')
        .eq('collectible_set_id', setId)
        .order('card_number', { ascending: true, nullsFirst: false })
        .then(({ data }) => {
          if (!data || data.length < 2) return
          const navItems = data.map(r => {
            const na = (v) => (v && v !== 'N/A' ? v : '')
            const fp = r.front_image_path
            const imageUrl = fp ? (fp.startsWith('http') ? fp : supabase.storage.from('item-images').getPublicUrl(fp).data?.publicUrl || '') : ''
            return {
              id: r.item_id,
              name: [na(r.subject), na(r.print_type), r.card_number && r.card_number !== 'N/A' ? `#${r.card_number}` : ''].filter(Boolean).join(' — ') || na(r.subject) || 'Unknown',
              imageUrl,
              raw: r,
            }
          })
          const idx = navItems.findIndex(n => n.id === item.id)
          setCatalogSetNavItems(navItems)
          setCatalogSetNavIndex(idx)
        })
    } else {
      setCatalogSetNavItems([])
      setCatalogSetNavIndex(-1)
    }
  }

  const resetAddToCollectionForm = () => {
    setCollectionAcquisitionType('direct')
    setCollectionPurchasePriceInput('')
    setCollectionBoxSetTotalInput('')
    setCollectionBoxSetItemCountInput('')
    setCollectionPurchaseError('')
  }

  // Load the minifigs connected to a set (used by the add modal from any entry
  // point — detail, grid, completion — since the detail effect only runs on the
  // item screen).
  // Child items CONTAINED BY a catalogue item — parent → child direction only, so
  // adding a child never pulls in its parent. Category-agnostic: the universal
  // catalog_item_relationships table is the source of truth for every category, and
  // legacy set_minifigs is still read so existing LEGO links keep working unchanged.
  const fetchConnectedMinifigs = async (parentItemId) => {
    if (!parentItemId) return []
    const [{ data: relRows }, { data: smRows }] = await Promise.all([
      supabase.from('catalog_item_relationships')
        .select('child_item_id, quantity').eq('parent_item_id', parentItemId).eq('relationship_type', 'includes'),
      supabase.from('set_minifigs').select('minifig_item_id, quantity').eq('set_item_id', parentItemId),
    ])
    const qtyById = new Map()
    for (const r of relRows || []) qtyById.set(r.child_item_id, Math.max(qtyById.get(r.child_item_id) || 0, Number(r.quantity) || 1))
    for (const r of smRows || []) qtyById.set(r.minifig_item_id, Math.max(qtyById.get(r.minifig_item_id) || 0, Number(r.quantity) || 1))
    const childIds = [...qtyById.keys()]
    if (!childIds.length) return []
    const { data: childItems } = await supabase.from('items')
      .select('item_id, name, description, rebrickable_fig_id, minifig_code, lego_set_number, subject_id, image_path').in('item_id', childIds)
    const subjIds = [...new Set((childItems || []).map(f => f.subject_id).filter(Boolean))]
    const { data: subs } = subjIds.length ? await supabase.from('subjects').select('subject_id, subject_name').in('subject_id', subjIds) : { data: [] }
    const subjName = Object.fromEntries((subs || []).map(s => [s.subject_id, s.subject_name]))
    const byId = Object.fromEntries((childItems || []).map(f => [f.item_id, f]))
    return childIds.map(id => {
      const it = byId[id] || {}
      const displayName = it.name || subjName[it.subject_id] || it.description || 'Item'
      const variant = it.description && it.description.trim().toLowerCase() !== displayName.trim().toLowerCase() ? it.description.trim() : null
      return {
        item_id: id, quantity: qtyById.get(id) || 1, name: displayName, variant,
        code: it.minifig_code || it.lego_set_number || null,
        figNum: it.rebrickable_fig_id || null, image_path: it.image_path || null,
      }
    }).sort((a, b) => a.name.localeCompare(b.name))
  }

  const handleOpenAddToCollectionModal = async (itemIdOverride = null) => {
    resetAddToCollectionForm()
    // Callers may setSelectedCatalogItem() in the same tick, so accept the id
    // explicitly rather than relying on the (still-stale) state value.
    const itemId = itemIdOverride || selectedCatalogItem?.id || null
    // Retail pre-fill (MSRP) — use the loaded value on the detail screen, else fetch.
    let retail = catalogDetailLego?.retail_price
    if ((retail == null || retail === '') && itemId) {
      const { data: rp } = await supabase.from('items').select('retail_price').eq('item_id', itemId).maybeSingle()
      retail = rp?.retail_price
    }
    if (retail != null && retail !== '') setCollectionPurchasePriceInput(String(Number(retail)))
    setIsAddToCollectionModalOpen(true)
    // Load connected minifigs on-demand so the include checklist appears no matter
    // how the modal was opened, then default them all to included.
    const list = await fetchConnectedMinifigs(itemId)
    setCatalogDetailSetMinifigs(list)
    setCollectionMinifigInclusion(Object.fromEntries(list.map(m => [m.item_id, true])))
  }

  // Open another catalog item's detail screen by id (used by the set→minifig links).
  const openCatalogItemById = async (itemId) => {
    if (!itemId) return
    const { data } = await supabase.from('item_details').select('*').eq('item_id', itemId).maybeSingle()
    if (!data) return
    setSelectedCatalogItem({
      id: itemId,
      _details: data,
      categoryName: data.category || '',
      subcategoryName: data.subcategory || '',
      name: data.subject || data.description || 'Item',
      front_image_path: data.front_image_path || null,
      metadata: {},
    })
    setCurrentScreen('catalog_item')
    if (typeof window !== 'undefined') window.scrollTo?.(0, 0)
  }

  // Admin: search LEGO items to link. kind='minifig' → figs (have rebrickable);
  // kind='set' → sets (have lego_set_number). Matches name/code/number/description.
  const searchLegoItemsToLink = async (term, kind) => {
    const q = (term || '').trim()
    if (q.length < 2) return []
    // Identify item type by Brand (Minifigs / Sets), not by Rebrickable id — manual
    // minifigs have no fig-num. And scope to the same Theme (franchise) as this item.
    const franchiseId = selectedCatalogItem?._details?.franchise_id || null
    const { data: brandRow } = await supabase.from('brands').select('brand_id').ilike('name', kind === 'minifig' ? 'Minifigs' : 'Sets').limit(1).maybeSingle()
    const brandId = brandRow?.brand_id || null

    const { data: subjRows } = await supabase.from('subjects').select('subject_id, subject_name').ilike('subject_name', `%${q}%`).limit(30)
    const subjById = Object.fromEntries((subjRows || []).map(s => [s.subject_id, s.subject_name]))
    const parts = [`minifig_code.ilike.%${q}%`, `rebrickable_fig_id.ilike.%${q}%`, `lego_set_number.ilike.%${q}%`, `description.ilike.%${q}%`]
    if (Object.keys(subjById).length) parts.push(`subject_id.in.(${Object.keys(subjById).join(',')})`)

    const bl = `bricklink_id.ilike.%${q}%`
    let iq = supabase.from('items').select('item_id, description, minifig_code, rebrickable_fig_id, bricklink_id, lego_set_number, subject_id').or([...parts, bl].join(','))
    if (brandId) iq = iq.eq('brand_id', brandId)
    if (franchiseId) iq = iq.eq('franchise_id', franchiseId)
    const { data } = await iq.limit(25)
    return (data || [])
      .filter(it => it.item_id !== selectedCatalogItem?.id)
      .map(it => ({
        id: it.item_id,
        name: subjById[it.subject_id] || it.description || (kind === 'set' ? it.lego_set_number : it.rebrickable_fig_id) || 'Item',
        // The identifying "minifig number" — our internal code, else BrickLink id, else Rebrickable.
        code: it.minifig_code || it.bricklink_id || it.rebrickable_fig_id || it.lego_set_number || null,
      }))
  }

  const addSetMinifigLink = async (setItemId, minifigItemId, quantity) => {
    if (!setItemId || !minifigItemId || isSavingLink) return
    setIsSavingLink(true)
    const { error } = await supabase.from('set_minifigs').upsert(
      { set_item_id: setItemId, minifig_item_id: minifigItemId, quantity: Number(quantity) || 1 },
      { onConflict: 'set_item_id,minifig_item_id' })
    setIsSavingLink(false)
    if (!error) {
      setLinkSearch(''); setLinkResults([]); setLinkQty('1')
      setCatalogItemImagesReloadToken(n => n + 1)
    }
  }

  const removeSetMinifigLink = async (setItemId, minifigItemId) => {
    await supabase.from('set_minifigs').delete().eq('set_item_id', setItemId).eq('minifig_item_id', minifigItemId)
    setCatalogItemImagesReloadToken(n => n + 1)
  }

  const performQuickAdd = async (itemArg) => {
    const itemId = typeof itemArg === 'string' ? itemArg : (itemArg?.id || itemArg?.item_id)
    if (!currentUser?.id || !itemId) return
    // A set with connected minifigs routes through the modal so the user can choose
    // which minifigs to include — quick-add can't ask on its own.
    if (typeof itemArg !== 'string') {
      // Any category: does this item contain children? (parent → child only)
      const [{ data: relCheck }, { data: smCheck }] = await Promise.all([
        supabase.from('catalog_item_relationships').select('child_item_id').eq('parent_item_id', itemId).eq('relationship_type', 'includes').limit(1),
        supabase.from('set_minifigs').select('minifig_item_id').eq('set_item_id', itemId).limit(1),
      ])
      if (relCheck?.length || smCheck?.length) {
        setSelectedCatalogItem({
          ...itemArg,
          id: itemId,
          categoryName: itemArg.categoryName || catalogCategoryById[itemArg.category_id] || itemArg._details?.category || '',
          subcategoryName: itemArg.subcategoryName || catalogSubcategoryById[itemArg.subcategory_id] || itemArg._details?.subcategory || '',
          brandName: itemArg.brandName || itemArg._brand_name || itemArg._details?.brand || '',
        })
        await handleOpenAddToCollectionModal(itemId)
        return
      }
    }
    const isGift = quickAddMode === 'gift'
    const price = isGift ? 0 : Number(quickAddPrice)
    if (!isGift && (!Number.isFinite(price) || price < 0)) return
    try {
      const collectionId = await getOrCreateDefaultCollectionId(currentUser.id)
      const { error } = await supabase.from('owned_copies').insert({
        collection_id: collectionId,
        user_id: currentUser.id,
        catalog_item_id: itemId,
        acquisition_type: isGift ? 'gift' : 'direct',
        purchase_price: price,
        purchase_date: new Date().toISOString().slice(0, 10),
        metadata: { source: 'quick_add' },
      })
      if (error) throw error
      setOwnedCatalogItemCounts(prev => ({ ...prev, [itemId]: (Number(prev[itemId]) || 0) + 1 }))
      if (price >= 0) {
        setOwnedCatalogItemPurchases(prev => ({
          ...prev,
          [itemId]: [...(Array.isArray(prev[itemId]) ? prev[itemId] : []), {
            acquisitionType: isGift ? 'gift' : 'direct',
            unitPrice: price,
          }],
        }))
      }
    } catch (err) {
      console.error('Quick add failed:', err)
    }
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
    // LEGO sub-condition — prune to only the fields relevant to the chosen condition.
    const legoConditionMeta = isLegoConditionCategory ? (() => {
      const lc = catalogDetailLegoCond || {}
      const out = {}
      const cond = selectedCondition || ''
      if (cond.includes('Sealed') && isLegoSet && lc.boxGrade) out.box_grade = lc.boxGrade
      if (cond.includes('Incomplete') && lc.completenessPct !== '' && lc.completenessPct != null) {
        const n = Number(lc.completenessPct)
        if (Number.isFinite(n)) out.completeness_pct = n
      }
      if (isLegoSet) {
        if (lc.instructions) out.instructions = lc.instructions
        if (lc.box) out.box = lc.box
        if (lc.minifigs) out.minifigs_present = lc.minifigs
        // Per-minifig inclusion. A sealed set auto-includes all as New / Sealed (MISB).
        if (catalogDetailSetMinifigs.length) {
          const sealed = cond.includes('Sealed')
          out.minifigs = catalogDetailSetMinifigs.map(m => ({
            item_id: m.item_id,
            name: m.name,
            included: sealed ? true : (collectionMinifigInclusion[m.item_id] ?? true),
            condition: sealed ? 'New / Sealed (MISB)' : null,
          }))
        }
      }
      if (isLegoMinifig) {
        if (lc.accessories) out.accessories = lc.accessories
        if (lc.assembly) out.assembly = lc.assembly
      }
      return Object.keys(out).length ? out : null
    })() : null
    // Included child items (parent → child). Category-agnostic: ANY catalogue item
    // with children offers them for inclusion, not just LEGO sets. A sealed parent
    // auto-includes everything. This replaces the old isLegoSet-only path.
    const includedChildren = catalogDetailSetMinifigs.length
      ? catalogDetailSetMinifigs.map((m) => {
          const sealed = (selectedCondition || '').includes('Sealed')
          return {
            item_id: m.item_id,
            name: m.name,
            quantity: m.quantity || 1,
            included: sealed ? true : (collectionMinifigInclusion[m.item_id] ?? true),
            condition: sealed ? 'New / Sealed (MISB)' : null,
          }
        })
      : []
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
        ...(legoConditionMeta ? { lego: legoConditionMeta } : {}),
      },
    }

    const { data: insertedSetCopy, error: insertOwnedCopyError } = await supabase
      .from('owned_copies')
      .insert(baseItemPayload)
      .select('id')
      .single()

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

    // Included children become individually-owned copies, one per physical instance
    // (a child at ×2 → 2 copies), tagged with provenance back to this parent so the
    // sell flow can offer to include them. Price stays on the parent. Works for every
    // category — a LEGO set's minifigs, a Toy multipack's figures, a value pack's sets.
    if (includedChildren.length) {
      const figCopies = []
      for (const mf of includedChildren) {
        if (!mf.included) continue
        const qty = mf.quantity || 1
        for (let i = 0; i < qty; i++) {
          figCopies.push({
            collection_id: collectionId,
            user_id: currentUser.id,
            catalog_item_id: mf.item_id,
            condition: mf.condition || null,
            acquisition_type: purchaseDetails?.acquisitionType || 'direct',
            purchase_price: 0,
            purchase_date: new Date().toISOString().slice(0, 10),
            metadata: {
              source: 'set_inclusion',
              from_set: {
                set_catalog_item_id: selectedCatalogItem.id,
                set_owned_copy_id: insertedSetCopy?.id || null,
              },
            },
          })
        }
      }
      if (figCopies.length) {
        const { error: figErr } = await supabase.from('owned_copies').insert(figCopies)
        if (figErr) {
          console.error('Failed to add included minifigs:', figErr)
        } else {
          const added = {}
          for (const c of figCopies) added[c.catalog_item_id] = (added[c.catalog_item_id] || 0) + 1
          setOwnedCatalogItemCounts((counts) => {
            const next = { ...counts }
            for (const [id, n] of Object.entries(added)) next[id] = (Number(next[id]) || 0) + n
            return next
          })
        }
      }
    }

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

    setCollectionReloadToken((t) => t + 1)
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

  const handleOpenWishlist = (event) => {
    if (!currentUser) { handleProtectedNavClick(event); return }
    event.preventDefault()
    setCurrentScreen('wishlist')
    setIsUserMenuOpen(false)
  }

  const handleWishlistRemove = async (itemId) => {
    await supabase.from('wishlist_items').delete().eq('user_id', currentUser.id).eq('catalog_item_id', itemId)
    setWishlistItems(prev => prev.filter(i => i.id !== itemId))
    setWishlistItemIds(prev => { const next = new Set(prev); next.delete(itemId); return next })
    setWishlistRemoveConfirmId('')
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

  const handleUpdateCollectionCopyCondition = async (newCondition) => {
    if (!currentUser?.id || !selectedCollectionCopyRow?.id || isSavingCopyCondition) return
    setIsSavingCopyCondition(true)
    try {
      const { error } = await supabase
        .from('owned_copies')
        .update({ condition: newCondition || null })
        .eq('id', selectedCollectionCopyRow.id)
        .eq('user_id', currentUser.id)
      if (error) throw error
      setCollectionReloadToken((token) => token + 1)
    } catch (error) {
      console.error('Update copy condition failed:', error)
    } finally {
      setIsSavingCopyCondition(false)
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
      // Bundle the owned connected minifigs the seller chose to include.
      const includedMinifigs = sellConnectedMinifigs.filter(m => sellMinifigInclusion[m.ownedCopyId])
      if (includedMinifigs.length) {
        nextMetadata.included_minifig_copies = includedMinifigs.map(m => ({
          owned_copy_id: m.ownedCopyId,
          catalog_item_id: m.catalogItemId,
          name: m.name,
        }))
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
      .from('subcategories')
      .insert({ name, category_id: catalogAdminCategoryId })
      .select('subcategory_id')
      .single()
    if (error) {
      setCatalogAdminFormError(error.message || 'Could not create subcategory.')
      setCatalogAdminIsSavingSubcategory(false)
      return
    }
    const newSub = { id: data.subcategory_id, name, category_id: catalogAdminCategoryId }
    setCatalogAdminSubcategories(prev => [...prev, newSub].sort((a, b) => a.name.localeCompare(b.name)))
    setCatalogAdminSubcategoryId(data.subcategory_id)
    setCatalogAdminNewSubcategoryName('')
    setCatalogAdminIsCreatingSubcategory(false)
    setCatalogAdminIsSavingSubcategory(false)
  }

  const handleCreateCatalogFranchise = async () => {
    const name = catalogAdminNewFranchiseName.trim()
    if (!name || !catalogAdminCategoryId || !catalogAdminSubcategoryId) return

    setCatalogAdminIsSavingFranchise(true)
    setCatalogAdminFormError('')

    const { data: newSet, error } = await supabase
      .from('collectible_sets')
      .insert({ name })
      .select('collectible_set_id')
      .single()

    if (error) {
      setCatalogAdminFormError(error.message || 'Could not create franchise.')
      setCatalogAdminIsSavingFranchise(false)
      return
    }

    const newId = newSet.collectible_set_id
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

    const { data: newBrandRow, error } = await supabase
      .from('brands')
      .insert({ name })
      .select('brand_id')
      .single()

    if (error) {
      setCatalogAdminFormError(error.message || 'Could not create brand.')
      setCatalogAdminIsSavingBrand(false)
      return
    }

    const newId = newBrandRow.brand_id

    if (catalogAdminRealFranchiseId) {
      await supabase.from('brand_franchise').insert({ brand_id: newId, franchise_id: catalogAdminRealFranchiseId }).select().maybeSingle()
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

  const handleToggleCatalogBulkSelect = (itemId) => {
    if (!itemId) return
    setCatalogBulkSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
    setCatalogBulkEditError('')
    setCatalogBulkEditMessage('')
  }

  const handleSelectAllCatalogPageItems = () => {
    setCatalogBulkSelectedIds((current) => {
      const next = new Set(current)
      for (const itemId of paginatedCatalogItemIds) next.add(itemId)
      return next
    })
    setCatalogBulkEditError('')
    setCatalogBulkEditMessage('')
  }

  const handleClearCatalogBulkSelection = () => {
    setCatalogBulkSelectedIds(new Set())
    setCatalogBulkEditError('')
    setCatalogBulkEditMessage('')
  }

  const handleApplyCatalogBulkEdit = async () => {
    const selectedIds = Array.from(catalogBulkSelectedIds)
    if (selectedIds.length === 0) {
      setCatalogBulkEditError('Select at least one item first.')
      return
    }

    if (selectedCatalogBulkFranchiseIds.length !== 1) {
      setCatalogBulkEditError('Selected items must share one franchise before changing collectible set.')
      return
    }

    if (!catalogBulkEditValues.brand_id) {
      setCatalogBulkEditError('Choose a brand to apply.')
      return
    }

    if (!catalogBulkEditValues.collectible_set_id) {
      setCatalogBulkEditError('Choose a collectible set to apply.')
      return
    }

    const payload = {
      brand_id: catalogBulkEditValues.brand_id,
      collectible_set_id: catalogBulkEditValues.collectible_set_id,
      subcollectble_set_id: null,
      print_type_id: null,
    }

    setIsApplyingCatalogBulkEdit(true)
    setCatalogBulkEditError('')
    setCatalogBulkEditMessage('')

    const CHUNK_SIZE = 250
    for (let index = 0; index < selectedIds.length; index += CHUNK_SIZE) {
      const chunk = selectedIds.slice(index, index + CHUNK_SIZE)
      const { error } = await supabase
        .from('items')
        .update(payload)
        .in('item_id', chunk)

      if (error) {
        setCatalogBulkEditError(error.message || 'Could not apply bulk update.')
        setIsApplyingCatalogBulkEdit(false)
        return
      }
    }

    setCatalogBulkEditMessage(`Updated ${selectedIds.length} item${selectedIds.length === 1 ? '' : 's'}.`)
    setCatalogBulkSelectedIds(new Set())
    setCatalogReloadToken((currentToken) => currentToken + 1)
    setIsApplyingCatalogBulkEdit(false)
  }

  useEffect(() => {
    if (!isCatalogBulkEditMode) return
    setCatalogBulkEditValues({
      brand_id: '',
      collectible_set_id: '',
    })
    setCatalogBulkBrandOptions([])
    setCatalogBulkSetOptions([])
    setCatalogBulkEditError('')
    setCatalogBulkEditMessage('')
  }, [isCatalogBulkEditMode])

  useEffect(() => {
    if (!isCatalogBulkEditMode) return

    const franchiseId = selectedCatalogBulkFranchiseId
    if (!franchiseId) {
      setCatalogBulkBrandOptions([])
      setCatalogBulkEditValues((current) => {
        if (!current.brand_id && !current.collectible_set_id) return current
        return { ...current, brand_id: '', collectible_set_id: '' }
      })
      return
    }

    let isActive = true
    ;(async () => {
      const { data, error } = await supabase
        .from('items')
        .select('brand_id')
        .eq('franchise_id', franchiseId)
        .not('brand_id', 'is', null)

      if (!isActive) return
      if (error) {
        setCatalogBulkBrandOptions([])
        return
      }

      const brandIds = new Set((data || []).map((row) => row.brand_id).filter(Boolean))
      const options = catalogBrands.filter((brand) => brandIds.has(brand.id))
      setCatalogBulkBrandOptions(options)
      setCatalogBulkEditValues((current) => {
        const keepBrand = current.brand_id && options.some((option) => option.id === current.brand_id)
        if (keepBrand) return current
        if (!current.brand_id && !current.collectible_set_id) return current
        return { ...current, brand_id: '', collectible_set_id: '' }
      })
    })()

    return () => { isActive = false }
  }, [isCatalogBulkEditMode, selectedCatalogBulkFranchiseId, catalogBrands])

  useEffect(() => {
    if (!isCatalogBulkEditMode) return

    const franchiseId = selectedCatalogBulkFranchiseId
    if (!franchiseId || !catalogBulkEditValues.brand_id) {
      setCatalogBulkSetOptions([])
      setCatalogBulkEditValues((current) => {
        if (!current.collectible_set_id) return current
        return { ...current, collectible_set_id: '' }
      })
      return
    }

    let isActive = true
    ;(async () => {
      const { data, error } = await supabase
        .from('collectible_sets')
        .select('collectible_set_id, name')
        .eq('franchise_id', franchiseId)
        .eq('brand_id', catalogBulkEditValues.brand_id)
        .order('name')

      if (!isActive) return
      if (error) {
        setCatalogBulkSetOptions([])
        return
      }

      const options = (data || []).map((row) => ({ id: row.collectible_set_id, name: row.name }))
      setCatalogBulkSetOptions(options)
      setCatalogBulkEditValues((current) => {
        if (!current.collectible_set_id) return current
        const exists = options.some((option) => option.id === current.collectible_set_id)
        return exists ? current : { ...current, collectible_set_id: '' }
      })
    })()

    return () => { isActive = false }
  }, [isCatalogBulkEditMode, selectedCatalogBulkFranchiseId, catalogBulkEditValues.brand_id])

  const handleOpenCatalogItemEdit = async () => {
    const d = selectedCatalogItem?._details || {}
    setCatalogItemEditValues({
      description:          d.description          || '',
      card_number:          d.card_number          || '',
      print_count:          d.print_count          ?? '',
      category_id:          d.category_id          || '',
      subcategory_id:       d.subcategory_id        || '',
      franchise_id:         d.franchise_id          || '',
      brand_id:             d.brand_id              || '',
      collectible_set_id:   d.collectible_set_id    || '',
      subcollectble_set_id: d.subcollectble_set_id  || '',
      print_type_id:        d.print_type_id         || '',
      bricklink_id:         d.bricklink_id          || '',
      rebrickable_fig_id:   d.rebrickable_fig_id    || '',
      release_year:         d.release_year          ?? '',
      upc:                  d.upc                   || '',
      piece_count:          d.piece_count           ?? '',
    })
    setCatalogItemEditError('')
    const franchiseId = d.franchise_id || ''
    const [{ data: cardTypes }, { data: itemTeams }, { data: itemCardTypes }, { data: itemSubjects }, { data: itemMtgMeta }, { data: franchiseTeams }, { data: itemProductLines }] = await Promise.all([
      supabase.from('card_types').select('card_type_id, name').order('name'),
      supabase.from('item_teams').select('team_id').eq('item_id', selectedCatalogItem.id),
      supabase.from('item_card_types').select('card_type_id').eq('item_id', selectedCatalogItem.id),
      supabase.from('item_subjects').select('subject_id, subjects(subject_name, subject_type)').eq('item_id', selectedCatalogItem.id),
      supabase.from('items').select('rarity_id, mtg_card_type_id, retail_price, market_price, subset_id, series_id').eq('item_id', selectedCatalogItem.id).maybeSingle(),
      franchiseId
        ? supabase.from('teams').select('team_id, name').eq('franchise_id', franchiseId).order('name')
        : Promise.resolve({ data: [] }),
      supabase.from('item_product_lines').select('product_line_id').eq('item_id', selectedCatalogItem.id).limit(1),
    ])
    const cardTypesList = (cardTypes || []).map(r => ({ id: r.card_type_id, name: r.name }))
    const teamsList = (franchiseTeams || []).map(r => ({ id: r.team_id, name: r.name }))
    setCatalogItemEditLookups({
      franchises: [], subjects: [], sets: [], subsets: [], teams: teamsList, printTypes: [],
      cardTypes: cardTypesList, brands: [], subthemes: [], productLines: [], series: [],
    })
    setCatalogItemEditTeamIds((itemTeams || []).map(r => r.team_id))
    setCatalogItemEditCardTypeIds((itemCardTypes || []).map(r => r.card_type_id))
    setCatalogItemEditMtgCardTypeId(itemMtgMeta?.mtg_card_type_id || '')
    setCatalogItemEditRarityId(itemMtgMeta?.rarity_id || '')
    setCatalogItemEditValues(v => ({
      ...v,
      retail_price: itemMtgMeta?.retail_price ?? '',
      market_price: itemMtgMeta?.market_price ?? '',
      subset_id: itemMtgMeta?.subset_id || '',
      series_id: itemMtgMeta?.series_id || '',
      product_line_id: itemProductLines?.[0]?.product_line_id || '',
    }))
    setCatalogItemEditSubjectIds((itemSubjects || []).map(r => ({ id: r.subject_id, name: r.subjects?.subject_name || '', type: r.subjects?.subject_type || '' })))
    setCatalogItemEditSubjectSearch('')
    setCatalogItemEditSubjectResults([])
    catalogEditInitialRef.current = true
    setIsCatalogItemEditMode(true)
  }

  const handleSaveCatalogItem = async () => {
    if (!selectedCatalogItem?.id) return
    setIsSavingCatalogItem(true)
    setCatalogItemEditError('')
    const v = catalogItemEditValues
    const { error } = await supabase
      .from('items')
      .update({
        description:          v.description?.trim()          || null,
        card_number:          v.card_number?.trim()          || null,
        print_count:          v.print_count !== '' ? Number(v.print_count) : null,
        category_id:          v.category_id          || null,
        subcategory_id:       v.subcategory_id        || null,
        franchise_id:         v.franchise_id          || null,
        brand_id:             v.brand_id              || null,
        collectible_set_id:   v.collectible_set_id    || null,
        subcollectble_set_id: v.subcollectble_set_id  || null,
        subset_id:            v.subset_id             || null,
        series_id:            v.series_id             || null,
        print_type_id:        v.print_type_id         || null,
        bricklink_id:         v.bricklink_id?.trim()         || null,
        rebrickable_fig_id:   v.rebrickable_fig_id?.trim()   || null,
        release_year:         v.release_year !== '' && v.release_year != null ? Number(v.release_year) : null,
        upc:                  v.upc?.trim()                   || null,
        piece_count:          v.piece_count !== '' && v.piece_count != null ? Number(v.piece_count) : null,
        retail_price:         v.retail_price !== '' && v.retail_price != null && Number.isFinite(Number(v.retail_price)) ? Number(v.retail_price) : null,
        market_price:         v.market_price !== '' && v.market_price != null && Number.isFinite(Number(v.market_price)) ? Number(v.market_price) : null,
        ...(catalogRarities.length > 0 ? { rarity_id: catalogItemEditRarityId || null } : {}),
        ...(catalogItemIsMtg ? {
          mtg_card_type_id: catalogItemEditMtgCardTypeId || null,
        } : {}),
      })
      .eq('item_id', selectedCatalogItem.id)
    if (error) {
      setCatalogItemEditError(error.message || 'Could not save changes.')
      setIsSavingCatalogItem(false)
      return
    }
    await supabase.from('item_subjects').delete().eq('item_id', selectedCatalogItem.id)
    if (catalogItemEditSubjectIds.length > 0) {
      await supabase.from('items').update({ subject_id: catalogItemEditSubjectIds[0].id }).eq('item_id', selectedCatalogItem.id)
      await supabase.from('item_subjects').insert(catalogItemEditSubjectIds.map(s => ({ item_id: selectedCatalogItem.id, subject_id: s.id })))
    } else {
      await supabase.from('items').update({ subject_id: null }).eq('item_id', selectedCatalogItem.id)
    }
    await supabase.from('item_teams').delete().eq('item_id', selectedCatalogItem.id)
    if (catalogItemEditTeamIds.length > 0) {
      await supabase.from('item_teams').insert(catalogItemEditTeamIds.map(tid => ({ item_id: selectedCatalogItem.id, team_id: tid })))
    }
    // Faceted: Product Line (m2m). Replace with the single selected line.
    await supabase.from('item_product_lines').delete().eq('item_id', selectedCatalogItem.id)
    if (v.subset_id && v.product_line_id) {
      const { error: plErr } = await supabase.from('item_product_lines').insert({ item_id: selectedCatalogItem.id, product_line_id: v.product_line_id })
      if (plErr) console.error('item_product_lines insert error (edit):', plErr)
    }
    await supabase.from('item_card_types').delete().eq('item_id', selectedCatalogItem.id)
    if (catalogItemEditCardTypeIds.length > 0) {
      const { error: ctErr } = await supabase.from('item_card_types').insert(
        catalogItemEditCardTypeIds.map(ctid => ({ item_id: selectedCatalogItem.id, card_type_id: ctid }))
      )
      if (ctErr) console.error('item_card_types insert error:', ctErr)
    }
    // Immediately reflect new card types in the detail view
    setCatalogDetailCardTypes(
      catalogItemEditCardTypeIds
        .map(id => catalogItemEditLookups.cardTypes.find(ct => ct.id === id)?.name)
        .filter(Boolean)
    )
    // Immediately reflect new teams in the detail view
    setCatalogDetailTeams(
      catalogItemEditTeamIds
        .map(id => catalogItemEditLookups.teams.find(t => t.id === id)?.name)
        .filter(Boolean)
    )
    // Patch selectedCatalogItem so the detail view reflects saved values immediately
    setSelectedCatalogItem(prev => {
      if (!prev) return prev
      const updatedDetails = {
        ...prev._details,
        card_number:          v.card_number?.trim() || null,
        description:          v.description?.trim() || null,
        print_count:          v.print_count !== '' ? Number(v.print_count) : null,
        category_id:          v.category_id || null,
        subcategory_id:       v.subcategory_id || null,
        franchise_id:         v.franchise_id || null,
        brand_id:             v.brand_id || null,
        collectible_set_id:   v.collectible_set_id || null,
        print_type_id:        v.print_type_id || null,
        release_year:         v.release_year !== '' && v.release_year != null ? Number(v.release_year) : null,
        upc:                  v.upc?.trim() || null,
        piece_count:          v.piece_count !== '' && v.piece_count != null ? Number(v.piece_count) : null,
      }
      const subjectName = prev._subject_name || ''
      const printType   = updatedDetails.print_type || prev._print_type || ''
      const cardNum     = updatedDetails.card_number ? `#${updatedDetails.card_number}` : ''
      const nameParts   = [subjectName, printType, cardNum || null].filter(Boolean)
      return {
        ...prev,
        card_number: updatedDetails.card_number,
        description: updatedDetails.description,
        name:        nameParts.join(' — ') || updatedDetails.description || prev.name || 'Unnamed Item',
        _details:    updatedDetails,
      }
    })
    // Immediately reflect the saved retail price in the LEGO detail block.
    const savedRetail = v.retail_price !== '' && v.retail_price != null && Number.isFinite(Number(v.retail_price)) ? Number(v.retail_price) : null
    setCatalogDetailLego(prev => ({ ...(prev || {}), retail_price: savedRetail }))
    setCatalogReloadToken(t => t + 1)
    setIsCatalogItemEditMode(false)
    setIsSavingCatalogItem(false)
  }

  const handleUploadCatalogItemImage = async (file, position) => {
    if (!file || !selectedCatalogItem?.id) return
    if (!file.type.startsWith('image/')) {
      setCatalogItemEditError('Only image files can be uploaded.')
      return
    }
    setIsUploadingCatalogItemImage(true)
    setCatalogItemEditError('')
    const existing = catalogItemImages.find(img => img.position === position)
    if (existing) {
      await supabase.storage.from('item-images').remove([existing.image_path])
      await supabase.from('item_images').delete().eq('item_image_id', existing.item_image_id)
    }
    const ext = file.name.split('.').pop()
    const path = `items/${selectedCatalogItem.id}/${Date.now()}_${position}.${ext}`
    const { error: uploadError } = await supabase.storage.from('item-images').upload(path, file)
    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      setCatalogItemEditError(uploadError.message || 'Upload failed.')
      setIsUploadingCatalogItemImage(false)
      return
    }
    const { error: insertError } = await supabase.from('item_images').insert({ item_id: selectedCatalogItem.id, image_path: path, position })
    if (insertError) {
      console.error('item_images insert error:', insertError)
      setCatalogItemEditError(insertError.message || 'Could not save image record.')
      setIsUploadingCatalogItemImage(false)
      return
    }
    setCatalogItemImagesReloadToken(t => t + 1)
    setIsUploadingCatalogItemImage(false)
  }

  const handleDeleteCatalogItemImage = async (img) => {
    const { error: storageError } = await supabase.storage.from('item-images').remove([img.image_path])
    if (storageError) {
      setCatalogItemEditError(storageError.message || 'Could not delete image from storage.')
      return
    }
    await supabase.from('item_images').delete().eq('item_image_id', img.item_image_id)
    setCatalogItemImagesReloadToken(t => t + 1)
  }

  // ─── Images (admin-only) ────────────────────────────────────────────
  // NOTE: every mutation below runs through the anon-key client under the admin's
  // authenticated session; the DB RLS policies (item_images_write, *_admin) are
  // what actually enforce admin-only — the UI gate is not the security boundary.
  const miResolveUrl = (p) => (!p ? '' : (p.startsWith('http') ? p : supabase.storage.from('item-images').getPublicUrl(p).data?.publicUrl || ''))
  const miReload = () => setCatalogItemImagesReloadToken(t => t + 1)

  const miReloadCandidatesJobs = async () => {
    if (!selectedCatalogItem?.id) return
    const [{ data: cands }, { data: jobs }] = await Promise.all([
      supabase.from('image_candidates').select('*').eq('item_id', selectedCatalogItem.id).order('match_score', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('image_search_jobs').select('*').eq('item_id', selectedCatalogItem.id).order('created_at', { ascending: false }),
    ])
    setManageImagesCandidates(cands || [])
    setManageImagesJobs(jobs || [])
  }

  // Keep the invariant "is_primary === (position 0)" so the rest of the app, which
  // still derives the front photo from position 0, never diverges from is_primary.
  const miSyncPrimaryToPos0 = async (itemId) => {
    await supabase.from('item_images').update({ is_primary: false }).eq('item_id', itemId)
    await supabase.from('item_images').update({ is_primary: true }).eq('item_id', itemId).eq('position', 0)
  }

  // Move a given image row to position 0 (via a temp slot to avoid any collision),
  // then re-sync the primary flag. Works for both existing rows and freshly inserted ones.
  const miMakePrimary = async (row) => {
    const itemId = row.item_id || selectedCatalogItem?.id
    const cur0 = catalogItemImages.find(i => i.position === 0 && i.item_image_id !== row.item_image_id)
    await supabase.from('item_images').update({ position: -1 }).eq('item_image_id', row.item_image_id)
    if (cur0) await supabase.from('item_images').update({ position: row.position }).eq('item_image_id', cur0.item_image_id)
    await supabase.from('item_images').update({ position: 0, updated_at: new Date().toISOString() }).eq('item_image_id', row.item_image_id)
    await miSyncPrimaryToPos0(itemId)
  }

  const handleMiSetPrimary = async (img) => {
    if (img.position === 0 && img.is_primary) return
    setManageImagesBusy(true); setManageImagesError('')
    try { await miMakePrimary(img) } catch (e) { setManageImagesError(e.message || 'Could not set primary.') }
    setManageImagesBusy(false); miReload()
  }

  const handleMiReorder = async (img, dir) => {
    const ordered = [...catalogItemImages].sort((a, b) => a.position - b.position)
    const idx = ordered.findIndex(i => i.item_image_id === img.item_image_id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= ordered.length) return
    const other = ordered[swapIdx]
    setManageImagesBusy(true); setManageImagesError('')
    const pA = img.position, pB = other.position
    await supabase.from('item_images').update({ position: -1 }).eq('item_image_id', img.item_image_id)
    await supabase.from('item_images').update({ position: pA }).eq('item_image_id', other.item_image_id)
    await supabase.from('item_images').update({ position: pB }).eq('item_image_id', img.item_image_id)
    await miSyncPrimaryToPos0(selectedCatalogItem.id)
    setManageImagesBusy(false); miReload()
  }

  const handleMiRemove = async (img) => {
    setManageImagesBusy(true); setManageImagesError('')
    if (img.image_path && !img.image_path.startsWith('http')) {
      await supabase.storage.from('item-images').remove([img.image_path])
    }
    const { error } = await supabase.from('item_images').delete().eq('item_image_id', img.item_image_id)
    if (error) { setManageImagesError(error.message); setManageImagesBusy(false); return }
    // Re-pack positions so they stay contiguous, then re-sync the primary flag.
    const remaining = catalogItemImages.filter(i => i.item_image_id !== img.item_image_id).sort((a, b) => a.position - b.position)
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].position !== i) await supabase.from('item_images').update({ position: i }).eq('item_image_id', remaining[i].item_image_id)
    }
    await miSyncPrimaryToPos0(selectedCatalogItem.id)
    // Removing the last image makes the item eligible for discovery again. The
    // queue is computed live from zero-image items, so nothing else to write here.
    setManageImagesBusy(false); miReload()
  }

  const handleMiSaveSource = async (img) => {
    setManageImagesBusy(true); setManageImagesError('')
    const { error } = await supabase.from('item_images').update({
      source_url:  manageImagesSourceDraft.source_url.trim() || null,
      source_name: manageImagesSourceDraft.source_name.trim() || null,
      is_verified: !!manageImagesSourceDraft.is_verified,
      updated_at:  new Date().toISOString(),
    }).eq('item_image_id', img.item_image_id)
    if (error) setManageImagesError(error.message)
    setManageImagesEditSourceId(null)
    setManageImagesBusy(false); miReload()
  }

  const handleMiAddByUrl = async () => {
    const url = manageImagesUrlDraft.image_url.trim()
    if (!url) { setManageImagesError('Enter an image URL.'); return }
    setManageImagesBusy(true); setManageImagesError('')
    const maxPos = catalogItemImages.reduce((m, i) => Math.max(m, i.position), -1)
    const { data: row, error } = await supabase.from('item_images').insert({
      item_id: selectedCatalogItem.id, image_path: url, position: maxPos + 1,
      source_url:  manageImagesUrlDraft.source_url.trim() || null,
      source_name: manageImagesUrlDraft.source_name.trim() || null,
    }).select('item_image_id, item_id, image_path, position').single()
    if (error) { setManageImagesError(error.message); setManageImagesBusy(false); return }
    if (manageImagesUrlDraft.asPrimary) await miMakePrimary(row); else await miSyncPrimaryToPos0(selectedCatalogItem.id)
    setManageImagesUrlDraft({ image_url: '', source_url: '', source_name: '', asPrimary: false })
    setManageImagesBusy(false); miReload()
  }

  const handleMiUpload = async (file, asPrimary) => {
    if (!file || !selectedCatalogItem?.id) return
    if (!file.type.startsWith('image/')) { setManageImagesError('Only image files can be uploaded.'); return }
    setManageImagesBusy(true); setManageImagesError('')
    const ext = file.name.split('.').pop()
    const maxPos = catalogItemImages.reduce((m, i) => Math.max(m, i.position), -1)
    const pos = maxPos + 1
    const path = `items/${selectedCatalogItem.id}/${Date.now()}_${pos}.${ext}`
    const { error: upErr } = await supabase.storage.from('item-images').upload(path, file)
    if (upErr) { setManageImagesError(upErr.message || 'Upload failed.'); setManageImagesBusy(false); return }
    const { data: row, error } = await supabase.from('item_images').insert({
      item_id: selectedCatalogItem.id, image_path: path, position: pos, source_name: 'Manual upload',
    }).select('item_image_id, item_id, image_path, position').single()
    if (error) { setManageImagesError(error.message); setManageImagesBusy(false); return }
    if (asPrimary) await miMakePrimary(row); else await miSyncPrimaryToPos0(selectedCatalogItem.id)
    setManageImagesBusy(false); miReload()
  }

  // Approving a candidate creates a normal item_images row (the candidate becomes a
  // real catalogue image), then marks the candidate approved so it isn't re-suggested.
  const handleMiApproveCandidate = async (cand, mode /* 'primary' | 'gallery' */) => {
    setManageImagesBusy(true); setManageImagesError('')
    const maxPos = catalogItemImages.reduce((m, i) => Math.max(m, i.position), -1)
    const { data: row, error } = await supabase.from('item_images').insert({
      item_id: selectedCatalogItem.id, image_path: cand.image_url, position: maxPos + 1,
      source_url: cand.source_url || null, source_name: cand.source_name || null, is_verified: false,
    }).select('item_image_id, item_id, image_path, position').single()
    if (error) { setManageImagesError(error.message); setManageImagesBusy(false); return }
    if (mode === 'primary') await miMakePrimary(row); else await miSyncPrimaryToPos0(selectedCatalogItem.id)
    await supabase.from('image_candidates').update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: profile?.id || null }).eq('id', cand.id)
    setManageImagesBusy(false); miReload(); await miReloadCandidatesJobs()
  }

  const handleMiRejectCandidate = async (cand) => {
    setManageImagesBusy(true); setManageImagesError('')
    const { error } = await supabase.from('image_candidates').update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: profile?.id || null }).eq('id', cand.id)
    if (error) setManageImagesError(error.message)
    setManageImagesBusy(false); await miReloadCandidatesJobs()
  }

  // Manual "Find Images" override. Hands the item to the `discover-catalog-images`
  // edge function, which (server-side) verifies admin, loads the item + taxonomy,
  // builds the query, calls Google Programmable Search, scores + saves candidates,
  // and records the search job. The button is a deliberate admin override, so it
  // searches even if the item already has images (override: true). The manageImagesBusy
  // guard + disabled button prevent repeated concurrent clicks.
  const handleMiFindImages = async () => {
    if (!selectedCatalogItem?.id || manageImagesBusy) return
    setManageImagesBusy(true); setManageImagesError(''); setManageImagesNotice('')
    const { data: res, error: fnErr } = await supabase.functions.invoke('discover-catalog-images', {
      body: { item_id: selectedCatalogItem.id, override: true },
    })
    if (fnErr) {
      setManageImagesError(`Search failed: ${fnErr.message}. Is the "discover-catalog-images" function deployed with BRAVE_SEARCH_API_KEY set?`)
      setManageImagesBusy(false); await miReloadCandidatesJobs(); return
    }
    if (res?.status === 'error') {
      setManageImagesError(res.error || 'Image search failed.')
    } else if (res?.status === 'already_has_images') {
      setManageImagesNotice('This item already has images — automatic discovery is not required. Use manual upload/URL to add more.')
    } else {
      const n = res?.candidates_found ?? 0
      setManageImagesNotice(n
        ? `Found ${n} candidate${n === 1 ? '' : 's'} for “${res.query}”.`
        : `Search ran (“${res?.query || ''}”) but returned no candidates for this item.`)
    }
    setManageImagesBusy(false); await miReloadCandidatesJobs()
  }

  // Load candidates + jobs for the open item (admin only). Re-runs on image changes
  // so approving/rejecting stays in sync with the Current Images list.
  useEffect(() => {
    if (!isPlatformAdmin || !selectedCatalogItem?.id) { setManageImagesCandidates([]); setManageImagesJobs([]); return }
    let cancelled = false
    ;(async () => {
      const [{ data: cands }, { data: jobs }] = await Promise.all([
        supabase.from('image_candidates').select('*').eq('item_id', selectedCatalogItem.id).order('match_score', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('image_search_jobs').select('*').eq('item_id', selectedCatalogItem.id).order('created_at', { ascending: false }),
      ])
      if (!cancelled) { setManageImagesCandidates(cands || []); setManageImagesJobs(jobs || []) }
    })()
    return () => { cancelled = true }
  }, [isPlatformAdmin, selectedCatalogItem?.id, catalogItemImagesReloadToken])

  // Badge: how many catalogue items currently have no image. item_details.front_image_path
  // is derived from item_images, so NULL there === zero images (the single definition).
  useEffect(() => {
    if (!isPlatformAdmin) { setImageQueueCount(null); return }
    let cancelled = false
    ;(async () => {
      const { count } = await supabase.from('item_details').select('item_id', { count: 'exact', head: true }).is('front_image_path', null)
      if (!cancelled) setImageQueueCount(count ?? 0)
    })()
    return () => { cancelled = true }
  }, [isPlatformAdmin, catalogItemImagesReloadToken])

  // Map an item_details row to the shape handleOpenCatalogItem expects (mirrors the
  // catalog list's normalizeItem so queue items open identically to clicked items).
  const normalizeQueueItem = (raw) => {
    const na = (v) => (v && v !== 'N/A' ? v : '')
    const subjectName = na(raw.subject), printType = na(raw.print_type)
    const cardNum = raw.card_number && raw.card_number !== 'N/A' ? `#${raw.card_number}` : ''
    const nameParts = [subjectName, printType, cardNum || null].filter(Boolean)
    return {
      id: raw.item_id,
      name: nameParts.join(' — ') || raw.description || 'Unnamed Item',
      description: raw.description || '', release_year: raw.release_year,
      category_id: raw.category_id, subcategory_id: raw.subcategory_id,
      franchise_id: raw.franchise_id, collectible_set_id: raw.collectible_set_id, brand_id: raw.brand_id,
      card_number: raw.card_number !== 'N/A' ? raw.card_number : null, print_count: raw.print_count,
      metadata: {}, dynamic_fields: {},
      _subject_name: subjectName, _set_name: na(raw.collectible_set), _print_type: printType,
      _brand_name: na(raw.brand), _franchise_name: na(raw.franchise),
      _details: raw, front_image_path: raw.front_image_path || null,
    }
  }

  const openQueueItemAt = (items, pos) => {
    setImageQueuePos(pos)
    handleOpenCatalogItem(items[pos])           // the tab-reset effect opens Manage Images while queue is active
  }

  const startImageQueue = async () => {
    setImageQueueLoading(true); setManageImagesError(''); setManageImagesNotice('')
    const { data, error } = await supabase.from('item_details').select('*').is('front_image_path', null).order('subject', { ascending: true }).limit(5000)
    if (error) { setManageImagesError(error.message || 'Could not load the image queue.'); setImageQueueLoading(false); return }
    const items = (data || []).map(normalizeQueueItem)
    setImageQueueItems(items)
    setImageQueueCount(items.length)
    if (!items.length) { setImageQueueActive(false); setImageQueueLoading(false); setManageImagesNotice('Every catalogue item already has an image. Nothing to queue.'); return }
    setImageQueueActive(true)
    openQueueItemAt(items, 0)
    setImageQueueLoading(false)
  }

  const advanceImageQueue = () => {
    const next = imageQueuePos + 1
    if (next >= imageQueueItems.length) { exitImageQueue(true); return }
    openQueueItemAt(imageQueueItems, next)
  }

  const exitImageQueue = (finished) => {
    setImageQueueActive(false)
    setSelectedCatalogItem(null)
    if (finished) setManageImagesNotice('')
  }

  const handleCatalogAdminSelectSubject = async (subject) => {
    setCatalogAdminSubjectIds(prev => prev.some(s => s.id === subject.id) ? prev : [...prev, { id: subject.id, name: subject.name, type: subject.type }])
    setCatalogAdminSubjectSearch('')
    setCatalogAdminSubjectResults([])
    if (catalogAdminRealFranchiseId) {
      const { data: existing } = await supabase.from('subject_franchise')
        .select('subject_id').eq('subject_id', subject.id).eq('franchise_id', catalogAdminRealFranchiseId).maybeSingle()
      if (!existing) {
        await supabase.from('subject_franchise').insert({ subject_id: subject.id, franchise_id: catalogAdminRealFranchiseId })
      }
    }
  }

  const handleCatalogAdminRemoveSubject = (subjectId) => {
    setCatalogAdminSubjectIds(prev => prev.filter(s => s.id !== subjectId))
  }

  const handleCatalogItemEditSelectSubject = async (subject) => {
    setCatalogItemEditSubjectIds(prev => prev.some(s => s.id === subject.id) ? prev : [...prev, { id: subject.id, name: subject.name, type: subject.type }])
    setCatalogItemEditSubjectSearch('')
    setCatalogItemEditSubjectResults([])
    const franchiseId = catalogItemEditValues.franchise_id
    if (franchiseId) {
      const { data: existing } = await supabase.from('subject_franchise')
        .select('subject_id').eq('subject_id', subject.id).eq('franchise_id', franchiseId).maybeSingle()
      if (!existing) {
        await supabase.from('subject_franchise').insert({ subject_id: subject.id, franchise_id: franchiseId })
      }
    }
  }

  const handleCatalogItemEditRemoveSubject = (subjectId) => {
    setCatalogItemEditSubjectIds(prev => prev.filter(s => s.id !== subjectId))
  }

  const handleCatalogAdminInlineSave = async () => {
    const { field, value, subjectType, speciesId } = catalogAdminInlineCreate
    const name = value.trim()
    if (!name) return
    setIsSavingCatalogAdminInline(true)
    setCatalogAdminInlineCreate(v => ({ ...v, error: '' }))
    const fail = (msg) => { setCatalogAdminInlineCreate(v => ({ ...v, error: msg })); setIsSavingCatalogAdminInline(false) }
    const reset = () => { setCatalogAdminInlineCreate({ field: '', value: '', subjectType: 'player', speciesId: '', error: '' }); setIsSavingCatalogAdminInline(false) }

    if (field === 'category') {
      const { data, error } = await supabase.from('categories').insert({ name }).select('category_id').single()
      if (error) { fail(error.message); return }
      const item = { id: data.category_id, name }
      setCatalogAdminCategories(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)))
      setCatalogAdminCategoryId(data.category_id)
    } else if (field === 'subcategory') {
      const { data, error } = await supabase.from('subcategories').insert({ name, category_id: catalogAdminCategoryId }).select('subcategory_id').single()
      if (error) { fail(error.message); return }
      const item = { id: data.subcategory_id, name }
      setCatalogAdminSubcategories(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)))
      setCatalogAdminSubcategoryId(data.subcategory_id)
    } else if (field === 'franchise') {
      const { data: existing, error: findError } = await supabase
        .from('franchises')
        .select('franchise_id, name')
        .ilike('name', name)
        .limit(1)
        .maybeSingle()
      if (findError) { fail(findError.message); return }

      let data = existing
      if (!data) {
        const { data: created, error } = await supabase.from('franchises').insert({ name }).select('franchise_id, name').single()
        if (error) { fail(error.message); return }
        data = created
      }
      if (catalogAdminSubcategoryId) {
        await supabase
          .from('franchise_subcategory')
          .upsert({ franchise_id: data.franchise_id, subcategory_id: catalogAdminSubcategoryId }, { onConflict: 'franchise_id,subcategory_id', ignoreDuplicates: true })
      }
      const item = { id: data.franchise_id, name: data.name || name }
      setCatalogAdminRealFranchises((prev) => {
        const next = prev.filter((franchise) => franchise.id !== item.id)
        next.push(item)
        next.sort((a, b) => a.name.localeCompare(b.name))
        return next
      })
      setCatalogAdminRealFranchiseId(data.franchise_id)
    } else if (field === 'brand') {
      const { data, error } = await supabase.from('brands').insert({ name }).select('brand_id').single()
      if (error) { fail(error.message); return }
      if (catalogAdminRealFranchiseId) {
        await supabase.from('brand_franchise').insert({ brand_id: data.brand_id, franchise_id: catalogAdminRealFranchiseId })
      }
      const item = { id: data.brand_id, name }
      setCatalogAdminBrands(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)))
      setCatalogAdminBrandId(data.brand_id)
    } else if (field === 'set') {
      const { data, error } = await supabase.from('collectible_sets').insert({ name, brand_id: catalogAdminBrandId || null, franchise_id: catalogAdminRealFranchiseId || null }).select('collectible_set_id').single()
      if (error) { fail(error.message); return }
      const item = { id: data.collectible_set_id, name }
      setCatalogAdminFranchises(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)))
      setCatalogAdminFranchiseId(data.collectible_set_id)
    } else if (field === 'subset') {
      const { data, error } = await supabase.from('subcollectible_sets').insert({ name, collectible_set_id: catalogAdminFranchiseId }).select('subcollectble_set_id').single()
      if (error) { fail(error.message); return }
      const item = { id: data.subcollectble_set_id, name }
      setCatalogAdminSubsets(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)))
      setCatalogAdminSubsetId(data.subcollectble_set_id)
    } else if (field === 'subtheme') {
      const { data, error } = await supabase.from('subsets').insert({ name, franchise_id: catalogAdminRealFranchiseId }).select('subset_id').single()
      if (error) { fail(error.message); return }
      const item = { id: data.subset_id, name }
      setCatalogAdminSubsetsList(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)))
      setCatalogAdminSubsetSel(data.subset_id)
    } else if (field === 'productLine') {
      // Product Line is owned by the Subcategory (manufacturer) and associated with
      // the Theme/franchise for the "pick a Franchise first" flow.
      const { data, error } = await supabase.from('product_lines').insert({ name, subcategory_id: catalogAdminSubcategoryId || null, franchise_id: catalogAdminRealFranchiseId || null }).select('product_line_id').single()
      if (error) { fail(error.message); return }
      const item = { id: data.product_line_id, name }
      setCatalogAdminProductLinesList(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)))
      setCatalogAdminProductLineIds([data.product_line_id])
    } else if (field === 'property') {
      // Property is the IP sub-level, anchored to the Franchise and (optionally) the
      // Subfranchise — so a new one is scoped to the currently-selected subfranchise.
      const { data, error } = await supabase.from('properties').insert({ name, franchise_id: catalogAdminRealFranchiseId || null, subset_id: catalogAdminSubsetSel || null }).select('property_id').single()
      if (error) { fail(error.message); return }
      const item = { id: data.property_id, name }
      setCatalogAdminProductLinesList(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)))
      setCatalogAdminProductLineIds([data.property_id])
    } else if (field === 'series') {
      const { data, error } = await supabase.from('series').insert({ name, subcategory_id: catalogAdminSubcategoryId }).select('series_id').single()
      if (error) { fail(error.message); return }
      const item = { id: data.series_id, name }
      setCatalogAdminSeriesList(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)))
      setCatalogAdminSeriesId(data.series_id)
    } else if (field === 'subject') {
      const { data, error } = await supabase.from('subjects').insert({ subject_name: name, subject_type: subjectType, species_id: (subjectType === 'character' && speciesId) ? speciesId : null }).select('subject_id').single()
      if (error) { fail(error.message); return }
      if (catalogAdminRealFranchiseId) {
        await supabase.from('subject_franchise').insert({ subject_id: data.subject_id, franchise_id: catalogAdminRealFranchiseId })
      }
      setCatalogAdminSubjectIds(prev => [...prev, { id: data.subject_id, name, type: subjectType }])
      setCatalogAdminSubjectSearch('')
      setCatalogAdminSubjectResults([])
    } else if (field === 'team') {
      const { data, error } = await supabase.from('teams').insert({ name, franchise_id: catalogAdminRealFranchiseId || null }).select('team_id').single()
      if (error) { fail(error.message); return }
      const item = { id: data.team_id, name }
      setCatalogAdminTeams(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)))
      setCatalogAdminTeamIds(prev => [...prev, data.team_id])
    } else if (field === 'printType') {
      const { data, error } = await supabase.from('print_types').insert({ name, subcollectble_set_id: catalogAdminSubsetId || null }).select('print_type_id').single()
      if (error) { fail(error.message); return }
      const item = { id: data.print_type_id, name }
      setCatalogAdminPrintTypes(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)))
      setCatalogAdminPrintTypeId(data.print_type_id)
    } else if (field === 'cardType') {
      const { data, error } = await supabase.from('card_types').insert({ name }).select('card_type_id').single()
      if (error) { fail(error.message); return }
      const item = { id: data.card_type_id, name }
      setCatalogAdminCardTypes(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)))
      setCatalogAdminCardTypeIds(prev => [...prev, data.card_type_id])
    }
    reset()
  }

  // ── Bulk Import helpers ──────────────────────────────────────────────────
  const parseBulkImportCsv = (text, categoryName = '') => {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
    if (lines.length < 2) return []
    const parseRow = (line) => {
      const fields = []
      let cur = '', inQ = false
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ }
        else if (ch === ',' && !inQ) { fields.push(cur.trim()); cur = '' }
        else cur += ch
      }
      fields.push(cur.trim())
      return fields
    }
    // Map every header to exactly one catalogue field via the central config.
    // Unrecognised headers are captured (not silently dropped) so the admin can
    // see/handle them. No header is ever read into two different fields.
    const rawHeaders = parseRow(lines[0])
    const fieldIndex = {}        // canonical field -> column index
    const unknownHeaders = []    // { header, index } for unrecognised columns
    rawHeaders.forEach((raw, i) => {
      const norm = BULK_HEADER_NORMALIZE(raw)
      const field = BULK_ALIAS_TO_FIELD[norm]
      const def = field ? BULK_FIELD_MAP[field] : null
      // Enforce the per-category gate: a field limited to certain categories is only
      // accepted when the selected category matches. So a Toys import recognises only
      // its valid fields; a stray LEGO/card column is surfaced as unknown, not mapped.
      const allowedForCategory = def && (!def.categories || !categoryName || def.categories.includes(categoryName))
      if (field && allowedForCategory && fieldIndex[field] === undefined) fieldIndex[field] = i
      else if (norm) unknownHeaders.push({ header: raw.trim(), index: i })
    })
    const unknownList = unknownHeaders.map(u => u.header)
    return lines.slice(1).filter(l => l.trim()).map((line, idx) => {
      const f = parseRow(line)
      const gv = (field) => { const i = fieldIndex[field]; return i === undefined ? '' : (f[i] || '').trim() }
      const itemType = gv('item_type')
      const isMinifigType = /minifig/i.test(itemType)
      // ID Number is polymorphic in Building Blocks: a set number for Sets, a
      // minifig code for Minifigures. Explicit columns win over ID Number.
      const idNum = gv('id_number')
      const legoSetNumber = gv('lego_set_number') || (isMinifigType ? '' : idNum)
      const minifigCode   = gv('minifig_code')   || (isMinifigType ? idNum : '')
      // Item name and Subject are one and the same — a Subject column and the
      // Item column populate the same value.
      const nameValue = gv('item_name') || gv('subject')
      return {
        _id: idx,
        status: 'pending',
        _unknownCols: unknownList,
        // ── taxonomy (mapped strictly by column; blank stays blank) ──
        item_name: nameValue,
        franchise_name: gv('franchise'),
        brand_name: gv('item_type'),
        subtheme_name: gv('subfranchise'),
        property_names: gv('property'),
        product_line_names: gv('product_line'),
        manufacturer_name: gv('manufacturer'),
        series_name: gv('series'),
        subset_id: '',
        product_line_ids: [],
        // Subject mirrors the item name (same concept).
        subject_name: nameValue,
        subjectObj: null,
        // ── universal metadata ──
        description: gv('description'),
        release_year: gv('release_year'),
        availability: gv('availability'),
        upc: gv('barcode'),
        includes: gv('includes'),
        parent_set_bricklink_id: gv('included_in'),
        image_url: gv('image_url'),
        // ── category attributes ──
        lego_set_number: legoSetNumber,
        minifig_code: minifigCode,
        piece_count: gv('piece_count'),
        bricklink_id: gv('bricklink_id'),
        rebrickable_fig_id: gv('rebrickable_id'),
        retail_price: gv('retail_price'),
        species_id: '',
        species_name: gv('species'),
        card_number: gv('card_number'),
        print_count: gv('print_count'),
        print_type_id: '',
        print_type_name: gv('print_type'),
        rarity_id: '',
        rarity_name: gv('rarity'),
        card_type_ids: [],
        card_treatment_names: gv('card_treatments'),
        team_names: gv('team'),
        team_ids: [],
        // legacy fields kept for save compatibility
        collectible_set_name: '',
        subcollectble_set_id: '',
        image_file: null,
        image_preview: '',
        errorMsg: '',
      }
    })
  }

  const updateBulkRow = (idx, updates) =>
    setBulkImportRows(rows => rows.map((r, i) => i === idx ? { ...r, ...updates } : r))

  const bulkImportApprove = () => {
    const cur = bulkImportRows[bulkImportIdx]
    if (!cur?.item_name?.trim() && !cur?.subjectObj && !cur?.subject_name?.trim()) {
      updateBulkRow(bulkImportIdx, { errorMsg: 'An item name is required before approving.' })
      return
    }
    updateBulkRow(bulkImportIdx, { status: 'approved', errorMsg: '' })
    const next = bulkImportRows.findIndex((r, i) => i > bulkImportIdx && r.status === 'pending')
    if (next >= 0) { setBulkImportIdx(next); setBulkImportSubjectSearch(''); setBulkImportSubjectResults([]); setBulkImportTeamSearch('') }
  }

  const bulkImportSkip = () => {
    updateBulkRow(bulkImportIdx, { status: 'skipped' })
    const next = bulkImportRows.findIndex((r, i) => i > bulkImportIdx && r.status === 'pending')
    if (next >= 0) { setBulkImportIdx(next); setBulkImportSubjectSearch(''); setBulkImportSubjectResults([]); setBulkImportTeamSearch('') }
  }

  const handleBulkImportFile = (file) => {
    if (!file) return
    const defaultSubsetId = catalogAdminSubsetId
    const isXlsx = /\.xlsx?$/i.test(file.name)
    const reader = new FileReader()
    reader.onload = async (e) => {
      // Parse EVERY sheet in an .xlsx workbook, not just the first — a workbook
      // often has one table per item type (Sets, Minifigs, Magnets, Value Packs…)
      // and reading only sheet 0 silently dropped the rest. Each sheet is parsed
      // on its own headers, then the rows are concatenated. A sheet contributes
      // only if it yields at least one usable row (an item name or subject), so
      // legend/notes sheets don't inject junk. The per-sheet tally is surfaced.
      let parsedRows = []
      let sheetSummary = null
      const isUsable = (r) => (r.item_name || '').trim() || (r.subject_name || '').trim()
      if (isXlsx) {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' })
        const reports = []
        for (const sheetName of wb.SheetNames) {
          const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName])
          const rs = parseBulkImportCsv(csv, selectedCatalogAdminCategoryName)
          const usable = rs.filter(isUsable)
          reports.push({ sheet: sheetName, rows: rs.length, usable: usable.length, included: usable.length > 0 })
          if (usable.length > 0) parsedRows = parsedRows.concat(rs.map(r => ({ ...r, _sheet: sheetName })))
        }
        if (wb.SheetNames.length > 1) sheetSummary = reports
      } else {
        parsedRows = parseBulkImportCsv(e.target.result, selectedCatalogAdminCategoryName)
      }
      setBulkImportSheetSummary(sheetSummary)
      let rows = parsedRows.map(r => ({
        ...r,
        subcollectble_set_id: defaultSubsetId || '',
      }))
      // Auto-match subjects by name
      const names = [...new Set(rows.map(r => r.subject_name).filter(Boolean))]
      if (names.length > 0) {
        const { data: matched } = await supabase
          .from('subjects')
          .select('subject_id, subject_name, subject_type')
          .or(names.map(n => `subject_name.ilike.${n}`).join(','))
        if (matched?.length) {
          const byName = new Map(matched.map(s => [s.subject_name.toLowerCase(), { id: s.subject_id, name: s.subject_name, type: s.subject_type }]))
          rows = rows.map(r => {
            const hit = r.subject_name ? byName.get(r.subject_name.toLowerCase()) : null
            return hit ? { ...r, subjectObj: hit } : r
          })
        }
      }
      // Auto-match rarities by name against loaded catalogRarities
      if (catalogRarities.length > 0) {
        const rarityByName = new Map(catalogRarities.map(r => [r.name.toLowerCase(), r.id]))
        rows = rows.map(r => {
          if (!r.rarity_name) return r
          const matched = rarityByName.get(r.rarity_name.toLowerCase())
          return matched ? { ...r, rarity_id: matched } : r
        })
      }
      // Auto-match card treatments by name against loaded catalogAllCardTypes
      if (catalogAllCardTypes.length > 0) {
        const treatmentByName = new Map(catalogAllCardTypes.map(ct => [ct.name.toLowerCase(), ct.id]))
        rows = rows.map(r => {
          if (!r.card_treatment_names) return r
          const ids = r.card_treatment_names.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
            .map(n => treatmentByName.get(n)).filter(Boolean)
          return ids.length ? { ...r, card_type_ids: [...new Set([...(r.card_type_ids || []), ...ids])] } : r
        })
      }
      // Auto-match teams by name against loaded catalogAdminTeams
      if (catalogAdminTeams.length > 0) {
        const teamByName = new Map(catalogAdminTeams.map(t => [t.name.toLowerCase(), t.id]))
        rows = rows.map(r => {
          if (!r.team_names) return r
          const ids = r.team_names.split(/[,;]/).map(s => s.trim().toLowerCase()).filter(Boolean)
            .map(n => teamByName.get(n)).filter(Boolean)
          return ids.length ? { ...r, team_ids: [...new Set([...(r.team_ids || []), ...ids])] } : r
        })
      }
      // Auto-match and auto-create print types from CSV print_type column
      const ptNames = [...new Set(rows.map(r => r.print_type_name).filter(Boolean))]
      if (ptNames.length > 0) {
        const subsetId = catalogAdminSubsetId || null
        const existingByName = new Map(catalogAdminPrintTypes.map(pt => [pt.name.toLowerCase(), pt.id]))
        const missingNames = ptNames.filter(n => !existingByName.has(n.toLowerCase()))
        if (missingNames.length > 0) {
          const { data: newPts } = await supabase.from('print_types')
            .insert(missingNames.map(name => ({ name, subcollectble_set_id: subsetId })))
            .select('print_type_id, name')
          if (newPts?.length) {
            newPts.forEach(pt => existingByName.set(pt.name.toLowerCase(), pt.print_type_id))
            setCatalogAdminPrintTypes(prev =>
              [...prev, ...newPts.map(pt => ({ id: pt.print_type_id, name: pt.name }))]
                .sort((a, b) => a.name.localeCompare(b.name))
            )
          }
        }
        rows = rows.map(r => {
          if (!r.print_type_name) return r
          const id = existingByName.get(r.print_type_name.toLowerCase())
          return id ? { ...r, print_type_id: id } : r
        })
      }
      // Check for existing items that might be duplicates
      if (catalogAdminFranchiseId) {
        const matchedSubjectIds = [...new Set(rows.map(r => r.subjectObj?.id).filter(Boolean))]
        if (matchedSubjectIds.length > 0) {
          const { data: existingItems } = await supabase
            .from('items')
            .select('item_id, subject_id, card_number')
            .eq('collectible_set_id', catalogAdminFranchiseId)
            .in('subject_id', matchedSubjectIds)
          if (existingItems?.length) {
            const existingByKey = new Map()
            for (const item of existingItems) {
              existingByKey.set(`${item.subject_id}:${item.card_number || ''}`, item)
            }
            rows = rows.map(r => {
              if (!r.subjectObj?.id) return r
              const key = `${r.subjectObj.id}:${r.card_number?.trim() || ''}`
              const match = existingByKey.get(key)
              return match ? { ...r, existingMatch: match } : r
            })
          }
        }
      }
      // Building Blocks: flag sets already in the catalog (by lego_set_number +
      // description) so they show a ⚠ during review, before Save. Variants share
      // a number but differ by description, so the key includes both. Chunked to
      // keep the URL small for large imports.
      if (selectedCatalogAdminCategoryName === 'Building Blocks') {
        const setNums = [...new Set(rows.map(r => r.lego_set_number?.trim()).filter(Boolean))]
        if (setNums.length > 0) {
          const existingByKey = new Map()
          for (let i = 0; i < setNums.length; i += 300) {
            const { data: existingSets } = await supabase
              .from('items').select('item_id, lego_set_number, description')
              .in('lego_set_number', setNums.slice(i, i + 300))
            for (const item of existingSets || [])
              existingByKey.set(`${item.lego_set_number}||${(item.description || '').trim().toLowerCase()}`, item)
          }
          if (existingByKey.size > 0) {
            rows = rows.map(r => {
              const sn = r.lego_set_number?.trim()
              if (!sn) return r
              const match = existingByKey.get(`${sn}||${(r.description || '').trim().toLowerCase()}`)
              return match ? { ...r, existingMatch: match } : r
            })
          }
        }
        // Flag minifigs already in the catalog by Rebrickable fig-num (chunked).
        const figNums = [...new Set(rows.map(r => r.rebrickable_fig_id?.trim()).filter(Boolean))]
        if (figNums.length > 0) {
          const existingByFig = new Map()
          for (let i = 0; i < figNums.length; i += 300) {
            const { data: existingFigs } = await supabase
              .from('items').select('item_id, rebrickable_fig_id')
              .in('rebrickable_fig_id', figNums.slice(i, i + 300))
            for (const item of existingFigs || [])
              existingByFig.set(item.rebrickable_fig_id, item)
          }
          if (existingByFig.size > 0) {
            rows = rows.map(r => {
              if (r.existingMatch) return r
              const fig = r.rebrickable_fig_id?.trim()
              const match = fig ? existingByFig.get(fig) : null
              return match ? { ...r, existingMatch: match } : r
            })
          }
        }
      }
      setBulkImportRows(rows)
      setBulkImportIdx(0)
      setBulkImportSubjectSearch('')
      setBulkImportSubjectResults([])
      setBulkImportSaveError('')
      setBulkImportSaveProgress(0)
    }
    if (isXlsx) {
      reader.readAsArrayBuffer(file)
    } else {
      reader.readAsText(file)
    }
  }

  const getBulkSubjectType = (row) => {
    const catName  = (selectedCatalogAdminCategoryName || '').toLowerCase()
    const subName  = (catalogAdminSubcategories.find(s => s.id === catalogAdminSubcategoryId)?.name || '').toLowerCase()
    if (catName.includes('building blocks')) {
      const blId = row?.bricklink_id?.trim() || ''
      const isSet = !!(row?.lego_set_number?.trim() || (blId && /^\d/.test(blId)) || (row?.brand_name || '').toLowerCase() === 'sets')
      return isSet ? 'set' : 'character'
    }
    if (subName.includes('sport') || catName.includes('sport')) return 'player'
    if (catName.includes('comic') || subName.includes('comic')) return 'comic'
    if (catName.includes('music')) return 'artist'
    return 'character'
  }

  const handleBulkCreatePrintType = async () => {
    const name = bulkImportNewPrintTypeName.trim()
    if (!name) return
    const subsetId = bulkImportRows[bulkImportIdx]?.subcollectble_set_id || catalogAdminSubsetId || null
    const { data, error } = await supabase.from('print_types').insert({ name, subcollectble_set_id: subsetId }).select('print_type_id').single()
    if (error) return
    const newItem = { id: data.print_type_id, name }
    setCatalogAdminPrintTypes(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)))
    updateBulkRow(bulkImportIdx, { print_type_id: data.print_type_id })
    setBulkImportNewPrintTypeName('')
    setBulkImportCreatingPrintType(false)
  }

  const handleBulkImportSave = async () => {
    const toSave = bulkImportRows.map((r, i) => ({ ...r, _origIdx: i })).filter(r => r.status === 'approved')
    if (!toSave.length) return
    setBulkImportIsSaving(true)
    setBulkImportSaveError('')
    setBulkImportSaveProgress(0)
    let saved = 0
    const isLegoCategory = selectedCatalogAdminCategoryName === 'Building Blocks'
    const bricklinkItemCache = new Map() // bricklink_id → item_id for items created this batch
    // Every item touched this batch (created or matched-existing) + its row, so the
    // post-insert linking pass can resolve Includes / Included In once ALL items exist.
    const savedItems = [] // { itemId, row }
    // Caches to avoid redundant DB lookups/creates within this save batch
    const franchiseIdCache     = new Map() // name_lc → franchise_id
    const brandIdCache         = new Map() // `${franchise_id}::${name_lc}` → brand_id
    const collectibleSetIdCache = new Map() // `${franchise_id}::${brand_id}::${name_lc}` → collectible_set_id
    const subsetIdCache        = new Map() // `${franchise_id}::${name_lc}` → subset_id
    const productLineIdCache   = new Map() // `${subcategory_id}::${name_lc}` → product_line_id
    const propertyIdCache      = new Map() // `${franchise_id}::${name_lc}` → property_id
    const franchiseLegoAbbrCache = new Map() // franchise_id → lego_abbreviation
    const mintedCodeCounters  = new Map() // prefix → last minted NN (in-memory, seeded from DB on first use)

    const mintMinifigCode = async (franchiseId, collectibleSetName, characterName) => {
      let themeAbbrev = franchiseLegoAbbrCache.get(franchiseId) ?? null
      if (themeAbbrev === null && franchiseId) {
        const { data: fr } = await supabase.from('franchises').select('lego_abbreviation').eq('franchise_id', franchiseId).maybeSingle()
        themeAbbrev = fr?.lego_abbreviation ?? ''
        franchiseLegoAbbrCache.set(franchiseId, themeAbbrev)
      }
      if (!themeAbbrev) return null
      const colSetLower = (collectibleSetName || '').toLowerCase().trim()
      const propEntry = colSetLower
        ? legoPropertyRegistry.find(p =>
            p.full_name.toLowerCase() === colSetLower ||
            p.full_name.toLowerCase().includes(colSetLower) ||
            colSetLower.includes(p.full_name.toLowerCase()))
        : null
      if (!propEntry) return null
      const shorthand = deriveMinifigShorthand(characterName)
      if (!shorthand) return null
      const prefix = `${themeAbbrev}-${propEntry.abbreviation}-${shorthand}`
      let maxNN = mintedCodeCounters.has(prefix) ? mintedCodeCounters.get(prefix) : null
      if (maxNN === null) {
        const { data: codeRows } = await supabase.from('items').select('minifig_code').like('minifig_code', `${prefix}-%`).not('minifig_code', 'is', null)
        const nums = (codeRows || []).map(r => { const m = r.minifig_code?.match(/-(\d+)$/); return m ? parseInt(m[1], 10) : 0 })
        maxNN = nums.length ? Math.max(...nums) : 0
      }
      const nextNN = maxNN + 1
      mintedCodeCounters.set(prefix, nextNN)
      return `${prefix}-${String(nextNN).padStart(2, '0')}`
    }

    // Brand/Manufacturer maps to the Subcategory (manufacturer/publisher). Resolved
    // per-row from the sheet when present, else the admin's UI selection is used.
    const subcategoryIdCache = new Map()
    const resolveOrCreateSubcategory = async (name, categoryId) => {
      if (!name?.trim() || !categoryId) return null
      const key = `${categoryId}::${name.trim().toLowerCase()}`
      if (subcategoryIdCache.has(key)) return subcategoryIdCache.get(key)
      const { data: found } = await supabase.from('subcategories').select('subcategory_id').ilike('name', name.trim()).eq('category_id', categoryId).limit(1).maybeSingle()
      let id = found?.subcategory_id || null
      if (!id) {
        const { data: created } = await supabase.from('subcategories').insert({ name: name.trim(), category_id: categoryId }).select('subcategory_id').single()
        id = created?.subcategory_id || null
      }
      if (id) subcategoryIdCache.set(key, id)
      return id
    }

    const resolveOrCreateFranchise = async (name, subcategoryId) => {
      const key = name.trim().toLowerCase()
      const subId = subcategoryId || catalogAdminSubcategoryId
      if (franchiseIdCache.has(key)) {
        const id = franchiseIdCache.get(key)
        if (id && subId) await supabase.from('franchise_subcategory').upsert({ franchise_id: id, subcategory_id: subId }, { onConflict: 'franchise_id,subcategory_id', ignoreDuplicates: true })
        return id
      }
      const { data: found } = await supabase.from('franchises').select('franchise_id').ilike('name', name.trim()).limit(1).maybeSingle()
      let id = found?.franchise_id || null
      if (!id) {
        const { data: created } = await supabase.from('franchises').insert({ name: name.trim() }).select('franchise_id').single()
        id = created?.franchise_id || null
      }
      if (id && subId) {
        await supabase.from('franchise_subcategory').upsert({ franchise_id: id, subcategory_id: subId }, { onConflict: 'franchise_id,subcategory_id', ignoreDuplicates: true })
      }
      if (id) franchiseIdCache.set(key, id)
      return id
    }

    const resolveOrCreateBrand = async (rawName, franchiseId) => {
      // Canonicalize LEGO brand synonyms so imports reuse the canonical brand
      // (e.g. "Minifigures"/"Minifigure"/"Minifig" → "Minifigs") instead of
      // creating a near-duplicate.
      let name = rawName
      if (isLegoCategory) {
        const lc = (rawName || '').trim().toLowerCase()
        if (/^minifig(ure)?s?$/.test(lc)) name = 'Minifigs'
        else if (/^sets?$/.test(lc)) name = 'Sets'
        else if (/^(misc|miscellaneous)$/.test(lc)) name = 'Miscellaneous'
      }
      const key = `${franchiseId}::${name.trim().toLowerCase()}`
      if (brandIdCache.has(key)) return brandIdCache.get(key)
      // Look for existing brand linked to this franchise
      const { data: bfRows } = await supabase.from('brand_franchise').select('brand_id').eq('franchise_id', franchiseId)
      const linkedIds = (bfRows || []).map(r => r.brand_id)
      let id = null
      if (linkedIds.length > 0) {
        const { data: found } = await supabase.from('brands').select('brand_id').ilike('name', name.trim()).in('brand_id', linkedIds).limit(1).maybeSingle()
        id = found?.brand_id || null
      }
      if (!id) {
        // Brand might exist but not linked to this franchise yet
        const { data: anyBrand } = await supabase.from('brands').select('brand_id').ilike('name', name.trim()).limit(1).maybeSingle()
        id = anyBrand?.brand_id || null
        if (!id) {
          const { data: created } = await supabase.from('brands').insert({ name: name.trim() }).select('brand_id').single()
          id = created?.brand_id || null
        }
        if (id) await supabase.from('brand_franchise').upsert({ brand_id: id, franchise_id: franchiseId }, { onConflict: 'brand_id,franchise_id', ignoreDuplicates: true })
      }
      if (id) brandIdCache.set(key, id)
      return id
    }

    const resolveOrCreateCollectibleSet = async (name, franchiseId, brandId) => {
      // For LEGO, collectible_set is repurposed as global PACKAGING (Box / Polybag
      // / Blister pack) — brand/franchise agnostic. Resolve & create it globally
      // (brand_id null) so we reuse the seeded rows instead of forking a per-brand
      // duplicate ("Box" listed twice).
      const scopeBrand     = isLegoCategory ? null : (brandId || null)
      const scopeFranchise = isLegoCategory ? null : (franchiseId || null)
      const key = `${scopeFranchise || ''}::${scopeBrand || ''}::${name.trim().toLowerCase()}`
      if (collectibleSetIdCache.has(key)) return collectibleSetIdCache.get(key)
      let q = supabase.from('collectible_sets').select('collectible_set_id').ilike('name', name.trim())
      if (isLegoCategory) q = q.is('brand_id', null)
      else if (scopeBrand) q = q.eq('brand_id', scopeBrand)
      else if (scopeFranchise) q = q.eq('franchise_id', scopeFranchise)
      const { data: found } = await q.limit(1).maybeSingle()
      let id = found?.collectible_set_id || null
      if (!id) {
        const { data: created } = await supabase.from('collectible_sets').insert({ name: name.trim(), brand_id: scopeBrand, franchise_id: scopeFranchise }).select('collectible_set_id').single()
        id = created?.collectible_set_id || null
      }
      if (id) collectibleSetIdCache.set(key, id)
      return id
    }

    // Faceted classification (mirrors Single Item): Subtheme = subsets (scoped to
    // the Theme), Product Line = product_lines (scoped to the Subtheme, m2m).
    const resolveOrCreateSubset = async (name, franchiseId) => {
      if (!name?.trim() || !franchiseId) return null
      const key = `${franchiseId}::${name.trim().toLowerCase()}`
      if (subsetIdCache.has(key)) return subsetIdCache.get(key)
      const { data: found } = await supabase.from('subsets').select('subset_id').eq('franchise_id', franchiseId).ilike('name', name.trim()).limit(1).maybeSingle()
      let id = found?.subset_id || null
      if (!id) {
        const { data: created } = await supabase.from('subsets').insert({ name: name.trim(), franchise_id: franchiseId }).select('subset_id').single()
        id = created?.subset_id || null
      }
      if (id) subsetIdCache.set(key, id)
      return id
    }
    // Property = IP sub-level under the Franchise (Episode VI, Jurassic Park).
    // Anchors to the Theme/franchise; Subtheme optional. Stored in `properties`.
    const resolveOrCreateProperty = async (name, subsetId, franchiseId) => {
      if (!name?.trim() || !franchiseId) return null
      const key = `P::${franchiseId}::${name.trim().toLowerCase()}`
      if (propertyIdCache.has(key)) return propertyIdCache.get(key)
      const { data: found } = await supabase.from('properties').select('property_id')
        .ilike('name', name.trim()).eq('franchise_id', franchiseId).limit(1).maybeSingle()
      let id = found?.property_id || null
      if (!id) {
        const { data: created } = await supabase.from('properties')
          .insert({ name: name.trim(), franchise_id: franchiseId, subset_id: subsetId || null })
          .select('property_id').single()
        id = created?.property_id || null
      }
      if (id) propertyIdCache.set(key, id)
      return id
    }
    // Product Line = commercial toy line owned by the manufacturer/Subcategory
    // (Micro Galaxy Squadron, Mystery Minis), franchise associated. Stored in
    // the (repurposed) `product_lines` table.
    const resolveOrCreateProductLine = async (name, subcategoryId, franchiseId) => {
      if (!name?.trim() || !subcategoryId) return null
      const key = `PL::${subcategoryId}::${name.trim().toLowerCase()}`
      if (productLineIdCache.has(key)) return productLineIdCache.get(key)
      const { data: found } = await supabase.from('product_lines').select('product_line_id')
        .ilike('name', name.trim()).eq('subcategory_id', subcategoryId).limit(1).maybeSingle()
      let id = found?.product_line_id || null
      if (!id) {
        const { data: created } = await supabase.from('product_lines')
          .insert({ name: name.trim(), subcategory_id: subcategoryId, franchise_id: franchiseId || null })
          .select('product_line_id').single()
        id = created?.product_line_id || null
      }
      if (id) productLineIdCache.set(key, id)
      return id
    }
    // Series (facet) — scoped to the Subcategory (manufacturer/publisher).
    const seriesIdCache = new Map()
    const resolveOrCreateSeries = async (name, subcategoryId) => {
      if (!name?.trim() || !subcategoryId) return null
      const key = `${subcategoryId}::${name.trim().toLowerCase()}`
      if (seriesIdCache.has(key)) return seriesIdCache.get(key)
      const { data: found } = await supabase.from('series').select('series_id').eq('subcategory_id', subcategoryId).ilike('name', name.trim()).limit(1).maybeSingle()
      let id = found?.series_id || null
      if (!id) {
        const { data: created } = await supabase.from('series').insert({ name: name.trim(), subcategory_id: subcategoryId }).select('series_id').single()
        id = created?.series_id || null
      }
      if (id) seriesIdCache.set(key, id)
      return id
    }

    for (const row of toSave) {
      // ── Resolve franchise / brand / collectible set per row ────────────────
      let rowFranchiseId     = null
      let rowBrandId         = null
      let rowCollectibleSetId = null
      let rowSubsetId        = null
      // Brand/Manufacturer (per-row) → Subcategory; falls back to the UI selection.
      const rowSubcategoryId = row.manufacturer_name?.trim()
        ? (await resolveOrCreateSubcategory(row.manufacturer_name, catalogAdminCategoryId)) || catalogAdminSubcategoryId
        : catalogAdminSubcategoryId
      if (row.franchise_name?.trim()) rowFranchiseId = await resolveOrCreateFranchise(row.franchise_name, rowSubcategoryId)
      if (row.brand_name?.trim() && rowFranchiseId) rowBrandId = await resolveOrCreateBrand(row.brand_name, rowFranchiseId)
      // Minifigs don't have packaging — skip resolving a collectible_set for them.
      const rowBlIdForPkg = row.bricklink_id?.trim() || ''
      const rowIsMinifig = isLegoCategory && !(row.lego_set_number?.trim() || (rowBlIdForPkg && /^\d/.test(rowBlIdForPkg)) || /^sets?$/i.test((row.brand_name || '').trim()))
      if (row.collectible_set_name?.trim() && !rowIsMinifig) rowCollectibleSetId = await resolveOrCreateCollectibleSet(row.collectible_set_name, rowFranchiseId, rowBrandId)
      // ── Faceted: Subtheme (subset) — picked id, else resolve the CSV name ──
      rowSubsetId = row.subset_id || (row.subtheme_name?.trim() ? await resolveOrCreateSubset(row.subtheme_name, rowFranchiseId) : null)
      // ── Series (facet) — resolve the CSV name against this Subcategory ──
      const rowSeriesId = row.series_name?.trim()
        ? await resolveOrCreateSeries(row.series_name, rowSubcategoryId)
        : null
      // ── Building Blocks: reuse existing minifig by bricklink_id OR fig-num ──
      // Minifigs are identified by their Rebrickable fig-num (the spec's dedupe
      // key); many also carry a bricklink code. Match on either so a re-import —
      // or the same fig arriving from a different source — is skipped, never
      // duplicated.
      const blId = row.bricklink_id?.trim() || null
      const rbId = row.rebrickable_fig_id?.trim() || null
      if (isLegoCategory && (blId || rbId)) {
        let existingId = (blId && bricklinkItemCache.get(blId)) || null
        let matchKey   = blId
        if (!existingId && blId) {
          const { data: existing } = await supabase.from('items').select('item_id').eq('bricklink_id', blId).maybeSingle()
          existingId = existing?.item_id || null
        }
        if (!existingId && rbId) {
          const { data: existingRb } = await supabase.from('items').select('item_id').eq('rebrickable_fig_id', rbId).maybeSingle()
          if (existingRb?.item_id) { existingId = existingRb.item_id; matchKey = rbId }
        }
        if (existingId) {
          savedItems.push({ itemId: existingId, row }) // links resolved in the post-pass
          updateBulkRow(row._origIdx, { status: 'skipped', errorMsg: `Already in catalog (${matchKey})` })
          saved++
          setBulkImportSaveProgress(saved)
          continue
        }
      }
      // ── Building Blocks: skip a SET that already exists ───────────────────
      // Sets are keyed by lego_set_number (they usually have no bricklink_id, so
      // the check above never catches them). Variants share a number but differ
      // by description ("Variant: Black Box" vs "Blue Box"), so match on both.
      // Without this, re-running an interrupted import duplicates every set that
      // was already saved.
      const rowSetNum = isLegoCategory ? (row.lego_set_number?.trim() || null) : null
      if (rowSetNum) {
        const rowDesc = (row.description?.trim() || '').toLowerCase()
        const { data: existingSets } = await supabase
          .from('items').select('item_id, description').eq('lego_set_number', rowSetNum)
        const dup = (existingSets || []).find(s => (s.description?.trim() || '').toLowerCase() === rowDesc)
        if (dup) {
          // Backfill retail price onto an already-imported set when the CSV supplies one.
          const rp = row.retail_price
          if (rp !== '' && rp != null && Number.isFinite(Number(rp))) {
            await supabase.from('items').update({ retail_price: Number(rp) }).eq('item_id', dup.item_id)
          }
          savedItems.push({ itemId: dup.item_id, row }) // links resolved in the post-pass
          updateBulkRow(row._origIdx, { status: 'skipped', errorMsg: `Already in catalog (set ${rowSetNum})` })
          saved++
          setBulkImportSaveProgress(saved)
          continue
        }
      }
      // ── Mint minifig code — only for minifig items, not sets ──────────────
      // Sets have numeric BrickLink IDs (e.g. "75357-1") or an explicit lego_set_number.
      // Minifig BrickLink IDs start with letters (e.g. "sw0001", "col001").
      let mintedCode = row.minifig_code?.trim() || null
      const rowIsSet = !!(row.lego_set_number?.trim() || (blId && /^\d/.test(blId)))
      if (isLegoCategory && !mintedCode && !rowIsSet && rowFranchiseId) {
        const charName = row.subjectObj?.name || row.subject_name?.trim() || ''
        mintedCode = await mintMinifigCode(rowFranchiseId, row.collectible_set_name, charName) || null
      }
      // ── Create new item ────────────────────────────────────────────────────
      const { data: created, error } = await supabase.from('items').insert({
        name:                 row.item_name?.trim()         || null,
        category_id:          catalogAdminCategoryId        || null,
        subcategory_id:       rowSubcategoryId              || null,
        franchise_id:         rowFranchiseId                || null,
        brand_id:             rowBrandId                    || null,
        collectible_set_id:   rowCollectibleSetId           || null,
        subcollectble_set_id: row.subcollectble_set_id       || null,
        subset_id:            rowSubsetId                    || null,
        series_id:            rowSeriesId                    || null,
        print_type_id:        row.print_type_id              || null,
        bricklink_id:         blId                           || null,
        rebrickable_fig_id:   row.rebrickable_fig_id?.trim() || null,
        piece_count:          row.piece_count !== '' ? Number(row.piece_count) : null,
        print_count:          row.print_count !== '' ? Number(row.print_count) : null,
        upc:                  row.upc?.trim()                || null,
        description:          row.description?.trim()        || null,
        card_number:          row.card_number?.trim()        || null,
        release_year:         row.release_year !== '' ? Number(row.release_year) : null,
        rarity_id:            row.rarity_id                  || null,
        minifig_code:         mintedCode,
        lego_set_number:      row.lego_set_number?.trim()    || null,
        retail_price:         row.retail_price !== '' && row.retail_price != null && Number.isFinite(Number(row.retail_price)) ? Number(row.retail_price) : null,
      }).select('item_id').single()
      if (error) {
        updateBulkRow(row._origIdx, { status: 'error', errorMsg: error.message })
        continue
      }
      if (isLegoCategory && blId) bricklinkItemCache.set(blId, created.item_id)
      savedItems.push({ itemId: created.item_id, row }) // links resolved in the post-pass
      // Subjects are optional and only assigned from an explicit Subject value —
      // the item's own name is NOT a Subject.
      let subjectId = row.subjectObj?.id || null
      if (!subjectId && row.subject_name?.trim()) {
        const trimmedName = row.subject_name.trim()
        // Look up existing subject by name before creating a new one
        const { data: existingSubs } = await supabase
          .from('subjects')
          .select('subject_id')
          .ilike('subject_name', trimmedName)
          .limit(1)
        subjectId = existingSubs?.[0]?.subject_id || null
        if (!subjectId) {
          const { data: newSub } = await supabase
            .from('subjects')
            .insert({ subject_name: trimmedName, subject_type: getBulkSubjectType(row) })
            .select('subject_id')
            .single()
          subjectId = newSub?.subject_id || null
        }
        if (subjectId && rowFranchiseId) {
          await supabase.from('subject_franchise').upsert(
            { subject_id: subjectId, franchise_id: rowFranchiseId },
            { onConflict: 'subject_id,franchise_id' }
          )
        }
      }
      if (subjectId) {
        await supabase.from('items').update({ subject_id: subjectId }).eq('item_id', created.item_id)
        await supabase.from('item_subjects').insert({ item_id: created.item_id, subject_id: subjectId })
        if (row.species_id) {
          await supabase.from('subjects').update({ species_id: row.species_id }).eq('subject_id', subjectId)
        }
      }
      if (row.card_type_ids?.length > 0) {
        const { error: ctErr } = await supabase.from('item_card_types').insert(row.card_type_ids.map(ctid => ({ item_id: created.item_id, card_type_id: ctid })))
        if (ctErr) console.error('item_card_types insert error (bulk):', ctErr)
      }
      if (row.team_ids?.length > 0) {
        const { error: tmErr } = await supabase.from('item_teams').insert(row.team_ids.map(tid => ({ item_id: created.item_id, team_id: tid })))
        if (tmErr) console.error('item_teams insert error (bulk):', tmErr)
      }
      // ── Faceted: Property (IP sub-level) — resolves against the Franchise. ──
      if (rowFranchiseId && (row.property_names?.trim() || (row.product_line_ids || []).length)) {
        const propIds = new Set(row.product_line_ids || []) // picked ids target properties
        if (row.property_names?.trim()) {
          for (const nm of row.property_names.split(';').map(s => s.trim()).filter(Boolean)) {
            const pid = await resolveOrCreateProperty(nm, rowSubsetId, rowFranchiseId)
            if (pid) propIds.add(pid)
          }
        }
        if (propIds.size > 0) {
          const { error: prErr } = await supabase.from('item_properties')
            .insert([...propIds].map(pid => ({ item_id: created.item_id, property_id: pid })))
          if (prErr) console.error('item_properties insert error (bulk):', prErr)
        }
      }
      // ── Faceted: Product Line (commercial line) — owned by the Subcategory. ──
      if (rowSubcategoryId && row.product_line_names?.trim()) {
        const plIds = new Set()
        for (const nm of row.product_line_names.split(';').map(s => s.trim()).filter(Boolean)) {
          const plId = await resolveOrCreateProductLine(nm, rowSubcategoryId, rowFranchiseId)
          if (plId) plIds.add(plId)
        }
        if (plIds.size > 0) {
          const { error: plErr } = await supabase.from('item_product_lines')
            .insert([...plIds].map(plid => ({ item_id: created.item_id, product_line_id: plid })))
          if (plErr) console.error('item_product_lines insert error (bulk):', plErr)
        }
      }
      if (row.image_file) {
        const ext = row.image_file.name.split('.').pop()
        const path = `items/${created.item_id}/${Date.now()}_0.${ext}`
        const { error: upErr } = await supabase.storage.from('item-images').upload(path, row.image_file)
        if (!upErr) await supabase.from('item_images').insert({ item_id: created.item_id, image_path: path, position: 0 })
      } else if (row.image_url?.trim()) {
        const u = row.image_url.trim()
        const isImageUrl = /\.(jpe?g|png|webp|gif|avif|svg)(\?.*)?$/i.test(u)
        if (isImageUrl) {
          await supabase.from('item_images').insert({ item_id: created.item_id, image_path: u, position: 0 })
        }
      }
      updateBulkRow(row._origIdx, { status: 'saved' })
      saved++
      setBulkImportSaveProgress(saved)
    }

    // ── Post-insert linking pass: Includes / Included In ──────────────────────
    // Runs after ALL items exist, so ordering doesn't matter, and handles
    // comma/semicolon-separated multi-values. Each referenced code is resolved
    // across minifig_code / lego_set_number / bricklink_id. A minifig↔set pair
    // becomes a set_minifigs link; anything else (set↔set value packs, magnet
    // sets → magnets) becomes a set_contents link. set_contents upserts are
    // no-ops (silently skipped) until the set_contents migration is applied.
    if (isLegoCategory && savedItems.length) {
      const codeCache = new Map() // code_lc → { itemId, isMinifig } | null
      const resolveByCode = async (raw) => {
        const c = (raw || '').trim()
        if (!c) return null
        const key = c.toLowerCase()
        if (codeCache.has(key)) return codeCache.get(key)
        let hit = null
        const { data: byFig } = await supabase.from('items').select('item_id, minifig_code').eq('minifig_code', c).maybeSingle()
        if (byFig) hit = { itemId: byFig.item_id, isMinifig: true }
        if (!hit) {
          const setNum = c.replace(/-\d+$/, '')
          const { data: bySet } = await supabase.from('items').select('item_id, minifig_code').eq('lego_set_number', setNum).maybeSingle()
          if (bySet) hit = { itemId: bySet.item_id, isMinifig: !!bySet.minifig_code }
        }
        if (!hit) {
          const { data: byBl } = await supabase.from('items').select('item_id, minifig_code').eq('bricklink_id', c).maybeSingle()
          if (byBl) hit = { itemId: byBl.item_id, isMinifig: !!byBl.minifig_code }
        }
        codeCache.set(key, hit)
        return hit
      }
      const linkPair = async (parent, child, qty = 1) => {
        if (!parent || !child || parent.itemId === child.itemId) return
        // Universal relationship (source of truth for the Related Items tab). Update
        // quantity on conflict so a re-import with a higher count is reflected.
        await supabase.from('catalog_item_relationships').upsert(
          { parent_item_id: parent.itemId, child_item_id: child.itemId, relationship_type: 'includes', quantity: qty, created_by: profile?.id || null },
          { onConflict: 'parent_item_id,child_item_id,relationship_type' })
        // Mirror set↔minifig into legacy set_minifigs so LEGO completion stays correct.
        if (child.isMinifig && !parent.isMinifig) {
          await supabase.from('set_minifigs').upsert(
            { set_item_id: parent.itemId, minifig_item_id: child.itemId, quantity: qty },
            { onConflict: 'set_item_id,minifig_item_id' })
        }
      }
      // Parse a code token that may carry a quantity: "atl015 x2" / "atl015*2" /
      // "atl015 (2)" → { code:'atl015', qty:2 }. Bare code → qty 1.
      const parseCode = (raw) => {
        const s = String(raw || '').trim()
        let m = s.match(/^(.+?)\s*[x×*]\s*(\d+)$/i) || s.match(/^(.+?)\s*\((\d+)\)$/)
        return m ? { code: m[1].trim(), qty: Math.max(1, parseInt(m[2], 10)) } : { code: s, qty: 1 }
      }
      const splitCodes = (v) => String(v || '').split(/[,;]/).map(s => s.trim()).filter(Boolean).map(parseCode)
      for (const { itemId, row } of savedItems) {
        const self = { itemId, isMinifig: /minifig/i.test(row.brand_name || '') || !!(row.minifig_code && row.minifig_code.trim()) }
        for (const { code, qty } of splitCodes(row.parent_set_bricklink_id)) { // Included In: parent contains self
          await linkPair(await resolveByCode(code), self, qty)
        }
        for (const { code, qty } of splitCodes(row.includes)) {                 // Includes: self contains child
          await linkPair(self, await resolveByCode(code), qty)
        }
      }
    }

    setBulkImportIsSaving(false)
  }

  const updateBulkPhotoRow = (idx, updates) =>
    setBulkPhotoRows(rows => rows.map((r, i) => i === idx ? { ...r, ...updates } : r))

  const bulkPhotoAdvancePhase = (updatedRows, fromPhase) => {
    if (fromPhase === 'new') {
      const firstUpdate = updatedRows.findIndex(r => r.status === 'pending' && r.hasExistingImage)
      setBulkPhotoPhase('update')
      if (firstUpdate >= 0) { setBulkPhotoIdx(firstUpdate); setBulkPhotoManualSearch('') }
    }
  }

  const bulkPhotoApprove = () => {
    const cur = bulkPhotoRows[bulkPhotoIdx]
    if (!cur?.matchedItem) { updateBulkPhotoRow(bulkPhotoIdx, { errorMsg: 'Assign a card before approving.' }); return }
    const itemId = cur.matchedItem.item_id
    const isNewPhase = bulkPhotoPhase === 'new'
    const phaseFilter = r => isNewPhase ? !r.hasExistingImage : r.hasExistingImage
    const updatedRows = bulkPhotoRows.map((r, i) => {
      if (i === bulkPhotoIdx) return { ...r, status: 'approved', errorMsg: '' }
      if (r.matchedItem?.item_id === itemId && r.status !== 'saved' && r.status !== 'skipped' && r.status !== 'error')
        return { ...r, status: 'skipped', errorMsg: 'Skipped — another photo approved for this card' }
      return r
    })
    setBulkPhotoRows(updatedRows)
    const next = updatedRows.findIndex((r, i) =>
      i > bulkPhotoIdx && r.status === 'pending' && phaseFilter(r) && r.matchedItem?.item_id !== itemId
    )
    if (next >= 0) { setBulkPhotoIdx(next); setBulkPhotoManualSearch('') }
    else if (isNewPhase) bulkPhotoAdvancePhase(updatedRows, 'new')
  }

  const bulkPhotoApproveAll = () => {
    const isNewPhase = bulkPhotoPhase === 'new'
    const phaseFilter = r => isNewPhase ? !r.hasExistingImage : r.hasExistingImage
    const seenIds = new Set()
    setBulkPhotoRows(rows => rows.map(r => {
      if (!phaseFilter(r) || r.status !== 'pending' || !r.matchedItem) return r
      if (seenIds.has(r.matchedItem.item_id)) return { ...r, status: 'skipped', errorMsg: 'Skipped — another photo approved for this card' }
      seenIds.add(r.matchedItem.item_id)
      return { ...r, status: 'approved', errorMsg: '' }
    }))
  }

  const bulkPhotoSkip = () => {
    const isNewPhase = bulkPhotoPhase === 'new'
    const phaseFilter = r => isNewPhase ? !r.hasExistingImage : r.hasExistingImage
    const updatedRows = bulkPhotoRows.map((r, i) => i === bulkPhotoIdx ? { ...r, status: 'skipped' } : r)
    setBulkPhotoRows(updatedRows)
    const next = updatedRows.findIndex((r, i) => i > bulkPhotoIdx && r.status === 'pending' && phaseFilter(r))
    if (next >= 0) { setBulkPhotoIdx(next); setBulkPhotoManualSearch('') }
    else if (isNewPhase) bulkPhotoAdvancePhase(updatedRows, 'new')
  }

  const handleBulkPhotoFolder = async (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!imageFiles.length || !catalogAdminFranchiseId) return
    const position = bulkPhotoPosition

    let q = supabase.from('item_details')
      .select('item_id, card_number, subject, collectible_set_id, subcollectble_set_id, print_type_id')
      .eq('collectible_set_id', catalogAdminFranchiseId)
    if (catalogAdminSubsetId) q = q.eq('subcollectble_set_id', catalogAdminSubsetId)
    if (bulkPhotoPrintTypeId === '__none__') q = q.is('print_type_id', null)
    else if (bulkPhotoPrintTypeId) q = q.eq('print_type_id', bulkPhotoPrintTypeId)
    const { data: subsetItems } = await q
    const items = subsetItems || []
    setBulkPhotoSubsetItems(items)

    const bySubject = new Map()
    for (const item of items) {
      if (item.subject) bySubject.set(item.subject.trim().toLowerCase(), item)
    }

    const rows = imageFiles.map(file => ({
      _id: Math.random().toString(36).slice(2),
      file,
      filename: file.name,
      preview: URL.createObjectURL(file),
      matchedItem: null,
      matchType: null,
      extractedText: '',
      description: '',
      print_type_id: bulkPhotoPrintTypeId || '',
      hasExistingImage: false,
      status: 'pending',
      errorMsg: '',
    }))
    setBulkPhotoRows([...rows])
    setBulkPhotoIdx(0)
    setBulkPhotoAnalyzing(true)
    setBulkPhotoAnalyzeProgress({ done: 0, total: imageFiles.length })
    setBulkPhotoSaveError('')
    setBulkPhotoSaveProgress(0)
    setBulkPhotoPhase(null)

    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker('eng')

    for (let i = 0; i < imageFiles.length; i++) {
      let matchedItem = null, matchType = null, extractedText = ''
      try {
        const { data } = await worker.recognize(imageFiles[i])
        extractedText = data.text || ''
        const textLow = extractedText.toLowerCase()
        for (const [key, item] of bySubject) {
          if (key.length >= 3 && textLow.includes(key)) { matchedItem = item; matchType = 'subject_name'; break }
        }
      } catch (_) { /* OCR failure */ }
      rows[i] = { ...rows[i], matchedItem, matchType, extractedText, description: extractedText.trim() }
      setBulkPhotoRows([...rows])
      setBulkPhotoAnalyzeProgress({ done: i + 1, total: imageFiles.length })
    }

    await worker.terminate()

    // Deduplicate — first match wins
    const seen = new Set()
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].matchedItem) continue
      const id = rows[i].matchedItem.item_id
      if (seen.has(id)) rows[i] = { ...rows[i], status: 'skipped', errorMsg: 'Duplicate — another image already matched this card' }
      else seen.add(id)
    }

    // Check which matched items already have a position-0 image
    const matchedIds = rows.filter(r => r.matchedItem && r.status !== 'skipped').map(r => r.matchedItem.item_id)
    if (matchedIds.length) {
      const { data: imgs } = await supabase.from('item_images').select('item_id').in('item_id', matchedIds).eq('position', position)
      const withImg = new Set((imgs || []).map(r => r.item_id))
      for (let i = 0; i < rows.length; i++) {
        rows[i] = { ...rows[i], hasExistingImage: rows[i].matchedItem ? withImg.has(rows[i].matchedItem.item_id) : false }
      }
    }

    setBulkPhotoRows([...rows])
    setBulkPhotoAnalyzing(false)

    const hasNew = rows.some(r => r.status === 'pending' && !r.hasExistingImage)
    const hasUpdate = rows.some(r => r.status === 'pending' && r.hasExistingImage)
    if (hasNew) {
      setBulkPhotoPhase('new')
      setBulkPhotoIdx(rows.findIndex(r => r.status === 'pending' && !r.hasExistingImage))
    } else if (hasUpdate) {
      setBulkPhotoPhase('update')
      setBulkPhotoIdx(rows.findIndex(r => r.status === 'pending' && r.hasExistingImage))
    } else {
      setBulkPhotoPhase('review')
    }
  }

  const handleBulkPhotoSave = async () => {
    const toSave = bulkPhotoRows.map((r, i) => ({ ...r, _origIdx: i })).filter(r => r.status === 'approved' && r.matchedItem)
    if (!toSave.length) return
    setBulkPhotoIsSaving(true)
    setBulkPhotoSaveError('')
    setBulkPhotoSaveProgress(0)
    let saved = 0
    const pos = bulkPhotoPosition
    for (const row of toSave) {
      const item_id = row.matchedItem.item_id
      try {
        await supabase.from('item_images').delete().eq('item_id', item_id).eq('position', pos)
        const ext = row.file.name.split('.').pop().toLowerCase() || 'jpg'
        const path = `items/${item_id}/${Date.now()}_${pos}.${ext}`
        const { error: upErr } = await supabase.storage.from('item-images').upload(path, row.file)
        if (upErr) { updateBulkPhotoRow(row._origIdx, { status: 'error', errorMsg: upErr.message }); continue }
        await supabase.from('item_images').insert({ item_id, image_path: path, position: pos })
        const itemUpdate = {}
        if (row.description?.trim()) itemUpdate.description = row.description.trim()
        if (row.print_type_id) itemUpdate.print_type_id = row.print_type_id
        if (Object.keys(itemUpdate).length) {
          await supabase.from('items').update(itemUpdate).eq('item_id', item_id)
        }
        updateBulkPhotoRow(row._origIdx, { status: 'saved' })
        saved++
        setBulkPhotoSaveProgress(saved)
      } catch (e) {
        updateBulkPhotoRow(row._origIdx, { status: 'error', errorMsg: e.message })
      }
    }
    setBulkPhotoIsSaving(false)
    setBulkPhotoPhase('review')
  }

  // Mint a minifig code (THEME-PROPERTY-SHORTHAND-NN) for the manual add form,
  // mirroring the bulk importer. Returns null if the theme/property can't resolve.
  const mintMinifigCodeFor = async (franchiseId, collectibleSetName, characterName) => {
    if (!franchiseId || !characterName) return null
    const { data: fr } = await supabase.from('franchises').select('lego_abbreviation').eq('franchise_id', franchiseId).maybeSingle()
    const themeAbbrev = fr?.lego_abbreviation
    if (!themeAbbrev) return null
    const colSetLower = (collectibleSetName || '').toLowerCase().trim()
    const propEntry = colSetLower
      ? legoPropertyRegistry.find(p => p.full_name.toLowerCase() === colSetLower || p.full_name.toLowerCase().includes(colSetLower) || colSetLower.includes(p.full_name.toLowerCase()))
      : null
    if (!propEntry) return null
    const shorthand = deriveMinifigShorthand(characterName)
    if (!shorthand) return null
    const prefix = `${themeAbbrev}-${propEntry.abbreviation}-${shorthand}`
    const { data: codeRows } = await supabase.from('items').select('minifig_code').like('minifig_code', `${prefix}-%`).not('minifig_code', 'is', null)
    const nums = (codeRows || []).map(r => { const m = r.minifig_code?.match(/-(\d+)$/); return m ? parseInt(m[1], 10) : 0 })
    const nn = (nums.length ? Math.max(...nums) : 0) + 1
    return `${prefix}-${String(nn).padStart(2, '0')}`
  }

  const handleCreateCatalogItemInApp = async (mode) => {

    if (!isPlatformAdmin) {
      setCatalogAdminFormError(t('adminItemCreateFailed'))
      return
    }

    if (!catalogAdminCategoryId || !catalogAdminSubcategoryId) {
      setCatalogAdminFormError('Please select a category and subcategory.')
      return
    }

    setCatalogAdminFormError('')
    setIsCreatingCatalogItem(true)

    const isLegoInsert = selectedCatalogAdminCategoryName === 'Building Blocks'
    // A LEGO minifig (has a Rebrickable id or a letter-prefixed BrickLink code, and
    // no set number) gets an auto-minted internal code — same as the bulk importer.
    let mintedMinifigCode = null
    if (isLegoInsert && !catalogAdminLegoSetNumber.trim()) {
      const blId = catalogAdminBricklinkId.trim()
      const looksLikeMinifig = !!catalogAdminRebrickableId.trim() || (blId && /^[A-Za-z]/.test(blId))
      const charName = catalogAdminSubjectIds[0]?.name || ''
      if (looksLikeMinifig && charName) {
        const colSetName = catalogAdminFranchises.find(s => s.id === catalogAdminFranchiseId)?.name || ''
        mintedMinifigCode = await mintMinifigCodeFor(catalogAdminRealFranchiseId, colSetName, charName)
      }
    }
    const { data: createdItem, error } = await supabase
      .from('items')
      .insert({
        category_id:          catalogAdminCategoryId             || null,
        subcategory_id:       catalogAdminSubcategoryId           || null,
        franchise_id:         catalogAdminRealFranchiseId         || null,
        brand_id:             catalogAdminBrandId                 || null,
        collectible_set_id:   catalogAdminFranchiseId             || null,
        subcollectble_set_id: catalogAdminSubsetId                || null,
        series_id:            catalogAdminSeriesId                || null,
        subject_id:           null,
        description:          catalogAdminItemDescription.trim()  || null,
        bricklink_id:         catalogAdminBricklinkId.trim()      || null,
        release_year:         catalogAdminReleaseYear !== '' ? Number(catalogAdminReleaseYear) : null,
        ...(isLegoInsert ? {
          rebrickable_fig_id: catalogAdminRebrickableId.trim()   || null,
          upc:                catalogAdminUpc.trim()              || null,
          piece_count:        catalogAdminPieceCount !== '' ? Number(catalogAdminPieceCount) : null,
          lego_set_number:    catalogAdminLegoSetNumber.trim()    || null,
          retail_price:       catalogAdminRetailPrice !== '' && Number.isFinite(Number(catalogAdminRetailPrice)) ? Number(catalogAdminRetailPrice) : null,
          minifig_code:       mintedMinifigCode || null,
          // Faceted model: Subtheme (subset) + Packaging (repurposed collectible_set);
          // the old subcollectible_set is unused for LEGO.
          subset_id:            catalogAdminSubsetSel   || null,
          collectible_set_id:   catalogAdminPackagingId || null,
          subcollectble_set_id: null,
        } : {
          print_type_id:    catalogAdminPrintTypeId || null,
          card_number:      catalogAdminCardNumber.trim() || null,
          print_count:      catalogAdminPrintCount !== '' ? Number(catalogAdminPrintCount) : null,
          rarity_id:        catalogAdminRarityId || null,
          ...(catalogAdminIsMtg ? {
            mtg_card_type_id: catalogAdminMtgCardTypeId || null,
          } : {}),
        }),
      })
      .select('item_id')
      .single()

    if (error) {
      setCatalogAdminFormError(error.message || t('adminItemCreateFailed'))
      setIsCreatingCatalogItem(false)
      return
    }

    if (createdItem?.item_id) {
      for (const [file, position] of [[catalogAdminFrontImageFile, 0], [catalogAdminBackImageFile, 1]]) {
        if (!file) continue
        const ext = file.name.split('.').pop()
        const path = `items/${createdItem.item_id}/${Date.now()}_${position}.${ext}`
        const { error: uploadError } = await supabase.storage.from('item-images').upload(path, file)
        if (uploadError) {
          console.error('Image upload error:', uploadError)
          setCatalogAdminFormError(`Image upload failed: ${uploadError.message}`)
        } else {
          const { error: insertError } = await supabase.from('item_images').insert({ item_id: createdItem.item_id, image_path: path, position })
          if (insertError) {
            console.error('item_images insert error:', insertError)
            setCatalogAdminFormError(`Image record save failed: ${insertError.message}`)
          }
        }
      }
    }

    if (createdItem?.item_id && catalogAdminSubjectIds.length > 0) {
      await supabase.from('items').update({ subject_id: catalogAdminSubjectIds[0].id }).eq('item_id', createdItem.item_id)
      await supabase.from('item_subjects').insert(catalogAdminSubjectIds.map(s => ({ item_id: createdItem.item_id, subject_id: s.id })))
    }
    if (createdItem?.item_id && catalogAdminTeamIds.length > 0) {
      await supabase.from('item_teams').insert(catalogAdminTeamIds.map(tid => ({ item_id: createdItem.item_id, team_id: tid })))
    }
    if (createdItem?.item_id && catalogAdminCardTypeIds.length > 0) {
      await supabase.from('item_card_types').insert(
        catalogAdminCardTypeIds.map(ctid => ({ item_id: createdItem.item_id, card_type_id: ctid }))
      )
    }
    // Product Line is many-to-many (an item can belong to several).
    if (createdItem?.item_id && catalogAdminProductLineIds.length > 0) {
      // catalogAdminProductLineIds holds Property ids (create-form Property picker).
      await supabase.from('item_properties').insert(
        catalogAdminProductLineIds.map(pid => ({ item_id: createdItem.item_id, property_id: pid }))
      )
    }

    setCatalogAdminFrontImageFile(null)
    setCatalogAdminBackImageFile(null)
    setCatalogReloadToken(n => n + 1)

    if (mode === 'another') {
      setCatalogAdminSubjectIds([])
      setCatalogAdminSubjectSearch('')
      setCatalogAdminSubjectResults([])
      setCatalogAdminCardNumber('')
      setCatalogAdminPrintCount('')
      setCatalogAdminBricklinkId('')
      setCatalogAdminRebrickableId('')
      setCatalogAdminReleaseYear('')
      setCatalogAdminUpc('')
      setCatalogAdminPieceCount('')
      setCatalogAdminLegoSetNumber('')
      setCatalogAdminRetailPrice('')
      setCatalogAdminProductLineIds([])
      setCatalogAdminItemDescription('')
      setCatalogAdminMtgCardTypeId('')
      setCatalogAdminRarityId('')
    } else {
      setCatalogAdminItemDescription('')
      setCatalogAdminCardNumber('')
      setCatalogAdminPrintCount('')
      setCatalogAdminBricklinkId('')
      setCatalogAdminRebrickableId('')
      setCatalogAdminReleaseYear('')
      setCatalogAdminUpc('')
      setCatalogAdminPieceCount('')
      setCatalogAdminRealFranchiseId('')
      setCatalogAdminSubjectIds([])
      setCatalogAdminSubjectSearch('')
      setCatalogAdminSubjectResults([])
      setCatalogAdminTeamIds([])
      setCatalogAdminPrintTypeId('')
      setCatalogAdminCardTypeIds([])
      setCatalogAdminSubsetId('')
      setCatalogAdminFranchiseId('')
      setCatalogAdminBrandId('')
      setCatalogAdminMtgCardTypeId('')
      setCatalogAdminRarityId('')
      setIsCatalogItemModalOpen(false)
    }
    setIsCreatingCatalogItem(false)
  }

  const handleMenuAction = (label) => {
    if (label === 'Settings') {
      setCurrentScreen('settings')
      setSettingsError('')
      setIsUserMenuOpen(false)
      return
    }
    if (label === 'My Profile') {
      setCurrentScreen('profile')
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

    const { error } = await supabase.auth.resetPasswordForEmail(currentUser.email, {
      redirectTo: `${window.location.origin}/`,
    })
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

  const handleRemoveCollectionItem = async (item, mode) => {
    if (!currentUser?.id) return
    setRemoveConfirmItemId('')

    // Resolve which set copy ids we're removing (fetch ids first so we can also
    // clean up the minifigs that came with them).
    let setCopyIds = []
    if (mode === 'all') {
      const { data } = await supabase.from('owned_copies').select('id')
        .eq('user_id', currentUser.id).eq('catalog_item_id', item.id)
      setCopyIds = (data || []).map(r => r.id)
    } else {
      const { data } = await supabase.from('owned_copies').select('id')
        .eq('user_id', currentUser.id).eq('catalog_item_id', item.id)
        .order('created_at', { ascending: true }).limit(1)
      setCopyIds = data?.[0]?.id ? [data[0].id] : []
    }
    if (!setCopyIds.length) return

    // For a LEGO set, find the minifig copies that came WITH these set copies
    // (provenance: metadata.from_set.set_owned_copy_id) and offer to remove them.
    let figCopyIds = []
    if (item.categoryName === 'Building Blocks') {
      const { data: figCopies } = await supabase.from('owned_copies')
        .select('id')
        .eq('user_id', currentUser.id)
        .in('metadata->from_set->>set_owned_copy_id', setCopyIds)
      figCopyIds = (figCopies || []).map(r => r.id)
    }

    let alsoRemoveFigs = false
    if (figCopyIds.length) {
      alsoRemoveFigs = window.confirm(
        `Also remove the ${figCopyIds.length} connected minifig${figCopyIds.length > 1 ? 's' : ''} that came with this set?`,
      )
    }

    await supabase.from('owned_copies').delete().in('id', setCopyIds)
    if (alsoRemoveFigs && figCopyIds.length) {
      await supabase.from('owned_copies').delete().in('id', figCopyIds)
    }
    setCollectionReloadToken((t) => t + 1)
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
  const assignableCustomCollections = customCollections.filter(
    (collection) => (collection?.name || '').trim() !== DEFAULT_USER_COLLECTION_NAME,
  )
  const normalizedCollectionSearch = collectionSearchQuery.trim().toLowerCase()
  const getCollectionSortValue = (item) => {
    const marketValue = Number(item?.currentMarketValue || 0)
    if (marketValue > 0) {
      return marketValue
    }
    return Number(item?.totalInvested || 0)
  }
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

    if (collectionFilterSubtheme && (item.subtheme || '') !== collectionFilterSubtheme) return false
    if (collectionFilterFaction && !(Array.isArray(item.teams) && item.teams.includes(collectionFilterFaction))) return false
    if (collectionFilterSpecies && (item.species || '') !== collectionFilterSpecies) return false
    if (collectionFilterCondition && !(Array.isArray(item.conditions) && item.conditions.includes(collectionFilterCondition))) return false

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
  }).sort((a, b) => {
    switch (collectionSortKey) {
      case 'name':        return (a.name || '').localeCompare(b.name || '')
      case 'value_desc':  return getCollectionSortValue(b) - getCollectionSortValue(a)
      case 'value_asc':   return getCollectionSortValue(a) - getCollectionSortValue(b)
      case 'quantity':    return Number(b.totalQuantity || 0) - Number(a.totalQuantity || 0)
      case 'recent':
      default:            return (b.latestAddedAt || '').localeCompare(a.latestAddedAt || '')
    }
  })

  // Distinct filter options present in the collection (drives the dropdowns).
  const collectionFilterOptions = (() => {
    const subthemes = new Set(), factions = new Set(), species = new Set(), conditions = new Set()
    for (const item of collectionItems) {
      if (item.subtheme) subthemes.add(item.subtheme)
      if (Array.isArray(item.teams)) item.teams.forEach(t => factions.add(t))
      if (item.species) species.add(item.species)
      if (Array.isArray(item.conditions)) item.conditions.forEach(c => conditions.add(c))
    }
    const sorted = (s) => [...s].sort((a, b) => a.localeCompare(b))
    return { subthemes: sorted(subthemes), factions: sorted(factions), species: sorted(species), conditions: sorted(conditions) }
  })()

  const filteredCollectionItemIds = new Set(filteredCollectionItems.map((item) => item.id))
  const filteredInventoryRows = collectionInventoryRows.filter((row) => filteredCollectionItemIds.has(row.catalogItemId))
  const collectionOverviewTotalPages = Math.max(1, Math.ceil(filteredCollectionItems.length / COLLECTION_OVERVIEW_PAGE_SIZE))
  const collectionOverviewPageStart = (collectionOverviewPage - 1) * COLLECTION_OVERVIEW_PAGE_SIZE
  const paginatedCollectionItems = filteredCollectionItems.slice(
    collectionOverviewPageStart,
    collectionOverviewPageStart + COLLECTION_OVERVIEW_PAGE_SIZE,
  )
  const selectedCollectionItemDetails = collectionItems.find((item) => item.id === selectedCollectionItemDetailsId) || null

  const normalizedWishlistSearch = wishlistSearchQuery.trim().toLowerCase()
  const wishlistCategories = (() => {
    const seen = new Map()
    for (const item of wishlistItems) {
      if (item.category_id && !seen.has(item.category_id)) seen.set(item.category_id, item.categoryName || item.category_id)
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  })()
  const filteredWishlistItems = wishlistItems.filter(item => {
    if (wishlistCategoryFilter !== 'all' && item.category_id !== wishlistCategoryFilter) return false
    if (normalizedWishlistSearch && !item.name?.toLowerCase().includes(normalizedWishlistSearch) && !item.setName?.toLowerCase().includes(normalizedWishlistSearch) && !item.categoryName?.toLowerCase().includes(normalizedWishlistSearch)) return false
    return true
  })
  const wishlistSummary = {
    totalItems: wishlistItems.length,
    uniqueCategories: new Set(wishlistItems.map(i => i.category_id).filter(Boolean)).size,
    uniqueSets: new Set(wishlistItems.map(i => i.setName).filter(Boolean)).size,
    estimatedTotal: filteredWishlistItems.reduce((sum, i) => sum + (Number(i.market_price) || 0), 0),
    pricedCount: filteredWishlistItems.filter(i => i.market_price != null && Number(i.market_price) > 0).length,
    filteredCount: filteredWishlistItems.length,
  }
  const wishlistTotalPages = Math.max(1, Math.ceil(filteredWishlistItems.length / COLLECTION_OVERVIEW_PAGE_SIZE))
  const paginatedWishlistItems = filteredWishlistItems.slice(
    (wishlistPage - 1) * COLLECTION_OVERVIEW_PAGE_SIZE,
    wishlistPage * COLLECTION_OVERVIEW_PAGE_SIZE
  )
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
  // Editable condition scale for this owned copy, based on its category/brand.
  const selectedCopyIsLego = selectedCollectionCopyRow?.categoryName === 'Building Blocks'
  const selectedCopyIsLegoSet = selectedCopyIsLego && selectedCollectionCopyRow?.brandName === 'Sets'
  const selectedCopyConditionOptions = CARD_CONDITION_CATEGORIES.has(selectedCollectionCopyRow?.categoryName || '')
    ? CARD_CONDITION_SCALE
    : selectedCopyIsLego
      ? (selectedCopyIsLegoSet ? LEGO_SET_CONDITION_SCALE : LEGO_MINIFIG_CONDITION_SCALE)
      : []
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

  // Sell flow: for a LEGO set copy, load the connected minifigs the user actually
  // owns (available copies), so listing can offer to bundle them in.
  useEffect(() => {
    const copy = selectedCollectionCopyRow
    if (!currentUser?.id || !copy?.id || copy.categoryName !== 'Building Blocks') {
      setSellConnectedMinifigs([]); setSellMinifigInclusion({}); return
    }
    let cancelled = false
    ;(async () => {
      const { data: sm } = await supabase
        .from('set_minifigs').select('minifig_item_id').eq('set_item_id', copy.catalogItemId)
      const figIds = (sm || []).map(r => r.minifig_item_id)
      if (!figIds.length) { if (!cancelled) { setSellConnectedMinifigs([]); setSellMinifigInclusion({}) } return }
      // Owned copies of those minifigs; keep only ones still available (a null
      // sale_status means available, so filter in JS to avoid NULL-in-set pitfalls).
      const { data: ownedRaw } = await supabase
        .from('owned_copies')
        .select('id, catalog_item_id, condition, sale_status')
        .eq('user_id', currentUser.id)
        .in('catalog_item_id', figIds)
      const owned = (ownedRaw || []).filter(o => !['listed', 'sold'].includes(o.sale_status))
      if (!owned.length) { if (!cancelled) { setSellConnectedMinifigs([]); setSellMinifigInclusion({}) } return }
      // Resolve names.
      const ownedFigIds = [...new Set(owned.map(o => o.catalog_item_id))]
      const { data: figItems } = await supabase
        .from('items').select('item_id, description, subject_id').in('item_id', ownedFigIds)
      const subjIds = [...new Set((figItems || []).map(f => f.subject_id).filter(Boolean))]
      const { data: subs } = subjIds.length
        ? await supabase.from('subjects').select('subject_id, subject_name').in('subject_id', subjIds)
        : { data: [] }
      const subjName = Object.fromEntries((subs || []).map(s => [s.subject_id, s.subject_name]))
      const nameByItem = Object.fromEntries((figItems || []).map(f => [f.item_id, subjName[f.subject_id] || f.description || 'Minifig']))
      const list = owned.map(o => ({
        ownedCopyId: o.id,
        catalogItemId: o.catalog_item_id,
        name: nameByItem[o.catalog_item_id] || 'Minifig',
        condition: o.condition || '',
      })).sort((a, b) => a.name.localeCompare(b.name))
      if (!cancelled) {
        setSellConnectedMinifigs(list)
        setSellMinifigInclusion(Object.fromEntries(list.map(m => [m.ownedCopyId, true])))
      }
    })()
    return () => { cancelled = true }
  }, [currentUser?.id, selectedCollectionCopyRow?.id, selectedCollectionCopyRow?.catalogItemId, selectedCollectionCopyRow?.categoryName])

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
  const nonLegoSetCards = collectibleSets
    .map((setRecord) => {
      // LEGO completion is driven by set_minifigs (below), not collectible_sets
      // (which now hold packaging like Box/Polybag). Skip Building Blocks here.
      if ((setRecord.category_name || '') === 'Building Blocks') return null
      const setEntries = collectibleSetEntriesBySetId[setRecord.id] || []
      const normalizedSetName = (setRecord.set_name || '').trim().toLowerCase()
      const normalizedCategoryName = (setRecord.category_name || '').trim().toLowerCase()
      // Match owned items to this set primarily by collectible_set_id (robust —
      // works for LEGO and anything without a metadata.set text). Fall back to a
      // set-name match only for owned items that carry no collectible_set_id.
      const ownedInSet = collectionItems.filter((item) => {
        const csid = item.catalogItem?.collectible_set_id
        if (csid) return csid === setRecord.id
        return (
          !!normalizedSetName &&
          (item.setName || '').trim().toLowerCase() === normalizedSetName &&
          (!normalizedCategoryName || (item.categoryName || '').trim().toLowerCase() === normalizedCategoryName)
        )
      })
      const linkedEntries = setEntries.filter(e => e.catalog_item_id)
      const totalItems = linkedEntries.length > 0 ? linkedEntries.length : Number(setRecord.total_items || 0)
      const ownedEntries = linkedEntries.filter(
        (entry) => ownedCatalogItemIds.has(entry.catalog_item_id),
      )
      const ownedCount = ownedEntries.length > 0 ? ownedEntries.length : ownedInSet.length

      if (ownedCount <= 0) {
        return null
      }

      const ownedValue = ownedEntries.length > 0
        ? ownedEntries.reduce((total, entry) => {
            const ownedItem = ownedItemsByCatalogId[entry.catalog_item_id]
            return total + Number(ownedItem?.currentMarketValue || 0)
          }, 0)
        : ownedInSet.reduce((total, ownedItem) => total + Number(ownedItem?.currentMarketValue || 0), 0)
      const completionPercent = totalItems > 0 ? (ownedCount / totalItems) * 100 : 0
      const missingCount = totalItems > 0 ? Math.max(totalItems - ownedCount, 0) : 0
      const estimatedRemainingCost = Number.isFinite(Number(setRecord.total_estimated_value))
        ? Math.max(Number(setRecord.total_estimated_value) - ownedValue, 0)
        : null

      return {
        id: setRecord.id,
        title: setRecord.set_name || 'Set',
        categoryName: setRecord.category_name || '',
        subcategoryName: setRecord.subcategory_name || '',
        franchiseName: setRecord.franchise_name || '',
        brandName: setRecord.brand_name || '',
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
  // LEGO set cards: one per set item, completion = owned minifigs / total minifigs.
  // Shown for every set (including 0% owned) so all themes/sets are visible.
  const legoSetCards = completionLegoSets
    .map((s) => {
      const total = s.itemIds.length
      const ownedCount = s.itemIds.filter((id) => ownedCatalogItemIds.has(id)).length
      const ownedValue = s.itemIds.reduce((sum, id) => sum + Number(ownedItemsByCatalogId[id]?.currentMarketValue || 0), 0)
      return {
        id: s.id,
        title: s.title,
        categoryName: 'Building Blocks',
        subcategoryName: 'LEGO',
        franchiseName: s.franchiseName,
        brandName: s.brandName,
        setName: s.title,
        ownedCount,
        totalItems: total,
        completionPercent: total > 0 ? (ownedCount / total) * 100 : 0,
        missingCount: Math.max(total - ownedCount, 0),
        ownedValue,
        estimatedRemainingCost: null,
        breakdown: {},
        _isLego: true,
        _itemIds: s.itemIds,
        _subtheme: s.subthemeName || '',
        _productLine: s.productLineName || '',
      }
    })
    .sort((left, right) => {
      if (right.completionPercent !== left.completionPercent) return right.completionPercent - left.completionPercent
      return (left.title || '').localeCompare(right.title || '')
    })
  const startedSetCards = [...legoSetCards, ...nonLegoSetCards]
  const completionLabels = getCategoryLabels(completionNavCategory)
  const rollupCards = (cards) => {
    const owned = cards.reduce((s, c) => s + c.ownedCount, 0)
    const total = cards.reduce((s, c) => s + c.totalItems, 0)
    return { ownedCount: owned, totalItems: total, percent: total > 0 ? (owned / total) * 100 : 0, setsStarted: cards.length }
  }
  const groupByKey = (arr, fn) => arr.reduce((acc, item) => {
    const k = fn(item) || 'Other'
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})
  // Root Completion categories should reflect what the user actually owns, not only
  // categories that already produced a recognised completion/set card. Merge owned
  // collection categories with started-set data so categories never disappear simply
  // because their completion-set mapping is not available yet.
  const completionCategoryGroups = (() => {
    const groups = groupByKey(startedSetCards, c => c.categoryName)
    for (const item of collectionItems) {
      const categoryName = (item.categoryName || '').trim()
      if (categoryName && !groups[categoryName]) groups[categoryName] = []
    }
    return groups
  })()
  const completionSubcategoryGroups = groupByKey(
    startedSetCards.filter(c => c.categoryName === completionNavCategory),
    c => c.subcategoryName,
  )
  const completionFranchiseGroups = groupByKey(
    startedSetCards.filter(c => c.categoryName === completionNavCategory && c.subcategoryName === completionNavSubcategory),
    c => c.franchiseName,
  )
  const completionBrandGroups = groupByKey(
    startedSetCards.filter(c => c.categoryName === completionNavCategory && c.subcategoryName === completionNavSubcategory && c.franchiseName === completionNavFranchise),
    c => c.brandName,
  )
  const completionBrandSetCards = startedSetCards.filter(
    c => c.categoryName === completionNavCategory && c.subcategoryName === completionNavSubcategory && c.franchiseName === completionNavFranchise && c.brandName === completionNavBrand,
  )
  // LEGO faceted drill below the item type. Subtheme, then Product Line; the orange
  // leaf shows at whichever facet is deepest for this scope.
  const completionIsLego = completionNavCategory === 'Building Blocks'
  const completionSubthemes = completionIsLego
    ? [...new Set(completionBrandSetCards.map(c => c._subtheme).filter(Boolean))].sort((a, b) => a.localeCompare(b))
    : []
  const completionAfterSubtheme = completionSubthemes.length
    ? completionBrandSetCards.filter(c => c._subtheme === completionNavSubtheme)
    : completionBrandSetCards
  const completionProductLines = completionIsLego
    ? [...new Set(completionAfterSubtheme.map(c => c._productLine).filter(Boolean))].sort((a, b) => a.localeCompare(b))
    : []
  const completionAfterProductLine = completionProductLines.length
    ? completionAfterSubtheme.filter(c => c._productLine === completionNavProductLine)
    : completionAfterSubtheme
  // Which facet level should render right now (once the item type is chosen).
  const completionFacetStage = !completionNavBrand
    ? 'none'
    : (completionSubthemes.length && !completionNavSubtheme) ? 'subtheme'
    : (completionProductLines.length && !completionNavProductLine) ? 'productLine'
    : 'leaf'
  const completionLegoLeafCard = completionAfterProductLine.length === 1 ? completionAfterProductLine[0] : null
  const completionCategoryContextCards = completionNavCategory ? startedSetCards.filter(c => c.categoryName === completionNavCategory) : []
  const completionCategoryRollup = rollupCards(completionCategoryContextCards)
  const selectedCompletionSet = startedSetCards.find((setCard) => setCard.id === selectedCompletionSetId) || null
  const completionSetSubsets = (() => {
    const seen = new Map()
    for (const item of completionSetAllItems) {
      const id = item.raw?.subcollectble_set_id
      if (id && !seen.has(id)) seen.set(id, item.raw?.subcollectible_set || 'Unknown Subset')
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  })()
  const completionSetItemsForDisplay = completionNavSubset && completionNavSubset !== '__all__'
    ? completionSetAllItems.filter(i => i.raw?.subcollectble_set_id === completionNavSubset)
    : completionSetAllItems

  const selectedCompletionSetEntries = selectedCompletionSet
    ? (() => {
        // Best path: catalog items fetched for this set (gives full list + images)
        if (completionSetAllItems.length > 0) {
          return completionSetItemsForDisplay.map((catalogItem) => {
            const ownedItem = ownedItemsByCatalogId[catalogItem.item_id] || null
            return {
              id: catalogItem.item_id,
              itemName: catalogItem.name,
              imageUrl: catalogItem.imageUrl,
              raw: catalogItem.raw,
              isOwned: Boolean(ownedItem),
              quantity: Number(ownedItem?.totalQuantity || 0),
              marketValue: Number(ownedItem?.currentMarketValue || 0),
              estimatedPrice: 0,
              rarity: '',
              itemKey: catalogItem.item_id,
            }
          })
        }

        // Fallback: linked subcollectible_set entries
        const setEntries = collectibleSetEntriesBySetId[selectedCompletionSet.id] || []
        const linkedSetEntries = setEntries.filter(e => e.catalog_item_id)
        if (linkedSetEntries.length > 0) {
          return linkedSetEntries.map((entry) => {
            const ownedItem = ownedItemsByCatalogId[entry.catalog_item_id] || null
            return {
              id: entry.id,
              itemName: entry.item_name || ownedItem?.name || entry.item_key || 'Unknown item',
              imageUrl: ownedItem?.imageUrl || '',
              itemKey: entry.item_key || '',
              rarity: entry.rarity || '',
              isOwned: Boolean(ownedItem),
              quantity: Number(ownedItem?.totalQuantity || 0),
              marketValue: Number(ownedItem?.currentMarketValue || 0),
              estimatedPrice: Number(entry?.estimated_market_price || 0),
            }
          })
        }

        // Last resort: owned collection items matching set name
        const normalizedSetName = (selectedCompletionSet.setName || '').trim().toLowerCase()
        const normalizedCatName = (selectedCompletionSet.categoryName || '').trim().toLowerCase()
        return collectionItems
          .filter(
            (item) =>
              (item.setName || '').trim().toLowerCase() === normalizedSetName &&
              (!normalizedCatName || (item.categoryName || '').trim().toLowerCase() === normalizedCatName),
          )
          .map((item) => ({
            id: `owned-${selectedCompletionSet.id}-${item.id}`,
            itemName: item.name || 'Owned item',
            imageUrl: item.imageUrl || '',
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
    if (!selectedStillExists && selectedCompletionSetId) {
      setSelectedCompletionSetId('')
    }
  }, [selectedCompletionSetId, startedSetCards])

  useEffect(() => {
    if (!selectedCompletionSetId) {
      setCompletionSetAllItems([])
      setCompletionNavSubset('')
      return
    }
    setCompletionNavSubset('')
    let cancelled = false
    const na = (v) => (v && v !== 'N/A' ? v : '')
    const toDisplay = (r) => {
      const fp = r.front_image_path
      const imageUrl = fp
        ? fp.startsWith('http')
          ? fp
          : supabase.storage.from('item-images').getPublicUrl(fp).data?.publicUrl || ''
        : ''
      const subjectName = na(r.subject)
      const setName     = na(r.collectible_set)
      const printType   = na(r.print_type)
      const cardNum     = r.card_number && r.card_number !== 'N/A' ? `#${r.card_number}` : ''
      const nameParts   = [subjectName, setName, printType, cardNum].filter(Boolean)
      return {
        item_id:  r.item_id,
        name:     subjectName || nameParts.join(' — ') || r.description || 'Unknown',
        imageUrl,
        raw:      r,
      }
    }
    // LEGO set: the "items" are its minifigs (set_minifigs), not items sharing a
    // collectible_set_id (which is now packaging).
    const legoCard = completionLegoSets.find((s) => s.id === selectedCompletionSetId)
    if (legoCard) {
      const ids = legoCard.itemIds
      if (!ids.length) { setCompletionSetAllItems([]); return () => { cancelled = true } }
      ;(async () => {
        const all = []
        for (let i = 0; i < ids.length; i += 200) {
          const { data } = await supabase.from('item_details').select('*').in('item_id', ids.slice(i, i + 200))
          if (data) all.push(...data)
        }
        if (!cancelled) setCompletionSetAllItems(all.map(toDisplay).sort((a, b) => (a.name || '').localeCompare(b.name || '')))
      })()
      return () => { cancelled = true }
    }
    supabase
      .from('item_details')
      .select('*')
      .eq('collectible_set_id', selectedCompletionSetId)
      .order('card_number', { ascending: true, nullsFirst: false })
      .then(({ data }) => {
        if (cancelled) return
        setCompletionSetAllItems((data || []).map(toDisplay))
      })
    return () => { cancelled = true }
  }, [selectedCompletionSetId, completionLegoSets])

  // Dead-end skip: collapse single-value facet levels so the orange item cards
  // appear at whichever facet is actually the last one for this scope.
  useEffect(() => {
    if (!completionNavBrand || selectedCompletionSetId) return
    if (completionFacetStage === 'subtheme' && completionSubthemes.length === 1) {
      setCompletionNavSubtheme(completionSubthemes[0])
    } else if (completionFacetStage === 'productLine' && completionProductLines.length === 1) {
      setCompletionNavProductLine(completionProductLines[0])
    } else if (completionFacetStage === 'leaf' && completionLegoLeafCard) {
      setSelectedCompletionSetId(completionLegoLeafCard.id)
    }
  }, [completionNavBrand, selectedCompletionSetId, completionFacetStage, completionSubthemes, completionProductLines, completionLegoLeafCard])

  // Clear stale facet selections when the scope changes (self-correcting so we
  // don't have to reset them at every nav control).
  useEffect(() => {
    if (completionNavSubtheme && !completionSubthemes.includes(completionNavSubtheme)) setCompletionNavSubtheme('')
  }, [completionNavSubtheme, completionSubthemes])
  useEffect(() => {
    if (completionNavProductLine && !completionProductLines.includes(completionNavProductLine)) setCompletionNavProductLine('')
  }, [completionNavProductLine, completionProductLines])

  useEffect(() => {
    setCollectionOverviewPage(1)
  }, [activeCollectionFilter, activeStorageFilter, collectionSearchQuery, collectionFilterSubtheme, collectionFilterFaction, collectionFilterSpecies, collectionFilterCondition, collectionSortKey])

  useEffect(() => {
    if (collectionOverviewPage > collectionOverviewTotalPages) {
      setCollectionOverviewPage(collectionOverviewTotalPages)
    }
  }, [collectionOverviewPage, collectionOverviewTotalPages])

  // Keep the "go to page" input in sync when the page changes via buttons/filters.
  useEffect(() => { setCollectionOverviewPageInput(String(collectionOverviewPage)) }, [collectionOverviewPage])

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

  useEffect(() => {
    let cancelled = false
    const itemId = selectedCatalogItem?.item_id || selectedCatalogItem?.id
    if (!itemId) {
      setCatalogRawItemRow(null)
      return
    }
    ;(async () => {
      const { data, error } = await supabase
        .from('items')
        .select('item_id, category_id, subcategory_id, franchise_id, brand_id, collectible_set_id, subcollectble_set_id, subject_id, description, print_type_id, card_number, print_count, image_path, catalog_code, piece_count, release_year, attributes, upc, bricklink_id, rebrickable_fig_id, rarity_id, mtg_card_type_id, market_price, minifig_code, lego_set_number, retail_price, subset_id, series_id, name')
        .eq('item_id', itemId)
        .maybeSingle()
      if (!cancelled) setCatalogRawItemRow(error ? null : data)
    })()
    return () => { cancelled = true }
  }, [selectedCatalogItem?.item_id, selectedCatalogItem?.id])

  const pageScope = {
    AddEmployeeModal,
    AddLocationModal,
    Admin,
    BGS_SUBGRADE_FIELDS,
    BGS_SUBGRADE_OPTIONS,
    CARD_CONDITION_CATEGORIES,
    COLLECTION_ACQUISITION_TYPE_LABELS,
    CatalogAdminPanel,
    DEFAULT_BGS_SUBGRADES,
    EMPLOYEE_PERMISSION_OPTIONS,
    EMPLOYEE_ROLE_OPTIONS,
    EmployeeCard,
    GRADING_COMPANIES,
    LANGUAGE_OPTIONS,
    LEGO_PRESENCE_OPTIONS,
    LEGO_SET_BOX_GRADES,
    LocationCard,
    MTG_CARD_TREATMENT_NAMES,
    PROFILE_ACHIEVEMENTS,
    SPORTS_CARD_TYPE_NAMES,
    SubscriptionCard,
    activeCollectionFilter,
    activeGradeEntry,
    activeGradeScale,
    activeSettingsTab,
    activeStorageFilter,
    addSetMinifigLink,
    admin,
    advanceImageQueue,
    allVisibleCatalogItemsSelected,
    allocationByCategory,
    assignableCustomCollections,
    authMessage,
    bgsAllSubgradesAreTen,
    bgsAllSubgradesSet,
    bgsCertLookupUrl,
    boundedSelectedCollectionCopyIndex,
    bulkImportApprove,
    bulkImportCreatingPrintType,
    bulkImportIdx,
    bulkImportIsSaving,
    bulkImportMode,
    bulkImportNewPrintTypeName,
    bulkImportRows,
    bulkImportSaveError,
    bulkImportSaveProgress,
    bulkImportSheetSummary,
    bulkImportSkip,
    bulkImportSpeciesList,
    bulkImportSubjectResults,
    bulkImportSubjectSearch,
    bulkImportTeamSearch,
    bulkPhotoAnalyzeProgress,
    bulkPhotoAnalyzing,
    bulkPhotoApprove,
    bulkPhotoApproveAll,
    bulkPhotoIdx,
    bulkPhotoIsSaving,
    bulkPhotoManualResults,
    bulkPhotoManualSearch,
    bulkPhotoMode,
    bulkPhotoPhase,
    bulkPhotoPosition,
    bulkPhotoPrintTypeId,
    bulkPhotoRows,
    bulkPhotoSaveError,
    bulkPhotoSaveProgress,
    bulkPhotoSkip,
    canAccessEmployeesTab,
    canAccessHomeScreenTab,
    canAccessIntegrationsTab,
    canAccessLocationsTab,
    canAccessStoreTab,
    canListSelectedCollectionCopy,
    cartItems,
    cartSubtotalCents,
    cartTaxCents,
    cartTotalCents,
    catalogActiveContextRows,
    catalogAdminBackImageFile,
    catalogAdminBrandId,
    catalogAdminBrands,
    catalogAdminBricklinkId,
    catalogAdminCardNumber,
    catalogAdminCardTypeIds,
    catalogAdminCardTypes,
    catalogAdminCategories,
    catalogAdminCategoryId,
    catalogAdminFormError,
    catalogAdminFranchiseId,
    catalogAdminFranchises,
    catalogAdminFrontImageFile,
    catalogAdminInlineCreate,
    catalogAdminIsMtg,
    catalogAdminItemDescription,
    catalogAdminLegoSetNumber,
    catalogAdminMtgCardTypeId,
    catalogAdminPackagingId,
    catalogAdminPackagingList,
    catalogAdminPieceCount,
    catalogAdminPrintCount,
    catalogAdminPrintTypeId,
    catalogAdminPrintTypes,
    catalogAdminProductLineIds,
    catalogAdminProductLinesList,
    catalogAdminRarityId,
    catalogAdminRealFranchiseId,
    catalogAdminRealFranchises,
    catalogAdminRebrickableId,
    catalogAdminReleaseYear,
    catalogAdminRetailPrice,
    catalogAdminSeriesId,
    catalogAdminSeriesList,
    catalogAdminSpecies,
    catalogAdminSubcategories,
    catalogAdminSubcategoryId,
    catalogAdminSubjectIds,
    catalogAdminSubjectIsSearching,
    catalogAdminSubjectResults,
    catalogAdminSubjectSearch,
    catalogAdminSubsetId,
    catalogAdminSubsetSel,
    catalogAdminSubsets,
    catalogAdminSubsetsList,
    catalogAdminTeamIds,
    catalogAdminTeams,
    catalogAdminUpc,
    catalogAlbumResults,
    catalogAlbumSearch,
    catalogAlbumSearching,
    catalogAllCardTypes,
    catalogBrandById,
    catalogBrandId,
    catalogBrands,
    catalogBulkBrandOptions,
    catalogBulkEditError,
    catalogBulkEditMessage,
    catalogBulkEditValues,
    catalogBulkSelectedIds,
    catalogBulkSetOptions,
    catalogCardTypeIds,
    catalogCategories,
    catalogCategory,
    catalogCategoryById,
    catalogCategoryOptions,
    catalogContextThemeText,
    catalogDetailAverageRating,
    catalogDetailBgsSubgrades,
    catalogDetailCardTypes,
    catalogDetailCertNumber,
    catalogDetailGradingCompany,
    catalogDetailIncludedIn,
    catalogDetailIncludes,
    catalogDetailIsGraded,
    catalogDetailLego,
    catalogDetailLegoCond,
    catalogDetailMtgCardTypeId,
    catalogDetailParentSets,
    catalogDetailRarityId,
    catalogDetailReviews,
    catalogDetailSelectedGrade,
    catalogDetailSetMinifigs,
    catalogDetailStats,
    catalogDetailSubjects,
    catalogDetailTeams,
    catalogDetailViewTab,
    catalogFranchiseLinkedBrands,
    catalogFranchiseOptions,
    catalogFranchiseSearch,
    catalogItemEditCardTypeIds,
    catalogItemEditError,
    catalogItemEditLookups,
    catalogItemEditMtgCardTypeId,
    catalogItemEditRarityId,
    catalogItemEditSubjectIds,
    catalogItemEditSubjectIsSearching,
    catalogItemEditSubjectResults,
    catalogItemEditSubjectSearch,
    catalogItemEditTeamIds,
    catalogItemEditValues,
    catalogItemImages,
    catalogItemIsMtg,
    catalogItemNumbers,
    catalogItemOrigin,
    catalogListPricing,
    catalogListStats,
    catalogLoadError,
    catalogMarketVariants,
    catalogMaxYear,
    catalogMinYear,
    catalogMtgCardTypes,
    catalogPage,
    catalogPageInput,
    catalogPricingSource,
    catalogPrintTypeId,
    catalogPrintTypes,
    catalogProductLineId,
    catalogProductLineOptions,
    catalogRarities,
    catalogRarityId,
    catalogRawItemRow,
    catalogSeriesId,
    catalogSeriesOptions,
    catalogSetId,
    catalogSetNavIndex,
    catalogSetNavItems,
    catalogSets,
    catalogSidebarLabels,
    catalogSortKey,
    catalogSubcategories,
    catalogSubcategory,
    catalogSubcategoryById,
    catalogSubcategoryOptions,
    catalogSubjectId,
    catalogSubjectResults,
    catalogSubjectSearch,
    catalogSubjectSearching,
    catalogSubsetId,
    catalogSubsets,
    catalogSubthemeId,
    catalogSubthemeOptions,
    catalogTeamId,
    catalogTeams,
    catalogThemeImageUrl,
    catalogThemeShortDesc,
    catalogThemeStats,
    catalogTotalItemCount,
    catalogTotalPages,
    catalogViewMode,
    cgcCertLookupUrl,
    collectionCopySalePriceInput,
    collectionFilterCondition,
    collectionFilterFaction,
    collectionFilterOptions,
    collectionFilterSpecies,
    collectionFilterSubtheme,
    collectionItemDetailActionError,
    collectionItemDetailActionMessage,
    collectionLoadError,
    collectionOverviewPage,
    collectionOverviewPageInput,
    collectionOverviewTotalPages,
    collectionSearchQuery,
    collectionSortKey,
    collectionSummary,
    collectionViewTab,
    completionAfterProductLine,
    completionAfterSubtheme,
    completionBrandGroups,
    completionBrandSetCards,
    completionCategoryGroups,
    completionCategoryRollup,
    completionFacetStage,
    completionFranchiseGroups,
    completionIsLego,
    completionLabels,
    completionNavBrand,
    completionNavCategory,
    completionNavFranchise,
    completionNavSubcategory,
    completionNavSubset,
    completionNavSubtheme,
    completionProductLines,
    completionSetAllItems,
    completionSetSubsets,
    completionSubcategoryGroups,
    completionSubthemes,
    conditionOptions,
    createdEmployeeLoginInfo,
    currentUser,
    customCollectionPerformance,
    customCollections,
    deriveMinifigShorthand,
    editingEmployeeAllLocations,
    editingEmployeeId,
    editingEmployeeLocationIds,
    editingEmployeePermissions,
    effectiveBgsGradeEntry,
    email,
    employeesError,
    exitImageQueue,
    filteredCatalogItems,
    filteredCollectionItems,
    filteredWishlistItems,
    formatDate,
    formatPercentValue,
    formatPlanPrice,
    formatUsd,
    friendSearchLoading,
    friendSearchQuery,
    friendSearchResults,
    getCategoryLabels,
    getListingCertNumber,
    getPlanActionMeta,
    getPlanDisplayLabel,
    handleAcceptFriendRequest,
    handleAddRelatedItem,
    handleApplyCatalogBulkEdit,
    handleAssignStorageLocationToItem,
    handleBackToCollection,
    handleBulkCreatePrintType,
    handleBulkImportFile,
    handleBulkImportSave,
    handleBulkPhotoFolder,
    handleBulkPhotoSave,
    handleCancelEmployeePermissions,
    handleCatalogAdminInlineSave,
    handleCatalogAdminRemoveSubject,
    handleCatalogAdminSelectSubject,
    handleCatalogItemEditRemoveSubject,
    handleCatalogItemEditSelectSubject,
    handleChangeEmail,
    handleChangePassword,
    handleCheckoutCart,
    handleClearCatalogBulkSelection,
    handleCloseAddEmployeeModal,
    handleCloseAddLocationModal,
    handleCopyEmployeeLoginInfo,
    handleCreateCatalogItemInApp,
    handleCreateCustomCollection,
    handleCreateEmployee,
    handleCreateLocation,
    handleCreateStorageLocation,
    handleDeactivateEmployee,
    handleDeactivateLocation,
    handleDeclineFriendRequest,
    handleDeleteActiveCollection,
    handleDeleteActiveStorageLocation,
    handleDeleteCatalogItemImage,
    handleEditEmployeePermissions,
    handleFriendSearch,
    handleImportMagicCards,
    handleLanguageChange,
    handleListSelectedCollectionCopyForSale,
    handleMiAddByUrl,
    handleMiApproveCandidate,
    handleMiFindImages,
    handleMiRejectCandidate,
    handleMiRemove,
    handleMiReorder,
    handleMiSaveSource,
    handleMiSetPrimary,
    handleMiUpload,
    handleMoveActiveStorageLocation,
    handleOpenAddEmployeeModal,
    handleOpenAddLocationModal,
    handleOpenAddToCollectionModal,
    handleOpenCatalog,
    handleOpenCatalogItem,
    handleOpenCatalogItemEdit,
    handleOpenCollectionItemDetails,
    handleOpenPlans,
    handleOpenProfileItem,
    handleOpenTwoFactorSetup,
    handlePlanAction,
    handleRelSetQuantity,
    handleRemoveCollectionItem,
    handleRemoveEmployee,
    handleRemoveFriend,
    handleRemoveRelated,
    handleRenameActiveCollection,
    handleRenameActiveStorageLocation,
    handleSaveCatalogItem,
    handleSaveEmployeePermissions,
    handleSaveLocalSettings,
    handleSaveLocation,
    handleSaveProfileSettings,
    handleSaveStoreSettings,
    handleSelectAllCatalogPageItems,
    handleSendFriendRequest,
    handleSetEditingEmployeeAllLocations,
    handleSetNewEmployeeAllLocations,
    handleToggleCatalogBulkSelect,
    handleToggleCollectionMembership,
    handleToggleEditingEmployeeLocation,
    handleToggleEmployeePermission,
    handleToggleNewEmployeeLocation,
    handleUpdateCollectionCopyCondition,
    handleUploadCatalogItemImage,
    handleUploadCollectionCopyImage,
    handleWishlistRemove,
    hasCatalogActiveContext,
    hasCollectorPlusAccess,
    hasStoreProAccess,
    homeColumns,
    homeHeading,
    homeSectionOneOptions,
    homeSectionThreeOptions,
    homeSectionTwoOptions,
    imageQueueActive,
    imageQueueCount,
    imageQueueItems,
    imageQueueLoading,
    imageQueuePos,
    insights,
    isAddEmployeeModalOpen,
    isAddLocationModalOpen,
    isApplyingCatalogBulkEdit,
    isBgsActive,
    isBgsBlackLabel,
    isBusinessTier,
    isCardConditionCategory,
    isCatalogAdminPanelOpen,
    isCatalogBulkEditMode,
    isCatalogItemEditMode,
    isCatalogItemModalOpen,
    isCatalogLoading,
    isCgcActive,
    isCollectionLoading,
    isCollectorPlusMember,
    isCreatingCatalogItem,
    isCreatingCustomCollection,
    isCreatingEmployee,
    isCreatingLocation,
    isCreatingStorageLocation,
    isEmployeesLoading,
    isFriendSearchOpen,
    isImportingMagic,
    isLegoConditionCategory,
    isLegoMinifig,
    isLegoSet,
    isListingCertVerified,
    isListingCollectionCopyForSale,
    isLocationsLoading,
    isPlansLoading,
    isPlatformAdmin,
    isPsaActive,
    isSavingCatalogAdminInline,
    isSavingCatalogItem,
    isSavingCollectionOrganization,
    isSavingCopyCondition,
    isSavingLink,
    isSavingSettings,
    isSubmitting,
    isTAGActive,
    isTwoFactorEnabled,
    isTwoFactorLoading,
    isUpdatingPlan,
    isUploadingCatalogItemImage,
    isUploadingCollectionCopyImage,
    isWishlistLoading,
    largestGainItem,
    largestLossItem,
    legoPropertyRegistry,
    linkQty,
    linkResults,
    linkSearch,
    listingRequirementItems,
    listings,
    localAvailability,
    locationOptions,
    locationsById,
    locationsError,
    magicImportError,
    magicImportFile,
    magicImportProgress,
    magicImportSummary,
    manageImagesBusy,
    manageImagesCandidates,
    manageImagesEditSourceId,
    manageImagesError,
    manageImagesJobs,
    manageImagesNotice,
    manageImagesSourceDraft,
    manageImagesUrlDraft,
    managerOptions,
    marketPrice,
    marketTrendLabel,
    marketTrendPercent,
    marketplaceCompletionMatches,
    metric30Day,
    metricAllTimeHigh,
    metricLowListing,
    miResolveUrl,
    monthlyAnalytics,
    mostValuableItem,
    newCustomCollectionName,
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
    newStorageLocationName,
    newStorageParentLocationId,
    normalizeLanguage,
    notificationsDealAlerts,
    notificationsEmail,
    notificationsEventReminders,
    notificationsPush,
    notificationsStorePromotions,
    notificationsWishlistAlerts,
    openAuth,
    openCatalogItemById,
    openLightbox,
    overallCollectionValue,
    overallProfitLoss,
    overallRoi,
    overallTotalInvested,
    ownedCatalogItemCounts,
    ownedCatalogItemIds,
    ownedItemsByCatalogId,
    ownershipCount,
    paginatedCatalogItemIds,
    paginatedCatalogItems,
    paginatedCollectionItems,
    paginatedWishlistItems,
    performQuickAdd,
    plansError,
    privacyAllowFollowers,
    privacyPublicProfile,
    privacyShowCollectionValue,
    privacyShowOnlineStatus,
    privacyShowWishlist,
    profile,
    profileFriendRequests,
    profileFriends,
    profileIsLoading,
    profileMostValuable,
    profileRecentItems,
    profileSentToIds,
    profileStats,
    psaCertLookupUrl,
    psaPrestigeScore,
    quickAddMode,
    quickAddPrice,
    relAddMode,
    relAddQty,
    relBusy,
    relError,
    relSearch,
    relSearchResults,
    removeConfirmItemId,
    removePlanFromCart,
    removeSetMinifigLink,
    renewalStatus,
    rollupCards,
    searchLegoItemsToLink,
    selectedCatalogAdminCategoryName,
    selectedCatalogBulkFranchiseIds,
    selectedCatalogFranchiseRecord,
    selectedCatalogItem,
    selectedCatalogItemCategoryLabels,
    selectedCatalogItemMetadata,
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
    selectedCompletionSet,
    selectedCompletionSetEntries,
    selectedCompletionSetId,
    selectedCondition,
    selectedCopyConditionOptions,
    sellConnectedMinifigs,
    sellMinifigInclusion,
    setActiveCollectionFilter,
    setActiveSettingsTab,
    setActiveStorageFilter,
    setBulkImportCreatingPrintType,
    setBulkImportIdx,
    setBulkImportMode,
    setBulkImportNewPrintTypeName,
    setBulkImportRows,
    setBulkImportSheetSummary,
    setBulkImportSubjectResults,
    setBulkImportSubjectSearch,
    setBulkImportTeamSearch,
    setBulkPhotoIdx,
    setBulkPhotoManualResults,
    setBulkPhotoManualSearch,
    setBulkPhotoMode,
    setBulkPhotoPhase,
    setBulkPhotoPosition,
    setBulkPhotoPrintTypeId,
    setBulkPhotoRows,
    setCatalogAdminBackImageFile,
    setCatalogAdminBrandId,
    setCatalogAdminBricklinkId,
    setCatalogAdminCardNumber,
    setCatalogAdminCardTypeIds,
    setCatalogAdminCategoryId,
    setCatalogAdminFormError,
    setCatalogAdminFranchiseId,
    setCatalogAdminFrontImageFile,
    setCatalogAdminInlineCreate,
    setCatalogAdminItemDescription,
    setCatalogAdminLegoSetNumber,
    setCatalogAdminMtgCardTypeId,
    setCatalogAdminPackagingId,
    setCatalogAdminPieceCount,
    setCatalogAdminPrintCount,
    setCatalogAdminPrintTypeId,
    setCatalogAdminProductLineIds,
    setCatalogAdminRarityId,
    setCatalogAdminRealFranchiseId,
    setCatalogAdminRebrickableId,
    setCatalogAdminReleaseYear,
    setCatalogAdminRetailPrice,
    setCatalogAdminSeriesId,
    setCatalogAdminSubcategoryId,
    setCatalogAdminSubjectIds,
    setCatalogAdminSubjectResults,
    setCatalogAdminSubjectSearch,
    setCatalogAdminSubsetId,
    setCatalogAdminSubsetSel,
    setCatalogAdminTeamIds,
    setCatalogAdminUpc,
    setCatalogAlbumResults,
    setCatalogAlbumSearch,
    setCatalogBrandId,
    setCatalogBulkEditValues,
    setCatalogBulkSelectedIds,
    setCatalogCardTypeIds,
    setCatalogCategory,
    setCatalogDetailBgsSubgrades,
    setCatalogDetailCertNumber,
    setCatalogDetailGradingCompany,
    setCatalogDetailIsGraded,
    setCatalogDetailLegoCond,
    setCatalogDetailSelectedCondition,
    setCatalogDetailSelectedGrade,
    setCatalogDetailTagDigReport,
    setCatalogDetailTagLookupError,
    setCatalogDetailTagPopulation,
    setCatalogDetailTagScore,
    setCatalogDetailTagScoreRank,
    setCatalogDetailTagVerifiedSlab,
    setCatalogDetailViewTab,
    setCatalogFranchise,
    setCatalogFranchiseSearch,
    setCatalogItemEditCardTypeIds,
    setCatalogItemEditMtgCardTypeId,
    setCatalogItemEditRarityId,
    setCatalogItemEditSubjectSearch,
    setCatalogItemEditTeamIds,
    setCatalogItemEditValues,
    setCatalogListStats,
    setCatalogMaxYear,
    setCatalogMinYear,
    setCatalogPage,
    setCatalogPageInput,
    setCatalogPricingSource,
    setCatalogPrintTypeId,
    setCatalogProductLineId,
    setCatalogRarityId,
    setCatalogReloadToken,
    setCatalogSeriesId,
    setCatalogSetId,
    setCatalogSortKey,
    setCatalogSubcategory,
    setCatalogSubjectId,
    setCatalogSubjectResults,
    setCatalogSubjectSearch,
    setCatalogSubsetId,
    setCatalogSubthemeId,
    setCatalogTeamId,
    setCatalogViewMode,
    setCollectionCopySalePriceInput,
    setCollectionFilterCondition,
    setCollectionFilterFaction,
    setCollectionFilterSpecies,
    setCollectionFilterSubtheme,
    setCollectionOverviewPage,
    setCollectionOverviewPageInput,
    setCollectionSearchQuery,
    setCollectionSortKey,
    setCollectionViewTab,
    setCompletionNavBrand,
    setCompletionNavCategory,
    setCompletionNavFranchise,
    setCompletionNavProductLine,
    setCompletionNavSubcategory,
    setCompletionNavSubset,
    setCompletionNavSubtheme,
    setCompletionSheetPopup,
    setCurrentScreen,
    setFriendSearchQuery,
    setFriendSearchResults,
    setIsCatalogAdminPanelOpen,
    setIsCatalogBulkEditMode,
    setIsCatalogDetailTagLookupLoading,
    setIsCatalogItemEditMode,
    setIsCatalogItemModalOpen,
    setIsFriendSearchOpen,
    setLinkQty,
    setLinkResults,
    setLinkSearch,
    setMagicImportError,
    setMagicImportFile,
    setMagicImportProgress,
    setMagicImportSummary,
    setManageImagesEditSourceId,
    setManageImagesSourceDraft,
    setManageImagesUrlDraft,
    setNewCustomCollectionName,
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
    setNewStorageLocationName,
    setNewStorageParentLocationId,
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
    setQuickAddMode,
    setQuickAddPrice,
    setRelAddMode,
    setRelAddQty,
    setRelSearch,
    setRelSearchResults,
    setRemoveConfirmItemId,
    setSearchAreaContext,
    setSelectedCatalogItem,
    setSelectedCollectionCopyIndex,
    setSelectedCompletionSetId,
    setSellMinifigInclusion,
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
    setWishlistCategoryFilter,
    setWishlistItemIds,
    setWishlistPage,
    setWishlistRemoveConfirmId,
    setWishlistSearchQuery,
    setWishlistViewTab,
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
    startImageQueue,
    storageLocationPathById,
    storageLocations,
    storeEmployees,
    storeLocations,
    subscriptionPlans,
    supabase,
    t,
    tagDisplayedShortLabel,
    tagPopReportSearchUrl,
    themeStatName,
    themeStatPct,
    tx,
    updateBulkPhotoRow,
    updateBulkRow,
    wishlistCategories,
    wishlistCategoryFilter,
    wishlistItemIds,
    wishlistItems,
    wishlistLoadError,
    wishlistPage,
    wishlistRemoveConfirmId,
    wishlistSearchQuery,
    wishlistSummary,
    wishlistTotalPages,
    wishlistViewTab
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
        <a href="#" className={currentScreen === 'wishlist' ? 'active' : ''} onClick={handleOpenWishlist}>
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
        {currentScreen === 'home' ? <HomePage scope={pageScope} />
          : currentScreen === 'collection' ? <CollectionPage scope={pageScope} />
          : currentScreen === 'collection_item' ? <CollectionItemPage scope={pageScope} />
          : currentScreen === 'wishlist' ? <WishlistPage scope={pageScope} />
          : currentScreen === 'catalog' ? <CatalogPage scope={pageScope} />
          : currentScreen === 'plans' ? <PlansPage scope={pageScope} />
          : currentScreen === 'catalog_item' ? <CatalogItemPage scope={pageScope} />
          : currentScreen === 'profile' ? <ProfilePage scope={pageScope} />
          : currentScreen === 'settings' ? <SettingsPage scope={pageScope} />
          : <CartPage scope={pageScope} />}
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

      {lightbox && (
        <div className="image-lightbox-overlay" onClick={() => setLightbox(null)} role="dialog" aria-modal="true" aria-label="Enlarged image">
          <button type="button" className="image-lightbox-close" onClick={() => setLightbox(null)} aria-label="Close">✕</button>
          {lightbox.images.length > 1 && (
            <button
              type="button"
              className="image-lightbox-nav image-lightbox-prev"
              aria-label="Previous image"
              onClick={(e) => { e.stopPropagation(); setLightbox(lb => ({ ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length })) }}
            >‹</button>
          )}
          <img src={lightbox.images[lightbox.index]} alt="Enlarged" className="image-lightbox-img" onClick={(e) => e.stopPropagation()} />
          {lightbox.images.length > 1 && (
            <>
              <button
                type="button"
                className="image-lightbox-nav image-lightbox-next"
                aria-label="Next image"
                onClick={(e) => { e.stopPropagation(); setLightbox(lb => ({ ...lb, index: (lb.index + 1) % lb.images.length })) }}
              >›</button>
              <div className="image-lightbox-counter" onClick={(e) => e.stopPropagation()}>{lightbox.index + 1} / {lightbox.images.length}</div>
            </>
          )}
        </div>
      )}

      {completionSheetPopup && (
        <div className="auth-overlay" onClick={() => setCompletionSheetPopup(null)}>
          <section className="cs-popup" onClick={(e) => e.stopPropagation()}>
            <div className="cs-popup-item">
              {completionSheetPopup.entry.imageUrl ? (
                <img src={completionSheetPopup.entry.imageUrl} alt={completionSheetPopup.entry.itemName} className="cs-popup-img" />
              ) : (
                <div className="cs-popup-img-placeholder">
                  <svg viewBox="0 0 40 72" fill="currentColor">
                    <circle cx="20" cy="9" r="8" />
                    <rect x="10" y="19" width="20" height="24" rx="4" />
                    <rect x="6" y="19" width="8" height="18" rx="3" />
                    <rect x="26" y="19" width="8" height="18" rx="3" />
                    <rect x="11" y="43" width="8" height="20" rx="3" />
                    <rect x="21" y="43" width="8" height="20" rx="3" />
                  </svg>
                </div>
              )}
              <div className="cs-popup-item-info">
                <strong>{completionSheetPopup.entry.itemName}</strong>
                <span>{completionSheetPopup.entry.isOwned ? `In your collection ×${completionSheetPopup.entry.quantity}` : 'Not in your collection'}</span>
              </div>
            </div>
            <div className="cs-popup-actions">
              <button
                type="button"
                className="cs-popup-btn cs-popup-btn-collect"
                onClick={() => {
                  setSelectedCatalogItem(completionSheetPopup.catalogItemObj)
                  handleOpenAddToCollectionModal(completionSheetPopup.catalogItemObj.id)
                  setCompletionSheetPopup(null)
                }}
              >
                Add to Collection
              </button>
              <button
                type="button"
                className="cs-popup-btn cs-popup-btn-wishlist"
                onClick={() => {
                  handleOpenCatalogItem(completionSheetPopup.catalogItemObj)
                  setCompletionSheetPopup(null)
                }}
              >
                Add to Wishlist
              </button>
              <button
                type="button"
                className="cs-popup-btn cs-popup-btn-catalog"
                onClick={() => {
                  handleOpenCatalogItem(completionSheetPopup.catalogItemObj)
                  setCompletionSheetPopup(null)
                }}
              >
                Go to Catalog Page
              </button>
            </div>
            <button type="button" className="cs-popup-close" onClick={() => setCompletionSheetPopup(null)} aria-label="Close">×</button>
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

              {catalogDetailSetMinifigs.length > 0 ? (
                <div className="collection-minifig-checklist">
                  <label>{isLegoSet ? 'Minifigures included' : 'Included items'}</label>
                  {(selectedCondition || '').includes('Sealed') ? (
                    <p className="auth-banner">
                      Sealed — all {catalogDetailSetMinifigs.length} included item{catalogDetailSetMinifigs.length === 1 ? '' : 's'} auto-added as New / Sealed (MISB).
                    </p>
                  ) : (
                    <div className="collection-minifig-rows">
                      {catalogDetailSetMinifigs.map(m => (
                        <label key={m.item_id} className="collection-minifig-check">
                          <input
                            type="checkbox"
                            checked={collectionMinifigInclusion[m.item_id] ?? true}
                            onChange={e => setCollectionMinifigInclusion(prev => ({ ...prev, [m.item_id]: e.target.checked }))}
                          />
                          <span>{m.name}{m.quantity > 1 ? ` ×${m.quantity}` : ''}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
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
