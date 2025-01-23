// const paypal = require("../../helpers/paypal");
// const Order = require("../../models/Order");
// const Cart = require("../../models/Cart");
// const Product = require("../../models/Product");

// const createOrder = async (req, res) => {
//   try {
//     const {
//       userId,
//       cartItems,
//       addressInfo,
//       orderStatus,
//       paymentMethod,
//       paymentStatus,
//       totalAmount,
//       orderDate,
//       orderUpdateDate,
//       paymentId,
//       payerId,
//       cartId,
//     } = req.body;

//     const create_payment_json = {
//       intent: "sale",
//       payer: {
//         payment_method: "paypal",
//       },
//       redirect_urls: {
//         return_url: "http://localhost:5173/shop/paypal-return",
//         cancel_url: "http://localhost:5173/shop/paypal-cancel",
//       },
//       transactions: [
//         {
//           item_list: {
//             items: cartItems.map((item) => ({
//               name: item.title,
//               sku: item.productId,
//               price: item.price.toFixed(2),
//               currency: "USD",
//               quantity: item.quantity,
//             })),
//           },
//           amount: {
//             currency: "USD",
//             total: totalAmount.toFixed(2),
//           },
//           description: "description",
//         },
//       ],
//     };

//     paypal.payment.create(create_payment_json, async (error, paymentInfo) => {
//       if (error) {
//         console.log(error);

//         return res.status(500).json({
//           success: false,
//           message: "Error while creating paypal payment",
//         });
//       } else {
//         const newlyCreatedOrder = new Order({
//           userId,
//           cartId,
//           cartItems,
//           addressInfo,
//           orderStatus,
//           paymentMethod,
//           paymentStatus,
//           totalAmount,
//           orderDate,
//           orderUpdateDate,
//           paymentId,
//           payerId,
//         });

//         await newlyCreatedOrder.save();

//         const approvalURL = paymentInfo.links.find(
//           (link) => link.rel === "approval_url"
//         ).href;

//         res.status(201).json({
//           success: true,
//           approvalURL,
//           orderId: newlyCreatedOrder._id,
//         });
//       }
//     });
//   } catch (e) {
//     console.log(e);
//     res.status(500).json({
//       success: false,
//       message: "Some error occured!",
//     });
//   }
// };

// const capturePayment = async (req, res) => {
//   try {
//     const { paymentId, payerId, orderId } = req.body;

//     let order = await Order.findById(orderId);

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order can not be found",
//       });
//     }

//     order.paymentStatus = "paid";
//     order.orderStatus = "confirmed";
//     order.paymentId = paymentId;
//     order.payerId = payerId;

//     for (let item of order.cartItems) {
//       let product = await Product.findById(item.productId);

//       if (!product) {
//         return res.status(404).json({
//           success: false,
//           message: `Not enough stock for this product ${product.title}`,
//         });
//       }

//       product.totalStock -= item.quantity;

//       await product.save();
//     }

//     const getCartId = order.cartId;
//     await Cart.findByIdAndDelete(getCartId);

//     await order.save();

//     res.status(200).json({
//       success: true,
//       message: "Order confirmed",
//       data: order,
//     });
//   } catch (e) {
//     console.log(e);
//     res.status(500).json({
//       success: false,
//       message: "Some error occured!",
//     });
//   }
// };

// const getAllOrdersByUser = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const orders = await Order.find({ userId });

//     if (!orders.length) {
//       return res.status(404).json({
//         success: false,
//         message: "No orders found!",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: orders,
//     });
//   } catch (e) {
//     console.log(e);
//     res.status(500).json({
//       success: false,
//       message: "Some error occured!",
//     });
//   }
// };

// const getOrderDetails = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const order = await Order.findById(id);

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found!",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: order,
//     });
//   } catch (e) {
//     console.log(e);
//     res.status(500).json({
//       success: false,
//       message: "Some error occured!",
//     });
//   }
// };

// module.exports = {
//   createOrder,
//   capturePayment,
//   getAllOrdersByUser,
//   getOrderDetails,
// };

// const stripe = require("../../helpers/stripe"); // Import your configured Stripe instance
// const Order = require("../../models/Order");
// const Cart = require("../../models/Cart");
// const Product = require("../../models/Product");

// const createOrder = async (req, res) => {
//   try {
//     const {
//       userId,
//       cartItems,
//       addressInfo,
//       orderStatus,
//       paymentMethod,
//       paymentStatus,
//       totalAmount,
//       orderDate,
//       orderUpdateDate,
//       cartId,
//     } = req.body;

//     // Create Stripe Payment Intent
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: Math.round(totalAmount * 100), // Convert to smallest currency unit (e.g., cents for USD)
//       currency: "usd",
//       payment_method_types: ["card"], // Adjust as needed
//       metadata: {
//         userId,
//         cartId,
//       },
//     });

//     // Save order details (without confirmation yet)
//     const newlyCreatedOrder = new Order({
//       userId,
//       cartId,
//       cartItems,
//       addressInfo,
//       orderStatus,
//       paymentMethod: "stripe",
//       paymentStatus: "pending",
//       totalAmount,
//       orderDate,
//       orderUpdateDate,
//       paymentId: paymentIntent.id,
//     });

//     await newlyCreatedOrder.save();

//     res.status(201).json({
//       success: true,
//       clientSecret: paymentIntent.client_secret, // Pass the client secret to the frontend
//       orderId: newlyCreatedOrder._id,
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({
//       success: false,
//       message: "Error while creating Stripe payment intent",
//     });
//   }
// };

// const capturePayment = async (req, res) => {
//   try {
//     const { paymentId, orderId } = req.body;

//     let order = await Order.findById(orderId);

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order cannot be found",
//       });
//     }

//     // Retrieve payment intent to verify status
//     const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);

//     if (paymentIntent.status !== "succeeded") {
//       return res.status(400).json({
//         success: false,
//         message: "Payment not completed",
//       });
//     }

//     // Update order and reduce product stock
//     order.paymentStatus = "paid";
//     order.orderStatus = "confirmed";

//     for (let item of order.cartItems) {
//       let product = await Product.findById(item.productId);

//       if (!product) {
//         return res.status(404).json({
//           success: false,
//           message: `Product ${item.productId} not found`,
//         });
//       }

//       if (product.totalStock < item.quantity) {
//         return res.status(400).json({
//           success: false,
//           message: `Not enough stock for product ${product.title}`,
//         });
//       }

//       product.totalStock -= item.quantity;
//       await product.save();
//     }

//     const getCartId = order.cartId;
//     await Cart.findByIdAndDelete(getCartId);

//     await order.save();

//     res.status(200).json({
//       success: true,
//       message: "Order confirmed",
//       data: order,
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({
//       success: false,
//       message: "Some error occurred!",
//     });
//   }
// };

// const getAllOrdersByUser = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const orders = await Order.find({ userId });

//     if (!orders.length) {
//       return res.status(404).json({
//         success: false,
//         message: "No orders found!",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: orders,
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({
//       success: false,
//       message: "Some error occurred!",
//     });
//   }
// };

// const getOrderDetails = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const order = await Order.findById(id);

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found!",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: order,
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({
//       success: false,
//       message: "Some error occurred!",
//     });
//   }
// };

// module.exports = {
//   createOrder,
//   capturePayment,
//   getAllOrdersByUser,
//   getOrderDetails,
// };

const stripe = require("../../helpers/stripe"); // Import your configured Stripe instance
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");

const createOrder = async (req, res) => {
  try {
    const {
      userId,
      cartItems,
      addressInfo,
      totalAmount,
      cartId,
    } = req.body;

    if (!userId || !cartItems || !addressInfo || !totalAmount || !cartId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields to create an order",
      });
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to smallest currency unit
      currency: "usd",
      payment_method_types: ["card"],
      metadata: { userId, cartId },
    });

    // Save order details (initial status)
    const newlyCreatedOrder = new Order({
      userId,
      cartId,
      cartItems,
      addressInfo,
      orderStatus: "confirmed",
      paymentMethod: "stripe",
      paymentStatus: "pending",
      totalAmount,
      orderDate: new Date(),
      orderUpdateDate: new Date(),
      paymentId: paymentIntent.id,
    });

    await newlyCreatedOrder.save();

    res.status(201).json({
      success: true,
      clientSecret: paymentIntent.client_secret, // Pass to frontend
      orderId: newlyCreatedOrder._id,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Error while creating Stripe payment intent",
    });
  }
};

const capturePayment = async (req, res) => {
  try {
    const { paymentId, orderId } = req.body;

    if (!paymentId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID and Order ID are required",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Retrieve payment intent to verify payment status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed or failed",
      });
    }

    // Update order and reduce product stock
    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";

    // Reduce product stock using Promise.all for efficiency
    await Promise.all(
      order.cartItems.map(async (item) => {
        const product = await Product.findById(item.productId);

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        if (product.totalStock < item.quantity) {
          throw new Error(
            `Insufficient stock for product ${product.title}`
          );
        }

        product.totalStock -= item.quantity;
        await product.save();
      })
    );

    // Delete cart after successful order
    await Cart.findByIdAndDelete(order.cartId);

    // Save updated order
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order confirmed and payment captured",
      data: order,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: e.message || "An error occurred while capturing payment",
    });
  }
};

const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const orders = await Order.find({ userId });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found for this user",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Error while fetching orders",
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Error while fetching order details",
    });
  }
};

module.exports = {
  createOrder,
  capturePayment,
  getAllOrdersByUser,
  getOrderDetails,
};
