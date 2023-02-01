/*------------------------------- imports -------------------------------*/

const path = require("path");
const fsPromises = require("fs/promises");
const {
  fileExists,
  readJsonFile,
  deleteFile,
  getDirectoryFileNames,
} = require("../utils/fileHandling");
const { GraphQLError } = require("graphql");
const crypto = require("crypto");

/*------------------------------- global file paths -------------------------------*/

// variable holding the file paths (from computer root directory)
const vasesDirectory = path.join(
  __dirname,
  "..",
  "data",
  "originalVases"
);
const cartDirectory = path.join(
  __dirname,
  "..",
  "data",
  "shoppingCart"
);

/*------------------------------- resolvers -------------------------------*/

exports.resolvers = {
  /*---------------------- queries -----------------------*/
  Query: {
    getVaseById: async (_, args) => {
      const vaseId = args.vaseId;

      const vaseFilePath = path.join(
        vasesDirectory,
        `${vaseId}.json`
      );

      const vaseExists = await fileExists(vaseFilePath);

      if (!vaseExists)
        return new GraphQLError("That vase does not exist");

      const vaseData = await fsPromises.readFile(vaseFilePath, {
        encoding: "utf-8",
      });

      const data = JSON.parse(vaseData);

      return data;
    },

    getAllVases: async (_, args) => {
      const allVases = await getDirectoryFileNames(vasesDirectory);

      const allVasesData = [];

      for (const file of allVases) {
        const filePath = path.join(vasesDirectory, file);

        const fileContents = await fsPromises.readFile(filePath, {
          encoding: "utf-8",
        });

        const data = JSON.parse(fileContents);

        allVasesData.push(data);
      }

      return allVasesData;
    },

    getShoppingCartById: async (_, args) => {
      const shoppingCartId = args.shoppingCartId;

      const shoppingCartFilePath = path.join(
        shoppingCartsDirectory,
        `${shoppingCartId}.json`
      );

      const shoppingCartExists = await fileExists(
        shoppingCartFilePath
      );

      if (!shoppingCartExists)
        return new GraphQLError("That shopping cart does not exist");

      const shoppingCartData = await fsPromises.readFile(
        shoppingCartFilePath,
        {
          encoding: "utf-8",
        }
      );

      const data = JSON.parse(shoppingCartData);

      return data;
    },

    getAllShoppingCarts: async (_) => {
      // Get an array of file names that exist in the ShoppingCarts directory (aka a list of all the ShoppingCarts we have)
      const allShoppingCarts = await getDirectoryFileNames(
        shoppingCartsDirectory
      );

      // Create a variable with an empty array to hold all ShoppingCarts data
      const allShoppingCartsData = [];

      // For each file found in ShoppingCarts...
      for (const file of allShoppingCarts) {
        // ... create the filepath for that specific file
        const filePath = path.join(vasesDirectory, file);
        // Read the contents of the file; will return a JSON string of the ShoppingCarts data
        const fileContents = await fsPromises.readFile(filePath, {
          encoding: "utf-8",
        });
        // Parse the JSON data from the previous step
        const data = JSON.parse(fileContents);
        // Push the parsed data to the allShoppingCartsData array
        allShoppingCartsData.push(data);
      }

      // Return the allShoppingCartsData array (which should now hold the data for all ShoppingCarts)
      return allShoppingCartsData;
    },
  },

  /*---------------------- mutations -----------------------*/

  Mutation: {
    createVase: async (_, args) => {
      if (args.input.name.length === 0)
        return new GraphQLError(
          "Name must be at least 1 character long"
        );

      const newVase = {
        id: crypto.randomUUID(),
        name: args.input.name,
        unitPrice: args.input.unitPrice,
      };

      let filePath = path.join(vasesDirectory, `${newVase.id}.json`);

      let idExists = true;
      while (idExists) {
        const exists = await fileExists(filePath);
        console.log(exists, newVase.id);

        if (exists) {
          newVase.id = crypto.randomUUID();
          filePath = path.join(vasesDirectory, `${newVase.id}.json`);
        }

        idExists = exists;
      }

      await fsPromises.writeFile(filePath, JSON.stringify(newVase));

      return newVase;
    },

    addItemToCart: async (_, args) => {
      const { cartId, productId } = args;

      const cartFilePath = path.join(cartDirectory, `${cartId}.json`);
      const cartExists = await fileExists(cartFilePath);

      if (!cartExists)
        return new GraphQLError("That cart does not exist");

      const data = await readJsonFile(cartFilePath);

      let itemInCartExist = false;

      for (let x of data.items) {
        if (x.id === productId) {
          x.quantity++;
          itemInCartExist = true;
        }
      }

      if (!itemInCartExist) {
        const productFilePath = path.join(
          vasesDirectory,
          `${productId}.json`
        );

        const productExists = await fileExists(productFilePath);

        if (!productExists)
          return new GraphQLError("That product does not exist");

        const productData = await readJsonFile(productFilePath);

        const cartVase = {
          name: productData.name,
          id: productData.id,
          unitPrice: productData.unitPrice,
          quantity: 1,
        };

        data.items.push(cartVase);
      }

      let sum = 0;
      for (let x of data.items) {
        sum += x.quantity * x.unitPrice;
      }

      data.totalprice = sum;

      await fsPromises.writeFile(cartFilePath, JSON.stringify(data));

      console.log(data);

      return data;
    },

    updateVase: async (_, args) => {
      const { id, name, unitPrice } = args;

      const filePath = path.join(vasesDirectory, `${id}.json`);

      const productExists = await fileExists(filePath);
      if (!productExists)
        return new GraphQLError("That product does not exist");

      const updatedVase = {
        id,
        name,
        unitPrice,
      };

      await fsPromises.writeFile(
        filePath,
        JSON.stringify(updatedVase)
      );

      return updatedVase;
    },

    createNewShoppingCart: async (_, args) => {
      const newCart = {
        cartId: crypto.randomUUID(),
        items: [],
        totalprice: 0,
      };

      let filePath = path.join(
        __dirname,
        "..",
        "data",
        "shoppingCart",
        `${newCart.cartId}.json`
      );

      let idExists = true;
      while (idExists) {
        const exists = await fileExists(filePath);
        console.log(exists, newCart.cartId);

        if (exists) {
          newCart.cartId = crypto.randomUUID();
          filePath = path.join(
            cartDirectory,
            `${newCart.cartId}.json`
          );
        }

        idExists = exists;
      }

      await fsPromises.writeFile(filePath, JSON.stringify(newCart));

      return newCart;
    },

    deleteShoppingCart: async (_, args) => {
      const { cartId } = args;

      const cartFilePath = path.join(cartDirectory, `${cartId}.json`);

      const cartExists = await fileExists(cartFilePath);

      if (!cartExists)
        return new GraphQLError("That cart does not exist");

      try {
        await deleteFile(cartFilePath);
      } catch (error) {
        return {
          deletedId: cartId,
          success: false,
        };
      }

      return {
        deletedId: cartId,
        success: true,
      };
    },

    removeItemFromCart: async (_, args) => {
      const { cartId, cartItemId } = args;

      const cartFilePath = path.join(cartDirectory, `${cartId}.json`);
      const cartExists = await fileExists(cartFilePath);
      if (!cartExists)
        return new GraphQLError("That cart does not exist");

      const data = await readJsonFile(cartFilePath);

      let itemInCartExist = false;

      for (let i = 0; i < data.items.length; i++) {
        if (data.items[i].id === cartItemId) {
          data.items[i].quantity--;
          itemInCartExist = true;
          if (data.items[i].quantity === 0) {
            console.log(data.items[i].quantity);
            data.items.splice(i, 1);
          }
        }
      }

      if (!itemInCartExist) {
        return new GraphQLError(
          "This vase does not exist in this cart"
        );
      }

      let sum = 0;
      for (let x of data.items) {
        sum += x.quantity * x.unitPrice;
      }

      data.totalprice = sum;

      await fsPromises.writeFile(cartFilePath, JSON.stringify(data));
      return data;
    },
  },
};
