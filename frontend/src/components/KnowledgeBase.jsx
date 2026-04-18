import { useState, useEffect } from 'react'
import { Upload, Trash2, BookOpen } from 'lucide-react'
import { API } from '../services/api'
import './KnowledgeBase.css'

function KnowledgeBase() {
  const [kbs, setKbs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [uploadName, setUploadName] = useState('')
  const [uploadType, setUploadType] = useState('text')

  useEffect(() => {
    loadKnowledgeBases()
  }, [])

  const loadKnowledgeBases = async () => {
    try {
      setLoading(true)
      const kbs = await API.getKnowledgeBases()
      setKbs(kbs)
      setError(null)
    } catch (err) {
      setError('Failed to load knowledge bases')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadName.trim()) {
      setError('Please enter a name for the knowledge base')
      return
    }

    try {
      setLoading(true)
      await API.createKnowledgeBase(uploadName, uploadType, null)
      setUploadName('')
      setUploadType('text')
      await loadKnowledgeBases()
      setError(null)
    } catch (err) {
      setError('Failed to create knowledge base')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (kbId) => {
    if (!window.confirm('Are you sure you want to delete this knowledge base?')) return

    try {
      await API.deleteKnowledgeBase(kbId)
      await loadKnowledgeBases()
      setError(null)
    } catch (err) {
      setError('Failed to delete knowledge base')
      console.error(err)
    }
  }

  return (
    <div className="knowledge-base-container">
      <div className="knowledge-base-header">
        <h1 className="text-1xl font-bold text-zinc-900 flex items-center gap-2">
          <BookOpen size={16} />
          Knowledge Bases
        </h1>
      </div>

      <div className="knowledge-base-content">
        {/* Upload Form */}
        <div className="upload-section">
          <h2 className="text-lg font-semibold text-zinc-800 mb-4">Add New Knowledge Base</h2>
          <form onSubmit={handleUpload} className="upload-form">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="e.g., Product Documentation"
                className="input w-full"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="input w-full"
              >
                <option value="text">Text</option>
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
                <option value="txt">TXT</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <Upload size={18} />
              {loading ? 'Creating...' : 'Create Knowledge Base'}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* Knowledge Bases List */}
        <div className="kb-list-section">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Existing Knowledge Bases</h2>
          
          {loading && <p className="text-gray-600">Loading...</p>}
          
          {!loading && kbs.length === 0 && (
            <p className="text-gray-500 text-center py-8">No knowledge bases created yet</p>
          )}
          
          {!loading && kbs.length > 0 && (
            <div className="kb-grid">
              {kbs.map((kb) => (
                <div key={kb.id} className="kb-card">
                  <div className="kb-card-header">
                    <h3 className="text-lg font-semibold text-gray-900">{kb.name}</h3>
                    <span className="kb-type-badge">{kb.source_type}</span>
                  </div>
                  
                  {kb.description && (
                    <p className="kb-description">{kb.description}</p>
                  )}
                  
                  <div className="kb-meta">
                    <span className="kb-chunks">
                      {kb.chunks?.length || 0} chunks
                    </span>
                    <span className="kb-date">
                      {new Date(kb.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(kb.id)}
                    className="btn-delete"
                    title="Delete knowledge base"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default KnowledgeBase
