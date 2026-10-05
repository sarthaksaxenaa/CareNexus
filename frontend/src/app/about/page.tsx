import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          About CareNexus
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-400">
          CareNexus is an AI-powered medical chatbot designed to provide
          primary healthcare triage. It uses Retrieval-Augmented Generation
          (RAG) over trusted medical databases to deliver evidence-based
          health guidance.
        </p>

        <div className="space-y-6">
          <Section title="What CareNexus Does">
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>Pre-screens symptoms with AI-powered severity assessment</li>
              <li>Provides evidence-based health information with source citations</li>
              <li>Detects emergency symptoms and escalates appropriately</li>
              <li>Supports multiple languages for accessible healthcare</li>
              <li>Tracks health patterns over time</li>
            </ul>
          </Section>

          <Section title="What CareNexus Does NOT Do">
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>Does NOT replace professional medical advice</li>
              <li>Does NOT diagnose diseases or prescribe medication</li>
              <li>Does NOT store data without explicit consent</li>
            </ul>
          </Section>

          <Section title="Technology">
            <p className="text-gray-600 dark:text-gray-400">
              Built with Next.js, FastAPI, LangChain, ChromaDB, and powered by
              state-of-the-art large language models with RAG for medical
              accuracy.
            </p>
          </Section>
        </div>

        <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-400">
            CareNexus is a capstone project built to demonstrate the
            potential of AI in primary healthcare. © 2026
          </p>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}
