import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { F_SM_Open_Access } from "@liminalfunctions/framework/F_SM_Open_Access.js";
import { z_mongodb_id } from "@liminalfunctions/framework/index.js";
import { z } from "zod/v4";

// define a collection for the steps
export let collection_tenant = new F_Collection('tenant', 'tenants', z.object({
    _id: z_mongodb_id,
    name: z.string()
}))
collection_tenant.add_layers([], [new F_SM_Open_Access(collection_tenant)]);
