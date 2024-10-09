import { Trash } from "lucide-react";
import { useOrderStore } from "../stores/useOrderStore";

const OrderItem = ({ item }) => {
  const { deleteOrder } = useOrderStore();

  return (
    <div className="rounded-lg border p-4 shadow-sm border-gray-700 bg-gray-800 md:p-6">
      <div className="space-y-4">
        {item.products.map((productItem, index) => (
          <div
            key={index}
            className="md:flex md:items-center md:justify-between md:gap-6 md:space-y-0"
          >
            <div className="shrink-0 md:order-1">
              <img
                className="h-20 md:h-32 rounded object-cover"
                src={productItem.product.image}
                alt={productItem.product.name}
              />
            </div>

            <div className="flex items-center justify-between md:order-3 md:justify-end">
              <div className="flex items-center gap-2">
                <p>Quantity: {productItem.quantity}</p>
              </div>

              <div className="text-end md:order-4 md:w-32">
                <p className="text-base font-bold text-emerald-400">
                  Total: ${productItem.product.price}
                </p>
              </div>
            </div>

            <div className="w-full min-w-0 flex-1 space-y-4 md:order-2 md:max-w-md">
              <p className="text-base font-medium text-white hover:text-emerald-400 hover:underline">
                {productItem.product.name}
              </p>
              <p className="text-sm text-gray-400">
                {productItem.product.description}
              </p>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-4 mt-4">
          <p className="text-sm text-gray-400">Delete this record:</p>
          <button
            className="inline-flex items-center text-sm font-medium text-red-400
              hover:text-red-300 hover:underline"
            onClick={() => deleteOrder(item._id)}
          >
            <Trash />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderItem;
