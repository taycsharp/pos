const { getPagination } = require("../../../utils/query");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createSingleCustomer = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many customer at once
      const deletedAccount = await prisma.customer.deleteMany({
        where: {
          id: {
            in: req.body.map((id) => parseInt(id)),
          },
        },
      });
      res.json(deletedAccount);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else if (req.query.query === "createmany") {
    try {
      // create many customer from an array of objects
      const createdCustomer = await prisma.customer.createMany({
        data: req.body.map((customer) => {
          return {
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
          };
        }),
        skipDuplicates: true,
      });
      res.json(createdCustomer);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else {
    try {
      // create single customer from an object
      const createdCustomer = await prisma.customer.create({
        data: {
          name: req.body.name,
          phone: req.body.phone,
          address: req.body.address,
        },
      });
      res.json(createdCustomer);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  }
};

const getAllCustomer = async (req, res) => {
  if (req.query.query === "all") {
    try {
      // get all customer
      const allCustomer = await prisma.customer.findMany({
        orderBy: {
          id: "asc",
        },
        include: {
          saleInvoice: true,
        },
      });
      res.json(allCustomer);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else if (req.query.query === "info") {
    // get all customer info
    const aggregations = await prisma.customer.aggregate({
      _count: {
        id: true,
      },
      where: {
        status: true,
      },
    });
    res.json(aggregations);
  } else if (req.query.status === "false") {
    try {
      const { skip, limit } = getPagination(req.query);
      // get all customer
      const allCustomer = await prisma.customer.findMany({
        orderBy: {
          id: "asc",
        },
        include: {
          saleInvoice: true,
        },
        where: {
          status: false,
        },
        skip: parseInt(skip),
        take: parseInt(limit),
      });
      res.json(allCustomer);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      // get all customer paginated
      const allCustomer = await prisma.customer.findMany({
        orderBy: {
          id: "asc",
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          saleInvoice: true,
        },
        where: {
          status: true,
        },
      });
      res.json(allCustomer);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  }
};

const getSingleCustomer = async (req, res) => {
  try {
    const singleCustomer = await prisma.customer.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        saleInvoice: true,
      },
    });

    // get individual customer's due amount by calculating: sale invoice's total_amount - return sale invoices - transactions
    const allSaleInvoiceTotalAmount = await prisma.saleInvoice.aggregate({
      _sum: {
        total_amount: true,
        discount: true,
      },
      where: {
        customer_id: parseInt(req.params.id),
      },
    });
    const customersAllInvoice = await prisma.customer.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        saleInvoice: {
          include: {
            returnSaleInvoice: {
              where: {
                status: true,
              },
            },
          },
        },
      },
    });

    // sum returnSaleInvoice total_amount
    const sumOfAllReturnSaleInvoice = customersAllInvoice.saleInvoice
      .map((saleInvoice) => {
        return saleInvoice.returnSaleInvoice.map((returnSaleInvoice) => {
          return returnSaleInvoice.total_amount;
        });
      })
      .flat()
      .reduce((a, b) => a + b, 0);

    // all returnSaleInvoice
    const allReturnSaleInvoice = customersAllInvoice.saleInvoice
      .map((saleInvoice) => {
        return saleInvoice.returnSaleInvoice.map((returnSaleInvoice) => {
          return returnSaleInvoice;
        });
      })
      .flat();
    // get all saleInvoice id
    const allSaleInvoiceId = customersAllInvoice.saleInvoice.map(
      (saleInvoice) => {
        return saleInvoice.id;
      }
    );

    // get all transactions related to saleInvoice id
    const allTransaction = await prisma.transaction.findMany({
      where: {
        type: "sale",
        related_id: {
          in: allSaleInvoiceId,
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
      parseFloat(allSaleInvoiceTotalAmount._sum.total_amount) -
      parseFloat(allSaleInvoiceTotalAmount._sum.discount) -
      parseFloat(sumOfAllReturnSaleInvoice) -
      parseFloat(sumOfAllTransaction);

    // include due_amount in singleCustomer
    singleCustomer.due_amount = due_amount ? due_amount : 0;
    singleCustomer.allReturnSaleInvoice = allReturnSaleInvoice;
    singleCustomer.allTransaction = allTransaction;
    res.json(singleCustomer);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

const updateSingleCustomer = async (req, res) => {
  try {
    const updatedCustomer = await prisma.customer.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
      },
    });
    res.json(updatedCustomer);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

const deleteSingleCustomer = async (req, res) => {
  try {
    const deletedCustomer = await prisma.customer.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        status: req.body.status,
      },
    });
    res.json(deletedCustomer);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

module.exports = {
  createSingleCustomer,
  getAllCustomer,
  getSingleCustomer,
  updateSingleCustomer,
  deleteSingleCustomer,
};
