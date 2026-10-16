import { useEffect, useState } from 'react';
import { Button, Card, PageHeader, Input } from '../../components/ui';
import { Book, CartItem, Order, View } from '../../types';

interface Props {
  navigate: (view: View) => void;
  cart: CartItem[];
  books: Book[];
  onUpdateQty: (bookId: string, qty: number) => void;
  onRemove: (bookId: string) => void;
  onPlaceOrder: (order: Order, paymentMethod: 'CARD' | 'BANK_TRANSFER', receiptFile?: File) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

//use discounted price if available, otherwise use regular price
const DELIVERY_FEE = 350;
const getBookPrice = (book: Book) => book.activeOffer?.discountedPrice ?? book.price;

export default function Cart({
  navigate,
  cart,
  books,
  onUpdateQty,
  onRemove,
  onPlaceOrder,
  showToast,
}: Props) {
  const [step, setStep] = useState(1);

  const [deliveryMethod, setDeliveryMethod] = useState<
    'Home Delivery' | 'Institute Collection'
  >('Home Delivery');

  // User-entered delivery details
  const [studentName, setStudentName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Card details - no demo values
  const [cardForm, setCardForm] = useState({
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'BANK_TRANSFER'>('CARD');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [paymentError, setPaymentError] = useState('');
  const [deliveryError, setDeliveryError] = useState('');
  const [loading, setLoading] = useState(false)

  //create a subtotal of the cart items, using discounted price if available
  const subtotal = cart.reduce(
    (sum, item) => sum + getBookPrice(item.book) * item.quantity,
    0
  );
// Check if any cart item exceeds the available stock and adjust quantity if necessary
  useEffect(() => {
    let adjustedForStock = false;
    cart.forEach(item => {
      const availableStock =
        books.find(book => book.id === item.book.id)?.stock ??
        item.book.stock;
      if (item.quantity > availableStock) {
        onUpdateQty(item.book.id, availableStock);
        adjustedForStock = true;
      }
    });
    if (adjustedForStock) {
      showToast('Cart quantities were adjusted to match current book stock.', 'info');
    }
  }, [books, cart, onUpdateQty, showToast]);
//delivery fee is 350 if delivery method is home delivery, otherwise 0
  const fee = deliveryMethod === 'Home Delivery' ? DELIVERY_FEE : 0;
  const total = subtotal + fee;

  const handleProceedToPayment = () => {
    setDeliveryError('');

    if (!studentName.trim()) {
      setDeliveryError('Please enter the student name.');
      return;
    }

    if (!phone.trim()) {
      setDeliveryError('Please enter the phone number.');
      return;
    }

    if (phone.replace(/\D/g, '').length < 9) {
      setDeliveryError('Please enter a valid phone number.');
      return;
    }

    if (deliveryMethod === 'Home Delivery' && !address.trim()) {
      setDeliveryError('Please enter the delivery address.');
      return;
    }

    setStep(3);
  };

  // Live Sanitizers for Card Payment
  const handleCardNameChange = (val: string) => {
    // Only letters and spaces
    const clean = val.replace(/[^A-Za-z\s]/g, '');
    setCardForm(f => ({ ...f, cardName: clean }));
  };

  const handleCardNumberChange = (val: string) => {
    // Only digits, max 16
    const clean = val.replace(/\D/g, '').slice(0, 16);
    setCardForm(f => ({ ...f, cardNumber: clean }));
  };

  const handleExpiryChange = (val: string) => {
    // Only digits and '/'
    let clean = val.replace(/[^\d/]/g, '');
    if (clean.length === 2 && !clean.includes('/')) {
      clean = clean + '/';
    }
    if (clean.length > 5) clean = clean.slice(0, 5);
    setCardForm(f => ({ ...f, expiry: clean }));
  };

  const handleCvvChange = (val: string) => {
    // Only digits, max 3
    const clean = val.replace(/\D/g, '').slice(0, 3);
    setCardForm(f => ({ ...f, cvv: clean }));
  };

  const handleProcessPaymentAndOrder = async (
    e?: React.FormEvent
  ) => {
    if (e) {
      e.preventDefault();
    }

    setPaymentError('');

    if (paymentMethod === 'CARD') {
      const nameTrimmed = cardForm.cardName.trim();
      if (!nameTrimmed || !/^[A-Za-z\s]+$/.test(nameTrimmed)) {
        setPaymentError('Please enter a valid cardholder name.');
        return;
      }
      if (cardForm.cardNumber.length !== 16 || !/^\d{16}$/.test(cardForm.cardNumber)) {
        setPaymentError('Card number must contain exactly 16 digits.');
        return;
      }

      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
      if (!expiryRegex.test(cardForm.expiry)) {
        setPaymentError('Expiration date must be in valid MM/YY format (Month 01-12).');
        return;
      }
      const [mStr, yStr] = cardForm.expiry.split('/');
      const expMonth = parseInt(mStr, 10);
      const expYear = 2000 + parseInt(yStr, 10);
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        setPaymentError('Card has expired. Please enter a valid future expiry date.');
        return;
      }
      if (cardForm.cvv.length !== 3 || !/^\d{3}$/.test(cardForm.cvv)) {
        setPaymentError('CVV must contain exactly 3 digits.');
        return;
      }
    } else if (!receiptFile) {
      setPaymentError('Upload your bank transfer receipt before completing the order.');
      return;
    }

    setLoading(true);

    try {
      /*
       * Demo/simulated payment.
       * Do NOT store the actual card number or CVV.
       */
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const order: Order = {
        id: 'new-' + Date.now(),
        reference: `ORD-${new Date().getFullYear()}-${Math.floor(
          1000 + Math.random() * 9000
        )}`,
        date: new Date().toISOString().split('T')[0],
        items: [...cart],
        subtotal,
        deliveryFee: fee,
        total,
        deliveryMethod,
        address:
          deliveryMethod === 'Home Delivery'
            ? address.trim()
            : 'Main Campus Collection',
        phone: phone.trim(),
        status: 'Pending',
      };

      await onPlaceOrder(order, paymentMethod, receiptFile || undefined);

      showToast(
        'Payment submitted. Your order is pending admin approval.',
        'info'
      );

      navigate('student-orders');
    } catch (error) {
      console.error('Book order/payment error:', error);
      setPaymentError(
        error instanceof Error && error.message
          ? error.message
          : 'Unable to complete the payment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && step === 1) {
    return (
      <div className="fade-in-up">
        <PageHeader title="Shopping Cart" />

        <div className="text-center py-20">
          <div className="text-6xl mb-4">🛒</div>

          <h3 className="font-semibold text-slate-700 text-lg mb-2">
            Your cart is empty
          </h3>

          <p className="text-slate-400 text-sm mb-6">
            Add books from our catalogue to get started.
          </p>

          <Button onClick={() => navigate('student-books')}>
            Browse Books
          </Button>
        </div>
      </div>
    );
  }

  const steps = ['Cart Items', 'Delivery Info', 'Payment'];

  return (
    <div className="fade-in-up space-y-6">
      <PageHeader title="Book Checkout & Purchase" />

      {/* Stepper */}
      <div className="flex items-center gap-0 max-w-xl mx-auto">
        {steps.map((stepName, index) => (
          <div
            key={stepName}
            className="flex items-center flex-1 last:flex-none"
          >
            <div
              className={`flex flex-col items-center ${
                index === 0 ? '' : 'flex-1'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  step > index + 1
                    ? 'bg-[#1E6BB8] border-[#1E6BB8] text-white'
                    : step === index + 1
                    ? 'border-[#1E6BB8] text-[#1E6BB8] bg-white'
                    : 'border-slate-200 text-slate-300 bg-white'
                }`}
              >
                {step > index + 1 ? '✓' : index + 1}
              </div>

              <span
                className={`text-xs mt-1 font-medium whitespace-nowrap ${
                  step >= index + 1
                    ? 'text-[#1E6BB8]'
                    : 'text-slate-300'
                }`}
              >
                {stepName}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-px mx-2 mb-4 transition-all ${
                  step > index + 1
                    ? 'bg-[#1E6BB8]'
                    : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">

          {/* STEP 1 - CART */}
          {step === 1 && (
            <div className="space-y-4">
              {cart.map((item) => (
                <Card key={item.book.id} className="p-4">
                  {(() => {
                    const availableStock =
                      books.find(book => book.id === item.book.id)?.stock ??
                      item.book.stock;
                    const atStockLimit = item.quantity >= availableStock;
                    return (
                  <div className="flex gap-4">
                    <img
                      src={item.book.image}
                      alt={item.book.title}
                      className="w-16 h-20 object-cover rounded-xl flex-shrink-0 bg-slate-100"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 truncate">
                        {item.book.title}
                      </h4>

                      <p className="text-xs text-slate-400">
                        by {item.book.author}
                      </p>

                      {item.book.activeOffer ? (
                        <div className="mt-1">
                          <p className="text-xs font-bold text-slate-400 line-through">Rs. {item.book.price.toLocaleString()}</p>
                          <p className="text-sm font-bold text-emerald-700">
                            Rs. {item.book.activeOffer.discountedPrice.toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-[#C2660A] mt-1">
                          Rs. {item.book.price.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => onRemove(item.book.id)}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        ✕
                      </button>

                      <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() =>
                            onUpdateQty(
                              item.book.id,
                              Math.max(1, item.quantity - 1)
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-600"
                        >
                          −
                        </button>

                        <span className="w-8 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>

                        <button
                          disabled={atStockLimit}
                          onClick={() =>
                            onUpdateQty(
                              item.book.id,
                              item.quantity + 1
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-slate-400">
                        {availableStock > 0
                          ? `${availableStock} in stock`
                          : 'Out of stock'}
                      </span>

                      <span className="text-sm font-semibold text-slate-800">
                        Rs.{' '}
                        {(
                          getBookPrice(item.book) * item.quantity
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                    );
                  })()}
                </Card>
              ))}

              <Button
                fullWidth
                size="lg"
                onClick={() => setStep(2)}
              >
                Continue to Delivery →
              </Button>
            </div>
          )}

          {/* STEP 2 - DELIVERY */}
          {step === 2 && (
            <Card className="p-6 space-y-5">
              <h3 className="font-bold text-slate-800 font-display">
                Delivery / Collection Details
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {(
                  ['Home Delivery', 'Institute Collection'] as const
                ).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setDeliveryMethod(method)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      deliveryMethod === method
                        ? 'border-[#1E6BB8] bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">
                      {method === 'Home Delivery' ? '🚚' : '🏫'}
                    </div>

                    <p className="font-semibold text-sm text-slate-800">
                      {method}
                    </p>

                    <p className="text-xs text-slate-400 mt-0.5">
                      {method === 'Home Delivery'
                        ? `Rs. ${DELIVERY_FEE.toLocaleString()} delivery fee`
                        : 'Free — collect from institute'}
                    </p>
                  </button>
                ))}
              </div>

              {deliveryError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {deliveryError}
                </div>
              )}

              <div className="space-y-4 pt-2">

                {/* Student Name + Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Student Name"
                    value={studentName}
                    onChange={(value) => setStudentName(value)}
                    placeholder="Enter student name"
                    required
                  />

                  <Input
                    label="Phone Number"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(value) =>
                      setPhone(
                        value.replace(/\D/g, '').slice(0, 10)
                      )
                    }
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                {/* Delivery Address */}
                {deliveryMethod === 'Home Delivery' && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      Delivery Address
                      <span className="text-red-500">*</span>
                    </label>

                    <textarea
                      value={address}
                      onChange={(event) =>
                        setAddress(event.target.value)
                      }
                      rows={3}
                      placeholder="Enter your delivery address"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6BB8]/40 focus:border-[#1E6BB8] resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  ← Back to Cart
                </Button>

                <Button
                  size="lg"
                  onClick={handleProceedToPayment}
                  className="flex-1"
                >
                  Proceed to Payment →
                </Button>
              </div>
            </Card>
          )}

          {/* STEP 3 - PAYMENT */}
          {step === 3 && (
            <Card className="p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 font-display text-lg">
                    {paymentMethod === 'CARD' ? 'Card Payment Portal' : 'Bank Transfer'}
                  </h3>

                  <p className="text-xs text-slate-500">
                    Pay securely for your book order
                  </p>
                </div>

                {paymentMethod === 'CARD' && <div className="flex gap-1.5 text-xs font-semibold text-slate-500">
                  <span className="bg-slate-100 px-2 py-1 rounded">
                    VISA
                  </span>

                  <span className="bg-slate-100 px-2 py-1 rounded">
                    Mastercard
                  </span>
                </div>}
              </div>

              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
                  {paymentError}
                </div>
              )}

              <form
                onSubmit={handleProcessPaymentAndOrder}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3" role="group" aria-label="Payment method">
                  <button
                    type="button"
                    aria-pressed={paymentMethod === 'CARD'}
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-3 rounded-xl border-2 text-left transition-colors ${paymentMethod === 'CARD' ? 'border-[#1E6BB8] bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className="block text-lg mb-1">💳</span>
                    <span className="block text-sm font-semibold text-slate-800">Card</span>
                    <span className="block text-xs text-slate-500">Pay using card details</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={paymentMethod === 'BANK_TRANSFER'}
                    onClick={() => setPaymentMethod('BANK_TRANSFER')}
                    className={`p-3 rounded-xl border-2 text-left transition-colors ${paymentMethod === 'BANK_TRANSFER' ? 'border-[#1E6BB8] bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className="block text-lg mb-1">🏦</span>
                    <span className="block text-sm font-semibold text-slate-800">Bank Transfer</span>
                    <span className="block text-xs text-slate-500">Upload payment receipt</span>
                  </button>
                </div>

                {paymentMethod === 'CARD' ? <>
                <Input
                  label="Cardholder Name"
                  placeholder="e.g. Kasun Perera"
                  value={cardForm.cardName}
                  onChange={handleCardNameChange}
                  required
                />

                <Input
                  label="Card Number"
                  placeholder="16 digits (e.g. 4532000000008892)"
                  value={cardForm.cardNumber}
                  onChange={handleCardNumberChange}
                  maxLength={16}
                  icon={<span>💳</span>}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Expiration Date"
                    placeholder="MM/YY"
                    value={cardForm.expiry}
                    onChange={handleExpiryChange}
                    maxLength={5}
                    required
                  />

                  <Input
                    label="Security Code (CVV)"
                    type="password"
                    placeholder="3 digits (e.g. 123)"
                    value={cardForm.cvv}
                    onChange={handleCvvChange}
                    maxLength={3}
                    icon={<span>🔒</span>}
                    required
                  />
                </div>
                </> : <div>
                  <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E6BB8]">Bank transfer account details</p>
                        <p className="mt-1 text-sm font-semibold text-slate-600">Transfer the order total, then upload your receipt below.</p>
                      </div>
                      <span className="rounded-xl bg-white px-3 py-1 text-xs font-extrabold text-[#1E6BB8] shadow-sm">Demo</span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-white p-3 shadow-sm">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Bank</p>
                        <p className="mt-1 text-sm font-extrabold text-slate-900">BOC</p>
                      </div>
                      <div className="rounded-xl bg-white p-3 shadow-sm">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Account Number</p>
                        <p className="mt-1 font-mono text-sm font-extrabold text-slate-900">767821626</p>
                      </div>
                      <div className="rounded-xl bg-white p-3 shadow-sm">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Account Name</p>
                        <p className="mt-1 text-sm font-extrabold text-slate-900">Thaniya Kariyawasam</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-slate-500">Use your student name or order reference as the transfer remark.</p>
                  </div>
                  <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="book-order-receipt">Bank transfer receipt <span className="text-red-500">*</span></label>
                  <label htmlFor="book-order-receipt" className="block border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-[#1E6BB8] cursor-pointer transition-colors">
                    <span className="block text-3xl mb-2">🧾</span>
                    <span className="text-sm font-semibold text-[#1E6BB8]">{receiptFile ? 'Choose a different receipt' : 'Choose receipt file'}</span>
                    <span className="block text-xs text-slate-400 mt-1">JPG, PNG, WEBP, or PDF up to 5MB</span>
                    {receiptFile && <span className="block text-xs text-slate-600 mt-2 truncate">{receiptFile.name}</span>}
                    <input
                      id="book-order-receipt"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="sr-only"
                      onChange={event => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        if (!file) return;
                        if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
                          setReceiptFile(null);
                          setPaymentError('Choose a JPG, PNG, WEBP, or PDF receipt.');
                          return;
                        }
                        if (file.size > 5 * 1024 * 1024) {
                          setReceiptFile(null);
                          setPaymentError('Receipt must be smaller than 5MB.');
                          return;
                        }
                        setReceiptFile(file);
                        setPaymentError('');
                      }}
                    />
                  </label>
                  <p className="text-xs text-slate-500 mt-2">Your order payment stays pending until the institute verifies the receipt.</p>
                </div>}

                <div className="bg-slate-50 rounded-xl p-3.5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>
                      Books Subtotal ({cart.length} item
                      {cart.length !== 1 ? 's' : ''})
                    </span>

                    <span>
                      Rs. {subtotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Method</span>

                    <span>
                      {deliveryMethod}{' '}
                      (
                      {fee === 0
                        ? 'Free'
                        : `Rs. ${fee.toLocaleString()}`}
                      )
                    </span>
                  </div>

                  <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-200 pt-1.5 mt-1">
                    <span>Total Charge</span>

                    <span className="text-[#C2660A]">
                      Rs. {total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setStep(2)}
                    className="flex-1"
                    type="button"
                  >
                    ← Back
                  </Button>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="flex-2 bg-[#1E6BB8] hover:bg-[#155a9c]"
                  >
                    {loading
                      ? 'Submitting Payment...'
                      : paymentMethod === 'CARD'
                      ? `Pay Rs. ${total.toLocaleString()} & Complete Order`
                      : `Submit Receipt & Complete Order`}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>

        {/* SUMMARY SIDEBAR */}
        <div>
          <Card className="p-5 sticky top-4">
            <h3 className="font-bold text-slate-800 font-display mb-3">
              Cart Summary
            </h3>

            <div className="space-y-2 text-sm mb-3">
              {cart.map((item) => (
                <div
                  key={item.book.id}
                  className="flex justify-between"
                >
                  <span className="text-slate-500 truncate pr-2">
                    {item.book.title} ×{item.quantity}
                  </span>

                  <span className="font-medium flex-shrink-0">
                    Rs.{' '}
                    {(
                      item.book.price * item.quantity
                    ).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Delivery</span>
                <span>
                  {fee === 0
                    ? 'Free'
                    : `Rs. ${fee.toLocaleString()}`}
                </span>
              </div>

              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total</span>

                <span className="text-[#C2660A]">
                  Rs. {total.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
