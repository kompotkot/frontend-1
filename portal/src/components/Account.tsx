import RouterLink from "next/link";

import React, { useState } from "react";
import {
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Spinner,
  useMediaQuery,
} from "@chakra-ui/react";

import LoginButton from "./LoginButton";
import { BsPerson } from "react-icons/bs";
import useUser from "../contexts/UserContext";
import useLogout from "../hooks/useLogout";
import SignUp from "./SignUp";
import styles from "./Account.module.css";
import { useRouter } from "next/router";

const Account = ({ ...props }: { [x: string]: any }) => {
  const { user } = useUser();
  const { logout, isLoading: isLoggingOut } = useLogout();
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isBaseView] = useMediaQuery(["(max-width: 767px)"]);
  const [isSignUpVisible] = useMediaQuery(["(min-width: 550px)"]);

  const router = useRouter();

  return (
    <>
      <Flex gap={{ base: "5px", sm: "10px" }} alignItems={"center"}>
        {!router.asPath.includes("portal") && (
          <>
            <button className={styles.portalButton} onClick={() => router.push("/portal")}>
              Portal
            </button>
            {!isBaseView && <div className={styles.divider} />}
          </>
        )}
        {!user && (
          <>
            <LoginButton>
              <button className={styles.loginButton}>Log in</button>
            </LoginButton>
            {!isBaseView && (
              <>
                <SignUp isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} />
                <button className={styles.signUpButton} onClick={() => setIsSignUpOpen(true)}>
                  Sign up
                </button>
              </>
            )}
          </>
        )}
      </Flex>
      {isLoggingOut && <Spinner />}
      {user && !isLoggingOut && (
        <Menu>
          <MenuButton {...props} bg={"transparent"}>
            <Flex gap="5px" alignItems="center">
              <BsPerson />
              {user.username.length > 13 ? user.username.slice(0, 11) + "..." : user.username}
            </Flex>
          </MenuButton>
          <MenuList borderRadius="10px" border="1px solid white" minW="fit-content" p="20px">
            <MenuItem p="0px" mb="10px">
              <RouterLink href="/tokens">API tokens</RouterLink>
            </MenuItem>
            <MenuItem p="0px" mb="10px">
              <RouterLink href="/nodebalancer">NodeBalancer info</RouterLink>
            </MenuItem>
            <Divider mb="10px" />
            <MenuItem p="0px" onClick={() => logout()}>
              Log out
            </MenuItem>
          </MenuList>
        </Menu>
      )}
    </>
  );
};

export default Account;
