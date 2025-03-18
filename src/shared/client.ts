import { DynamicsWebApi } from "dynamics-web-api";
import { getDynamicsToken } from "./auth";


export const dynamicsWebApi = new DynamicsWebApi({
    serverUrl: process.env.DYNAMICS_API_URL,
    onTokenRefresh: async () => {
        return await getDynamicsToken();
    }
});
