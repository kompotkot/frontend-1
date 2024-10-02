import http from "../utils/httpMoonstream";

const API = process.env.NEXT_PUBLIC_MOONSTREAM_API_URL;

export const getTypes = () =>
  http({
    method: "GET",
    url: `${API}/subscriptions/types`,
  });

export const getSubscriptions = () =>
  http({
    method: "GET",
    url: `${API}/subscriptions/?limit=500`,
  });

export const create = ({
  address,
  note,
  blockchain,
}: {
  address: string;
  note: string;
  blockchain: string;
}) => {
  const data = new FormData();
  data.append("address", address);
  data.append("note", note);
  data.append("blockchain", blockchain);
  return http({
    method: "POST",
    url: `${API}/subscriptions/`,
    data,
  });
};

export const deleteJournal = (id: number) => () =>
  http({
    method: "DELETE",
    url: `${API}/journals/${id}`,
  });

export const createSubscription =
  () =>
  ({
    address,
    type,
    label,
    color,
    abi,
    customerId,
  }: {
    address: string;
    type: string;
    label: string;
    color: string;
    abi?: string;
    customerId?: string;
  }) => {
    const data = new FormData();
    data.append("address", address);
    data.append("subscription_type_id", type);
    data.append("color", color);
    data.append("label", label);
    if (abi) {
      data.append("abi", abi);
    }
    // Check if customerId is uuid
    if (customerId && customerId.length === 36) {
      data.append("customer_id", customerId);
    }
    return http({
      method: "POST",
      url: `${API}/subscriptions/`,
      data,
    });
  };

export const modifySubscription =
  () =>
  ({ id, label, color, abi }: { id: string; label?: string; color?: string; abi?: string }) => {
    const data = new FormData();
    color && data.append("color", color);
    label && data.append("label", label);
    abi && data.append("abi", abi);
    return http({
      method: "PUT",
      url: `${API}/subscriptions/${id}`,
      data,
    });
  };

export const deleteSubscription = () => (id: string) => {
  return http({
    method: "DELETE",
    url: `${API}/subscriptions/${id}`,
  });
};

export const getSubscriptionABI = (id: string) => () => {
  return http({
    method: "GET",
    url: `${API}/subscriptions/${id}/abi`,
  });
};

export const getSubscription = (id: string) =>
  http({
    method: "GET",
    url: `${API}/subscriptions/${id}`,
  });
