import { useState, useEffect } from 'react';
import { Card, Badge, Button, Textarea } from './ui';
import { reviewsAPI } from '../services/api';
import { formatColomboDisplayDate } from '../utils/dateFormatter';

interface Review {
  _id: string;
  student: {
    user: {
      firstName: string;
      lastName: string;
      profileImage?: string;
    };
  };
  rating: number;
  comment: string;
  adminReply?: string;
  createdAt: string;
}

interface Props {
  courseId: string;
  canReview: boolean;
  onReviewSubmitted?: () => void;
}

export default function CourseReviews({ courseId, canReview, onReviewSubmitted }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = async () => {
    try {
      const data = await reviewsAPI.getByCourse(courseId);
      setReviews(data);
    } catch (e) {
      console.log('Load reviews notice:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [courseId]);

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await reviewsAPI.create(courseId, { rating, comment });
      setShowForm(false);
      setComment('');
      loadReviews();
      onReviewSubmitted?.();
    } catch (e) {
      console.log('Submit review notice:', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-4 text-slate-400 text-sm">Loading reviews...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800 font-display">Student Reviews ({reviews.length})</h3>
        {canReview && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>Write a Review</Button>
        )}
      </div>

      {showForm && (
        <Card className="p-5 bg-blue-50/50 border-blue-100">
          <h4 className="font-bold text-slate-800 mb-3">Rate your experience</h4>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-2xl transition-colors ${rating >= star ? 'text-amber-400' : 'text-slate-200'}`}
              >
                ★
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Share your feedback about this course..."
            value={comment}
            onChange={setComment}
            rows={3}
            className="bg-white"
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Post Review'}
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {reviews.map(review => (
          <Card key={review._id} className="p-5">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#1E6BB8] flex items-center justify-center text-white font-bold flex-shrink-0">
                {review.student.user.firstName[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-slate-800">
                    {review.student.user.firstName} {review.student.user.lastName}
                  </h4>
                  <span className="text-xs text-slate-400">
                    {formatColomboDisplayDate(review.createdAt)}
                  </span>
                </div>
                <div className="flex text-amber-400 text-sm mb-2">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
                <p className="text-sm text-slate-600 italic">"{review.comment}"</p>

                {review.adminReply && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border-l-4 border-[#1E6BB8]">
                    <p className="text-[11px] font-bold text-[#1E6BB8] uppercase tracking-wider mb-1">Institute Reply</p>
                    <p className="text-xs text-slate-600">{review.adminReply}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {reviews.length === 0 && (
          <div className="text-center py-8 bg-slate-50 rounded-2xl text-slate-400 text-sm">
            No reviews yet. Be the first to share your experience!
          </div>
        )}
      </div>
    </div>
  );
}
