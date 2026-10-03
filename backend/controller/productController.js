import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";


// function for add product
const addProduct = async (req, res) => {
  try {

    console.log("=== ADD PRODUCT REACHED ===");
    console.log("BODY AFTER MULTER:", req.body);
    console.log("FILES AFTER MULTER:", req.files);

    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller
    } = req.body;


    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];


    // Remove undefined images
    const images = [
      image1,
      image2,
      image3,
      image4
    ].filter(
      (item) => item !== undefined
    );


    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No image provided"
      });
    }


    // Upload images to Cloudinary
    let imageUrl = await Promise.all(

      images.map(async (item) => {

        const result = await cloudinary.uploader.upload(
          item.path,
          {
            resource_type: "image"
          }
        );

        return result.secure_url;

      })

    );


    const productData = {
      name,
      description,
      price: Number(price),
      category,
      subCategory,
      sizes: JSON.parse(sizes),
      image: imageUrl,
      bestseller: bestseller === "true",
      date: Date.now()
    };


    console.log("PRODUCT DATA:", productData);


    const product = await productModel.create(
      productData
    );


    res.json({
      success: true,
      message: "Product Added Successfully",
      product
    });


  } catch (error) {

    console.log(
      "ADD PRODUCT ERROR:",
      error
    );

    res.json({
      success: false,
      message:
        (error.error && error.error.message) ||
        error.message
    });

  }
};



// function for list product
const listProducts = async (req, res) => {
  try {

    const products = await productModel.find({});

    res.json({
      success: true,
      products
    });

  } catch (error) {

    console.log(error);

    res.json({
      success: false,
      message: error.message
    });

  }
};



// function for removing product
const removeProduct = async (req, res) => {
  try {

    await productModel.findByIdAndDelete(
      req.body.id
    );

    res.json({
      success: true,
      message: "Product Removed"
    });

  } catch (error) {

    console.log(error);

    res.json({
      success: false,
      message: error.message
    });

  }
};



// function for single product info
const singleProduct = async (req, res) => {
  try {

    const { productId } = req.body;

    const product = await productModel.findById(
      productId
    );

    res.json({
      success: true,
      product
    });

  } catch (error) {

    console.log(error);

    res.json({
      success: false,
      message: error.message
    });

  }
};


export {
  listProducts,
  removeProduct,
  singleProduct,
  addProduct
};