/* ──────────────────────────────────────────
   1.  Item (SKU‑level master record)
   ────────────────────────────────────────── */
items: i.entity({
  id:             i.string().id(),              // UUID
  storeId:        i.string().indexed(),
  productId:      i.string().indexed(),

  /* Catalog */
  sku:            i.string(),                   // unique per store
  barcode:        i.string().optional(),
  option1:        i.string().optional(),
  option2:        i.string().optional(),
  option3:        i.string().optional(),
  image:          i.string().optional(),
  path:           i.string().optional(),

  /* Pricing */
  cost:           i.number().optional(),
  price:          i.number().optional(),
  salePrice:      i.number().optional(),
  margin:         i.number().optional(),

  /* Inventory policy */
  trackQty:       i.boolean().default(true),    // true = subtract stock
  allowPreorder:  i.boolean().default(false),   // true = oversell/back‑order

  /* Shelf‑life & lifecycle */
  shelfLifeDays:  i.number().optional(),        // e.g. 180
  expiryDate:     i.date().optional(),          // batch/lot based
  status:         i.string().default("active"), // active | expired | dumped

  /* Extensibility */
  metafields:     i.any().optional(),

  /* Audit */
  createdAt:      i.date().default('now'),
  updatedAt:      i.date().autoUpdate()
}),


/* ──────────────────────────────────────────
   2.  Stocking locations (unlimited)
   ────────────────────────────────────────── */
locations: i.entity({
  id:        i.string().id(),
  storeId:   i.string().indexed(),
  name:      i.string(),                        // e.g. “Chennai DC”
  type:      i.string().optional(),             // warehouse | retail | virtual
  address:   i.any().optional(),
  metafields:i.any().optional()
}),


/* ──────────────────────────────────────────
   3.  Per‑location inventory snapshot
   ────────────────────────────────────────── */
itemLocations: i.entity({
  itemId:       i.string().indexed(),           // → items.id
  locationId:   i.string().indexed(),           // → locations.id

  onHand:       i.number().default(0),          // physical units
  committed:    i.number().default(0),          // reserved by orders
  unavailable:  i.number().default(0),          // damaged / QC hold
  reorderLevel: i.number().optional(),          // low‑stock trigger

  /* Extensibility */
  metafields:   i.any().optional(),

  /* Audit */
  updatedAt:    i.date().autoUpdate()
}),
// available = onHand − committed − unavailable (client or view)
