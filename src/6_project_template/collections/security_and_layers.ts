import { F_SM_Ownership } from "@liminalfunctions/framework/F_SM_Ownership.js";
import { SM_User } from "../security_models/SM_User.js";
import { collection_user } from "./collection_user.js";
import { collection_user_profile } from "./collection_user_profile.js";
import { add_standard_security, add_tenant_security, get_sm_client_role_membership, get_sm_role_membership } from "./utils.js";
import { collection_tenant_role_membership } from "./collection_tenant_role_membership.js";
import { collection_role } from "./collection_role.js";
import { collection_project } from "./collection_project.js";
import { collection_client } from "./collection_client.js";
import { collection_client_role_membership } from "./collection_client_role_membership.js";
import { collection_tenant } from "./collection_tenant.js";
import { SM_Owner_Read } from "../security_models/SM_Owner_Read.js";

// add standard tenant, tenant/client layers & security to client-level collections
add_standard_security(collection_project);
//add_standard_security(collection_client);
add_standard_security(collection_client_role_membership);

// add standard tenant layers & security to tenant-level collections
add_tenant_security(collection_tenant_role_membership);
add_tenant_security(collection_role);

// add special security to collections that need non-standard behavior
collection_user.add_layers([], [new SM_User(collection_user)]);// users can read their own user records
collection_tenant.add_layers([], [get_sm_role_membership(collection_tenant)])// tenants can be read if the user has permission, but from the api root
collection_client.add_layers(['tenant'], [get_sm_role_membership(collection_client), get_sm_client_role_membership(collection_client)])// tenants can be read if the user has permission, but from the api root
collection_user_profile.add_layers(['tenant'], [// user profiles can be read or updated by their owners, or users with relevant permissions.
    new F_SM_Ownership(collection_user_profile),
    get_sm_role_membership(collection_user_profile)
]);
collection_tenant_role_membership.add_layers([], [new SM_Owner_Read(collection_tenant_role_membership)])// users can read their own tenant role memberships
collection_client_role_membership.add_layers(['tenant'], [new SM_Owner_Read(collection_client_role_membership)])// users can read their own client role memberships