import styles from "./Skeleton.module.css";

export function Skeleton({
  label,
  lines = 3,
}: {
  label: string;
  lines?: number;
}) {
  return (
    <div className={styles.skeleton} aria-busy="true">
      <p className={styles.label}>{label}</p>
      <div aria-hidden="true">
        {Array.from({ length: lines }, (_, index) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder bars
            key={index}
            className={styles.bar}
            style={{ width: `${92 - index * 17}%` }}
          />
        ))}
      </div>
    </div>
  );
}
