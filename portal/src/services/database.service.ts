import http from "../utils/httpMoonstream";

const MDB_API = process.env.NEXT_PUBLIC_MDB_API_URL;

// Get a list of customers and their database instances
export const getCustomers = () =>
    http({
        method: "GET",
        url: `${MDB_API}/customers`,
    });

// Get credentials URI for a specific customer instance
export const getCustomerCredentialsURI = (customerId: string, instanceId: number, role: string) =>
    http({
        method: "GET",
        url: `${MDB_API}/customers/${customerId}/instances/${instanceId}/creds/${role}/url`,
    });

// Example usage to get customer credentials
export const getPostgresCredentials = (customerId: string, instanceId: number) =>
    getCustomerCredentialsURI(customerId, instanceId, "customer");

// If you need to extend the service, you can add functions like these for different roles:
// getAdministratorCredentials, getEngineerCredentials, etc.
