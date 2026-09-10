"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AuthForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleAuth() {
    setPending(true)
    setMessage(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(error.message)
        return
      }
      // Ensure session cookies are written before navigation.
      await supabase.auth.getSession()
      window.location.assign("/")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong. Try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md border-primary/20">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Invite-only access. Use the email and password from your Tank Tracker account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void handleAuth()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {message ? <p className="text-sm text-destructive">{message}</p> : null}
          <Button
            type="button"
            className="w-full"
            disabled={pending}
            onClick={() => void handleAuth()}
          >
            {pending ? "Working…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
