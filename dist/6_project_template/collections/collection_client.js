import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { z_mongodb_id } from "@liminalfunctions/framework/index.js";
import z from "zod/v4";
export let collection_client = new F_Collection('client', 'clients', z.object({
    _id: z_mongodb_id,
    tenant_id: z_mongodb_id,
    name: z.string(),
}));
//# sourceMappingURL=collection_client.js.map