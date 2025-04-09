import { useSession } from "next-auth/react";

const useAuth = () => {
  const { data: session, status } = useSession();

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  return {
    session,
    isAuthenticated,
    isLoading,
  };
};
