import { Question, Answer } from '@/types';

export function gradeAutoPart(questions: Question[], answers: Answer[]) {
  let autoScore = 0;
  let maxAutoScore = 0;
  let pendingReview = false;

  for (const q of questions) {
    if (q.type === 'mcq') {
      maxAutoScore += q.points;
      const ans = answers.find((a) => a.questionId === q.id);
      if (ans && Number(ans.value) === q.correctOptionIndex) {
        autoScore += q.points;
      }
    } else {
      pendingReview = true;
    }
  }

  return { autoScore, maxAutoScore, pendingReview };
}
