/* eslint-disable react/no-children-prop */
import { useContext, useEffect, useState } from "react"

import { SearchIcon, SmallAddIcon, SmallCloseIcon } from "@chakra-ui/icons"
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Collapse,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Spacer,
  Spinner,
  Text,
  useDisclosure,
  Icon,
  Select,
} from "@chakra-ui/react"
import { AiOutlineArrowLeft, AiOutlineArrowRight, AiOutlineVerticalRight } from "react-icons/ai"

import Web3Context from "../contexts/Web3Context/context"
import useDrop from "../hooks/useDrop"
import useMoonToast from "../hooks/useMoonToast"
import http from "../utils/http"

import NewClaimantView from "./NewClaimantView"
import FileUpload from "./FileUpload"
import Papa from "papaparse"
import { useQueryClient } from "react-query"

const ClaimantsView = ({ claimId }: { claimId: string }) => {
  const API = process.env.NEXT_PUBLIC_ENGINE_API_URL ?? process.env.NEXT_PUBLIC_PLAY_API_URL //TODO

  const [searchString, setSearchString] = useState("")

  const toast = useMoonToast()
  const web3ctx = useContext(Web3Context)
  const {
    claimants,
    uploadFile,
    setClaimantsPage,
    claimantsPage,
    setClaimantsPageSize,
    claimantsPageSize,
  } = useDrop({
    ctx: web3ctx,
    claimId: claimId,
  })
  const [displayingPages, setDisplayingPages] = useState("")

  const _pageOptions = ["10", "25", "50"]

  useEffect(() => {
    if (!claimants.data) {
      return
    }
    const length = Math.min(claimants.data.length, claimantsPageSize)
    if (length === 0) {
      setDisplayingPages("no more claimants")
    } else {
      setDisplayingPages(
        `showing ${claimantsPage * claimantsPageSize + 1} to ${
          claimantsPage * claimantsPageSize + length
        }`,
      )
    }
  }, [claimantsPage, claimantsPageSize, claimants.data])

  useEffect(() => {
    setClaimantsPage(0)
  }, [claimId])

  const [searchResult, setSearchResult] = useState<{
    result?: string | undefined
    isSearching: boolean
  }>({ isSearching: false })

  const searchForAddress = async (address: string) => {
    setSearchResult((prev) => {
      return { ...prev, isSearching: true }
    })

    http({
      method: "GET",
      url: `${API}/admin/drops/${claimId}/claimants/search`,
      params: { address },
    })
      .then((res: any) => {
        if (!res.data?.address) {
          throw new Error("Not found")
        }
        setSearchResult({ result: `Amount: ${res.data.raw_amount}`, isSearching: false })
      })
      .catch((e: any) => {
        const result =
          e.response?.data?.detail === "Address not present in that drop."
            ? "Address not present in that drop."
            : e.message
        setSearchResult({ result, isSearching: false })
      })
  }

  const { onOpen, onClose, isOpen } = useDisclosure()
  const [addingClaimant, setAddingClaimant] = useState(false)
  const [addingFile, setAddingFile] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const querClient = useQueryClient()

  const handleParsingError = function (error: string): void {
    setIsUploading(false)
    toast(error, "error", 7000)
    throw error
  }

  const validateHeader = function (headerValue: string, column: number): string {
    const header = headerValue.trim().toLowerCase()
    if (column == 0 && header != "address") {
      handleParsingError("First column header must be 'address'")
    }
    if (column == 1 && header != "amount") {
      handleParsingError("Second column header must be 'amount'")
    }
    return header
  }
  let parserLineNumber = 0

  const validateCellValue = function (cellValue: string, column: any): string {
    const value = cellValue.trim()
    if (column == "address") {
      parserLineNumber++
      try {
        web3ctx.web3.utils.toChecksumAddress(value)
      } catch (error) {
        handleParsingError(
          `Error parsing value '${value}' on line ${parserLineNumber}. Value in 'address' column must be a valid address.`,
        )
      }
    }
    if (column == "amount") {
      const numVal = parseInt(value)
      if (isNaN(numVal) || numVal < 0) {
        handleParsingError(
          `Error parsing value: '${value}' on line ${parserLineNumber}. Value in 'amount' column must be an integer.`,
        )
      }
    }
    return value
  }

  const onDrop = (file: any) => {
    if (!file.length) {
      return
    }
    parserLineNumber = 0
    setIsUploading(true)
    Papa.parse(file[0], {
      header: true,
      skipEmptyLines: true,
      fastMode: true,
      transform: validateCellValue,
      transformHeader: validateHeader,
      complete: (result: any) => {
        uploadFile.mutate(
          {
            dropperClaimId: claimId,
            claimants: result.data,
          },
          {
            onSettled: () => {
              setIsUploading(false)
              setAddingClaimant(false)
              querClient.refetchQueries(["claimants", "claimId", claimId])
            },
          },
        )
      },
      error: (err: Error) => handleParsingError(err.message),
    })
  }
  const handleSearchClick = () => {
    if (web3ctx.web3.utils.isAddress(searchString)) {
      searchForAddress(searchString)
      onOpen()
    } else {
      toast("invalid address", "error")
    }
  }

  return (
    <Accordion allowToggle borderRadius="10px" bg="#232323" border="1px solid #4d4d4d" p="20px">
      <AccordionItem border="none">
        <AccordionButton p="0px">
          <Text>Claimlist</Text>
          <Spacer />
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel p="0px">
          <Flex direction="column" gap="20px">
            <Flex justifyContent="space-between" alignItems="center" mt="20px">
              <InputGroup w="500px">
                <Input
                  value={searchString}
                  onChange={(e) => setSearchString(e.target.value)}
                  placeholder="search for address"
                  borderRadius="10px"
                  p="8px 15px"
                />
                <InputRightElement
                  w="80px"
                  children={
                    <Flex>
                      <IconButton
                        icon={<SmallCloseIcon />}
                        _hover={{ color: "#ffccd4" }}
                        bg="transparent"
                        aria-label="clean"
                        onClick={() => setSearchString("")}
                        m="0"
                        minW="20px"
                      />
                      <IconButton
                        _hover={{ color: "#ffccd4" }}
                        bg="transparent"
                        aria-label="search"
                        icon={<SearchIcon />}
                        minW="20px"
                        onClick={() => handleSearchClick()}
                        pl="10px"
                      />
                    </Flex>
                  }
                />
              </InputGroup>
              <Flex
                alignItems="center"
                gap="10px"
                cursor="pointer"
                onClick={() => setAddingClaimant(true)}
              >
                <Text>Add claimant</Text>
                <SmallAddIcon />
              </Flex>
            </Flex>

            <Collapse in={isOpen} animateOpacity>
              {searchResult.isSearching && <Spinner />}
              {!searchResult.isSearching && (
                <Flex justifyContent="space-between" alignItems="center">
                  {!!searchResult.result && <Text>{searchResult.result}</Text>}
                  <IconButton
                    bg="transparent"
                    aria-label="close"
                    icon={<SmallCloseIcon />}
                    onClick={() => {
                      setSearchString("")
                      onClose()
                    }}
                    _hover={{ bg: "#3f3f3f" }}
                  />
                </Flex>
              )}
            </Collapse>
            {claimants.isLoading && <Spinner />}
            {addingClaimant && <NewClaimantView claimId={claimId} setAdding={setAddingClaimant} />}
            {addingClaimant && (
              <FileUpload
                onDrop={onDrop}
                alignSelf="center"
                minW="100%"
                isUploading={isUploading}
              />
            )}
            {claimants.data && (
              <Flex gap="40px" fontSize="16px">
                <Flex direction="column">
                  <Text py="10px" borderBottom="0.5px solid #8b8b8b" fontWeight="700">
                    Address
                  </Text>
                  {claimants.data.map((claimant: { address: string }, idx: number) => (
                    <Text
                      py="12px"
                      key={idx}
                      fontFamily="Jet Brains Mono, monospace"
                      fontSize="16px"
                    >
                      {claimant.address}
                    </Text>
                  ))}
                </Flex>
                <Flex direction="column">
                  <Text py="10px" borderBottom="0.5px solid #8b8b8b" fontWeight="700">
                    Amount
                  </Text>

                  {claimants.data.map((claimant: { amount: string }, idx: number) => (
                    <Text py="12px" key={idx}>
                      {claimant.amount}
                    </Text>
                  ))}
                </Flex>
              </Flex>
            )}
            <Flex alignItems="center" justifyContent="space-between" fontWeight="300">
              <Text>page {claimantsPage + 1}</Text>
              <Flex alignItems="center" justifyContent="center">
                <IconButton
                  bg="transparent"
                  aria-label="to start"
                  _hover={{ bg: "#3f3f3f" }}
                  icon={<Icon as={AiOutlineVerticalRight} />}
                  onClick={() => setClaimantsPage(0)}
                  disabled={claimantsPage < 1}
                />
                <IconButton
                  bg="transparent"
                  aria-label="to start"
                  _hover={{ bg: "#3f3f3f" }}
                  icon={<Icon as={AiOutlineArrowLeft} />}
                  onClick={() => setClaimantsPage(claimantsPage - 1)}
                  disabled={claimantsPage < 1}
                />
                <Text px="20px">{displayingPages}</Text>
                <IconButton
                  bg="transparent"
                  aria-label="to start"
                  _hover={{ bg: "#3f3f3f" }}
                  icon={<Icon as={AiOutlineArrowRight} />}
                  onClick={() => setClaimantsPage(claimantsPage + 1)}
                  disabled={!claimants.data || claimants.data.length < claimantsPageSize}
                />
              </Flex>
              <Flex gap="15px" alignItems="center">
                <Select
                  bg="transparent"
                  color="white"
                  borderRadius="10px"
                  borderColor="#4d4d4d"
                  size="sm"
                  w="fit-content"
                  onChange={(e) => {
                    setClaimantsPageSize(Number(e.target.value))
                  }}
                  value={claimantsPageSize}
                >
                  {_pageOptions.map((pageSize: string) => {
                    return (
                      <option key={`paginator-options-pagesize-${pageSize}`} value={pageSize}>
                        {pageSize}
                      </option>
                    )
                  })}
                </Select>
                <Text>per page</Text>
              </Flex>
            </Flex>
          </Flex>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}

export default ClaimantsView
