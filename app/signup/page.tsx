import { redirect } from "next/navigation"

/** Public signup is disabled — accounts are created in Supabase. */
export default function SignupPage() {
  redirect("/login")
}
