import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean up existing data
  await prisma.chatMessage.deleteMany();
  await prisma.sprintDay.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();

  // Create local user
  const user = await prisma.user.create({
    data: {
      id: 'local-user',
      name: 'Local User',
    },
  });
  console.log('Created user:', user.id);

  // Create settings
  await prisma.settings.create({
    data: {
      userId: user.id,
      timezone: 'America/Sao_Paulo',
      reminderTime: '09:00',
    },
  });
  console.log('Created settings');

  // Create a sample sprint
  const sprint = await prisma.sprint.create({
    data: {
      userId: user.id,
      name: 'React Avancado',
      objective: 'Aprender React avancado para entrevistas em 2 semanas',
      totalDays: 10,
      days: {
        create: [
          {
            dayNumber: 1,
            title: 'Fundamentos de Hooks',
            description: 'Revisao completa de useState, useEffect e useContext',
            tasks: JSON.stringify([
              { title: 'Ler documentacao de hooks', minutes: 20, done: false },
              { title: 'Praticar useState e useEffect', minutes: 30, done: false },
              { title: 'Criar exemplo com useContext', minutes: 25, done: false },
            ]),
            resources: JSON.stringify([
              { title: 'React Docs - Hooks', url: 'https://react.dev/reference/react/hooks' },
              { title: 'Video: Hooks Explained', url: 'https://www.youtube.com/watch?v=dpw9EHDh2bM' },
            ]),
            quizQuestions: JSON.stringify([
              {
                question: 'Qual hook eh usado para efeitos colaterais?',
                options: ['useState', 'useEffect', 'useRef', 'useMemo'],
                correct: 1,
              },
              {
                question: 'useContext serve para?',
                options: ['Gerenciar estado local', 'Compartilhar dados entre componentes', 'Otimizar performance', 'Manipular DOM'],
                correct: 1,
              },
            ]),
          },
          {
            dayNumber: 2,
            title: 'Hooks Avancados',
            description: 'useReducer, useCallback, useMemo e useRef',
            tasks: JSON.stringify([
              { title: 'Estudar useReducer patterns', minutes: 30, done: false },
              { title: 'Praticar useCallback e useMemo', minutes: 25, done: false },
              { title: 'Exercicio com useRef', minutes: 20, done: false },
            ]),
            resources: JSON.stringify([
              { title: 'useReducer Guide', url: 'https://react.dev/reference/react/useReducer' },
            ]),
            quizQuestions: JSON.stringify([
              {
                question: 'Quando usar useReducer em vez de useState?',
                options: ['Quando o estado eh simples', 'Quando ha logica complexa de estado', 'Sempre', 'Nunca'],
                correct: 1,
              },
            ]),
          },
          {
            dayNumber: 3,
            title: 'Custom Hooks',
            description: 'Criando hooks customizados reutilizaveis',
            tasks: JSON.stringify([
              { title: 'Entender patterns de custom hooks', minutes: 25, done: false },
              { title: 'Criar useLocalStorage', minutes: 30, done: false },
              { title: 'Criar useFetch', minutes: 30, done: false },
            ]),
            resources: JSON.stringify([
              { title: 'Building Your Own Hooks', url: 'https://react.dev/learn/reusing-logic-with-custom-hooks' },
            ]),
            quizQuestions: JSON.stringify([
              {
                question: 'Custom hooks devem comecar com qual prefixo?',
                options: ['custom', 'hook', 'use', 'react'],
                correct: 2,
              },
            ]),
          },
          {
            dayNumber: 4,
            title: 'Context API Avancado',
            description: 'Patterns avancados com Context API',
            tasks: JSON.stringify([
              { title: 'Estudar Context patterns', minutes: 25, done: false },
              { title: 'Implementar multi-context', minutes: 30, done: false },
              { title: 'Otimizacao de re-renders', minutes: 25, done: false },
            ]),
            resources: JSON.stringify([
              { title: 'Context API Deep Dive', url: 'https://react.dev/learn/passing-data-deeply-with-context' },
            ]),
            quizQuestions: JSON.stringify([
              {
                question: 'Qual o problema de um unico Context grande?',
                options: ['Nao funciona', 'Re-renders desnecessarios', 'Erro de sintaxe', 'Mais rapido'],
                correct: 1,
              },
            ]),
          },
          {
            dayNumber: 5,
            title: 'State Management',
            description: 'Zustand, Jotai ou Redux - quando usar cada um',
            tasks: JSON.stringify([
              { title: 'Comparar state managers', minutes: 30, done: false },
              { title: 'Implementar exemplo com Zustand', minutes: 35, done: false },
              { title: 'Entender trade-offs', minutes: 20, done: false },
            ]),
            resources: JSON.stringify([
              { title: 'Zustand Documentation', url: 'https://docs.pmnd.rs/zustand/getting-started/introduction' },
            ]),
            quizQuestions: JSON.stringify([
              {
                question: 'Zustand eh conhecido por?',
                options: ['Complexidade', 'Simplicidade', 'Lentidao', 'Incompatibilidade'],
                correct: 1,
              },
            ]),
          },
          {
            dayNumber: 6,
            title: 'Performance React',
            description: 'React.memo, useMemo, useCallback e lazy loading',
            tasks: JSON.stringify([
              { title: 'Estudar React.memo', minutes: 25, done: false },
              { title: 'Praticar code splitting', minutes: 30, done: false },
              { title: 'Implementar lazy loading', minutes: 25, done: false },
            ]),
            resources: JSON.stringify([
              { title: 'React Performance', url: 'https://react.dev/learn/render-and-commit' },
            ]),
            quizQuestions: JSON.stringify([
              {
                question: 'React.lazy serve para?',
                options: ['Tornar componentes mais lentos', 'Code splitting', 'Estilizacao', 'Testes'],
                correct: 1,
              },
            ]),
          },
          {
            dayNumber: 7,
            title: 'Testing React',
            description: 'React Testing Library e mocks',
            tasks: JSON.stringify([
              { title: 'Estudar RTL best practices', minutes: 30, done: false },
              { title: 'Escrever testes de componentes', minutes: 35, done: false },
              { title: 'Aprender MSW para mocks', minutes: 25, done: false },
            ]),
            resources: JSON.stringify([
              { title: 'Testing Library Docs', url: 'https://testing-library.com/docs/react-testing-library/intro/' },
            ]),
            quizQuestions: JSON.stringify([
              {
                question: 'RTL encoraja testar?',
                options: ['Implementacao', 'Comportamento', 'Performance', 'Estilo'],
                correct: 1,
              },
            ]),
          },
          {
            dayNumber: 8,
            title: 'TypeScript com React',
            description: 'Tipagem avancada em componentes React',
            tasks: JSON.stringify([
              { title: 'Estudar generics em React', minutes: 30, done: false },
              { title: 'Tipar props complexas', minutes: 30, done: false },
              { title: 'Utility types para React', minutes: 25, done: false },
            ]),
            resources: JSON.stringify([
              { title: 'React TypeScript Cheatsheet', url: 'https://react-typescript-cheatsheet.netlify.app/' },
            ]),
            quizQuestions: JSON.stringify([
              {
                question: 'ComponentProps utility type serve para?',
                options: ['Criar componentes', 'Extrair tipos de props', 'Testar componentes', 'Estilizar'],
                correct: 1,
              },
            ]),
          },
          {
            dayNumber: 9,
            title: 'Patterns Avancados',
            description: 'Compound Components, Render Props, HOCs',
            tasks: JSON.stringify([
              { title: 'Estudar Compound Components', minutes: 30, done: false },
              { title: 'Implementar Render Props', minutes: 30, done: false },
              { title: 'Entender HOC patterns', minutes: 25, done: false },
            ]),
            resources: JSON.stringify([
              { title: 'React Patterns', url: 'https://reactpatterns.com/' },
            ]),
            quizQuestions: JSON.stringify([
              {
                question: 'Compound Components permitem?',
                options: ['Componentes menores', 'API flexivel', 'Mais bugs', 'Menos reutilizacao'],
                correct: 1,
              },
            ]),
          },
          {
            dayNumber: 10,
            title: 'Revisao Final',
            description: 'Consolidacao de todo o conhecimento',
            tasks: JSON.stringify([
              { title: 'Revisar hooks principais', minutes: 25, done: false },
              { title: 'Praticar perguntas de entrevista', minutes: 40, done: false },
              { title: 'Criar projeto demo', minutes: 45, done: false },
            ]),
            resources: JSON.stringify([
              { title: 'React Interview Questions', url: 'https://github.com/sudheerj/reactjs-interview-questions' },
            ]),
            quizQuestions: JSON.stringify([
              {
                question: 'Voce esta pronto para a entrevista?',
                options: ['Sim!', 'Preciso revisar mais', 'Talvez', 'Nao sei'],
                correct: 0,
              },
            ]),
          },
        ],
      },
    },
  });

  console.log('Created sample sprint:', sprint.name);
  console.log('');
  console.log('Seed completed successfully!');
  console.log(`Sprint: ${sprint.name}`);
  console.log(`Total days: ${sprint.totalDays}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
