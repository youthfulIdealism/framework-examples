import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import z from "zod/v4";
export declare let collection_analytics: F_Collection<"analytics", z.ZodObject<{
    _id: z.ZodCustom<string, string>;
    user_id: z.ZodCustom<string, string>;
    started_projects: z.ZodNumber;
    finished_steps: z.ZodNumber;
}, z.core.$strip>>;
