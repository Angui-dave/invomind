-- Invomind multi-tenant Postgres bootstrap
-- Runs as superuser during first container init against POSTGRES_DB=invomind.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'invomind_owner') THEN
    CREATE ROLE invomind_owner LOGIN PASSWORD 'invomind_owner' BYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'invomind_app') THEN
    CREATE ROLE invomind_app LOGIN PASSWORD 'invomind_app' NOSUPERUSER NOBYPASSRLS;
  END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE invomind TO invomind_owner;
GRANT CONNECT ON DATABASE invomind TO invomind_app;

GRANT ALL ON SCHEMA public TO invomind_owner;
GRANT USAGE ON SCHEMA public TO invomind_app;

-- Owner creates tables during migrations; app role needs DML afterwards.
ALTER DEFAULT PRIVILEGES FOR ROLE invomind_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO invomind_app;
ALTER DEFAULT PRIVILEGES FOR ROLE invomind_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO invomind_app;
ALTER DEFAULT PRIVILEGES FOR ROLE invomind_owner IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO invomind_app;
