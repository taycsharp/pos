const express = require("express");
const {
  createSingleReturnSaleInvoice,
  getAllReturnSaleInvoice,
  getSingleReturnSaleInvoice,
  updateSingleReturnSaleInvoice,
  deleteSingleReturnSaleInvoice,
} = require("./returnSaleInvoice.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const returnSaleInvoiceRoutes = express.Router();

returnSaleInvoiceRoutes.post(
  "/",
  authorize("create-returnSaleInvoice"),
  createSingleReturnSaleInvoice
);
returnSaleInvoiceRoutes.get(
  "/",
  authorize("read-returnSaleInvoice"),
  getAllReturnSaleInvoice
);
returnSaleInvoiceRoutes.get(
  "/:id",
  authorize("read-returnSaleInvoice"),
  getSingleReturnSaleInvoice
);
// returnSaleInvoiceRoutes.put("/:id", authorize("updatePurchaseInvoice"), updateSinglePurchaseInvoice); // purchase invoice is not updatable
returnSaleInvoiceRoutes.patch(
  "/:id",
  authorize("delete-returnSaleInvoice"),
  deleteSingleReturnSaleInvoice
);

module.exports = returnSaleInvoiceRoutes;
