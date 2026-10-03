import express from 'express';

import {
  loginUser,
  registerUser,
  adminLogin,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress
} from '../controller/userController.js';

import authUser from '../middleware/auth.js';

const userRouter = express.Router();

// =========================
// PUBLIC (UNAUTHENTICATED)
// =========================

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/admin', adminLogin);

// =========================
// PROFILE (AUTHENTICATED)
// =========================
// Every route below runs behind authUser, which
// verifies the JWT from the `token` header and
// sets `req.userId`. The controller always uses
// that id and never a userId from the request,
// so these endpoints cannot address another
// account.

userRouter.get('/profile', authUser, getUserProfile);
userRouter.put('/profile', authUser, updateUserProfile);

// Password changes are intentionally a separate
// endpoint so PUT /profile can never touch the
// password field.
userRouter.put('/change-password', authUser, changeUserPassword);

// Saved addresses live on the user's own
// document, scoped by req.userId.
userRouter.get('/addresses', authUser, getUserAddresses);
userRouter.post('/addresses', authUser, addUserAddress);
userRouter.put('/addresses/:addressId', authUser, updateUserAddress);
userRouter.delete('/addresses/:addressId', authUser, deleteUserAddress);

export default userRouter;