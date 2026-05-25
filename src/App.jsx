import './App.css'

const panelColumns = [
  {
    title: 'Events Near You',
    action: 'View all',
    variant: 'wide',
    cards: 6,
    showMessage: false,
  },
  {
    title: 'Trending Items',
    action: null,
    variant: 'compact',
    cards: 8,
    showMessage: true,
  },
  {
    title: 'Sales Near You',
    action: 'View all',
    variant: 'wide',
    cards: 6,
    showMessage: false,
  },
]

function App() {
  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">CH</span>
          <span className="brand-name">CollectorsHub</span>
        </div>
        <button className="delivery-pill" type="button">
          Delivering to New Glasgow B2H
          <span className="chevron">&#9662;</span>
        </button>
        <label className="search-wrap" htmlFor="site-search">
          <span className="search-icon">&#9675;</span>
          <input
            id="site-search"
            type="search"
            placeholder="Search for Collectables..."
          />
        </label>
        <div className="top-actions">
          <button type="button" className="small-action">
            EN &#9662;
          </button>
          <button type="button" className="login-btn">
            Start Collecting
          </button>
          <button type="button" className="small-action">
            Cart
          </button>
        </div>
      </header>

      <nav className="main-nav">
        <a href="#">My Collection</a>
        <a href="#">Catalog</a>
        <a href="#">Stores</a>
        <a href="#">Wishlist</a>
        <a href="#">Sales</a>
        <a href="#">Events</a>
      </nav>

      <main className="home-content">
        <h1>CollectorsHub</h1>
        <p className="subtitle">Track, Value, and Trade Your Collectibles</p>

        <section className="panel-grid" aria-label="Homepage content sections">
          {panelColumns.map((column) => (
            <article key={column.title} className="panel-column">
              <header className="column-head">
                <h2>{column.title}</h2>
                {column.action && (
                  <a href="#" className="column-link">
                    {column.action}
                  </a>
                )}
              </header>
              <div className={`cards cards-${column.variant}`}>
                {Array.from({ length: column.cards }).map((_, index) => (
                  <div key={`${column.title}-${index}`} className="card-placeholder">
                    {column.showMessage && <span>No purchases yet</span>}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}

export default App
