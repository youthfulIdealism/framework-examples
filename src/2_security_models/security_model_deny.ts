import * as z from "zod/v4";
import { Request, Response } from "express";
import { Empty_Query_Possibilities, F_Security_Model, Operation } from "@liminalfunctions/framework/F_Security_Model.js";
import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";

export class Security_Model_Deny<Collection_ID extends string, ZodSchema extends z.ZodObject> extends F_Security_Model<Collection_ID, ZodSchema> {

    constructor(collection: F_Collection<Collection_ID, ZodSchema>){
        super(collection);
    }

    /**
     * has_permission returns true if this security model grants permission to the user to perform the operation.
     * 
     * This particular security model just denies all access.
     */
    async has_permission(req: Request, res: Response, find: {[key: string]: any}, operation: Operation): Promise<boolean> {
        console.log(`trying to access collection ${this.collection.collection_id} through Security_Model_Deny. Access denied; if there's another security model for this layer, it will be tried next.`)
        return false;
    }

    /**
     * In the event that the query results are empty, this method allows the security model to decide whether to
     * throw an access error or just return no data. 99% of the time, you'll just want to return no data and can
     * reproduce this method exactly as shown. For an example of when this is not true, see security_model_low_value_assets.
     */
    async handle_empty_query_results(req: Request, res: Response, operation: Operation): Promise<Empty_Query_Possibilities> {
        return { data: null }
    }
}