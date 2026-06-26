"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

import { TabSelector } from "./ui/TabSelector";
import { Button } from "@/components/ui/Button";
import ThreeColumns from "./ThreeColumns";
import Section from "./layout/Section";
import type { ThreeColumnsItem } from "./ThreeColumns";

const TABS = [
  { id: "how", labelKey: "tabHowLabel" },
  { id: "benefits", labelKey: "tabBenefitsLabel" },
] as const;

export interface HomeInfoContent {
  benefitsSteps: ThreeColumnsItem[];
  ctaScrollTarget: string;
  ctaText: string;
  eyebrow: string;
  howItWorksSteps: ThreeColumnsItem[];
  sectionAriaLabel: string;
  tabBenefitsLabel: string;
  tabHowLabel: string;
  title: string;
}

interface HomeInfoProps {
  content: HomeInfoContent;
}

export default function HomeInfo({ content }: HomeInfoProps) {
  const {
    benefitsSteps,
    ctaScrollTarget,
    ctaText,
    eyebrow,
    howItWorksSteps,
    title,
  } = content;
  const [activeTab, setActiveTab] = useState<string>(TABS[0].id);

  return (
    <Section eyebrow={eyebrow} title={title}>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <TabSelector
          activeTab={activeTab}
          layoutId="activeTabHomeInfo"
          onTabChange={setActiveTab}
          tabs={TABS.map(({ id, labelKey }) => ({
            id,
            label: content[labelKey],
          }))}
        />
      </motion.div>

      <AnimatePresence mode="wait">
        <div key={activeTab}>
          {activeTab === "how" && <ThreeColumns items={howItWorksSteps} />}
          {activeTab === "benefits" && <ThreeColumns items={benefitsSteps} />}
        </div>
      </AnimatePresence>
      <motion.div
        className="mt-12 flex justify-center"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <Button asChild size="lg" variant="feature">
          <Link href={ctaScrollTarget} scroll={true}>
            {ctaText}
          </Link>
        </Button>
      </motion.div>
    </Section>
  );
}
