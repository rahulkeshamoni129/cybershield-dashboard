import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Send,
  User,
  Shield,
  AlertTriangle,
  Sparkles,
  Code,
  Link,
  BookOpen,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  references?: {
    type: 'mitre' | 'cve' | 'link';
    title: string;
    url?: string;
  }[];
  source?: string;
  confidence?: number;
}


const suggestedQuestions = [
  "What is a DDoS attack and how can I mitigate it?",
  "Explain the MITRE ATT&CK framework",
  "How do I detect ransomware in my network?",
  "What are the signs of a phishing attack?",
  "Best practices for incident response",
];

const mockResponses: Record<string, { content: string; references?: Message['references'] }> = {
  'ddos': {
    content: `A **DDoS (Distributed Denial of Service)** attack is a malicious attempt to disrupt the normal traffic of a targeted server, service, or network by overwhelming it with a flood of Internet traffic.

**Key Characteristics:**
• Uses multiple compromised computer systems as sources of attack traffic
• Can target any online resource: websites, databases, APIs
• Attack traffic volume can exceed 1 Tbps in severe cases

**Mitigation Strategies:**
1. **Rate Limiting** - Limit the number of requests a server accepts
2. **Web Application Firewall (WAF)** - Filter malicious traffic
3. **CDN/DDoS Protection Services** - Cloudflare, AWS Shield, Akamai
4. **Traffic Analysis** - Identify and block suspicious patterns
5. **Anycast Network Diffusion** - Distribute traffic across servers

**MITRE ATT&CK Mapping:** T1498 - Network Denial of Service`,
    references: [
      { type: 'mitre', title: 'T1498 - Network Denial of Service', url: 'https://attack.mitre.org/techniques/T1498/' },
    ],
  },
  'mitre': {
    content: `The **MITRE ATT&CK Framework** is a globally-accessible knowledge base of adversary tactics and techniques based on real-world observations.

**Key Components:**

**1. Tactics (the "why")**
• Initial Access
• Execution
• Persistence
• Privilege Escalation
• Defense Evasion
• Credential Access
• Discovery
• Lateral Movement
• Collection
• Exfiltration
• Impact

**2. Techniques (the "how")**
Each tactic contains specific techniques adversaries use.

**3. Procedures**
Specific implementations of techniques by threat actors.

**Usage in SOC:**
• Threat intelligence mapping
• Gap analysis in security coverage
• Red team exercise planning
• Incident categorization`,
    references: [
      { type: 'link', title: 'MITRE ATT&CK Website', url: 'https://attack.mitre.org/' },
    ],
  },
  'ransomware': {
    content: `**Ransomware Detection** requires a multi-layered approach. Here are the key indicators and detection methods:

**Early Warning Signs:**
• Unusual file encryption activity
• New processes accessing many files rapidly
• Changes to file extensions (.locked, .encrypted)
• Shadow copy deletion attempts
• Abnormal network traffic to C2 servers

**Detection Techniques:**
1. **Endpoint Detection & Response (EDR)** - Monitor process behavior
2. **File Integrity Monitoring (FIM)** - Detect mass file changes
3. **Network Traffic Analysis** - Identify C2 communications
4. **Honeypot Files** - Canary files that trigger alerts when accessed
5. **Behavioral Analysis** - ML-based anomaly detection

**Immediate Response:**
• Isolate affected systems
• Preserve evidence
• Report to authorities (FBI IC3)
• Do NOT pay ransom`,
    references: [
      { type: 'mitre', title: 'T1486 - Data Encrypted for Impact', url: 'https://attack.mitre.org/techniques/T1486/' },
    ],
  },
  'default': {
    content: `I'm your AI Security Assistant, specialized in cybersecurity analysis and threat intelligence.

I can help you with:
• **Threat Analysis** - Understanding attack vectors and TTPs
• **MITRE ATT&CK** - Mapping threats to the framework
• **Incident Response** - Step-by-step guidance
• **Security Best Practices** - Configuration and hardening
• **CVE Lookup** - Vulnerability information

What security topic would you like to explore?`,
  },
};

const getResponse = (input: string): { content: string; references?: Message['references'] } => {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('ddos') || lowerInput.includes('denial of service')) {
    return mockResponses['ddos'];
  }
  if (lowerInput.includes('mitre') || lowerInput.includes('att&ck') || lowerInput.includes('framework')) {
    return mockResponses['mitre'];
  }
  if (lowerInput.includes('ransomware') || lowerInput.includes('encrypt')) {
    return mockResponses['ransomware'];
  }

  return mockResponses['default'];
};

const AIChat = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial greeting
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `Welcome to **CyberShield AI Assistant**! 🛡️

I'm your intelligent security analyst, powered by advanced threat intelligence. I can help you:

• Analyze and explain cyber attacks
• Map threats to MITRE ATT&CK framework
• Provide incident response guidance
• Answer security-related questions

How can I assist you today?`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: messageText }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      const references: Message['references'] = [];
      if (data && data.mitre_id) {
        references.push({
          type: 'mitre',
          title: `${data.mitre_id} - ${data.mitre_name}`,
          url: `https://attack.mitre.org/techniques/${data.mitre_id}/`
        });
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data?.reply || "I'm having trouble formulating a response. Please try again.",
        timestamp: new Date(),
        references: references,
        source: data?.source,
        confidence: data?.confidence,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I am unable to connect to the AI engine at the moment. Please verify the AI engine is running on port 5001.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';

    return (
      <div
        key={message.id}
        className={cn(
          'flex gap-3 animate-fade-in',
          isUser ? 'flex-row-reverse' : ''
        )}
      >
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
            isUser ? 'bg-primary' : 'bg-accent/20'
          )}
        >
          {isUser ? (
            <User className="h-4 w-4 text-primary-foreground" />
          ) : (
            <Bot className="h-4 w-4 text-accent" />
          )}
        </div>
        <div
          className={cn(
            'max-w-[80%] rounded-lg p-4',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border'
          )}
        >
          <div
            className={cn(
              'prose prose-sm max-w-none',
              isUser ? 'prose-invert' : 'dark:prose-invert'
            )}
            dangerouslySetInnerHTML={{
              __html: message.content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br />')
                .replace(/• /g, '&bull; '),
            }}
          />

          {message.references && message.references.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">References:</p>
              <div className="flex flex-wrap gap-2">
                {message.references.map((ref, idx) => (
                  <a
                    key={idx}
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs bg-muted/50 px-2 py-1 rounded hover:bg-muted transition-colors"
                  >
                    {ref.type === 'mitre' && <Shield className="h-3 w-3 text-primary" />}
                    {ref.type === 'cve' && <AlertTriangle className="h-3 w-3 text-warning" />}
                    {ref.type === 'link' && <Link className="h-3 w-3 text-info" />}
                    {ref.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* AI Source Metadata */}
          {!isUser && message.source && (
            <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground/70">
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>Source: {message.source}</span>
              </div>
              {message.confidence && (
                <span>Conf: {(message.confidence * 100).toFixed(0)}%</span>
              )}
            </div>
          )}

          <p className="text-[10px] mt-1 opacity-50 text-right">
            {message.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/20">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Security Assistant</h1>
              <p className="text-sm text-muted-foreground">
                Powered by threat intelligence & MITRE ATT&CK
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-accent/20 text-accent">
              <div className="w-2 h-2 rounded-full bg-accent mr-2 animate-pulse" />
              Online
            </Badge>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Messages */}
          <div className="flex-1 soc-card flex flex-col min-h-0">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map(renderMessage)}

                {isTyping && (
                  <div className="flex gap-3 animate-fade-in">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/20">
                      <Bot className="h-4 w-4 text-accent" />
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about security threats, MITRE ATT&CK, incident response..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={() => sendMessage()} disabled={!input.trim() || isTyping}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-72 space-y-4 hidden lg:block">
            {/* Quick Actions */}
            <div className="soc-card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Suggested Questions
              </h3>
              <div className="space-y-2">
                {suggestedQuestions.map((question, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3 text-xs"
                    onClick={() => sendMessage(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>

            {/* Capabilities */}
            <div className="soc-card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" />
                Capabilities
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-4 w-4 text-accent" />
                  <span>MITRE ATT&CK mapping</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span>Threat analysis</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Bot className="h-4 w-4 text-info" />
                  <span>Incident guidance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AIChat;
