#!/usr/bin/env node

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const quizAppDir = path.join(repoRoot, 'quiz-app')
const learnDir = path.join(quizAppDir, 'content', 'learn')
const exerciseDir = path.join(quizAppDir, 'content', 'exercises')

const lessonSlugs = fs
  .readdirSync(learnDir)
  .filter((file) => file.endsWith('.md'))
  .sort()
  .map((file) => file.replace(/\.md$/, ''))

const foundationSlug = lessonSlugs.find((slug) => slug === '00-foundations')
const chromePath =
  process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

if (!fs.existsSync(chromePath)) {
  console.error(`Chrome not found at ${chromePath}. Set CHROME_BIN to run smoke tests.`)
  process.exit(1)
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-lms-smoke-'))
let server
let chrome

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitFor(check, description, timeoutMs = 15000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const value = await check()
      if (value) return value
    } catch {
      // ignore and retry
    }
    await sleep(250)
  }
  throw new Error(`Timed out waiting for ${description}`)
}

async function startDevServer() {
  server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173'], {
    cwd: quizAppDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  server.stdout.on('data', () => {})
  server.stderr.on('data', () => {})

  await waitFor(async () => {
    const res = await fetch('http://127.0.0.1:4173/')
    return res.ok
  }, 'Vite dev server')
}

async function startChrome() {
  chrome = spawn(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--remote-debugging-port=9222',
      `--user-data-dir=${tmpDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'ignore'] },
  )

  await waitFor(async () => {
    const res = await fetch('http://127.0.0.1:9222/json/version')
    return res.ok
  }, 'Chrome DevTools endpoint')
}

async function openPage() {
  const response = await fetch('http://127.0.0.1:9222/json/new?http://127.0.0.1:4173/', {
    method: 'PUT',
  })
  const page = await response.json()
  return createCdpClient(page.webSocketDebuggerUrl)
}

function createCdpClient(wsUrl) {
  const ws = new WebSocket(wsUrl)
  let id = 0
  const pending = new Map()

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data)
    if (msg.id && pending.has(msg.id)) {
      const handlers = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) handlers.reject(new Error(JSON.stringify(msg.error)))
      else handlers.resolve(msg.result)
    }
  }

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const msgId = ++id
      pending.set(msgId, { resolve, reject })
      ws.send(JSON.stringify({ id: msgId, method, params }))
    })

  const evaluate = async (expression) =>
    (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result
      .value

  return {
    async init() {
      await new Promise((resolve) => {
        ws.onopen = resolve
      })
      await send('Page.enable')
      await send('Runtime.enable')
      await sleep(600)
    },
    async navigate(url) {
      await send('Page.navigate', { url })
      await sleep(900)
    },
    evaluate,
    close() {
      ws.close()
    },
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function clickButton(client, pattern, index = 0) {
  const clicked = await client.evaluate(`(() => {
    const matches = [...document.querySelectorAll('button')].filter((button) => ${pattern}.test(button.innerText))
    const target = matches[${index}]
    if (!target) return false
    target.click()
    return true
  })()`)
  assert(clicked, `Unable to find button matching ${pattern}`)
  await sleep(700)
}

async function setCourseState(client, { completedLessons = [], completedExercises = [], quizAttempts = [] }) {
  await client.evaluate(`(() => {
    localStorage.setItem('completedLessons', JSON.stringify(${JSON.stringify(completedLessons)}))
    localStorage.setItem('completedExercises', JSON.stringify(${JSON.stringify(completedExercises)}))
    localStorage.setItem('quizAttempts', JSON.stringify(${JSON.stringify(quizAttempts)}))
    location.reload()
  })()`)
  await sleep(1000)
}

async function run() {
  await startDevServer()
  await startChrome()
  const client = await openPage()
  await client.init()

  try {
    await client.navigate('http://127.0.0.1:4173/')
    await client.evaluate('localStorage.clear(); location.reload()')
    await sleep(1000)

    const homeText = await client.evaluate('document.body.innerText')
    assert(homeText.includes('4\nLABS') || homeText.includes('4\nLABS\n'), 'Home page should show labs count')
    assert(homeText.includes('Follow the full course path'), 'Home page should describe the LMS path')

    await clickButton(client, '/Start learning|Continue studying/i')
    let studyText = await client.evaluate('document.body.innerText')
    assert(studyText.includes('0 of 41 milestones complete'), 'Study page should start at 0/41 milestones')
    assert(studyText.includes('Practical exercises'), 'Study page should include the exercise milestone section')

    await clickButton(client, '/Cross-Domain Foundations/i')
    await client.evaluate('window.scrollTo(0, document.body.scrollHeight)')
    await sleep(300)
    await clickButton(client, '/The Agentic Loop Lifecycle/i')
    const lessonText = await client.evaluate('document.body.innerText')
    assert(lessonText.includes('The Agentic Loop Lifecycle'), 'Foundations next action should open Domain 1 lesson 1.1')

    await client.navigate('http://127.0.0.1:4173/')
    await setCourseState(client, {
      completedLessons: foundationSlug ? [foundationSlug] : [],
      completedExercises: [],
      quizAttempts: [],
    })
    await clickButton(client, '/Start learning|Continue studying/i')
    studyText = await client.evaluate('document.body.innerText')
    assert(!studyText.includes('0 of 41 milestones complete'), 'Foundations completion should affect overall progress')

    await setCourseState(client, {
      completedLessons: lessonSlugs,
      completedExercises: [],
      quizAttempts: [],
    })
    await client.navigate('http://127.0.0.1:4173/')
    await clickButton(client, '/Start learning|Continue studying/i')
    await clickButton(client, '/View readiness & coverage/i')
    const readinessText = await client.evaluate('document.body.innerText')
    assert(
      readinessText.includes('Take Domain 1 checkpoint'),
      'Readiness should recommend the first missing domain checkpoint before labs or the final exam',
    )
    assert(readinessText.includes('30/30 taught'), 'Readiness should show taught coverage')
    assert(readinessText.includes('30/30 checked'), 'Readiness should show checked coverage')
    assert(/no\s+lab/i.test(readinessText), 'Coverage map should make missing applied coverage explicit')

    await client.navigate('http://127.0.0.1:4173/')
    await clickButton(client, '/Start learning|Continue studying/i')
    await clickButton(client, '/Take checkpoint/i', 0)
    const checkpointText = await client.evaluate('document.body.innerText')
    assert(checkpointText.includes('Domain 1 checkpoint'), 'Completed domain CTA should launch a working checkpoint')

    await client.navigate('http://127.0.0.1:4173/')
    await clickButton(client, '/Start learning|Continue studying/i')
    await clickButton(client, '/Build a Multi-Tool Agent with Escalation Logic/i')
    const exerciseText = await client.evaluate('document.body.innerText')
    assert(exerciseText.includes('EXPECTED DELIVERABLES'), 'Exercise page should render deliverables')
    assert(exerciseText.includes('Why this matters for the exam'), 'Exercise page should explain exam relevance')

    console.log('LMS smoke test passed.')
  } finally {
    client.close()
  }
}

try {
  await run()
} finally {
  if (chrome && !chrome.killed) chrome.kill('SIGKILL')
  if (server && !server.killed) server.kill('SIGINT')
  fs.rmSync(tmpDir, { recursive: true, force: true })
}
