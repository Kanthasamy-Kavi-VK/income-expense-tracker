import { useState, useEffect } from 'react'
import { CROPS } from './cropsData'
import './App.css'

function CropImage({ src, fallback, alt, className = '' }) {
  const [currentSrc, setCurrentSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setCurrentSrc(src)
    setHasError(false)
  }, [src])

  const handleError = () => {
    if (!hasError && fallback) {
      setHasError(true)
      setCurrentSrc(fallback)
    }
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={handleError}
      loading="lazy"
    />
  )
}

function getTodayString() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function App() {
  const [selectedCrop, setSelectedCrop] = useState(null)
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('varavu_selavu_entries')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [date, setDate] = useState(getTodayString())
  const [type, setType] = useState('varavu')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('அனைத்தும்')

  useEffect(() => {
    try {
      localStorage.setItem('varavu_selavu_entries', JSON.stringify(entries))
    } catch {
      // Ignore write errors
    }
  }, [entries])

  const categories = ['அனைத்தும்', 'காய் வகை', 'கொடி வகை', 'கிழங்கு வகை', 'கீரை வகை', 'பயறு வகை']

  const filteredCrops = CROPS.filter((crop) => {
    const matchesSearch =
      crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crop.tamilName.includes(searchQuery)
    const matchesCategory =
      selectedCategory === 'அனைத்தும்' || crop.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  function getCropMetrics(cropName) {
    const cropEntries = entries.filter(
      (e) => e.crop === cropName || (typeof e.crop === 'object' && e.crop?.name === cropName)
    )
    const varavu = cropEntries
      .filter((e) => e.type === 'varavu')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0)
    const selavu = cropEntries
      .filter((e) => e.type === 'selavu')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0)
    return {
      count: cropEntries.length,
      varavu,
      selavu,
      balance: varavu - selavu,
    }
  }

  function addEntry(e) {
    if (e) e.preventDefault()
    if (!date || !amount || Number(amount) <= 0) return

    const newEntry = {
      id: Date.now(),
      date,
      crop: selectedCrop.name,
      type,
      amount: Number(amount),
      note: note.trim() || (type === 'varavu' ? 'வரவு' : 'செலவு'),
    }

    setEntries([newEntry, ...entries])
    setAmount('')
    setNote('')
  }

  function deleteEntry(id) {
    setEntries(entries.filter((entry) => entry.id !== id))
  }

  // SCREEN 1: Vegetable Grid View
  if (!selectedCrop) {
    return (
      <div className="app-container">
        <header className="app-header">
          <div className="header-badge">
            <span>🌱</span>
            <span>விவசாய வரவு செலவு கணக்கு</span>
          </div>
          <h1 className="header-title">Varavu Selavu Kanakku 🌾</h1>
          <p className="header-subtitle">
            உங்கள் காய்கறி பயிரை தேர்வு செய்து வரவு-செலவு பதிவுகளை எளிதாக நிர்வகியுங்கள்
          </p>

          <div className="filter-bar">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="காய்கறியின் பெயரைத் தேடவும்... (Tomato, வெங்காயம்...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="category-chips">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`chip-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="crops-grid">
          {filteredCrops.map((crop) => {
            const metrics = getCropMetrics(crop.name)
            return (
              <div
                key={crop.id}
                className="crop-card"
                onClick={() => setSelectedCrop(crop)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedCrop(crop)}
              >
                <div className="crop-image-wrapper">
                  <CropImage
                    src={crop.image}
                    fallback={crop.fallbackSvg}
                    alt={crop.name}
                    className="crop-card-img"
                  />
                  <div className="crop-category-badge">
                    <span>{crop.emoji}</span>
                    <span>{crop.category}</span>
                  </div>
                  {metrics.count > 0 && (
                    <div className="crop-entry-counter">
                      {metrics.count} {metrics.count === 1 ? 'பதிவு' : 'பதிவுகள்'}
                    </div>
                  )}
                </div>

                <div className="crop-card-body">
                  <div className="crop-title-row">
                    <span className="crop-tamil-name">{crop.tamilName}</span>
                    <span className="crop-en-name">{crop.name}</span>
                  </div>

                  <div className="crop-stats-footer">
                    {metrics.count > 0 ? (
                      <span
                        className={`crop-balance-badge ${metrics.balance >= 0 ? 'positive' : 'negative'
                          }`}
                      >
                        மீதி: ₹{metrics.balance.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>புதிய கணக்கு</span>
                    )}
                    <span className="crop-action-text">
                      கணக்கு பார்க்க →
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </main>
      </div>
    )
  }

  // SCREEN 2: Selected Crop Financial Ledger
  const cropMetrics = getCropMetrics(selectedCrop.name)
  const cropEntries = entries.filter(
    (e) =>
      e.crop === selectedCrop.name ||
      (typeof e.crop === 'object' && e.crop?.name === selectedCrop.name)
  )

  return (
    <div className="app-container">
      <div className="detail-view">
        <button className="back-btn" onClick={() => setSelectedCrop(null)}>
          <span>←</span>
          <span>பயிர்கள் பட்டியல் (Thirumba)</span>
        </button>

        {/* Selected Crop Banner */}
        <div className="crop-banner-card">
          <div className="crop-banner-img-box">
            <CropImage
              src={selectedCrop.image}
              fallback={selectedCrop.fallbackSvg}
              alt={selectedCrop.name}
              className="crop-banner-img"
            />
          </div>
          <div className="crop-banner-info">
            <div className="banner-meta">
              <span className="header-badge" style={{ margin: 0 }}>
                {selectedCrop.emoji} {selectedCrop.category}
              </span>
            </div>
            <h1 className="banner-crop-name">
              <span>{selectedCrop.tamilName}</span>
              <span className="banner-crop-en">({selectedCrop.name})</span>
            </h1>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="metrics-row">
          <div className="metric-card income">
            <span className="metric-label">
              <span>🟢</span> மொத்த வரவு (Varavu)
            </span>
            <span className="metric-value">
              ₹{cropMetrics.varavu.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="metric-card expense">
            <span className="metric-label">
              <span>🔴</span> மொத்த செலவு (Selavu)
            </span>
            <span className="metric-value">
              ₹{cropMetrics.selavu.toLocaleString('en-IN')}
            </span>
          </div>

          <div
            className={`metric-card balance ${cropMetrics.balance < 0 ? 'negative' : ''
              }`}
          >
            <span className="metric-label">
              <span>⚖️</span> நிகர மீதி / லாபம் (Meedhi)
            </span>
            <span className="metric-value">
              ₹{cropMetrics.balance.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Entry Form */}
        <div className="form-card">
          <h2 className="form-title">
            <span>✍️</span> புதிய கணக்கு பதிவு சேர்க்க
          </h2>

          <form onSubmit={addEntry}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">வகை (Type)</label>
                <div className="type-toggle-group">
                  <button
                    type="button"
                    className={`type-btn varavu ${type === 'varavu' ? 'active' : ''}`}
                    onClick={() => setType('varavu')}
                  >
                    <span>+</span> வரவு (Income)
                  </button>
                  <button
                    type="button"
                    className={`type-btn selavu ${type === 'selavu' ? 'active' : ''}`}
                    onClick={() => setType('selavu')}
                  >
                    <span>-</span> செலவு (Expense)
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">தேதி (Date)</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">தொகை (Amount in ₹)</label>
                <div className="input-with-icon">
                  <span className="input-prefix">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="உதா: 1500"
                    className="form-input has-prefix"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">விபரம் / குறிப்பு (Note)</label>
                <input
                  type="text"
                  placeholder="உதா: உரம், விதை, கூலி, மண்டி விற்பனை..."
                  className="form-input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="quick-amounts">
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                விரைவு தொகை:
              </span>
              {[100, 500, 1000, 2000, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  className="quick-amount-btn"
                  onClick={() => setAmount(String((Number(amount) || 0) + val))}
                >
                  +₹{val}
                </button>
              ))}
            </div>

            <button type="submit" className="submit-btn">
              <span>➕</span> பதிவு செய்க (Add Entry)
            </button>
          </form>
        </div>

        {/* Ledger Entries List */}
        <div className="ledger-card">
          <div className="ledger-header">
            <h2 className="ledger-title">
              <span>📋</span> பதிவு விபரம் (Transaction History)
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              மொத்தம்: {cropEntries.length} பதிவுகள்
            </span>
          </div>

          {cropEntries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🌱</div>
              <p style={{ fontWeight: 600, margin: '0 0 6px' }}>
                இன்னும் பதிவுகள் எதுவும் இல்லை
              </p>
              <p style={{ fontSize: '14px', margin: 0 }}>
                மேலே உள்ள படிவத்தைப் பயன்படுத்தி முதல் வரவு அல்லது செலவை சேர்க்கவும்.
              </p>
            </div>
          ) : (
            <ul className="entries-list">
              {cropEntries.map((e) => (
                <li key={e.id} className="entry-item">
                  <div className="entry-left">
                    <div className={`entry-icon-badge ${e.type}`}>
                      {e.type === 'varavu' ? '↓' : '↑'}
                    </div>
                    <div className="entry-details">
                      <span className="entry-note">
                        {e.note || (e.type === 'varavu' ? 'வரவு' : 'செலவு')}
                      </span>
                      <span className="entry-date">{e.date}</span>
                    </div>
                  </div>

                  <div className="entry-right">
                    <span className={`entry-amount ${e.type}`}>
                      {e.type === 'varavu' ? '+' : '-'} ₹
                      {Number(e.amount).toLocaleString('en-IN')}
                    </span>
                    <button
                      className="entry-delete-btn"
                      onClick={() => deleteEntry(e.id)}
                      title="நீக்கு (Delete)"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default App