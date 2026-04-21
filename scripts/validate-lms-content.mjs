#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { load as yamlLoad } from '../quiz-app/node_modules/js-yaml/dist/js-yaml.mjs'

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const learnDir = path.join(repoRoot, 'quiz-app', 'content', 'learn')
const exerciseDir = path.join(repoRoot, 'quiz-app', 'content', 'exercises')
const questionDir = path.join(repoRoot, 'quiz-app', 'content', 'questions')
const examGuidePath = path.join(repoRoot, 'exam-guide.md')

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/m)
  if (!match) return { meta: null, body: raw }
  return { meta: yamlLoad(match[1]), body: match[2] }
}

const examGuide = read(examGuidePath)
const examTasks = [...examGuide.matchAll(/^### Task Statement ([0-9]+\.[0-9]+):\s+(.+)$/gm)].map(
  (match) => ({
    id: match[1],
    title: match[2],
  }),
)

const validTaskIds = new Set(examTasks.map((task) => task.id))
const validDomainIds = new Set([1, 2, 3, 4, 5])

const lessonFiles = fs.readdirSync(learnDir).filter((file) => file.endsWith('.md'))
const lessons = lessonFiles.map((file) => {
  const { meta } = parseFrontmatter(read(path.join(learnDir, file)))
  return { file, ...meta }
})

const exerciseFiles = fs.readdirSync(exerciseDir).filter((file) => file.endsWith('.md'))
const exercises = exerciseFiles.map((file) => {
  const { meta } = parseFrontmatter(read(path.join(exerciseDir, file)))
  return { file, ...meta }
})

const questionFiles = fs.readdirSync(questionDir).filter((file) => file.endsWith('.yaml'))
const questions = questionFiles.flatMap((file) => {
  const parsed = yamlLoad(read(path.join(questionDir, file)))
  return parsed.questions ?? []
})

const errors = []

for (const task of examTasks) {
  if (!lessons.some((lesson) => lesson.taskStatement === task.id)) {
    errors.push(`Missing lesson coverage for task statement ${task.id} (${task.title})`)
  }
  if (!questions.some((question) => question.taskStatement === task.id)) {
    errors.push(`Missing question coverage for task statement ${task.id} (${task.title})`)
  }
}

for (const exercise of exercises) {
  if (!exercise.id) errors.push(`Exercise ${exercise.file} is missing id`)
  if (!exercise.title) errors.push(`Exercise ${exercise.file} is missing title`)
  if (!Array.isArray(exercise.domains) || exercise.domains.length === 0) {
    errors.push(`Exercise ${exercise.file} must declare at least one domain`)
  }
  if (!Array.isArray(exercise.taskStatements) || exercise.taskStatements.length === 0) {
    errors.push(`Exercise ${exercise.file} must declare at least one taskStatement`)
  }
  if (!Array.isArray(exercise.deliverables) || exercise.deliverables.length === 0) {
    errors.push(`Exercise ${exercise.file} must declare at least one deliverable`)
  }

  for (const domainId of exercise.domains ?? []) {
    if (!validDomainIds.has(domainId)) {
      errors.push(`Exercise ${exercise.file} references invalid domain ${domainId}`)
    }
  }

  for (const taskId of exercise.taskStatements ?? []) {
    if (!validTaskIds.has(taskId)) {
      errors.push(`Exercise ${exercise.file} references invalid task statement ${taskId}`)
    }
  }
}

if (errors.length > 0) {
  console.error('LMS content validation failed:\n')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Validated LMS content successfully.`)
console.log(`- Task statements taught: ${examTasks.length}/${examTasks.length}`)
console.log(`- Task statements checked: ${examTasks.length}/${examTasks.length}`)
console.log(`- Exercises validated: ${exercises.length}`)
