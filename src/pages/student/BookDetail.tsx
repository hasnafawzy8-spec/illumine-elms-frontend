import { useState } from 'react';
import { books as initialBooks } from '../../data';
import { Button, Badge, Card } from '../../components/ui';
import { Book, CartItem, View } from '../../types';

interface Props {
  navigate: (view: View) => void;
  selectedBookId: string | null;
  onAddToCart: (item: CartItem) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  books?: Book[];
  cart: CartItem[];
}
//student book detail page
export default function BookDetail({ navigate, selectedBookId, onAddToCart, showToast, books = initialBooks, cart }: Props) {
  const [qty, setQty] = useState(1); //quantity of book to add to cart
  const book = books.find(b => b.id === selectedBookId); //find book by id
  if (!book) return <div className="p-8 text-center text-slate-400">Book not found.</div>;

  const inCart = cart.find(item => item.book.id === book.id)?.quantity || 0;
  const maxAddable = Math.max(0, book.stock - inCart);
  const selectedQty = Math.min(qty, maxAddable);
  const unitPrice = book.activeOffer?.discountedPrice ?? book.price;

  const handleAdd = (destination: View = 'student-books') => {
    if (maxAddable === 0) {
      showToast(`Only ${book.stock} "${book.title}" available. Your cart already has the maximum quantity.`, 'error');
      return;
    }
    onAddToCart({ book, quantity: selectedQty });
    showToast(`${selectedQty}x "${book.title}" added to cart!${inCart + selectedQty === book.stock ? ` Maximum stock (${book.stock}) reached.` : ''}`, 'success');
    navigate(destination);
  };

  return (
    <div className="fade-in-up space-y-6">
      <button onClick={() => navigate('student-books')} className="text-sm text-[#1E6BB8] hover:underline">← Back to Books</button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Image */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl overflow-hidden bg-slate-100 shadow-md">
            <img src={book.image} alt={book.title} className="w-full h-80 lg:h-96 object-cover" />
          </div>
        </div>

        {/* Info */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <div className="flex gap-2 mb-2">
              <Badge color="blue">{book.category}</Badge>
              <Badge color={book.stock > 0 ? 'green' : 'red'}>
                {book.stock > 0 ? `${book.stock} in stock` : 'Out of stock'}
              </Badge>
              {book.activeOffer && <Badge color="green">{book.activeOffer.discountPercent}% off</Badge>}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-display">{book.title}</h1>
            <p className="text-slate-500 mt-1">by <span className="font-medium text-slate-700">{book.author}</span></p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Publisher', value: book.publisher },
              { label: 'Grade', value: book.grade },
              { label: 'Category', value: book.category },
              { label: 'ISBN', value: book.isbn },
              { label: 'Stock', value: book.stock > 0 ? `${book.stock} available` : 'Out of stock' },
            ].map(d => (
              <div key={d.label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">{d.label}</p>
                <p className="text-sm font-semibold text-slate-800">{d.value}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-bold text-slate-800 font-display mb-2">Description</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{book.description}</p>
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                {book.activeOffer && (
                  <div className="mb-1">
                    <span className="mr-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
                      {book.activeOffer.title}
                    </span>

                    // Show original price with strikethrough if there's an active offer
                    <span className="text-sm font-bold text-slate-400 line-through">Rs. {book.price.toLocaleString()}</span>
                  </div>
                )}
                <span className={`text-3xl font-bold font-display ${book.activeOffer ? 'text-emerald-700' : 'text-[#C2660A]'}`}>
                  Rs. {unitPrice.toLocaleString()}
                </span>
              </div>
              {book.stock > 5 && <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">✓ In Stock</span>}
              {book.stock > 0 && book.stock <= 5 && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">⚠ Only {book.stock} left</span>}
              {book.stock === 0 && <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">Out of Stock</span>}
            </div>

            {book.stock > 0 && maxAddable > 0 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm text-slate-600 font-medium">Quantity:</span>
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQty(Math.max(1, selectedQty - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 text-slate-600 font-bold"
                    >−</button>
                    <span className="w-12 text-center text-sm font-semibold">{selectedQty}</span>
                    <button
                      disabled={selectedQty >= maxAddable}
                      onClick={() => setQty(Math.min(maxAddable, selectedQty + 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 text-slate-600 font-bold"
                    >+</button>
                  </div>
                  <span className="text-sm text-slate-400">Subtotal: <span className="font-bold text-slate-800">Rs. {(unitPrice * selectedQty).toLocaleString()}</span></span>
                </div>

                <div className="flex gap-3">
                  <Button fullWidth size="lg" onClick={() => handleAdd()}>🛒 Add to Cart</Button>
                  <Button variant="outline" size="lg" onClick={() => handleAdd('student-cart')}>
                    Buy Now →
                  </Button>
                </div>
              </>
            )}

            {book.stock > 0 && maxAddable === 0 && (
              <div className="bg-amber-50 rounded-xl p-4 text-center text-sm text-amber-700">
                Your cart already contains all {book.stock} available copies.
              </div>
            )}

            {book.stock === 0 && (
              <div className="bg-red-50 rounded-xl p-4 text-center text-sm text-red-600">
                This book is currently out of stock. Please check back later.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
