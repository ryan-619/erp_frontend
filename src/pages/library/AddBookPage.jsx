// ====================================================================
// Module: Library
// Page: Add Book
//
// Purpose:
// Form page for adding a single new book to the catalog.
//
// Data Source:
// library.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useState } from 'react'
import { BookPlus, Save, ArrowLeft, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { libraryService } from '@/services/library.service'
import { useToast } from '@/hooks/use-toast'

export default function AddBookPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    quantity: 1,
    available: 1,
    publisher: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await libraryService.createBook(form)
      toast({ title: 'Book added successfully' })
      navigate('/library/books')
    } catch (error) {
      console.error('Failed to add book:', error)
      toast({ title: 'Failed to add book', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Library' }, { label: 'Add Book' }]} />
      <PageHeader
        title="Add Book"
        description="Add a new book to the library catalog."
        icon={BookPlus}
        actions={
          <Button variant="outline" onClick={() => navigate('/library/books')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Book List
          </Button>
        }
      />

      <div className="mx-auto max-w-2xl rounded-lg border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Book Title *</Label>
              <Input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter book title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author *</Label>
              <Input
                id="author"
                name="author"
                value={form.author}
                onChange={handleChange}
                placeholder="Enter author name"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                name="isbn"
                value={form.isbn}
                onChange={handleChange}
                placeholder="Enter ISBN"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g., Fiction, Science, History"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="publisher">Publisher</Label>
            <Input
              id="publisher"
              name="publisher"
              value={form.publisher}
              onChange={handleChange}
              placeholder="Enter publisher name"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantity">Total Copies *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="available">Available Copies *</Label>
              <Input
                id="available"
                name="available"
                type="number"
                min="0"
                value={form.available}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/library/books')}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Book</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
