import { useContext, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Box, Flex, Spinner, Text } from "@chakra-ui/react";

import Web3Context from "../../contexts/Web3Context/context";
import AuthorizationInfo from "../dropperV2/AutorizationInfo";
import Web3Address from "../entity/Web3Address";
import styles from "./SigningAccountView.module.css";

import { AbiItem } from "web3-utils";
import importedTerminusAbi from "../../web3/abi/MockTerminus.json";
const terminusAbi = importedTerminusAbi as unknown as AbiItem[];
import { MockTerminus } from "../../web3/contracts/types/MockTerminus";

const SigningAccountView = ({
  selectedSignerAccount,
  setSelectedSignerAccount,
  signingAccount,
  dropAuthorization,
}: {
  selectedSignerAccount: { subdomain: string; address: string } | undefined;
  setSelectedSignerAccount: (arg0: { subdomain: string; address: string }) => void;
  signingAccount: {
    subdomain: string;
    address: string;
    tokensNumber: number;
  };
  dropAuthorization: { poolId: string; terminusAddress: string };
}) => {
  const { chainId, web3, account } = useContext(Web3Context);
  const queryClient = useQueryClient();
  const [updatedBalance, setUpdatedBalance] = useState(-1);
  const terminusFacet = new web3.eth.Contract(terminusAbi) as any as MockTerminus;
  terminusFacet.options.address = dropAuthorization.terminusAddress;
  useEffect(() => {
    setUpdatedBalance(Number(signingAccount.tokensNumber));
  }, [signingAccount.tokensNumber]);

  const terminusInfo = useQuery(["terminusPoolState", dropAuthorization], async () => {
    const contractController = await terminusFacet.methods.terminusController().call();
    const poolController = await terminusFacet.methods
      .terminusPoolController(dropAuthorization.poolId)
      .call();
    return { contractController, poolController };
  });
  const mintTokens = useMutation(
    ({ to, poolID, amount }: { to: string; poolID: number; amount: number }) =>
      terminusFacet.methods
        .mint(to, poolID, amount, "0x0")
        .send({ from: account, maxPriorityFeePerGas: null, maxFeePerGas: null }),
    {
      onSuccess: () => {
        setUpdatedBalance(updatedBalance + 1);
        queryClient.invalidateQueries("signing_server");
      },
    },
  );
  const burnTokens = useMutation(
    ({ from, poolID, amount }: { from: string; poolID: number; amount: number }) =>
      terminusFacet.methods
        .burn(from, poolID, amount)
        .send({ from: account, maxPriorityFeePerGas: null, maxFeePerGas: null }),
    {
      onSuccess: () => {
        setUpdatedBalance(updatedBalance - 1);
        queryClient.invalidateQueries("signing_server");
      },
    },
  );

  return (
    <Flex justifyContent={"space-between"} alignItems={"center"}>
      <Flex
        alignItems={"center"}
        gap={"10px"}
        onClick={() => setSelectedSignerAccount(signingAccount)}
        cursor={"pointer"}
      >
        <Flex
          w={"16px"}
          h={"16px"}
          borderRadius={"50%"}
          border={"2px solid white"}
          bg={"transparent"}
          alignItems={"center"}
          justifyContent={"center"}
        >
          <Box
            w={"8px"}
            h={"8px"}
            borderRadius={"50%"}
            bg={
              selectedSignerAccount?.address === signingAccount.address ? "#F56646" : "transparent"
            }
          />
        </Flex>
        <Web3Address
          isTruncated
          blockchain={String(chainId)}
          entityTag={"SigningAccount"}
          address={signingAccount.address}
          fontSize={"12px"}
          gap={"5px"}
        />
      </Flex>
      <Text fontSize={"12px"}>{signingAccount.subdomain}</Text>
      <div className={styles.statusOk}>Live</div>

      {/*{updatedBalance > -1 && (*/}
      {/*  <Text fontSize={"14px"}>{`${updatedBalance} token${*/}
      {/*    updatedBalance !== 1 ? "s" : ""*/}
      {/*  } for this pool`}</Text>*/}
      {/*)}*/}
      <Flex gap={"10px"} alignItems={"center"}>
        {terminusInfo.data && terminusInfo.data.poolController === account && (
          <Flex gap={"5px"}>
            {updatedBalance === 0 ? (
              <button
                className={styles.buttonMint}
                onClick={() =>
                  mintTokens.mutate({
                    to: signingAccount.address,
                    poolID: Number(dropAuthorization.poolId),
                    amount: Number(1),
                  })
                }
                disabled={mintTokens.isLoading}
              >
                {mintTokens.isLoading ? <Spinner h={"12px"} w={"12px"} /> : "Mint"}
              </button>
            ) : (
              <button
                className={styles.buttonBurn}
                onClick={() =>
                  burnTokens.mutate({
                    from: signingAccount.address,
                    poolID: Number(dropAuthorization.poolId),
                    amount: Number(1),
                  })
                }
                disabled={burnTokens.isLoading}
              >
                {burnTokens.isLoading ? <Spinner h={"12px"} w={"12px"} /> : "Burn"}
              </button>
            )}
          </Flex>
        )}

        {terminusInfo.data && (
          <AuthorizationInfo
            dropAuthorization={dropAuthorization}
            controllers={terminusInfo.data}
          />
        )}
      </Flex>
    </Flex>
  );
};

export default SigningAccountView;
