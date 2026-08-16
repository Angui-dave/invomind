/**
 * Data source switch.
 * - true (default): in-memory mocks — no Postgres required
 * - false: reserved for a future Laravel HTTP client (see docs/LARAVEL.md)
 */
export function useMockData(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";
}

export const MOCK_ORG_ID = "org_demo_atelier_diallo";
export const MOCK_USER_ID = "usr_1";
export const MOCK_SESSION_ID = "sess_mock_1";
