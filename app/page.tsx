import { Navbar } from "@/components/navbar";
import { StoryGenerator } from "@/components/story-generator";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <StoryGenerator />
      </main>
    </div>
  );
}
