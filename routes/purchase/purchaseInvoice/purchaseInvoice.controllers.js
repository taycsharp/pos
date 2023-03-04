const { getPagination } = require("../../../utils/query");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createSinglePurchaseInvoice = async (req, res) => {
  // calculate total purchase price
  let totalPurchasePrice = 0;
  req.body.purchaseInvoiceProduct.forEach((item) => {
    totalPurchasePrice +=
      parseFloat(item.product_purchase_price) *
      parseFloat(item.product_quantity);
  });
  try {
    // convert all incoming data to a specific format.
    const date = new Date(req.body.date).toISOString().split("T")[0];
    // create purchase invoice
    const createdInvoice = await prisma.purchaseInvoice.create({
      data: {
        date: new Date(date),
        total_amount: totalPurchasePrice,
        discount: parseFloat(req.body.discount),
        paid_amount: parseFloat(req.body.paid_amount),
        due_amount:
          totalPurchasePrice -
          parseFloat(req.body.discount) -
          parseFloat(req.body.paid_amount),
        supplier: {
          connect: {
            id: Number(req.body.supplier_id),
          },
        },
        note: req.body.note,
        supplier_memo_no: req.body.supplier_memo_no,
        // map and save all products from request body array of products to database
        purchaseInvoiceProduct: {
          create: req.body.purchaseInvoiceProduct.map((product) => ({
            product: {
              connect: {
                id: Number(product.product_id),
              },
            },
            product_quantity: Number(product.product_quantity),
            product_purchase_price: parseFloat(product.product_purchase_price),
          })),
        },
      },
    });
    // pay on purchase transaction create
    if (req.body.paid_amount > 0) {
      await prisma.transaction.create({
        data: {
          date: new Date(date),
          debit_id: 3,
          credit_id: 1,
          amount: parseFloat(req.body.paid_amount),
          particulars: `Cash paid on Purchase Invoice #${createdInvoice.id}`,
          type: "purchase",
          related_id: createdInvoice.id,
        },
      });
    }
    // if purchase on due then create another transaction
    const due_amount =
      totalPurchasePrice -
      parseFloat(req.body.discount) -
      parseFloat(req.body.paid_amount);
    console.log(due_amount);
    if (due_amount > 0) {
      await prisma.transaction.create({
        data: {
          date: new Date(date),
          debit_id: 3,
          credit_id: 5,
          amount: due_amount,
          particulars: `Due on Purchase Invoice #${createdInvoice.id}`,
        },
      });
    }
    // iterate through all products of this purchase invoice and add product quantity, update product purchase price to database
    req.body.purchaseInvoiceProduct.forEach(async (item) => {
      await prisma.product.update({
        where: {
          id: Number(item.product_id),
        },
        data: {
          quantity: {
            increment: Number(item.product_quantity),
          },
          purchase_price: {
            set: parseFloat(item.product_purchase_price),
          },
        },
      });
    }),
      res.json({
        createdInvoice,
      });
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

const getAllPurchaseInvoice = async (req, res) => {
  if (req.query.query === "info") {
    // get purchase invoice info
    const aggregations = await prisma.purchaseInvoice.aggregate({
      _count: {
        id: true,
      },
      _sum: {
        total_amount: true,
        due_amount: true,
        paid_amount: true,
      },
    });
    res.json(aggregations);
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      // get purchase invoice with pagination and info
      const [aggregations, purchaseInvoices] = await prisma.$transaction([
        // get info of selected parameter data
        prisma.purchaseInvoice.aggregate({
          _count: {
            id: true,
          },
          _sum: {
            total_amount: true,
            due_amount: true,
            paid_amount: true,
          },
          where: {
            date: {
              gte: new Date(req.query.startdate),
              lte: new Date(req.query.enddate),
            },
          },
        }),
        // get purchaseInvoice paginated and by start and end date
        prisma.purchaseInvoice.findMany({
          orderBy: [
            {
              id: "desc",
            },
          ],
          skip: Number(skip),
          take: Number(limit),
          include: {
            supplier: {
              select: {
                name: true,
              },
            },
          },
          where: {
            date: {
              gte: new Date(req.query.startdate),
              lte: new Date(req.query.enddate),
            },
          },
        }),
      ]);
      // modify data to actual data of purchase invoice's current value
      const transactions = await prisma.transaction.findMany({
        where: {
          type: "purchase",
          related_id: {
            in: purchaseInvoices.map((item) => item.id),
          },
        },
      });
      const returnPurchaseInvoice = await prisma.returnPurchaseInvoice.findMany(
        {
          where: {
            purchaseInvoice_id: {
              in: purchaseInvoices.map((item) => item.id),
            },
          },
        }
      );
      // calculate paid amount and due amount of individual purchase invoice from transactions and returnPurchaseInvoice and attach it to purchaseInvoices
      const allPurchaseInvoice = purchaseInvoices.map((item) => {
        const paidAmount = transactions
          .filter((transaction) => transaction.related_id === item.id)
          .reduce((acc, curr) => acc + curr.amount, 0);
        const returnAmount = returnPurchaseInvoice
          .filter(
            (returnPurchaseInvoice) =>
              returnPurchaseInvoice.purchaseInvoice_id === item.id
          )
          .reduce((acc, curr) => acc + curr.total_amount, 0);
        return {
          ...item,
          paid_amount: paidAmount,
          due_amount:
            item.total_amount - item.discount - paidAmount - returnAmount,
        };
      });
      // calculate total paid_amount and due_amount from allPurchaseInvoice and attach it to aggregations
      const totalPaidAmount = allPurchaseInvoice.reduce(
        (acc, curr) => acc + curr.paid_amount,
        0
      );
      const totalDueAmount = allPurchaseInvoice.reduce(
        (acc, curr) => acc + curr.due_amount,
        0
      );
      aggregations._sum.paid_amount = totalPaidAmount;
      aggregations._sum.due_amount = totalDueAmount;

      res.json({
        aggregations,
        allPurchaseInvoice,
      });
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  }
};

const getSinglePurchaseInvoice = async (req, res) => {
  try {
    const singlePurchaseInvoice = await prisma.purchaseInvoice.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        purchaseInvoiceProduct: {
          include: {
            product: true,
          },
        },
        supplier: true,
      },
    });
    const transactions = await prisma.transaction.findMany({
      where: {
        type: "purchase",
        related_id: Number(req.params.id),
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
    const returnPurchaseInvoice = await prisma.returnPurchaseInvoice.findMany({
      where: {
        purchaseInvoice_id: Number(req.params.id),
      },
      include: {
        returnPurchaseInvoiceProduct: {
          include: {
            product: true,
          },
        },
      },
    });
    let status = "UNPAID";
    // sum total amount of all transactions
    const totalPaidAmount = transactions.reduce(
      (acc, item) => acc + item.amount,
      0
    );
    // check if total transaction amount is equal to total_amount - discount - return invoice amount
    const totalReturnAmount = returnPurchaseInvoice.reduce(
      (acc, item) => acc + item.total_amount,
      0
    );
    const dueAmount =
      singlePurchaseInvoice.total_amount -
      singlePurchaseInvoice.discount -
      totalReturnAmount -
      totalPaidAmount;
    if (
      totalPaidAmount ===
      singlePurchaseInvoice.total_amount -
        singlePurchaseInvoice.discount -
        totalReturnAmount
    ) {
      status = "PAID";
    }
    res.json({
      status,
      totalPaidAmount,
      totalReturnAmount,
      dueAmount,
      singlePurchaseInvoice,
      returnPurchaseInvoice,
      transactions,
    });
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

module.exports = {
  createSinglePurchaseInvoice,
  getAllPurchaseInvoice,
  getSinglePurchaseInvoice,
};
