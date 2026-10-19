import HomePage from "@/components/HomePage";

// Rebuilt at most every 5 minutes with the latest doctors (lib/doctors-server.ts), besides right after /admin edits.
export const revalidate = 300;

// The logo and opening lines play as usual, then the visitor picks a branch (every visit).
export default function Home() {
  return <HomePage branch={null} picker />;
}
