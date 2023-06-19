import { Flex, Spacer } from "@chakra-ui/layout";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
} from "@chakra-ui/react";

import PoolDetailsRow from "../PoolDetailsRow";
import AnalyticsABIView from "./AnalyticsABIView";

const API = process.env.NEXT_PUBLIC_MOONSTREAM_API_URL;

const AnalyticsSmartContractDetails = ({
  address,
  chain,
  id,
}: {
  address: string;
  chain: string;
  id: string;
}) => {
  return (
    <Flex
      flex="1 1 0px"
      direction="column"
      gap="10px"
      p="15px"
      borderRadius="10px"
      bg="#232323"
      // maxW="595px"
    >
      <Accordion allowMultiple>
        <AccordionItem border="none">
          <AccordionButton p="0">
            <Flex
              justifyContent="space-between"
              w="100%"
              textAlign="right"
              // pr="10px"
              fontWeight="700"
              fontSize="16px"
            >
              Contract details
            </Flex>
            <Spacer />
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel p="0">
            <Flex direction="column" mt="20px">
              <PoolDetailsRow
                displayFull={true}
                canBeCopied={true}
                type={"Contract address"}
                value={address}
                fontSize="14px"
              />
              <Flex w="100%" bg="#4D4D4D" h="1px" mt="20px" mb="12px" />
              <AnalyticsABIView address={address} id={id} chain={chain} />
            </Flex>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Flex>
  );
};

export default AnalyticsSmartContractDetails;
