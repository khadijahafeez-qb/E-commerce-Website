import { createSlice } from '@reduxjs/toolkit';
import type { User } from '@prisma/client';
import { SignupData } from '@/lib/validation/auth';
import { createAsyncThunk } from '@reduxjs/toolkit';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};
export const signupThunk = createAsyncThunk<
  { user: User },
  SignupData,
  { rejectValue: string }
>('auth/signup', async (data, { rejectWithValue }) => {
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      return rejectWithValue(result.error || 'Signup failed');
    }
    return result as { user: User };
  } catch {
    return rejectWithValue('Network error');
  }
});
export const resetPasswordThunk = createAsyncThunk<
  { message: string },
  { email: string; token: string; password: string },
  { rejectValue: string }
>('auth/resetPassword', async (data, { rejectWithValue }) => {
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      return rejectWithValue(result.error || result.message || 'Password reset failed');
    }
    return result as { message: string };
  } catch {
    return rejectWithValue('Network error');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(signupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(signupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Signup failed';
      })
      // ✅ handle reset password
      .addCase(resetPasswordThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPasswordThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetPasswordThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Password reset failed';
      });
  },
});

export default authSlice.reducer;
