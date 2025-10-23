import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { F_SM_Open_Access } from "@liminalfunctions/framework/F_SM_Open_Access.js";
import { z_mongodb_id } from "@liminalfunctions/framework/index.js";
import z from "zod/v4";
export let collection_analytics = new F_Collection('analytics', 'analytics', z.object({
    _id: z_mongodb_id,
    user_id: z_mongodb_id,
    started_projects: z.number(),
    finished_steps: z.number(),
}));
collection_analytics.add_layers([], [new F_SM_Open_Access(collection_analytics)]);
//# sourceMappingURL=collection_analytics.js.map