import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="text-center space-y-8 px-4">
        {/* Logo & Title */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 shadow-lg">
            <span className="text-4xl">🏥</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            Care<span className="text-blue-600 dark:text-blue-400">Nexus</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Your AI-powered health companion for primary healthcare triage
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/chat"
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            Start Health Check →
          </Link>
          <Link
            href="/about"
            className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
          >
            Learn More
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 max-w-3xl mx-auto">
          <FeatureCard
            emoji="🔍"
            title="Symptom Triage"
            description="AI-powered severity assessment with actionable guidance"
          />
          <FeatureCard
            emoji="🌐"
            title="Multilingual"
            description="Get help in English, Hindi, and regional languages"
          />
          <FeatureCard
            emoji="🛡️"
            title="Evidence-Based"
            description="Responses grounded in WHO & NHS medical guidelines"
          />
        </div>

        {/* Disclaimer */}
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-12 max-w-lg mx-auto">
          ⚕️ CareNexus provides general health information only. It is not a
          substitute for professional medical advice, diagnosis, or treatment.
        </p>
      </div>
    </main>
  );
}

function FeatureCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <span className="text-3xl">{emoji}</span>
      <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}
