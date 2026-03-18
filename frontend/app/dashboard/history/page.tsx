'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { useState, useMemo } from 'react';

export default function HistoryPage() {
  const { tasks } = useAppStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'fail' | 'pending'>('all');

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = (task.title ?? task.name ?? '').toLowerCase().includes(search.toLowerCase()) || 
                           task.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, search, statusFilter]);

  return (
    <div className="h-full p-6 flex flex-col gap-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Task History</h1>
          <p className="text-muted-foreground text-sm">Review past executions and evolutions.</p>
        </div>
      </div>

      <Card className="flex-1 border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl flex flex-col overflow-hidden">
        <CardHeader className="py-4 px-5 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Execution Log ({filteredTasks.length})
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search tasks..." 
                className="pl-9 h-8 bg-black/50 border-white/10 w-full sm:w-64 text-xs" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="h-8 bg-black/50 border-white/10 rounded-md px-2 text-xs text-muted-foreground outline-none border"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="fail">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-y-auto">
          <table className="w-full text-sm text-left text-muted-foreground">
            <thead className="text-xs uppercase bg-white/5 text-foreground sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium tracking-wider">Task ID</th>
                <th scope="col" className="px-6 py-3 font-medium tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 font-medium tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 font-medium tracking-wider">Version</th>
                <th scope="col" className="px-6 py-3 font-medium tracking-wider">Duration</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-[10px]">{task.id}</td>
                  <td className="px-6 py-4 font-medium text-foreground">{task.title ?? task.name ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                      task.status === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                      task.status === 'fail' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                      'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    }`}>
                      {task.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-[10px] text-primary">{task.version}</td>
                  <td className="px-6 py-4 font-mono text-[10px]">{task.time}</td>
                </tr>
              ))}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center italic text-muted-foreground/50">No results found for your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
