import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getBoqProjects, getApprovedBoqList, getApprovedBoqDetails } from "../../../services";

// ---------------------- Fetch Projects ----------------------
export const fetchBoqProjects = createAsyncThunk(
  "boq/fetchProjects",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getBoqProjects();
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error fetching BOQ projects");
    }
  }
);

// ---------------------- Fetch Approved BOQ List ----------------------
export const fetchApprovedBoqList = createAsyncThunk(
  "boq/fetchApprovedBoqList",
  async (projectId, { rejectWithValue }) => {
    try {
      const data = await getApprovedBoqList(projectId);
      return data; // Backend returns SINGLE OBJECT
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || "Error fetching approved BOQ list");
    }
  }
);

// ---------------------- Fetch Approved BOQ Details ----------------------
export const fetchApprovedBoqDetails = createAsyncThunk(
  "boq/fetchApprovedBoqDetails",
  async (boqId, { rejectWithValue }) => {
    try {
      const data = await getApprovedBoqDetails(boqId);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || "Error fetching approved BOQ details");
    }
  }
);

// ---------------------- Slice ----------------------
const aqsBoqSlice = createSlice({
  name: "aqsBoq",
  initialState: {
    projects: [],
    approvedBoqList: [],      // ALWAYS array
    approvedBoqDetails: [],

    loading: false,
    boqListLoading: false,
    boqDetailsLoading: false,

    error: null,
    boqListError: null,
    boqDetailsError: null,
  },

  // ⭐ NEW REDUCER HERE ⭐
  reducers: {
    setApprovedBoqList(state, action) {
      state.approvedBoqList = action.payload;
    }
  },

  extraReducers: (builder) => {
    builder

      // ---------------- Projects ----------------
      .addCase(fetchBoqProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBoqProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchBoqProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ---------------- BOQ List ----------------
      .addCase(fetchApprovedBoqList.pending, (state) => {
        state.boqListLoading = true;
        state.boqListError = null;
      })
      .addCase(fetchApprovedBoqList.fulfilled, (state, action) => {
        state.boqListLoading = false;

        // FIX: backend returns a single object → convert to array
        state.approvedBoqList = Array.isArray(action.payload)
          ? action.payload
          : [action.payload];
      })
      .addCase(fetchApprovedBoqList.rejected, (state, action) => {
        state.boqListLoading = false;
        state.boqListError = action.payload;
      })

      // ---------------- BOQ Details ----------------
      .addCase(fetchApprovedBoqDetails.pending, (state) => {
        state.boqDetailsLoading = true;
        state.boqDetailsError = null;
      })
      .addCase(fetchApprovedBoqDetails.fulfilled, (state, action) => {
        state.boqDetailsLoading = false;
        state.approvedBoqDetails = action.payload;
      })
      .addCase(fetchApprovedBoqDetails.rejected, (state, action) => {
        state.boqDetailsLoading = false;
        state.boqDetailsError = action.payload;
      });
  },
});

export const { setApprovedBoqList } = aqsBoqSlice.actions;  

export default aqsBoqSlice.reducer;
