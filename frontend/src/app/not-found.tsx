import Link from "next/link";
import Navbar from "@/components/Navbar";
import { TRACKED } from "@/lib/styles";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-4rem)] items-center bg-void">
        <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
          <p className="font-display text-2xl italic text-ink-4">404</p>
          <h1 className="mt-2 font-display font-light leading-none text-lilac text-[clamp(3rem,8vw,6rem)]">
            This page does not exist
          </h1>
          <p className="mt-6 max-w-[48ch] font-light text-ink-3">
            The link may be mistyped or out of date.
          </p>
          <div className="mt-10 flex gap-6">
            <Link href="/" className={`${TRACKED} rounded-full border border-edge px-6 py-3 text-ink hover:border-lilac/60 transition-colors duration-200`}>
              Go home
            </Link>
            <Link href="/chat" className={`${TRACKED} px-2 py-3 text-ink-4 hover:text-ink transition-colors duration-200`}>
              Start a check
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
