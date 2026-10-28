import { listReviews, withLatency } from "@lab/db";
import { navigation } from "next/cache";
import { t } from "../../../../../lib/i18n";
import styles from "./product.module.css";

export async function Reviews({ id }: { id: number }) {
  await navigation();
  const reviews = await withLatency(() => listReviews(id));
  return (
    <section
      aria-labelledby="reviews-heading"
      tabIndex={-1}
      className={styles.section}
    >
      <h2 id="reviews-heading">
        {await t("reviews")}{" "}
        <span className={styles.count}>({reviews.length})</span>
      </h2>
      <ul className={styles.reviews}>
        {reviews.map((review) => (
          <li
            key={`${review.author}-${review.text}`}
            data-testid="review"
            className={styles.review}
          >
            <div className={styles.reviewHead}>
              <span className={styles.reviewAvatar} aria-hidden="true">
                {review.author.slice(0, 1)}
              </span>
              <strong>{review.author}</strong>
              <span className={styles.stars}>
                <span aria-hidden="true">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </span>{" "}
                {review.rating}/5
              </span>
            </div>
            <p>{review.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
