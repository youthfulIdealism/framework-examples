import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import z from "zod/v4";
export declare let collection_project: F_Collection<"project", z.ZodObject<{
    _id: z.ZodCustom<string, string>;
    assignees: z.ZodArray<z.ZodCustom<string, string>>;
    name: z.ZodString;
    notes: z.ZodString;
    client_id: z.ZodCustom<string, string>;
    tenant_id: z.ZodCustom<string, string>;
}, z.core.$strip>>;
