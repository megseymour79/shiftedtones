import { NBBadge, NBButton, NBPanel } from "@/components/nb";
import { PublicLayout } from "@/components/PublicLayout";
import { PagePager } from "@/components/PagePager";
import {
  ARCHETYPES,
  TONE_CHECK,
  scoreToneCheck,
  type ToneArchetype,
} from "@/lib/tone-check";
import { Mic, RefreshCcw, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router";

export default function ToneCheck() {
  const [tq, setTq] = useState(0);
  const [answers, setAnswers] = useState<ToneArchetype[]>([]);
  const toneDone = answers.length === TONE_CHECK.length;
  const archetype = toneDone ? ARCHETYPES[scoreToneCheck(answers)] : null;

  const answerTone = (a: ToneArchetype) => {
    setAnswers((prev) => [...prev, a]);
    setTq((n) => n + 1);
  };
  const restartTone = () => {
    setTq(0);
    setAnswers([]);
  };

  return (
    <PublicLayout>
      <section className="nb-grid-dots border-b-2 border-ink">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:py-16">
          <NBBadge className="bg-coral text-ink">A quick tone check</NBBadge>
          <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            When things get tense,{" "}
            <span className="italic text-coral">what do you tend to do?</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Answer three quick questions to get a sense of your usual response
            and find a drill to try. No mic or account needed.
          </p>
        </div>
      </section>

      <section className="nb-grid border-b-2 border-ink bg-secondary">
        <div className="mx-auto max-w-2xl px-4 py-14">
          <NBPanel className="nb-shadow-duo overflow-hidden">
            <div className="flex items-center justify-between border-b-2 border-ink bg-paper px-5 py-3">
              <span className="font-display text-sm">
                {toneDone ? "Your usual response" : `Question ${tq + 1} of ${TONE_CHECK.length}`}
              </span>
              <span className="flex gap-1.5">
                {TONE_CHECK.map((_, i) => (
                  <span
                    key={i}
                    className={`size-2 ${i < answers.length || toneDone ? "bg-coral" : i === tq ? "bg-sun" : "bg-ink/15"}`}
                  />
                ))}
              </span>
            </div>

            {!toneDone && (
              <div className="p-6">
                <p className="font-display text-xl leading-snug">
                  {TONE_CHECK[tq].prompt}
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  {TONE_CHECK[tq].options.map((opt) => (
                    <button
                      key={opt.text}
                      type="button"
                      onClick={() => answerTone(opt.archetype)}
                      className="nb nb-press bg-card p-4 text-left text-sm font-medium transition-transform duration-200 hover:-translate-y-0.5 hover:bg-paper"
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {archetype && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="p-6"
              >
                <div className={`nb inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${archetype.color}`}>
                  {archetype.name}
                </div>
                <p className="mt-4 text-lg leading-relaxed">{archetype.read}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {archetype.pairing}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/auth">
                    <NBButton variant="coral" className="text-sm">
                      <Mic className="size-4" /> Try this drill
                    </NBButton>
                  </Link>
                  <NBButton variant="paper" onClick={restartTone} className="text-sm">
                    <RefreshCcw className="size-4" /> Start over
                  </NBButton>
                </div>
              </motion.div>
            )}
          </NBPanel>

          <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Timer className="size-4" /> Takes about a minute
          </p>
        </div>
      </section>
      <PagePager />
    </PublicLayout>
  );
}
