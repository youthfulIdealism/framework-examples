import { F_Collection } from "@liminalfunctions/framework/F_Collection.js";
import { F_SM_Role_Membership } from "@liminalfunctions/framework/F_SM_Role_Membership.js";
import { collection_tenant } from "./collection_tenant.js";
import { collection_tenant_role_membership } from "./collection_tenant_role_membership.js";
import { collection_role } from "./collection_role.js";
import { Cache } from '@liminalfunctions/framework/cache.js'
import { collection_client } from "./collection_client.js";
import { collection_client_role_membership } from "./collection_client_role_membership.js";
import z from "zod/v4";

export let role_membership_cache = new Cache(1000 * 60);
export let client_role_membership_cache = new Cache(1000 * 60);
export let role_cache = new Cache(1000 * 60);

export function get_sm_role_membership<Collection_ID extends string, ZodSchema extends z.ZodObject>(collection: F_Collection<Collection_ID, ZodSchema>){
    return new F_SM_Role_Membership(
        collection, 
        collection_tenant,
        collection_tenant_role_membership,
        collection_role,
        role_membership_cache,
        role_cache
    );
}

export function get_sm_client_role_membership<Collection_ID extends string, ZodSchema extends z.ZodObject>(collection: F_Collection<Collection_ID, ZodSchema>){
    return new F_SM_Role_Membership(
        collection, 
        collection_client,
        collection_client_role_membership,
        collection_role,
        client_role_membership_cache,
        role_cache
    );
}

export function add_standard_security<Collection_ID extends string, ZodSchema extends z.ZodObject>(collection: F_Collection<Collection_ID, ZodSchema>){
    collection.add_layers(['tenant'], [
        get_sm_role_membership(collection)
    ]);
    collection.add_layers(['tenant', 'client'], [
        get_sm_client_role_membership(collection)
    ]);
}

export function add_tenant_security<Collection_ID extends string, ZodSchema extends z.ZodObject>(collection: F_Collection<Collection_ID, ZodSchema>){
    collection.add_layers(['tenant'], [
        get_sm_role_membership(collection)
    ]);
}