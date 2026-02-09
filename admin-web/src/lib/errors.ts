import axios from "axios"

export function getApiErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as unknown
    if (data && typeof data === "object" && "error" in data) {
      const maybe = (data as { error?: unknown }).error
      if (typeof maybe === "string" && maybe.trim()) return maybe
    }
    return err.message || fallback
  }

  if (err instanceof Error) return err.message || fallback
  return fallback
}

