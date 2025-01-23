import Address from "@/components/shopping-view/address";
import img from "../../assets/account.jpg";
import { useDispatch, useSelector } from "react-redux";
import UserCartItemsContent from "@/components/shopping-view/cart-items-content";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createNewOrder } from "@/store/shop/order-slice";
import { useToast } from "@/components/ui/use-toast";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { clearCart } from "@/store/shop/cart-slice";

function ShoppingCheckout() {
  const { cartItems } = useSelector((state) => state.shopCart);
  const { user } = useSelector((state) => state.auth);
  const [currentSelectedAddress, setCurrentSelectedAddress] = useState(null);
  const [isPaymentStart, setIsPaymemntStart] = useState(false);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();

  const totalCartAmount =
    cartItems && cartItems.items && cartItems.items.length > 0
      ? cartItems.items.reduce(
          (sum, currentItem) =>
            sum +
            (currentItem?.salePrice > 0
              ? currentItem?.salePrice
              : currentItem?.price) *
              currentItem?.quantity,
          0
        )
      : 0;
  async function handleInitiateStripePayment() {
    if (cartItems.length === 0) {
      toast({
        title: "Your cart is empty. Please add items to proceed.",
        variant: "destructive",
      });
      return;
    }

    if (currentSelectedAddress === null) {
      toast({
        title: "Please select one address to proceed.",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      userId: user?.id,
      cartId: cartItems?._id,
      cartItems: cartItems.items.map((singleCartItem) => ({
        productId: singleCartItem?.productId,
        title: singleCartItem?.title,
        image: singleCartItem?.image,
        price:
          singleCartItem?.salePrice > 0
            ? singleCartItem?.salePrice
            : singleCartItem?.price,
        quantity: singleCartItem?.quantity,
      })),
      addressInfo: {
        addressId: currentSelectedAddress?._id,
        address: currentSelectedAddress?.address,
        city: currentSelectedAddress?.city,
        pincode: currentSelectedAddress?.pincode,
        phone: currentSelectedAddress?.phone,
        notes: currentSelectedAddress?.notes,
      },
      orderStatus: "pending",
      paymentMethod: "stripe",
      paymentStatus: "pending",
      totalAmount: totalCartAmount,
      orderDate: new Date(),
      orderUpdateDate: new Date(),
    };

    dispatch(createNewOrder(orderData)).then(async (data) => {
      if (data?.payload?.success) {
        const { clientSecret, orderId } = data.payload;

        // Store orderId in session storage for later reference
        sessionStorage.setItem("currentOrderId", JSON.stringify(orderId));

        setIsPaymemntStart(true);

        const cardElement = elements.getElement(CardElement);

        const paymentResult = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: user?.name,
              email: user?.email,
            },
          },
        });

        if (paymentResult.error) {
          toast({
            title: "Payment failed. Please try again.",
            description: paymentResult.error.message,
            variant: "destructive",
          });
          setIsPaymemntStart(false);
        } else if (paymentResult.paymentIntent.status === "succeeded") {
          toast({
            title: "Payment successful!",
            description: "Clearing your cart...",
          });

          // Clear the cart
          dispatch(clearCart(user?.id)).then((clearResponse) => {
            if (clearResponse?.payload?.success) {
              toast({
                title: "Cart cleared successfully.",
                description: "Redirecting to the order page...",
              });

              // Redirect to success page
              window.location.href = "/shop/payment-success";
            } else {
              toast({
                title: "Error clearing cart.",
                description: "Please try again.",
                variant: "destructive",
              });
            }
          });
        }
      } else {
        toast({
          title: "Order creation failed. Please try again.",
          variant: "destructive",
        });
        setIsPaymemntStart(false);
      }
    });
  }



  return (
    <div className="flex flex-col">
      <div className="relative h-[300px] w-full overflow-hidden">
        <img src={img} className="h-full w-full object-cover object-center" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 p-5">
        <Address
          selectedId={currentSelectedAddress}
          setCurrentSelectedAddress={setCurrentSelectedAddress}
        />
        <div className="flex flex-col gap-4">
          {cartItems && cartItems.items && cartItems.items.length > 0
            ? cartItems.items.map((item) => (
                <UserCartItemsContent cartItem={item} key={item.productId} />
              ))
            : null}
          <div className="mt-8 space-y-4">
            <div className="flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold">${totalCartAmount}</span>
            </div>
          </div>
          <div className="mt-4 w-full">
            <CardElement />
            <Button
              onClick={handleInitiateStripePayment}
              className="w-full mt-4"
              disabled={!stripe || isPaymentStart}
            >
              {isPaymentStart
                ? "Processing Payment..."
                : "Checkout with Stripe"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCheckout;
