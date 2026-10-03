import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import validator from "validator";
import jwt from "jsonwebtoken";

import {
  PROFILE_LIMITS,
  ProfileError,
  applyDefaultRule,
  assertEmailAvailable,
  findAddressOrThrow,
  normalizeEmail,
  sanitizeAddressInput,
  sanitizeEmail,
  sanitizeName,
  sanitizePhone,
  toPublicAddress,
  toPublicUser,
  validateNewPassword,
} from "../services/profileService.js";


// Create user token
const createToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET
  );
};


// Route for user login
const loginUser = async (req, res) => {
  try {

    const { email, password } = req.body;

    // Emails are stored normalized (trimmed and
    // lowercased). The case-insensitive fallback
    // keeps any legacy row that predates that rule
    // reachable instead of locking its owner out.
    const user =
      await userModel.findOne({
        email: normalizeEmail(email),
      }) ||
      await userModel.findOne({
        email: new RegExp(
          `^${String(email).trim().replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}$`,
          "i"
        ),
      });

    if (!user) {
      return res.json({
        success: false,
        message: "User doesn't exist"
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (isMatch) {

      const token = createToken(user._id);

      return res.json({
        success: true,
        token
      });

    } else {

      return res.json({
        success: false,
        message: "Invalid credentials"
      });

    }

  } catch (error) {

    console.log(error);

    return res.json({
      success: false,
      message: error.message
    });

  }
};


// Route for user register
const registerUser = async (req, res) => {
  try {

    const {
      name,
      email,
      password,
    } = req.body;

    const normalizedEmail =
      normalizeEmail(email);

    // Checking if user already exists
    const exists = await userModel.findOne({
      email: normalizedEmail,
    });

    if (exists) {
      return res.json({
        success: false,
        message: "User already exists"
      });
    }

    // Validate email format
    if (!validator.isEmail(normalizedEmail)) {
      return res.json({
        success: false,
        message: "Please enter a valid email"
      });
    }

    // Validate password
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter strong password"
      });
    }

    // Hashing user password
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(
      password,
      salt
    );

    const newUser = new userModel({
      name,
      email: normalizedEmail,
      password: hashedPassword
    });

    const user = await newUser.save();

    const token = createToken(user._id);

    return res.json({
      success: true,
      token
    });

  } catch (error) {

    console.log(error);

    return res.json({
      success: false,
      message: error.message
    });

  }
};


// Route for admin login
const adminLogin = async (req, res) => {
  try {

    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {

      const token = jwt.sign(
        email + password,
        process.env.JWT_SECRET
      );

      // Test the token immediately
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      console.log("ADMIN TOKEN CREATED:", token);
      console.log("IMMEDIATE VERIFY:", decoded);
      console.log(
        "JWT SECRET LENGTH:",
        process.env.JWT_SECRET.length
      );

      return res.json({
        success: true,
        token
      });

    } else {

      return res.json({
        success: false,
        message: "Invalid credentials"
      });

    }

  } catch (error) {

    console.log("ADMIN LOGIN ERROR:", error);

    return res.json({
      success: false,
      message: error.message
    });

  }
};


// =========================================
// PROFILE
// =========================================
// Every handler below resolves the caller from
// `req.userId`, which authUser derives from the
// verified JWT. No handler ever accepts a userId,
// _id or any other identifier from the request
// body, path or query, so one customer can never
// address another customer's data.
// =========================================


// Route for reading the logged-in customer
const getUserProfile = async (
  req,
  res
) => {
  try {
    const user =
      await userModel
        .findById(req.userId)
        .select("name email phone createdAt")
        .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error(
      "Get profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Route for updating the logged-in customer
const updateUserProfile = async (
  req,
  res
) => {
  try {
    const user = await userModel
      .findById(req.userId)
      .select("name email phone");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =================================
    // ALLOWLIST
    // =================================
    // Only `name`, `email` and `phone` are ever
    // read. `req.body` is NEVER spread into the
    // document, so isAdmin / role / cartData /
    // password / _id and friends are ignored
    // even if sent.
    // =================================

    const updates = {};

    if (
      req.body.name !== undefined
    ) {
      updates.name =
        sanitizeName(req.body.name);
    }

    if (
      req.body.email !== undefined
    ) {
      const email =
        sanitizeEmail(req.body.email);

      if (email !== user.email) {
        await assertEmailAvailable(
          email,
          user._id
        );
      }

      updates.email = email;
    }

    if (
      req.body.phone !== undefined
    ) {
      updates.phone =
        sanitizePhone(req.body.phone);
    }

    if (
      Object.keys(updates).length === 0
    ) {
      return res.json({
        success: true,
        message: "Nothing to update",
        user: toPublicUser(user),
      });
    }

    user.set(updates);

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated",
      user: toPublicUser(user),
    });
  } catch (error) {
    if (
      error instanceof ProfileError
    ) {
      return res.status(
        error.statusCode
      ).json({
        success: false,
        message: error.message,
      });
    }

    console.error(
      "Update profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Route for changing the password.
// Isolated on purpose: `PUT /profile` can never
// reach the password field.
const changeUserPassword = async (
  req,
  res
) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body || {};

    const user =
      await userModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Current password is required",
      });
    }

    const isMatch =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message:
          "Current password is incorrect",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New passwords do not match",
      });
    }

    validateNewPassword(newPassword);

    const salt =
      await bcrypt.genSalt(10);

    user.password =
      await bcrypt.hash(
        newPassword,
        salt
      );

    await user.save();

    // The hash is never echoed back.
    return res.json({
      success: true,
      message: "Password changed",
    });
  } catch (error) {
    if (
      error instanceof ProfileError
    ) {
      return res.status(
        error.statusCode
      ).json({
        success: false,
        message: error.message,
      });
    }

    console.error(
      "Change password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =========================================
// SAVED ADDRESSES
// =========================================


const getUserAddresses = async (
  req,
  res
) => {
  try {
    const user =
      await userModel
        .findById(req.userId)
        .select("addresses")
        .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const addresses = (
      user.addresses || []
    ).map(toPublicAddress);

    // Default first, then newest first.
    addresses.sort((a, b) => {
      if (
        a.isDefault !== b.isDefault
      ) {
        return a.isDefault ? -1 : 1;
      }

      return 0;
    });

    return res.json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.error(
      "Get addresses error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const addUserAddress = async (
  req,
  res
) => {
  try {
    const user =
      await userModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const current = user.addresses || [];

    if (
      current.length >=
      PROFILE_LIMITS.maxAddresses
    ) {
      return res.status(400).json({
        success: false,
        message:
          `You can save up to ${PROFILE_LIMITS.maxAddresses} addresses`,
      });
    }

    const clean =
      sanitizeAddressInput(
        req.body || {}
      );

    const isFirst =
      current.length === 0;

    // Build the new subdocument through the
    // schema so `_id` and defaults are correct.
    user.addresses.push({
      ...clean,
      isDefault:
        isFirst ||
        Boolean(req.body?.isDefault),
    });

    // The new address is last before the default
    // flags are resolved.
    const newId = String(
      user.addresses[
        user.addresses.length - 1
      ]._id
    );

    user.addresses = applyDefaultRule(
      user.addresses.map(
        (address) =>
          address.toObject()
      ),
      {
        isFirstAddress: isFirst,
        incomingIsDefault:
          Boolean(req.body?.isDefault),
        incomingId: newId,
      }
    );

    await user.save();

    const saved = (
      user.addresses || []
    ).map(toPublicAddress);

    return res.json({
      success: true,
      message: "Address saved",
      address: saved.find(
        (address) =>
          address._id === newId
      ),
      addresses: saved,
    });
  } catch (error) {
    if (
      error instanceof ProfileError
    ) {
      return res.status(
        error.statusCode
      ).json({
        success: false,
        message: error.message,
      });
    }

    console.error(
      "Add address error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const updateUserAddress = async (
  req,
  res
) => {
  try {
    const {
      addressId,
    } = req.params;

    await findAddressOrThrow(
      req.userId,
      addressId
    );

    const clean =
      sanitizeAddressInput(
        req.body || {},
        { partial: true }
      );

    const user =
      await userModel.findById(req.userId);

    const index =
      user.addresses.findIndex(
        (address) =>
          String(address._id) ===
          String(addressId)
      );

    if (index === -1) {
      throw new ProfileError(
        "Address not found",
        404
      );
    }

    // Merge only validated fields onto the
    // existing subdocument.
    user.addresses[index].set(clean);

    // `isDefault` is resolved separately from the
    // validated text fields. When it is promoted,
    // applyDefaultRule clears the flag on every
    // OTHER address in the same write.
    const wantsDefault =
      Boolean(req.body?.isDefault);

    user.addresses =
      applyDefaultRule(
        user.addresses.map(
          (address) =>
            address.toObject()
        ),
        {
          incomingIsDefault:
            wantsDefault,
          incomingId: wantsDefault
            ? String(addressId)
            : undefined,
        }
      );

    await user.save();

    const saved = (
      user.addresses || []
    ).map(toPublicAddress);

    return res.json({
      success: true,
      message: "Address updated",
      address: saved.find(
        (address) =>
          address._id ===
          String(addressId)
      ),
      addresses: saved,
    });
  } catch (error) {
    if (
      error instanceof ProfileError
    ) {
      return res.status(
        error.statusCode
      ).json({
        success: false,
        message: error.message,
      });
    }

    console.error(
      "Update address error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const deleteUserAddress = async (
  req,
  res
) => {
  try {
    const {
      addressId,
    } = req.params;

    await findAddressOrThrow(
      req.userId,
      addressId
    );

    const user =
      await userModel.findById(req.userId);

    user.addresses =
      user.addresses.filter(
        (address) =>
          String(address._id) !==
          String(addressId)
      );

    // If the deleted address was the default,
    // another one is promoted automatically.
    user.addresses =
      applyDefaultRule(
        user.addresses.map(
          (address) =>
            address.toObject()
        ),
        { deletedId: addressId }
      );

    await user.save();

    return res.json({
      success: true,
      message: "Address deleted",
      addresses: (
        user.addresses || []
      ).map(toPublicAddress),
    });
  } catch (error) {
    if (
      error instanceof ProfileError
    ) {
      return res.status(
        error.statusCode
      ).json({
        success: false,
        message: error.message,
      });
    }

    console.error(
      "Delete address error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export {
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
};