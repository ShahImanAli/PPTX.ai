import { createFileRoute } from '@tanstack/react-router'
import ThemeToggle from '@/components/ThemeToggle'
export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className='w-full h-screen flex justify-center items-center'>
      <ThemeToggle/>

    </div>
  )
}

