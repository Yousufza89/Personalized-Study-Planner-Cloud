import { CosmosClient } from "@azure/cosmos";

const endpoint = process.env.AZURE_COSMOS_ENDPOINT || "";
const key = process.env.AZURE_COSMOS_KEY || "";

if (!endpoint || !key) {
  console.warn("Azure Cosmos DB credentials not found. Using mock client.");
}

export const cosmosClient = new CosmosClient({
  endpoint,
  key,
});

export const databaseId = process.env.AZURE_COSMOS_DATABASE_ID || "studyplanner";
export const containerId = process.env.AZURE_COSMOS_CONTAINER_ID || "schedules";

export async function getContainer() {
  const database = cosmosClient.database(databaseId);
  const container = database.container(containerId);
  return container;
}

