const express = require("express");
const {
  createSingleProductSubCategory,
  getAllProductSubCategory,
  getSingleProductSubCategory,
  updateSingleProductSubCategory,
  deleteSingleProductSubCategory,
} = require("./productSubCategory.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const productSubCategoryRoutes = express.Router();

productSubCategoryRoutes.post(
  "/",
  authorize("create-productSubCategory"),
  createSingleProductSubCategory
);
productSubCategoryRoutes.get(
  "/",
  authorize("read-productSubCategory"),
  getAllProductSubCategory
);
productSubCategoryRoutes.get(
  "/:id",
  authorize("read-productSubCategory"),
  getSingleProductSubCategory
);
productSubCategoryRoutes.put(
  "/:id",
  authorize("update-productSubCategory"),
  updateSingleProductSubCategory
);
productSubCategoryRoutes.delete(
  "/:id",
  authorize("delete-productSubCategory"),
  deleteSingleProductSubCategory
);

module.exports = productSubCategoryRoutes;
