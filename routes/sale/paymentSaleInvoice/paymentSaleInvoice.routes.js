const express = require("express");
const {
  createSinglePaymentSaleInvoice,
  getAllPaymentSaleInvoice,
  // getSinglePaymentSupplier,
  // updateSinglePaymentSupplier,
  // deleteSinglePaymentSupplier,
} = require("./paymentSaleInvoice.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const paymentSaleInvoiceRoutes = express.Router();

paymentSaleInvoiceRoutes.post(
  "/",
  authorize("create-paymentSaleInvoice"),
  createSinglePaymentSaleInvoice
);
paymentSaleInvoiceRoutes.get(
  "/",
  authorize("read-paymentSaleInvoice"),
  getAllPaymentSaleInvoice
);
// paymentSaleInvoiceRoutes.get("/:id", getSinglePaymentSupplier);
// paymentSaleInvoiceRoutes.put("/:id", updateSinglePaymentSupplier);
// paymentSaleInvoiceRoutes.delete("/:id", deleteSinglePaymentSupplier);

module.exports = paymentSaleInvoiceRoutes;
