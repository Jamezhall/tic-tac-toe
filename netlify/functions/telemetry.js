import { Redis } from '@upstash/redis'

const DEFAULT_STATS = {
  games_played: 0,
  wins_X: 0,
  wins_O: 0,
  draws: 0,
  last_result: null,
  last_played_at: null,
}

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
}

function badRequest(message, status = 400) {
  return json({ error: message }, { status })
}

function normalizeStats(stats = {}) {
  return {
    games_played: Number.parseInt(stats.games_played ?? '0', 10) || 0,
    wins_X: Number.parseInt(stats.wins_X ?? '0', 10) || 0,
    wins_O: Number.parseInt(stats.wins_O ?? '0', 10) || 0,
    draws: Number.parseInt(stats.draws ?? '0', 10) || 0,
    last_result: stats.last_result ?? null,
    last_played_at: stats.last_played_at ?? null,
  }
}

function createKey(game) {
  return `game:${game}:telemetry:global`
}

function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    throw new Error('Missing Upstash Redis environment variables')
  }

  return new Redis({ url, token })
}

async function readStats(redis, game) {
  const key = createKey(game)
  const stats = await redis.hgetall(key)

  if (!stats || Object.keys(stats).length === 0) {
    return DEFAULT_STATS
  }

  return normalizeStats(stats)
}

async function updateStats(redis, game, result) {
  const key = createKey(game)
  const timestamp = new Date().toISOString()
  const pipeline = redis.pipeline()

  pipeline.hincrby(key, 'games_played', 1)

  if (result === 'X') {
    pipeline.hincrby(key, 'wins_X', 1)
  } else if (result === 'O') {
    pipeline.hincrby(key, 'wins_O', 1)
  } else if (result === 'Draw') {
    pipeline.hincrby(key, 'draws', 1)
  }

  pipeline.hset(key, {
    last_result: result,
    last_played_at: timestamp,
  })

  await pipeline.exec()

  return readStats(redis, game)
}

export default async (request) => {
  try {
    const redis = getRedisClient()
    const url = new URL(request.url)

    if (request.method === 'GET') {
      const game = url.searchParams.get('game')?.trim()

      if (!game) {
        return badRequest('Missing game query parameter')
      }

      const stats = await readStats(redis, game)
      return json({ game, stats })
    }

    if (request.method === 'POST') {
      const body = await request.json().catch(() => null)
      const game = body?.game?.trim()
      const result = body?.result

      if (!game) {
        return badRequest('Missing game in request body')
      }

      if (!['X', 'O', 'Draw'].includes(result)) {
        return badRequest('Result must be X, O, or Draw')
      }

      const stats = await updateStats(redis, game, result)
      return json({ game, stats })
    }

    return badRequest('Method not allowed', 405)
  } catch (error) {
    return json(
      {
        error: 'Telemetry request failed',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
