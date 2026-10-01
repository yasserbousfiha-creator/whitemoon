import HomePage from "@/components/HomePage";

// The logo and opening lines play as usual, then the visitor picks a branch (every visit).
export default function Home() {
  return <HomePage branch={null} picker />;
}
