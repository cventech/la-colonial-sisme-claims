import * as dotenv from "dotenv";

dotenv.config();

const baseDbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT),
  connectionTimeout: 50000,
  requestTimeout: 50000,
  authentication: {
    type: "default",
  },
  options: {
    encrypt: true,
    trustServerCertificate: true,
    applicationIntent: "ReadWrite",
    multiSubnetFailover: false,
  },
};

export const smiDbConfig = {
  ...baseDbConfig,
  database: process.env.DB_NAME_SMI,
};

export const comercialDbConfig = {
  ...baseDbConfig,
  database: process.env.DB_NAME_COMERCIAL,
};
