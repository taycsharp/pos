const { getPagination } = require("../../../utils/query");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createSingleSupplier = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete all suppliers
      const deletedSupplier = await prisma.supplier.deleteMany({
        where: {
          id: {
            in: req.body.map((id) => parseInt(id)),
          },
        },
      });
      res.json(deletedSupplier);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else if (req.query.query === "createmany") {
    try {
      // create many suppliers from an array of objects
      const createdSupplier = await prisma.supplier.createMany({
        data: req.body.map((supplier) => {
          return {
            name: supplier.name,
            phone: supplier.phone,
            address: supplier.address,
          };
        }),
        skipDuplicates: true,
      });
      res.json(createdSupplier);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else {
    try {
      // create a single supplier from an object
      const createdSupplier = await prisma.supplier.create({
        data: {
          name: req.body.name,
          phone: req.body.phone,
          address: req.body.address,
        },
      });

      res.json(createdSupplier);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  }
};

const getAllSupplier = async (req, res) => {
  if (req.query.query === "all") {
    try {
      // get all suppliers
      const allSupplier = await prisma.supplier.findMany({
        orderBy: {
          id: "asc",
        },
        include: {
          purchaseInvoice: true,
        },
      });
      res.json(allSupplier);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else if (req.query.status === "false") {
    try {
      const { skip, limit } = getPagination(req.query);
      // get all suppliers
      const allSupplier = await prisma.supplier.findMany({
        where: {
          status: false,
        },
        orderBy: {
          id: "asc",
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          purchaseInvoice: true,
        },
      });
      res.json(allSupplier);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else if (req.query.query === "info") {
    try {
      // get all suppliers info
      const aggregations = await prisma.supplier.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: true,
        },
      });
      res.json(aggregations);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      // get all suppliers paginated
      const allSupplier = await prisma.supplier.findMany({
        orderBy: {
          id: "asc",
        },
        where: {
          status: true,
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          purchaseInvoice: true,
        },
      });
      res.json(allSupplier);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  }
};

const getSingleSupplier = async (req, res) => {
  try {
    const singleSupplier = await prisma.supplier.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        purchaseInvoice: true,
      },
    });

    // get individual supplier's due amount by calculating: purchase invoice's total_amount - return purchase invoices - transactions
    const allPurchaseInvoiceTotalAmount =
      await prisma.purchaseInvoice.aggregate({
        _sum: {
          total_amount: true,
          discount: true,
        },
        where: {
          supplier_id: parseInt(req.params.id),
        },
      });
    const suppliersAllInvoice = await prisma.supplier.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        purchaseInvoice: {
          include: {
            returnPurchaseInvoice: {
              where: {
                status: true,
              },
            },
          },
        },
      },
    });

    // sum returnPurchaseInvoice total_amount
    const sumOfAllReturnPurchaseInvoice = suppliersAllInvoice.purchaseInvoice
      .map((purchaseInvoice) => {
        return purchaseInvoice.returnPurchaseInvoice.map(
          (returnPurchaseInvoice) => {
            return returnPurchaseInvoice.total_amount;
          }
        );
      })
      .flat()
      .reduce((a, b) => a + b, 0);

    // all returnPurchaseInvoice
    const allReturnPurchaseInvoice = suppliersAllInvoice.purchaseInvoice
      .map((purchaseInvoice) => {
        return purchaseInvoice.returnPurchaseInvoice.map(
          (returnPurchaseInvoice) => {
            return returnPurchaseInvoice;
          }
        );
      })
      .flat();
    // get all purchaseInvoice id
    const allPurchaseInvoiceId = suppliersAllInvoice.purchaseInvoice.map(
      (purchaseInvoice) => {
        return purchaseInvoice.id;
      }
    );

    // get all transactions related to purchaseInvoice id
    const allTransaction = await prisma.transaction.findMany({
      where: {
        type: "purchase",
        related_id: {
          in: allPurchaseInvoiceId,
        },
      },
      include: {
        debit: {
          select: {
            name: true,
          },
        },
        credit: {
          select: {
            name: true,
          },
        },
      },
    });

    // sum allTransaction amount
    const sumOfAllTransaction = allTransaction
      .map((transaction) => {
        return transaction.amount;
      })
      .reduce((a, b) => a + b, 0);

    const due_amount =
      parseFloat(allPurchaseInvoiceTotalAmount._sum.total_amount) -
      parseFloat(allPurchaseInvoiceTotalAmount._sum.discount) -
      parseFloat(sumOfAllReturnPurchaseInvoice) -
      parseFloat(sumOfAllTransaction);

    // include due_amount in singleSupplier
    singleSupplier.due_amount = due_amount ? due_amount : 0;
    singleSupplier.allReturnPurchaseInvoice = allReturnPurchaseInvoice;
    singleSupplier.allTransaction = allTransaction;

    res.json(singleSupplier);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

const updateSingleSupplier = async (req, res) => {
  try {
    const updatedSupplier = await prisma.supplier.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
      },
    });
    res.json(updatedSupplier);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

const deleteSingleSupplier = async (req, res) => {
  try {
    // delete a single supplier
    const deletedSupplier = await prisma.supplier.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        status: req.body.status,
      },
    });
    res.json(deletedSupplier);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

module.exports = {
  createSingleSupplier,
  getAllSupplier,
  getSingleSupplier,
  updateSingleSupplier,
  deleteSingleSupplier,
};
