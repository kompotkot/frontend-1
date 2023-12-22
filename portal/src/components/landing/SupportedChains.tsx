import styles from "./SupportedChains.module.css";
import { Flex, Image, Link, Text } from "@chakra-ui/react";
import { AWS_STATIC_ASSETS_PATH } from "../../constants";
import UpcomingIntegrations from "./UpcomingIntegrations";

const SupportedChains = () => {
  // const chains = [
  //   "caldera.png",
  //   "ethereum.png",
  //   "gnosis-new.png",
  //   "polygon-new.png",
  //   "mumbai.png",
  //   "era.png",
  //   "era-testnet.png",
  // ];
  const chains = [
    {
      image: "caldera.png",
      href: "https://caldera.xyz/",
    },
    {
      image: "ethereum.png",
      href: "https://ethereum.org/",
    },
    {
      image: "gnosis-new.png",
      href: "https://www.gnosis.io/",
    },
    {
      image: "polygon-new.png",
      href: "https://polygon.technology/",
    },
    {
      image: "mumbai.png",
      href: "https://mumbai.polygonscan.com/",
    },
    // Assuming era and era-testnet have corresponding hrefs
    {
      image: "era.png",
      href: "https://era.zksync.io/", // Replace with actual href
    },
    {
      image: "era-testnet.png",
      href: "https://era.zksync.io/", // Replace with actual href
    },
  ];
  return (
    <Flex className={styles.container}>
      <Flex
        direction={{ base: "column", sm: "row" }}
        gap={{ base: "4px", sm: "15px" }}
        alignItems={"center"}
      >
        <Text className={styles.title}>Supported chains</Text>
        <Text className={styles.title}>+</Text>
        <Flex className={styles.testnetFlex} w={"fit-content"}>
          <Text className={styles.testnet}>testnets</Text>
        </Flex>
      </Flex>
      <Flex className={styles.chains}>
        {chains.map((chain, idx) => (
          <Link isExternal href={chain.href}>
            <Image
              key={idx}
              alt={""}
              h={{ base: "27px", sm: "40px" }}
              src={`${AWS_STATIC_ASSETS_PATH}/landing/logos/${chain.image}`}
            />
          </Link>
        ))}
      </Flex>
      <UpcomingIntegrations />
    </Flex>
  );
};

export default SupportedChains;
