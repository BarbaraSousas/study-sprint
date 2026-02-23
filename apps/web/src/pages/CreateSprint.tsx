import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Bot, User, Sparkles, Loader2, CheckCircle, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { chatApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PlanPreview {
  name: string;
  totalDays: number;
  days: { dayNumber: number; title: string }[];
}

export function CreateSprint() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [planReady, setPlanReady] = useState(false);
  const [planPreview, setPlanPreview] = useState<PlanPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, planReady]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleSendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      let response;
      if (!conversationId) {
        response = await chatApi.start(userMessage);
        setConversationId(response.conversationId);
      } else {
        response = await chatApi.sendMessage(conversationId, userMessage);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);

      if (response.planReady && response.planPreview) {
        setPlanReady(true);
        setPlanPreview(response.planPreview);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Tente novamente';
      toast({
        title: 'Erro ao enviar mensagem',
        description: errorMessage.includes('API') || errorMessage.includes('GROQ')
          ? 'Configure GROQ_API_KEY (gratuito em groq.com)'
          : errorMessage,
        variant: 'destructive',
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!conversationId) return;

    setConfirming(true);
    try {
      const result = await chatApi.confirm(conversationId);
      toast({ title: 'Sprint criado com sucesso!' });
      navigate(`/sprint/${result.sprintId}`);
    } catch (error) {
      toast({
        title: 'Erro ao criar sprint',
        description: 'Tente novamente',
        variant: 'destructive',
      });
      setConfirming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  const quickOptions = [
    'Preparar para entrevista tecnica',
    'Treinar algoritmos e LeetCode',
    'Estudar System Design para entrevistas',
    'Aprender uma nova tecnologia',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Criar Novo Sprint</h1>
          <p className="text-sm text-muted-foreground">Converse com a IA para criar seu plano de estudos</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-medium mb-2">Qual eh o seu objetivo de estudo?</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Descreva o que voce quer aprender e eu vou criar um cronograma personalizado para voce
            </p>

            <div className="grid gap-2 w-full max-w-md">
              {quickOptions.map((option, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => {
                    setInput(option);
                    textareaRef.current?.focus();
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-2 text-primary" />
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="rounded-full bg-primary/10 p-2 h-8 w-8 flex-shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <Card className={cn(
              'max-w-[80%]',
              message.role === 'user' ? 'bg-primary text-primary-foreground' : ''
            )}>
              <CardContent className="p-3 whitespace-pre-wrap">
                {message.content}
              </CardContent>
            </Card>
            {message.role === 'user' && (
              <div className="rounded-full bg-muted p-2 h-8 w-8 flex-shrink-0">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="rounded-full bg-primary/10 p-2 h-8 w-8 flex-shrink-0">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground">Pensando...</span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Plan Ready - Show Confirmation */}
        {planReady && planPreview && (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-600 dark:text-green-400">
                  Plano pronto para criacao!
                </span>
              </div>

              <div className="bg-background rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{planPreview.name}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {planPreview.totalDays} dias de estudo
                </p>
                <div className="space-y-1">
                  {planPreview.days.slice(0, 4).map((day) => (
                    <div key={day.dayNumber} className="text-xs text-muted-foreground">
                      Dia {day.dayNumber}: {day.title}
                    </div>
                  ))}
                  {planPreview.days.length > 4 && (
                    <div className="text-xs text-muted-foreground">
                      ... e mais {planPreview.days.length - 4} dias
                    </div>
                  )}
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleConfirm}
                disabled={confirming}
              >
                {confirming ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando Sprint...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Confirmar e Criar Sprint
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input - Hide when plan is ready */}
      {!planReady && (
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="min-h-[48px] max-h-32 resize-none"
            rows={1}
            disabled={loading}
          />
          <Button
            size="icon"
            className="h-12 w-12 flex-shrink-0"
            onClick={handleSendMessage}
            disabled={!input.trim() || loading}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
