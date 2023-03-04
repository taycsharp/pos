const { getPagination } = require("../../../utils/query");
require("dotenv").config();
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const path = require("path");
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST;

const createSingleProduct = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many product at once
      const deletedProduct = await prisma.product.deleteMany({
        where: {
          id: {
            in: req.body.map((id) => Number(id)),
          },
        },
      });
      res.json(deletedProduct);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else if (req.query.query === "createmany") {
    try {
      // sum all total purchase price
      const totalPurchasePrice = req.body.reduce((acc, cur) => {
        return acc + cur.quantity * cur.purchase_price;
      }, 0);
      // convert incoming data to specific format
      const data = req.body.map((item) => {
        return {
          name: item.name,
          quantity: parseInt(item.quantity),
          purchase_price: parseFloat(item.purchase_price),
          sale_price: parseFloat(item.sale_price),
          product_sub_category_id: parseInt(item.product_sub_category_id),
          product_brand_id: parseInt(item.product_brand_id),
          sku: item.sku,
          unit_measurement: parseFloat(item.unit_measurement),
          unit_type: item.unit_type,
          reorder_quantity: parseInt(item.reorder_quantity),
          status: item.status,
        };
      });
      console.log("data", data);
      // create many product from an array of object
      const createdProduct = await prisma.product.createMany({
        data: data,
        skipDuplicates: true,
      });
      // stock product's account transaction create
      await prisma.transaction.create({
        data: {
          date: new Date(),
          debit_id: 3,
          credit_id: 6,
          amount: totalPurchasePrice,
          particulars: `Initial stock of ${createdProduct.count} item/s of product`,
        },
      });
      res.json(createdProduct);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else {
    try {
      // create one product from an object
      const file = req.file;
      const createdProduct = await prisma.product.create({
        data: {
          name: req.body.name,
          quantity: parseInt(req.body.quantity),
          purchase_price: parseFloat(req.body.purchase_price),
          sale_price: parseFloat(req.body.sale_price),
          thumbnail_image: file.filename,
          product_sub_category: {
            connect: {
              id: Number(req.body.product_sub_category_id),
            },
          },
          product_brand: {
            connect: {
              id: Number(req.body.product_brand_id),
            },
          },
          sku: req.body.sku,
          unit_measurement: parseFloat(req.body.unit_measurement),
          unit_type: req.body.unit_type,
          reorder_quantity: parseInt(req.body.reorder_quantity),
          status: req.body.status,
        },
      });
      createdProduct.thumbnail_image_url = `${HOST}:${PORT}/v1/product-image/${file.filename}`;
      // stock product's account transaction create
      await prisma.transaction.create({
        data: {
          date: new Date(),
          debit_id: 3,
          credit_id: 6,
          amount:
            parseFloat(req.body.purchase_price) * parseInt(req.body.quantity),
          particulars: `Initial stock of product #${createdProduct.id}`,
        },
      });
      res.json(createdProduct);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  }
};

const getAllProduct = async (req, res) => {
  if (req.query.query === "all") {
    try {
      const allProduct = await prisma.product.findMany({
        orderBy: {
          id: "desc",
        },
        include: {
          product_sub_category: {
            select: {
              name: true,
            },
          },
          product_brand: {
            select: {
              name: true,
            },
          },
        },
      });
      // attach signed url to each product
      for (let product of allProduct) {
        if (product.thumbnail_image) {
          product.thumbnail_image_url = `${HOST}:${PORT}/v1/product-image/${product.thumbnail_image}`;
        }
      }
      res.json(allProduct);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else if (req.query.query === "search") {
    try {
      const allProduct = await prisma.product.findMany({
        where: {
          OR: [
            {
              name: {
                contains: req.query.prod,
                mode: "insensitive",
              },
            },
            {
              sku: {
                contains: req.query.prod,
                mode: "insensitive",
              },
            },
          ],
        },
        orderBy: {
          id: "desc",
        },
        include: {
          product_sub_category: {
            select: {
              name: true,
            },
          },
          product_brand: {
            select: {
              name: true,
            },
          },
        },
      });
      // attach signed url to each product
      for (let product of allProduct) {
        if (product.thumbnail_image) {
          product.thumbnail_image_url = `${HOST}:${PORT}/v1/product-image/${product.thumbnail_image}`;
        }
      }
      res.json(allProduct);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else if (req.query.query === "info") {
    const aggregations = await prisma.product.aggregate({
      _count: {
        id: true,
      },
      _sum: {
        quantity: true,
      },
      where: {
        status: true,
      },
    });
    // get all product and calculate all purchase price and sale price
    const allProduct = await prisma.product.findMany();
    const totalPurchasePrice = allProduct.reduce((acc, cur) => {
      return acc + cur.quantity * cur.purchase_price;
    }, 0);
    const totalSalePrice = allProduct.reduce((acc, cur) => {
      return acc + cur.quantity * cur.sale_price;
    }, 0);
    res.json({ ...aggregations, totalPurchasePrice, totalSalePrice });
  } else if (req.query.status === "false") {
    try {
      const { skip, limit } = getPagination(req.query);
      const allProduct = await prisma.product.findMany({
        orderBy: {
          id: "desc",
        },
        where: {
          status: false,
        },
        include: {
          product_sub_category: {
            select: {
              name: true,
            },
          },
          product_brand: {
            select: {
              name: true,
            },
          },
        },
        skip: Number(skip),
        take: Number(limit),
      });
      // attach signed url to each product
      for (let product of allProduct) {
        if (product.thumbnail_image) {
          product.thumbnail_image_url = `${HOST}:${PORT}/v1/product-image/${product.thumbnail_image}`;
        }
      }
      res.json(allProduct);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const allProduct = await prisma.product.findMany({
        orderBy: {
          id: "desc",
        },
        where: {
          status: true,
        },
        include: {
          product_sub_category: {
            select: {
              name: true,
            },
          },
          product_brand: {
            select: {
              name: true,
            },
          },
        },
        skip: Number(skip),
        take: Number(limit),
      });
      // attach signed url to each product
      for (let product of allProduct) {
        if (product.thumbnail_image) {
          product.thumbnail_image_url = `${HOST}:${PORT}/v1/product-image/${product.thumbnail_image}`;
        }
      }
      res.json(allProduct);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const singleProduct = await prisma.product.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        product_sub_category: {
          select: {
            name: true,
          },
        },
        product_brand: {
          select: {
            name: true,
          },
        },
      },
    });
    if (singleProduct && singleProduct.thumbnail_image) {
      singleProduct.thumbnail_image_url = `${HOST}:${PORT}/v1/product-image/${singleProduct.thumbnail_image}`;
    }
    res.json(singleProduct);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

const updateSingleProduct = async (req, res) => {
  try {
    const updatedProduct = await prisma.product.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        name: req.body.name,
        quantity: parseInt(req.body.quantity),
        purchase_price: parseFloat(req.body.purchase_price),
        sale_price: parseFloat(req.body.sale_price),
      },
    });
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

const deleteSingleProduct = async (req, res) => {
  try {
    const deletedProduct = await prisma.product.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        status: req.body.status,
      },
    });
    // TODO: implement delete all image from disk related to this product
    if (deletedProduct && deletedProduct.thumbnail_image) {
      let path = `./routes/inventory/product/uploads/${deletedProduct.thumbnail_image}`;
      console.log("path", path);
      fs.unlink(path, (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log("file deleted");
      });
    }
    res.json(deletedProduct);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

module.exports = {
  createSingleProduct,
  getAllProduct,
  getSingleProduct,
  updateSingleProduct,
  deleteSingleProduct,
};
