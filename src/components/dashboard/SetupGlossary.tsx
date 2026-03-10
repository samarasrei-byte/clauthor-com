import { HelpCircle, PlayCircle, BookOpen } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

/** Glossary of technical terms with friendly explanations */
const GLOSSARY: Record<string, string> = {
  "API Key": "A special 'password' that identifies your app. Works like an access key — whoever has it can use the service.",
  "API": "Application Programming Interface — how two systems 'talk' to each other automatically, without a person.",
  "Access Token": "A temporary code that proves you have permission to access something. Think of it as a digital badge.",
  "Token": "A temporary code that proves you have permission to access something. Think of it as a digital badge.",
  "Client ID": "The 'username' of your application. Identifies which app is making the connection.",
  "Client Secret": "The 'password' of your application. Never share it — it's like your bank password.",
  "OAuth": "A secure login method that lets you connect apps without sharing your real password. E.g., 'Sign in with Google'.",
  "OAuth 2.0": "A secure login method that lets you connect apps without sharing your real password. E.g., 'Sign in with Google'.",
  "Webhook": "An automatic notification that one system sends to another when something happens. E.g., receiving a notification when a message arrives.",
  "Phone Number ID": "The unique identifier of your WhatsApp number within the Meta platform. It's not the number itself.",
  "Ad Account ID": "The code that identifies your Facebook/Instagram ad account. Starts with 'act_'.",
  "AES-256-GCM": "A military-grade encryption standard — your data is protected like national security information.",
  "Encryption": "The process of scrambling data so only those with the 'key' can read it. Protects your information.",
  "DNS": "Domain Name System — translates addresses like 'google.com' into numbers that computers understand.",
  "Redirect URL": "The address where the user is sent after logging in. It's like saying 'after entering, come back here'.",
  "Scopes": "Specific permissions you give the app. E.g., 'can read my profile' or 'can post on my behalf'.",
  "SMTP": "Protocol for sending emails — the digital 'mailman' that delivers your messages.",
  "SendGrid": "A popular service for sending bulk emails reliably without landing in spam.",
  "Graph API Explorer": "Facebook's tool for testing API connections. It's like a 'playground' for developers.",
  "Business Manager": "Facebook/Meta's central panel for managing pages, ads, and apps for your company.",
  "Marketing API": "The interface that allows you to create and manage Facebook/Instagram ads automatically.",
  "Company Page": "Your company's official LinkedIn page.",
  "ROAS": "Return On Ad Spend — how much you earn for every $1 invested in ads.",
};

/** Inline tooltip that explains a technical term */
export const TermTooltip = ({ term, children }: { term: string; children?: React.ReactNode }) => {
  const explanation = GLOSSARY[term];
  if (!explanation) return <span className="font-medium">{children || term}</span>;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 border-b border-dashed border-primary/40 cursor-help text-primary/90 font-medium">
            {children || term}
            <HelpCircle className="h-3 w-3 text-primary/50" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-sm">
          <p className="font-semibold mb-1">{term}</p>
          <p className="text-muted-foreground">{explanation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/** Tutorial/documentation link banner */
export const TutorialBanner = ({
  videoUrl,
  docsUrl,
  label,
}: {
  videoUrl?: string;
  docsUrl?: string;
  label: string;
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/10 border border-border/20">
      <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-primary gap-1">
        <BookOpen className="h-3 w-3" /> Help
      </Badge>
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex gap-2 ml-auto">
        {videoUrl && (
          <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <PlayCircle className="h-3.5 w-3.5" /> Video tutorial
          </a>
        )}
        {docsUrl && (
          <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <BookOpen className="h-3.5 w-3.5" /> Documentation
          </a>
        )}
      </div>
    </div>
  );
};

export default GLOSSARY;
