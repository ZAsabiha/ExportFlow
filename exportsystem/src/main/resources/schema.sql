-- ---------------------------------------------------------------------------
-- Global search indexes
-- ---------------------------------------------------------------------------
-- Backs the search box in TopNavbar (every portal): free-text matches against
-- order code, buyer name/email, product name, destination, tracking number,
-- carrier, invoice number and (admin) username/email. Since the query is
-- "contains", not "starts with" (LIKE '%term%'), a plain B-tree index can't
-- be used - pg_trgm's trigram index can. Re-created on every startup like the
-- rest of this file (IF NOT EXISTS makes it a no-op after the first run), and
-- runs after Hibernate has created the underlying tables.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- orders
CREATE INDEX IF NOT EXISTS idx_orders_order_code_trgm   ON orders USING GIN (order_code gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_name_trgm   ON orders USING GIN (buyer_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email_trgm  ON orders USING GIN (buyer_email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_product_name_trgm ON orders USING GIN (product_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_destination_trgm  ON orders USING GIN (destination gin_trgm_ops);

-- Client portal ownership lookups (findByBuyerNameIgnoreCase*) do an exact,
-- case-insensitive match rather than a "contains" search - a functional
-- B-tree index on the lowercased column serves those better than the
-- trigram index above.
CREATE INDEX IF NOT EXISTS idx_orders_buyer_name_lower ON orders (LOWER(buyer_name));

-- shipments (order_id has no index by default - Postgres only indexes the
-- referenced side of a foreign key, not this side - and every shipment
-- query, including search, joins back to orders through it)
CREATE INDEX IF NOT EXISTS idx_shipments_order_id             ON shipments (order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number_trgm ON shipments USING GIN (tracking_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier_trgm         ON shipments USING GIN (carrier gin_trgm_ops);

-- invoices (same order_id join story as shipments)
CREATE INDEX IF NOT EXISTS idx_invoices_order_id            ON invoices (order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number_trgm ON invoices USING GIN (invoice_number gin_trgm_ops);

-- users (admin-portal search matches username/email)
CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON users USING GIN (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_email_trgm    ON users USING GIN (email gin_trgm_ops);


-- Read-only reporting view combining orders with their invoice and shipment info.
-- Re-created on every startup (spring.sql.init.mode=always), after Hibernate has
-- created/updated the underlying tables (spring.jpa.defer-datasource-initialization=true).
CREATE OR REPLACE VIEW export_report_view AS
SELECT
    o.id                  AS order_id,
    o.order_code          AS order_code,
    o.buyer_name          AS buyer_name,
    o.buyer_email         AS buyer_email,
    o.product_name        AS product_name,
    o.quantity            AS quantity,
    o.destination         AS destination,
    o.amount              AS order_amount,
    o.stage               AS order_stage,
    o.payment_status      AS payment_status,
    o.created_at          AS order_created_at,
    i.invoice_number      AS invoice_number,
    i.amount              AS invoice_amount,
    i.currency            AS invoice_currency,
    i.status              AS invoice_status,
    i.issue_date          AS invoice_issue_date,
    i.due_date            AS invoice_due_date,
    s.carrier             AS shipment_carrier,
    s.tracking_number     AS shipment_tracking_number,
    s.origin_port         AS shipment_origin_port,
    s.destination_port    AS shipment_destination_port,
    s.status              AS shipment_status,
    s.estimated_arrival   AS shipment_estimated_arrival
FROM orders o
LEFT JOIN invoices  i ON i.order_id = o.id
LEFT JOIN shipments s ON s.order_id = o.id;


CREATE OR REPLACE VIEW admin_report_view AS
SELECT
    o.id                  AS order_id,
    o.order_code          AS order_code,
    o.buyer_name          AS buyer_name,
    o.buyer_email         AS buyer_email,
    o.product_name        AS product_name,
    o.quantity            AS quantity,
    o.destination         AS destination,
    o.amount              AS order_amount,
    o.request_status      AS request_status,
    o.stage               AS order_stage,
    o.payment_status      AS payment_status,
    o.created_at          AS order_created_at,
    u.username            AS created_by_username,
    u.email               AS created_by_email,
    i.invoice_number      AS invoice_number,
    i.amount              AS invoice_amount,
    i.currency            AS invoice_currency,
    i.status              AS invoice_status,
    i.issue_date          AS invoice_issue_date,
    i.due_date            AS invoice_due_date,
    s.carrier             AS shipment_carrier,
    s.tracking_number     AS shipment_tracking_number,
    s.origin_port         AS shipment_origin_port,
    s.destination_port    AS shipment_destination_port,
    s.status              AS shipment_status,
    s.estimated_arrival   AS shipment_estimated_arrival
FROM orders o
LEFT JOIN users     u ON u.id = o.created_by
LEFT JOIN invoices  i ON i.order_id = o.id
LEFT JOIN shipments s ON s.order_id = o.id;
