import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { z } from "zod/v4";
export declare let collection_tenant: F_Collection<"tenant", z.ZodObject<{
    _id: z.ZodCustom<string, string>;
    name: z.ZodString;
}, z.core.$strip>>;
