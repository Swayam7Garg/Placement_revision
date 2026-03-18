import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var __mongoClient: MongoClient | undefined;
}

export function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing env: MONGODB_URI");

  if (!global.__mongoClient) {
    global.__mongoClient = new MongoClient(uri);
  }
  return global.__mongoClient;
}

export async function getDb() {
  const client = getMongoClient();
  await client.connect();
  const dbName = process.env.MONGODB_DB || "revision";
  return client.db(dbName);
}

