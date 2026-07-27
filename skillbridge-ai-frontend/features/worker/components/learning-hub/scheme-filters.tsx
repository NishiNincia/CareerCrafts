"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const EDUCATION_OPTIONS = ["All", "Graduate", "12th Pass", "Diploma"];
const STATE_OPTIONS = ["All", "Delhi", "Karnataka", "Maharashtra", "Tamil Nadu"];
const CATEGORY_OPTIONS = ["All", "Financial Support", "Skilling", "Insurance"];

export function SchemeFilters() {
  const [education, setEducation] = useState("All");
  const [state, setState] = useState("All");
  const [category, setCategory] = useState("All");

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Education</p>
            <div className="flex flex-wrap gap-2">
              {EDUCATION_OPTIONS.map((option) => (
                <Button key={option} size="sm" variant={education === option ? "default" : "outline"} onClick={() => setEducation(option)}>
                  {option}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">State</p>
            <div className="flex flex-wrap gap-2">
              {STATE_OPTIONS.map((option) => (
                <Button key={option} size="sm" variant={state === option ? "default" : "outline"} onClick={() => setState(option)}>
                  {option}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((option) => (
                <Button key={option} size="sm" variant={category === option ? "default" : "outline"} onClick={() => setCategory(option)}>
                  {option}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
