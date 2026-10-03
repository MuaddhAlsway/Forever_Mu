import mongoose from "mongoose";


// =========================================
// SAVED SHIPPING ADDRESS
// =========================================
// This is the CUSTOMER'S OWN address book. It
// is deliberately separate from the shipping
// address snapshot stored on an order.
//
// An order copies the address it was shipped to
// and never keeps a reference here, so editing
// or deleting a saved address can never rewrite
// where a past order was sent.
//
// Field names mirror the checkout address used
// by orderTotalsService so a saved address can
// be copied straight into checkout.
// =========================================

const addressSchema = new mongoose.Schema(
  {
    // "Home" | "Work" | "Other" | any custom
    // label the customer chooses.
    label: {
      type: String,
      trim: true,
      default: "Home",
    },

    firstName: {
      type: String,
      trim: true,
      default: "",
    },

    lastName: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    street: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    zipcode: {
      type: String,
      trim: true,
      default: "",
    },

    country: {
      type: String,
      trim: true,
      default: "",
    },

    // Exactly one saved address may hold this.
    // Enforced in profileService, not here, so
    // the whole array is written in one update.
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Each address needs its own id for the
    // update/delete endpoints.
    _id: true,
  }
);


const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    cartData: {type: Object, default: {}},

    // =====================================
    // PROFILE
    // =====================================
    // Optional and backward compatible. Existing
    // users simply do not have these fields yet;
    // the defaults below materialise on read and
    // the next save. No migration is required and
    // `name` is intentionally NOT split into
    // firstName/lastName.
    // =====================================

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    // The customer's own address book.
    addresses: {
      type: [addressSchema],
      default: [],
    }

},{minimize: false})

const userModel = mongoose.models.user || mongoose.model('user', userSchema)

export default userModel