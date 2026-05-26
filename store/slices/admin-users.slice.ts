import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type Role = "USER" | "ADMIN";

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  image: string | null;
  role: Role;
  termsAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ordersCount: number;
  liveOrdersCount: number;
  totalSpend: number;
  lastOrderAt: string | null;
};

type AdminUsersState = {
  items: AdminUserRow[];
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
};

const initialState: AdminUsersState = {
  items: [],
  isHydrated: false,
  isLoading: false,
  error: null,
};

const adminUsersSlice = createSlice({
  name: "adminUsers",
  initialState,
  reducers: {
    setAdminUsers(state, action: PayloadAction<AdminUserRow[]>) {
      state.items = action.payload;
      state.isHydrated = true;
      state.error = null;
    },
    patchAdminUser(
      state,
      action: PayloadAction<{ id: string; changes: Partial<AdminUserRow> }>,
    ) {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id,
      );
      if (index >= 0) {
        state.items[index] = { ...state.items[index], ...action.payload.changes };
      }
    },
    setAdminUsersLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setAdminUsersError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setAdminUsers,
  patchAdminUser,
  setAdminUsersLoading,
  setAdminUsersError,
} = adminUsersSlice.actions;

export default adminUsersSlice.reducer;
