import * as z from "zod/v4";
import { Request, Response } from "express";
import { Empty_Query_Possibilities, F_Security_Model, Operation } from "@liminalfunctions/framework/F_Security_Model.js";
import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
export declare class Security_Model_Allow<Collection_ID extends string, ZodSchema extends z.ZodObject> extends F_Security_Model<Collection_ID, ZodSchema> {
    constructor(collection: F_Collection<Collection_ID, ZodSchema>);
    has_permission(req: Request, res: Response, find: {
        [key: string]: any;
    }, operation: Operation): Promise<boolean>;
    handle_empty_query_results(req: Request, res: Response, operation: Operation): Promise<Empty_Query_Possibilities>;
}
