import React, { useEffect, useMemo, useState } from "react";
import {
  getShopCategories,
  getShopProducts,
} from "../services/wcimApi";
import styles from "../styles/Shop.module.css";

const DEFAULT_IMAGE = "/images/wcim_soccer_ball_miami_background.png";

function formatPrice(product) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.currency || "USD",
  }).format(product.price || 0);
}

function ProductImage({ src, alt }) {
  const [imageSrc, setImageSrc] = useState(src || DEFAULT_IMAGE);

  useEffect(() => {
    setImageSrc(src || DEFAULT_IMAGE);
  }, [src]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading="lazy"
      onError={() => setImageSrc(DEFAULT_IMAGE)}
    />
  );
}

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadShop(category = "") {
    try {
      setLoading(true);
      setMessage("");

      const [productsResult, categoriesResult] = await Promise.all([
        getShopProducts({ category, limit: 30 }),
        getShopCategories(),
      ]);

      setProducts(productsResult.products || []);
      setCategories(categoriesResult || []);
    } catch (error) {
      setMessage(`Could not load shop catalog: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShop(activeCategory);
  }, [activeCategory]);

  const featuredCount = useMemo(
    () => products.filter((product) => product.featured).length,
    [products]
  );

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div>
          <a href="/" className={styles.backLink}>← Back to site</a>
          <p>World Cup in Miami Shop</p>
          <h1>Merch built for Miami match-week energy</h1>
          <span>
            Fanwear concepts, watch-party gear, and Miami soccer culture products.
            Connect checkout links to Shopify, Printful, Printify, or Stripe when ready.
          </span>
        </div>

        <aside>
          <strong>{products.length}</strong>
          <span>products loaded</span>
          <small>{featuredCount} featured</small>
        </aside>
      </header>

      <section className={styles.filters}>
        <button
          type="button"
          className={!activeCategory ? styles.activeFilter : ""}
          onClick={() => setActiveCategory("")}
        >
          All
        </button>

        {categories.map((category) => (
          <button
            type="button"
            key={category.slug}
            className={activeCategory === category.slug ? styles.activeFilter : ""}
            onClick={() => setActiveCategory(category.slug)}
          >
            {category.label} ({category.count})
          </button>
        ))}
      </section>

      {message ? <section className={styles.message}>{message}</section> : null}

      <section className={styles.grid}>
        {loading ? (
          <article className={styles.emptyCard}>
            <h2>Loading merch catalog...</h2>
            <p>Pulling products from the WCIM backend.</p>
          </article>
        ) : products.length === 0 ? (
          <article className={styles.emptyCard}>
            <h2>No products found</h2>
            <p>Try another category or add more products to the catalog.</p>
          </article>
        ) : (
          products.map((product) => (
            <article className={styles.productCard} key={product.id}>
              <div className={styles.productImage}>
                <ProductImage src={product.imageUrl} alt={product.name} />
              </div>

              <div className={styles.productBody}>
                <span>{product.badge || product.collection}</span>
                <h2>{product.name}</h2>
                <p>{product.description}</p>

                <div className={styles.productMeta}>
                  <strong>{formatPrice(product)}</strong>
                  {product.compareAtPrice ? (
                    <small>{formatPrice({ ...product, price: product.compareAtPrice })}</small>
                  ) : null}
                </div>

                <a href={product.checkoutUrl || "#submit"} onClick={() => trackShopProductClicked(product)}>
                  {product.checkoutUrl === "#submit" ? "Request Product Link" : "Buy Now"}
                </a>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
