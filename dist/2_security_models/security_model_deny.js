import { F_Security_Model } from "@liminalfunctions/framework/F_Security_Model.js";
export class Security_Model_Deny extends F_Security_Model {
    constructor(collection) {
        super(collection);
    }
    async has_permission(req, res, find, operation) {
        console.log(`trying to access collection ${this.collection.collection_id} through Security_Model_Deny. Access denied; if there's another security model for this layer, it will be tried next.`);
        return false;
    }
    async handle_empty_query_results(req, res, operation) {
        return { data: null };
    }
}
//# sourceMappingURL=security_model_deny.js.map