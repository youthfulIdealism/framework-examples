import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { z_mongodb_id } from "@liminalfunctions/framework/index.js";
import z from "zod/v4";
import { add_tenant_security } from "./utils.js";

export let collection_role = new F_Collection('role', 'roles', z.object({
    _id: z_mongodb_id,
    name: z.string(),
    tenant_id: z_mongodb_id,
    permissions: z.record(z.string(), z.array(z.enum(['read', 'create', 'update', 'delete']))),
}))