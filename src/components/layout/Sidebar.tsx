import { NavLink } from 'react-router-dom'
import { Shield, LayoutDashboard, ClipboardList, ScanSearch, TrendingUp, ShieldCheck, Network, Gauge, BookOpen } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: '风险总览' },
  { to: '/register', icon: ClipboardList, label: '风险登记册' },
  { to: '/assess', icon: ScanSearch, label: '识别评估' },
  { to: '/conduction', icon: Network, label: '关联分析' },
  { to: '/trends', icon: TrendingUp, label: '趋势分析' },
  { to: '/response', icon: ShieldCheck, label: '响应预案' },
  { to: '/thresholds', icon: Gauge, label: '阈值设定' },
  { to: '/lessons', icon: BookOpen, label: '历史复盘借鉴' },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] flex flex-col z-[60]" style={{ backgroundColor: '#0B1426' }}>
      <div className="flex items-center gap-3 px-6 h-16 shrink-0">
        <Shield size={28} className="text-amber-500" strokeWidth={2} />
        <span className="font-display text-xl font-bold tracking-wide" style={{ color: '#E8EDF5' }}>
          风险管控
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'border-l-[3px] border-amber-500 text-amber-500 bg-amber-500/10'
                  : 'border-l-[3px] border-transparent hover:bg-white/5'
              }`
            }
            style={({ isActive }) => ({
              color: isActive ? '#F59E0B' : '#8899B4',
            })}
          >
            <item.icon size={20} strokeWidth={1.8} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-5 shrink-0">
        <div className="h-[3px] rounded-full bg-gradient-to-r from-amber-500/60 via-amber-500 to-amber-500/60 mb-3" />
        <span className="text-xs font-medium tracking-widest" style={{ color: '#5A6F8E' }}>
          主动防控
        </span>
      </div>
    </aside>
  )
}
