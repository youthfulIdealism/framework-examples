import * as z from "zod/v4";
import { Request, Response } from "express";
import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { Authenticated_Request, Empty_Query_Possibilities, F_Security_Model, Operation } from "@liminalfunctions/framework/F_Security_Model.js";

export class SM_User_Profile<Collection_ID extends string, ZodSchema extends z.ZodObject> extends F_Security_Model<Collection_ID, ZodSchema> {
    user_id_field: string;

    constructor(collection: F_Collection<Collection_ID, ZodSchema>, user_id_field = 'user_id'){
        super(collection);
        this.needs_auth_user = true;
        this.user_id_field = user_id_field;
    }

    /**
     * Allows the user to GET or UPDATE their own user profile, as long as they don't change the user or tenant
     */
    async has_permission(req: Authenticated_Request, res: Response, find: {[key: string]: any}, operation: Operation): Promise<boolean> {
        let user_id = '' + req.auth.user_id;
        
        if (operation === 'get') {
            return req.params.document_id === user_id;
        }

        // if we're updating a specific document, it's valid as long as we modify the
        // find so that it only modifies documents owned by the current user
        if (operation === 'update') {
            find[this.user_id_field] = user_id;
            return !req.body.tenant_id && !req.body.user_id;
        }
        return false;
    }
    
    async handle_empty_query_results(req: Request, res: Response, operation: Operation): Promise<Empty_Query_Possibilities> {
        if (req.params.document_id) {
            let document_result = await this.collection.mongoose_model.findById(req.params.document_id);

            if (document_result) {
                res.status(403);
                return { error: `You do not have permission to ${operation} documents from ${req.params.document_type}.` };
            }
        }

        return { data: null };
    }
}