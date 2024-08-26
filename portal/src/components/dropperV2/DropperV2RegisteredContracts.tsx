import { Flex, Text } from "@chakra-ui/react";
import RadioButtonSelected from "../icons/RadioButtonSelected";
import RadioButtonNotSelected from "../icons/RadioButtonNotSelected";
import React from "react";
import styles from "./DropperV2RegisteredContracts.module.css";

export interface RegisteredContract {
  id: string;
  title: string;
  description: string;
  address: string;
  blockchain: string;
  chain_id: number;
  image_uri: string;
  metatx_requester_id: string;
  created_at: string; // ISO 8601 date format
  updated_at: string; // ISO 8601 date format
}

interface DropperV2RegisteredContractsProps {
  contracts: RegisteredContract[];
  selectedContract: RegisteredContract | undefined;
  setSelectedContract: (arg0: RegisteredContract) => void;
}
const DropperV2RegisteredContracts: React.FC<DropperV2RegisteredContractsProps> = ({
  contracts,
  selectedContract,
  setSelectedContract,
}) => {
  return (
    <div className={styles.container}>
      {contracts &&
        contracts.map((contract) => (
          <Flex
            key={contract.id}
            alignItems={"center"}
            gap={"10px"}
            onClick={() => {
              setSelectedContract(contract);
            }}
            cursor={"pointer"}
            w={"fit-content"}
          >
            {selectedContract?.id === contract.id ? (
              <RadioButtonSelected />
            ) : (
              <RadioButtonNotSelected />
            )}
            <Text fontSize={"14px"}>{contract.id}</Text>
          </Flex>
        ))}
    </div>
  );
};

export default DropperV2RegisteredContracts;
