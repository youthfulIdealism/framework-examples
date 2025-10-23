export type project_query = {
	"limit"?: number
	"cursor"?: string
	"sort_order"?: ("ascending" | "descending")
	"_id"?: string
	"_id_gt"?: string
	"_id_lt"?: string
	"_id_in"?: string[]
	"user_id"?: string
	"user_id_gt"?: string
	"user_id_lt"?: string
	"user_id_in"?: string[]
	"name"?: string
	"name_gt"?: string
	"name_lt"?: string
	"name_in"?: string[]
	"notes"?: string
	"notes_gt"?: string
	"notes_lt"?: string
	"notes_in"?: string[]
	"sort"?: ("_id" | "user_id" | "name" | "notes")
}