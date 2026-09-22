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
