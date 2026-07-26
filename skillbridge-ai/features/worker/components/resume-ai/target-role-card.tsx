"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface TargetRoleCardProps {
  roles: Array<{ label: string; description: string }>;
  gapAnalysis: Array<{ label: string; value: number }>;
}

export function TargetRoleCard({ roles, gapAnalysis }: TargetRoleCardProps) {
  const [selectedRole, setSelectedRole] = useState(roles[0]?.label ?? "Frontend Developer");

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Target Role Selector</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <Button key={role.label} variant={selectedRole === role.label ? "default" : "outline"} size="sm" onClick={() => setSelectedRole(role.label)}>
                {role.label}
              </Button>
            ))}
          </div>
          <div className="rounded-xl bg-secondary/70 p-4 text-sm text-muted-foreground">
            {roles.find((role) => role.label === selectedRole)?.description}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-signal-500" /> Skill Gap Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {gapAnalysis.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>{item.label}</span>
                <span>{item.value}%</span>
              </div>
              <Progress value={item.value} />
            </div>
          ))}
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="signal">Strong fit</Badge>
            <Badge variant="outline">Needs focus</Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
