import React, { useEffect, useState } from "react";
import { getFeaturedShopProducts } from "../services/wcimApi";
import styles from "../styles/Home.module.css";

const DEFAULT_IMAGE = "/images/wcim_soccer_ball_miami_background.png";

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

function formatPrice(product) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.currency || "USD",
  }).format(product.price || 0);
}

export default function ShopPreview() {
  const [products, setProducts] = useState([]);
  const [mode, setMode] = useState("loading");

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      try {
        const data = await getFeaturedShopProducts(4);

        if (!ignore) {
          setProducts(data.products || []);
          setMode("ready");
        }
      } catch (error) {
        if (!ignore) {
          setMode("fallback");
        }
      }
    }

    loadProducts();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className={styles.shopPreviewSection} id="shop-preview">
      <div className={styles.sectionHeading}>
        <div>
          <p>Merch Drop</p>
          <h2>Miami-inspired fanwear built for match-week traffic</h2>
        </div>
        <a href="/shop">Shop Merch</a>
      </div>

      <div className={styles.shopPreviewStatus}>
        <span className={styles.statusDot} />
        <strong>Shop catalog:</strong>
        <span>{mode}</span>
        <small>External checkout links can connect to Shopify, Printful, Printify, or Stripe later.</small>
      </div>

      <div className={styles.shopPreviewGrid}>
        {products.map((product) => (
          <article className={styles.shopPreviewCard} key={product.id}>
            <div className={styles.shopPreviewImage}>
              <ProductImage src={product.imageUrl} alt={product.name} />
            </div>

            <div className={styles.shopPreviewBody}>
              <span>{product.badge || product.category}</span>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <div className={styles.shopPriceRow}>
                <strong>{formatPrice(product)}</strong>
                {product.compareAtPrice ? (
                  <small>{formatPrice({ ...product, price: product.compareAtPrice })}</small>
                ) : null}
              </div>
              <a href={product.checkoutUrl || "/shop"}>View Product</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
