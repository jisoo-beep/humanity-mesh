'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import {
  Users, Key, Calendar, Search,
  PieChart as PieIcon, BarChart3 as BarIcon,
  ShieldCheck
} from 'lucide-react'

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts'

interface UserAccessKey {
  key: string
  age: number
  gender: string
  createdAt: string
}

export default function AdminUsers() {
  const { t, lang } = useI18n()
  const [users, setUsers] = useState<UserAccessKey[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'other'>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
    fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setUsers(json.data)
        setLoading(false)
      })
  }, [])

  const filteredUsers = users
    .filter((u) => {
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        !term ||
        u.age.toString().includes(term) ||
        u.gender.toLowerCase().includes(term) ||
        new Date(u.createdAt).toLocaleDateString().includes(term)
      const matchesGender = genderFilter === 'all' || u.gender === genderFilter
      return matchesSearch && matchesGender
    })
    .sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return sortOrder === 'newest' ? diff : -diff
    })

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const pagedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Chart Data Computation
  const ageGroups = ['10s', '20s', '30s', '40s+']
  const ageData = ageGroups.map(group => {
    let count = 0
    if (group === '10s') count = users.filter(u => u.age >= 10 && u.age < 20).length
    else if (group === '20s') count = users.filter(u => u.age >= 20 && u.age < 30).length
    else if (group === '30s') count = users.filter(u => u.age >= 30 && u.age < 40).length
    else count = users.filter(u => u.age >= 40).length
    return { name: group, value: count }
  })

  const genderData = [
    { name: t.adminUsers.gender.male, value: users.filter(u => u.gender === 'male').length, color: '#6366f1' },
    { name: t.adminUsers.gender.female, value: users.filter(u => u.gender === 'female').length, color: '#f43f5e' },
    { name: t.adminUsers.gender.other, value: users.filter(u => u.gender === 'other').length, color: '#94a3b8' },
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">{t.adminUsers.loading}</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <Users size={20} />
            <span className="text-xs font-bold tracking-widest uppercase">{t.adminShell.users}</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t.adminUsers.title}</h1>
          <p className="text-slate-500 mt-2 max-w-2xl leading-relaxed">{t.adminUsers.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={lang === 'ko' ? '나이/성별/날짜 검색...' : 'Search age/gender/date...'}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 shadow-sm"
            />
          </div>
          <select
            value={genderFilter}
            onChange={(e) => { setGenderFilter(e.target.value as any); setPage(1) }}
            className="py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="all">{lang === 'ko' ? '전체' : 'All'}</option>
            <option value="male">{t.adminUsers.gender.male}</option>
            <option value="female">{t.adminUsers.gender.female}</option>
            <option value="other">{t.adminUsers.gender.other}</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => { setSortOrder(e.target.value as any); setPage(1) }}
            className="py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="newest">{lang === 'ko' ? '최신순' : 'Newest'}</option>
            <option value="oldest">{lang === 'ko' ? '오래된순' : 'Oldest'}</option>
          </select>
        </div>
      </div>

      <div className="mb-8 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center gap-3 text-[11px] text-indigo-600 font-bold uppercase tracking-tight">
        <ShieldCheck size={16} />
        {t.adminUsers.maskNotice}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <BarIcon size={20} />
            </div>
            <h3 className="font-bold text-slate-800 tracking-tight">{t.adminUsers.ageDist}</h3>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PieIcon size={20} />
            </div>
            <h3 className="font-bold text-slate-800 tracking-tight">{t.adminUsers.genderDist}</h3>
          </div>
          <div className="h-[240px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={genderData} 
                  innerRadius={60} 
                  outerRadius={90} 
                  paddingAngle={8} 
                  dataKey="value"
                  animationBegin={200}
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.adminUsers.thKey}</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.adminUsers.thAge}</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.adminUsers.thGender}</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.adminUsers.thDate}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pagedUsers.length > 0 ? (
                pagedUsers.map((user) => {
                  return (
                    <tr key={user.createdAt} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            <Key size={14} />
                          </div>
                          <span className="font-mono font-bold text-slate-400 tracking-wider">ST-••••••</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-600">{user.age}</span>
                          <span className="text-[10px] text-slate-400">{lang === 'ko' ? '세' : 'yrs'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          user.gender === 'male' ? 'bg-blue-50 text-blue-600' :
                          user.gender === 'female' ? 'bg-rose-50 text-rose-600' :
                          'bg-slate-50 text-slate-600'
                        }`}>
                          {(t.adminUsers.gender as any)[user.gender] || user.gender}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar size={14} className="opacity-60" />
                          <span className="text-xs">{new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-slate-400 text-sm italic">
                    {t.adminUsers.noUsers}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-xs text-slate-400 font-medium px-4">
        <p>{lang === 'ko' ? `총 ${filteredUsers.length}명 · ${page}/${totalPages} 페이지` : `${filteredUsers.length} users · Page ${page}/${totalPages}`}</p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {lang === 'ko' ? '이전' : 'Prev'}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === 'ellipsis' ? (
                  <span key={`e${i}`} className="px-2 text-slate-300">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`px-3 py-1.5 rounded-lg border transition-colors ${
                      page === p
                        ? 'bg-indigo-600 border-indigo-600 text-white font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {lang === 'ko' ? '다음' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
