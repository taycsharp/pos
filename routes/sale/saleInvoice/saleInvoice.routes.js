const express = require("express");
const {
  createSingleSaleInvoice,
  getAllSaleInvoice,
  getSingleSaleInvoice,
} = require("./saleInvoice.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const saleInvoiceRoutes = express.Router();

saleInvoiceRoutes.post(
  "/",
  authorize("create-saleInvoice"),
  createSingleSaleInvoice
);
saleInvoiceRoutes.get("/", authorize("read-saleInvoice"), getAllSaleInvoice);
saleInvoiceRoutes.get(
  "/:id",
  authorize("read-saleInvoice"),
  getSingleSaleInvoice
);

module.exports = saleInvoiceRoutes;
