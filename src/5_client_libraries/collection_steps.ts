import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { F_SM_Open_Access } from "@liminalfunctions/framework/F_SM_Open_Access.js";
import { z_mongodb_id } from "@liminalfunctions/framework/index.js";
import { z } from "zod/v4";
import { collection_analytics } from "./collection_analytics.js";
import { collection_project } from "./collection_project.js";

// define a collection for the steps
export let collection_step = new F_Collection('step', 'steps', z.object({
    _id: z_mongodb_id,
    project_id: z_mongodb_id,
    user_id: z_mongodb_id,
    status: z.enum(['not started', 'started', 'done']),
    phase: z.enum(['beginning', 'middle', 'end']),
}))
collection_step.add_layers([], [new F_SM_Open_Access(collection_step)]);

// after a step is updated, update the analytics for that user
collection_step.after_update(async (updated_document) => {
    let [finished_steps, analytics] = await Promise.all([
        collection_step.mongoose_model.countDocuments({user_id: updated_document.user_id, status: 'done'}),
        collection_analytics.mongoose_model.findOne({
            user_id: updated_document.user_id
        }).lean()
    ])

    if(!analytics) {
        console.warn(`Something strange has happened--there weren't analytics available for the step already`)
        let project_count = await collection_project.mongoose_model.countDocuments({user_id: updated_document.user_id })

        await collection_analytics.mongoose_model.findOne({
            user_id: updated_document.user_id,
            started_projects: project_count,
            finished_steps: finished_steps,
        })
    } else {
        await collection_analytics.mongoose_model.findByIdAndUpdate(analytics._id, {
            finished_steps: finished_steps,
        })
    }
})