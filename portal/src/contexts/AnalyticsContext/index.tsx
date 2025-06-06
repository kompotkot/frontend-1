import { createContext, useContext, useState } from "react";

import { useQuery } from "react-query";
import useUser from "../../contexts/UserContext";

import queryCacheProps from "../../hooks/hookCommon";
import useMoonToast from "../../hooks/useMoonToast";
import { SubscriptionsService, DatabaseService } from "../../services";
import http from "../../utils/httpMoonstream";

type AnalyticsContextType = {
  addresses: any;
  queries: any;
  databases: any;
  isShowContracts: boolean;
  setIsShowContracts: (arg0: boolean) => void;
  filter: string;
  setFilter: (arg0: string) => void;
  selectedAddressId: number;
  setSelectedAddressId: (arg0: number) => void;
  blockchains: any;
  isCreatingAddress: boolean;
  setIsCreatingAddress: (arg0: boolean) => void;
  isEditingContract: boolean;
  setIsEditingContract: (arg0: boolean) => void;
  selectedQueryId: number;
  setSelectedQueryId: (arg0: number) => void;
  reset: () => void;
  templates: any;
};

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined); //TODO

export const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  const [isShowContracts, setIsShowContracts] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState(0);
  const [selectedQueryId, setSelectedQueryId] = useState(0);
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);
  const [isEditingContract, setIsEditingContract] = useState(false);
  const { user } = useUser();

  const reset = () => {
    setSelectedAddressId(0);
    setSelectedQueryId(0);
    setIsEditingContract(false);
    setIsCreatingAddress(false);
  };

  function compare(a: { created_at: string }, b: { created_at: string }) {
    if (a.created_at > b.created_at) {
      return -1;
    }
    if (a.created_at < b.created_at) {
      return 1;
    }
    return 0;
  }

  const toast = useMoonToast();

  const getSubscriptions = () => {
    return SubscriptionsService.getSubscriptions()
      .then((res) => {
        return res;
      })
      .then((res) => res.data.subscriptions.sort(compare))
      .then((array) =>
        array.map((i: any) => {
          const created_at = new Date(i.created_at);
          return {
            ...i,
            type: i.subscription_type_id !== "externaly_owned_account" ? "smartcontract" : "eoa",
            created_at: created_at.toLocaleDateString(),
            chainName: i.subscription_type_id.split("_").slice(0, -1).join("_"),
            displayName: getChainName(i.subscription_type_id.split("_").slice(0, -1).join("_")),
          };
        }),
      );
  };

  const API = process.env.NEXT_PUBLIC_MOONSTREAM_API_URL;

  const templates = useQuery(
    ["queryTemplates"],
    () => {
      return http({
        method: "GET",
        url: `${API}/queries/templates`,
      }).then((res) => {
        return res.data.interfaces;
      });
    },
    {
      ...queryCacheProps,
      onError: (error: Error) => {
        console.log(error);
      },
    },
  );

  const getError = () => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error("mock error")), 3000);
    });
  };

  const addresses = useQuery(["subscriptions"], getSubscriptions, {
    ...queryCacheProps,
    retry: 2,
    onError: (error: any) => {
      toast(error.message, "error");
    },
    enabled: !!user,
  });

  const namesMap = {
    xdai: "Gnosis",
    zksync_era_testnet: "zkSync Era Testnet",
    zksync_era_sepolia: "zkSync Era Sepolia",
    zksync_era: "zkSync Era",
    proofofplay_apex: "Proof of Play Apex",
  };

  const chainsOrder = ["ethereum", "polygon", "zksync_era", "xdai", "mumbai", "zksync_era_testnet"];

  const getChainName = (backName: string) => {
    if (namesMap[backName as keyof typeof namesMap]) {
      return namesMap[backName as keyof typeof namesMap];
    }
    return backName
      .split("_")
      .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getBlockchains = async () => {
    const response = await SubscriptionsService.getTypes();
    return response.data.subscription_types
      .filter((type: { blockchain: string }) => type.blockchain !== "Any")
      .map((type: any) => {
        return {
          name: type.blockchain,
          displayName: getChainName(type.blockchain),
          image: type.icon_url,
        };
      })
      .sort((a: any, b: any) => {
        const orderA =
          chainsOrder.indexOf(a.name) > -1 ? chainsOrder.indexOf(a.name) : Number.MAX_VALUE;
        const orderB =
          chainsOrder.indexOf(b.name) > -1 ? chainsOrder.indexOf(b.name) : Number.MAX_VALUE;
        return orderA - orderB;
      });
  };

  const blockchains = useQuery(["subscription_types"], getBlockchains, {
    ...queryCacheProps,
  });

  const databases = useQuery(
    ["databases", user],
    () => {
      return DatabaseService.getCustomers().then((res) => res.data);
    },
    {
      ...queryCacheProps,
      enabled: !!user,
    },
  );

  const queries = undefined;

  const value = {
    addresses,
    queries,
    databases,
    isShowContracts,
    setIsShowContracts,
    filter,
    setFilter,
    selectedAddressId,
    setSelectedAddressId,
    blockchains,
    isCreatingAddress,
    setIsCreatingAddress,
    isEditingContract,
    setIsEditingContract,
    selectedQueryId,
    setSelectedQueryId,
    reset,
    templates,
  };

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
};

const useAnalytics = () => {
  const context = useContext(AnalyticsContext);

  if (context === undefined) {
    throw new Error("useAnalytics must be used within AnalyticsContext");
  }

  return context;
};

export default useAnalytics;
