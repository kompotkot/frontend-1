/* eslint-disable @typescript-eslint/no-var-requires */
import { useContext, useEffect, useState } from "react"
import { useQuery, useMutation } from "react-query"
import { Button, IconButton, Input, useToast, Spinner } from "@chakra-ui/react"
import { Box, Flex, Text } from "@chakra-ui/layout"
import { Image } from "@chakra-ui/image"

import PoolDetailsRow from "./PoolDetailsRow"
import Web3Context from "../contexts/Web3Context/context"
import { MockTerminus } from "../web3/contracts/types/MockTerminus"
import queryCacheProps from "../hooks/hookCommon"
import { MULTICALL2_CONTRACT_ADDRESSES } from "../constants"
import { LinkIcon } from "@chakra-ui/icons"
const terminusAbi = require("../web3/abi/MockTerminus.json")
const multicallABI = require("../web3/abi/Multicall2.json")

const TerminusPoolView = ({
  address,
  poolId,
  metadata,
}: {
  address: string
  poolId: string
  metadata: any
}) => {
  const { chainId, web3, account } = useContext(Web3Context)

  const headerMeta = ["name", "description", "image", "attributes"]
  const [newUri, setNewUri] = useState("")
  const terminusFacet = new web3.eth.Contract(terminusAbi) as any as MockTerminus
  terminusFacet.options.address = address
  const toast = useToast()
  const commonProps = {
    onSuccess: () => {
      toast({
        title: "Successfully updated contract",
        status: "success",
        duration: 5000,
        isClosable: true,
      })
      // contractState.refetch(); //TODO
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    },
  }

  useEffect(() => {
    setNewUri("")
    poolState.refetch()
  }, [poolId])

  const setPoolURI = useMutation(
    ({ uri, poolId }: { uri: string; poolId: string }) =>
      terminusFacet.methods.setURI(poolId, uri).send({ from: account }),
    { ...commonProps, onSettled: () => poolState.refetch() },
  )

  const handleNewUri = () => {
    setPoolURI.mutate({ uri: newUri, poolId: poolId })
  }

  const poolState = useQuery(
    ["poolState", address, poolId, chainId],
    async () => {
      const MULTICALL2_CONTRACT_ADDRESS =
        MULTICALL2_CONTRACT_ADDRESSES[String(chainId) as keyof typeof MULTICALL2_CONTRACT_ADDRESSES]
      if (!address || !MULTICALL2_CONTRACT_ADDRESS) {
        return
      }

      const terminusContract = new web3.eth.Contract(
        terminusAbi,
        address,
      ) as unknown as MockTerminus
      const multicallContract = new web3.eth.Contract(multicallABI, MULTICALL2_CONTRACT_ADDRESS)
      const target = address
      const callDatas = []
      callDatas.push(terminusContract.methods.terminusPoolController(poolId).encodeABI())
      callDatas.push(terminusContract.methods.poolIsBurnable(poolId).encodeABI())
      callDatas.push(terminusContract.methods.poolIsTransferable(poolId).encodeABI())
      callDatas.push(terminusContract.methods.terminusPoolCapacity(poolId).encodeABI())
      callDatas.push(terminusContract.methods.terminusPoolSupply(poolId).encodeABI())
      callDatas.push(terminusContract.methods.uri(poolId).encodeABI())

      const queries = callDatas.map((callData) => {
        return {
          target,
          callData,
        }
      })
      return multicallContract.methods
        .tryAggregate(false, queries)
        .call()
        .then((results: string[][]) => {
          const parsedResults = results.map((result: string[], idx: number) => {
            if (result[1] === "0x") {
              return undefined
            }
            let parsed
            try {
              parsed = web3.utils.hexToNumberString(result[1])
              if (idx === 0) {
                const adr = "0x" + result[1].slice(-40)
                parsed = web3.utils.toChecksumAddress(adr)
              }
              if (idx === 1 || idx === 2) {
                if (Number(parsed) === 1 || Number(parsed) === 0) {
                  parsed = !!Number(parsed)
                } else {
                  parsed = undefined
                }
              }
              if (idx === 5) {
                if (!web3.utils.hexToUtf8(result[1]).split("https://")[1]) {
                  return undefined
                }
                parsed = "https://" + web3.utils.hexToUtf8(result[1]).split("https://")[1]
              }
            } catch (e) {
              parsed = undefined
            }
            return parsed
          })
          const data = {
            controller: parsedResults[0],
            isBurnable: parsedResults[1],
            isTransferable: parsedResults[2],
            capacity: parsedResults[3],
            supply: parsedResults[4],
            uri: parsedResults[5],
          }
          return data
        })
        .catch((e: any) => {
          console.log(e)
        })
    },
    {
      ...queryCacheProps,
      // onSuccess: () => {}, //TODO
    },
  )

  const copyPoolAddress = () => {
    navigator.clipboard
      .writeText(
        `https://portal.moonstream.to/terminus/?contractAddress=${address}&poolId=${poolId}`,
      )
      .then(() => {
        toast({
          duration: 3000,
          render: () => (
            <Box borderRadius="10px" textAlign="center" color="black" p={3} bg="green.800">
              Copied to clipboard
            </Box>
          ),
        })
      })
      .catch((e) => {
        toast({
          duration: 3000,
          render: () => (
            <Box borderRadius="10px" textAlign="center" color="black" p={3} bg="red.800">
              {e}
            </Box>
          ),
        })
      })
  }

  return (
    <Flex
      id="poolView"
      bg="#2d2d2d"
      minW="800px"
      borderRadius="20px"
      p="30px"
      color="white"
      direction="column"
      maxW="800px"
    >
      <Flex gap={2}>
        {poolState.isFetching && <Spinner />}
        <Text
          textAlign="start"
          color="#c2c2c2"
          w="fit-content"
          py={1}
          pr={0}
          borderBottom="1px solid #c2c2c2"
          fontSize="20px"
          mb="20px"
        >
          {`pool ${poolId}`}
        </Text>
        <IconButton
          bg="transparent"
          onClick={copyPoolAddress}
          color="#c2c2c2"
          _hover={{ bg: "transparent", color: "white" }}
          icon={<LinkIcon />}
          aria-label="copy link"
        />
      </Flex>
      {!!poolState.data && (
        <>
          {metadata?.name && (
            <Text fontWeight="700" fontSize="24px" mb="20px">
              {metadata.name}
            </Text>
          )}
          <Flex direction="column" gap="20px" overflowY="auto">
            <Flex gap="20px">
              {metadata?.image && (
                <Image w="140px" h="140px" borderRadius="20px" src={metadata.image} alt="image" />
              )}
              {metadata?.description && (
                <Text fontWeight="400" fontSize="18px" mb="20px">
                  {metadata.description}
                </Text>
              )}
            </Flex>
            {poolState.data.controller && (
              <Flex direction="column" gap="10px" p={5} borderRadius="10px" bg="#232323">
                <PoolDetailsRow type="controller" value={poolState.data.controller} />
                <PoolDetailsRow type="capacity" value={poolState.data.capacity} />
                <PoolDetailsRow type="supply" value={poolState.data.supply} />
                <PoolDetailsRow
                  type="burnable"
                  value={poolState.data.isBurnable ? "true" : "false"}
                />
                <PoolDetailsRow
                  type="transferable"
                  value={poolState.data.isTransferable ? "true" : "false"}
                />
                <PoolDetailsRow type="uri" value={poolState.data.uri} />
                {metadata && (
                  <>
                    <Text fontWeight="700" mt="20px">
                      Metadata:
                    </Text>
                    {Object.keys(metadata)
                      .filter((key) => !headerMeta.includes(key))
                      .map((key) => {
                        return <PoolDetailsRow key={key} type={key} value={String(metadata[key])} />
                      })}
                  </>
                )}
                {metadata?.attributes && (
                  <>
                    <Text fontWeight="700" mt="20px">
                      Attributes:
                    </Text>

                    {metadata.attributes.map((attribute: { trait_type: string; value: string }) => (
                      <PoolDetailsRow
                        key={attribute.trait_type}
                        type={attribute.trait_type}
                        value={String(attribute.value)}
                      />
                    ))}
                  </>
                )}
              </Flex>
            )}
          </Flex>
          {poolState.data && poolState.data.controller === account && (
            <Flex gap="15px" mt="20px">
              <Input
                placeholder="new uri"
                value={newUri}
                onChange={(e) => setNewUri(e.target.value)}
                type="url"
                disabled={setPoolURI.isLoading}
              />
              <Button
                bg="gray.0"
                fontWeight="400"
                fontSize="18px"
                color="#2d2d2d"
                onClick={handleNewUri}
                disabled={setPoolURI.isLoading}
              >
                {setPoolURI.isLoading ? <Spinner /> : "Save"}
              </Button>
            </Flex>
          )}
        </>
      )}
      {!poolState.data && (
        <Flex alignItems="center" justifyContent="center" h="100%">
          <Spinner h="50px" w="50px" />
        </Flex>
      )}
    </Flex>
  )
}

export default TerminusPoolView
