import userModel from "../models/userModel.js";

// =========================
// ADD PRODUCT TO CART
// =========================

const addToCart = async (req, res) => {
  try {
    const { userId } = req;
    const { itemId, size } = req.body;

    if (!itemId || !size) {
      return res.status(400).json({
        success: false,
        message: "Item ID and size are required",
      });
    }

    const userData = await userModel.findById(userId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const cartData = userData.cartData || {};

    if (cartData[itemId]) {
      if (cartData[itemId][size]) {
        cartData[itemId][size] += 1;
      } else {
        cartData[itemId][size] = 1;
      }
    } else {
      cartData[itemId] = {
        [size]: 1,
      };
    }

    await userModel.findByIdAndUpdate(
      userId,
      { cartData }
    );

    return res.json({
      success: true,
      message: "Added to cart",
      cartData,
    });

  } catch (error) {
    console.error("Add to cart error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =========================
// UPDATE USER CART
// =========================

const updateCart = async (req, res) => {
  try {
    const { userId } = req;

    const {
      itemId,
      size,
      quantity,
    } = req.body;

    if (!itemId || !size) {
      return res.status(400).json({
        success: false,
        message: "Item ID and size are required",
      });
    }

    const userData = await userModel.findById(userId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const cartData = userData.cartData || {};

    if (quantity <= 0) {

      if (cartData[itemId]) {
        delete cartData[itemId][size];

        if (
          Object.keys(cartData[itemId]).length === 0
        ) {
          delete cartData[itemId];
        }
      }

    } else {

      if (!cartData[itemId]) {
        cartData[itemId] = {};
      }

      cartData[itemId][size] = Number(quantity);
    }

    await userModel.findByIdAndUpdate(
      userId,
      { cartData }
    );

    return res.json({
      success: true,
      message: "Cart updated",
      cartData,
    });

  } catch (error) {
    console.error("Update cart error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =========================
// GET USER CART
// =========================

const getUserCart = async (req, res) => {
  try {
    const { userId } = req;

    const userData = await userModel.findById(userId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      cartData: userData.cartData || {},
    });

  } catch (error) {
    console.error("Get cart error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export {
  addToCart,
  updateCart,
  getUserCart,
};