import { BlobServiceClient } from "@azure/storage-blob";
import { SharedOptions } from "./SharedOptions";

export interface StorageClientOptions extends SharedOptions {
  connectionString: string;
}

export class StorageClient {
  private blobService?:BlobServiceClient;

  public async uploadLocalFile(containerName: string, blobName: string, localFileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const containerClient = this.blobService!.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const response = blockBlobClient!.uploadFile(localFileName);
      response.then((result) => {
        if (result._response.status == 200) {
          let fileLink = this.hostName() + containerName + "/" + blobName;
          this.options.log("Uploaded file", fileLink);
          resolve(fileLink);
        } 
      }).catch((err) => {
        this.options.error("Failed to upload file:", blobName, "Error:", err);
        reject(err);
      });
    });
  }

  public async ensureContainerExists(containerName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const containerClient = this.blobService!.getContainerClient(containerName);
      const response = containerClient!.createIfNotExists();
      response.then((result) => {
        if (result.succeeded) {
          resolve(this.hostName() + containerName);
        } 
      }).catch((err) => {
        this.options.error("Failed to create container", containerName, "Error:", err);
        reject(err);
      });
    });
  }

  constructor(private options: StorageClientOptions) {
    if (options.connectionString != "") {
      this.blobService = new BlobServiceClient(options.connectionString);
    } else {
      this.blobService = undefined;
    }
  }

  public hostName(): string {
    return this.blobService!.url;
  }
}
