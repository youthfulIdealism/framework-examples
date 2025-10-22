import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { F_SM_Open_Access } from "@liminalfunctions/framework/F_SM_Open_Access.js";
import { z_mongodb_id } from "@liminalfunctions/framework/index.js";
import z from "zod/v4";
import { collection_step } from "./collection_steps.js";
import { collection_analytics } from "./collection_analytics.js";
export let collection_project = new F_Collection('project', 'projects', z.object({
    _id: z_mongodb_id,
    user_id: z_mongodb_id,
    name: z.string(),
    notes: z.string(),
}));
collection_project.add_layers([], [new F_SM_Open_Access(collection_project)]);
collection_project.on_create(async (session, created_document) => {
    for (let phase of ['beginning', 'middle', 'end']) {
        await collection_step.mongoose_model.create([{
                project_id: created_document._id,
                user_id: created_document.user_id,
                status: "not started",
                phase: phase,
            }], { session: session });
    }
});
collection_project.after_create(async (created_document) => {
    let analytics = await collection_analytics.mongoose_model.findOne({
        user_id: created_document.user_id
    }).lean();
    if (!analytics) {
        await collection_analytics.mongoose_model.create({
            user_id: created_document.user_id,
            started_projects: 1,
            finished_steps: 0,
        });
    }
    else {
        await collection_analytics.mongoose_model.findByIdAndUpdate(analytics._id, {
            $inc: { started_projects: 1 }
        });
    }
});
//# sourceMappingURL=collection_project.js.map