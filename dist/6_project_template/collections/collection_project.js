import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { F_SM_Open_Access } from "@liminalfunctions/framework/F_SM_Open_Access.js";
import { z_mongodb_id } from "@liminalfunctions/framework/index.js";
import z from "zod/v4";
export let collection_project = new F_Collection('project', 'projects', z.object({
    _id: z_mongodb_id,
    name: z.string(),
    notes: z.string(),
    client_id: z_mongodb_id,
    tenant_id: z_mongodb_id,
}));
collection_project.add_layers([], [new F_SM_Open_Access(collection_project)]);
//# sourceMappingURL=collection_project.js.map