const { getPagination } = require("../../../utils/query");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createSingleReturnSaleInvoice = async (req, res) => {
  // calculate total sale price
  let totalSalePrice = 0;
  req.body.returnSaleInvoiceProduct.forEach((item) => {
    totalSalePrice +=
      parseFloat(item.product_sale_price) * parseFloat(item.product_quantity);
  });
  // get all product asynchronously
  const allProduct = await Promise.all(
    req.body.returnSaleInvoiceProduct.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: {
          id: item.product_id,
        },
      });
      return product;
    })
  );
  // iterate over all product and calculate total purchase price
  totalPurchasePrice = 0;
  req.body.returnSaleInvoiceProduct.forEach((item, index) => {
    totalPurchasePrice +=
      allProduct[index].purchase_price * item.product_quantity;
  });
  try {
    // convert all incoming data to a specific format.
    const date = new Date(req.body.date).toISOString().split("T")[0];
    // create purchase invoice
    const createdReturnSaleInvoice = await prisma.returnSaleInvoice.create({
      data: {
        date: new Date(date),
        total_amount: totalSalePrice,
        saleInvoice: {
          connect: {
            id: Number(req.body.saleInvoice_id),
          },
        },
        note: req.body.note,
        // map and save all products from request body array of products to database
        returnSaleInvoiceProduct: {
          create: req.body.returnSaleInvoiceProduct.map((product) => ({
            product: {
              connect: {
                id: Number(product.product_id),
              },
            },
            product_quantity: Number(product.product_quantity),
            product_sale_price: parseFloat(product.product_sale_price),
          })),
        },
      },
    });
    // pay to customer on return sale transaction create
    // TODO: dynamic credit id like bank, cash, etc
    await prisma.transaction.create({
      data: {
        date: new Date(date),
        debit_id: 8,
        credit_id: 1,
        amount: parseFloat(totalSalePrice),
        particulars: `Cash paid on Sale return invoice #${createdReturnSaleInvoice.id} of sale invoice #${req.body.saleInvoice_id}`,
        type: "sale_return",
      },
    });
    // goods received on return sale transaction create
    await prisma.transaction.create({
      data: {
        date: new Date(date),
        debit_id: 3,
        credit_id: 9,
        amount: parseFloat(totalSalePrice),
        particulars: `Cost of sales reduce on return Sale Invoice #${createdReturnSaleInvoice.id} of sale invoice #${req.body.saleInvoice_id}`,
        type: "sale_return",
      },
    });
    // iterate through all products of this return sale invoice and less the product quantity,
    req.body.returnSaleInvoiceProduct.forEach(async (item) => {
      await prisma.product.update({
        where: {
          id: Number(item.product_id),
        },
        data: {
          quantity: {
            increment: Number(item.product_quantity),
          },
        },
      });
    });
    // decrease sale invoice profit by return sale invoice's calculated profit profit
    const returnSaleInvoiceProfit = totalSalePrice - totalPurchasePrice;
    await prisma.saleInvoice.update({
      where: {
        id: Number(req.body.saleInvoice_id),
      },
      data: {
        profit: {
          decrement: returnSaleInvoiceProfit,
        },
      },
    });
    res.json({ createdReturnSaleInvoice });
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

const getAllReturnSaleInvoice = async (req, res) => {
  if (req.query.query === "info") {
    // get sale invoice info
    const aggregations = await prisma.returnSaleInvoice.aggregate({
      _count: {
        id: true,
      },
      _sum: {
        total_amount: true,
      },
    });
    res.json(aggregations);
  } else if (req.query.query === "all") {
    try {
      // get all sale invoice
      const allSaleInvoice = await prisma.returnSaleInvoice.findMany({
        include: {
          saleInvoice: true,
        },
      });
      res.json(allSaleInvoice);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else if (req.query.query === "group") {
    try {
      // get all sale invoice
      const allSaleInvoice = await prisma.returnSaleInvoice.groupBy({
        orderBy: {
          date: "asc",
        },
        by: ["date"],
        _sum: {
          total_amount: true,
        },
        _count: {
          id: true,
        },
      });
      res.json(allSaleInvoice);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else if (req.query.status === "false") {
    try {
      const { skip, limit } = getPagination(req.query);
      const [aggregations, allSaleInvoice] = await prisma.$transaction([
        // get info of selected parameter data
        prisma.returnSaleInvoice.aggregate({
          _count: {
            id: true,
          },
          _sum: {
            total_amount: true,
          },
          where: {
            date: {
              gte: new Date(req.query.startdate),
              lte: new Date(req.query.enddate),
            },
            status: false,
          },
        }),
        // get returnsaleInvoice paginated and by start and end date
        prisma.returnSaleInvoice.findMany({
          orderBy: [
            {
              id: "desc",
            },
          ],
          skip: Number(skip),
          take: Number(limit),
          include: {
            saleInvoice: true,
          },
          where: {
            date: {
              gte: new Date(req.query.startdate),
              lte: new Date(req.query.enddate),
            },
            status: false,
          },
        }),
      ]);
      res.json({ aggregations, allSaleInvoice });
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      // get sale invoice with pagination and info
      const [aggregations, allSaleInvoice] = await prisma.$transaction([
        // get info of selected parameter data
        prisma.returnSaleInvoice.aggregate({
          _count: {
            id: true,
          },
          _sum: {
            total_amount: true,
          },
          where: {
            date: {
              gte: new Date(req.query.startdate),
              lte: new Date(req.query.enddate),
            },
            status: true,
          },
        }),
        // get returnsaleInvoice paginated and by start and end date
        prisma.returnSaleInvoice.findMany({
          orderBy: [
            {
              id: "desc",
            },
          ],
          skip: Number(skip),
          take: Number(limit),
          include: {
            saleInvoice: true,
          },
          where: {
            date: {
              gte: new Date(req.query.startdate),
              lte: new Date(req.query.enddate),
            },
            status: true,
          },
        }),
      ]);
      res.json({ aggregations, allSaleInvoice });
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  }
};

const getSingleReturnSaleInvoice = async (req, res) => {
  try {
    const singleProduct = await prisma.returnSaleInvoice.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        returnSaleInvoiceProduct: {
          include: {
            product: true,
          },
        },
        saleInvoice: true,
      },
    });
    res.json(singleProduct);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

// TODO: update sale invoice: NO UPDATE ALLOWED FOR NOW
const updateSingleReturnSaleInvoice = async (req, res) => {
  try {
    const updatedProduct = await prisma.returnSaleInvoice.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        name: req.body.name,
        quantity: Number(req.body.quantity),
        purchase_price: Number(req.body.purchase_price),
        sale_price: Number(req.body.sale_price),
        note: req.body.note,
      },
    });
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

// on delete purchase invoice, decrease product quantity, customer due amount decrease, transaction create
const deleteSingleReturnSaleInvoice = async (req, res) => {
  try {
    // get purchase invoice details
    const returnSaleInvoice = await prisma.returnSaleInvoice.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        returnSaleInvoiceProduct: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });
    // product quantity decrease
    returnSaleInvoice.returnSaleInvoiceProduct.forEach(async (item) => {
      await prisma.product.update({
        where: {
          id: Number(item.product_id),
        },
        data: {
          quantity: {
            decrement: Number(item.product_quantity),
          },
        },
      });
    });
    // all operations in one transaction
    const [deleteSaleInvoice, customer, transaction] =
      await prisma.$transaction([
        // purchase invoice delete
        prisma.returnSaleInvoice.update({
          where: {
            id: Number(req.params.id),
          },
          data: {
            status: req.body.status,
          },
        }),
        // customer due amount decrease
        // prisma.customer.update({
        // 	where: {
        // 		id: Number(returnPurchaseInvoice.customer_id),
        // 	},
        // 	data: {
        // 		due_amount: {
        // 			decrement: Number(returnPurchaseInvoice.due_amount),
        // 		},
        // 	},
        // }),
        // new transaction will be created
        // prisma.transaction.create({
        // 	data: {
        // 		date: new Date(),
        // 		type: "purchase_deleted",
        // 		related_id: Number(req.params.id),
        // 		amount: parseFloat(returnPurchaseInvoice.paid_amount),
        // 		particulars: "paid amount refunded",
        // 	},
        // }),
      ]);
    res.json({
      deleteSaleInvoice,
      // customer,
      // transaction,
    });
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

module.exports = {
  createSingleReturnSaleInvoice,
  getAllReturnSaleInvoice,
  getSingleReturnSaleInvoice,
  updateSingleReturnSaleInvoice,
  deleteSingleReturnSaleInvoice,
};
