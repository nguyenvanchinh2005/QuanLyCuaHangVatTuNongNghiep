---
name: Vuon Pho
description: Agricultural supplies storefront and plant-care guide
colors:
  leaf-green: "#176b42"
  leaf-pale: "#e9f2e8"
  citrus: "#a94d13"
  garden-bg: "#f6f7f3"
  garden-text: "#252b25"
  garden-muted: "#68736b"
  garden-border: "#e3e8df"
  paper: "#ffffff"
  alert: "#bd4c3e"
typography:
  display:
    fontFamily: "Figtree, sans-serif"
    fontSize: "48px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0"
  body:
    fontFamily: "Figtree, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  label:
    fontFamily: "Figtree, sans-serif"
    fontSize: "12px"
    fontWeight: 700
rounded:
  sm: "4px"
  md: "5px"
spacing:
  sm: "8px"
  md: "14px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.leaf-green}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "0 17px"
    height: "43px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.garden-text}"
    rounded: "{rounded.sm}"
    padding: "9px 11px"
    height: "40px"
---

# Design System: Vuon Pho

## Overview

The interface is a practical Vietnamese garden-supply storefront with clear paths into shopping, plant-care information, and store operations. The storefront is the default view; authenticated employees and admins enter the management interface by role. Category-led browsing carries the storefront; route and status cues make operational views easier to scan. Product cards and product details render only from the PHP API backed by MySQL. Admin CRUD changes are persisted; employee product access is read-only. Account sessions are server-authenticated.

## Colors

The palette pairs plant greens with pale leaf surfaces and quiet neutral working areas; a darker citrus accent marks product labels.

### Primary
- **Leaf Green** (#176b42): Primary actions, active navigation, links, and agricultural identity.
- **Pale Leaf** (#e9f2e8): Hero copy surface and selected light areas.

### Secondary
- **Citrus** (#a94d13): Product labels and small emphasis; paired with white text for readable contrast.

### Neutral
- **Garden Background** (#f6f7f3): Main page background.
- **Garden Text** (#252b25): Headings and primary text.
- **Garden Muted** (#68736b): Secondary labels and descriptions.
- **Garden Border** (#e3e8df): Card, field, and table boundaries.
- **Paper** (#ffffff): Product cards, forms, and drawers.
- **Alert** (#bd4c3e): Destructive and error states.

## Typography

**Display Font:** Figtree, sans-serif  
**Body Font:** Figtree, sans-serif  
**Label Font:** Figtree, sans-serif

**Character:** A compact, friendly sans-serif keeps product names and operational data readable without making the store feel clinical.

### Hierarchy
- **Display** (700, 48px desktop / 40px tablet / 34px mobile, 1.05): Storefront lead headline.
- **Headline** (700, 30px, normal): View titles.
- **Title** (700, 19–23px, normal): Section and panel headings.
- **Body** (400, 13–15px, 1.5–1.65): Product descriptions, guidance, and supporting copy.
- **Label** (700, 11–12px): Navigation, filters, categories, and status cues.

## Layout

The desktop storefront uses a centered content width of 1,240px, a wide two-part crop-care feature, six category columns, and four product columns. At tablet sizes, category and product columns reduce; below 640px, categories use three columns, products use two, and a fixed bottom navigation adapts to the signed-in role. The search row wraps onto its own line on small screens. Tables scroll within their own bounded region instead of widening the page.

## Elevation & Depth

Surfaces are mostly flat and separated by fine borders. Product cards receive a soft offset shadow on hover, and the cart drawer uses a stronger side shadow to distinguish it from the page. Focus is shown with a clear outline rather than elevation.

### Shadow Vocabulary
- **Card Hover** (`0 14px 38px rgba(27, 55, 35, .09)`): Hover state for product cards.
- **Drawer** (`-12px 0 38px rgba(20, 33, 25, .16)`): Open cart drawer.

## Shapes

Buttons, fields, and repeated items use restrained 4–5px corners. Small status labels use rounded pills, while category pictograms sit in circles. Borders do most of the grouping work.

## Components

### Buttons
- **Shape:** Compact 4px corners.
- **Primary:** Leaf green with white text; 43px minimum height and 17px horizontal padding.
- **Hover / Focus:** Primary darkens slightly; keyboard focus uses a visible citrus outline.
- **Secondary / Ghost:** White fill or transparent surface with a fine border or green text.

### Chips
- **Style:** Small filled labels for product tags and status; maintain contrast between text and fill.
- **State:** Selected navigation and tabs use leaf-green text with a 2px underline.

### Cards / Containers
- **Corner Style:** 4px.
- **Background:** White against the garden background.
- **Shadow Strategy:** Flat at rest; soft shadow on product-card hover only.
- **Border:** Fine garden-border outline.
- **Internal Padding:** 9–20px depending on density.

### Inputs / Fields
- **Style:** White surface, 1px garden-border stroke, 4px corners.
- **Focus:** Leaf-green border and a subtle green focus halo.
- **Error / Disabled:** Errors use the alert color; disabled actions remain visibly unavailable.

### Navigation
- **Desktop:** White horizontal route bar with icon and label; active route uses green text and underline.
- **Mobile:** Four customer actions or five staff actions with icon and short label, sized for thumb use.
- **Search:** Wide shared header field with a solid green submit action.

### Product Cards
- **Content:** Real subject image, category, product name, stock, price, and a separate add-to-cart action.
- **Behavior:** Render only from backend API data; product name/card opens a detail dialog, favorite and cart actions remain distinct, and filters update the returned set.

## Do's and Don'ts

- Do keep product, category, order, and inventory states scannable with stable labels.
- Do connect plant-care articles to related supplies without presenting the link as a diagnosis.
- Do load product data from the backend endpoint; the backend, not the browser, connects to the database.
- Do preserve the two-column mobile product grid and the fixed bottom navigation.
- Do label frontend-only payment and photo-analysis outcomes as simulated.
- Don't imply persistent orders/payments or automatic disease recognition; authenticated accounts and admin-managed products are persisted in MySQL.
- Don't add a hardcoded product catalog or connect frontend code directly to a database.
- Don't reuse the storefront's one-off eyebrow/kicker labels as a system-wide heading pattern.
- Don't use the citrus accent for small white text unless its contrast remains at least 4.5:1.