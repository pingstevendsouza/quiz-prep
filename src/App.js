import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QuizProvider, useQuiz } from './context/QuizContext';
import AppLayout from './layout/AppLayout/AppLayout';
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import Results from './pages/Results';
import ManageExams from './pages/ManageExams';
import CreateExam from './pages/CreateExam';

// /quiz has no meaning without an active quiz session — send the user back
// to the dashboard to start one instead of rendering a broken page.
// Finishing a quiz (submit or time-up) always flips `isQuizActive` false in
// the same state update that sets `resultData`, which unmounts <Quiz/> here
// immediately — before any navigate('/results') call inside Quiz itself gets
// a chance to run. Routing straight to /results when a result is already
// available (instead of always falling back to "/") avoids that race
// entirely rather than trying to out-time it.
const QuizRoute = () => {
  const { isQuizActive, resultData } = useQuiz();
  if (isQuizActive) return <Quiz />;
  return <Navigate to={resultData ? '/results' : '/'} replace />;
};

// /results has no meaning without a finished quiz's results in context.
// "Play Again" (Results) calls replayQuiz(), which sets isQuizActive true
// and resultData null in the same batch — checking isQuizActive first (and
// routing to /quiz instead of unconditionally falling back to "/") lets that
// transition happen by letting this guard react to committed state, instead
// of racing a navigate('/quiz') call against it the same way /quiz used to
// race navigate('/results') on submit.
const ResultsRoute = () => {
  const { isQuizActive, resultData } = useQuiz();
  if (isQuizActive) return <Navigate to="/quiz" replace />;
  return resultData ? <Results /> : <Navigate to="/" replace />;
};

const App = () => (
  <QuizProvider>
    <Routes>
      <Route
        path="/"
        element={
          <AppLayout>
            <Dashboard />
          </AppLayout>
        }
      />
      {/* No AppLayout for Quiz/Results — full-focus screens per the approved design. */}
      <Route path="/quiz" element={<QuizRoute />} />
      <Route path="/results" element={<ResultsRoute />} />
      <Route
        path="/manage-exams"
        element={
          <AppLayout>
            <ManageExams />
          </AppLayout>
        }
      />
      <Route
        path="/create-exam"
        element={
          <AppLayout>
            <CreateExam />
          </AppLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </QuizProvider>
);

export default App;
