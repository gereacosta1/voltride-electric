import React, { createContext, useContext, useMemo } from "react";

type I18n = {
  t: (k: string) => string;
  fmtMoney: (n: number) => string;
};

const Ctx = createContext<I18n | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useMemo<I18n>(() => {
    const t = (k: string) => {
      const map: Record<string, string> = {
        "cart.title": "Cart",
        "cart.total": "Total",
        "cart.empty": "Your cart is empty",
        "cart.clear": "Clear",
        "cart.remove": "Remove",
        "cart.plus": "Increase",
        "cart.minus": "Decrease",
        "cart.payWithAffirm": "Pay with Affirm",
        "modal.close": "Close",
      };
      return map[k] || k;
    };

    const fmtMoney = (n: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n) || 0);

    return { t, fmtMoney };
  }, []);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useI18n = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used within I18nProvider");
  return v;
};
