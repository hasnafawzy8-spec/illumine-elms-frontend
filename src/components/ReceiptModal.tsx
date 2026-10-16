import { Modal } from './ui';
import { ReceiptData } from '../types';
import { formatColomboDateTime, formatColomboDisplayDate, getNextMonthSameDate } from '../utils/dateFormatter';

interface ReceiptModalProps {
  receipt: ReceiptData | null;
  payment?: any;
  onClose: () => void;
}

export default function ReceiptModal({ receipt, payment, onClose }: ReceiptModalProps) {
  if (!receipt && !payment) return null;

  const receiptNumber = receipt?.receiptNumber || 'Pending receipt issuance';
  const dateStr = receipt?.issuedDate
    ? formatColomboDateTime(receipt.issuedDate)
    : (payment?.date ? formatColomboDateTime(payment.date) : '');

  const studentName = receipt?.student?.user 
    ? `${receipt.student.user.firstName} ${receipt.student.user.lastName}`.trim()
    : payment?.student || (payment?.payer?.firstName ? `${payment.payer.firstName} ${payment.payer.lastName}` : 'Student');

  const studentEmail = receipt?.student?.user?.email || payment?.payer?.email || 'N/A';
  const studentId = receipt?.student?.studentId || payment?.studentId || 'N/A';
  const rawAmount = receipt?.amount ?? payment?.amount ?? 0;
  const method = receipt?.paymentMethod || payment?.method || payment?.paymentMethod || 'Bank Transfer';
  const courseTitle = receipt?.payment?.relatedCourse?.title;
  const courseCode = receipt?.payment?.relatedCourse?.courseCode;
  const orderNumber = receipt?.payment?.relatedOrder?.orderNumber;
  const description = courseTitle
    ? `${courseTitle} course fee${courseCode ? ` (${courseCode})` : ''}`
    : orderNumber
      ? `Books and materials, order ${orderNumber}`
      : payment?.description || payment?.relatedTo || 'Education services';
  const paymentReference = receipt?.payment?.paymentReference || payment?.reference || payment?.paymentReference || 'N/A';
  const transactionId = receipt?.transactionId || receipt?.payment?.transactionId || payment?.transactionId || 'N/A';
  const receiptReady = Boolean(receipt?.receiptNumber);
  const receiptPayment = receipt?.payment || payment || {};
  const installment = receiptPayment?.installment || {};
  const paymentPlan = receiptPayment?.paymentPlan || payment?.paymentPlan || 'FULL';
  const isInstallment = paymentPlan === 'INSTALLMENT' || Number(installment.totalInstallments || payment?.totalInstallments || 1) > 1;
  const installmentNumber = installment.installmentNumber || payment?.installmentNumber || 1;
  const totalInstallments = installment.totalInstallments || payment?.totalInstallments || 3;
  const courseFee = Number(receiptPayment?.relatedCourse?.fee || payment?.courseFee || 0);
  const serviceFee = Number(installment.serviceFee || (isInstallment ? 1500 : 0));
  const repairedTotalPayable = isInstallment
    ? (
        courseFee > 0
          ? courseFee + serviceFee
          : Number(installment.totalPayable || payment?.totalPayable || 0) > Number(rawAmount)
            ? Number(installment.totalPayable || payment?.totalPayable || 0)
            : Number(rawAmount) * Number(totalInstallments || 1)
      )
    : Number(installment.totalPayable || payment?.totalPayable || rawAmount);
  const expectedInstallmentAmount = isInstallment && Number(totalInstallments) > 1
    ? Math.round(repairedTotalPayable / Number(totalInstallments))
    : Number(rawAmount);
  const storedPaidAmount = Number(installment.paidAmount || payment?.paidAmount || rawAmount || 0);
  const amount = isInstallment && Number(installmentNumber) === 1 && storedPaidAmount > expectedInstallmentAmount
    ? expectedInstallmentAmount
    : storedPaidAmount;
  const totalPayable = repairedTotalPayable;
  const remainingAmount = isInstallment
    ? Math.max(totalPayable - amount, 0)
    : Number(installment.remainingAmount ?? payment?.remainingAmount ?? 0);
  const nextDueDate =
    installment.nextDueDate ||
    payment?.nextDueDate ||
    (isInstallment ? getNextMonthSameDate(receipt?.issuedDate || payment?.date || new Date()) : '');

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal title="Official Payment Receipt" onClose={onClose} size="lg">
      <div className="receipt-print-root">
        <article className="receipt-document">
          <header className="receipt-header">
            <div className="receipt-brand">
              <div className="receipt-monogram" aria-hidden="true">IE</div>
              <div>
                <p className="receipt-kicker">ILLUMINE WORLDWIDE PRIVATE LIMITED</p>
                <h2>Illumine English Institute</h2>
                <p className="receipt-tagline">English Language Education</p>
              </div>
            </div>
            <div className="receipt-title-block">
              <span className={`receipt-status ${receiptReady ? 'is-paid' : 'is-pending'}`}>{receiptReady ? 'PAYMENT RECEIVED' : 'PAYMENT PENDING'}</span>
              <h3>OFFICIAL RECEIPT</h3>
              <p>Receipt No. <strong>{receiptNumber}</strong></p>
            </div>
          </header>

          <div className="receipt-rule" />

          <section className="receipt-meta-grid" aria-label="Receipt details">
            <div className="receipt-panel">
              <p className="receipt-section-label">RECEIVED FROM</p>
              <p className="receipt-student-name">{studentName}</p>
              <p>{studentEmail}</p>
              <p>Student ID: {studentId}</p>
            </div>
            <div className="receipt-panel receipt-meta-list">
              <p><span>Issue date</span><strong>{dateStr || 'Pending'}</strong></p>
              <p><span>Payment reference</span><strong>{paymentReference}</strong></p>
              <p><span>Transaction ID</span><strong>{transactionId}</strong></p>
              <p><span>Payment method</span><strong>{method}</strong></p>
            </div>
          </section>

          <section className="receipt-items-section">
            <p className="receipt-section-label">PAYMENT BREAKDOWN</p>
            <table className="receipt-items-table">
              <thead>
                <tr><th>Description</th><th>Qty.</th><th className="receipt-amount-cell">Amount (LKR)</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>{description}</strong><span>{isInstallment ? `Installment ${installmentNumber} of ${totalInstallments}` : 'Verified payment'}</span></td>
                  <td>1</td>
                  <td className="receipt-amount-cell">Rs. {Number(amount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {isInstallment && (
            <section className="receipt-meta-grid" aria-label="Installment details">
              <div className="receipt-panel receipt-meta-list">
                <p><span>Total payable</span><strong>Rs. {Number(totalPayable).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
                <p><span>Amount paid now</span><strong>Rs. {Number(amount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
              </div>
              <div className="receipt-panel receipt-meta-list">
                <p><span>Remaining balance</span><strong>Rs. {Number(remainingAmount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
                <p><span>Next due date</span><strong>{nextDueDate ? formatColomboDisplayDate(nextDueDate) : 'To be scheduled'}</strong></p>
              </div>
            </section>
          )}

          <section className="receipt-total-row">
            <div>
              <p>Total amount received</p>
              <span>Currency: Sri Lankan Rupees (LKR)</span>
            </div>
            <strong>Rs. {Number(amount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </section>

          <footer className="receipt-footer">
            <div>
              <p className="receipt-thanks">Thank you for learning with Illumine.</p>
              <p>This computer-generated receipt confirms that the payment listed above has been received and recorded by Illumine English Institute.</p>
            </div>
            <div className="receipt-authorized">
              <span className="receipt-signature-mark">IE</span>
              <span>Authorized by</span>
              <strong>Illumine English Institute</strong>
            </div>
          </footer>
        </article>

        <div className="receipt-actions no-print">
          <button onClick={handlePrint} disabled={!receiptReady} className="receipt-print-button disabled:cursor-not-allowed disabled:opacity-50">
            Print / Download Receipt
          </button>
          <button onClick={onClose} className="receipt-close-button">Close</button>
        </div>
      </div>
    </Modal>
  );
}
