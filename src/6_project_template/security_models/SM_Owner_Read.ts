import * as z from "zod/v4";
import { Request, Response } from "express";
import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { Authenticated_Request, Empty_Query_Possibilities, F_Security_Model, Operation } from "@liminalfunctions/framework/F_Security_Model.js";

export class SM_Owner_Read<Collection_ID extends string, ZodSchema extends z.ZodObject> extends F_Security_Model<Collection_ID, ZodSchema> {
    user_id_field: string;

    constructor(collection: F_Collection<Collection_ID, ZodSchema>, user_id_field = 'user_id'){
        super(collection);
        this.needs_auth_user = true;
        this.user_id_field = user_id_field;
    }

    /**
     * Allows the user to GET the document if they're marked as the owner.
     */
    async has_permission(req: Authenticated_Request, res: Response, find: {[key: string]: any}, operation: Operation): Promise<boolean> {
        let user_id = '' + req.auth.user_id;
        
        if (operation === 'get') {
            if(find[this.user_id_field] === user_id) {
                return true;
            }
        }
        return false;
    }
    
    async handle_empty_query_results(req: Request, res: Response, operation: Operation): Promise<Empty_Query_Possibilities> {
        return { data: null };
    }
}