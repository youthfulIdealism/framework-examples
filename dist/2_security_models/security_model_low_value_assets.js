import { F_Security_Model } from "@liminalfunctions/framework/F_Security_Model.js";
export class Security_Model_Low_Value_Assets extends F_Security_Model {
    constructor(collection) {
        super(collection);
    }
    async has_permission(req, res, find, operation) {
        if (operation === 'get') {
            if (find.value?.$gt > 10 || find.value?.$gte > 10) {
                return false;
            }
            if (find.value?.$lt > 10 || find.value?.$lte > 10) {
                return false;
            }
            if (!find.value_lt) {
                if (!find.value) {
                    find.value = {};
                }
                find.value.$lt = 10;
            }
            return true;
        }
        if (operation === 'update') {
            find.value = { $lt: 10 };
            return req.body.value < 10;
        }
        if (operation === 'create') {
            return req.body.value < 10;
        }
        if (operation === 'delete') {
            find.value = { $lt: 10 };
            return true;
        }
    }
    async handle_empty_query_results(req, res, operation) {
        if (req.params.document_id) {
            let document_result = await this.collection.mongoose_model.findById(req.params.document_id);
            if (document_result) {
                res.status(403);
                return { error: `You do not have permission to ${operation} documents with a value greater than 10` };
            }
        }
        return { data: null };
    }
}
//# sourceMappingURL=security_model_low_value_assets.js.map