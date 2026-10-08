import AllocatorCalculator from "./allocator/calculator"
import "./dashboard/dashboard.css"

export default function Home() {
  return <main className="dashboard-shell"><AllocatorCalculator embedded /></main>
}
