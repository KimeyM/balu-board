import Board from '@/components/Board'
import TopNav from '@/components/TopNav'
import MobileView from '@/components/MobileView'

export default function Home() {
  return (
    <>
      {/* Desktop — canvas completo con drag & resize */}
      <div className="hidden lg:block h-screen w-screen relative overflow-hidden bg-[#090909]">
        <TopNav />
        <Board />
      </div>

      {/* Mobile / tablet — lista read-only ordenada por posición del canvas */}
      <div className="lg:hidden">
        <MobileView />
      </div>
    </>
  )
}
