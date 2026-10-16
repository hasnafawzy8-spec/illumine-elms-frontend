import { useMemo, useState, useEffect } from 'react';
import { Button, Badge, Card, Input, Textarea, Select, PageHeader, Modal } from '../../components/ui';
import { Book, View } from '../../types';
import { books as initialBooks } from '../../data';
import { booksAPI } from '../../services/api';

interface Props {
  navigate: (view: View) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onBookChange?: (book: Book) => void;
  onBookDelete?: (id: string) => void;
}

export default function AdminBooks({ navigate, showToast, onBookChange, onBookDelete }: Props) {
  const [booksList, setBooksList] = useState<Book[]>(initialBooks);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);

  // Form
  const [form, setForm] = useState({
    title: '',
    author: '',
    publisher: 'Illumine Publishing',
    grade: 'All Levels',
    category: 'Grammar',
    price: 2500,
    stock: 50,
    description: '',
    image: '',
    isbn: '978-0-19-440-1',
  });

  const readImage = (file: File, onLoad: (image: string) => void) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Please choose an image smaller than 5MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onLoad(String(reader.result));
    reader.readAsDataURL(file);
  };

  const loadBooks = async () => {
    try {
      const data = await booksAPI.getAll();
      if (data && data.length > 0) {
        setBooksList(data);
      }
    } catch (e) {
      console.log('Admin books load notice:', e);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const handleCreate = async () => {
    const priceVal = Number(form.price);
    const stockVal = Number(form.stock);

    if (!form.title || form.price === undefined || isNaN(priceVal)) {
      showToast('Book title and valid price are required.', 'error');
      return;
    }
    if (priceVal < 0) {
      showToast('Book price cannot be negative.', 'error');
      return;
    }
    if (isNaN(stockVal) || stockVal < 0 || !Number.isInteger(stockVal)) {
      showToast('Stock quantity cannot be negative and must be a whole number.', 'error');
      return;
    }

    try {
      const created = await booksAPI.create({
        bookCode: `BK-${form.category.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        title: form.title,
        author: form.author || 'Illumine Editorial Board',
        publisher: form.publisher,
        grade: form.grade,
        category: form.category,
        price: priceVal,
        stockQuantity: stockVal,
        description: form.description || 'Comprehensive textbook & exercise handbook.',
        coverImage: form.image || undefined,
        isbn: form.isbn,
      });

      if (created) {
        setBooksList(prev => [created, ...prev]);
        onBookChange?.(created);
      }
      await loadBooks();
      setShowAddModal(false);
      setForm({ title: '', author: '', publisher: 'Illumine Publishing', grade: 'All Levels', category: 'Grammar', price: 2500, stock: 50, description: '', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400', isbn: '978-0-19-440-1' });
      showToast('Book added to inventory catalogue!', 'success');
    } catch (e: any) {
      console.log('Book create error:', e);
      showToast(e?.response?.data?.message || e?.message || 'Failed to create book.', 'error');
    }
  };

  const handleUpdate = async () => {
    if (!editingBook) return;

    const priceVal = Number(editingBook.price);
    const stockVal = Number(editingBook.stock);

    if (priceVal < 0) {
      showToast('Book price cannot be negative.', 'error');
      return;
    }
    if (isNaN(stockVal) || stockVal < 0 || !Number.isInteger(stockVal)) {
      showToast('Stock quantity cannot be negative.', 'error');
      return;
    }

    try {
      const updated = await booksAPI.update(editingBook.id, {
        title: editingBook.title,
        author: editingBook.author,
        price: priceVal,
        stockQuantity: stockVal,
        category: editingBook.category,
        description: editingBook.description,
        coverImage: editingBook.image,
      });

      if (updated) {
        setBooksList(prev => prev.map(b => b.id === editingBook.id ? updated : b));
        onBookChange?.(updated);
      }
      await loadBooks();
      setEditingBook(null);
      showToast('Book details & stock updated successfully!', 'success');
    } catch (e: any) {
      console.log('Book update error:', e);
      showToast(e?.response?.data?.message || e?.message || 'Failed to update book.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingBook) return;

    try {
      await booksAPI.delete(deletingBook.id);
    } catch (e) {
      console.log('Book delete backend notice:', e);
    }

    setBooksList(prev => prev.filter(b => b.id !== deletingBook.id));
    onBookDelete?.(deletingBook.id);
    setDeletingBook(null);
    showToast('Book removed from catalogue.', 'info');
  };

  const categories = Array.from(new Set(booksList.map(b => b.category))).filter(Boolean);
  const stockStatus = (stock: number) => {
    if (stock <= 0) return { label: 'Out of stock', color: 'red' as const, tone: 'bg-red-500', helper: 'Needs reorder' };
    if (stock <= 5) return { label: `${stock} left`, color: 'amber' as const, tone: 'bg-amber-500', helper: 'Low stock' };
    return { label: `${stock} in stock`, color: 'green' as const, tone: 'bg-emerald-500', helper: 'Healthy' };
  };
  const stockPercent = (stock: number) => Math.min(100, Math.max(0, Math.round((stock / 50) * 100)));

  const inventoryStats = useMemo(() => {
    const totalUnits = booksList.reduce((sum, book) => sum + Math.max(0, book.stock), 0);
    const retailValue = booksList.reduce((sum, book) => sum + Math.max(0, book.stock) * book.price, 0);
    const lowStock = booksList.filter(book => book.stock > 0 && book.stock <= 5).length;
    const outOfStock = booksList.filter(book => book.stock <= 0).length;
    const topCategory = categories
      .map(category => ({ category, count: booksList.filter(book => book.category === category).length }))
      .sort((a, b) => b.count - a.count)[0]?.category || 'No category';

    return { totalUnits, retailValue, lowStock, outOfStock, topCategory };
  }, [booksList, categories]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = booksList.filter(book => {
      const matchesSearch = !query ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        (book.isbn || '').toLowerCase().includes(query);
      const matchesCategory = !categoryFilter || book.category === categoryFilter;
      const matchesStock =
        !stockFilter ||
        (stockFilter === 'healthy' && book.stock > 5) ||
        (stockFilter === 'low' && book.stock > 0 && book.stock <= 5) ||
        (stockFilter === 'out' && book.stock <= 0);
      return matchesSearch && matchesCategory && matchesStock;
    });

    return [...result].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'stock-low') return a.stock - b.stock;
      if (sortBy === 'stock-high') return b.stock - a.stock;
      return 0;
    });
  }, [booksList, categoryFilter, search, sortBy, stockFilter]);

  const lowStockBooks = booksList
    .filter(book => book.stock <= 5)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 3);

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setStockFilter('');
    setSortBy('recent');
  };

  const normalizeWholeNumber = (value: string) => {
    const number = Math.floor(Number(value));
    return Number.isFinite(number) ? Math.max(0, number) : 0;
  };

  return (
    <div className="fade-in-up space-y-6">
      <PageHeader
        title="Book Inventory & Bookstore"
        subtitle={`${booksList.length} titles tracked across ${categories.length || 1} catalogue categories`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('student-books')}>View Store</Button>
            <Button onClick={() => setShowAddModal(true)}>+ Add New Book Title</Button>
          </div>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <div className="relative overflow-hidden bg-slate-950 p-6 text-white">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(30,107,184,0.96),rgba(15,23,42,0.96))]" />
            <div className="absolute inset-0 opacity-25 bg-[linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] bg-[size:38px_38px]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-100">Inventory Control</p>
                <h2 className="mt-2 font-display text-3xl font-extrabold">Bookstore operations</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-blue-50/90">
                  Monitor stock health, pricing, and catalogue visibility from one realistic admin workspace.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/70">Top Category</p>
                <p className="mt-1 font-display text-xl font-extrabold">{inventoryStats.topCategory}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
            {[
              ['Titles', booksList.length, 'Catalogue items', 'bg-blue-50 text-blue-700'],
              ['Units', inventoryStats.totalUnits, 'Available stock', 'bg-emerald-50 text-emerald-700'],
              ['Low Stock', inventoryStats.lowStock, `${inventoryStats.outOfStock} out`, 'bg-amber-50 text-amber-700'],
              ['Stock Value', `Rs. ${inventoryStats.retailValue.toLocaleString()}`, 'Retail total', 'bg-slate-100 text-slate-700'],
            ].map(([label, value, helper, tone]) => (
              <div key={label} className={`rounded-2xl p-4 ${tone}`}>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] opacity-70">{label}</p>
                <p className="mt-2 font-display text-2xl font-extrabold">{value}</p>
                <p className="mt-1 text-xs font-bold opacity-70">{helper}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1E6BB8]">Action Needed</p>
              <h3 className="mt-1 font-display text-xl font-extrabold text-slate-950">Stock watchlist</h3>
            </div>
            <Badge color={inventoryStats.outOfStock > 0 ? 'red' : inventoryStats.lowStock > 0 ? 'amber' : 'green'}>
              {inventoryStats.lowStock + inventoryStats.outOfStock} alerts
            </Badge>
          </div>
          {lowStockBooks.length > 0 ? (
            <div className="space-y-3">
              {lowStockBooks.map(book => {
                const status = stockStatus(book.stock);
                return (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => setEditingBook({ ...book })}
                    className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition-colors hover:border-[#1E6BB8]/30 hover:bg-blue-50"
                  >
                    <img src={book.image} alt={book.title} className="h-12 w-10 rounded-xl object-cover shadow-sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-slate-900">{book.title}</p>
                      <p className="text-xs font-bold text-slate-400">{book.category} · Rs. {book.price.toLocaleString()}</p>
                    </div>
                    <Badge color={status.color}>{status.label}</Badge>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-emerald-50 p-5 text-center">
              <p className="font-display text-lg font-extrabold text-emerald-900">Inventory looks healthy</p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">No urgent restock items right now.</p>
            </div>
          )}
        </Card>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-2">
          <button onClick={() => setCategoryFilter('')} className={`rounded-full px-4 py-2 text-xs font-extrabold ${!categoryFilter ? 'bg-[#1E6BB8] text-white shadow-lg shadow-blue-700/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            All Categories
          </button>
          {categories.slice(0, 8).map(category => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`rounded-full px-4 py-2 text-xs font-extrabold ${categoryFilter === category ? 'bg-[#1E6BB8] text-white shadow-lg shadow-blue-700/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_12rem_12rem_12rem_auto]">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              placeholder="Search by title, author, or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-[#1E6BB8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:border-[#1E6BB8] focus:outline-none focus:ring-4 focus:ring-blue-100">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:border-[#1E6BB8] focus:outline-none focus:ring-4 focus:ring-blue-100">
            <option value="">All Stock</option>
            <option value="healthy">Healthy Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:border-[#1E6BB8] focus:outline-none focus:ring-4 focus:ring-blue-100">
            <option value="recent">Default Order</option>
            <option value="title">Title A-Z</option>
            <option value="stock-low">Lowest Stock</option>
            <option value="stock-high">Highest Stock</option>
            <option value="price-low">Lowest Price</option>
            <option value="price-high">Highest Price</option>
          </select>
          <button onClick={clearFilters} className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-extrabold text-slate-600 transition-colors hover:bg-slate-50">
            Reset
          </button>
        </div>
      </section>

      <Card className="overflow-hidden rounded-[1.75rem] border-slate-200 p-0">
        <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-xl font-extrabold text-slate-950">Catalogue list</h3>
            <p className="mt-1 text-sm font-semibold text-slate-400">{filtered.length} book{filtered.length === 1 ? '' : 's'} matching current filters</p>
          </div>
          <Badge color="blue">Live database</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400 backdrop-blur">
              <tr>
                <th className="px-5 py-4">Book</th>
                <th className="px-5 py-4">Author</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Stock Health</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(book => {
                const status = stockStatus(book.stock);
                const percent = stockPercent(book.stock);
                return (
                  <tr key={book.id} className="group transition-colors hover:bg-blue-50/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 shadow-sm ring-1 ring-slate-200">
                          <img src={book.image} alt={book.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <span className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/30 to-transparent" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-display text-base font-extrabold text-slate-950 line-clamp-1">{book.title}</p>
                          <p className="mt-1 font-mono text-xs font-bold text-slate-400">{book.isbn}</p>
                          <p className="mt-1 max-w-md truncate text-xs font-semibold text-slate-400">{book.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">{book.author}</td>
                    <td className="px-5 py-4">
                      <Badge color="blue">{book.category}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-display text-lg font-extrabold text-slate-950">Rs. {book.price.toLocaleString()}</p>
                      <p className="text-xs font-semibold text-slate-400">Retail price</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="max-w-[220px]">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <Badge color={status.color}>{status.label}</Badge>
                          <span className="text-xs font-bold text-slate-400">{status.helper}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className={`h-2 rounded-full ${status.tone}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingBook({ ...book })}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-700 shadow-sm transition-colors hover:border-[#1E6BB8]/40 hover:bg-blue-50 hover:text-[#1E6BB8]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingBook(book)}
                          className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-extrabold text-red-600 shadow-sm transition-colors hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-display text-xl font-extrabold text-slate-800">No matching books</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">Try changing the search, category, or stock filter.</p>
            <button onClick={clearFilters} className="mt-5 rounded-2xl bg-[#1E6BB8] px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-blue-700/20">
              Reset filters
            </button>
          </div>
        )}
      </Card>

      {/* Add Book Modal */}
      {showAddModal && (
        <Modal title="Add New Book Title" onClose={() => setShowAddModal(false)} size="lg">
          <div className="space-y-4">
            <Input
              label="Book Title"
              placeholder="e.g. Mastering English Grammar In Use"
              value={form.title}
              onChange={v => setForm(f => ({ ...f, title: v }))}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Author Name"
                placeholder="e.g. Raymond Murphy"
                value={form.author}
                onChange={v => setForm(f => ({ ...f, author: v }))}
                required
              />
              <Select
                label="Book Category"
                value={form.category}
                onChange={v => setForm(f => ({ ...f, category: v }))}
                options={[
                  { value: 'Grammar', label: 'Grammar & Mechanics' },
                  { value: 'Speaking', label: 'Spoken English & Dialogue' },
                  { value: 'Writing', label: 'Academic & Creative Writing' },
                  { value: 'IELTS', label: 'IELTS Preparation' },
                  { value: 'Kids', label: 'Kids & Beginners Phonics' },
                  { value: 'Literature', label: 'Literature & Graded Readers' },
                ]}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Price (LKR)"
                type="number"
                value={String(form.price)}
                onChange={v => setForm(f => ({ ...f, price: Number(v) }))}
                required
              />
              <Input
                label="Initial Stock Quantity"
                type="number"
                min="0"
                inputMode="numeric"
                value={String(form.stock)}
                onChange={v => setForm(f => ({ ...f, stock: normalizeWholeNumber(v) }))}
                required
              />
              <Input
                label="ISBN Code"
                placeholder="978-0-19-440"
                value={form.isbn}
                onChange={v => setForm(f => ({ ...f, isbn: v }))}
              />
            </div>

            <Textarea
              label="Description & Key Features"
              placeholder="Book description and contents..."
              value={form.description}
              onChange={v => setForm(f => ({ ...f, description: v }))}
            />

            <ImageUpload
              label="Book Cover Image"
              image={form.image}
              onChange={file => readImage(file, image => setForm(f => ({ ...f, image })))}
            />

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Add Book to Inventory</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Book Modal */}
      {editingBook && (
        <Modal title={`Edit Book (${editingBook.title})`} onClose={() => setEditingBook(null)}>
          <div className="space-y-4">
            <Input
              label="Book Title"
              value={editingBook.title}
              onChange={v => setEditingBook(b => b ? ({ ...b, title: v }) : null)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Author"
                value={editingBook.author}
                onChange={v => setEditingBook(b => b ? ({ ...b, author: v }) : null)}
              />
              <Input
                label="Price (LKR)"
                type="number"
                value={String(editingBook.price)}
                onChange={v => setEditingBook(b => b ? ({ ...b, price: Number(v) }) : null)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Stock Quantity"
                type="number"
                min="0"
                inputMode="numeric"
                value={String(editingBook.stock)}
                onChange={v => setEditingBook(b => b ? ({ ...b, stock: normalizeWholeNumber(v) }) : null)}
              />
              <Select
                label="Book Category"
                value={editingBook.category}
                onChange={v => setEditingBook(b => b ? ({ ...b, category: v }) : null)}
                options={[
                  { value: 'Grammar', label: 'Grammar & Mechanics' },
                  { value: 'Speaking', label: 'Spoken English & Dialogue' },
                  { value: 'Writing', label: 'Academic & Creative Writing' },
                  { value: 'IELTS', label: 'IELTS Preparation' },
                  { value: 'Kids', label: 'Kids & Beginners Phonics' },
                  { value: 'Literature', label: 'Literature & Graded Readers' },
                  { value: editingBook.category, label: editingBook.category },
                ].filter((option, index, options) => options.findIndex(item => item.value === option.value) === index)}
              />
            </div>

            <Textarea
              label="Description"
              value={editingBook.description}
              onChange={v => setEditingBook(b => b ? ({ ...b, description: v }) : null)}
            />

            <ImageUpload
              label="Book Cover Image"
              image={editingBook.image}
              onChange={file => readImage(file, image => setEditingBook(b => b ? ({ ...b, image }) : null))}
            />

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setEditingBook(null)}>Cancel</Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBook && (
        <Modal title="Confirm Remove Book" onClose={() => setDeletingBook(null)} size="sm">
          <p className="text-sm text-slate-600 mb-4">
            Are you sure you want to remove <strong>{deletingBook.title}</strong> from inventory?
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeletingBook(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete Book</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ImageUpload({ label, image, onChange }: { label: string; image?: string; onChange: (file: File) => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 mb-2 block">{label}</label>
      <label className="block border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-[#1E6BB8] cursor-pointer transition-all">
        {image ? <img src={image} alt="Book preview" className="w-full h-28 object-cover rounded-lg mb-3" /> : <div className="text-3xl mb-2">🖼️</div>}
        <span className="text-sm text-[#1E6BB8] font-semibold">Choose book cover</span>
        <span className="block text-xs text-slate-400 mt-1">PNG, JPG, or WEBP up to 5MB</span>
        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={event => { const file = event.target.files?.[0]; if (file) onChange(file); }} />
      </label>
    </div>
  );
}
