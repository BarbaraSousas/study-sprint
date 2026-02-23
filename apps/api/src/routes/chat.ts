import { FastifyInstance } from 'fastify';
import { prisma } from '../services/db.js';
import { getCurrentUser } from '../middleware/auth.js';
import { chatStartSchema, chatMessageSchema, createSprintFromChatSchema } from '@studysprint/shared';
import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey }) : null;

// Store active conversations in memory
const conversations = new Map<string, {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  userId: string;
  pendingPlan?: any;
}>();

const SYSTEM_PROMPT = `Voce eh um tutor de estudos especializado em criar cronogramas personalizados. Seu papel eh:

1. Entender o objetivo de estudo do usuario
2. Fazer 3-6 perguntas curtas e diretas, adaptadas ao contexto:

   PARA ENTREVISTAS DE EMPREGO, pergunte:
   - Qual cargo/posicao? (ex: Junior, Pleno, Senior, Staff)
   - Qual tipo de vaga? (ex: Frontend, Backend, Full-stack, DevOps, Mobile, Data)
   - Qual empresa ou tipo de empresa? (ex: FAANG, startup, banco, consultoria)
   - Quanto tempo ate a entrevista?
   - Tempo disponivel por dia para estudar?
   - Ja fez entrevistas tecnicas antes? Como foi?

   PARA ALGORITMOS/LEETCODE, pergunte:
   - Qual seu nivel atual? (nunca fez, sabe o basico, ja resolve medios)
   - Foco em qual tipo? (arrays, strings, trees, graphs, DP, system design)
   - Para qual tipo de empresa? (isso define a dificuldade esperada)
   - Quanto tempo por dia? Quantos dias ate a entrevista?

   PARA OUTROS TOPICOS TECNICOS, pergunte:
   - Nivel atual no topico
   - Tempo disponivel por dia (em minutos)
   - Prazo/deadline (se houver)
   - Areas especificas de interesse ou dificuldade

3. Quando tiver informacao suficiente, gerar o cronograma em JSON

Regras:
- Faca uma pergunta por vez
- Use linguagem simples e amigavel
- Ofereca opcoes quando possivel (ex: "Junior, Pleno ou Senior?")
- Mantenha respostas curtas (maximo 2-3 frases)
- Para entrevistas, baseie-se no mercado atual e nas perguntas mais comuns das empresas
- Quando tiver TODAS as informacoes necessarias, responda APENAS com o JSON (sem nenhum texto antes ou depois)

IMPORTANTE: O JSON DEVE ser um objeto valido com a estrutura EXATA abaixo. O campo "days" DEVE ser um ARRAY (lista), nunca um objeto:

{
  "name": "Nome do Sprint",
  "totalDays": 10,
  "days": [
    {
      "dayNumber": 1,
      "title": "Titulo do Dia",
      "description": "Descricao do que sera estudado",
      "tasks": [
        {"title": "Nome da tarefa", "minutes": 20}
      ],
      "resources": [
        {"title": "Nome do recurso", "url": "https://exemplo.com"}
      ],
      "quizQuestions": [
        {
          "question": "Pergunta de revisao?",
          "options": ["Opcao A", "Opcao B", "Opcao C", "Opcao D"],
          "correct": 0
        }
      ]
    }
  ]
}

REGRAS CRITICAS DO JSON:
- "days" DEVE ser uma LISTA/ARRAY com colchetes [], NAO um objeto com chaves {}
- Cada item em "days" deve ter: dayNumber (numero), title (string), description (string), tasks (array), resources (array), quizQuestions (array)
- NAO retorne o JSON parcial ou quebrado
- NAO adicione texto antes ou depois do JSON

Conteudo do plano:
- Cada dia deve ter 2-4 tarefas praticas
- Cada dia deve ter 1-3 recursos (links reais: YouTube, LeetCode, documentacao oficial, artigos)
- Cada dia deve ter 2-3 perguntas de quiz para fixacao
- O tempo total das tarefas deve respeitar o tempo disponivel do usuario
- Para entrevistas: inclua mock interviews, problemas reais de empresas, e revisao de conceitos fundamentais`;

interface ExtractResult {
  plan: any | null;
  error: string | null;
}

function extractJsonFromResponse(text: string): ExtractResult {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { plan: null, error: null };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!parsed.name) {
      return { plan: null, error: 'JSON sem campo "name"' };
    }

    if (!parsed.days) {
      return { plan: null, error: 'JSON sem campo "days"' };
    }

    // Critical: days must be an array, not an object
    if (!Array.isArray(parsed.days)) {
      return {
        plan: null,
        error: 'O campo "days" deve ser uma lista/array, nao um objeto. Por favor, gere novamente o JSON com "days": [...]'
      };
    }

    if (parsed.days.length === 0) {
      return { plan: null, error: 'O campo "days" esta vazio. Adicione os dias do cronograma.' };
    }

    // Validate each day has required structure
    for (let i = 0; i < parsed.days.length; i++) {
      const day = parsed.days[i];
      if (!day.dayNumber || !day.title) {
        return {
          plan: null,
          error: `Dia ${i + 1} esta incompleto. Cada dia precisa ter dayNumber e title.`
        };
      }
      if (!Array.isArray(day.tasks)) {
        return {
          plan: null,
          error: `O campo "tasks" do dia ${day.dayNumber} deve ser uma lista/array.`
        };
      }
    }

    return { plan: parsed, error: null };
  } catch (e) {
    return { plan: null, error: 'JSON invalido. Por favor, gere novamente o cronograma.' };
  }
}

// Generate a summary of the plan for confirmation
function generatePlanSummary(plan: any): string {
  const totalTasks = plan.days.reduce((sum: number, d: any) => sum + (d.tasks?.length || 0), 0);
  const totalMinutes = plan.days.reduce((sum: number, d: any) => {
    return sum + (d.tasks?.reduce((s: number, t: any) => s + (t.minutes || 0), 0) || 0);
  }, 0);

  let summary = `📚 **${plan.name}**\n\n`;
  summary += `📅 ${plan.days.length} dias de estudo\n`;
  summary += `✅ ${totalTasks} tarefas no total\n`;
  summary += `⏱️ ~${Math.round(totalMinutes / plan.days.length)} min/dia\n\n`;
  summary += `**Conteudo:**\n`;

  plan.days.slice(0, 5).forEach((day: any) => {
    summary += `• Dia ${day.dayNumber}: ${day.title}\n`;
  });

  if (plan.days.length > 5) {
    summary += `• ... e mais ${plan.days.length - 5} dias\n`;
  }

  return summary;
}

export async function chatRoutes(fastify: FastifyInstance) {
  // POST /chat/start - Start a new conversation
  fastify.post('/chat/start', async (request, reply) => {
    if (!groq) {
      return reply.status(503).send({
        error: 'API de IA nao configurada. Configure GROQ_API_KEY no ambiente (gratuito em groq.com)'
      });
    }

    const { userId } = getCurrentUser();
    const result = chatStartSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.issues });
    }

    const conversationId = crypto.randomUUID();
    const userMessage = result.data.message;

    conversations.set(conversationId, {
      messages: [{ role: 'user', content: userMessage }],
      userId,
    });

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2048,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
    });

    let assistantMessage = response.choices[0]?.message?.content || '';
    const conversation = conversations.get(conversationId)!;
    conversation.messages.push({ role: 'assistant', content: assistantMessage });

    // Check if AI generated a plan
    const { plan, error } = extractJsonFromResponse(assistantMessage);

    // If JSON was malformed, ask AI to fix it
    if (error) {
      const fixRequest = `O JSON gerado tem um problema: ${error}. Por favor, gere novamente o cronograma completo em JSON valido.`;
      conversation.messages.push({ role: 'user', content: fixRequest });

      const fixResponse = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 4096,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...conversation.messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          }))
        ],
      });

      assistantMessage = fixResponse.choices[0]?.message?.content || '';
      conversation.messages.push({ role: 'assistant', content: assistantMessage });

      const retryResult = extractJsonFromResponse(assistantMessage);
      if (retryResult.plan) {
        conversation.pendingPlan = retryResult.plan;
        const summary = generatePlanSummary(retryResult.plan);

        await prisma.chatMessage.createMany({
          data: [
            { userId, role: 'user', content: userMessage },
            { userId, role: 'assistant', content: summary },
          ],
        });

        return {
          conversationId,
          message: summary,
          planReady: true,
          planPreview: {
            name: retryResult.plan.name,
            totalDays: retryResult.plan.days.length,
            days: retryResult.plan.days.map((d: any) => ({ dayNumber: d.dayNumber, title: d.title })),
          },
        };
      }
    }

    if (plan) {
      conversation.pendingPlan = plan;
      const summary = generatePlanSummary(plan);

      await prisma.chatMessage.createMany({
        data: [
          { userId, role: 'user', content: userMessage },
          { userId, role: 'assistant', content: summary },
        ],
      });

      return {
        conversationId,
        message: summary,
        planReady: true,
        planPreview: {
          name: plan.name,
          totalDays: plan.days.length,
          days: plan.days.map((d: any) => ({ dayNumber: d.dayNumber, title: d.title })),
        },
      };
    }

    await prisma.chatMessage.createMany({
      data: [
        { userId, role: 'user', content: userMessage },
        { userId, role: 'assistant', content: assistantMessage },
      ],
    });

    return {
      conversationId,
      message: assistantMessage,
      planReady: false,
    };
  });

  // POST /chat/message - Send message in existing conversation
  fastify.post('/chat/message', async (request, reply) => {
    if (!groq) {
      return reply.status(503).send({
        error: 'API de IA nao configurada. Configure GROQ_API_KEY no ambiente (gratuito em groq.com)'
      });
    }

    const { userId } = getCurrentUser();
    const result = chatMessageSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.issues });
    }

    const { conversationId, message: userMessage } = result.data;

    const conversation = conversations.get(conversationId);
    if (!conversation || conversation.userId !== userId) {
      return reply.status(404).send({ error: 'Conversation not found' });
    }

    conversation.messages.push({ role: 'user', content: userMessage });

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 4096,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversation.messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }))
      ],
    });

    let assistantMessage = response.choices[0]?.message?.content || '';
    conversation.messages.push({ role: 'assistant', content: assistantMessage });

    // Check if AI generated a plan
    const { plan, error } = extractJsonFromResponse(assistantMessage);

    // If JSON was malformed, ask AI to fix it
    if (error) {
      const fixRequest = `O JSON gerado tem um problema: ${error}. Por favor, gere novamente o cronograma completo em JSON valido.`;
      conversation.messages.push({ role: 'user', content: fixRequest });

      const fixResponse = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 4096,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...conversation.messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          }))
        ],
      });

      assistantMessage = fixResponse.choices[0]?.message?.content || '';
      conversation.messages.push({ role: 'assistant', content: assistantMessage });

      const retryResult = extractJsonFromResponse(assistantMessage);
      if (retryResult.plan) {
        conversation.pendingPlan = retryResult.plan;
        const summary = generatePlanSummary(retryResult.plan);

        await prisma.chatMessage.createMany({
          data: [
            { userId, role: 'user', content: userMessage },
            { userId, role: 'assistant', content: summary },
          ],
        });

        return {
          conversationId,
          message: summary,
          planReady: true,
          planPreview: {
            name: retryResult.plan.name,
            totalDays: retryResult.plan.days.length,
            days: retryResult.plan.days.map((d: any) => ({ dayNumber: d.dayNumber, title: d.title })),
          },
        };
      }
    }

    if (plan) {
      conversation.pendingPlan = plan;
      const summary = generatePlanSummary(plan);

      await prisma.chatMessage.createMany({
        data: [
          { userId, role: 'user', content: userMessage },
          { userId, role: 'assistant', content: summary },
        ],
      });

      return {
        conversationId,
        message: summary,
        planReady: true,
        planPreview: {
          name: plan.name,
          totalDays: plan.days.length,
          days: plan.days.map((d: any) => ({ dayNumber: d.dayNumber, title: d.title })),
        },
      };
    }

    await prisma.chatMessage.createMany({
      data: [
        { userId, role: 'user', content: userMessage },
        { userId, role: 'assistant', content: assistantMessage },
      ],
    });

    return {
      conversationId,
      message: assistantMessage,
      planReady: false,
    };
  });

  // POST /chat/confirm - User confirms and creates the sprint
  fastify.post('/chat/confirm', async (request, reply) => {
    const { userId } = getCurrentUser();
    const result = createSprintFromChatSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.issues });
    }

    const { conversationId } = result.data;

    const conversation = conversations.get(conversationId);
    if (!conversation || conversation.userId !== userId) {
      return reply.status(404).send({ error: 'Conversation not found' });
    }

    if (!conversation.pendingPlan) {
      return reply.status(400).send({ error: 'No plan pending confirmation' });
    }

    const plan = conversation.pendingPlan;
    const objective = conversation.messages[0]?.content || plan.name;

    const sprint = await prisma.sprint.create({
      data: {
        userId,
        name: plan.name,
        objective,
        totalDays: plan.totalDays || plan.days.length,
        days: {
          create: plan.days.map((day: any) => ({
            dayNumber: day.dayNumber,
            title: day.title,
            description: day.description || '',
            tasks: JSON.stringify((day.tasks || []).map((t: any) => ({ ...t, done: false }))),
            resources: JSON.stringify(day.resources || []),
            quizQuestions: JSON.stringify(day.quizQuestions || []),
          })),
        },
      },
    });

    // Link messages to sprint
    await prisma.chatMessage.updateMany({
      where: {
        userId,
        sprintId: null,
        createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
      },
      data: { sprintId: sprint.id },
    });

    conversations.delete(conversationId);

    return {
      success: true,
      sprintId: sprint.id,
    };
  });

  // GET /chat/history/:sprintId
  fastify.get('/chat/history/:sprintId', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { sprintId } = request.params as { sprintId: string };

    const messages = await prisma.chatMessage.findMany({
      where: { userId, sprintId },
      orderBy: { createdAt: 'asc' },
    });

    return messages;
  });
}
