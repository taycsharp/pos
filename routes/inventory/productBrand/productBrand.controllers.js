const { getPagination } = require("../../../utils/query");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getObjectSignedUrl } = require("../../../utils/s3");

const createSingleProductBrand = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many product_brand at once
      const deletedProductBrand = await prisma.product_brand.deleteMany({
        where: {
          id: {
            in: req.body.map((id) => parseInt(id)),
          },
        },
      });
      res.json(deletedProductBrand);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else if (req.query.query === "createmany") {
    try {
      // create many product_Brand from an array of objects
      const createdProductBrand = await prisma.product_brand.createMany({
        data: req.body.map((product_brand) => {
          return {
            name: product_brand.name,
          };
        }),
        skipDuplicates: true,
      });
      res.json(createdProductBrand);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else {
    try {
      // create single product_brand from an object
      const createdProductBrand = await prisma.product_brand.create({
        data: {
          name: req.body.name,
        },
      });
      res.json(createdProductBrand);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  }
};

const getAllProductBrand = async (req, res) => {
  if (req.query.query === "all") {
    try {
      // get all product_brand
      const getAllProductBrand = await prisma.product_brand.findMany({
        orderBy: {
          id: "asc",
        },
        include: {
          product: true,
        },
      });
      res.json(getAllProductBrand);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      // get all product_brand paginated
      const getAllProductBrand = await prisma.product_brand.findMany({
        orderBy: {
          id: "asc",
        },
        include: {
          product: true,
        },
        skip: parseInt(skip),
        take: parseInt(limit),
      });
      res.json(getAllProductBrand);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  }
};

const getSingleProductBrand = async (req, res) => {
  try {
    const singleProductBrand = await prisma.product_brand.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        product: true,
      },
    });
    //adding image url to product_brand
    for (let product of singleProductBrand.product) {
      if (product.imageName) {
        product.imageUrl = await getObjectSignedUrl(product.imageName);
      }
    }
    res.json(singleProductBrand);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

const updateSingleProductBrand = async (req, res) => {
  try {
    const updatedProductBrand = await prisma.product_brand.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        name: req.body.name,
      },
    });
    res.json(updatedProductBrand);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

const deleteSingleProductBrand = async (req, res) => {
  try {
    const deletedProductBrand = await prisma.product_brand.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });
    res.json(deletedProductBrand);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

module.exports = {
  createSingleProductBrand,
  getAllProductBrand,
  getSingleProductBrand,
  updateSingleProductBrand,
  deleteSingleProductBrand,
};
