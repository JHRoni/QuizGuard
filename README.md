# QuizApp

Next.js quiz app with teacher and student accounts. Teachers build quizzes (MCQ, written, code)
protected by a passkey. Students log in, enter the passkey and take the exam **once**.
Leaving the tab auto-submits. MCQ is graded instantly.

## Run it

```
npm install
npm run dev
```
Open http://localhost:3000

## Accounts

- Everyone registers at `/register` with a name, an ID and a password, choosing Teacher or Student.
  - Student ID = e.g. roll number. Teacher ID = anything unique.
  - IDs are unique and not case-sensitive.
- Passwords are hashed (scrypt). Login is a signed httpOnly cookie valid for 8 hours.
- `.env.local` holds `SESSION_SECRET` (signs the login cookie). Change it to your own random string.
- Optional: set `TEACHER_SIGNUP_CODE=...` in `.env.local` so only people who know the code can
  register as teachers. Restart `npm run dev` after editing `.env.local`.

## One student, one exam, one time

Enforced on the server (cannot be bypassed from the browser):
- Pressing "Start exam" creates an attempt record for (student, exam). Any later try to enter the same
  exam with the same student account is refused, whether the first try was submitted or not.
- Refreshing, opening a new tab, or closing the window all count: the exam is submitted and cannot be re-entered.
- A student can only submit their own attempt, and only once.
- If something goes wrong (power cut, crash), the teacher opens the quiz results and clicks
  **Allow retake** next to that student. That deletes their attempt so they can enter again.

## Who can see what

- Teachers see only their own quizzes and their students' attempts.
- Students see only their own results. Correct answers are never sent to the student's browser.

## Limitations

- Storage is a local JSON file (`data/db.json`): fine for local/LAN use, not for Vercel-style hosting.
  Swap `lib/db.ts` for a real database (e.g. Supabase) to deploy online.
- No "forgot password" flow yet.
- Code answers are not executed, only stored for manual review (add Judge0/Piston to auto-run).
- Tab-switch detection is a deterrent, not full proctoring.
- To let other computers on the same Wi-Fi use it: `npm run dev -- -H 0.0.0.0`, then open
  `http://<your-pc-ip>:3000`.
