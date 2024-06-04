const express = require("express");
const {
  createSingleCustomer,
  getAllCustomer,
  getSingleCustomer,
  updateSingleCustomer,
  deleteSingleCustomer,
} = require("./customer.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const customerRoutes = express.Router();

customerRoutes.post("/", authorize("create-customer"), createSingleCustomer);
customerRoutes.get("/", authorize("read-customer"), getAllCustomer);
customerRoutes.get("/:id", authorize("read-customer"), getSingleCustomer);
customerRoutes.put("/:id", authorize("update-customer"), updateSingleCustomer);
customerRoutes.patch(
  "/:id",
  authorize("delete-customer"),
  deleteSingleCustomer
);

module.exports = customerRoutes;
