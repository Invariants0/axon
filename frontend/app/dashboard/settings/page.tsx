"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Settings,
  Shield,
  Bell,
  Key,
  Database,
  Globe,
  UploadCloud,
  FolderDown,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/app-store";
import { systemService } from "@/lib/services/system.service";

const NAV_ITEMS = [
  { name: "General",          icon: Settings,   id: "general" },
  { name: "Import Project",   icon: UploadCloud, id: "import" },
  { name: "Security & Access",icon: Shield,      id: "security" },
  { name: "Notifications",    icon: Bell,        id: "notifications" },
  { name: "API Keys",         icon: Key,         id: "apikeys" },
  { name: "Data Management",  icon: Database,    id: "data" },
  { name: "Network",          icon: Globe,       id: "network" },
];

// ─── API Key Section ──────────────────────────────────────────
function ApiKeySection() {
  const { apiKey, setApiKey, addNotification } = useAppStore();
  const [draft, setDraft] = useState(apiKey);
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);

  const masked = apiKey
    ? `${"•".repeat(Math.max(0, apiKey.length - 4))}${apiKey.slice(-4)}`
    : "Not set";

  const save = useCallback(() => {
    setApiKey(draft.trim());
    addNotification("API key saved", "success");
    setTestResult(null);
  }, [draft, setApiKey, addNotification]);

  const testConnection = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await systemService.health();
      setTestResult("ok");
      addNotification("Connection successful ✓", "success");
    } catch {
      setTestResult("fail");
      addNotification("Connection failed — check your key", "error");
    } finally {
      setTesting(false);
    }
  }, [addNotification]);

  const copyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    addNotification("API key copied", "info");
  };

  const clear = () => {
    setApiKey("");
    setDraft("");
    setTestResult(null);
    addNotification("API key cleared", "info");
  };

  return (
    <Card className="border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl">
      <CardHeader className="border-b border-white/[0.06] bg-white/[0.02]">
        <CardTitle className="text-lg flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          API Key Management
        </CardTitle>
        <CardDescription>
          Your AXON API key is required to authenticate all backend requests.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        {/* Current key status */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/30 font-semibold mb-1">
              Active Key
            </p>
            <p className="font-mono text-sm text-white/70">{masked}</p>
          </div>
          <div className="flex items-center gap-2">
            {apiKey && (
              <Button
                size="icon"
                variant="ghost"
                onClick={copyKey}
                className="text-white/30 hover:text-white/70 w-8 h-8"
                title="Copy key"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            )}
            {testResult === "ok" && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            {testResult === "fail" && (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
          </div>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <Label htmlFor="api-key-input">New Key</Label>
          <div className="relative">
            <Input
              id="api-key-input"
              type={show ? "text" : "password"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="axon-xxxxxxxxxxxxxxxxxxxxxxxx"
              className="bg-black/50 border-white/[0.08] font-mono pr-10 focus-visible:ring-primary/40"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={save}
            disabled={!draft.trim() || draft === apiKey}
            className="bg-white hover:bg-white/90 text-black font-semibold gap-2"
          >
            Save Key
          </Button>
          <Button
            onClick={testConnection}
            disabled={!apiKey || testing}
            variant="outline"
            className="border-white/[0.08] text-white/60 hover:text-white/90 hover:bg-white/[0.04] gap-2"
          >
            {testing ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing…</>
            ) : (
              "Test Connection"
            )}
          </Button>
          {apiKey && (
            <Button
              onClick={clear}
              variant="ghost"
              className="text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.04]"
            >
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Settings Page ───────────────────────────────────────
export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");

  return (
    <div className="h-full p-6 flex flex-col gap-6 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold">
            System Configuration
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage AXON core settings and integrations.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground hidden sm:block">
          Save Changes
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-full pb-10">
          {/* Left: Navigation */}
          <div className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeSection === item.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </button>
            ))}
          </div>

          {/* Right: Content */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* API Keys Section */}
            {activeSection === "apikeys" && <ApiKeySection />}

            {/* General Settings */}
            {activeSection === "general" && (
              <Card className="border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl">
                <CardHeader className="border-b border-white/[0.06] bg-white/[0.02]">
                  <CardTitle className="text-lg">General Settings</CardTitle>
                  <CardDescription>
                    Configure basic system parameters.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="system-name">System Name</Label>
                    <Input
                      id="system-name"
                      defaultValue="AXON Core"
                      className="bg-black/50 border-white/[0.08]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="environment">Environment</Label>
                    <Input
                      id="environment"
                      defaultValue="Production"
                      disabled
                      className="bg-black/50 border-white/[0.08] opacity-50 cursor-not-allowed"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                    <div className="space-y-0.5">
                      <Label className="text-base">Auto-Evolution</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow the system to autonomously generate and deploy new skills.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                    <div className="space-y-0.5">
                      <Label className="text-base">Debug Logging</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable verbose output in the Live Telemetry stream.
                      </p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Import Project */}
            {activeSection === "import" && (
              <Card className="border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="border-b border-white/[0.06] bg-white/[0.02]">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-primary" />
                    Import Project
                  </CardTitle>
                  <CardDescription>
                    Upload an existing codebase to transform into a self-evolving system.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="border-2 border-dashed border-white/[0.08] hover:border-white/20 rounded-xl p-10 flex flex-col items-center justify-center gap-4 bg-white/[0.02] backdrop-blur-sm transition-all text-center cursor-pointer hover:bg-white/[0.04]">
                    <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center border border-white/[0.08] shadow-[0_4px_30px_rgba(255,255,255,0.04)]">
                      <FolderDown className="w-8 h-8 text-white/50" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white/80 text-lg">Drag & Drop Project Files</h3>
                      <p className="text-sm text-white/40 mt-1">or click to browse your local repository</p>
                    </div>
                    <div className="flex gap-3 mt-2">
                      <Button variant="outline" className="bg-white hover:bg-gray-100 text-black border-transparent">
                        Browse Files
                      </Button>
                      <Button variant="outline" className="bg-white/[0.06] hover:bg-white/10 text-white border-white/[0.1]">
                        Import from GitHub
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Other Sections — placeholder */}
            {!["general", "import", "apikeys"].includes(activeSection) && (
              <Card className="border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl">
                <CardContent className="p-12 text-center">
                  <Settings className="w-8 h-8 text-white/15 mx-auto mb-3" />
                  <p className="text-sm text-white/30">
                    {NAV_ITEMS.find((i) => i.id === activeSection)?.name} settings coming soon.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Danger Zone - always visible */}
            <Card className="border-destructive/20 bg-destructive/5 backdrop-blur-xl">
              <CardHeader className="border-b border-destructive/10 bg-destructive/10">
                <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
                <CardDescription className="text-destructive/70">
                  Irreversible system actions.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Purge Evolution History</h4>
                    <p className="text-sm text-muted-foreground">Delete all past tasks, generated skills, and logs.</p>
                  </div>
                  <Button
                    variant="destructive"
                    className="bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/30"
                  >
                    Purge Data
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Factory Reset</h4>
                    <p className="text-sm text-muted-foreground">Revert AXON to its initial v0 state.</p>
                  </div>
                  <Button
                    variant="destructive"
                    className="bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/30"
                  >
                    Reset System
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
