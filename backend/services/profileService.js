import mongoose from "mongoose";

import validator from "validator";

import userModel from "../models/userModel.js";


// =========================================
// LIMITS
// =========================================

export const PROFILE_LIMITS = {
  nameMax: 80,
  phoneMax: 32,
  addressLabelMax: 40,
  addressTextMax: 120,
  maxAddresses: 20,
};


// Password rules are intentionally identical to
// registration (see userController.registerUser)
// so a customer can never end up with an account
// that is weaker than one they could create.
const PASSWORD_MIN_LENGTH = 8;


// Mirrors orderTotalsService: a saved address must
// be complete enough to be shipped with. `state`
// and `zipcode` stay optional because not every
// country uses them.
const requiredAddressFields = [
  "firstName",
  "lastName",
  "email",
  "street",
  "city",
  "country",
  "phone",
];


// International formats: digits, spaces, dashes,
// brackets and a leading +. No country-specific
// assumptions, because the store serves US and
// international customers alike.
const phonePattern = /^\+?[0-9()\-\s.]{5,32}$/;


// Only letters, digits and the punctuation that
// genuinely appears in real names.
const namePattern = /^[\p{L}\p{M}0-9][\p{L}\p{M}0-9 '\-.,]*$/u;


// =========================================
// ERRORS
// =========================================

export class ProfileError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "ProfileError";
    this.statusCode = statusCode;
  }
}


// =========================================
// NORMALIZATION
// =========================================

export const normalizeEmail = (
  value
) => {
  return String(value ?? "")
    .trim()
    .toLowerCase();
};

const cleanText = (
  value,
  max
) => {
  return String(value ?? "")
    .trim()
    .replace(
      /\s+/g,
      " "
    )
    .slice(0, max);
};


// =========================================
// SAFE PROJECTION
// =========================================
// The only shape ever sent to the customer.
// `password` and every internal field are
// excluded here rather than at each call site, so
// a new endpoint cannot leak them by accident.
// =========================================

export const toPublicUser = (
  user
) => {
  if (!user) {
    return null;
  }

  return {
    _id: user._id,
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    createdAt: user.createdAt,
  };
};


export const toPublicAddress = (
  address
) => {
  if (!address) {
    return null;
  }

  return {
    _id: String(address._id),
    label: address.label || "Home",
    firstName: address.firstName || "",
    lastName: address.lastName || "",
    email: address.email || "",
    phone: address.phone || "",
    street: address.street || "",
    city: address.city || "",
    state: address.state || "",
    zipcode: address.zipcode || "",
    country: address.country || "",
    isDefault: Boolean(address.isDefault),
  };
};


// =========================================
// EMAIL UNIQUENESS
// =========================================

/**
 * Rejects an email already held by another
 * account. `currentUserId` is exempt so a
 * customer may re-save their own address book
 * without being blocked by their own row.
 */
export const assertEmailAvailable = async (
  email,
  currentUserId
) => {
  const owner = await userModel
    .findOne({ email })
    .select("_id")
    .lean();

  if (
    owner &&
    String(owner._id) !== String(currentUserId)
  ) {
    throw new ProfileError(
      "Email is already in use",
      409
    );
  }
};


// =========================================
// PROFILE FIELD VALIDATION
// =========================================
// Only the fields named here may ever be
// written. Nothing else from req.body is read,
// let alone spread into the user document.
// =========================================

export const sanitizeName = (
  value
) => {
  const name = cleanText(
    value,
    PROFILE_LIMITS.nameMax
  );

  if (!name) {
    throw new ProfileError(
      "Name is required"
    );
  }

  if (!namePattern.test(name)) {
    throw new ProfileError(
      "Name contains invalid characters"
    );
  }

  return name;
};


export const sanitizePhone = (
  value
) => {
  // An empty phone is allowed: the field is
  // optional and the store is international, so
  // requiring a specific national format would be
  // wrong.
  const phone = String(value ?? "")
    .trim()
    .replace(
      /\s+/g,
      " "
    );

  if (!phone) {
    return "";
  }

  if (phone.length > PROFILE_LIMITS.phoneMax) {
    throw new ProfileError(
      "Phone number is too long"
    );
  }

  if (!phonePattern.test(phone)) {
    throw new ProfileError(
      "Please enter a valid phone number"
    );
  }

  return phone;
};


export const sanitizeEmail = (
  value
) => {
  const email = normalizeEmail(value);

  if (!email) {
    throw new ProfileError(
      "Email is required"
    );
  }

  if (!validator.isEmail(email)) {
    throw new ProfileError(
      "Please enter a valid email"
    );
  }

  return email;
};


export const validateNewPassword = (
  password
) => {
  const value = String(password ?? "");

  if (!value) {
    throw new ProfileError(
      "New password is required"
    );
  }

  if (value.length < PASSWORD_MIN_LENGTH) {
    throw new ProfileError(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
    );
  }

  return value;
};


// =========================================
// ADDRESS VALIDATION
// =========================================

const ADDRESS_TEXT_FIELDS = [
  "firstName",
  "lastName",
  "street",
  "city",
  "state",
  "zipcode",
  "country",
];


export const sanitizeAddressInput = (
  body = {},
  { partial = false } = {}
) => {
  const out = {};

  // ---- label ----
  // Home / Work / Other are offered, but a
  // customer may type their own ("Parents",
  // "Office").
  if (
    body.label !== undefined ||
    !partial
  ) {
    const label = cleanText(
      body.label ?? "Home",
      PROFILE_LIMITS.addressLabelMax
    );

    out.label = label || "Home";
  }

  for (const field of ADDRESS_TEXT_FIELDS) {
    if (
      body[field] !== undefined ||
      !partial
    ) {
      out[field] = cleanText(
        body[field],
        PROFILE_LIMITS.addressTextMax
      );
    }
  }

  // ---- email ----
  if (
    body.email !== undefined ||
    !partial
  ) {
    const email = normalizeEmail(
      body.email
    );

    if (!partial && !email) {
      throw new ProfileError(
        "Address email is required"
      );
    }

    if (
      email &&
      !validator.isEmail(email)
    ) {
      throw new ProfileError(
        "Please enter a valid email"
      );
    }

    out.email = email;
  }

  // ---- phone ----
  if (
    body.phone !== undefined ||
    !partial
  ) {
    out.phone = sanitizePhone(
      body.phone
    );
  }

  // ---- required fields ----
  // On create, everything checkout requires must
  // be present. On update, only validate what
  // the caller actually sent, so editing a
  // single field cannot fail because of an
  // untouched optional one.
  const fieldsToCheck = partial
    ? Object.keys(out)
    : requiredAddressFields;

  for (const field of fieldsToCheck) {
    if (
      !requiredAddressFields.includes(
        field
      )
    ) {
      continue;
    }

    if (
      !out[field] ||
      String(out[field]).trim()
        .length === 0
    ) {
      throw new ProfileError(
        `Address field '${field}' is required`
      );
    }
  }

  return out;
};


// =========================================
// DEFAULT ADDRESS RULE
// =========================================
// Exactly one saved address may be the default.
// When a new default is chosen every other
// address is cleared in the SAME write, so the
// collection can never briefly hold two defaults.
// =========================================

export const applyDefaultRule = (
  addresses,
  {
    incomingIsDefault,
    incomingId,
    isFirstAddress,
    deletedId,
  } = {}
) => {
  const list = addresses.map(
    (address) => ({
      ...address,
      isDefault: Boolean(
        address.isDefault
      ),
    })
  );

  if (list.length === 0) {
    return list;
  }

  // ---- deleting the current default ----
  // Promote the first remaining address so the
  // customer is never left without a default.
  if (deletedId) {
    const stillDefault = list.some(
      (address) =>
        String(address._id) !==
          String(deletedId) &&
        address.isDefault
    );

    if (!stillDefault) {
      list[0].isDefault = true;
    }

    return list;
  }

  // ---- first address ever saved ----
  if (isFirstAddress) {
    list.forEach(
      (address, index) => {
        address.isDefault = index === 0;
      }
    );

    return list;
  }

  // ---- an address was explicitly promoted ----
  // The caller identifies WHICH address by id, so
  // the flag is cleared everywhere else and left
  // set only on that one. Without the id this would
  // clear the very address being promoted.
  if (incomingIsDefault && incomingId) {
    list.forEach((address) => {
      address.isDefault =
        String(address._id) ===
        String(incomingId);
    });

    return list;
  }

  // ---- nothing is default yet ----
  if (
    !list.some(
      (address) => address.isDefault
    )
  ) {
    list[0].isDefault = true;
  }

  return list;
};


// =========================================
// ADDRESS LOOKUP
// =========================================
// Always scoped to the authenticated user's own
// document. A foreign addressId therefore simply
// does not exist for them: there is no code path
// that can reach another account's addresses.
// =========================================

export const findAddressOrThrow = async (
  userId,
  addressId
) => {
  if (
    !mongoose.isValidObjectId(addressId)
  ) {
    throw new ProfileError(
      "Invalid address id",
      400
    );
  }

  const user = await userModel
    .findById(userId)
    .select("addresses")
    .lean();

  if (!user) {
    throw new ProfileError(
      "User not found",
      404
    );
  }

  const address =
    (user.addresses || []).find(
      (candidate) =>
        String(candidate._id) ===
        String(addressId)
    );

  if (!address) {
    throw new ProfileError(
      "Address not found",
      404
    );
  }

  return {
    user,
    address,
  };
};


// Re-exported so the controller and the tests
// share one definition of "complete address".
export { requiredAddressFields };