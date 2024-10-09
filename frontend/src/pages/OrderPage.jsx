import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useOrderStore } from "../stores/useOrderStore";
import { motion } from "framer-motion";
import { Scroll } from "lucide-react";

import OrderItem from "../components/OrderItem";
const OrderPage = () => {
  const { order, getOrders, deleteOrder } = useOrderStore();

  useEffect(() => {
    getOrders();
  }, [getOrders]);

  return (
    <div className="py-8 md:py-16">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <div className="mt-6 sm:mt-8 md:gap-6 lg:flex lg:items-start xl:gap-8">
          <motion.div
            className="mx-auto w-full flex-none lg:max-w-2xl xl:max-w-4xl"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold text-white mb-8 text-center">
              My Orders
            </h1>
            {order.length === 0 ? (
              <EmptyCartUI />
            ) : (
              <div className="space-y-6">
                {order.map((item) => (
                  <OrderItem key={item._id} item={item} />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;

const EmptyCartUI = () => (
  <motion.div
    className="flex flex-col items-center justify-center space-y-4 py-16"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Scroll className="h-24 w-24 text-gray-300" />
    <h3 className="text-2xl font-semibold ">You have no past orders</h3>
    <p className="text-gray-400">
      Looks like you {"haven't"} bought anything yet.
    </p>
    <Link
      className="mt-4 rounded-md bg-emerald-500 px-6 py-2 text-white transition-colors hover:bg-emerald-600"
      to="/"
    >
      Start Shopping
    </Link>
  </motion.div>
);
