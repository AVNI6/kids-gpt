import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@supabase/supabase-js";
import { UserProfile, UserRole } from "@/types/user";
import { createClient } from "@/lib/supabase/client";

export interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isInitializing: boolean;
}

const initialState: AuthState = {
  user: null,
  userProfile: null,
  userRole: null,
  isLoading: true,
  isInitializing: true,
};

/**
 * Async Thunk to fetch user profile data from Supabase
 */
export const fetchProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (userId: string, { rejectWithValue }) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profile")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        throw error;
      }
      return data as UserProfile | null;
    } catch (err) {
      console.error("Redux Auth Slice: Error fetching profile:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch profile";
      return rejectWithValue(errorMessage);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSessionUser: (state, action: PayloadAction<User | null>) => {
      const user = action.payload;
      state.user = user;
      if (!user) {
        state.userProfile = null;
        state.userRole = null;
        state.isLoading = false;
        state.isInitializing = false;
      }
    },
    setProfileData: (state, action: PayloadAction<UserProfile | null>) => {
      const profile = action.payload;
      state.userProfile = profile;
      state.userRole = (profile?.role as UserRole) || null;
    },
    setLoadingState: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setInitializingState: (state, action: PayloadAction<boolean>) => {
      state.isInitializing = action.payload;
    },
    clearAuthState: (state) => {
      state.user = null;
      state.userProfile = null;
      state.userRole = null;
      state.isLoading = false;
      state.isInitializing = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        const profile = action.payload;
        state.userProfile = profile;
        state.userRole = (profile?.role as UserRole) || null;
        state.isLoading = false;
        state.isInitializing = false;
      })
      .addCase(fetchProfile.rejected, (state) => {
        state.userProfile = null;
        state.userRole = null;
        state.isLoading = false;
        state.isInitializing = false;
      });
  },
});

export const {
  setSessionUser,
  setProfileData,
  setLoadingState,
  setInitializingState,
  clearAuthState,
} = authSlice.actions;

export default authSlice.reducer;
