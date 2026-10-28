import type { DatabaseSync } from "node:sqlite";

const PRODUCT_COUNT = 12;
const AUTHORS = ["Marina", "Paulo", "Joana", "Rui"];

export function seed(db: DatabaseSync): void {
  const addProduct = db.prepare(
    "INSERT INTO products (id, slug, price_cents, stock) VALUES (?, ?, ?, 5)",
  );
  const addTranslation = db.prepare(
    "INSERT INTO product_translations (product_id, lang, name, description) VALUES (?, ?, ?, ?)",
  );
  const addReview = db.prepare(
    "INSERT INTO reviews (product_id, author, text, rating) VALUES (?, ?, ?, ?)",
  );
  for (let id = 1; id <= PRODUCT_COUNT; id++) {
    addProduct.run(id, `product-${id}`, 1000 + id * 100);
    addTranslation.run(
      id,
      "pt",
      `Produto ${id}`,
      `Descrição do produto ${id}.`,
    );
    addTranslation.run(
      id,
      "en",
      `Product ${id}`,
      `Description of product ${id}.`,
    );
    const reviews = 2 + (id % 3);
    for (let r = 0; r < reviews; r++) {
      addReview.run(
        id,
        AUTHORS[r % AUTHORS.length],
        `Review ${r + 1} of product ${id}`,
        3 + ((id + r) % 3),
      );
    }
  }

  const addUser = db.prepare("INSERT INTO users (id, name) VALUES (?, ?)");
  const addNotification = db.prepare(
    "INSERT INTO notifications (user_id, text, read, created_at) VALUES (?, ?, 0, ?)",
  );
  const now = new Date().toISOString();
  for (const [id, name] of [
    [1, "Ana"],
    [2, "Bruno"],
    [3, "Carla"],
  ] as const) {
    addUser.run(id, name);
    addNotification.run(id, `Welcome, ${name}!`, now);
  }
}
