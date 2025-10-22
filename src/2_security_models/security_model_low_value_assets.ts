import * as z from "zod/v4";
import { Request, Response } from "express";
import { Empty_Query_Possibilities, F_Security_Model, Operation } from "@liminalfunctions/framework/F_Security_Model.js";
import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";

export class Security_Model_Low_Value_Assets<Collection_ID extends string, ZodSchema extends z.ZodObject> extends F_Security_Model<Collection_ID, ZodSchema> {

    constructor(collection: F_Collection<Collection_ID, ZodSchema>){
        super(collection);
    }

    /**
     * has_permission returns true if this security model grants permission to the user to perform the operation.
     * 
     * This particular security model allows access to operations on items with a value less than 10. Security models have
     * the ability to make changes to the mongoDB filter used by the mongoDB find/create/update/delete operation, passed in
     * as the "find" parameter. So, this security model will grant permission, then constrain the find operation to only
     * work when the document's value is adequately low.
     * 
     * This means that caution should be excersized when using more than one security model that modifies the find operation:
     * if a prior security model modifies the find, that modification will persist to later models, impacting the results of
     * the operation. Thios also means the security model is capable of overwriting the properties of the filter that keep
     * the operation constrained to the correct layers.
     * 
     * Be careful!
     */
    async has_permission(req: Request, res: Response, find: {[key: string]: any}, operation: Operation): Promise<boolean> {
        // when we're getting 
        if(operation === 'get') {
            // the user has asked for assets that are too valuable; deny the request.
            if(find.value?.$gt > 10 || find.value?.$gte > 10){ return false; }
            if(find.value?.$lt > 10 || find.value?.$lte > 10){ return false; }

            // if the user hasn't specified the value of the assets, automatically constrain the request to items worth less than 10
            if(!find.value_lt) {
                if(!find.value){ find.value = {}; }
                find.value.$lt = 10;
            }
            return true;
        }

        // if the operation is an update operation, constrain it so that it can only act on assets with a worth less than 10
        if(operation === 'update'){
            find.value = { $lt: 10 }
            return req.body.value < 10;
        }

        // if the operation is a create operation, constrain it so that it can only create assets with a worth less than 10.
        if(operation === 'create'){
            return  req.body.value < 10;
        }

        // if the operation is a create operation, constrain it so that it can only delete assets with a worth less than 10.
        if(operation === 'delete'){
            find.value = { $lt: 10 }
            return true;
        }
    }

    /**
     * In the event that the query results are empty, this method allows the security model to decide whether to
     * throw an access error or just return no data. In this case, when no documents are found but accessing
     * the target document directly returns something, it means the find filter was modified by has_permission and
     * ineligible documents exist. This means the issue has to do with permission rather than no documents being found.
     */
    async handle_empty_query_results(req: Request, res: Response, operation: Operation): Promise<Empty_Query_Possibilities> {
        if (req.params.document_id) {
            let document_result = await this.collection.mongoose_model.findById(req.params.document_id);

            if (document_result) {
                res.status(403);
                return { error: `You do not have permission to ${operation} documents with a value greater than 10` };
            }
        }
        return { data: null }
    }
}