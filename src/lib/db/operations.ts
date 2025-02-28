/**
 * Database Operations Utilities
 * 
 * Provides standardized wrappers for common database operations with
 * built-in error handling.
 */

import { Connection } from 'mongoose';
import { MongoConnectionManager } from './connection-manager';
import { withErrorHandling } from './unified-error-handler';

/**
 * Execute a database operation with a managed connection
 * 
 * @param operation Function that takes a connection and returns a promise
 * @param context Context description for error logging
 * @returns Promise that resolves to the operation result
 */
export async function withConnection<T>(
  operation: (connection: Connection) => Promise<T>,
  context: string
): Promise<T> {
  // Get connection manager
  const connectionManager = MongoConnectionManager.getInstance();
  
  // Get a connection
  const connection = await withErrorHandling(
    () => connectionManager.getConnection(),
    `${context}/getConnection`
  );
  
  // Execute the operation with error handling
  return withErrorHandling(
    () => operation(connection),
    context
  );
}

/**
 * Find documents in a collection
 * 
 * @param collection Collection name
 * @param query MongoDB query object
 * @param options Query options
 * @returns Promise resolving to array of documents
 */
export async function findDocuments<T>(
  collection: string,
  query: any = {},
  options: any = {}
): Promise<T[]> {
  return withConnection(async (connection) => {
    return connection.db?.collection(collection)
      .find(query, options)
      .toArray() as Promise<T[]>;
  }, `findDocuments/${collection}`);
}

/**
 * Find a single document in a collection
 * 
 * @param collection Collection name
 * @param query MongoDB query object
 * @param options Query options
 * @returns Promise resolving to document or null
 */
export async function findDocument<T>(
  collection: string,
  query: any,
  options: any = {}
): Promise<T | null> {
  return withConnection(async (connection) => {
    return connection.db?.collection(collection)
      .findOne(query, options) as Promise<T | null>;
  }, `findDocument/${collection}`);
}

/**
 * Insert a document into a collection
 * 
 * @param collection Collection name
 * @param document Document to insert
 * @returns Promise resolving to inserted document
 */
export async function insertDocument<T>(
  collection: string,
  document: any
): Promise<T> {
  return withConnection(async (connection) => {
    const result = await connection.db?.collection(collection)
      .insertOne({
        ...document,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    
    return { ...document, _id: result?.insertedId } as T;
  }, `insertDocument/${collection}`);
}

/**
 * Update a document in a collection
 * 
 * @param collection Collection name
 * @param query Query to find document to update
 * @param update Update operations
 * @param options Update options
 * @returns Promise resolving to update result
 */
export async function updateDocument(
  collection: string,
  query: any,
  update: any,
  options: any = {}
): Promise<any> {
  return withConnection(async (connection) => {
    // Add updatedAt timestamp if update doesn't use operators
    const updateOps = Object.keys(update)[0]?.startsWith('$')
      ? update
      : { $set: { ...update, updatedAt: new Date() } };
    
    return connection.db?.collection(collection)
      .updateOne(query, updateOps, options);
  }, `updateDocument/${collection}`);
}

/**
 * Delete a document from a collection
 * 
 * @param collection Collection name
 * @param query Query to find document to delete
 * @returns Promise resolving to delete result
 */
export async function deleteDocument(
  collection: string,
  query: any
): Promise<any> {
  return withConnection(async (connection) => {
    return connection.db?.collection(collection)
      .deleteOne(query);
  }, `deleteDocument/${collection}`);
}
