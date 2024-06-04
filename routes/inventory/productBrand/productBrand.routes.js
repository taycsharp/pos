const express = require("express");
const {
  createSingleProductBrand,
  getAllProductBrand,
  getSingleProductBrand,
  updateSingleProductBrand,
  deleteSingleProductBrand,
} = require("./productBrand.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const productBrandRoutes = express.Router();

productBrandRoutes.post(
  "/",
  authorize("create-productBrand"),
  createSingleProductBrand
);
productBrandRoutes.get("/", authorize("read-productBrand"), getAllProductBrand);
productBrandRoutes.get(
  "/:id",
  authorize("read-productBrand"),
  getSingleProductBrand
);
productBrandRoutes.put(
  "/:id",
  authorize("update-productBrand"),
  updateSingleProductBrand
);
productBrandRoutes.delete(
  "/:id",
  authorize("delete-productBrand"),
  deleteSingleProductBrand
);

module.exports = productBrandRoutes;
