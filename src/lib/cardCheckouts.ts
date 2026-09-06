// src/lib/cardCheckouts.ts

import type { CartItem } from "../context/CartContext";

const API_URL = "/api/card-checkout";
const REQUEST_TIMEOUT_MS = 20_000;

type CardCheckoutResponse = {
  url?: unknown;
  error?: unknown;
  message?: unknown;
};

function isNonEmptyString(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function parseJsonResponse(
  rawText: string
): CardCheckoutResponse {
  if (!rawText.trim()) {
    return {};
  }

  try {
    const parsed: unknown =
      JSON.parse(rawText);

    if (!isRecord(parsed)) {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

function getServerErrorMessage(
  data: CardCheckoutResponse
) {
  if (isNonEmptyString(data.error)) {
    return data.error.trim();
  }

  if (isNonEmptyString(data.message)) {
    return data.message.trim();
  }

  return "";
}

function getValidCheckoutUrl(
  value: unknown
): string | null {
  if (!isNonEmptyString(value)) {
    return null;
  }

  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

function isAbortError(error: unknown) {
  if (
    typeof DOMException !== "undefined" &&
    error instanceof DOMException
  ) {
    return error.name === "AbortError";
  }

  if (
    isRecord(error) &&
    error.name === "AbortError"
  ) {
    return true;
  }

  return false;
}

export async function startCardCheckout(
  items: CartItem[]
): Promise<void> {
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw new Error(
      "The shopping cart is empty."
    );
  }

  if (typeof window === "undefined") {
    throw new Error(
      "Card checkout is only available in the browser."
    );
  }

  const origin =
    window.location.origin;

  const controller =
    new AbortController();

  const timeoutId =
    window.setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      API_URL,
      {
        method: "POST",

        headers: {
          "content-type":
            "application/json",
          accept: "application/json",
        },

        body: JSON.stringify({
          items,
          origin,
        }),

        signal:
          controller.signal,
      }
    );

    const rawText =
      await response.text();

    const data =
      parseJsonResponse(rawText);

    if (!response.ok) {
      const serverMessage =
        getServerErrorMessage(
          data
        );

      throw new Error(
        serverMessage ||
          "The card payment could not be initiated."
      );
    }

    const redirectUrl =
      getValidCheckoutUrl(
        data.url
      );

    if (!redirectUrl) {
      throw new Error(
        "Stripe response did not include a valid checkout URL."
      );
    }

    window.location.href =
      redirectUrl;
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw new Error(
        "The card checkout request timed out. Please try again."
      );
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "The card checkout could not be initiated."
    );
  } finally {
    window.clearTimeout(
      timeoutId
    );
  }
}