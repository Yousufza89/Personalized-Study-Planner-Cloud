import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from "@azure/storage-blob";

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "";
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || "";
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "study-resources";

export function generateSASUrl(
  blobName: string,
  expiresInMinutes: number = 60,
  permissions: string = "rw"
): string {
  if (!accountName || !accountKey) {
    throw new Error("Azure Storage credentials not configured");
  }

  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  const sasOptions = {
    containerName,
    blobName,
    permissions: BlobSASPermissions.parse(permissions),
    startsOn: new Date(),
    expiresOn: new Date(new Date().valueOf() + expiresInMinutes * 60 * 1000),
  };

  const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
  return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
}

export function getBlobServiceClient(): BlobServiceClient {
  if (!accountName || !accountKey) {
    throw new Error("Azure Storage credentials not configured");
  }
  const connectionString = `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`;
  return BlobServiceClient.fromConnectionString(connectionString);
}

