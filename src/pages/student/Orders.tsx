import { Badge, Card, PageHeader, EmptyState } from '../../components/ui';
import { Order, View } from '../../types';

interface Props {
  navigate: (view: View) => void;
  orders: Order[];
  lastOrder: Order | null;
}

const statusSteps = ['Pending', 'Confirmed', 'Ready for Collection', 'Out for Delivery', 'Delivered'];

function OrderTracker({ status }: { status: Order['status'] }) {
  if (status === 'Cancelled') {
    return (
      <div className="bg-red-50 rounded-xl p-3 text-sm text-red-600 text-center">
        ✕ This order was cancelled.
      </div>
    );
  }
  const currentIdx = statusSteps.indexOf(status);
  return (
    <div className="flex items-start gap-0">
      {statusSteps.map((s, i) => (
        <div key={s} className="flex flex-col items-center flex-1">
          <div className="flex items-center w-full">
            {i > 0 && <div className={`flex-1 h-0.5 ${i <= currentIdx ? 'bg-[#1E6BB8]' : 'bg-slate-200'}`} />}
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
              i < currentIdx ? 'bg-[#1E6BB8] border-[#1E6BB8] text-white' :
              i === currentIdx ? 'border-[#1E6BB8] text-[#1E6BB8] bg-white' :
              'border-slate-200 text-slate-300 bg-white'
            }`}>
              {i < currentIdx ? '✓' : i + 1}
            </div>
            {i < statusSteps.length - 1 && <div className={`flex-1 h-0.5 ${i < currentIdx ? 'bg-[#1E6BB8]' : 'bg-slate-200'}`} />}
          </div>
          <p className={`text-[9px] mt-1 text-center leading-tight ${i <= currentIdx ? 'text-[#1E6BB8] font-semibold' : 'text-slate-300'}`}>
            {s}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function Orders({ navigate: _navigate, orders, lastOrder }: Props) {
  const allOrders = [
  ...orders,
  ...(lastOrder ? [lastOrder] : []),
].filter(
  (order, index, array) =>
    array.findIndex(
      (item) => item.reference === order.reference
    ) === index
);

  return (
    <div className="fade-in-up space-y-6">
      <PageHeader title="My Orders" subtitle={`${allOrders.length} order${allOrders.length !== 1 ? 's' : ''}`} />

      {allOrders.length === 0 ? (
        <EmptyState
          icon={<span className="text-2xl">📦</span>}
          title="No orders found"
          description="You haven't placed any orders yet. Browse our book catalogue to get started."
        />
      ) : (
        <div className="space-y-4">
          {allOrders.map(order => (
            <Card key={order.id} className="overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📦</span>
                  <div>
                    <p className="font-bold text-slate-800">{order.reference}</p>
                    <p className="text-xs text-slate-400">{order.date} · {order.items.length} item(s)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#C2660A]">Rs. {order.total.toLocaleString()}</p>
                  <Badge color={
                    order.status === 'Delivered' ? 'green' :
                    order.status === 'Cancelled' ? 'red' :
                    order.status === 'Out for Delivery' || order.status === 'Ready for Collection' ? 'teal' :
                    'amber'
                  }>
                    {order.status}
                  </Badge>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {order.status === 'Pending' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                    ⏳ Payment received and order pending admin approval. Your order will be confirmed after review.
                  </div>
                )}
                {order.status === 'Confirmed' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                    ✅ Order placed successfully. Your payment was approved by the institute administration.
                  </div>
                )}
                {/* Items */}
                <div className="flex gap-3 flex-wrap">
                  {order.items.map(item => (
                    <div key={item.book.id} className="flex items-center gap-2 bg-slate-50 rounded-xl p-2">
                      <img src={item.book.image} alt={item.book.title} className="w-8 h-10 object-cover rounded-lg" />
                      <div>
                        <p className="text-xs font-medium text-slate-700 max-w-[140px] truncate">{item.book.title}</p>
                        <p className="text-xs text-slate-400">×{item.quantity} · Rs. {(item.book.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tracker vs Collection Message */}
                {order.deliveryMethod === 'Institute Collection' && order.status === 'Ready for Collection' ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900 flex items-start gap-3">
                    <span className="text-xl">🏫</span>
                    <div>
                      <p className="font-bold">Institute Collection</p>
                      <p className="text-xs text-blue-800 mt-0.5">
                        Your book is ready for collection. Please come to <strong>Illumine English Institute</strong> to collect your order.
                      </p>
                    </div>
                  </div>
                ) : order.deliveryMethod === 'Institute Collection' ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex items-start gap-3">
                    <span className="text-xl">🏫</span>
                    <div>
                      <p className="font-bold">Institute Collection</p>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Your order will be ready for institute collection after payment approval.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Order Progress</p>
                    <OrderTracker status={order.status} />
                  </div>
                )}

                {/* Delivery info */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-slate-400 mb-0.5">Delivery Method</p>
                    <p className="font-semibold text-slate-700">{order.deliveryMethod}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-slate-400 mb-0.5">Subtotal</p>
                    <p className="font-semibold text-slate-700">Rs. {order.subtotal.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-slate-400 mb-0.5">Delivery Fee</p>
                    <p className="font-semibold text-slate-700">{order.deliveryFee === 0 ? 'Free' : `Rs. ${order.deliveryFee.toLocaleString()}`}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
