import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { z } from "zod/v4";
export declare let collection_step: F_Collection<"step", z.ZodObject<{
    _id: z.ZodCustom<string, string>;
    project_id: z.ZodCustom<string, string>;
    user_id: z.ZodCustom<string, string>;
    status: z.ZodEnum<{
        done: "done";
        "not started": "not started";
        started: "started";
    }>;
    phase: z.ZodEnum<{
        end: "end";
        middle: "middle";
        beginning: "beginning";
    }>;
}, z.core.$strip>>;
