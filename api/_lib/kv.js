// Cliente de Upstash Redis (Vercel Marketplace) con fallback en memoria.
//
// Sin UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN configuradas, se
// usa un Map en memoria del propio proceso — sirve para probar la lógica
// localmente, pero en producción (funciones serverless sin estado entre
// invocaciones) no persiste de verdad hasta conectar Upstash.

import { Redis } from '@upstash/redis'

let client = null
export const isKvConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

if (isKvConfigured) {
  client = Redis.fromEnv()
}

const memoryStore = new Map()

function memoryGet(key) {
  const entry = memoryStore.get(key)
  if (!entry) return null
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    memoryStore.delete(key)
    return null
  }
  return entry.value
}

function memorySet(key, value, { ex } = {}) {
  memoryStore.set(key, { value, expiresAt: ex ? Date.now() + ex * 1000 : null })
}

export const kv = {
  async get(key) {
    if (client) return client.get(key)
    return memoryGet(key)
  },

  async set(key, value, options) {
    if (client) return client.set(key, value, options)
    return memorySet(key, value, options)
  },

  async del(key) {
    if (client) return client.del(key)
    memoryStore.delete(key)
  },

  async incr(key) {
    if (client) return client.incr(key)
    const current = Number(memoryGet(key)) || 0
    const next = current + 1
    memorySet(key, next)
    return next
  },

  async sadd(key, member) {
    if (client) return client.sadd(key, member)
    const set = new Set(memoryGet(key) || [])
    set.add(member)
    memorySet(key, Array.from(set))
  },

  async srem(key, member) {
    if (client) return client.srem(key, member)
    const set = new Set(memoryGet(key) || [])
    set.delete(member)
    memorySet(key, Array.from(set))
  },

  async smembers(key) {
    if (client) return client.smembers(key)
    return memoryGet(key) || []
  },
}
