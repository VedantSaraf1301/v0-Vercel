import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";

export default function Home() {
  return(
    <div className="flex flex-col h-screen items-center justify-center">
      <Button>Button</Button>
      <UserButton/>
    </div>
  )
}
