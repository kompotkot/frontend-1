/* eslint-disable @typescript-eslint/no-var-requires */
import { useContext, useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient, UseQueryResult } from "react-query";
import { Box, Button, Spinner, Text } from "@chakra-ui/react";
import { Flex } from "@chakra-ui/layout";
import { Image } from "@chakra-ui/image";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";

import Web3Context from "../../contexts/Web3Context/context";
import queryCacheProps from "../../hooks/hookCommon";
import { PORTAL_PATH } from "../../constants";
import DropHeader from "../dropper/DropHeader";
import DropV2Data from "./DropV2Data";
import DropperV2EditDrop from "./DropperV2EditDrop";
import DropperV2ClaimsView from "./DropperV2ClaimsView";
import { MockTerminus } from "../../web3/contracts/types/MockTerminus";
import useMoonToast from "../../hooks/useMoonToast";
import { RegisteredContract } from "./DropperV2RegisteredContracts";

const dropperAbi = require("../../web3/abi/DropperV2.json");
const terminusAbi = require("../../web3/abi/MockTerminus.json");

export interface DropState {
  drop: { tokenId: string; amount: string; tokenAddress: string; tokenType: string };
  dropAuthorization: { poolId: string; terminusAddress: string };
  uri: string;
  isMintAuthorized: boolean;
  active: boolean;
  address: string;
  terminusPoolController: string;
}

const DropperV2DropView = ({
  address,
  dropId,
  metadata,
  isContractRegistered,
  totalDrops,
  selectedContract,
}: {
  address: string;
  dropId: number;
  isContractRegistered: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
  totalDrops: number;
  selectedContract: RegisteredContract | undefined;
}) => {
  const { chainId, web3 } = useContext(Web3Context);

  const [isEdit, setIsEdit] = useState(true);

  const headerMeta = ["name", "description", "image", "attributes"];
  const web3ctx = useContext(Web3Context);

  useEffect(() => {
    setIsEdit(false);
  }, [address, web3ctx.account]);

  useEffect(() => {
    setIsEdit(false);
  }, [dropId]);

  const dropState: UseQueryResult<DropState> = useQuery(
    ["dropState", address, dropId, chainId],
    async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dropperContract = new web3.eth.Contract(dropperAbi) as any;
      dropperContract.options.address = address ?? "";
      const drop = await dropperContract.methods.getDrop(dropId).call();
      const uri = await dropperContract.methods.dropUri(dropId).call(); //TODO take from ClaimsList
      const dropAuthorization = await dropperContract.methods.getDropAuthorization(dropId).call();
      const active = await dropperContract.methods.dropStatus(dropId).call();

      let isMintAuthorized = false;
      let terminusPoolController = "";
      if (drop.tokenId && drop.tokenAddress && drop.tokenType === "1") {
        const terminusContract = new web3.eth.Contract(terminusAbi) as any;
        terminusContract.options.address = drop.tokenAddress;
        try {
          isMintAuthorized = await terminusContract.methods
            .isApprovedForPool(drop.tokenId, address)
            .call();
          terminusPoolController = await terminusContract.methods
            .terminusPoolController(drop.tokenId)
            .call();
        } catch (e) {
          console.log(e);
        }
      }
      return {
        drop,
        uri,
        dropAuthorization,
        active,
        isMintAuthorized,
        address,
        terminusPoolController,
      };
    },
    {
      ...queryCacheProps,
      retry: false,
      enabled: Number(dropId) > 0 && !!address,
    },
  );

  const toast = useMoonToast();
  const queryClient = useQueryClient();
  const approveForPool = useMutation(
    ({ operator, poolId }: { operator: string; poolId: number }) => {
      const terminusFacet = new web3.eth.Contract(terminusAbi) as any as MockTerminus;
      terminusFacet.options.address = dropState.data?.drop.tokenAddress ?? "";
      if (!terminusFacet.options.address) {
        throw new Error("Invalid terminus address");
      }
      return terminusFacet.methods
        .approveForPool(poolId, operator)
        .send({ from: web3ctx.account, maxPriorityFeePerGas: null, maxFeePerGas: null });
    },
    {
      onSuccess: () => {
        queryClient.setQueryData(["dropState", address, dropId, chainId], (oldData: any) => {
          return { ...oldData, isMintAuthorized: true };
        });
        dropState.refetch();
        toast("Successfully approved contract", "success");
      },
      onError: (e) => {
        console.log(e);
      },
    },
  );

  return (
    <Flex
      id="claimView"
      bg="#2d2d2d"
      minW="800px"
      borderRadius="20px"
      p="30px"
      color="white"
      direction="column"
      maxW="800px"
      position="relative"
      minH="700px"
    >
      {dropId > 0 && dropId <= totalDrops && (
        <>
          <DropHeader
            address={address}
            dropId={String(dropId)}
            PORTAL_PATH={PORTAL_PATH}
            isEdit={isEdit}
            toggleEdit={() => setIsEdit(!isEdit)}
            title={metadata?.name}
            dropState={dropState.data}
            status={
              dropState.data?.active === true
                ? true
                : dropState.data?.active === false
                ? false
                : undefined
            }
          />

          {!!dropState.data && (
            <>
              <Flex direction="column" gap="20px" id="claim-content">
                <Flex gap="20px">
                  {metadata?.image && (
                    <Image
                      w="140px"
                      h="140px"
                      borderRadius="20px"
                      border="1px solid #4d4d4d"
                      src={metadata.image}
                      alt="image"
                    />
                  )}
                  {metadata?.description && (
                    <Box maxW={"580px"}>
                      <ReactMarkdown className="markdown" remarkPlugins={[remarkGfm]}>
                        {metadata.description}
                      </ReactMarkdown>
                    </Box>
                  )}
                </Flex>
                {dropState && isEdit && (
                  <Flex direction="column" gap="20px" mb="20px">
                    <DropperV2EditDrop
                      address={address}
                      dropId={String(dropId)}
                      dropState={dropState.data}
                    />
                    <Button alignSelf="end" variant="cancelButton" onClick={() => setIsEdit(false)}>
                      Cancel
                    </Button>
                  </Flex>
                )}
                {dropState.data?.drop && !isEdit && (
                  <DropV2Data
                    metadata={metadata}
                    dropState={dropState}
                    excludeFields={headerMeta}
                    PORTAL_PATH={PORTAL_PATH}
                    approveForPool={approveForPool}
                  />
                )}
              </Flex>
            </>
          )}

          {dropState.data && (
            <DropperV2ClaimsView
              address={address}
              dropAuthorization={dropState.data?.dropAuthorization}
              isContractRegistered={isContractRegistered}
              selectedContract={selectedContract}
            />
          )}

          {dropState.isLoading && (
            <Flex alignItems="center" justifyContent="center" h="100%">
              <Spinner h="50px" w="50px" />
            </Flex>
          )}
        </>
      )}
    </Flex>
  );
};

export default DropperV2DropView;
