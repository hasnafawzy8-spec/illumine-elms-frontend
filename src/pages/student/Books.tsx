import { useMemo, useState } from 'react';
import { books as initialBooks } from '../../data';
import { Badge, PageHeader } from '../../components/ui';
import { Book, CartItem, View } from '../../types';

interface Props {
  navigate: (view: View) => void;
  onSelectBook: (id: string) => void;
  onAddToCart: (item: CartItem) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  books?: Book[];
  cart: CartItem[];
}

export default function Books({ navigate, onSelectBook, onAddToCart, showToast, books = initialBooks, cart }: Props) {
  const [search, setSearch] = useState(''); //search book
  const [gradeFilter, setGradeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('');

//filtering and sorting books based on search, grade, category, and sort order
  let filtered = books.filter(b => {
    if (search && !b.title.toLowerCase().includes(search.toLowerCase()) && !b.author.toLowerCase().includes(search.toLowerCase())) return false;
    if (gradeFilter && b.grade !== gradeFilter) return false;
    if (categoryFilter && b.category !== categoryFilter) return false;
    return true;
  });

  const getBookPrice = (book: Book) => book.activeOffer?.discountedPrice ?? book.price;
  if (sortBy === 'price-asc') filtered = [...filtered].sort((a, b) => getBookPrice(a) - getBookPrice(b));
  if (sortBy === 'price-desc') filtered = [...filtered].sort((a, b) => getBookPrice(b) - getBookPrice(a));

  const grades = [...new Set(books.map(b => b.grade))];
  const categories = [...new Set(books.map(b => b.category))];
  const totalStock = books.reduce((sum, book) => sum + Math.max(0, book.stock), 0);
  const cartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const featuredBook = filtered[0] || books[0];

  const categoryStats = useMemo(() => {
    return categories.map(category => ({
      category,
      count: books.filter(book => book.category === category).length,
    }));
  }, [books, categories]);

  const openBook = (book: Book) => {
    onSelectBook(book.id);
    navigate('student-book-detail');
  };

  const addBookToCart = (book: Book) => {
    const inCart = cart.find(item => item.book.id === book.id)?.quantity || 0;
    if (inCart >= book.stock) {
      showToast(`Only ${book.stock} "${book.title}" available. Your cart already has the maximum quantity.`, 'error');
      return;
    }
    onAddToCart({ book, quantity: 1 });
    showToast(`"${book.title}" added to cart!${inCart + 1 === book.stock ? ` Maximum stock (${book.stock}) reached.` : ''}`, 'success');
  };

  const clearFilters = () => {
    setSearch('');
    setGradeFilter('');
    setCategoryFilter('');
    setSortBy('');
  };

  const hasFilters = Boolean(search || gradeFilter || categoryFilter || sortBy);

  const Icon = ({ name, className = '' }: { name: 'search' | 'cart' | 'book' | 'arrow' | 'spark' | 'filter' | 'eye' | 'stack'; className?: string }) => {
    const common = { className, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': true };
    const strokeProps = { stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    switch (name) {
      case 'search':
        return <svg {...common}><path {...strokeProps} d="m21 21-4.35-4.35" /><circle {...strokeProps} cx="11" cy="11" r="7" /></svg>;
      case 'cart':
        return <svg {...common}><path {...strokeProps} d="M6 6h15l-1.6 8.2a2 2 0 0 1-2 1.6H9.1a2 2 0 0 1-2-1.7L6 6Z" /><path {...strokeProps} d="M6 6 5.4 3H3" /><circle cx="9.5" cy="20" r="1.4" fill="currentColor" /><circle cx="17.5" cy="20" r="1.4" fill="currentColor" /></svg>;
      case 'book':
        return <svg {...common}><path {...strokeProps} d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5v-17Z" /><path {...strokeProps} d="M5 4.5A2.5 2.5 0 0 0 7.5 7H20" /></svg>;
      case 'arrow':
        return <svg {...common}><path {...strokeProps} d="M5 12h14" /><path {...strokeProps} d="m13 6 6 6-6 6" /></svg>;
      case 'spark':
        return <svg {...common}><path {...strokeProps} d="m12 3 1.7 4.6L18 9.3l-4.3 1.7L12 16l-1.7-5L6 9.3l4.3-1.7L12 3Z" /><path {...strokeProps} d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" /></svg>;
      case 'filter':
        return <svg {...common}><path {...strokeProps} d="M4 6h16M7 12h10M10 18h4" /></svg>;
      case 'eye':
        return <svg {...common}><path {...strokeProps} d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle {...strokeProps} cx="12" cy="12" r="3" /></svg>;
      case 'stack':
        return <svg {...common}><path {...strokeProps} d="m12 3 8 4-8 4-8-4 8-4Z" /><path {...strokeProps} d="m4 12 8 4 8-4" /><path {...strokeProps} d="m4 17 8 4 8-4" /></svg>;
      default:
        return null;
    }
  };

  return (
    <div className="fade-in-up space-y-7">
      <PageHeader title="Learning Books & Materials" subtitle="Official Illumine publications, practice guides, and classroom resources." />

      <section className="books-showcase overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden bg-[#0f2338] p-6 text-white sm:p-8">
            <div className="absolute inset-0 opacity-20">
              <img
                src={featuredBook?.image || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=900&h=600&fit=crop'}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f2338] via-[#123d64]/90 to-[#1E6BB8]/70" />
            <div className="relative max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
                <Icon name="spark" className="h-4 w-4" /> Book store
              </span>
              <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Find the right material faster.</h2>
              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-blue-50/90">
                Browse by grade, category, stock, and price. Hover a book card to preview it before opening the full details.
              </p>
              <div className="mt-6 grid max-w-xl grid-cols-3 gap-3">
                {[
                  ['Titles', books.length],
                  ['In stock', totalStock],
                  ['Cart', cartQuantity],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <p className="font-display text-2xl font-extrabold">{value}</p>
                    <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/70">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1E6BB8]">Recommended</p>
                <h3 className="mt-1 font-display text-2xl font-extrabold text-slate-950 line-clamp-2">{featuredBook?.title || 'Learning materials'}</h3>
              </div>
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1E6BB8]">
                <Icon name="book" className="h-6 w-6" />
              </div>
            </div>
            {featuredBook && (
              <div className="mt-6 flex gap-5">
                <button onClick={() => openBook(featuredBook)} className="book-cover-preview group relative h-40 w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-xl shadow-blue-950/10">
                  <img src={featuredBook.image || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500&h=700&fit=crop'} alt={featuredBook.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <span className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/35 to-transparent" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <Badge color="blue">{featuredBook.category}</Badge>
                    <Badge color={featuredBook.stock > 0 ? 'green' : 'red'}>{featuredBook.stock > 0 ? `${featuredBook.stock} available` : 'Out of stock'}</Badge>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-500">by {featuredBook.author} · {featuredBook.grade}</p>
                  {featuredBook.activeOffer && (
                    <div className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
                      {featuredBook.activeOffer.title} · Save Rs. {featuredBook.activeOffer.discountAmount.toLocaleString()}
                    </div>
                  )}
                  <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-3">{featuredBook.description}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button onClick={() => openBook(featuredBook)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-700 hover:border-[#1E6BB8] hover:text-[#1E6BB8]">
                      Preview <Icon name="arrow" className="h-4 w-4" />
                    </button>
                    <button
                      disabled={featuredBook.stock === 0}
                      onClick={() => addBookToCart(featuredBook)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#1E6BB8] px-4 py-2 text-sm font-extrabold text-white shadow-lg shadow-blue-700/20 hover:bg-[#155a9c] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Icon name="cart" className="h-4 w-4" /> Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <Icon name="filter" className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-extrabold text-slate-950">Browse library</p>
              <p className="text-xs font-semibold text-slate-400">{filtered.length} result{filtered.length === 1 ? '' : 's'} found</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter('')}
              className={`rounded-full px-4 py-2 text-xs font-extrabold ${categoryFilter === '' ? 'bg-[#1E6BB8] text-white shadow-lg shadow-blue-700/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              All
            </button>
            {categoryStats.slice(0, 5).map(item => (
              <button
                key={item.category}
                onClick={() => setCategoryFilter(item.category)}
                className={`rounded-full px-4 py-2 text-xs font-extrabold ${categoryFilter === item.category ? 'bg-[#1E6BB8] text-white shadow-lg shadow-blue-700/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {item.category} <span className="opacity-70">({item.count})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <div className="flex-1 relative">
            <Icon name="search" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search books or authors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-[#1E6BB8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} className="h-[52px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:border-[#1E6BB8] focus:outline-none focus:ring-4 focus:ring-blue-100">
            <option value="">All Grades</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-[52px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:border-[#1E6BB8] focus:outline-none focus:ring-4 focus:ring-blue-100">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="h-[52px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:border-[#1E6BB8] focus:outline-none focus:ring-4 focus:ring-blue-100">
            <option value="">Sort By</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
        {hasFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
            Active filters:
            {search && <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Search: {search}</span>}
            {gradeFilter && <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{gradeFilter}</span>}
            {categoryFilter && <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{categoryFilter}</span>}
            {sortBy && <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{sortBy === 'price-asc' ? 'Lowest price' : 'Highest price'}</span>}
            <button onClick={clearFilters} className="rounded-full px-3 py-1 text-red-600 hover:bg-red-50">Clear</button>
          </div>
        )}
      </div>

      {/* Book grid */}
      {filtered.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Icon name="book" className="h-8 w-8" />
          </div>
          <h3 className="font-display text-xl font-extrabold text-slate-800">No books found</h3>
          <p className="mt-1 text-sm font-medium text-slate-400">Try a different title, author, grade, or category.</p>
          <button onClick={clearFilters} className="mt-5 rounded-xl bg-[#1E6BB8] px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-blue-700/20">Reset filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(book => (
            <article key={book.id} className="book-market-card group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
              <div className="relative h-64 overflow-hidden bg-slate-100 cursor-pointer" onClick={() => openBook(book)}>
                <img src={book.image || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=700&h=520&fit=crop'} alt={book.title} className="book-hero-photo h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent opacity-70" />
                <div className="absolute left-4 top-4 flex gap-2">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-slate-800 shadow-sm backdrop-blur">{book.grade}</span>
                  {book.isbn && <span className="hidden rounded-full bg-slate-950/60 px-3 py-1 text-xs font-extrabold text-white backdrop-blur sm:inline-flex">{book.isbn}</span>}
                </div>
                <div className="book-hover-preview absolute inset-x-4 bottom-4 rounded-2xl border border-white/20 bg-white/95 p-4 text-slate-900 shadow-2xl backdrop-blur">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E6BB8]">
                      <Icon name="stack" className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E6BB8]">Quick preview</p>
                      <p className="mt-1 text-sm font-extrabold text-slate-950 line-clamp-1">{book.title}</p>
                      <div className="book-preview-bars mt-3 space-y-1.5">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge color="blue">{book.category}</Badge>
                  <Badge color={book.stock > 0 ? 'green' : 'red'}>{book.stock > 0 ? `${book.stock} in stock` : 'Out of stock'}</Badge>
                  {book.activeOffer && <Badge color="green">{book.activeOffer.discountPercent}% off</Badge>}
                </div>
                <h3
                  className="font-display text-lg font-extrabold leading-snug text-slate-900 cursor-pointer hover:text-[#1E6BB8] transition-colors"
                  onClick={() => openBook(book)}
                >
                  {book.title}
                </h3>
                <p className="text-sm font-semibold text-slate-400 mt-1">by {book.author}</p>
                <p className="text-sm text-slate-500 mt-3 line-clamp-2 leading-6">{book.description}</p>

                <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-5">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Price</p>
                    {book.activeOffer ? (
                      <div>
                        <span className="text-xs font-bold text-slate-400 line-through">Rs. {book.price.toLocaleString()}</span>
                        <span className="block font-display text-2xl font-extrabold text-emerald-700">Rs. {book.activeOffer.discountedPrice.toLocaleString()}</span>
                      </div>
                    ) : (
                      <span className="font-display text-2xl font-extrabold text-[#C2660A]">Rs. {book.price.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button onClick={() => openBook(book)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-extrabold text-slate-700 hover:border-[#1E6BB8] hover:bg-blue-50 hover:text-[#1E6BB8]">
                      <Icon name="eye" className="h-4 w-4" /> Details
                    </button>
                    <button
                      disabled={book.stock === 0}
                      onClick={() => addBookToCart(book)}
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1E6BB8] px-4 text-sm font-extrabold text-white shadow-lg shadow-blue-700/20 hover:bg-[#155a9c] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                    >
                      <Icon name="cart" className="h-4 w-4" /> {book.stock === 0 ? 'Sold Out' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
