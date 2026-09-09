import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'tools-tracking-project'

const initialTools = [
  { id: 1, name: 'Impact Driver', quantity: 2, serialNumber: 'IMD-2048', status: 'Available', borrower: '', calibrationDate: '2026-09-30', assignedAt: '', returnedAt: '' },
  { id: 2, name: 'Angle Grinder', quantity: 1, serialNumber: 'ANG-1187', status: 'For Calibration', borrower: '', calibrationDate: '2026-09-01', assignedAt: '', returnedAt: '' },
  { id: 3, name: 'Torque Wrench', quantity: 3, serialNumber: 'TWR-4430', status: 'Available', borrower: '', calibrationDate: '2026-10-15', assignedAt: '', returnedAt: '' },
  { id: 4, name: 'Laser Level', quantity: 1, serialNumber: 'LLV-8125', status: 'Borrowed', borrower: 'A. Gomez', calibrationDate: '2026-09-15', assignedAt: '2026-09-09T10:30:00', returnedAt: '' },
  { id: 5, name: 'Drill Set', quantity: 4, serialNumber: 'DRL-5521', status: 'Available', borrower: '', calibrationDate: '2026-11-05', assignedAt: '', returnedAt: '' },
]

const statusOptions = ['All', 'Available', 'For Calibration', 'Borrowed']

const formatDateTime = (value) => {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

const emptyForm = {
  name: '',
  serialNumber: '',
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
  const [isAddToolOpen, setIsAddToolOpen] = useState(true)
  const [assignModal, setAssignModal] = useState({ isOpen: false, toolId: null, borrower: '' })
  const [calibrationModal, setCalibrationModal] = useState({ isOpen: false, toolId: null, calibrationDate: '' })
  const [editModal, setEditModal] = useState({
    isOpen: false,
    toolId: null,
    name: '',
    serialNumber: '',
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
        serialNumber: form.serialNumber.trim(),
        status: nextStatus,
        calibrationDate: form.calibrationDate || '',
        borrower: nextStatus === 'Borrowed' ? form.borrower || '' : '',
        assignedAt: nextStatus === 'Borrowed' ? new Date().toISOString() : '',
        returnedAt: nextStatus === 'Borrowed' ? '' : '',
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
              assignedAt: nextStatus === 'Borrowed' ? tool.assignedAt || new Date().toISOString() : tool.assignedAt,
              returnedAt: nextStatus === 'Borrowed' ? '' : new Date().toISOString(),
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

    const now = new Date().toISOString()

    setTools((currentTools) =>
      currentTools.map((tool) =>
        tool.id === assignModal.toolId
          ? {
              ...tool,
              status: 'Borrowed',
              borrower: assignModal.borrower.trim(),
              assignedAt: now,
              returnedAt: '',
            }
          : tool,
      ),
    )

    closeAssignModal()
  }

  const returnTool = (id) => {
    const now = new Date().toISOString()

    setTools((currentTools) =>
      currentTools.map((tool) =>
        tool.id === id
          ? {
              ...tool,
              status: 'Available',
              borrower: '',
              returnedAt: now,
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

    const now = new Date().toISOString()

    setTools((currentTools) =>
      currentTools.map((tool) =>
        tool.id === calibrationModal.toolId
          ? {
              ...tool,
              status: 'Available',
              borrower: '',
              calibrationDate: calibrationModal.calibrationDate,
              returnedAt: now,
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
      serialNumber: tool.serialNumber || '',
      calibrationDate: tool.calibrationDate || '',
    })
  }

  const closeEditModal = () => {
    setEditModal({
      isOpen: false,
      toolId: null,
      name: '',
      serialNumber: '',
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

        const now = new Date().toISOString()

        return {
          ...tool,
          name: editModal.name.trim(),
          serialNumber: editModal.serialNumber.trim(),
          calibrationDate: editModal.calibrationDate || '',
          status: nextStatus,
          borrower: nextStatus === 'Borrowed' ? tool.borrower || '' : '',
          assignedAt: nextStatus === 'Borrowed' ? tool.assignedAt || now : tool.assignedAt,
          returnedAt: nextStatus === 'Borrowed' ? '' : now,
        }
      }),
    )

    closeEditModal()
  }

  const deleteTool = (id) => {
    setTools((currentTools) => currentTools.filter((tool) => tool.id !== id))
  }

  const exportToExcel = () => {
    const rows = filteredTools.length > 0 ? filteredTools : tools

    const header = ['Name', 'Quantity', 'Serial Number', 'Status', 'Borrower', 'Expiry Date']
    const csvRows = rows.map((tool) => [
      tool.name,
      tool.quantity ?? 1,
      tool.serialNumber || '',
      tool.status,
      tool.borrower || '',
      tool.calibrationDate || '',
    ])

    const csvContent = [header, ...csvRows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n')

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'tools-export.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="title-block">
          <p className="eyebrow">Operations dashboard</p>
          <h1>Tools Tracking</h1>
        </div>
        <div className="topbar-actions">
          <button type="button" className="secondary-button" onClick={exportToExcel}>
            Export Excel
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
          <div className="panel-header">
            <h2>Add Tool</h2>
            <button
              type="button"
              className={`panel-toggle ${isAddToolOpen ? 'is-open' : ''}`}
              aria-expanded={isAddToolOpen}
              aria-label={isAddToolOpen ? 'Collapse Add Tool form' : 'Expand Add Tool form'}
              onClick={() => setIsAddToolOpen((current) => !current)}
            >
              <span className="panel-toggle-icon">⌃</span>
            </button>
          </div>

          {isAddToolOpen && (
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

              <label>
                Serial number
                <input
                  type="text"
                  value={form.serialNumber}
                  onChange={(event) => setForm({ ...form, serialNumber: event.target.value })}
                  placeholder="e.g. IMD-2048"
                />
              </label>

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
          )}
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
                    <div className="tool-title-group">
                      {tool.status === 'For Calibration' && <span className="tool-warning-icon">⚠</span>}
                      <h3>{tool.name}</h3>
                    </div>
                    <span className={`status-badge ${tool.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {tool.status}
                    </span>
                  </div>

                  <div className="tool-meta">
                    <span>Serial: {tool.serialNumber || '—'}</span>
                    <span>Borrower: {tool.borrower || '—'}</span>
                    <span>Assigned: {formatDateTime(tool.assignedAt)}</span>
                    <span>Returned: {formatDateTime(tool.returnedAt)}</span>
                    <span>Expiry: {tool.calibrationDate || '—'}</span>
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
            <label>
              Serial number
              <input
                type="text"
                value={editModal.serialNumber}
                onChange={(event) => setEditModal((current) => ({ ...current, serialNumber: event.target.value }))}
              />
            </label>

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
