import { Newsreader, Space_Grotesk } from "next/font/google";
import Image from "next/image";
import LoginAuthPanel from "./components/LoginAuthPanel";
import LoginHeader from "./components/LoginHeader";
import LoginIntro from "./components/LoginIntro";

const displayFont = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const uiFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

function sanitizeRedirect(next: string | undefined): string {
  if (!next || !next.startsWith("/")) {
    return "/portal";
  }

  return next;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedParams = await searchParams;
  const redirectTo = sanitizeRedirect(resolvedParams?.next);

  return (
    <main className={`${uiFont.className} min-h-screen bg-black text-[#e5e2e3]`}>
      <div className="relative mx-auto flex min-h-screen w-full flex-col overflow-hidden px-6 py-6 md:px-15">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-full md:w-3/4 overflow-hidden">
          <Image
            src="/login.gif"
            alt=""
            aria-hidden="true"
            fill  
            sizes="50vw"
            className="object-cover object-left"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-linear-to-r from-[#131314]/55 via-[#131314]/35 to-transparent" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(255,183,123,0.13),transparent_42%),radial-gradient(circle_at_82%_86%,rgba(177,109,46,0.1),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(229,226,227,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(229,226,227,0.22)_1px,transparent_1px)] bg-size-[62px_62px] opacity-[0.08]" />

        <LoginHeader />

        <section className="relative z-10 grid grow items-center gap-8 lg:grid-cols-[1fr_480px]">
          <LoginIntro displayFontClassName={displayFont.className} />
          <LoginAuthPanel redirectTo={redirectTo} />
        </section>
      </div>
    </main>
  );
}
