import * as z from "zod/v4";
import { Request, Response } from "express";
import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { Authenticated_Request, Empty_Query_Possibilities, F_Security_Model, Operation } from "@liminalfunctions/framework/F_Security_Model.js";
import { collection_user } from "../collections/collection_user.js";

export class SM_User<Collection_ID extends string, ZodSchema extends z.ZodObject> extends F_Security_Model<Collection_ID, ZodSchema> {
    user_id_field: string;

    constructor(collection: F_Collection<Collection_ID, ZodSchema>, user_id_field = 'user_id'){
        super(collection);
        this.needs_auth_user = true;
        this.user_id_field = user_id_field;
    }

    /**
     * Allows the user to GET their own user record
     */
    async has_permission(req: Authenticated_Request, res: Response, find: {[key: string]: any}, operation: Operation): Promise<boolean> {
        let user_id = '' + req.auth.user_id;

        if (operation === 'get') {
            return req.params.document_id === user_id || (await collection_user.mongoose_model.findById(user_id)).auth_system_id === find.auth_system_id;
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