import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type PromoCodeStatus = "ACTIVE" | "INACTIVE";
type PromoDiscountType = "FLAT" | "PERCENT";

type StoreSettings = {
  id: string;
  taxRate: number;
  standardShippingFee: number;
  expressShippingFee: number;
  freeShippingThreshold: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

type PromoCodeRow = {
  id: string;
  code: string;
  description: string | null;
  discountType: PromoDiscountType;
  value: number;
  minOrder: number | null;
  maxDiscount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  status: PromoCodeStatus;
  createdAt: string;
  updatedAt: string;
};

type AdminSettingsState = {
  settings: StoreSettings | null;
  promos: PromoCodeRow[];
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
};

const initialState: AdminSettingsState = {
  settings: null,
  promos: [],
  isHydrated: false,
  isLoading: false,
  error: null,
};

const adminSettingsSlice = createSlice({
  name: "adminSettings",
  initialState,
  reducers: {
    setAdminSettings(
      state,
      action: PayloadAction<{ settings: StoreSettings; promos: PromoCodeRow[] }>,
    ) {
      state.settings = action.payload.settings;
      state.promos = action.payload.promos;
      state.isHydrated = true;
      state.error = null;
    },
    setStoreSettings(state, action: PayloadAction<StoreSettings>) {
      state.settings = action.payload;
    },
    upsertPromoCode(state, action: PayloadAction<PromoCodeRow>) {
      const index = state.promos.findIndex(
        (item) => item.id === action.payload.id,
      );
      if (index >= 0) {
        state.promos[index] = action.payload;
      } else {
        state.promos.unshift(action.payload);
      }
    },
    removePromoCode(state, action: PayloadAction<string>) {
      state.promos = state.promos.filter((item) => item.id !== action.payload);
    },
    setAdminSettingsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setAdminSettingsError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setAdminSettings,
  setStoreSettings,
  upsertPromoCode,
  removePromoCode,
  setAdminSettingsLoading,
  setAdminSettingsError,
} = adminSettingsSlice.actions;

export default adminSettingsSlice.reducer;
