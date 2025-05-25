import { Button } from "@/lib/button";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-blue-700">
        Dak Lak Coffee Supply Chain
      </h1>
      <Button className="mt-4">Get Started</Button>
    </main>
  );
}
