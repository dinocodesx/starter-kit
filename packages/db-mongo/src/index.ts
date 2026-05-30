import mongoose from 'mongoose';

/**
 * Shared Mongoose instance.
 *
 * Mongoose maintains a global state by default, so importing it from
 * this package ensures that all apps in the workspace share the same
 * instance, which is crucial for model registration and connections.
 */
export const db = mongoose;

/**
 * Connects to MongoDB using the provided URI or the MONGODB_URI environment variable.
 */
export async function connect(uri?: string) {
  const connectionString = uri || process.env.MONGODB_URI;

  if (!connectionString) {
    throw new Error("MONGODB_URI is required to connect to MongoDB.");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  return mongoose.connect(connectionString);
}

export * from 'mongoose';
export default db;
