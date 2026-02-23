import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { daysApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { SprintDayWithStatus, QuizResult } from '@studysprint/shared';
import { cn } from '@/lib/utils';

export function QuizView() {
  const { id, dayNumber } = useParams<{ id: string; dayNumber: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [day, setDay] = useState<(SprintDayWithStatus & { sprintName: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id && dayNumber) {
      loadDay();
    }
  }, [id, dayNumber]);

  async function loadDay() {
    try {
      const data = await daysApi.get(id!, parseInt(dayNumber!));
      setDay(data);

      if (!data.quizQuestions || data.quizQuestions.length === 0) {
        toast({ title: 'Este dia nao tem quiz' });
        navigate(`/sprint/${id}`);
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar quiz',
        variant: 'destructive',
      });
      navigate(`/sprint/${id}`);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectAnswer(answerIndex: number) {
    if (result) return; // Quiz already submitted
    setSelectedAnswer(answerIndex);
  }

  function handleConfirm() {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentQuestion < (day?.quizQuestions?.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitQuiz(newAnswers);
    }
  }

  async function submitQuiz(finalAnswers: number[]) {
    if (!id || !dayNumber) return;

    setSubmitting(true);
    try {
      const quizResult = await daysApi.submitQuiz(id, parseInt(dayNumber), finalAnswers);
      setResult(quizResult);
    } catch (error) {
      toast({
        title: 'Erro ao enviar quiz',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !day) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const questions = day.quizQuestions || [];
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // Show results
  if (result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/sprint/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Resultado do Quiz</h1>
        </div>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className={cn(
              'text-6xl font-bold mb-4',
              result.score >= 70 ? 'text-green-500' : result.score >= 50 ? 'text-yellow-500' : 'text-red-500'
            )}>
              {result.score}%
            </div>
            <p className="text-muted-foreground mb-6">
              Voce acertou {result.correct.length} de {result.total} perguntas
            </p>

            {/* Show each question result */}
            <div className="space-y-4 text-left">
              {questions.map((q, i) => (
                <div
                  key={i}
                  className={cn(
                    'p-4 rounded-lg border',
                    result.correct.includes(i) ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {result.correct.includes(i) ? (
                      <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <X className="h-5 w-5 text-red-500 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">{q.question}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Resposta correta: {q.options[q.correct]}
                      </p>
                      {!result.correct.includes(i) && (
                        <p className="text-sm text-red-500 mt-1">
                          Sua resposta: {q.options[answers[i]]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button className="w-full" onClick={() => navigate(`/sprint/${id}`)}>
          Voltar ao Sprint
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/sprint/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Quiz - Dia {day.dayNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Pergunta {currentQuestion + 1} de {questions.length}
          </p>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-2" />

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{question?.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {question?.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelectAnswer(index)}
              className={cn(
                'w-full p-4 rounded-lg border text-left transition-all',
                'hover:bg-accent',
                selectedAnswer === index && 'border-primary bg-primary/10'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'h-6 w-6 rounded-full border-2 flex items-center justify-center',
                  selectedAnswer === index ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
                )}>
                  {selectedAnswer === index && <Check className="h-4 w-4" />}
                </div>
                <span>{option}</span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Action Button */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleConfirm}
        disabled={selectedAnswer === null || submitting}
      >
        {submitting ? 'Enviando...' : currentQuestion < questions.length - 1 ? 'Proxima' : 'Finalizar'}
      </Button>
    </div>
  );
}
