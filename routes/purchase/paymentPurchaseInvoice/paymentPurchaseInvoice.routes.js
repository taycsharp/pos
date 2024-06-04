const express = require("express");
const {
  createPaymentPurchaseInvoice,
  getAllPaymentPurchaseInvoice,
  // getSinglePaymentPurchaseInvoice,
  // updateSinglePaymentPurchaseInvoice,
  // deleteSinglePaymentPurchaseInvoice,
} = require("./paymentPurchaseInvoice.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const paymentSupplierRoutes = express.Router();

paymentSupplierRoutes.post(
  "/",
  authorize("create-paymentPurchaseInvoice"),
  createPaymentPurchaseInvoice
);
paymentSupplierRoutes.get(
  "/",
  authorize("read-paymentPurchaseInvoice"),
  getAllPaymentPurchaseInvoice
);
// paymentSupplierRoutes.get("/:id", getSinglePaymentSupplier);
// paymentSupplierRoutes.put("/:id", updateSinglePaymentSupplier);
// paymentSupplierRoutes.delete("/:id", deleteSinglePaymentSupplier);

module.exports = paymentSupplierRoutes;
