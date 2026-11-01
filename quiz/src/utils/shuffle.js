// Fisher-Yates shuffle, returns a new array (does not mutate input)
export function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Shuffles the 4 options of a question while keeping track of which
// shuffled index corresponds to the original correct answer.
// question.options = ['opsi A text', 'opsi B text', ...]
// question.correctIndex = 0-3 (index into the ORIGINAL options array)
export function shuffleOptions(question) {
  const withOriginalIndex = question.options.map((text, idx) => ({ text, originalIndex: idx }))
  const shuffled = shuffleArray(withOriginalIndex)
  const newCorrectIndex = shuffled.findIndex((o) => o.originalIndex === question.correctIndex)
  return {
    options: shuffled.map((o) => o.text),
    correctIndex: newCorrectIndex,
  }
}

// Prepares a randomized attempt snapshot for a quiz: order of questions and,
// per question, the order of options - so it can be persisted and stays
// consistent across page navigation within the same attempt.
export function buildAttemptSnapshot(questions, { randomizeQuestions, randomizeOptions }) {
  const orderedQuestions = randomizeQuestions ? shuffleArray(questions) : questions
  return orderedQuestions.map((q) => {
    if (randomizeOptions) {
      const { options, correctIndex } = shuffleOptions(q)
      return { ...q, options, correctIndex }
    }
    return { ...q }
  })
}
