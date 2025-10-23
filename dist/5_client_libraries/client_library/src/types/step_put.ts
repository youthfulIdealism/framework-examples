export type step_put = {
	"_id"?: string
	"project_id"?: string
	"user_id"?: string
	"status"?: ("not started" | "started" | "done")
	"phase"?: ("beginning" | "middle" | "end")
}