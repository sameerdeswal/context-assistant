import { useState, useEffect } from 'react'
import { Upload, Trash2, BookOpen } from 'lucide-react'
import API from '@/services/api'
import useApp from '@/stores/appStore'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from './ui/field'
import { Input } from './ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { Badge } from './ui/badge'

function KnowledgeBase() {
  const [kbs, setKbs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [uploadName, setUploadName] = useState('')
  const [uploadType, setUploadType] = useState('text')
  const [textContent, setTextContent] = useState('')
  const [uploadFile, setUploadFile] = useState(null)

  const appStore = useApp()

  useEffect(() => {
    loadKnowledgeBases()
    appStore.setHeading('Knowledge Bases')
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

    if (uploadType === 'text' && !textContent.trim()) {
      setError('Please provide text content for text knowledge base')
      return
    }

    if (uploadType !== 'text' && !uploadFile) {
      setError('Please upload a file for the selected type')
      return
    }

    try {
      setLoading(true)
      await API.createKnowledgeBase(uploadName, uploadType, uploadFile, textContent)
      setUploadName('')
      setUploadType('text')
      setTextContent('')
      setUploadFile(null)
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
    <div className="flex flex-1 flex-col w-full px-3">
      {/* Upload Form */}
      <Accordion
        type="single"
        collapsible
        defaultValue=""
        className="border-0"
      >
        <AccordionItem value="newKB" className='border-none'>
          <AccordionTrigger className='bg-muted px-3 py-2 rounded-lg'>Add New Knowledge Base</AccordionTrigger>
          <AccordionContent>
            <form onSubmit={handleUpload} className="flex flex-col gap-4 p-2">
              <FieldGroup>
                <FieldSet>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="checkout-7j9-card-name-43j"> Name </FieldLabel>
                      <Input
                        type="text"
                        value={uploadName}
                        onChange={(e) => setUploadName(e.target.value)}
                        placeholder="e.g., Product Documentation"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="checkout-7j9-card-name-43j"> Type </FieldLabel>
                      <Select onValueChange={(value) => setUploadType(value)} value={uploadType}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="csv">CSV</SelectItem>
                            <SelectItem value="txt">TXT</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>

                    {uploadType === 'text' ? (
                      <Field>
                        <FieldLabel htmlFor="checkout-7j9-card-name-43j"> Text Content </FieldLabel>
                        <Textarea
                          value={textContent}
                          onChange={(e) => setTextContent(e.target.value)}
                          placeholder="Paste or type knowledge base content here..."
                          className="input kb-textarea"
                          rows={6}
                        />
                      </Field>
                    ) : (
                      <Field>
                        <FieldLabel htmlFor="checkout-7j9-card-name-43j"> Upload File ({uploadType.toUpperCase()}) </FieldLabel>
                        <input
                          type="file"
                          accept={uploadType === 'pdf' ? '.pdf' : uploadType === 'csv' ? '.csv' : '.txt'}
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          className="input w-full"
                        />
                        {uploadFile && (
                          <p className="file-name">Selected: {uploadFile.name}</p>
                        )}
                      </Field>
                    )}

                  </FieldGroup>
                </FieldSet>
              </FieldGroup>


              <Button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                {loading ? 'Creating...' : 'Create Knowledge Base'}
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Knowledge Bases List */}
      <div className="flex flex-col w-full flex-1 gap-2 mt-3">
        <h2 className="font-semibold">Existing Knowledge Bases</h2>

        {loading && <p className="text-gray-600">Loading...</p>}

        {!loading && kbs.length === 0 && (
          <p className="text-gray-500 text-center py-8">No knowledge bases created yet</p>
        )}


        {!loading && kbs.length > 0 && (
          <div className='grid grid-cols-4 gap-2 w-full'>
            {kbs.map((kb) => (
              <div key={kb.id} className="flex flex-col gap-2 p-3 border rounded-lg relative">
                <div className="font-semibold">
                  {kb.name}
                </div>
                <div className="flex gap-2 ">
                  <Badge variant={'secondary'}>{kb.chunks?.length || 0} chunks</Badge>
                  <Badge variant={'outline'}>{kb.source_type}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                    {new Date(kb.created_at).toLocaleDateString()}
                  </span>
                <Button
                  onClick={() => handleDelete(kb.id)}
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default KnowledgeBase
