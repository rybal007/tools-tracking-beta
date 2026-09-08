import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'tools-tracking-project'

const initialTools = [
  { id: 1, name: 'Impact Driver', category: 'Power Tools', quantity: 2, status: 'Available', borrower: '', calibrationDate: '2026-09-30' },
  { id: 2, name: 'Angle Grinder', category: 'Cutting', quantity: 1, status: 'For Calibration', borrower: '', calibrationDate: '2026-09-01' },
  { id: 3, name: 'Torque Wrench', category: 'Measuring', quantity: 3, status: 'Available', borrower: '', calibrationDate: '2026-10-15' },
  { id: 4, name: 'Laser Level', category: 'Measuring', quantity: 1, status: 'Borrowed', borrower: 'A. Gomez', calibrationDate: '2026-09-15' },
  { id: 5, name: 'Drill Set', category: 'Power Tools', quantity: 4, status: 'Available', borrower: '', calibrationDate: '2026-11-05' },
]

const statusOptions = ['All', 'Available', 'For Calibration', 'Borrowed']

const emptyForm = {
  name: '',
  category: 'Power Tools',
  quantity: 1,
  status: 'Available',
  calibrationDate: '',
}

const isCalibrationDue = (calibrationDate) => {
  if (!calibrationDate) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dueDate = new Date(`${calibrationDate}T00:00:00`)
  return dueDate <= today
}

const normalizeToolStatus = (tool) => {
  if (!tool || !tool.calibrationDate || tool.status === 'Borrowed') {
    return tool
  }

  if (isCalibrationDue(tool.calibrationDate)) {
    return {
      ...tool,
      status: 'For Calibration',
      borrower: '',
    }
  }

  return tool
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
  const [assignModal, setAssignModal] = useState({ isOpen: false, toolId: null, borrower: '' })
  const [calibrationModal, setCalibrationModal] = useState({ isOpen: false, toolId: null, calibrationDate: '' })
  const [editModal, setEditModal] = useState({
    isOpen: false,
    toolId: null,
    name: '',
    category: 'Power Tools',
    quantity: 1,
    calibrationDate: '',
  })

  useEffect(() => {
    setTools((currentTools) => currentTools.map((tool) => normalizeToolStatus(tool)))
  }, [])

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
      checkedOut: tools.filter((tool) => tool.status === 'For Calibration').length,
      maintenance: tools.filter((tool) => tool.status === 'Borrowed').length,
    }
  }, [tools])

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      return
    }

    const nextStatus = isCalibrationDue(form.calibrationDate) ? 'For Calibration' : form.status

    setTools((currentTools) => [
      {
        id: Date.now(),
        name: form.name.trim(),
        category: form.category,
        quantity: Number(form.quantity) || 1,
        status: nextStatus,
        calibrationDate: form.calibrationDate || '',
        borrower: nextStatus === 'Borrowed' ? form.borrower || '' : '',
      },
      ...currentTools,
    ])

    setForm(emptyForm)
  }

  const updateStatus = (id, nextStatus) => {
    setTools((currentTools) =>
      currentTools.map((tool) =>
        tool.id === id
          ? {
              ...tool,
              status: nextStatus,
              borrower: nextStatus === 'Borrowed' ? tool.borrower || '' : '',
            }
          : tool,
      ),
    )
  }

  const openAssignModal = (tool) => {
    setAssignModal({ isOpen: true, toolId: tool.id, borrower: tool.borrower || '' })
  }

  const closeAssignModal = () => {
    setAssignModal({ isOpen: false, toolId: null, borrower: '' })
  }

  const confirmAssignment = () => {
    if (!assignModal.toolId || !assignModal.borrower.trim()) {
      return
    }

    setTools((currentTools) =>
      currentTools.map((tool) =>
        tool.id === assignModal.toolId
          ? {
              ...tool,
              status: 'Borrowed',
              borrower: assignModal.borrower.trim(),
            }
          : tool,
      ),
    )

    closeAssignModal()
  }

  const returnTool = (id) => {
    setTools((currentTools) =>
      currentTools.map((tool) =>
        tool.id === id
          ? {
              ...tool,
              status: 'Available',
              borrower: '',
            }
          : tool,
      ),
    )
  }

  const openCalibrationModal = (tool) => {
    setCalibrationModal({ isOpen: true, toolId: tool.id, calibrationDate: tool.calibrationDate || '' })
  }

  const closeCalibrationModal = () => {
    setCalibrationModal({ isOpen: false, toolId: null, calibrationDate: '' })
  }

  const confirmCalibration = () => {
    if (!calibrationModal.toolId || !calibrationModal.calibrationDate) {
      return
    }

    setTools((currentTools) =>
      currentTools.map((tool) =>
        tool.id === calibrationModal.toolId
          ? {
              ...tool,
              status: 'Available',
              borrower: '',
              calibrationDate: calibrationModal.calibrationDate,
            }
          : tool,
      ),
    )

    closeCalibrationModal()
  }

  const openEditModal = (tool) => {
    setEditModal({
      isOpen: true,
      toolId: tool.id,
      name: tool.name,
      category: tool.category,
      quantity: tool.quantity,
      calibrationDate: tool.calibrationDate || '',
    })
  }

  const closeEditModal = () => {
    setEditModal({
      isOpen: false,
      toolId: null,
      name: '',
      category: 'Power Tools',
      quantity: 1,
      calibrationDate: '',
    })
  }

  const saveEditedTool = () => {
    if (!editModal.toolId || !editModal.name.trim()) {
      return
    }

    setTools((currentTools) =>
      currentTools.map((tool) => {
        if (tool.id !== editModal.toolId) {
          return tool
        }

        const nextStatus = isCalibrationDue(editModal.calibrationDate)
          ? 'For Calibration'
          : tool.status === 'Borrowed'
            ? 'Borrowed'
            : 'Available'

        return {
          ...tool,
          name: editModal.name.trim(),
          category: editModal.category,
          quantity: Number(editModal.quantity) || 1,
          calibrationDate: editModal.calibrationDate || '',
          status: nextStatus,
          borrower: nextStatus === 'Borrowed' ? tool.borrower || '' : '',
        }
      }),
    )

    closeEditModal()
  }

  const deleteTool = (id) => {
    setTools((currentTools) => currentTools.filter((tool) => tool.id !== id))
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="title-block">
          <span className="header-pill">Live inventory</span>
          <p className="eyebrow">Operations dashboard</p>
          <h1>Tools Tracking</h1>
        </div>
        <div className="topbar-actions">
          <span className="mini-indicator">Updated now</span>
          <button type="button" className="primary-button">
            Sync Inventory
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-header">
            <span className="stat-icon blue">T</span>
            <span>Total Tools</span>
          </div>
          <strong>{stats.total}</strong>
        </article>
        <article className="stat-card success">
          <div className="stat-header">
            <span className="stat-icon green">✓</span>
            <span>Available</span>
          </div>
          <strong>{stats.available}</strong>
        </article>
        <article className="stat-card warning">
          <div className="stat-header">
            <span className="stat-icon amber">!</span>
            <span>For Calibration</span>
          </div>
          <strong>{stats.checkedOut}</strong>
        </article>
        <article className="stat-card alert">
          <div className="stat-header">
            <span className="stat-icon red">↗</span>
            <span>Borrowed</span>
          </div>
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
                  <option>For Calibration</option>
                  <option>Borrowed</option>
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

            <label>
              Calibration expiry date
              <input
                type="date"
                value={form.calibrationDate}
                onChange={(event) => setForm({ ...form, calibrationDate: event.target.value })}
              />
            </label>

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
                <article
                  key={tool.id}
                  className={`tool-item ${tool.status === 'For Calibration' ? 'for-calibration' : ''}`}
                >
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
                    <span>Borrower: {tool.borrower || '—'}</span>
                    <span>Calibration: {tool.calibrationDate || '—'}</span>
                  </div>

                  <div className="tool-actions">
                    <div className="action-buttons">
                      <button type="button" className="edit-button" onClick={() => openEditModal(tool)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="assign-button"
                        onClick={() => {
                          if (tool.status === 'For Calibration') {
                            openCalibrationModal(tool)
                            return
                          }

                          if (tool.status === 'Borrowed') {
                            returnTool(tool.id)
                            return
                          }

                          openAssignModal(tool)
                        }}
                      >
                        {tool.status === 'For Calibration' ? 'Calibrate' : tool.status === 'Borrowed' ? 'Return' : 'Assign'}
                      </button>
                      <button type="button" className="delete-button" onClick={() => deleteTool(tool.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>

      {assignModal.isOpen && (
        <div className="modal-backdrop" onClick={closeAssignModal}>
          <div className="assign-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <h3>Assign Borrower</h3>
            <label>
              Borrower name
              <input
                type="text"
                value={assignModal.borrower}
                onChange={(event) => setAssignModal((current) => ({ ...current, borrower: event.target.value }))}
                placeholder="Enter borrower name"
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={closeAssignModal}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={confirmAssignment}>
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {calibrationModal.isOpen && (
        <div className="modal-backdrop" onClick={closeCalibrationModal}>
          <div className="assign-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <h3>Set New Calibration Date</h3>
            <label>
              Expiry date
              <input
                type="date"
                value={calibrationModal.calibrationDate}
                onChange={(event) => setCalibrationModal((current) => ({ ...current, calibrationDate: event.target.value }))}
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={closeCalibrationModal}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={confirmCalibration}>
                Save Date
              </button>
            </div>
          </div>
        </div>
      )}

      {editModal.isOpen && (
        <div className="modal-backdrop" onClick={closeEditModal}>
          <div className="assign-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <h3>Edit Tool</h3>
            <label>
              Tool name
              <input
                type="text"
                value={editModal.name}
                onChange={(event) => setEditModal((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <div className="two-column">
              <label>
                Category
                <select
                  value={editModal.category}
                  onChange={(event) => setEditModal((current) => ({ ...current, category: event.target.value }))}
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
                  value={editModal.quantity}
                  onChange={(event) => setEditModal((current) => ({ ...current, quantity: Number(event.target.value) || 1 }))}
                />
              </label>
            </div>

            <label>
              Calibration expiry date
              <input
                type="date"
                value={editModal.calibrationDate}
                onChange={(event) => setEditModal((current) => ({ ...current, calibrationDate: event.target.value }))}
              />
            </label>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={closeEditModal}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={saveEditedTool}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
