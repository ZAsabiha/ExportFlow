CREATE TABLE IF NOT EXISTS api_access_rules (
    id           BIGSERIAL PRIMARY KEY,
    http_method  VARCHAR(10),
    path_pattern VARCHAR(255) NOT NULL,
    role_name    VARCHAR(255) NOT NULL,
    permission   VARCHAR(255)
);

BEGIN;

DELETE FROM api_access_rules;

INSERT INTO api_access_rules (http_method, path_pattern, role_name, permission) VALUES
    (NULL, '/api/auth/me',                  'ADMIN',          NULL),
    (NULL, '/api/auth/me',                  'EXPORT_MANAGER', NULL),
    (NULL, '/api/auth/me',                  'CLIENT',         NULL),

    (NULL, '/api/admin/**',                 'ADMIN',          NULL),

    (NULL, '/api/export-manager/**',        'EXPORT_MANAGER', NULL),

    (NULL, '/api/client/**',                'CLIENT',         NULL),
    (NULL, '/api/client/shipments/**',      'CLIENT',         'VIEW_SHIPMENTS');

COMMIT;
