const express = require("express");
const {
  createSingleSupplier,
  getAllSupplier,
  getSingleSupplier,
  updateSingleSupplier,
  deleteSingleSupplier,
} = require("./supplier.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const supplierRoutes = express.Router();

supplierRoutes.post("/", authorize("create-supplier"), createSingleSupplier);
supplierRoutes.get("/", authorize("read-supplier"), getAllSupplier);
supplierRoutes.get("/:id", authorize("read-supplier"), getSingleSupplier);
supplierRoutes.put("/:id", authorize("update-supplier"), updateSingleSupplier);
supplierRoutes.patch(
  "/:id",
  authorize("delete-supplier"),
  deleteSingleSupplier
);

module.exports = supplierRoutes;
