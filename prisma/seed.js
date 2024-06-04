const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const saltRounds = 10;

const endpoints = [
  "paymentPurchaseInvoice",
  "paymentSaleInvoice",
  "returnSaleInvoice",
  "purchaseInvoice",
  "returnPurchaseInvoice",
  "rolePermission",
  "saleInvoice",
  "transaction",
  "permission",
  "dashboard",
  "customer",
  "supplier",
  "product",
  "user",
  "role",
  "designation",
  "productCategory",
  "account",
  "setting",
  "productSubCategory",
  "productBrand",
];

const permissionTypes = ["create", "read", "update", "delete"];

// create permissions for each endpoint by combining permission type and endpoint name
const permissions = endpoints.reduce((acc, cur) => {
  const permission = permissionTypes.map((type) => {
    return `${type}-${cur}`;
  });
  return [...acc, ...permission];
}, []);

const roles = ["admin", "staff"];

const account = [
  { name: "Asset", type: "Asset" },
  { name: "Liability", type: "Liability" },
  { name: "Capital", type: "Owner's Equity" },
  { name: "Withdrawal", type: "Owner's Equity" },
  { name: "Revenue", type: "Owner's Equity" },
  { name: "Expense", type: "Owner's Equity" },
];

const subAccount = [
  { account_id: 1, name: "Cash" },
  { account_id: 1, name: "Bank" },
  { account_id: 1, name: "Inventory" },
  { account_id: 1, name: "Accounts Receivable" },
  { account_id: 2, name: "Accounts Payable" },
  { account_id: 3, name: "Capital" },
  { account_id: 4, name: "Withdrawal" },
  { account_id: 5, name: "Sales" },
  { account_id: 6, name: "Cost of Sales" },
  { account_id: 6, name: "Salary" },
  { account_id: 6, name: "Rent" },
  { account_id: 6, name: "Utilities" },
  { account_id: 5, name: "Discount Earned" },
  { account_id: 6, name: "Discount Given" },
];

const settings = {
  company_name: "My Company",
  address: "My Address",
  phone: "My Phone",
  email: "My Email",
  website: "My Website",
  footer: "My Footer",
  tag_line: "My Tag Line",
};

async function main() {
  const adminHash = await bcrypt.hash("admin", saltRounds);
  const staffHash = await bcrypt.hash("staff", saltRounds);
  await prisma.user.create({
    data: {
      username: "admin",
      password: adminHash,
      role: "admin",
    },
  });
  await prisma.user.create({
    data: {
      username: "staff",
      password: staffHash,
      role: "staff",
    },
  });
  await prisma.permission.createMany({
    data: permissions.map((permission) => {
      return {
        name: permission,
      };
    }),
  });
  await prisma.role.createMany({
    data: roles.map((role) => {
      return {
        name: role,
      };
    }),
  });
  for (let i = 1; i <= permissions.length; i++) {
    await prisma.rolePermission.create({
      data: {
        role: {
          connect: {
            id: 1,
          },
        },
        permission: {
          connect: {
            id: i,
          },
        },
      },
    });
  }
  await prisma.account.createMany({
    data: account,
  });
  await prisma.subAccount.createMany({
    data: subAccount,
  });
  await prisma.appSetting.create({
    data: settings,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
