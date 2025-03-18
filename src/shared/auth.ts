import * as msal from '@azure/msal-node';



const msalConfig = {
    auth: {
        clientId: process.env.DYNAMICS_CLIENT_ID,
        authority: process.env.DYNAMICS_AUTHORITY,
        clientSecret: process.env.DYNAMICS_CLIENT_SECRET
    }
};

const cca = new msal.ConfidentialClientApplication(msalConfig);

export async function getDynamicsToken() {
    const tokenRequest = {
        scopes: [`${process.env.DYNAMICS_API_URL}.default`],
    };

    try {
        const response = await cca.acquireTokenByClientCredential(tokenRequest);
        return response.accessToken;
    } catch (error) {
        console.error('Error acquiring token:', error);
        throw new Error('Failed to acquire token');
    }
}