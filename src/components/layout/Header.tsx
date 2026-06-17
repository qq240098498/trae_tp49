import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { useRiskStore } from '@/stores/riskStore'

const routeNameMap: Record<string, string> = {
  '/dashboard': '风险总览',
  '/register': '风险登记册',
  '/assess': '识别评估',
  '/trends': '趋势分析',
  '/response': '响应预案',
}

const alertIconMap = {
  critical: { icon: AlertTriangle, color: '#EF4444' },
  warning: { icon: AlertCircle, color: '#F59E0B' },
  info: { icon: Info, color: '#3B82F6' },
}

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const { alerts, markAlertRead, markAllAlertsRead } = useRiskStore()

  const unreadCount = alerts.filter((a) => !a.read).length
  const pageName = routeNameMap[location.pathname] || '风险总览'

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header
      className="h-14 flex items-center justify-between px-6 shrink-0"
      style={{ backgroundColor: '#111D35', borderBottom: '1px solid #1E3A5F' }}
    >
      <div className="text-sm font-medium" style={{ color: '#8899B4' }}>
        <span style={{ color: '#5A6F8E' }}>项目风险管控</span>
        <span className="mx-2" style={{ color: '#5A6F8E' }}>/</span>
        <span style={{ color: '#E8EDF5' }}>{pageName}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="relative p-2 rounded-md transition-colors hover:bg-white/5"
          >
            <Bell size={20} style={{ color: '#8899B4' }} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
                style={{ backgroundColor: '#EF4444' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-lg shadow-xl overflow-hidden z-50"
              style={{ backgroundColor: '#162240', border: '1px solid #1E3A5F' }}
            >
              <div className="px-4 py-3 text-sm font-semibold" style={{ color: '#E8EDF5', borderBottom: '1px solid #1E3A5F' }}>
                通知提醒
              </div>

              <div className="max-h-72 overflow-y-auto">
                {alerts.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm" style={{ color: '#5A6F8E' }}>
                    暂无通知
                  </div>
                )}
                {alerts.map((alert) => {
                  const { icon: AlertIcon, color } = alertIconMap[alert.type]
                  return (
                    <div
                      key={alert.id}
                      onClick={() => markAlertRead(alert.id)}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 ${
                        !alert.read ? 'border-l-[3px]' : 'border-l-[3px] border-transparent'
                      }`}
                      style={{
                        borderBottom: '1px solid rgba(30, 58, 95, 0.5)',
                        borderLeftColor: !alert.read ? color : 'transparent',
                      }}
                    >
                      <AlertIcon size={18} className="mt-0.5 shrink-0" style={{ color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: '#E8EDF5' }}>
                          {alert.title}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: '#5A6F8E' }}>
                          {alert.timestamp}
                        </div>
                      </div>
                      {!alert.read && (
                        <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: color }} />
                      )}
                    </div>
                  )
                })}
              </div>

              {alerts.length > 0 && (
                <div style={{ borderTop: '1px solid #1E3A5F' }}>
                  <button
                    onClick={() => markAllAlertsRead()}
                    className="w-full px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
                    style={{ color: '#F59E0B' }}
                  >
                    全部已读
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
          style={{ backgroundColor: '#1B3A5C', color: '#F59E0B' }}
        >
          管
        </div>
      </div>
    </header>
  )
}
