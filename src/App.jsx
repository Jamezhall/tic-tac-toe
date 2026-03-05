import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import './App.css'

const STORAGE_KEYS = {
  player1Name: 'ttt_player1_name',
  player2Name: 'ttt_player2_name',
  player1Wins: 'ttt_player1_wins',
  player2Wins: 'ttt_player2_wins',
  draws: 'ttt_draws',
  lastWinner: 'ttt_last_winner',
  shareUrl: 'ttt_share_url',
  theme: 'ttt_theme',
  pieceMode: 'ttt_piece_mode',
  audioMuted: 'ttt_audio_muted',
  bgmMuted: 'ttt_bgm_muted',
  fxMuted: 'ttt_fx_muted',
}

const THEMES = [
  { id: 'red', label: 'RED', color: '#ff4d57' },
  { id: 'orange', label: 'ORANGE', color: '#ff9b3d' },
  { id: 'yellow', label: 'YELLOW', color: '#ffd84f' },
  { id: 'green', label: 'GREEN', color: '#4be47e' },
  { id: 'blue', label: 'BLUE', color: '#47a0ff' },
  { id: 'purple', label: 'PURPLE', color: '#b072ff' },
  { id: 'pink', label: 'PINK', color: '#f52c8c' },
  { id: 'white', label: 'WHITE', color: '#f4f4f4' },
]

const PIECE_MODES = [
  { id: 'classic', pieces: { X: 'X', O: 'O' } },
  { id: 'pets', pieces: { X: '🐱', O: '🐶' } },
  { id: 'bots', pieces: { X: '🤖', O: '🦖' } },
  { id: 'sweet', pieces: { X: '🧁', O: '🦄' } },
  { id: 'spooky', pieces: { X: '👻', O: '👽' } },
]

const WIN_PATTERNS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

const DEFAULT_NAMES = {
  X: 'Player 1',
  O: 'Player 2',
}

function readNumber(key) {
  const value = Number.parseInt(localStorage.getItem(key) ?? '0', 10)
  return Number.isNaN(value) ? 0 : value
}

function getWinner(board) {
  for (const [a, b, c] of WIN_PATTERNS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { symbol: board[a], combo: [a, b, c] }
    }
  }

  return null
}

function toTerminalText(value) {
  return String(value).toUpperCase()
}

function App() {
  const [board, setBoard] = useState(Array(9).fill(null))
  const [turn, setTurn] = useState('X')
  const [result, setResult] = useState({ status: 'playing', winner: null, combo: [] })
  const [playerNames, setPlayerNames] = useState(() => ({
    X: localStorage.getItem(STORAGE_KEYS.player1Name) || DEFAULT_NAMES.X,
    O: localStorage.getItem(STORAGE_KEYS.player2Name) || DEFAULT_NAMES.O,
  }))
  const [scores, setScores] = useState(() => ({
    X: readNumber(STORAGE_KEYS.player1Wins),
    O: readNumber(STORAGE_KEYS.player2Wins),
    draws: readNumber(STORAGE_KEYS.draws),
  }))
  const [lastWinner, setLastWinner] = useState(
    () => localStorage.getItem(STORAGE_KEYS.lastWinner) || null,
  )
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [nameDraft, setNameDraft] = useState('')
  const [shareUrl, setShareUrl] = useState(
    () => localStorage.getItem(STORAGE_KEYS.shareUrl) || window.location.href,
  )
  const [activeTab, setActiveTab] = useState('registry')
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEYS.theme) || 'pink')
  const [pieceMode, setPieceMode] = useState(
    () => localStorage.getItem(STORAGE_KEYS.pieceMode) || 'classic',
  )
  const [puppyJumping, setPuppyJumping] = useState(false)
  const [tailFlip, setTailFlip] = useState(false)
  const [bootState, setBootState] = useState('idle')
  const [bootProgress, setBootProgress] = useState(0)
  const [isBgmMuted, setIsBgmMuted] = useState(() => {
    const legacy = localStorage.getItem(STORAGE_KEYS.audioMuted) === 'true'
    return (localStorage.getItem(STORAGE_KEYS.bgmMuted) ?? String(legacy)) === 'true'
  })
  const [isFxMuted, setIsFxMuted] = useState(() => {
    const legacy = localStorage.getItem(STORAGE_KEYS.audioMuted) === 'true'
    return (localStorage.getItem(STORAGE_KEYS.fxMuted) ?? String(legacy)) === 'true'
  })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [now, setNow] = useState(() => new Date())
  const puppyJumpTimeoutRef = useRef(null)
  const cursorRef = useRef(null)
  const bootIntervalRef = useRef(null)
  const startClickRef = useRef(null)
  const preloadLoopRef = useRef(null)
  const bgmRef = useRef(null)
  const hoverFxRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.player1Name, playerNames.X)
    localStorage.setItem(STORAGE_KEYS.player2Name, playerNames.O)
  }, [playerNames])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.player1Wins, String(scores.X))
    localStorage.setItem(STORAGE_KEYS.player2Wins, String(scores.O))
    localStorage.setItem(STORAGE_KEYS.draws, String(scores.draws))
  }, [scores])

  useEffect(() => {
    if (lastWinner === null) {
      localStorage.removeItem(STORAGE_KEYS.lastWinner)
      return
    }

    localStorage.setItem(STORAGE_KEYS.lastWinner, lastWinner)
  }, [lastWinner])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.shareUrl, shareUrl)
  }, [shareUrl])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.pieceMode, pieceMode)
  }, [pieceMode])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.bgmMuted, String(isBgmMuted))
  }, [isBgmMuted])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.fxMuted, String(isFxMuted))
  }, [isFxMuted])

  const turnName = playerNames[turn]
  const activePieceMap = PIECE_MODES.find((mode) => mode.id === pieceMode)?.pieces ||
    PIECE_MODES[0].pieces
  const lastWinnerLabel =
    lastWinner === 'Draw'
      ? 'STALEMATE'
      : lastWinner === 'X' || lastWinner === 'O'
        ? toTerminalText(playerNames[lastWinner])
        : 'NO WINNER LOGGED'

  function handleCellClick(index) {
    if (board[index] || result.status !== 'playing') {
      return
    }

    const nextBoard = [...board]
    nextBoard[index] = turn
    const winner = getWinner(nextBoard)

    setBoard(nextBoard)

    if (winner) {
      setResult({ status: 'won', winner: winner.symbol, combo: winner.combo })
      setScores((prev) => ({ ...prev, [winner.symbol]: prev[winner.symbol] + 1 }))
      setLastWinner(winner.symbol)
      return
    }

    if (nextBoard.every(Boolean)) {
      setResult({ status: 'draw', winner: null, combo: [] })
      setScores((prev) => ({ ...prev, draws: prev.draws + 1 }))
      setLastWinner('Draw')
      return
    }

    setTurn((prev) => (prev === 'X' ? 'O' : 'X'))
  }

  function startEdit(player) {
    setEditingPlayer(player)
    setNameDraft(playerNames[player])
  }

  function saveName() {
    if (!editingPlayer) {
      return
    }

    const normalized = nameDraft.trim() || DEFAULT_NAMES[editingPlayer]
    setPlayerNames((prev) => ({ ...prev, [editingPlayer]: normalized }))
    setEditingPlayer(null)
    setNameDraft('')
  }

  function cancelEdit() {
    setEditingPlayer(null)
    setNameDraft('')
  }

  function resetRound() {
    setBoard(Array(9).fill(null))
    setTurn('X')
    setResult({ status: 'playing', winner: null, combo: [] })
  }

  function resetScores() {
    setScores({ X: 0, O: 0, draws: 0 })
    setLastWinner(null)
  }

  function setCurrentUrlAsShareUrl() {
    setShareUrl(window.location.href)
  }

  function handlePuppyJump() {
    if (puppyJumpTimeoutRef.current) {
      clearTimeout(puppyJumpTimeoutRef.current)
    }

    setPuppyJumping(true)
    puppyJumpTimeoutRef.current = setTimeout(() => {
      setPuppyJumping(false)
      puppyJumpTimeoutRef.current = null
    }, 500)
  }

  useEffect(
    () => () => {
      if (puppyJumpTimeoutRef.current) {
        clearTimeout(puppyJumpTimeoutRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    const wagTimer = setInterval(() => {
      setTailFlip((prev) => !prev)
    }, 180)

    return () => clearInterval(wagTimer)
  }, [])

  useEffect(
    () => () => {
      if (bootIntervalRef.current) {
        clearInterval(bootIntervalRef.current)
      }
      for (const ref of [startClickRef, preloadLoopRef, bgmRef, hoverFxRef]) {
        if (ref.current) {
          ref.current.pause()
          ref.current.currentTime = 0
        }
      }
    },
    [],
  )

  useEffect(() => {
    function handleMouseMove(event) {
      if (!cursorRef.current) {
        return
      }
      setMousePos({ x: event.clientX, y: event.clientY })
      cursorRef.current.style.left = `${event.clientX}px`
      cursorRef.current.style.top = `${event.clientY}px`
      cursorRef.current.style.opacity = '1'
    }

    function hideCursor() {
      if (cursorRef.current) {
        cursorRef.current.style.opacity = '0'
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseout', hideCursor)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseout', hideCursor)
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 50)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (startClickRef.current) {
      startClickRef.current.muted = isFxMuted
    }
    if (preloadLoopRef.current) {
      preloadLoopRef.current.muted = isFxMuted
    }
    if (hoverFxRef.current) {
      hoverFxRef.current.muted = isFxMuted
    }
  }, [isFxMuted])

  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.muted = isBgmMuted
      if (isBgmMuted) {
        bgmRef.current.pause()
      }
    }
  }, [isBgmMuted])

  useEffect(() => {
    if (bootState !== 'done' || isBgmMuted || !bgmRef.current) {
      return
    }

    if (bgmRef.current.paused) {
      bgmRef.current.play().catch(() => {})
    }
  }, [bootState, isBgmMuted])

  useEffect(() => {
    function handleButtonHover(event) {
      const button = event.target.closest('button')
      if (!button || button.disabled) {
        return
      }

      const relatedTarget = event.relatedTarget
      if (relatedTarget instanceof Element && button.contains(relatedTarget)) {
        return
      }

      if (isFxMuted || !hoverFxRef.current) {
        return
      }

      hoverFxRef.current.currentTime = 0
      hoverFxRef.current.play().catch(() => {})
    }

    document.addEventListener('mouseover', handleButtonHover)
    return () => document.removeEventListener('mouseover', handleButtonHover)
  }, [isFxMuted])

  const statusLabel =
    result.status === 'won'
      ? `ROUND COMPLETE :: ${toTerminalText(playerNames[result.winner])} VICTOR`
      : result.status === 'draw'
        ? 'ROUND COMPLETE :: STALEMATE'
        : `AWAITING MOVE :: ${activePieceMap[turn]} / ${toTerminalText(turnName)}`

  function startBootSequence() {
    if (bootState === 'loading') {
      return
    }

    setBootState('loading')
    setBootProgress(0)

    if (!isFxMuted && startClickRef.current) {
      startClickRef.current.currentTime = 0
      startClickRef.current.play().catch(() => {})
    }

    if (!isFxMuted && preloadLoopRef.current) {
      preloadLoopRef.current.currentTime = 0
      preloadLoopRef.current.play().catch(() => {})
    }

    if (bootIntervalRef.current) {
      clearInterval(bootIntervalRef.current)
    }

    let progress = 0
    bootIntervalRef.current = setInterval(() => {
      progress += 1
      setBootProgress(progress)

      if (progress >= 100) {
        clearInterval(bootIntervalRef.current)
        bootIntervalRef.current = null

        if (preloadLoopRef.current) {
          preloadLoopRef.current.pause()
          preloadLoopRef.current.currentTime = 0
        }

        if (bgmRef.current) {
          bgmRef.current.currentTime = 0
          if (!isBgmMuted) {
            bgmRef.current.play().catch(() => {})
          }
        }

        setTimeout(() => setBootState('done'), 500)
      }
    }, 50)
  }

  const bootCounter = `[${String(bootProgress).padStart(3, '0')}]`
  const dateText = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`
  const timeText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
    2,
    '0',
  )}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`

  return (
    <>
      <div className="audio-toggles">
        <button
          type="button"
          className="mute-toggle"
          onClick={() => setIsBgmMuted((prev) => !prev)}
          aria-label={isBgmMuted ? 'Unmute background music' : 'Mute background music'}
        >
          {isBgmMuted ? 'BGM: OFF' : 'BGM: ON'}
        </button>
        <button
          type="button"
          className="mute-toggle"
          onClick={() => setIsFxMuted((prev) => !prev)}
          aria-label={isFxMuted ? 'Unmute sound effects' : 'Mute sound effects'}
        >
          {isFxMuted ? 'FX: OFF' : 'FX: ON'}
        </button>
      </div>

      <div className="telemetry" aria-hidden="true">
        <p>[X: {String(mousePos.x).padStart(4, '0')}] [Y: {String(mousePos.y).padStart(4, '0')}]</p>
        <p>[{dateText}] [{timeText}]</p>
      </div>

      <audio ref={startClickRef} src="/audio/boot-start-click.mp3" preload="auto" muted={isFxMuted} />
      <audio
        ref={preloadLoopRef}
        src="/audio/boot-loading-loop.mp3"
        preload="auto"
        loop
        muted={isFxMuted}
      />
      <audio ref={bgmRef} src="/audio/bgm-loop.mp3" preload="auto" loop muted={isBgmMuted} />
      <audio ref={hoverFxRef} src="/audio/hover-fx.mp3" preload="auto" muted={isFxMuted} />

      {bootState !== 'done' ? (
        <div className="boot-overlay" aria-live="polite">
          <div className="boot-panel">
            <p className="boot-title">TACTICAL SYSTEM BOOT</p>
            <p className="boot-line">INIT MODULE :: TIC-TAC-TOE.EXE</p>
            <p className="boot-line">STATUS :: {bootState === 'idle' ? 'AWAITING START' : 'LOADING'}</p>
            <p className="boot-counter">{bootCounter}</p>
            <div className="boot-progress-shell">
              <div className="boot-progress-fill" style={{ width: `${bootProgress}%` }} />
            </div>
            <button
              type="button"
              className="action-btn boot-btn"
              onClick={startBootSequence}
              disabled={bootState === 'loading'}
            >
              {bootState === 'idle' ? '> START SEQUENCE' : '> RUNNING...'}
            </button>
          </div>
        </div>
      ) : null}
      <div className="terminal-plus-cursor" ref={cursorRef} aria-hidden="true" />
      <main className={`app-shell ${bootState !== 'done' ? 'app-obscured' : ''}`}>
        <section className="glass panel game-area">
        <p className="eyebrow">SYSTEM CONSOLE</p>
        <h1>TIC-TAC-TOE.EXE</h1>
        <p className="status">{statusLabel}</p>

        <div className="board" role="grid" aria-label="Tic Tac Toe board">
          {board.map((cell, index) => {
            const isWinningCell = result.combo.includes(index)
            return (
              <button
                key={index}
                className={`cell ${isWinningCell ? 'winning' : ''}`}
                type="button"
                onClick={() => handleCellClick(index)}
                aria-label={`Cell ${index + 1}`}
              >
                {cell ? activePieceMap[cell] : ''}
              </button>
            )
          })}
        </div>

        <div className="actions">
          <button type="button" className="action-btn" onClick={resetRound}>
            {'> INIT NEW ROUND'}
          </button>
          <button type="button" className="action-btn ghost" onClick={resetScores}>
            {'> PURGE SCORE LOG'}
          </button>
        </div>
        </section>

        <section className="glass panel score-area">
        <div className="tab-bar" role="tablist" aria-label="Right panel tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'registry'}
            className={`tab-btn ${activeTab === 'registry' ? 'active' : ''}`}
            onClick={() => setActiveTab('registry')}
          >
            Play
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'settings'}
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'link'}
            className={`tab-btn ${activeTab === 'link' ? 'active' : ''}`}
            onClick={() => setActiveTab('link')}
          >
            Link
          </button>
        </div>

        {activeTab === 'registry' ? (
          <>
            <h2>PLAYER REGISTRY</h2>
            <p className="helper">Click a callsign to edit.</p>

            <div className="nameplates">
              {['X', 'O'].map((symbol) => (
                <article
                  className={`nameplate ${turn === symbol && result.status === 'playing' ? 'active' : ''}`}
                  key={symbol}
                >
                  <span className="symbol">{activePieceMap[symbol]}</span>
                  {editingPlayer === symbol ? (
                    <input
                      autoFocus
                      className="name-input"
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.target.value)}
                      onBlur={saveName}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          saveName()
                        }
                        if (event.key === 'Escape') {
                          cancelEdit()
                        }
                      }}
                    />
                  ) : (
                    <button type="button" className="name-button" onClick={() => startEdit(symbol)}>
                      {playerNames[symbol]}
                    </button>
                  )}
                  <strong className="score">WINS_LOG: {scores[symbol]}</strong>
                </article>
              ))}
            </div>

            <div className="stats-row">
              <div className="stat-box">
                <span>STALEMATES</span>
                <strong>{scores.draws}</strong>
              </div>
              <div className="stat-box">
                <span>LAST VICTOR</span>
                <strong>{lastWinnerLabel}</strong>
              </div>
            </div>

            <button
              type="button"
              className="puppy-terminal"
              aria-label="Animated puppy companion"
              onClick={handlePuppyJump}
            >
              <div className={`puppy ${puppyJumping ? 'jumping' : ''}`} aria-hidden="true">
                <span className="ascii-tail">{tailFlip ? '^/' : '^\\'}</span>
                <pre className="puppy-art">
                  {` /        //o__o
/\\       /  __/
\\ \\______\\  /
 \\         /
  \\ \\----\\ \\
   \\_\\_   \\_\\_`}
                </pre>
              </div>
              <p className="puppy-label">SYSTEM PUPPY :: ONLINE</p>
            </button>
          </>
        ) : activeTab === 'settings' ? (
          <>
            <h2>SYSTEM SETTINGS</h2>
            <p className="helper">Select accent color and piece mode.</p>

            <div className="theme-panel">
              <p className="share-title">ACCENT COLOR</p>
              <div className="theme-grid" role="list" aria-label="Color themes">
                {THEMES.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`theme-btn ${theme === option.id ? 'active' : ''}`}
                    onClick={() => setTheme(option.id)}
                  >
                    <span className="theme-swatch" style={{ background: option.color }} aria-hidden="true" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mode-panel">
              <p className="share-title">MODE</p>
              <div className="mode-grid" role="list" aria-label="Piece modes">
                {PIECE_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    className={`mode-btn ${pieceMode === mode.id ? 'active' : ''}`}
                    onClick={() => setPieceMode(mode.id)}
                    aria-label={`${mode.pieces.X} and ${mode.pieces.O} mode`}
                  >
                    <span>{mode.pieces.X}</span>
                    <span>{mode.pieces.O}</span>
                  </button>
                ))}
                <div className="mode-btn coming-soon" aria-label="Mode coming soon">
                  COMING SOON
                </div>
              </div>
            </div>

          </>
        ) : (
          <>
            <h2>PHONE LINK</h2>
            <p className="helper">Paste LAN URL and scan code on second device.</p>

            <div className="share-panel">
              <p className="share-title">PHONE ACCESS LINK</p>
              <p className="share-hint">PASTE LAN URL (EXAMPLE: HTTP://192.168.X.X:5173)</p>
              <input
                className="share-input"
                value={shareUrl}
                onChange={(event) => setShareUrl(event.target.value)}
                onBlur={() => setShareUrl((prev) => prev.trim())}
                aria-label="Share URL for QR code"
              />
              <button type="button" className="action-btn share-btn" onClick={setCurrentUrlAsShareUrl}>
                {'> USE CURRENT URL'}
              </button>
              <div className="qr-wrap" aria-label="QR code for phone access">
                <QRCodeSVG
                  value={shareUrl || window.location.href}
                  size={148}
                  bgColor="#110813"
                  fgColor={THEMES.find((option) => option.id === theme)?.color || '#f52c8c'}
                  includeMargin={false}
                  level="M"
                />
              </div>
            </div>
          </>
        )}
        </section>
      </main>
    </>
  )
}

export default App
