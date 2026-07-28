import { motion } from "motion/react";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MolecularField } from "@/components/site/molecular-field";

const STEPS = [
  "Searching databases",
  "Checking interaction",
  "Analyzing adverse effects",
  "Mapping affected organs",
  "Generating explanation",
];

export function PipelineLoader() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 520);
    return () => clearInterval(id);
  }, []);

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <MolecularField density={30} />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-3xl glass-strong p-7"
      >
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.2em] text-primary">
          Analysis pipeline
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold">Building your safety report</h2>

        <ul className="mt-6 space-y-1">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s}>
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: i <= step ? 1 : 0.35, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                    active && "bg-primary/10",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors",
                      done
                        ? "border-primary/50 bg-primary/20 text-primary"
                        : active
                          ? "border-primary/60 text-primary"
                          : "border-border text-muted-foreground",
                    )}
                  >
                    {done ? (
                      <Check className="h-3 w-3" />
                    ) : active ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      i <= step ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {s}
                  </span>
                </motion.div>
                {i < STEPS.length - 1 && (
                  <div className="ml-[1.6rem] h-3 w-px bg-gradient-to-b from-primary/40 to-transparent" />
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5 }}
          />
        </div>
      </motion.div>
    </div>
  );
}
