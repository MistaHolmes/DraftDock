import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from "react-helmet-async";

type Language = 'en' | 'es';

export function MyStory() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<Language>('en');
  const [history, setHistory] = useState<Array<{ command: string; output: string }>>([
    { command: '/welcome', output: '[SYSTEM INITIALIZED] - DraftDock Story Terminal v1.1\n\nWelcome to the backend of my journey. Type /help to see available modules.' },
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [, setHistoryIndex] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const translations = {
    en: {
      welcome: '[SYSTEM INITIALIZED] - DraftDock Story Terminal v1.1\n\nWelcome to the backend of my journey. Type /help to see available modules.',
      helpOutput: `
[AVAILABLE_COMMANDS]

/about      Who is Abhash? (The Creator)
/problem    The frustrations that led to DraftDock
/solution   How DraftDock solves the writing dilemma
/mission    The core mission of this platform
/tech       The engine under the hood
/contact    Direct communication channels
/clear      Clear terminal buffer
/help       Display this help message
/language   Change language (en/es)
      `,
      about: `
NAME: Abhash Behera, Suprit Kumar Naik, Abhinash Parida, SK Mustakim Ali, Soumya Ranjan Sahoo
ROLE: Full Stack Developers & Writers (The Team)
STATUS: Passionate about building tools for creators.
BIO: We believe great ideas deserve great tools. DraftDock is our attempt at creating the perfect balance between power and simplicity for writers.
      `,
      problem: `
THE PAIN POINT:
As a writer, I was tired of platforms that were either too simple to organize complex thoughts, or too bloated with features that distracted from the writing itself.

I found myself jumping between Markdown editors, Note apps, and complex CMS tools. The fragmentation was killing the creative flow.
      `,
      solution: `
THE DRAFTDOCK WAY:
A clean, minimalist workspace that puts the writer FIRST.
- Distraction-free editing.
- Simple, powerful organization.
- Technical excellence wrapped in premium design.
Everything you need, nothing you don't.
      `,
      mission: `
OUR MISSION:
To provide creators with a "Dock" for their "Drafts" — a safe, beautiful harbor where thoughts can be refined into stories, and stories shared with the world.
      `,
      tech: `
STACK_ANALYSIS:
- Frontend: React + Vite + Tailwind CSS
- UI Engine: Framer Motion + Lucide Icons + Stitch Design System
- Backend: Node.js + Express
- Database: PostgreSQL with Prisma ORM
- Authentication: Clerk (Secure Identity Management)
      `,
      contact: `
SECURE CHANNELS:
- Email: abhash@draftdock.com
- GitHub: https://github.com/abhastheaiexpert
- Web: Through our /contact page
      `,
      languageChanged: 'Language changed to English',
      commandNotFound: 'Command not found:',
    },
    es: {
      welcome: '[SISTEMA INICIALIZADO] - Terminal de Historia DraftDock v1.1\n\nBienvenido al backend de mi viaje. Escribe /help para ver los módulos disponibles.',
      helpOutput: `
[COMANDOS_DISPONIBLES]

/about      ¿Quién es Abhash? (El Creador)
/problem    Las frustraciones que llevaron a DraftDock
/solution   Cómo DraftDock resuelve el dilema de la escritura
/mission    La misión principal de esta plataforma
/tech       El motor bajo el capó
/contact    Canales de comunicación directa
/clear      Limpiar el buffer del terminal
/help       Mostrar este mensaje de ayuda
/language   Cambiar idioma (en/es)
      `,
      about: `
NOMBRE: Abhash Behera, Suprit Kumar Naik, Abhinash Parida, SK Mustakim Ali, Soumya Ranjan Sahoo
ROL: Desarrolladores Full Stack y Escritores (El Equipo)
ESTADO: Apasionado por crear herramientas para creadores.
BIO: Creemos que las grandes ideas merecen grandes herramientas. DraftDock es nuestro intento de crear el equilibrio perfecto entre potencia y simplicidad para los escritores.
      `,
      problem: `
EL PUNTO DE DOLOR:
Como escritor, estaba cansado de plataformas que eran o demasiado simples para organizar pensamientos complejos, o demasiado cargadas de funciones que distraían de la escritura misma.
      `,
      solution: `
EL CAMINO DRAFTDOCK:
Un espacio de trabajo limpio y minimalista que pone al escritor PRIMERO. Todo lo que necesitas, nada que no necesites.
      `,
      mission: `
NUESTRA MISIÓN:
Proporcionar a los creadores un "Puerto" (Dock) para sus "Borradores" (Drafts) — un refugio seguro y hermoso donde los pensamientos se refinen en historias.
      `,
      tech: `
ANÁLISIS_DEL_STACK:
- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Base de Datos: PostgreSQL con Prisma
      `,
      contact: `
CANALES SEGUROS:
- Email: abhash@draftdock.com
- GitHub: https://github.com/abhastheaiexpert
      `,
      languageChanged: 'Idioma cambiado a Español',
      commandNotFound: 'Comando no encontrado:',
    }
  };

  const commands = {
    '/help': () => translations[language].helpOutput,
    '/problem': () => translations[language].problem,
    '/solution': () => translations[language].solution,
    '/mission': () => translations[language].mission,
    '/tech': () => translations[language].tech,
    '/contact': () => translations[language].contact,
    '/clear': () => {
      setHistory([]);
      return '';
    },
    '/language': (arg: string) => {
      if (arg === 'es' || arg === 'en') {
        setLanguage(arg as Language);
        return translations[arg as Language].languageChanged;
      }
      return 'Usage: /language [en|es]';
    },
    '/exit': () => {
      navigate('/dashboard');
      return 'Exiting...';
    },
    '\\exit': () => {
      navigate('/dashboard');
      return 'Exiting...';
    },
    '/about': () => translations[language].about,
    '\\about': () => translations[language].about,
  };

  const handleCommand = () => {
    const trimmed = currentCommand.trim();
    if (!trimmed) return;

    const [cmd, ...args] = trimmed.toLowerCase().split(' ');
    const commandFn = commands[cmd as keyof typeof commands];
    const output = commandFn
      ? commandFn(args.join(' '))
      : `${translations[language].commandNotFound} ${cmd}`;

    if (cmd === '/clear') {
      setHistory([]);
    } else {
      setHistory(prev => [...prev, { command: currentCommand, output }]);
    }
    setCurrentCommand('');
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHistoryIndex(prev => {
        const newIndex = Math.min(prev + 1, history.length - 1);
        const entry = history[history.length - 1 - newIndex];
        if (entry) setCurrentCommand(entry.command);
        return newIndex;
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHistoryIndex(prev => {
        const newIndex = Math.max(prev - 1, -1);
        setCurrentCommand(newIndex === -1 ? '' : history[history.length - 1 - newIndex]?.command || '');
        return newIndex;
      });
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const renderOutput = (output: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = output.split(urlRegex);
    return parts.map((part, index) =>
      urlRegex.test(part) ? (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
          {part}
        </a>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Helmet>
        <title>My Story | Terminal | DraftDock</title>
      </Helmet>

      {/* <Header2 /> */}

      <main className="flex-1 flex font-mono">
        <div className="w-full flex flex-col bg-black overflow-hidden border-t border-green-500/30">
          {/* Terminal Header */}
          <div className="flex items-center gap-2 p-3 bg-gray-900/50 border-b border-white/5 text-xs text-neutral-400">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="flex-1 text-center font-medium tracking-tight">abhash@draftdock:~/story.sh | SSH_V1.1</div>
          </div>

          {/* Terminal Output */}
          <div
            ref={terminalRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-green-500/20 scrollbar-track-transparent"
          >
            {history.map((entry, i) => (
              <div key={i} className="space-y-2">
                <div className="flex gap-2">
                  <span className="text-green-500/50 font-bold">$</span>
                  <span className="text-white/90">{entry.command}</span>
                </div>
                <div className="whitespace-pre-wrap text-green-500/80 pl-4 leading-relaxed tracking-tight">{renderOutput(entry.output)}</div>
              </div>
            ))}

            {/* Current Command Input */}
            <div className="flex gap-2 items-center">
              <span className="text-green-500/50 font-bold">$</span>
              <input
                ref={inputRef}
                type="text"
                value={currentCommand}
                onChange={e => setCurrentCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent outline-none text-white/90 caret-green-500 border-none focus:ring-0 p-0"
                autoFocus
              />
            </div>

            {/* Auto-scroll anchor */}
            <div ref={bottomRef} />
          </div>
        </div>
      </main>

      {/* <Footer /> */}
    </div>
  );
}
