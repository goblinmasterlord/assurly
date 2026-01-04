import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, RotateCcw, Download, Copy } from "lucide-react";
import { DotsLoader } from "@/components/ui/micro-loaders";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Component to format markdown-like content
function FormattedMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let listType: "bullet" | "number" | null = null;

  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === "bullet") {
        elements.push(
          <ul key={elements.length} className="list-disc pl-5 space-y-1 my-2">
            {currentList.map((item, idx) => (
              <li key={idx} className="text-sm">
                {item}
              </li>
            ))}
          </ul>
        );
      } else if (listType === "number") {
        elements.push(
          <ol key={elements.length} className="list-decimal pl-5 space-y-1 my-2">
            {currentList.map((item, idx) => (
              <li key={idx} className="text-sm">
                {item}
              </li>
            ))}
          </ol>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  lines.forEach((line, index) => {
    // Handle bold headings with **text**
    if (line.match(/^\*\*(.+)\*\*$/)) {
      flushList();
      const heading = line.replace(/^\*\*(.+)\*\*$/, "$1");
      elements.push(
        <h4 key={index} className="font-semibold text-slate-900 mt-3 mb-2">
          {heading}
        </h4>
      );
    }
    // Handle bullet points starting with • or -
    else if (line.match(/^[•\-]\s+(.+)/)) {
      const item = line.replace(/^[•\-]\s+/, "");
      if (listType !== "bullet") {
        flushList();
        listType = "bullet";
      }
      currentList.push(item);
    }
    // Handle numbered lists
    else if (line.match(/^\d+\.\s+(.+)/)) {
      const item = line.replace(/^\d+\.\s+/, "");
      if (listType !== "number") {
        flushList();
        listType = "number";
      }
      currentList.push(item);
    }
    // Handle emojis at start of line as visual markers
    else if (line.match(/^[📈📚💪🎯🔍📊👋]/)) {
      flushList();
      elements.push(
        <p key={index} className="text-sm my-2">
          {line}
        </p>
      );
    }
    // Handle empty lines
    else if (line.trim() === "") {
      flushList();
    }
    // Regular paragraphs
    else if (line.trim() !== "") {
      flushList();
      elements.push(
        <p key={index} className="text-sm my-2">
          {line}
        </p>
      );
    }
  });

  flushList(); // Flush any remaining list items

  return <div>{elements}</div>;
}

export function AISummaryPanel() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "👋 Hello! I'm your AI Report Writer. I can help you write professional sections for your PDF report, including executive summaries, aspect analyses, and strategic recommendations. What would you like me to write?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Removed auto-scroll to keep user's scroll position

  // Mock AI responses based on common queries
  const getAIResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("executive") || lowerQuery.includes("summary")) {
      return "**Executive Summary**\n\nThis assessment report provides a comprehensive overview of performance across our Multi-Academy Trust for the academic year 2024-2025 (Summer Term). The report evaluates all schools against six critical aspects: Education, Human Resources, Finance & Procurement, Estates, Governance, and IT & Information Services.\n\n**Key Findings:**\n\nThe trust demonstrates strong overall performance with a MAT-wide average score of 3.1/4.0, indicating solid operational effectiveness and educational outcomes. Notable strengths include:\n\n• **Educational Excellence**: Oak Hill Academy and Cedar Park are delivering outstanding educational provision (3.7-3.4 average), with consistent improvements in teaching quality and student outcomes.\n\n• **Financial Stewardship**: Robust financial governance is evident across the trust (3.2 average), with effective budget management and value-for-money initiatives delivering tangible results.\n\n• **Governance**: Strong strategic oversight and accountability frameworks are in place trust-wide (3.1 average), ensuring compliance and driving continuous improvement.\n\n**Priority Actions:**\n\nWillow High School requires immediate, focused intervention (2.3 average, declining trajectory). A comprehensive support package addressing leadership, staff retention, and estate compliance is recommended. Additionally, trust-wide estates management strategies require strengthening to ensure consistency across all schools.\n\n**Strategic Outlook:**\n\nThe trust is well-positioned to achieve its strategic objectives. With targeted support for underperforming areas and continued investment in staff development, we project all schools will achieve 'Good' or better ratings by the end of the next academic year.";
    }

    if (lowerQuery.includes("trend") || lowerQuery.includes("performance")) {
      return "**Performance Trends Section**\n\nAcross the 2024-2025 academic year, the trust has demonstrated positive momentum in key performance indicators:\n\n**Upward Trends:**\n• Education scores improved trust-wide by +0.3 points, driven by enhanced curriculum delivery and professional development initiatives\n• Cedar Park showed the strongest improvement trajectory, increasing from 3.1 to 3.4 overall\n• Financial governance strengthened across all schools, with improved budget forecasting accuracy\n\n**Areas Requiring Attention:**\n• Willow High School experienced a decline from 2.5 to 2.3, primarily due to leadership challenges and staff turnover\n• Estates management scores remained static at 2.6, indicating the need for accelerated capital investment\n\n**Comparative Analysis:**\nThe 1.4-point performance gap between highest and lowest-performing schools represents a strategic priority. Implementing knowledge-sharing programs and targeted support mechanisms will be crucial to achieving greater consistency across the trust.";
    }

    if (lowerQuery.includes("education")) {
      return "**Education Assessment Analysis**\n\nThe quality of educational provision across the trust achieves a strong average of 3.4/4.0, reflecting consistent delivery of high-quality teaching and learning experiences.\n\n**Outstanding Practice:**\nOak Hill Academy demonstrates exemplary educational standards (4.0), with particular strengths in curriculum sequencing, student engagement, and outcomes. Cedar Park also performs strongly (3.8), showing significant year-on-year improvement.\n\n**Key Success Factors:**\n• Robust curriculum frameworks aligned to national standards\n• Effective use of assessment data to drive targeted interventions\n• Strong leadership and management at senior and middle leadership levels\n• Comprehensive professional development programs\n\n**Development Priorities:**\nWillow High School requires intensive support (2.5), particularly in behavior management and student attitudes to learning. Recommended actions include leadership mentoring, peer-to-peer collaboration with high-performing schools, and focused INSET programs.\n\n**Strategic Recommendations:**\nEstablish a trust-wide teaching and learning framework to share best practices, particularly from Oak Hill Academy. Implement regular cross-school moderation and peer review processes to maintain high standards.";
    }

    if (lowerQuery.includes("recommendation") || lowerQuery.includes("action")) {
      return "**Strategic Recommendations**\n\n**Immediate Actions (0-3 months):**\n\n1. **Willow High Intervention Program**\n   • Deploy experienced leadership consultant\n   • Implement intensive HR support for recruitment and retention\n   • Fast-track estate compliance remediation\n   • Weekly monitoring by trust leadership\n\n2. **Estates Trust-Wide Review**\n   • Commission independent condition surveys\n   • Develop 5-year capital investment plan\n   • Establish preventative maintenance schedules\n\n**Medium-Term Initiatives (3-12 months):**\n\n3. **Knowledge Sharing Framework**\n   • Formalize peer-to-peer school partnerships\n   • Establish subject specialist networks\n   • Create trust-wide best practice repository\n\n4. **IT Modernization Program**\n   • Upgrade cybersecurity infrastructure\n   • Implement unified MIS platform\n   • Enhance digital learning capabilities\n\n**Long-Term Strategic Goals (12+ months):**\n\n5. **Performance Convergence**\n   • Bring all schools to minimum 3.0 average\n   • Reduce performance gap to <0.8 points\n   • Achieve trust-wide 'Good' rating across all aspects";
    }

    if (lowerQuery.includes("strength")) {
      return "**Trust Strengths and Achievements**\n\nThe trust demonstrates significant strengths across multiple domains:\n\n**1. Educational Excellence**\nTwo schools (Oak Hill Academy and Cedar Park) deliver outstanding educational experiences, with consistently high student outcomes and exemplary teaching quality. This represents 50% of the trust operating at the highest level.\n\n**2. Financial Management**\nRobust financial governance is evident trust-wide (3.2 average), with:\n• Effective budget planning and monitoring\n• Strong value-for-money initiatives\n• Compliant procurement processes\n• Sustainable financial positions across all schools\n\n**3. Governance and Accountability**\nStrong strategic oversight from the board ensures effective challenge and support for school leaders. Clear accountability frameworks and regular performance monitoring drive continuous improvement.\n\n**4. Improvement Trajectory**\nTrust-wide scores have increased by an average of 0.2 points across all aspects, demonstrating the effectiveness of strategic interventions and support mechanisms.\n\n**Best Practice Examples:**\n• Oak Hill's curriculum model now being shared across the trust\n• Cedar Park's staff retention strategies delivering measurable results\n• Centralized financial services creating economies of scale";
    }

    // Default response
    return "**Content Suggestion**\n\nI can help you write professional sections for your PDF report:\n\n• **Executive Summary** - Comprehensive overview for senior stakeholders\n• **Performance Analysis** - Detailed breakdown by aspect and school\n• **Strategic Recommendations** - Actionable priorities and timelines\n• **Trend Analysis** - Historical comparisons and trajectories\n• **Best Practice Showcase** - Celebrating excellence across the trust\n• **School-Specific Narratives** - Tailored analysis for each institution\n\nWhat section would you like me to write?";
  };

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getAIResponse(input),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // 1-3 seconds
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content:
          "👋 Hello! I'm your AI Report Writer. I can help you write professional sections for your PDF report, including executive summaries, aspect analyses, and strategic recommendations. What would you like me to write?",
        timestamp: new Date(),
      },
    ]);
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "The text has been copied and can be pasted into your report.",
    });
  };

  const handleExportSummary = () => {
    // Get all assistant messages
    const assistantMessages = messages
      .filter((m) => m.role === "assistant" && m.id !== "1")
      .map((m) => m.content)
      .join("\n\n---\n\n");

    if (!assistantMessages) {
      toast({
        title: "No content to export",
        description: "Generate some content first before exporting.",
        variant: "destructive",
      });
      return;
    }

    navigator.clipboard.writeText(assistantMessages);
    toast({
      title: "Summary Exported",
      description: "All AI-generated content has been copied to your clipboard.",
    });
  };

  const suggestedQuestions = [
    "Write executive summary",
    "Write performance trends section",
    "Write strategic recommendations",
    "Highlight our strengths",
  ];

  return (
    <Card className="border-blue-200 shadow-lg flex flex-col h-[600px]">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Sparkles className="h-5 w-5" />
            AI Report Writer
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportSummary}
              disabled={messages.length <= 1}
              className="h-8"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              disabled={messages.length <= 1}
              className="h-8"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-900"
                }`}
              >
                <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-li:my-1">
                  {message.role === "assistant" ? (
                    <FormattedMessage content={message.content} />
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2 gap-2">
                  <div
                    className={`text-xs ${
                      message.role === "user" ? "text-blue-100" : "text-slate-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {message.role === "assistant" && message.id !== "1" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyMessage(message.content)}
                      className="h-6 px-2 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-100 text-slate-900 rounded-lg px-4 py-3">
                <DotsLoader />
              </div>
            </div>
          )}
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 border-t pt-3">
            <p className="text-xs font-semibold text-slate-700 mb-2">Quick Actions:</p>
            <div className="flex flex-col gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  const prompt = "Write executive summary";
                  // Trigger send automatically
                  const userMessage: Message = {
                    id: Date.now().toString(),
                    role: "user",
                    content: prompt,
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, userMessage]);
                  setInput("");
                  setIsTyping(true);
                  setTimeout(() => {
                    const aiResponse: Message = {
                      id: (Date.now() + 1).toString(),
                      role: "assistant",
                      content: getAIResponse(prompt),
                      timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, aiResponse]);
                    setIsTyping(false);
                  }, 1000 + Math.random() * 2000);
                }}
                className="justify-start h-9 bg-blue-600 hover:bg-blue-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Write Executive Summary
              </Button>
              <div className="grid grid-cols-1 gap-2">
                {suggestedQuestions.slice(1).map((question) => (
                  <Button
                    key={question}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInput(question);
                    }}
                    className="text-xs h-8 justify-start"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about trends, strengths, or focus areas..."
              disabled={isTyping}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!input.trim() || isTyping} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Ask AI to write sections for your report • Press Enter to send
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

