const express = require("express")
const { createProduct, getSingleProduct, getAllProduct, updateProduct, deleteProduct } = require("../controllers/productCtrl")
const { isAdmin, authMiddleware } = require("../middleware/authMiddleware")
const router = express.Router()

router.post("/",authMiddleware,isAdmin,createProduct)
router.get("/",getAllProduct)
router.get("/:id",getSingleProduct)
router.put("/:id",authMiddleware,isAdmin,updateProduct)
router.delete("/:id",authMiddleware,isAdmin,deleteProduct)
module.exports = router

