const { generateToken } = require("../config/jwtToken");
const jwt = require("jsonwebtoken")
const { generateRefreshToken } = require("../config/refreshToken");
const Product = require("../models/productModel");
const asyncHandler = require("express-async-handler");
const { default: slugify } = require("slugify");

const createProduct = asyncHandler(async(req,res) =>{
    if(req.body.title){
        req.body.slug =slugify(req.body.title)
    }
    const newProduct = await Product.create(req.body);
    res.json(newProduct);
})
const getSingleProduct = asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const getProduct = await Product.findById(id);
      res.json(getProduct);
    } catch (error) {
      throw new Error(error);
    }
  });

  const getAllProduct = asyncHandler(async (req, res) => {
    try {
      const queryObj = {...req.query}
      console.log(queryObj);
      const excludeFields = ["fields","page","sort","limit"]
      excludeFields.forEach(element => {
        delete queryObj[element]
      });
      console.log(req.query);
      console.log(queryObj);

      let queryStr = JSON.stringify(queryObj)
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g,(match)=>`$${match}`)
      let query = Product.find(JSON.parse(queryStr));
      
      if(req.query.sort){
        const sortBy = req.query.sort.split(",").join(" ")
        query = query.sort(sortBy)
      }
      else{
        query = query.sort("-createdAt")
      }

      if(req.query.fields){
        const sortBy = req.query.fields.split(",").join(" ")
        query = query.select(sortBy)
      }
      else{
        query = query.select("__v")
      }

      const product = await query
      res.json(product);
    } catch (error) {
      throw new Error(error);
    }
  });

  const updateProduct = asyncHandler(async (req, res) => {
    const id = req.params;
    if(req.body.title){
        req.body.slug =slugify(req.body.title)
    }
    try {
      const updateProduct = await Product.findOneAndUpdate(
        {id},
        req.body,
        {
          new: true,
        }
      );
      res.json(updateProduct);
    } catch (error) {
      throw new Error(error);
    }
  });
  
  const deleteProduct = asyncHandler(async (req, res) => {
    const id = req.params;
    try {
      const deleteProduct = await Product.findOneAndDelete(id);
      res.json(deleteProduct);
    } catch (error) {
      throw new Error(error);
    }
  });
  
module.exports = {createProduct,getSingleProduct,getAllProduct,updateProduct,deleteProduct}