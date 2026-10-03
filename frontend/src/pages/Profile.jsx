import {
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { ShopContext } from "../context/ShopContext";


// =========================================
// ICONS
// =========================================
// Inline SVGs to match the storefront's existing
// hand-rolled icon language (see Order.jsx).
// No icon library is installed in this project.

const UserIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    className="w-[18px] h-[18px]"
  >
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
);


const PackageIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    className="w-[18px] h-[18px]"
  >
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
    <path d="m4 7.5 8 4.5 8-4.5" />
    <path d="M12 12v9" />
  </svg>
);


const PinIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    className="w-[18px] h-[18px]"
  >
    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);


const ShieldIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    className="w-[18px] h-[18px]"
  >
    <path d="M12 3 5 6v5.5c0 4.2 2.9 8.1 7 9.5 4.1-1.4 7-5.3 7-9.5V6l-7-3Z" />
    <path d="m9.2 12 2 2 3.6-3.8" />
  </svg>
);


const LogoutIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    className="w-[18px] h-[18px]"
  >
    <path d="M15 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H15" />
    <path d="M13 12h8" />
    <path d="m17.5 8.5 3.5 3.5-3.5 3.5" />
  </svg>
);


const PlusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    className="w-4 h-4"
  >
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);


const PencilIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="w-4 h-4"
  >
    <path d="M4 20h4l10-10-4-4L4 16v4Z" />
    <path d="m14.5 5.5 4 4" />
  </svg>
);


const TrashIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="w-4 h-4"
  >
    <path d="M4 7h16" />
    <path d="M9 7V5h6v2" />
    <path d="M6 7l1 13h10l1-13" />
  </svg>
);


const EyeIcon = ({ off }) =>
  off ? (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="w-[18px] h-[18px]"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c5 0 9 4.5 9 6 0 .6-.5 1.4-1.4 2.2" />
      <path d="M6.5 7.8C4.6 8.9 3 10.6 3 12c0 1.5 4 6 9 6 1.6 0 3-.4 4.2-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="w-[18px] h-[18px]"
    >
      <path d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );


// =========================================
// CONSTANTS
// =========================================

const ADDRESS_LABELS = [
  "Home",
  "Work",
  "Other",
];

const emptyAddressForm = {
  label: "Home",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  zipcode: "",
  country: "",
  isDefault: false,
};


// Field names mirror the checkout address so a
// saved address can be copied straight into it.
const ADDRESS_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "street",
  "city",
  "state",
  "zipcode",
  "country",
];


// =========================================
// HELPERS
// =========================================

/**
 * Initials for the avatar, derived from the real
 * name the API returned.
 * "Muaddh Alsway" -> "MA", "John" -> "J".
 */
const getInitials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
};


// Soft, readable summary of a saved address.
const formatAddressLine = (address) => {
  const locality = [
    address.city,
    address.state,
    address.zipcode,
  ]
    .filter(Boolean)
    .join(" ");

  return [locality, address.country]
    .filter(Boolean)
    .join(", ");
};


const inputClass =
  "w-full px-3.5 py-2.5 border border-gray-300 bg-white text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black";

const labelClass =
  "block text-xs font-medium uppercase tracking-[0.12em] text-gray-500 mb-2";

const primaryButton =
  "inline-flex items-center justify-center gap-2 bg-black text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-gray-800 transition cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-70";

const ghostButton =
  "inline-flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:border-black hover:text-black transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";


// =========================================
// PROFILE
// =========================================

function Profile() {

  const {
    token,
    getProfile,
    updateProfile,
    changePassword,
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    logout,
    navigate,
  } = useContext(ShopContext);

  const routerNavigate = useNavigate();

  // =========================================
  // STATE
  // =========================================

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  // Only ever populated from the API. Never
  // seeded with placeholder values.
  const [profile, setProfile] =
    useState(null);

  const [activeTab, setActiveTab] =
    useState("profile");

  // ---- personal information ----

  const [info, setInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [savingInfo, setSavingInfo] =
    useState(false);

  // ---- security ----

  const [passwords, setPasswords] =
    useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  const [savingPassword, setSavingPassword] =
    useState(false);

  const [showPasswords, setShowPasswords] =
    useState({
    current: false,
    new: false,
    confirm: false,
  });

  // ---- addresses ----

  const [addresses, setAddresses] =
    useState([]);

  const [addressesLoading, setAddressesLoading] =
    useState(true);

  const [addressModal, setAddressModal] =
    useState(null); // null | "new" | addressId

  const [addressForm, setAddressForm] =
    useState(
      emptyAddressForm
    );

  const [savingAddress, setSavingAddress] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState("");


  // =========================================
  // NO TOKEN -> LOGIN
  // =========================================
  // The JWT alone decides whose profile this is.
  // There is deliberately no /profile/:userId, so
  // no customer id is ever exposed in the URL.

  useEffect(() => {
    if (!token) {
      routerNavigate("/login");

      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const data = await getProfile();

        if (cancelled) {
          return;
        }

        if (!data?.user) {
          // Either the request failed or the
          // token was rejected. In both cases the
          // customer must not see a fake profile.
          setProfile(null);

          setLoadError(
            "We couldn't load your profile. Please try again."
          );

          return;
        }

        setProfile(data.user);

        setInfo({
          name: data.user.name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
        });
      } catch (error) {

        console.error(
          "Profile load error:",
          error
        );

        if (!cancelled) {
          setLoadError(
            "We couldn't load your profile. Please try again."
          );
        }
      } finally {

        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [token, getProfile, routerNavigate]);


// =========================================
// LOAD ADDRESSES ON DEMAND
// =========================================
// Loading starts as true so the panel shows a
// skeleton immediately and never flashes an
// empty state before the real data arrives.

const loadAddresses =
  useCallback(async () => {
    try {
      const list = await getAddresses();

      setAddresses(list);
    } finally {
      setAddressesLoading(false);
    }
  }, [getAddresses]);

  useEffect(() => {
    if (token && profile) {
      // Every state write happens after the
      // await, so no synchronous setState runs
      // inside the effect body.
      loadAddresses();
    }
  }, [token, profile, loadAddresses]);


  // =========================================
  // UNAUTHORIZED
  // =========================================
  // A rejected JWT is a real logout: drop the
  // token and go back to /login.

  useEffect(() => {
    if (token && !loading && !profile) {
      const timer = setTimeout(
        () => {
          logout();
        },
        2200
      );

      return () =>
        clearTimeout(timer);
    }
  }, [token, loading, profile, logout]);


  // =========================================
  // PERSONAL INFORMATION
  // =========================================

  const handleInfoChange = (e) => {
    const { name, value } =
      e.target;

    setInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveInfo =
    async (e) => {
      e.preventDefault();

      if (savingInfo) {
        return;
      }

      // Trim before validating or sending so a
      // stray space cannot become a real value.
      const payload = {
        name: info.name.trim(),
        email: info.email.trim(),
        phone: info.phone.trim(),
      };

      if (!payload.name) {
        toast.error("Name is required");

        return;
      }

      if (!payload.email) {
        toast.error("Email is required");

        return;
      }

      // Deliberately loose: the backend is
      // authoritative and owns the real rules.
      if (
        payload.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          payload.email
        )
      ) {
        toast.error(
          "Please enter a valid email"
        );

        return;
      }

      try {
        setSavingInfo(true);

        const result =
          await updateProfile(
            payload
          );

        if (!result?.success) {
          toast.error(
            result?.message ||
              "Failed to save changes"
          );

          return;
        }

        // Update local state from the server's
        // response rather than the form, so the
        // normalized email is what gets shown.
        const updated = result.user;

        setProfile(updated);

        setInfo({
          name: updated.name || "",
          email: updated.email || "",
          phone: updated.phone || "",
        });

        toast.success(
          "Profile updated"
        );
      } catch (error) {

        console.error(
          "Save profile error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Failed to save changes"
        );
      } finally {
        setSavingInfo(false);
      }
    };


  // =========================================
  // SECURITY
  // =========================================

  const handlePasswordChange = (field) =>
    (e) => {
      const { value } = e.target;

      setPasswords((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const togglePasswordVisibility =
    (field) => () => {
      setShowPasswords((prev) => ({
        ...prev,
        [field]: !prev[field],
      }));
    };

  const handleChangePassword =
    async (e) => {
      e.preventDefault();

      if (savingPassword) {
        return;
      }

      const currentPassword =
        passwords.currentPassword;
      const newPassword =
        passwords.newPassword;
      const confirmPassword =
        passwords.confirmPassword;

      if (!currentPassword) {
        toast.error(
          "Current password is required"
        );

        return;
      }

      if (!newPassword) {
        toast.error(
          "New password is required"
        );

        return;
      }

      if (newPassword.length < 8) {
        toast.error(
          "Password must be at least 8 characters"
        );

        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        toast.error(
          "New passwords do not match"
        );

        return;
      }

      try {
        setSavingPassword(true);

        const result =
          await changePassword({
            currentPassword,
            newPassword,
            confirmPassword,
          });

        if (!result?.success) {
          toast.error(
            result?.message ||
              "Failed to change password"
          );

          return;
        }

        // Clear every field on success.
        setPasswords({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setShowPasswords({
          current: false,
          new: false,
          confirm: false,
        });

        toast.success(
          "Password changed successfully"
        );
      } catch (error) {

        console.error(
          "Change password error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Failed to change password"
        );
      } finally {
        setSavingPassword(false);
      }
    };


  // =========================================
  // ADDRESSES
  // =========================================

  const openNewAddress = () => {
    // Prefill what we already know about the
    // customer so the form is not empty.
    setAddressForm({
      ...emptyAddressForm,
      firstName: info.name
        .split(" ")[0] || "",
      lastName: info.name
        .split(" ")
        .slice(1)
        .join(" "),
      email: info.email,
      isDefault:
        addresses.length === 0,
    });

    setAddressModal("new");
  };

  const openEditAddress =
    (address) => {
      const next = {
        ...emptyAddressForm,
        ...Object.fromEntries(
          ADDRESS_FIELDS.map(
            (field) => [
              field,
              address[field] || "",
            ]
          )
        ),
        label: address.label || "Home",
        isDefault: Boolean(
          address.isDefault
        ),
      };

      setAddressForm(next);
      setAddressModal(address._id);
    };

  const closeAddressModal = () => {
    setAddressModal(null);
    setAddressForm(emptyAddressForm);
  };

  const handleAddressChange = (e) => {
    const { name, value, type, checked } =
      e.target;

    setAddressForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleSaveAddress =
    async (e) => {
      e.preventDefault();

      if (savingAddress) {
        return;
      }

      const payload = {
        label:
          addressForm.label.trim() ||
          "Home",
        isDefault:
          Boolean(addressForm.isDefault),
      };

      for (const field of ADDRESS_FIELDS) {
        payload[field] =
          addressForm[field].trim();
      }

      if (!payload.firstName) {
        toast.error(
          "First name is required"
        );

        return;
      }

      if (!payload.lastName) {
        toast.error(
          "Last name is required"
        );

        return;
      }

      if (!payload.email) {
        toast.error("Email is required");

        return;
      }

      if (!payload.street) {
        toast.error(
          "Street address is required"
        );

        return;
      }

      if (!payload.city) {
        toast.error("City is required");

        return;
      }

      if (!payload.country) {
        toast.error("Country is required");

        return;
      }

      if (!payload.phone) {
        toast.error(
          "Phone number is required"
        );

        return;
      }

      try {
        setSavingAddress(true);

        const result =
          addressModal === "new"
            ? await addAddress(payload)
            : await updateAddress(
                addressModal,
                payload
              );

        if (!result?.success) {
          toast.error(
            result?.message ||
              "Failed to save address"
          );

          return;
        }

        setAddresses(
          result.addresses || []
        );

        closeAddressModal();

        toast.success(
          addressModal === "new"
            ? "Address saved"
            : "Address updated"
        );
      } catch (error) {

        console.error(
          "Save address error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Failed to save address"
        );
      } finally {
        setSavingAddress(false);
      }
    };

  const handleDeleteAddress =
    async (address) => {
      if (deletingId) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete the "${
            address.label || "address"
          }" address?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(address._id);

        const result =
          await deleteAddress(
            address._id
          );

        if (!result?.success) {
          toast.error(
            result?.message ||
              "Failed to delete address"
          );

          return;
        }

        setAddresses(
          result.addresses || []
        );

        toast.success(
          "Address deleted"
        );
      } catch (error) {

        console.error(
          "Delete address error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Failed to delete address"
        );
      } finally {
        setDeletingId("");
      }
    };

  const makeDefault =
    async (address) => {
      if (
        address.isDefault ||
        deletingId
      ) {
        return;
      }

      try {
        setDeletingId(address._id);

        const result =
          await updateAddress(
            address._id,
            { isDefault: true }
          );

        if (!result?.success) {
          toast.error(
            result?.message ||
              "Failed to update address"
          );

          return;
        }

        setAddresses(
          result.addresses || []
        );

        toast.success(
          "Default address updated"
        );
      } catch (error) {

        console.error(
          "Default address error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Failed to update address"
        );
      } finally {
        setDeletingId("");
      }
    };


  // =========================================
  // NAVIGATION TABS
  // =========================================

  const TABS = [
    {
      id: "profile",
      label: "Profile",
      icon: <UserIcon />,
    },
    {
      id: "orders",
      label: "Orders",
      icon: <PackageIcon />,
    },
    {
      id: "addresses",
      label: "Addresses",
      icon: <PinIcon />,
    },
    {
      id: "security",
      label: "Security",
      icon: <ShieldIcon />,
    },
  ];

  const goToOrders = () => {
    // The existing Orders page is reused as-is.
    navigate("/orders");
  };


  // =========================================
  // LOADING SKELETON
  // =========================================
  // No fake name or email is rendered while the
  // real profile is in flight.

  if (loading) {
    return (
      <div className="border-t min-h-[70vh] py-12 sm:py-16">

        <div className="max-w-6xl mx-auto animate-pulse">

          <div className="h-3 w-24 bg-gray-200 rounded mb-4"></div>

          <div className="h-9 w-40 bg-gray-200 rounded-lg"></div>

          <div className="mt-10 bg-white border border-gray-200 rounded-[28px] p-8 sm:p-10 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gray-100"></div>

              <div className="flex-1">
                <div className="h-5 w-48 bg-gray-100 rounded"></div>
                <div className="h-4 w-64 max-w-full bg-gray-100 rounded mt-3"></div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
            <div className="h-64 bg-white border border-gray-200 rounded-[26px]"></div>
            <div className="h-80 bg-white border border-gray-200 rounded-[26px]"></div>
          </div>

        </div>

      </div>
    );
  }


  // =========================================
  // ERROR / UNAUTHORIZED
  // =========================================

  if (loadError || !profile) {
    return (
      <div className="border-t min-h-[70vh] py-12 sm:py-16">

        <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-[28px] p-10 text-center shadow-sm">

          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500">
            <UserIcon />
          </div>

          <h2 className="text-xl font-semibold tracking-tight mt-6">
            Unable to load your profile
          </h2>

          <p className="text-sm text-gray-500 mt-3 leading-6">
            {loadError ||
              "Please try again."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-7">
            <button
              onClick={() => {
                setLoadError("");
                setLoading(true);
                setProfile(null);
                routerNavigate(0);
              }}
              className={primaryButton}
            >
              Try again
            </button>

            <button
              onClick={() =>
                routerNavigate(
                  "/login"
                )
              }
              className={ghostButton}
            >
              Back to login
            </button>
          </div>

        </div>

      </div>
    );
  }


  // =========================================
  // UI
  // =========================================

  const initials = getInitials(
    profile.name
  );

  return (
    <div className="border-t bg-[#fafafa] min-h-screen">

      <div className="max-w-6xl mx-auto py-10 sm:py-14 lg:py-16">

        {/* ========================================= */}
        {/* HEADER */}
        {/* ========================================= */}

        <div className="mb-10">
          <p className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.2em] text-gray-400 mb-3">
            Account
          </p>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.04em] text-gray-950">
            Profile
          </h1>

          <p className="text-sm text-gray-500 mt-3 max-w-lg leading-6">
            Manage your personal details, saved addresses and password.
          </p>
        </div>


        {/* ========================================= */}
        {/* ACCOUNT HEADER CARD */}
        {/* ========================================= */}

        <div className="bg-white border border-gray-200 rounded-[28px] p-7 sm:p-9 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-black text-white flex items-center justify-center text-2xl sm:text-3xl font-semibold tracking-tight shrink-0">
              {initials}
            </div>

            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-950 truncate">
                {profile.name}
              </h2>

              <p className="text-sm text-gray-500 mt-1.5 truncate">
                {profile.email}
              </p>

              {profile.phone && (
                <p className="text-sm text-gray-400 mt-1 truncate">
                  {profile.phone}
                </p>
              )}
            </div>
          </div>
        </div>


        {/* ========================================= */}
        {/* BODY: NAV + PANEL */}
        {/* ========================================= */}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">

          {/* ---------------------------------------- */}
          {/* NAVIGATION */}
          {/* ---------------------------------------- */}

          <nav className="bg-white border border-gray-200 rounded-[26px] p-2 shadow-sm lg:sticky lg:top-6">
            <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible scrollbar-hide">
              {TABS.map((tab) => (
                <li key={tab.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      tab.id === "orders"
                        ? goToOrders()
                        : setActiveTab(tab.id)
                    }
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl text-left transition cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-black text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-black"
                    }`}
                  >
                    {tab.icon}
                    <span className="whitespace-nowrap">
                      {tab.label}
                    </span>
                  </button>
                </li>
              ))}

              <li className="shrink-0">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl text-left text-gray-600 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                >
                  <LogoutIcon />
                  <span className="whitespace-nowrap">
                    Logout
                  </span>
                </button>
              </li>
            </ul>
          </nav>


          {/* ---------------------------------------- */}
          {/* PANEL */}
          {/* ---------------------------------------- */}

          <section className="bg-white border border-gray-200 rounded-[26px] shadow-sm overflow-hidden">

            {/* ===================================== */}
            {/* PERSONAL INFORMATION */}
            {/* ===================================== */}

            {activeTab === "profile" && (
              <div className="p-7 sm:p-9">

                <h3 className="text-lg font-semibold tracking-tight text-gray-950">
                  Personal Information
                </h3>

                <p className="text-sm text-gray-500 mt-2">
                  Keep your contact details up to date.
                </p>

                <form
                  onSubmit={handleSaveInfo}
                  className="mt-7 space-y-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="profile-name"
                        className={labelClass}
                      >
                        Name
                      </label>

                      <input
                        id="profile-name"
                        type="text"
                        name="name"
                        value={info.name}
                        onChange={handleInfoChange}
                        placeholder="Your full name"
                        autoComplete="name"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="profile-email"
                        className={labelClass}
                      >
                        Email
                      </label>

                      <input
                        id="profile-email"
                        type="email"
                        name="email"
                        value={info.email}
                        onChange={handleInfoChange}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="profile-phone"
                        className={labelClass}
                      >
                        Phone
                      </label>

                      <input
                        id="profile-phone"
                        type="tel"
                        name="phone"
                        value={info.phone}
                        onChange={handleInfoChange}
                        placeholder="+1 555 000 1234"
                        autoComplete="tel"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingInfo}
                      className={primaryButton}
                    >
                      {savingInfo
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </form>

              </div>
            )}


            {/* ===================================== */}
            {/* SECURITY */}
            {/* ===================================== */}

            {activeTab === "security" && (
              <div className="p-7 sm:p-9">

                <h3 className="text-lg font-semibold tracking-tight text-gray-950">
                  Security
                </h3>

                <p className="text-sm text-gray-500 mt-2">
                  Use at least 8 characters.
                </p>

                <form
                  onSubmit={handleChangePassword}
                  className="mt-7 space-y-5 max-w-md"
                >
                  <div className="relative">
                    <label
                      htmlFor="current-password"
                      className={labelClass}
                    >
                      Current Password
                    </label>

                    <input
                      id="current-password"
                      type={
                        showPasswords.current
                          ? "text"
                          : "password"
                      }
                      value={passwords.currentPassword}
                      onChange={handlePasswordChange(
                        "currentPassword"
                      )}
                      autoComplete="current-password"
                      className={`${inputClass} pr-11`}
                    />

                    <button
                      type="button"
                      onClick={togglePasswordVisibility(
                        "current"
                      )}
                      aria-label="Toggle current password visibility"
                      className="absolute right-3 top-[34px] text-gray-400 hover:text-black transition cursor-pointer"
                    >
                      <EyeIcon
                        off={
                          showPasswords.current
                        }
                      />
                    </button>
                  </div>

                  <div className="relative">
                    <label
                      htmlFor="new-password"
                      className={labelClass}
                    >
                      New Password
                    </label>

                    <input
                      id="new-password"
                      type={
                        showPasswords.new
                          ? "text"
                          : "password"
                      }
                      value={passwords.newPassword}
                      onChange={handlePasswordChange(
                        "newPassword"
                      )}
                      autoComplete="new-password"
                      className={`${inputClass} pr-11`}
                    />

                    <button
                      type="button"
                      onClick={togglePasswordVisibility(
                        "new"
                      )}
                      aria-label="Toggle new password visibility"
                      className="absolute right-3 top-[34px] text-gray-400 hover:text-black transition cursor-pointer"
                    >
                      <EyeIcon
                        off={showPasswords.new}
                      />
                    </button>
                  </div>

                  <div className="relative">
                    <label
                      htmlFor="confirm-password"
                      className={labelClass}
                    >
                      Confirm New Password
                    </label>

                    <input
                      id="confirm-password"
                      type={
                        showPasswords.confirm
                          ? "text"
                          : "password"
                      }
                      value={passwords.confirmPassword}
                      onChange={handlePasswordChange(
                        "confirmPassword"
                      )}
                      autoComplete="new-password"
                      className={`${inputClass} pr-11`}
                    />

                    <button
                      type="button"
                      onClick={togglePasswordVisibility(
                        "confirm"
                      )}
                      aria-label="Toggle confirm password visibility"
                      className="absolute right-3 top-[34px] text-gray-400 hover:text-black transition cursor-pointer"
                    >
                      <EyeIcon
                        off={
                          showPasswords.confirm
                        }
                      />
                    </button>
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className={primaryButton}
                    >
                      {savingPassword
                        ? "Updating..."
                        : "Change Password"}
                    </button>
                  </div>
                </form>

              </div>
            )}


            {/* ===================================== */}
            {/* ADDRESSES */}
            {/* ===================================== */}

            {activeTab === "addresses" && (
              <div className="p-7 sm:p-9">

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-gray-950">
                      Saved Addresses
                    </h3>

                    <p className="text-sm text-gray-500 mt-2">
                      Used to speed up checkout.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openNewAddress}
                    className={`${primaryButton} shrink-0`}
                  >
                    <PlusIcon />
                    Add Address
                  </button>
                </div>

                {/* ---- LOADING ---- */}

                {addressesLoading && (
                  <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2].map((item) => (
                      <div
                        key={item}
                        className="border border-gray-200 rounded-2xl p-5 animate-pulse"
                      >
                        <div className="h-4 w-20 bg-gray-100 rounded"></div>
                        <div className="h-4 w-40 bg-gray-100 rounded mt-4"></div>
                        <div className="h-4 w-32 bg-gray-100 rounded mt-3"></div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ---- EMPTY ---- */}

                {!addressesLoading &&
                  addresses.length === 0 && (
                    <div className="mt-7 border border-dashed border-gray-300 rounded-2xl py-14 px-6 text-center">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500">
                        <PinIcon />
                      </div>

                      <p className="font-medium mt-5 text-gray-900">
                        No saved addresses yet.
                      </p>

                      <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto leading-6">
                        Save an address to check out faster next time.
                      </p>

                      <button
                        type="button"
                        onClick={openNewAddress}
                        className={`${primaryButton} mt-6`}
                      >
                        <PlusIcon />
                        Add Address
                      </button>
                    </div>
                  )}

                {/* ---- CARDS ---- */}

                {!addressesLoading &&
                  addresses.length > 0 && (
                    <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {addresses.map(
                        (address) => (
                          <article
                            key={address._id}
                            className={`border rounded-2xl p-5 flex flex-col ${
                              address.isDefault
                                ? "border-black bg-gray-50/60"
                                : "border-gray-200 bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                                {address.label ||
                                  "Address"}
                              </span>

                              {address.isDefault && (
                                <span className="text-[10px] uppercase tracking-[0.12em] bg-black text-white rounded-full px-2.5 py-1">
                                  Default
                                </span>
                              )}
                            </div>

                            <div className="mt-4 text-sm text-gray-700 space-y-1 leading-6">
                              <p className="font-medium text-gray-950">
                                {address.firstName}{" "}
                                {address.lastName}
                              </p>

                              <p>{address.street}</p>

                              <p className="text-gray-500">
                                {formatAddressLine(
                                  address
                                )}
                              </p>

                              <p className="text-gray-500">
                                {address.phone}
                              </p>

                              <p className="text-gray-400 text-xs">
                                {address.email}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-gray-100">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditAddress(
                                    address
                                  )
                                }
                                className={ghostButton}
                              >
                                <PencilIcon />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteAddress(
                                    address
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  address._id
                                }
                                className={`${ghostButton} hover:border-red-500 hover:text-red-600`}
                              >
                                <TrashIcon />
                                Delete
                              </button>

                              {!address.isDefault && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    makeDefault(
                                      address
                                    )
                                  }
                                  disabled={
                                    Boolean(
                                      deletingId
                                    )
                                  }
                                  className="text-xs font-medium text-gray-500 hover:text-black transition cursor-pointer disabled:opacity-50 ml-auto"
                                >
                                  Set as default
                                </button>
                              )}
                            </div>
                          </article>
                        )
                      )}
                    </div>
                  )}

                {/* ---- MODAL ---- */}

                {addressModal && (
                  <div
                    className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
                    role="dialog"
                    aria-modal="true"
                  >
                    <div
                      className="absolute inset-0 bg-black/40"
                      onClick={
                        closeAddressModal
                      }
                    ></div>

                    <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl my-8">
                      <div className="flex items-center justify-between px-6 sm:px-8 pt-6">
                        <h4 className="text-lg font-semibold tracking-tight text-gray-950">
                          {addressModal ===
                          "new"
                            ? "Add Address"
                            : "Edit Address"}
                        </h4>

                        <button
                          type="button"
                          onClick={closeAddressModal}
                          aria-label="Close"
                          className="text-gray-400 hover:text-black transition cursor-pointer text-xl leading-none"
                        >
                          &times;
                        </button>
                      </div>

                      <form
                        onSubmit={handleSaveAddress}
                        className="px-6 sm:px-8 py-6 space-y-4"
                      >
                        {/* ---- LABEL ---- */}

                        <div>
                          <label
                            htmlFor="address-label"
                            className={labelClass}
                          >
                            Label
                          </label>

                          <div className="flex flex-wrap gap-2 mb-2">
                            {ADDRESS_LABELS.map(
                              (option) => (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() =>
                                    setAddressForm(
                                      (prev) => ({
                                        ...prev,
                                        label:
                                          option,
                                      })
                                    )
                                  }
                                  className={`text-xs rounded-full px-3 py-1.5 border transition cursor-pointer ${
                                    addressForm.label ===
                                    option
                                      ? "bg-black text-white border-black"
                                      : "bg-white border-gray-300 text-gray-600 hover:border-black"
                                  }`}
                                >
                                  {option}
                                </button>
                              )
                            )}
                          </div>

                          <input
                            id="address-label"
                            type="text"
                            name="label"
                            value={addressForm.label}
                            onChange={handleAddressChange}
                            placeholder="Home, Work, Parents..."
                            className={inputClass}
                          />
                        </div>

                        {/* ---- NAME ---- */}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="address-first-name"
                              className={labelClass}
                            >
                              First Name
                            </label>

                            <input
                              id="address-first-name"
                              type="text"
                              name="firstName"
                              value={
                                addressForm.firstName
                              }
                              onChange={handleAddressChange}
                              autoComplete="given-name"
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="address-last-name"
                              className={labelClass}
                            >
                              Last Name
                            </label>

                            <input
                              id="address-last-name"
                              type="text"
                              name="lastName"
                              value={
                                addressForm.lastName
                              }
                              onChange={handleAddressChange}
                              autoComplete="family-name"
                              className={inputClass}
                            />
                          </div>
                        </div>

                        {/* ---- CONTACT ---- */}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="address-email"
                              className={labelClass}
                            >
                              Email
                            </label>

                            <input
                              id="address-email"
                              type="email"
                              name="email"
                              value={addressForm.email}
                              onChange={handleAddressChange}
                              autoComplete="email"
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="address-phone"
                              className={labelClass}
                            >
                              Phone
                            </label>

                            <input
                              id="address-phone"
                              type="tel"
                              name="phone"
                              value={addressForm.phone}
                              onChange={handleAddressChange}
                              autoComplete="tel"
                              className={inputClass}
                            />
                          </div>
                        </div>

                        {/* ---- STREET ---- */}

                        <div>
                          <label
                            htmlFor="address-street"
                            className={labelClass}
                          >
                            Street Address
                          </label>

                          <input
                            id="address-street"
                            type="text"
                            name="street"
                            value={addressForm.street}
                            onChange={handleAddressChange}
                            autoComplete="street-address"
                            className={inputClass}
                          />
                        </div>

                        {/* ---- LOCALITY ---- */}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label
                              htmlFor="address-city"
                              className={labelClass}
                            >
                              City
                            </label>

                            <input
                              id="address-city"
                              type="text"
                              name="city"
                              value={addressForm.city}
                              onChange={handleAddressChange}
                              autoComplete="address-level2"
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="address-state"
                              className={labelClass}
                            >
                              State
                            </label>

                            <input
                              id="address-state"
                              type="text"
                              name="state"
                              value={addressForm.state}
                              onChange={handleAddressChange}
                              autoComplete="address-level1"
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="address-zipcode"
                              className={labelClass}
                            >
                              Zip Code
                            </label>

                            <input
                              id="address-zipcode"
                              type="text"
                              name="zipcode"
                              value={addressForm.zipcode}
                              onChange={handleAddressChange}
                              autoComplete="postal-code"
                              className={inputClass}
                            />
                          </div>
                        </div>

                        {/* ---- COUNTRY ---- */}

                        <div>
                          <label
                            htmlFor="address-country"
                            className={labelClass}
                          >
                            Country
                          </label>

                          <input
                            id="address-country"
                            type="text"
                            name="country"
                            value={addressForm.country}
                            onChange={handleAddressChange}
                            autoComplete="country-name"
                            placeholder="United States"
                            className={inputClass}
                          />
                        </div>

                        {/* ---- DEFAULT ---- */}

                        <label className="flex items-center gap-3 pt-1 cursor-pointer">
                          <input
                            type="checkbox"
                            name="isDefault"
                            checked={
                              addressForm.isDefault
                            }
                            onChange={handleAddressChange}
                            className="w-4 h-4 accent-black"
                          />

                          <span className="text-sm text-gray-700">
                            Set as default address
                          </span>
                        </label>

                        {/* ---- ACTIONS ---- */}

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-3">
                          <button
                            type="button"
                            onClick={closeAddressModal}
                            className={ghostButton}
                          >
                            Cancel
                          </button>

                          <button
                            type="submit"
                            disabled={savingAddress}
                            className={primaryButton}
                          >
                            {savingAddress
                              ? "Saving..."
                              : "Save Address"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            )}

          </section>

        </div>

      </div>

    </div>
  );
}

export default Profile;