# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JavaScript frontend with a PHP/PDO API and MySQL-backed product inventory and account sessions.

## Users

Customers buy agricultural supplies; employees review store operations; admins manage products and stock. The default page is the public storefront, with role-based entry to the management interface.

## Product Purpose

A web storefront and management interface for agricultural supplies. Customers browse products, view details, and create accounts. Employees review the management dashboard; admins manage the MySQL product catalog and inventory. Plant-care photo support and checkout remain simulations.

## Positioning

Combines a practical agricultural-supply storefront with plant-care guidance and a photo-based disease-support entry point.

## Operating Context

Customers browse categories such as soil, fertilizer, seeds, and pest control. Product cards and detail views use the backend API. Employees and admins are routed to a protected management page; admin product changes are persisted in MySQL.

## Capabilities and Constraints

- Registration, login, and account-management screens.
- Product categories, product details, prices, stock, search, and filters once product data is returned by the backend.
- Cart, order placement, order management, and simulated online payment.
- Plant-disease articles, photo upload/capture affordance, simulated identification result, and related-product suggestions.
- Admin views for users, products, orders, and disease data; employees have read-only access to the management interface.
- Registration and login use server-side sessions. Public registration creates customer accounts only; employee/admin accounts are created through the CLI.
- The PHP backend reads products through `GET /api/san-pham` and permits only admins to create, update, and delete products. The browser must not connect directly to MySQL.
- Orders, payments, and disease recognition remain prototype-only and are not persisted by the backend.
- Variable and function names in source code should use Vietnamese without diacritics, written as joined words.

## Brand Commitments

The user referenced https://nongnghieppho.vn/ as inspiration for the agricultural-supplies storefront and its category-led shopping experience. The product is not represented as that company's official website.

## Evidence on Hand

The explicit feature brief and the referenced public storefront are available. No brand assets, payment integration, or disease-recognition model were supplied. The backend uses the existing MySQL product table and the `taikhoan` table for authenticated accounts.

## Product Principles

- Make common shopping and store-operations tasks directly discoverable.
- Use agricultural terminology that is understandable to Vietnamese growers.
- Keep disease guidance connected to relevant supplies without presenting suggestions as diagnosis or medical certainty.
- Make prototype-only checkout and photo-analysis behavior visible; do not imply real payment or automated diagnosis.