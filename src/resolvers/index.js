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
const axios = require("axios").default;

/*------------------------------- global file paths -------------------------------*/

// Create a variable holding the file path (from computer root directory) to the product file directory
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

// const cartItemsDirectory = path.join(__dirname, "..", "data", "cartItems");

/*------------------------------- resolvers -------------------------------*/

exports.resolvers = {
  /*---------------------- queries -----------------------*/
  Query: {
    getVaseById: async (_, args) => {
      // Place the productId the user sent in a variable called "productId"
      const vaseId = args.vaseId;
      // Create a variable holding the file path (from computer root directory) to the product file we are looking for
      const vaseFilePath = path.join(
        vasesDirectory,
        `${vaseId}.json`
      );

      // Check if the requested product actually exists
      const vaseExists = await fileExists(vaseFilePath);
      // If product does not exist return an error notifying the user of this
      if (!vaseExists)
        return new GraphQLError("That vase does not exist");

      // Read the product file; data will be returned as a JSON string
      const vaseData = await fsPromises.readFile(vaseFilePath, {
        encoding: "utf-8",
      });
      // Parse the returned JSON product data into a JS object
      const data = JSON.parse(vaseData);
      // Return the data
      return data;
    },

    getAllVases: async (_, args) => {
      // Get an array of file names that exist in the products directory (aka a list of all the products we have)
      const allVases = await getDirectoryFileNames(vasesDirectory);

      // Create a variable with an empty array to hold all products data
      const allVasesData = [];

      // For each file found in products...
      for (const file of allVases) {
        // ... create the filepath for that specific file
        const filePath = path.join(vasesDirectory, file);
        // Read the contents of the file; will return a JSON string of the vase data
        const fileContents = await fsPromises.readFile(filePath, {
          encoding: "utf-8",
        });
        // Parse the JSON data from the previous step
        const data = JSON.parse(fileContents);
        // Push the parsed data to the allProductsData array
        allVasesData.push(data);
      }

      // Return the allProductsData array (which should now hold the data for all products)
      return allVasesData;
    },

    getShoppingCartById: async (_, args) => {
      // Place the shoppingCartId the user sent in a variable called "shoppingCartId"
      const shoppingCartId = args.shoppingCartId;
      // Create a variable holding the file path (from computer root directory) to the shoppingCart file we are looking for
      const shoppingCartFilePath = path.join(
        shoppingCartsDirectory,
        `${shoppingCartId}.json`
      );

      // Check if the requested shoppingCart actually exists
      const shoppingCartExists = await fileExists(
        shoppingCartFilePath
      );
      // If shoppingCart does not exist return an error notifying the user of this
      if (!shoppingCartExists)
        return new GraphQLError("That shopping cart does not exist");

      // Read the shoppingCart file; data will be returned as a JSON string
      const shoppingCartData = await fsPromises.readFile(
        shoppingCartFilePath,
        {
          encoding: "utf-8",
        }
      );
      // Parse the returned JSON shoppingCart data into a JS object
      const data = JSON.parse(shoppingCartData);
      // Return the data
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
      // Verify name: om strängen är tom, return:a en error
      if (args.input.name.length === 0)
        return new GraphQLError(
          "Name must be at least 1 character long"
        );

      // Skapa ett unikt id + data objektet
      const newVase = {
        // Generera ett random id (av typ UUID)
        id: crypto.randomUUID(),
        name: args.input.name,
        unitPrice: args.input.unitPrice,
      };

      // Skapa filePath för där vi ska skapa våran fil
      let filePath = path.join(vasesDirectory, `${newVase.id}.json`);

      // Kolla att vårat auto-genererade productId inte har använts förut
      let idExists = true;
      while (idExists) {
        const exists = await fileExists(filePath); // kolla om filen existerar
        console.log(exists, newVase.id);
        // om filen redan existerar generera ett nytt productId och uppdatera filePath
        if (exists) {
          newVase.id = crypto.randomUUID();
          filePath = path.join(vasesDirectory, `${newVase.id}.json`);
        }
        // uppdatera idExists (för att undvika infinite loops)
        idExists = exists;
      }

      // Skapa en fil för produkten i /data/products
      await fsPromises.writeFile(filePath, JSON.stringify(newVase));

      // Return:a våran respons; vårat nyskapade produkt
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
      // check if produkten exists in cart and if so increase quantity:
      for (let x of data.items) {
        if (x.id === productId) {
          x.quantity++;
          itemInCartExist = true;
        }
      }
      // if product is not in cart already:
      if (!itemInCartExist) {
        const productFilePath = path.join(
          vasesDirectory,
          `${productId}.json`
        );
        // Check if the requested prododuct actually exists
        const productExists = await fileExists(productFilePath);
        // If product does not exist return an error notifying the user of this
        if (!productExists)
          return new GraphQLError("That product does not exist");

        // Read the product file; data will be returned as a JSON string
        const productData = await readJsonFile(productFilePath);
        // Parse the returned JSON product data into a JS object

        const cartVase = {
          name: productData.name,
          id: productData.id,
          unitPrice: productData.unitPrice,
          quantity: 1,
        };

        // push newCartItem in to shoppingcart cartitem-list
        data.items.push(cartVase);
      }
      //update totalprice for cart:
      let sum = 0;
      for (let x of data.items) {
        sum += x.quantity * x.unitPrice;
      }

      data.totalprice = sum;
      //update cart:
      await fsPromises.writeFile(cartFilePath, JSON.stringify(data));
      // return updated cart

      console.log(data);

      return data;
    },

    updateVase: async (_, args) => {
      // Hämta alla parametrar från args

      const { id, name, unitPrice } = args;

      // Skapa våran filePath
      const filePath = path.join(vasesDirectory, `${id}.json`);

      // Finns det produkt som de vill ändra?
      // IF (no) return Not Found Error
      const productExists = await fileExists(filePath);
      if (!productExists)
        return new GraphQLError("That product does not exist");

      // Skapa updatedProduct objekt
      const updatedVase = {
        id,
        name,
        unitPrice,
      };

      // Skriv över den gamla filen med nya infon
      await fsPromises.writeFile(
        filePath,
        JSON.stringify(updatedVase)
      );

      // return updatedProduct
      return updatedVase;
    },

    createNewShoppingCart: async (_, args) => {
      // Verify name: om strängen är tom, return:a en error
      // if (args.productsIds === 0)
      //   return new GraphQLError("Shopping cart must include at least 1 item");

      // Skapa ett unikt id + data objektet
      const newCart = {
        // Generera ett random id (av typ UUID)
        cartId: crypto.randomUUID(),
        items: [],
        totalprice: 0,
      };

      // Skapa filePath för där vi ska skapa våran fil
      let filePath = path.join(
        __dirname,
        "..",
        "data",
        "shoppingCart",
        `${newCart.cartId}.json`
      );

      // Kolla att vårat auto-genererade newShoppingCartId inte har använts förut
      // kolla om filen existerar
      let idExists = true;
      while (idExists) {
        const exists = await fileExists(filePath);
        console.log(exists, newCart.cartId);
        // om filen redan existerar generera ett nytt cartId och uppdatera filePath
        if (exists) {
          newCart.cartId = crypto.randomUUID();
          filePath = path.join(
            cartDirectory,
            `${newCart.cartId}.json`
          );
        }
        // uppdatera idExists (för att undvika infinite loops)
        idExists = exists;
      }

      // Skapa en fil för cart i /data/projects
      await fsPromises.writeFile(filePath, JSON.stringify(newCart));

      // Return:a våran respons; vår nya shoppingcart
      return newCart;
    },

    deleteShoppingCart: async (_, args) => {
      const { cartId } = args;

      const cartFilePath = path.join(cartDirectory, `${cartId}.json`);
      // check if file cartexist
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
      // check if produkten already exist in cart and if so reduce quantity and if quantity=0 remove from items-list:

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

      // if product is not in cart already:
      if (!itemInCartExist) {
        return new GraphQLError(
          "This vase does not exist in this cart"
        );
      }
      //update totalprice for cart:
      let sum = 0;
      for (let x of data.items) {
        sum += x.quantity * x.unitPrice;
      }

      data.totalprice = sum;
      //update cart:
      await fsPromises.writeFile(cartFilePath, JSON.stringify(data));
      return data;
    },
  },
};
