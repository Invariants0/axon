"use client";

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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
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
          {/* Left Column: Navigation */}
          <div className="flex flex-col gap-2">
            {[
              { name: "General", icon: Settings, active: true },
              { name: "Import Project", icon: UploadCloud, active: false },
              { name: "Security & Access", icon: Shield, active: false },
              { name: "Notifications", icon: Bell, active: false },
              { name: "API Keys", icon: Key, active: false },
              { name: "Data Management", icon: Database, active: false },
              { name: "Network", icon: Globe, active: false },
            ].map((item) => (
              <button
                key={item.name}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </button>
            ))}
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
              <CardHeader className="border-b border-white/5 bg-white/5">
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
                    className="bg-black/50 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="environment">Environment</Label>
                  <Input
                    id="environment"
                    defaultValue="Production"
                    disabled
                    className="bg-black/50 border-white/10 opacity-50 cursor-not-allowed"
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-white/5">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto-Evolution</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow the system to autonomously generate and deploy new
                      skills.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-white/5">
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

            <Card className="border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="border-b border-white/5 bg-white/5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-primary" />
                  Import Project
                </CardTitle>
                <CardDescription>
                  Upload an existing codebase to transform into a self-evolving
                  system.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="border-2 border-dashed border-white/10 hover:border-white/20 rounded-xl p-10 flex flex-col items-center justify-center gap-4 bg-white/5 backdrop-blur-sm transition-all text-center cursor-pointer hover:bg-white/10">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center transition-transform duration-300 border border-white/10 shadow-[0_4px_30px_rgba(255,255,255,0.05)]">
                    <FolderDown className="w-8 h-8 text-white/70" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white/90 text-lg">
                      Drag & Drop Project Files
                    </h3>
                    <p className="text-sm text-white/50 mt-1">
                      or click to browse your local repository
                    </p>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="outline"
                      className="bg-white hover:bg-gray-200 text-black border-transparent shadow shadow-white/20 transition-all"
                    >
                      Browse Files
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md transition-all"
                    >
                      Import from GitHub
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/20 bg-destructive/5 backdrop-blur-xl">
              <CardHeader className="border-b border-destructive/10 bg-destructive/10">
                <CardTitle className="text-lg text-destructive">
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-destructive/70">
                  Irreversible system actions.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">
                      Purge Evolution History
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Delete all past tasks, generated skills, and logs.
                    </p>
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
                    <h4 className="font-medium text-foreground">
                      Factory Reset
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Revert AXON to its initial v0 state.
                    </p>
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
