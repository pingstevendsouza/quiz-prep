import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import he from 'he';
import Swal from 'sweetalert2';
import classNames from 'classnames';
import styles from './index.module.css';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import { IconChevronLeft, IconChevronRight, IconCheckCircle, IconXCircle, IconClock } from '../../icons';
import { useQuiz } from '../../context/QuizContext';
import { getLetter, timeConverter } from '../../utils';

const Quiz = () => {
  const navigate = useNavigate();
  const {
    quizConfig,
    questions,
    countdownSeconds,
    questionIndex,
    userSelectedAns,
    setTimeTaken,
    toggleOption,
    goNext,
    goPrev,
    goToQuestion,
    finalizeQuiz,
  } = useQuiz();

  const totalTimeMs = (countdownSeconds || 0) * 1000;
  const [remainingMs, setRemainingMs] = useState(totalTimeMs);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (questionIndex > 0) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [questionIndex]);

  // Revealing the answer is per-question — don't carry it over when the
  // user moves to a different question via Next/Previous/the navigator.
  useEffect(() => {
    setShowAnswer(false);
  }, [questionIndex]);

  // finalizeQuiz() flips isQuizActive false and sets resultData together;
  // QuizRoute (App.js) reacts to that itself and redirects to /results, so
  // nothing here needs to navigate on completion.

  // Exact countdown/time-up behavior from the original Countdown /
  // CountdownBadge components: ticks every second, keeps `timeTaken` in
  // context continuously in sync (used if the user submits manually), and
  // on reaching zero shows the same "time's up" prompt before auto-submitting.
  useEffect(() => {
    const timer = setInterval(() => {
      const next = remainingMs - 1000;
      if (next >= 0) {
        setRemainingMs(next);
      } else {
        clearInterval(timer);
        Swal.fire({
          icon: 'info',
          title: "Oops! Time's up.",
          text: 'See how you did!',
          confirmButtonText: 'Check Results',
          timer: 5000,
          willClose: () => {
            finalizeQuiz(totalTimeMs - remainingMs);
          },
        });
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      setTimeTaken(totalTimeMs - remainingMs + 1000);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs]);

  if (!questions || !questions[questionIndex]) return null;

  const currentQuestion = questions[questionIndex];
  const isMultiple = currentQuestion.correct_answers.length > 1;
  const selected = userSelectedAns[questionIndex] || [];
  const correctDecoded = currentQuestion.correct_answers.map((a) => he.decode(a));
  const isLastQuestion = questionIndex === questions.length - 1;
  const progress = Math.round((questionIndex / questions.length) * 100);
  const { hours, minutes, seconds } = timeConverter(remainingMs);
  const isUrgent = remainingMs <= 60000;

  const handleNext = () => {
    goNext();
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topBarSide}>
          <Button variant="ghost" icon={IconChevronLeft} onClick={() => navigate('/')}>
            Exit
          </Button>
        </div>
        <div className={styles.questionCounter}>
          Question {questionIndex + 1} of {questions.length}
        </div>
        <div className={classNames(styles.topBarSide, styles.right)}>
          <span className={classNames(styles.timerBadge, { [styles.timerBadgeUrgent]: isUrgent })}>
            <IconClock size={16} />
            {hours}:{minutes}:{seconds}
          </span>
        </div>
      </div>

      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <Card className={styles.questionCard}>
        <div className={styles.cardHeader}>
          <div className={styles.badgeGroup}>
            <span className={styles.qBadge}>Q{questionIndex + 1}</span>
            <span className={styles.typeBadge}>{isMultiple ? 'Multiple choice' : 'Single choice'}</span>
          </div>
          {quizConfig.showAnswers && (
            <Button
              variant="ghost"
              icon={showAnswer ? IconXCircle : IconCheckCircle}
              onClick={() => setShowAnswer((v) => !v)}
              className={styles.showAnswerButton}
            >
              {showAnswer ? 'Hide Answer' : 'Show Answer'}
            </Button>
          )}
        </div>
        <div className={styles.cardBody}>
          <div className={styles.questionText}>{he.decode(currentQuestion.question)}</div>

          <div className={styles.optionsList}>
            {currentQuestion.options.map((option, i) => {
              const letter = getLetter(i);
              const decoded = he.decode(option);
              const isSelected = selected.includes(decoded);
              const isCorrect = showAnswer && correctDecoded.includes(decoded);
              return (
                <div
                  key={decoded}
                  className={classNames(styles.optionRow, {
                    [styles.optionRowSelected]: isSelected,
                    [styles.optionRowCorrect]: isCorrect,
                  })}
                  onClick={() => toggleOption(decoded)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && toggleOption(decoded)}
                >
                  <span
                    className={classNames(styles.letterBadge, {
                      [styles.letterBadgeSelected]: isSelected,
                      [styles.letterBadgeCorrect]: isCorrect,
                    })}
                  >
                    {letter}
                  </span>
                  <span className={styles.optionText}>{decoded}</span>
                  {isCorrect && <IconCheckCircle size={18} className={styles.correctIcon} />}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className={styles.footerNav}>
        <Button variant="secondary" icon={IconChevronLeft} onClick={goPrev} disabled={questionIndex === 0}>
          Previous
        </Button>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {selected.length === 0 && <span className={styles.hint}>Select an answer to continue</span>}
          <Button
            variant="primary"
            icon={isLastQuestion ? IconCheckCircle : IconChevronRight}
            iconPosition={isLastQuestion ? 'left' : 'right'}
            onClick={handleNext}
            disabled={selected.length === 0}
          >
            {isLastQuestion ? 'Submit' : 'Next'}
          </Button>
        </div>
      </div>

      <Card>
        <div className={styles.navigatorTitle}>Question Navigator</div>
        <div className={styles.navGrid}>
          {questions.map((_, i) => {
            const answered = userSelectedAns[i] && userSelectedAns[i].length > 0;
            const isCurrent = i === questionIndex;
            return (
              <button
                key={i}
                type="button"
                className={classNames(styles.navButton, {
                  [styles.navButtonAnswered]: answered && !isCurrent,
                  [styles.navButtonCurrent]: isCurrent,
                })}
                onClick={() => goToQuestion(i)}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default Quiz;
