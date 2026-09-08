import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'tools-tracking-project'

const initialTools = [
  { id: 1, name: 'Impact Driver', category: 'Power Tools', quantity: 2, status: 'Available', location: 'Bay A1' },
  { id: 2, name: 'Angle Grinder', category: 'Cutting', quantity: 1, status: 'Checked Out', location: 'Mobile Cart 3' },
  { id: 3, name: 'Torque Wrench', category: 'Measuring', quantity: 3, status: 'Available', location: 'Tool Room' },
  { id: 4, name: 'Laser Level', category: 'Measuring', quantity: 1, status: 'Maintenance', location: 'Repair Bench' },
  { id: 5, name: 'Drill Set', category: 'Power Tools', quantity: 4, status: 'Available', location: 'Bay B2' },
]

const statusOptions = ['All', 'Available', 'Checked Out', 'Maintenance']

const emptyForm = {
  name: '',
  category: 'Power Tools',
  quantity: 1,
  status: 'Available',
  location: '',
}

function App() {
  const [tools, setTools] = useState(() => {
    try {
      const savedTools = localStorage.getItem(STORAGE_KEY)
      return savedTools ? JSON.parse(savedTools) : initialTools
    } catch {
      return initialTools
    }
  })
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tools))
    } catch {
      // Ignore storage failures in restricted browsers.
    }
  }, [tools])

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'All' || tool.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter, tools])

  const stats = useMemo(() => {
    return {
      total: tools.length,
      available: tools.filter((tool) => tool.status === 'Available').length,
      checkedOut: tools.filter((tool) => tool.status === 'Checked Out').length,
      maintenance: tools.filter((tool) => tool.status === 'Maintenance').length,
    }
  }, [tools])

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      return
    }

    setTools((currentTools) => [
      {
        id: Date.now(),
        name: form.name.trim(),
        category: form.category,
        quantity: Number(form.quantity) || 1,
        status: form.status,
        location: form.location.trim() || 'Unassigned',
      },
      ...currentTools,
    ])

    setForm(emptyForm)
  }

  const updateStatus = (id, nextStatus) => {
    setTools((currentTools) =>
      currentTools.map((tool) =>
        tool.id === id ? { ...tool, status: nextStatus } : tool,
      ),
    )
  }

  const deleteTool = (id) => {
    setTools((currentTools) => currentTools.filter((tool) => tool.id !== id))
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Operations dashboard</p>
          <h1>Tools Tracking</h1>
        </div>
        <button type="button" className="primary-button">
          Sync Inventory
        </button>
      </header>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Total Tools</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="stat-card success">
          <span>Available</span>
          <strong>{stats.available}</strong>
        </article>
        <article className="stat-card warning">
          <span>Checked Out</span>
          <strong>{stats.checkedOut}</strong>
        </article>
        <article className="stat-card alert">
          <span>Maintenance</span>
          <strong>{stats.maintenance}</strong>
        </article>
      </section>

      <main className="content-grid">
        <aside className="panel form-panel">
          <h2>Add Tool</h2>
          <form onSubmit={handleSubmit} className="tool-form">
            <label>
              Tool name
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Example: Circular Saw"
              />
            </label>

            <div className="two-column">
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                >
                  <option>Power Tools</option>
                  <option>Cutting</option>
                  <option>Measuring</option>
                  <option>Fastening</option>
                  <option>Safety</option>
                </select>
              </label>

              <label>
                Quantity
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                />
              </label>
            </div>

            <div className="two-column">
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                >
                  <option>Available</option>
                  <option>Checked Out</option>
                  <option>Maintenance</option>
                </select>
              </label>

              <label>
                Location
                <input
                  type="text"
                  value={form.location}
                  onChange={(event) => setForm({ ...form, location: event.target.value })}
                  placeholder="Bay or cart"
                />
              </label>
            </div>

            <button type="submit" className="primary-button wide-button">
              Add Tool
            </button>
          </form>
        </aside>

        <section className="panel list-panel">
          <div className="list-header">
            <h2>Inventory</h2>
            <div className="filters">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tools"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="tool-list">
            {filteredTools.length === 0 ? (
              <div className="empty-state">
                <p>No tools match your search.</p>
              </div>
            ) : (
              filteredTools.map((tool) => (
                <article key={tool.id} className="tool-item">
                  <div className="tool-main">
                    <div>
                      <p className="tool-category">{tool.category}</p>
                      <h3>{tool.name}</h3>
                    </div>
                    <span className={`status-badge ${tool.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {tool.status}
                    </span>
                  </div>

                  <div className="tool-meta">
                    <span>Qty: {tool.quantity}</span>
                    <span>Location: {tool.location}</span>
                  </div>

                  <div className="tool-actions">
                    <select
                      value={tool.status}
                      onChange={(event) => updateStatus(tool.id, event.target.value)}
                    >
                      <option>Available</option>
                      <option>Checked Out</option>
                      <option>Maintenance</option>
                    </select>
                    <button type="button" className="delete-button" onClick={() => deleteTool(tool.id)}>
                      Remove
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
