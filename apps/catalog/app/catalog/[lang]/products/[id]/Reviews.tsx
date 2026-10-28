import { listReviews, withLatency } from "@lab/db";
import { navigation } from "next/cache";
import { t } from "../../../../../lib/i18n";

export async function Reviews({ id }: { id: number }) {
  await navigation();
  const reviews = await withLatency(() => listReviews(id));
  return (
    <section aria-labelledby="reviews-heading" tabIndex={-1}>
      <h2 id="reviews-heading">{await t("reviews")}</h2>
      <ul>
        {reviews.map((review) => (
          <li key={`${review.author}-${review.text}`} data-testid="review">
            <strong>{review.author}</strong> ({review.rating}/5): {review.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
