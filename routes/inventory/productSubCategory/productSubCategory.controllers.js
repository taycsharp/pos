const { getPagination } = require("../../../utils/query");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getObjectSignedUrl } = require("../../../utils/s3");

const createSingleProductSubCategory = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many product_sub_category at once
      const deletedProductSubCategory =
        await prisma.product_sub_category.deleteMany({
          where: {
            id: {
              in: req.body.map((id) => parseInt(id)),
            },
          },
        });
      res.json(deletedProductSubCategory);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
    // TODO: create many product_sub_category bug fix
  } else if (req.query.query === "createmany") {
    try {
      // create many product_sub_category from an array of objects
      const createdProductSubCategory =
        await prisma.product_sub_category.createMany({
          data: req.body.map((productSubCategory) => {
            return {
              name: productSubCategory.name,
              product_category_id: parseInt(
                productSubCategory.product_category_id
              ),
            };
          }),
          skipDuplicates: true,
        });
      res.json(createdProductSubCategory);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else {
    try {
      // create single product_category from an object
      const createdProductSubCategory =
        await prisma.product_sub_category.create({
          data: {
            name: req.body.name,
            product_category: {
              connect: {
                id: parseInt(req.body.product_category_id),
              },
            },
          },
        });
      res.json(createdProductSubCategory);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  }
};

const getAllProductSubCategory = async (req, res) => {
  if (req.query.query === "all") {
    try {
      // get all product_sub_category
      const getAllProductSubCategory =
        await prisma.product_sub_category.findMany({
          orderBy: {
            id: "asc",
          },
          include: {
            product: true,
          },
        });
      res.json(getAllProductSubCategory);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      // get all product_sub_category paginated
      const getAllProductSubCategory =
        await prisma.product_sub_category.findMany({
          orderBy: {
            id: "asc",
          },
          include: {
            product: true,
          },
          skip: parseInt(skip),
          take: parseInt(limit),
        });
      res.json(getAllProductSubCategory);
    } catch (error) {
      res.status(400).json(error.message);
      console.log(error.message);
    }
  }
};

const getSingleProductSubCategory = async (req, res) => {
  try {
    const singleProductSubCategory =
      await prisma.product_sub_category.findUnique({
        where: {
          id: parseInt(req.params.id),
        },
        include: {
          product: true,
        },
      });
    //adding image url to product_sub_category
    for (let product of singleProductSubCategory.product) {
      if (product.imageName) {
        product.imageUrl = await getObjectSignedUrl(product.imageName);
      }
    }
    res.json(singleProductSubCategory);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

const updateSingleProductSubCategory = async (req, res) => {
  try {
    const updatedProductSubCategory = await prisma.product_sub_category.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        name: req.body.name,
      },
    });
    res.json(updatedProductSubCategory);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

const deleteSingleProductSubCategory = async (req, res) => {
  try {
    const deletedProductCategory = await prisma.product_category.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });
    res.json(deletedProductCategory);
  } catch (error) {
    res.status(400).json(error.message);
    console.log(error.message);
  }
};

module.exports = {
  createSingleProductSubCategory,
  getAllProductSubCategory,
  getSingleProductSubCategory,
  updateSingleProductSubCategory,
  deleteSingleProductSubCategory,
};
