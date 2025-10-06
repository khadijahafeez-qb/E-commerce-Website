// lib/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { 
  persistStore, persistReducer,
         FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage for web
import cartReducer from './features/cart/cartSlice';
import ordersReducer from './features/cart/orderslice';
import  OrderDetailReducer  from './features/cart/orderdetailslice';
import { combineReducers } from 'redux';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['cart'], 
};

const rootReducer = combineReducers({
  cart: cartReducer,
  orders: ordersReducer,
  orderDetail:OrderDetailReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// export const store = configureStore({
//   reducer: persistedReducer,
// });
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
