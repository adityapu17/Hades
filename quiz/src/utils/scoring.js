// answers: [{ questionId, selectedIndex }]
// snapshotQuestions: [{ id, correctIndex, points, text, options }]
export function scoreAttempt(snapshotQuestions, answers) {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedIndex]))
  let totalPoints = 0
  let maxPoints = 0
  const detail = snapshotQuestions.map((q) => {
    const selectedIndex = answerMap.has(q.id) ? answerMap.get(q.id) : null
    const isCorrect = selectedIndex === q.correctIndex
    const points = Number(q.points) || 0
    maxPoints += points
    if (isCorrect) totalPoints += points
    return {
      questionId: q.id,
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      selectedIndex,
      isCorrect,
      points: isCorrect ? points : 0,
      maxPoints: points,
    }
  })
  const scorePercent = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 10000) / 100 : 0
  return { totalPoints, maxPoints, scorePercent, detail }
}
