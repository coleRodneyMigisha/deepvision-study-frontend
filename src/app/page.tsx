import { HomeView } from "@/components/home/HomeView";
import { getOutlines } from "@/lib/content/server";

export default function HomePage() {
  return <HomeView courses={getOutlines()} />;
}
