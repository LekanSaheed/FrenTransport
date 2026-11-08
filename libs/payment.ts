import { api } from "./api";

/**
 * Starts a Paystack checkout and leaves the page. The booking is only marked
 * paid after the backend verifies the transaction (on /payment/callback and
 * via webhook), never because the browser came back.
 */
export async function startPayment(reference: string, email: string): Promise<never> {
  const { authorizationUrl } = await api.initializePayment(reference, email);
  window.location.assign(authorizationUrl);
  // Keep callers in their loading state while the browser navigates away.
  return new Promise<never>(() => {});
}
