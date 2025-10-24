import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { F_SM_Open_Access } from "@liminalfunctions/framework/F_SM_Open_Access.js";
import { z_mongodb_id } from "@liminalfunctions/framework/index.js";
import z from "zod/v4";
import { add_standard_security } from "./utils.js";

// define a collection for the client
export let collection_client = new F_Collection('client', 'clients', z.object({
    _id: z_mongodb_id,
    tenant_id: z_mongodb_id,
    name: z.string(),
}))
