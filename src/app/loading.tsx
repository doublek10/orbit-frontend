import { OrbitMark } from "@/components/shared/OrbitMark";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <OrbitMark className="h-8 w-8 animate-pulse" />
    </main>
  );
}
