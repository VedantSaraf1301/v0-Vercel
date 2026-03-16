import { Button } from "@/components/ui/button";
import HomePage from "@/experiment/homePage.jsx";
export default function Home() {
  return(
    <div className="flex bg-slate-100 h-screen items-center justify-center">
      <Button>Button</Button>
      <HomePage/>
    </div>
  )
}
