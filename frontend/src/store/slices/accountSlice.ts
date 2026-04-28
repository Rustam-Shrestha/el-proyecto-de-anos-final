// @ts-nocheck
/**
 * Redux Slice: Account State Management
 * 
 * Manages:
 * - Selected account/client details (replaces Context API)
 * - Account dashboard data
 * - Budget filters (pagination, search)
 * - Modal states (replaces useModal Context)
 * 
 * This centralized state eliminates:
 * - Prop drilling of account data
 * - Multiple Context API instances
 * - Scattered state management logic
 */

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Selected account/client information
  selectedAccount: {
    id: null,
    name: null,
  },
  
  // Account summary data (cached after first fetch)
  accountSummary: {
    data: null,
    lastFetchedId: null,
  },

  // Modal states (replaces useModal Context)
  modals: {
    isClientSelectorOpen: false,
    isBudgetEditorOpen: false,
    isReportViewerOpen: false,
  },

  // Budget list filters
  budgetFilters: {
    searchItem: {},
    currentPage: 1,
    pageSize: 10,
  },

  // Refetch trigger (for TanStack Query key inclusion)
  refetchTrigger: false,
};

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    /**
     * Set the currently selected account/client
     * Called when user selects a client from AddClient modal
     */
    setSelectedAccount: (state, action) => {
      state.selectedAccount = {
        id: action.payload.id,
        name: action.payload.name,
      };
    },

    /**
     * Cache account summary data
     * Prevents unnecessary refetches if we already have the data
     */
    setCachedAccountSummary: (state, action) => {
      state.accountSummary.data = action.payload.data;
      state.accountSummary.lastFetchedId = action.payload.id;
    },

    /**
     * Open/close client selector modal
     */
    toggleClientSelectorModal: (state, action) => {
      state.modals.isClientSelectorOpen = action.payload;
    },

    /**
     * Open/close budget editor modal
     */
    toggleBudgetEditorModal: (state, action) => {
      state.modals.isBudgetEditorOpen = action.payload;
    },

    /**
     * Open/close report viewer modal
     */
    toggleReportViewerModal: (state, action) => {
      state.modals.isReportViewerOpen = action.payload;
    },

    /**
     * Update budget list filters (search, pagination)
     * Trigger refetch by including budgetFilters in query key
     */
    setBudgetFilters: (state, action) => {
      state.budgetFilters = {
        ...state.budgetFilters,
        ...action.payload,
      };
    },

    /**
     * Reset pagination to page 1
     * Used when search term changes
     */
    resetBudgetPagination: (state) => {
      state.budgetFilters.currentPage = 1;
    },

    /**
     * Manual refetch trigger
     * Toggle this boolean to force TanStack Query to refetch
     * (because boolean is included in query key)
     */
    triggerAccountRefetch: (state) => {
      state.refetchTrigger = !state.refetchTrigger;
    },

    /**
     * Reset entire account state when logging out or switching accounts
     */
    resetAccountState: () => initialState,
  },
});

export const {
  setSelectedAccount,
  setCachedAccountSummary,
  toggleClientSelectorModal,
  toggleBudgetEditorModal,
  toggleReportViewerModal,
  setBudgetFilters,
  resetBudgetPagination,
  triggerAccountRefetch,
  resetAccountState,
} = accountSlice.actions;

export default accountSlice.reducer;
